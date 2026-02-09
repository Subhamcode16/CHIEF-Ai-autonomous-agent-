import os
import json
from datetime import datetime, timezone
from google import genai
from google.genai import types
import logging
from task_classifier import classify_task, get_time_constraint_text, enrich_tasks_for_ai
from schedule_validator import validate_schedule, format_validation_report

logger = logging.getLogger(__name__)


def build_system_prompt(day_start_hour=0, day_end_hour=24):
    """Build system prompt with semantic understanding and time constraints."""
    
    # Build time constraint rule
    if day_start_hour == 0 and day_end_hour == 24:
        time_constraint = "• User has no time constraints - can schedule 24/7"
    else:
        start_time = f"{day_start_hour:02d}:00"
        end_time = f"{day_end_hour:02d}:00" if day_end_hour < 24 else "23:59"
        time_constraint = f"• Only schedule between {start_time} and {end_time}"
    
    return f"""You are Chief, an intelligent scheduling assistant with COMMON SENSE understanding of human activities.

**🚨 CRITICAL SEMANTIC RULES - NEVER VIOLATE THESE:**

## 1. MEAL SCHEDULING (STRICT - NO EXCEPTIONS)
| Meal      | Valid Hours      | Duration  |
|-----------|------------------|-----------|
| Breakfast | 6:00 - 10:00 AM  | 30-45 min |
| Brunch    | 10:00 AM - 1:00 PM | 45-60 min |
| Lunch     | 11:00 AM - 2:00 PM | 30-60 min |
| Dinner    | 5:00 - 9:00 PM   | 45-90 min |
| Snack     | 9:00 AM - 8:00 PM | 15-20 min |

⚠️ **NEVER schedule lunch at 7 PM or breakfast at 2 PM. This is WRONG.**

## 2. WORK & MEETINGS
- Business meetings: 9:00 AM - 6:00 PM
- Standups: 9:00 - 11:00 AM (morning ritual)
- Interviews: 10:00 AM - 5:00 PM
- Focus/deep work blocks: 9:00 AM - 12:00 PM OR 2:00 - 5:00 PM
- Duration: 30-90 min for meetings, 60-120 min for focus work

## 3. EXERCISE & FITNESS
- Preferred: 6:00 - 9:00 AM (morning) OR 5:00 - 8:00 PM (evening)
- Avoid: Middle of workday (11 AM - 4 PM) unless user specifies
- Duration: 45-90 min

## 4. PERSONAL & ERRANDS
- Errands/shopping: 10:00 AM - 6:00 PM (business hours)
- Family time: Evening (6:00 - 10:00 PM)
- Personal calls: Flexible, but avoid early morning/late night

## 5. SCHEDULING PRIORITIES
1. URGENT tasks get scheduled first, even if it means moving things
2. HIGH priority: Schedule in prime time slots
3. MEDIUM/LOW: Fill remaining gaps

## 6. GENERAL RULES
- Add 15 min buffer between back-to-back events
- Leave lunch slot (12-1 PM) open if no lunch task exists
- Don't schedule anything 11 PM - 5 AM unless explicitly requested
{time_constraint}

## 7. DURATION INTELLIGENCE
| Task Type | Typical Duration |
|-----------|------------------|
| Quick call | 15-30 min |
| Regular meeting | 30-45 min |
| Lunch/meals | 30-60 min |
| Focus work | 60-120 min |
| Gym/workout | 45-90 min |

## 8. VALIDATION CHECKLIST (Ask yourself before finalizing)
- "Would a real human eat lunch at 7 PM?" → If NO, reschedule!
- "Is this meeting at 11 PM realistic?" → If NO, move to business hours!
- "Does this schedule respect human needs (meals, energy, breaks)?" → Must be YES!

---

**RESPONSE FORMAT (JSON ONLY, no markdown):**
{{
    "actions": [
        {{
            "type": "move_event",
            "event_id": "id",
            "event_title": "name",
            "original_start": "ISO datetime with timezone",
            "original_end": "ISO datetime with timezone",
            "new_start": "ISO datetime with timezone",
            "new_end": "ISO datetime with timezone",
            "reason": "Brief explanation"
        }},
        {{
            "type": "create_event",
            "title": "event name",
            "start": "ISO datetime with timezone",
            "end": "ISO datetime with timezone",
            "reason": "Brief explanation"
        }}
    ],
    "summary": "One-line overview of changes made"
}}

If schedule is already optimal: {{"actions": [], "summary": "Your schedule is already optimized."}}"""


