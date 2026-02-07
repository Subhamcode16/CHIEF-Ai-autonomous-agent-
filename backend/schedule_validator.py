"""
Schedule Validator Module
Validates AI-generated schedules for logical consistency.
Catches unrealistic scheduling before execution.
"""

from datetime import datetime
from typing import Tuple, List
import logging

logger = logging.getLogger(__name__)


# Validation rules for different task types
MEAL_RULES = {
    "breakfast": (5, 11),   # 5 AM - 11 AM (generous)
    "brunch": (9, 14),      # 9 AM - 2 PM
    "lunch": (11, 15),      # 11 AM - 3 PM (generous)
    "dinner": (16, 22),     # 4 PM - 10 PM (generous)
    "supper": (17, 22),     # 5 PM - 10 PM
}

EXERCISE_VALID_HOURS = [(5, 10), (16, 22)]  # Early morning OR evening
MEETING_VALID_HOURS = (7, 21)  # Extended business hours


def validate_schedule(actions: list) -> Tuple[bool, List[str], List[dict]]:
    """
    Validate AI-generated schedule actions for logical consistency.
    
    Args:
        actions: List of action dicts from AI planner
        
    Returns:
        Tuple of:
            - is_valid: Boolean indicating if schedule is acceptable
            - errors: List of error message strings
            - warnings: List of warning dicts with details
    """
    errors = []
    warnings = []
    
    for action in actions:
        action_type = action.get("type")
        
        if action_type == "create_event":
            title = action.get("title", "").lower()
            start_str = action.get("start", "")
            
            if not start_str:
                continue
                
            try:
                # Parse datetime
                start_time = datetime.fromisoformat(start_str.replace('Z', '+00:00'))
                hour = start_time.hour
                
                # === MEAL VALIDATION ===
                for meal_type, (valid_start, valid_end) in MEAL_RULES.items():
                    if meal_type in title:
                        if not (valid_start <= hour < valid_end):
                            errors.append(
                                f"❌ '{action.get('title')}' scheduled at {hour}:00 - "
                                f"{meal_type} should be between {valid_start}:00-{valid_end}:00"
                            )
                        break
                
                # Generic meal detection
                if any(word in title for word in ["eat", "food", "meal"]):
                    if hour < 6 or hour >= 23:
                        errors.append(
                            f"❌ '{action.get('title')}' scheduled at {hour}:00 - "
                            f"meal at this time is unrealistic"
                        )
                
                # === EXERCISE VALIDATION ===
                exercise_keywords = ["gym", "workout", "exercise", "yoga", "run", "training"]
                if any(word in title for word in exercise_keywords):
                    is_valid_time = any(
                        start <= hour < end for start, end in EXERCISE_VALID_HOURS
                    )
                    if not is_valid_time:
                        # Warning instead of error - some people exercise midday
                        warnings.append({
                            "type": "unusual_time",
                            "message": f"⚠️ '{action.get('title')}' at {hour}:00 - "
                                      f"exercise typically scheduled morning or evening",
                            "action": action
                        })
                
                # === MEETING VALIDATION ===
                meeting_keywords = ["meeting", "call", "sync", "standup", "interview"]
                if any(word in title for word in meeting_keywords):
                    valid_start, valid_end = MEETING_VALID_HOURS
                    if not (valid_start <= hour < valid_end):
                        errors.append(
                            f"❌ '{action.get('title')}' scheduled at {hour}:00 - "
                            f"meetings should be during reasonable hours"
                        )
                
                # === SLEEP HOURS VALIDATION ===
                # Almost nothing should be scheduled 11 PM - 5 AM
                if 23 <= hour or hour < 5:
                    sleep_exceptions = ["overnight", "night shift", "red-eye"]
                    if not any(exc in title for exc in sleep_exceptions):
                        errors.append(
                            f"❌ '{action.get('title')}' at {hour}:00 - "
                            f"scheduling during sleep hours (11 PM-5 AM) is unrealistic"
                        )
                
            except (ValueError, AttributeError) as e:
                logger.warning(f"Could not parse datetime for validation: {start_str} - {e}")
                continue
    
    is_valid = len(errors) == 0
    return is_valid, errors, warnings


def format_validation_report(errors: List[str], warnings: List[dict]) -> str:
    """
    Format validation results into a human-readable report.
    """
    report = []
    
    if errors:
        report.append("🚫 SCHEDULE VALIDATION FAILED\n")
        report.append("The following issues were detected:\n")
        for error in errors:
            report.append(f"  {error}\n")
    
    if warnings:
        if not errors:
            report.append("⚠️ SCHEDULE WARNINGS\n")
        else:
            report.append("\nAdditional warnings:\n")
        for warning in warnings:
            report.append(f"  {warning['message']}\n")
    
    if not errors and not warnings:
        report.append("✅ Schedule validated successfully")
    
    return "".join(report)


# Test the validator
if __name__ == "__main__":
    test_actions = [
        {"type": "create_event", "title": "Lunch", "start": "2024-01-15T19:00:00+00:00"},
        {"type": "create_event", "title": "Team standup", "start": "2024-01-15T10:00:00+00:00"},
        {"type": "create_event", "title": "Breakfast", "start": "2024-01-15T14:00:00+00:00"},
        {"type": "create_event", "title": "Gym workout", "start": "2024-01-15T13:00:00+00:00"},
        {"type": "create_event", "title": "Dinner", "start": "2024-01-15T18:30:00+00:00"},
    ]
    
    print("Schedule Validation Test:\n")
    is_valid, errors, warnings = validate_schedule(test_actions)
    print(format_validation_report(errors, warnings))
