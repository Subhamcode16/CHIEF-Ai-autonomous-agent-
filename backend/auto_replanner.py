"""
Auto Re-Planner

Automatically triggers re-planning when changes are detected.
This is the core of autonomous mode - it runs planning without user intervention.
"""

import logging
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Optional
from ai_planner import run_planner

logger = logging.getLogger(__name__)


async def trigger_auto_replan(
    db, 
    service, 
    session_id: str, 
    trigger_reason: str,
    date_str: Optional[str] = None
) -> Dict:
    """
    Automatically re-plan the schedule.
    
    This is called when:
    - A new task is added (autonomous mode active)
    - A conflict is detected
    - User preferences change
    
    Args:
        db: Database instance
        service: Google Calendar service
        session_id: User session ID
        trigger_reason: Why replanning was triggered
        date_str: Target date (YYYY-MM-DD), defaults to today
        
    Returns:
        Dict with replanning results
    """
    try:
        logger.info(f"Auto-replan triggered for session {session_id}: {trigger_reason}")
        
        # Get target date
        if date_str:
            target = datetime.strptime(date_str, "%Y-%m-%d")
        else:
            target = datetime.now(timezone.utc)
        
        # Get day range for events
        time_min = target.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
        time_max = target.replace(hour=23, minute=59, second=59, microsecond=0).isoformat()
        
        # Fetch current calendar events
        result = service.events().list(
            calendarId='primary',
            timeMin=time_min,
            timeMax=time_max,
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        raw_events = result.get('items', [])
        
        # Fetch uncompleted tasks
        tasks = await db.tasks.find(
            {"session_id": session_id, "completed": False},
            {"_id": 0}
        ).to_list(100)
        
        if not tasks:
            logger.info("No tasks to schedule, skipping auto-replan")
            return {
                "status": "skipped",
                "reason": "No tasks to schedule",
                "actions_count": 0
            }
        
        # Get user preferences
        session = await db.sessions.find_one({"session_id": session_id})
        prefs = session.get("preferences", {}) if session else {}
        day_start_hour = prefs.get("day_start_hour", 0)
        day_end_hour = prefs.get("day_end_hour", 24)
        
        # Run AI planner
        plan = await run_planner(raw_events, tasks, target, day_start_hour, day_end_hour)
        logger.info(f"Auto-replan generated {len(plan.get('actions', []))} actions")
        
        # Execute actions
        decisions = []
        for action in plan.get('actions', []):
            decision = {
                "id": str(uuid.uuid4()),
                "session_id": session_id,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "autonomous_trigger": trigger_reason
            }
            
            try:
                if action['type'] == 'move_event':
                    service.events().patch(
                        calendarId='primary',
                        eventId=action['event_id'],
                        body={
                            'start': {'dateTime': action['new_start']},
                            'end': {'dateTime': action['new_end']}
                        }
                    ).execute()
                    
                    decision.update({
                        "action_type": "move_event",
                        "event_id": action.get('event_id'),
                        "event_title": action.get('event_title', ''),
                        "description": f"Auto-moved to {action.get('new_start', '')[11:16]}",
                        "reason": f"Auto: {action.get('reason', '')}",
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
                            'description': f"Auto-scheduled by Chief: {action.get('reason', '')}"
                        }
                    ).execute()
                    
                    decision.update({
                        "action_type": "create_event",
                        "event_id": created_event.get('id'),
                        "event_title": action.get('title', ''),
                        "description": f"Auto-scheduled at {action.get('start', '')[11:16]}",
                        "reason": f"Auto: {action.get('reason', '')}",
                        "new_time": action.get('start', ''),
                        "end_time": action.get('end', '')
                    })
                    
            except Exception as e:
                logger.error(f"Auto-replan action error: {e}")
                decision.update({
                    "action_type": "error",
                    "event_title": action.get('event_title', action.get('title', '')),
                    "description": str(e)[:200],
                    "reason": f"Auto-replan failed: {action.get('reason', '')}"
                })
            
            decisions.append(decision)
            await db.decisions.insert_one({**decision})
        
        logger.info(f"Auto-replan complete: {len(decisions)} decisions logged")
        
        return {
            "status": "success",
            "trigger_reason": trigger_reason,
            "actions_count": len(decisions),
            "summary": plan.get('summary', 'Schedule auto-updated'),
            "decisions": decisions
        }
        
    except Exception as e:
        logger.error(f"Auto-replan failed: {e}")
        return {
            "status": "error",
            "error": str(e),
            "actions_count": 0
        }
