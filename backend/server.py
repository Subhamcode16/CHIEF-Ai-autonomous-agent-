from fastapi import FastAPI, APIRouter, HTTPException, Request, Response
from fastapi.responses import RedirectResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime, timezone, timedelta
from urllib.parse import urlencode
import requests as http_requests
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request as GoogleAuthRequest
from googleapiclient.discovery import build
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from pydantic import BaseModel, Field, field_validator
import re

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
mongo_client = AsyncIOMotorClient(mongo_url)
db = mongo_client[os.environ['DB_NAME']]

GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID')
GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET')
GOOGLE_REDIRECT_URI = os.environ.get('GOOGLE_REDIRECT_URI')
GOOGLE_SCOPES = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile"
]

app = FastAPI()
api_router = APIRouter(prefix="/api")
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return Response(status_code=204)




class TaskCreate(BaseModel):
    session_id: str
    title: str = Field(..., min_length=1, max_length=200, description="Task title")
    priority: str = "medium"

    @field_validator('title')
    def sanitize_title(cls, v):
        return v.strip()

    @field_validator('priority')
    def validate_priority(cls, v):
        if v not in ['low', 'medium', 'high', 'urgent']:
            raise ValueError('Priority must be low, medium, high, or urgent')
        return v


class PlanRequest(BaseModel):
    session_id: str
    date: Optional[str] = None
    
    @field_validator('date')
    def validate_date(cls, v):
        if v:
            try:
                datetime.strptime(v, "%Y-%m-%d")
            except ValueError:
                raise ValueError("Date must be in YYYY-MM-DD format")
        return v


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    priority: Optional[str] = None
    completed: Optional[bool] = None

    @field_validator('title')
    def sanitize_title(cls, v):
        return v.strip() if v else v

    @field_validator('priority')
    def validate_priority(cls, v):
        if v and v not in ['low', 'medium', 'high', 'urgent']:
            raise ValueError('Priority must be low, medium, high, or urgent')
        return v




class EventMove(BaseModel):
    session_id: str
    event_id: str
    new_start: str  # ISO format
    new_end: str    # ISO format



async def get_google_service(session_id: str):
    session = await db.sessions.find_one({"session_id": session_id})
    if not session or 'google_tokens' not in session:
        raise HTTPException(status_code=401, detail="Session not found or expired")

    tokens = session['google_tokens']
    creds = Credentials(
        token=tokens.get('access_token'),
        refresh_token=tokens.get('refresh_token'),
        token_uri='https://oauth2.googleapis.com/token',
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET
    )

    if creds.refresh_token:
        try:
            creds.refresh(GoogleAuthRequest())
            await db.sessions.update_one(
                {"session_id": session_id},
                {"$set": {"google_tokens.access_token": creds.token}}
            )
        except Exception as e:
            logger.warning(f"Token refresh: {e}")

    return build('calendar', 'v3', credentials=creds)


def get_day_range(date_str=None):
    if date_str:
        target = datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    else:
        target = datetime.now(timezone.utc)
    time_min = target.replace(hour=0, minute=0, second=0, microsecond=0)
    time_max = time_min + timedelta(days=1)
    return time_min.isoformat(), time_max.isoformat()


@api_router.get("/")
async def root():
    return {"message": "Chief API", "status": "running"}


@api_router.get("/auth/google/login")
@limiter.limit("5/minute")
async def google_login(request: Request):

    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": " ".join(GOOGLE_SCOPES),
        "access_type": "offline",
        "prompt": "consent",
    }
    return {"authorization_url": f"https://accounts.google.com/o/oauth2/auth?{urlencode(params)}"}


