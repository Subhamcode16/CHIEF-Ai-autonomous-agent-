import os
import json
from datetime import datetime, timezone
import google.generativeai as genai
import logging

logger = logging.getLogger(__name__)

def build_system_prompt(day_start_hour=0, day_end_hour=24):
    """Build system prompt with dynamic time constraints."""
    # Build time constraint rule
    if day_start_hour == 0 and day_end_hour == 24:
        time_constraint = "7. No time constraints - can schedule tasks 24/7"
    else:
        start_time = f"{day_start_hour:02d}:00"
        end_time = f"{day_end_hour:02d}:00" if day_end_hour < 24 else "23:59"
        time_constraint = f"7. Schedule between {start_time} and {end_time} only"
    
    return f"""You are Chief, an autonomous workflow agent and Chief of Staff. Your sole purpose is to optimize the user's day for maximum productivity.

Rules:
1. Prioritize URGENT tasks first, then HIGH, MEDIUM, LOW
2. Schedule focus blocks (60-90 min) for deep work tasks
3. Keep existing meetings unless they conflict with urgent tasks
4. Add 15 min buffer between events when possible
5. Schedule tasks in open calendar slots only
6. Move lower-priority events only if needed for higher-priority tasks
{time_constraint}
8. Use the SAME timezone format as existing calendar events. If no events exist, use +00:00 (UTC)

Respond with ONLY valid JSON (no markdown, no code blocks):
{{
    "actions": [
        {{
            "type": "move_event",
            "event_id": "id",
            "event_title": "name",
            "original_start": "ISO datetime with tz",
            "original_end": "ISO datetime with tz",
            "new_start": "ISO datetime with tz",
            "new_end": "ISO datetime with tz",
            "reason": "explanation"
        }},
        {{
            "type": "create_event",
            "title": "name",
            "start": "ISO datetime with tz",
            "end": "ISO datetime with tz",
            "reason": "explanation"
        }}
    ],
    "summary": "Brief overview of changes"
}}

If no changes needed: {{"actions": [], "summary": "Your schedule is already optimized."}}"""


async def run_planner(calendar_events, tasks, target_date, day_start_hour=0, day_end_hour=24):
    api_key = os.environ.get('GEMINI_API_KEY')
    genai.configure(api_key=api_key)
    
    # Build system prompt with user's preferred hours
    system_prompt = build_system_prompt(day_start_hour, day_end_hour)
    
    # Using Gemini 2.5 Flash model
    model = genai.GenerativeModel("gemini-2.5-flash", system_instruction=system_prompt)

    date_str = target_date.strftime("%Y-%m-%d") if hasattr(target_date, 'strftime') else str(target_date)[:10]

    events_text = ""
    if not calendar_events:
        events_text = "No events scheduled."
    else:
        for e in calendar_events:
            start = e.get('start', {}).get('dateTime', e.get('start', {}).get('date', ''))
            end = e.get('end', {}).get('dateTime', e.get('end', {}).get('date', ''))
            events_text += f"\n- ID: {e.get('id')} | {e.get('summary', 'No Title')} | Start: {start} | End: {end}"

    tasks_text = ""
    if not tasks:
        tasks_text = "No tasks to schedule."
    else:
        for t in tasks:
            tasks_text += f"\n- {t['title']} (Priority: {t['priority']})"

    prompt = f"""Date: {date_str}
Current UTC time: {datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S+00:00')}

EXISTING CALENDAR EVENTS:{events_text}

TASKS TO SCHEDULE:{tasks_text}

Analyze and optimize. Return JSON only."""

    try:
        # File-based debug logging
        with open("planner_debug.log", "a") as logfile:
            logfile.write(f"\n--- Plan Request at {datetime.now(timezone.utc).isoformat()} ---\n")
            logfile.write(f"Tasks count: {len(tasks)}\n")
            logfile.write(f"Events count: {len(calendar_events)}\n")
            logfile.write(f"Target date: {date_str}\n")
        
        # Generate content
        print(f"DEBUG: Generating content with model {model.model_name}")
        response = model.generate_content(prompt)
        text = response.text.strip()
        print(f"DEBUG: AI Response: {text}")
        
        # Log AI response to file
        with open("planner_debug.log", "a") as logfile:
            logfile.write(f"AI Response: {text[:500]}...\n")

        if text.startswith("```"):
            first_newline = text.find("\n")
            if first_newline != -1:
                text = text[first_newline + 1:]
            else:
                text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()

        return json.loads(text)
    except Exception as e:
        logger.error(f"Planner error: {e}")
        print(f"DEBUG: Planner Exception: {e}")
        # Log exception to file
        with open("planner_debug.log", "a") as logfile:
            logfile.write(f"EXCEPTION: {e}\n")
        return {"actions": [], "summary": f"Planning error: {str(e)}"}