async def run_planner(calendar_events, tasks, target_date, day_start_hour=0, day_end_hour=24, user_preferences_text=""):
    """
    Main planner function with semantic understanding and user preferences.
    
    Args:
        calendar_events: Google Calendar events
        tasks: Tasks to schedule
        target_date: Target date for planning
        day_start_hour: User's day start hour (0-23)
        day_end_hour: User's day end hour (0-24)
        user_preferences_text: Optional user preferences string for AI
    """
    api_key = os.environ.get('GEMINI_API_KEY')
    client = genai.Client(api_key=api_key)

    date_str = target_date.strftime("%Y-%m-%d") if hasattr(target_date, 'strftime') else str(target_date)[:10]

    # Format existing calendar events
    events_text = ""
    if not calendar_events:
        events_text = "No events scheduled."
    else:
        for e in calendar_events:
            start = e.get('start', {}).get('dateTime', e.get('start', {}).get('date', ''))
            end = e.get('end', {}).get('dateTime', e.get('end', {}).get('date', ''))
            events_text += f"\n- ID: {e.get('id')} | {e.get('summary', 'No Title')} | Start: {start} | End: {end}"

    # Enrich tasks with semantic classification
    enriched_tasks = enrich_tasks_for_ai(tasks)
    
    # Build task text with semantic hints
    tasks_text = ""
    if not enriched_tasks:
        tasks_text = "No tasks to schedule."
    else:
        for t in enriched_tasks:
            classification = t.get('classification', {})
            task_type = classification.get('type', 'general')
            duration = classification.get('duration', 30)
            constraint = t.get('constraint_text', '')
            
            tasks_text += f"\n- {t['title']} | Priority: {t['priority']} | Type: {task_type} | Suggested duration: {duration}min {constraint}"

    # Build the final prompt with timezone awareness
    current_time = datetime.now(timezone.utc)
    prompt = f"""Date: {date_str}
Current UTC time: {current_time.strftime('%Y-%m-%dT%H:%M:%S+00:00')}

EXISTING CALENDAR EVENTS:{events_text}

TASKS TO SCHEDULE:{tasks_text}

CRITICAL INSTRUCTIONS:
1. LUNCH must be scheduled between 11:00-14:00 (11 AM - 2 PM) - NEVER at 19:00!
2. BREAKFAST must be scheduled between 06:00-10:00 (6 AM - 10 AM)
3. DINNER must be scheduled between 17:00-21:00 (5 PM - 9 PM)
4. GYM/EXERCISE should be 06:00-09:00 (morning) or 17:00-20:00 (evening)
5. If the appropriate time window has PASSED for today, schedule for the NEXT available slot today or tomorrow
6. Use the SAME timezone offset as existing calendar events. If none exist, assume local timezone.

Analyze and optimize. Return valid JSON only."""

    try:
        # File-based debug logging
        with open("planner_debug.log", "a") as logfile:
            logfile.write(f"\n--- Plan Request at {datetime.now(timezone.utc).isoformat()} ---\n")
            logfile.write(f"Tasks count: {len(tasks)}\n")
            logfile.write(f"Events count: {len(calendar_events)}\n")
            logfile.write(f"Target date: {date_str}\n")
            logfile.write(f"Enriched tasks:\n")
            for t in enriched_tasks:
                logfile.write(f"  - {t['title']}: {t.get('classification', {})}\n")
        
        # Build system prompt with user's preferred hours
        system_prompt = build_system_prompt(day_start_hour, day_end_hour)
        
        # Add user preferences to system prompt if provided
        if user_preferences_text:
            system_prompt += f"\n\n{user_preferences_text}"

        # Generate content
        logger.info(f"Generating schedule with model gemini-2.0-flash")
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt
            )
        )
        text = response.text.strip()
        logger.info(f"AI Response received, length: {len(text)}")
        
        # Log AI response to file
        with open("planner_debug.log", "a") as logfile:
            logfile.write(f"AI Response: {text[:1000]}...\n")

        # Clean up markdown code blocks if present
        if text.startswith("```"):
            first_newline = text.find("\n")
            if first_newline != -1:
                text = text[first_newline + 1:]
            else:
                text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()

        # Parse AI response
        plan = json.loads(text)
        
        # Validate the generated schedule
        is_valid, errors, warnings = validate_schedule(plan.get('actions', []))
        
        if not is_valid:
            # Log validation failures
            logger.warning(f"Schedule validation failed: {errors}")
            with open("planner_debug.log", "a") as logfile:
                logfile.write(f"VALIDATION FAILED: {errors}\n")
            
            # Attempt retry with stricter prompt
            logger.info("Retrying with stricter constraints...")
            retry_prompt = f"""Your previous schedule was INVALID:
{chr(10).join(errors)}

PLEASE FIX THIS NOW. You MUST schedule:
- LUNCH between 11:00 and 14:00 (11 AM - 2 PM) - NEVER 19:00!
- BREAKFAST between 06:00 and 10:00
- DINNER between 17:00 and 21:00

If the time window has passed for today, schedule for TOMORROW.

Original request:
{prompt}

Return corrected JSON only."""
            
            retry_response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=retry_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt
                )
            )
            retry_text = retry_response.text.strip()
            
            # Log retry
            with open("planner_debug.log", "a") as logfile:
                logfile.write(f"RETRY Response: {retry_text[:500]}...\n")
            
            # Clean markdown
            if retry_text.startswith("```"):
                first_newline = retry_text.find("\n")
                if first_newline != -1:
                    retry_text = retry_text[first_newline + 1:]
            if retry_text.endswith("```"):
                retry_text = retry_text[:-3]
            retry_text = retry_text.strip()
            
            retry_plan = json.loads(retry_text)
            
            # Validate retry
            is_valid_retry, retry_errors, _ = validate_schedule(retry_plan.get('actions', []))
            if is_valid_retry:
                logger.info("Retry succeeded - schedule is now valid")
                return retry_plan
            else:
                logger.warning(f"Retry also failed: {retry_errors}")
                # Return original with warning in summary
                plan['summary'] = f"⚠️ {plan.get('summary', '')} (Note: Some times may need manual adjustment)"
        
        # Log warnings if any
        if warnings:
            logger.info(f"Schedule warnings: {[w['message'] for w in warnings]}")
        
        return plan
        
    except json.JSONDecodeError as e:
        logger.error(f"JSON parse error: {e}")
        with open("planner_debug.log", "a") as logfile:
            logfile.write(f"JSON PARSE ERROR: {e}\nRaw text: {text[:500]}\n")
        return {"actions": [], "summary": f"Planning error: Could not parse AI response"}
        
    except Exception as e:
        logger.error(f"Planner error: {e}")
        with open("planner_debug.log", "a") as logfile:
            logfile.write(f"EXCEPTION: {e}\n")
        return {"actions": [], "summary": f"Planning error: {str(e)}"}