@api_router.get("/auth/google/callback")
async def google_callback(code: str = None, error: str = None):
    if error or not code:
        frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
        return RedirectResponse(f"{frontend_url}/?error={error or 'no_code'}")

    token_resp = http_requests.post('https://oauth2.googleapis.com/token', data={
        'code': code,
        'client_id': GOOGLE_CLIENT_ID,
        'client_secret': GOOGLE_CLIENT_SECRET,
        'redirect_uri': GOOGLE_REDIRECT_URI,
        'grant_type': 'authorization_code'
    }).json()

    if 'error' in token_resp:
        logger.error(f"Token error: {token_resp}")
        frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
        return RedirectResponse(f"{frontend_url}/?error=auth_failed")

    user_info = http_requests.get(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        headers={'Authorization': f'Bearer {token_resp["access_token"]}'}
    ).json()

    session_id = str(uuid.uuid4())
    await db.sessions.insert_one({
        "session_id": session_id,
        "email": user_info.get('email', ''),
        "name": user_info.get('name', ''),
        "picture": user_info.get('picture', ''),
        "google_tokens": token_resp,
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
    return RedirectResponse(f"{frontend_url}/dashboard?session_id={session_id}")


@api_router.get("/auth/session/{session_id}")
async def get_session(session_id: str):
    session = await db.sessions.find_one(
        {"session_id": session_id}, {"_id": 0, "google_tokens": 0}
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@api_router.get("/decisions")
async def get_decisions(session_id: str):
    """Get decision log."""
    try:
        decisions = await db.decisions.find({"session_id": session_id}).sort("timestamp", -1).to_list(length=100)
        for d in decisions:
            d["id"] = str(d["_id"])
            del d["_id"]
        return decisions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.delete("/decisions")
async def clear_decisions(session_id: str):
    """Clear all decisions for a session."""
    try:
        result = await db.decisions.delete_many({"session_id": session_id})
        logger.info(f"Cleared {result.deleted_count} decisions for session {session_id}")
        return {"success": True, "deleted_count": result.deleted_count}
    except Exception as e:
        logger.error(f"Clear decisions error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/preferences")
async def get_preferences(session_id: str):
    """Get user schedule preferences."""
    try:
        session = await db.sessions.find_one({"session_id": session_id})
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Default to 24/7 (no constraints) for new users
        prefs = session.get("preferences", {"day_start_hour": 0, "day_end_hour": 24})
        return prefs
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get preferences error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.put("/preferences")
async def update_preferences(session_id: str, day_start_hour: int, day_end_hour: int):
    """Update user schedule preferences."""
    try:
        # Validation
        if not (0 <= day_start_hour <= 23):
            raise HTTPException(status_code=400, detail="day_start_hour must be 0-23")
        if not (0 <= day_end_hour <= 24):
            raise HTTPException(status_code=400, detail="day_end_hour must be 0-24")
        if day_start_hour == day_end_hour:
            raise HTTPException(status_code=400, detail="Start and end times cannot be the same")
        
        prefs = {"day_start_hour": day_start_hour, "day_end_hour": day_end_hour}
        
        result = await db.sessions.update_one(
            {"session_id": session_id},
            {"$set": {"preferences": prefs}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Session not found")
        
        logger.info(f"Updated preferences for session {session_id}: {prefs}")
        return {"success": True, "preferences": prefs}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update preferences error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.delete("/auth/session/{session_id}")
async def delete_session(session_id: str):
    await db.sessions.delete_one({"session_id": session_id})
    await db.tasks.delete_many({"session_id": session_id})
    await db.decisions.delete_many({"session_id": session_id})
    return {"status": "disconnected"}


@api_router.get("/calendar/events")
async def get_calendar_events(session_id: str, date: str = None, end_date: str = None):
    try:
        service = await get_google_service(session_id)
        
        # If end_date provided, fetch range; otherwise single day
        if end_date:
            time_min = f"{date}T00:00:00Z" if date else datetime.now(timezone.utc).replace(hour=0, minute=0, second=0).isoformat()
            time_max = f"{end_date}T23:59:59Z"
        else:
            time_min, time_max = get_day_range(date)

        result = service.events().list(
            calendarId='primary',
            timeMin=time_min,
            timeMax=time_max,
            singleEvents=True,
            orderBy='startTime',
            maxResults=100  # Increased for weekly view
        ).execute()

        return [
            {
                "id": e.get('id'),
                "title": e.get('summary', 'No Title'),
                "start": e.get('start', {}).get('dateTime', e.get('start', {}).get('date', '')),
                "end": e.get('end', {}).get('dateTime', e.get('end', {}).get('date', '')),
                "description": e.get('description', ''),
                "location": e.get('location', ''),
                "is_all_day": 'date' in e.get('start', {}),
                "is_chief": 'Created by Chief' in e.get('description', '')
            }
            for e in result.get('items', [])
        ]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Calendar error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.delete("/calendar/events/{event_id}")
async def delete_event(event_id: str, session_id: str):
    """Delete a calendar event."""
    try:
        logger.info(f"Deleting event {event_id} for session {session_id}")
        service = await get_google_service(session_id)
        
        # Delete the event from Google Calendar
        service.events().delete(
            calendarId='primary',
            eventId=event_id
        ).execute()
        
        logger.info(f"Successfully deleted event {event_id}")
        return {"success": True, "message": "Event deleted"}
    except Exception as e:
        # If event is already deleted (410) or not found (404), treat as success
        error_str = str(e).lower()
        if "410" in error_str or "404" in error_str or "deleted" in error_str or "not found" in error_str:
            logger.info(f"Event {event_id} already deleted or not found, treating as success")
            return {"success": True, "message": "Event already deleted"}
        
        logger.error(f"Event deletion error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/calendar/events/move")
async def move_event(data: EventMove):
    try:
        service = await get_google_service(data.session_id)
        
        # 1. Fetch event to verify it exists
        try:
            event = service.events().get(calendarId='primary', eventId=data.event_id).execute()
        except:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # 2. Check for conflicts
        # Parse new times to datetimes for comparison
        new_start_dt = datetime.fromisoformat(data.new_start.replace('Z', '+00:00'))
        new_end_dt = datetime.fromisoformat(data.new_end.replace('Z', '+00:00'))
        
        # List other events for the same day
        time_min = new_start_dt.replace(hour=0, minute=0, second=0).isoformat()
        time_max = new_start_dt.replace(hour=23, minute=59, second=59).isoformat()
        
        day_events = service.events().list(
            calendarId='primary',
            timeMin=time_min,
            timeMax=time_max,
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        
        conflicts = []
        for e in day_events.get('items', []):
            if e['id'] == data.event_id:
                continue
                
            # Skip all-day events for conflict check
            if 'date' in e.get('start', {}):
                continue
                
            e_start = e.get('start', {}).get('dateTime')
            e_end = e.get('end', {}).get('dateTime')
            
            if not e_start or not e_end:
                continue
                
            e_start_dt = datetime.fromisoformat(e_start)
            e_end_dt = datetime.fromisoformat(e_end)
            
            # Overlap check logic
            if (new_start_dt < e_end_dt) and (new_end_dt > e_start_dt):
                conflicts.append({
                    "id": e['id'],
                    "title": e.get('summary', 'Unknown Event')
                })

        # 3. Update the event
        updated_event = service.events().patch(
            calendarId='primary',
            eventId=data.event_id,
            body={
                'start': {'dateTime': data.new_start},
                'end': {'dateTime': data.new_end}
            }
        ).execute()
        
        # 4. Log decision
        decision = {
            "id": str(uuid.uuid4()),
            "session_id": data.session_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "action_type": "move_event_manual",
            "event_title": updated_event.get('summary', ''),
            "description": f"Manually moved to {datetime.fromisoformat(data.new_start).strftime('%H:%M')}",
            "reason": "User manual drag-and-drop",
            "original_time": event.get('start', {}).get('dateTime'),
            "new_time": data.new_start,
            "conflicts_detected": len(conflicts) > 0,
            "conflicting_events": [c['title'] for c in conflicts]
        }
        await db.decisions.insert_one(decision)
        
        return {
            "status": "success",
            "conflicts": conflicts,
            "warning": "Conflict detected" if conflicts else None,
            "event": updated_event
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Move event error: {e}")
        raise HTTPException(status_code=500, detail=str(e))



@api_router.post("/tasks")
async def create_task(data: TaskCreate):
    task = {
        "id": str(uuid.uuid4()),
        "session_id": data.session_id,
        "title": data.title,
        "priority": data.priority,
        "completed": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.tasks.insert_one(task)
    task.pop('_id', None)
    return task


@api_router.get("/tasks")
async def get_tasks(session_id: str):
    return await db.tasks.find(
        {"session_id": session_id, "completed": False}, {"_id": 0}
    ).to_list(100)


@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, session_id: str):
    result = await db.tasks.delete_one({"id": task_id, "session_id": session_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"status": "deleted"}


@api_router.put("/tasks/{task_id}")
async def update_task(task_id: str, session_id: str, data: TaskUpdate):
    update_data = {k: v for k, v in data.dict().items() if v is not None}
    if not update_data:
         return {"status": "no_changes"}
    
    result = await db.tasks.update_one(
        {"id": task_id, "session_id": session_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
        
    return {"status": "updated", "updated_fields": update_data}



@api_router.post("/plan")
async def plan_day(req: PlanRequest):
    from ai_planner import run_planner

    print(f"DEBUG: Plan request session_id: {req.session_id}")
    session = await db.sessions.find_one({"session_id": req.session_id})
    if not session:
        print(f"DEBUG: Session not found for {req.session_id}")
        raise HTTPException(status_code=404, detail="Session not found")

    service = await get_google_service(req.session_id)
    time_min, time_max = get_day_range(req.date)

    result = service.events().list(
        calendarId='primary', timeMin=time_min, timeMax=time_max,
        singleEvents=True, orderBy='startTime'
    ).execute()
    raw_events = result.get('items', [])

    tasks = await db.tasks.find(
        {"session_id": req.session_id, "completed": False}, {"_id": 0}
    ).to_list(100)

    print(f"DEBUG: Planning for {len(tasks)} tasks")
    for t in tasks:
        print(f" - {t.get('title')} ({t.get('priority')})")

    # Fetch user preferences for day schedule
    session = await db.sessions.find_one({"session_id": req.session_id})
    prefs = session.get("preferences", {}) if session else {}
    day_start_hour = prefs.get("day_start_hour", 0)
    day_end_hour = prefs.get("day_end_hour", 24)
    logger.info(f"Using schedule preferences: {day_start_hour}:00 - {day_end_hour}:00")

    target = datetime.strptime(req.date, "%Y-%m-%d") if req.date else datetime.now(timezone.utc)
    plan = await run_planner(raw_events, tasks, target, day_start_hour, day_end_hour)
    print(f"DEBUG: Planner returned {len(plan.get('actions', []))} actions")

    decisions = []
    for action in plan.get('actions', []):
        decision = {
            "id": str(uuid.uuid4()),
            "session_id": req.session_id,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        try:
            if action['type'] == 'move_event':
                service.events().patch(
                    calendarId='primary', eventId=action['event_id'],
                    body={
                        'start': {'dateTime': action['new_start']},
                        'end': {'dateTime': action['new_end']}
                    }
                ).execute()
                decision.update({
                    "action_type": "move_event",
                    "event_id": action.get('event_id'),
                    "event_title": action.get('event_title', ''),
                    "description": f"Moved to {action.get('new_start', '')[11:16]}",
                    "reason": action.get('reason', ''),
                    "original_time": action.get('original_start', ''),
                    "new_time": action.get('new_start', ''),
                    "end_time": action.get('new_end', '')
                })
            elif action['type'] == 'create_event':
                created_event = service.events().insert(
                    calendarId='primary',
                    body={
                        'summary': action['title'],
                        'start': {'dateTime': action['start']},
                        'end': {'dateTime': action['end']},
                        'description': f"Created by Chief: {action.get('reason', '')}"
                    }
                ).execute()
                decision.update({
                    "action_type": "create_event",
                    "event_id": created_event.get('id'),
                    "event_title": action.get('title', ''),
                    "description": f"Scheduled at {action.get('start', '')[11:16]}",
                    "reason": action.get('reason', ''),
                    "new_time": action.get('start', ''),
                    "end_time": action.get('end', '')
                })
        except Exception as e:
            logger.error(f"Action error: {e}")
            decision.update({
                "action_type": "error",
                "event_title": action.get('event_title', action.get('title', '')),
                "description": str(e)[:200],
                "reason": action.get('reason', '')
            })

        decisions.append(decision)
        await db.decisions.insert_one({**decision})

    # NOTE: Tasks are NO LONGER auto-completed after planning
    # Users must manually mark them complete via the UI
    
    clean = [{k: v for k, v in d.items() if k != '_id'} for d in decisions]
    return {"summary": plan.get('summary', ''), "decisions": clean, "actions_count": len(clean)}


@api_router.get("/decisions")
async def get_decisions(session_id: str):
    return await db.decisions.find(
        {"session_id": session_id}, {"_id": 0}
    ).sort("timestamp", -1).to_list(100)


@api_router.post("/calendar/reset-to-plan")
async def reset_to_plan(req: PlanRequest):
    """Reset all events to their AI-planned times."""
    try:
        logger.info(f"Reset to plan requested for session: {req.session_id}, date: {req.date}")
        service = await get_google_service(req.session_id)
        
        # Find all decisions with scheduled times (create_event or move_event)
        decisions = await db.decisions.find({
            "session_id": req.session_id,
            "new_time": {"$exists": True, "$ne": None}
        }).to_list(100)
        
        logger.info(f"Found {len(decisions)} decisions with new_time")
        
        restored = 0
        skipped = 0
        errors = []
        
        for d in decisions:
            try:
                event_id = d.get('event_id')
                new_time = d.get('new_time')
                event_title = d.get('event_title', 'Unknown')
                
                # Skip if missing critical data
                if not event_id or not new_time:
                    skipped += 1
                    logger.warning(f"Skipping decision for '{event_title}': missing event_id={event_id is not None}, new_time={new_time is not None}")
                    continue
                
                # Get end time from decision or calculate if missing
                end_time = d.get('end_time')
                if not end_time:
                    start_dt = datetime.fromisoformat(new_time.replace('Z', '+00:00'))
                    end_dt = start_dt + timedelta(minutes=30)
                    end_time = end_dt.isoformat()
                    logger.info(f"Calculated end_time for '{event_title}': {end_time}")
                
                # Restore the event to AI-planned time
                logger.info(f"Restoring '{event_title}' (ID: {event_id}) to {new_time}")
                service.events().patch(
                    calendarId='primary',
                    eventId=event_id,
                    body={
                        'start': {'dateTime': new_time},
                        'end': {'dateTime': end_time}
                    }
                ).execute()
                restored += 1
                logger.info(f"Successfully restored '{event_title}'")
                
            except Exception as e:
                error_msg = f"{event_title}: {str(e)[:100]}"
                errors.append(error_msg)
                logger.error(f"Reset error for '{event_title}' (ID: {d.get('id')}): {e}")
        
        logger.info(f"Reset complete: restored={restored}, skipped={skipped}, errors={len(errors)}")
        return {"restored_count": restored, "skipped_count": skipped, "errors": errors[:5]}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Reset to plan error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


app.include_router(api_router)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    mongo_client.close()
