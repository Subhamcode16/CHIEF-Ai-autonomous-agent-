"""
Task Classifier Module
Provides semantic understanding of tasks for intelligent scheduling.
"""

import re
from typing import Optional

# Task type definitions with keywords and time constraints
TASK_TYPES = {
    "meal": {
        "keywords": ["breakfast", "lunch", "dinner", "brunch", "snack", "eat", "food", "meal"],
        "default_duration": 45,
        "subtypes": {
            "breakfast": {
                "keywords": ["breakfast"],
                "time_range": (6, 10),  # 6 AM - 10 AM
                "duration": 30
            },
            "brunch": {
                "keywords": ["brunch"],
                "time_range": (10, 13),  # 10 AM - 1 PM
                "duration": 60
            },
            "lunch": {
                "keywords": ["lunch"],
                "time_range": (11, 14),  # 11 AM - 2 PM
                "duration": 45
            },
            "dinner": {
                "keywords": ["dinner", "supper"],
                "time_range": (17, 21),  # 5 PM - 9 PM
                "duration": 60
            },
            "snack": {
                "keywords": ["snack", "tea", "coffee break"],
                "time_range": (9, 20),  # 9 AM - 8 PM
                "duration": 15
            }
        }
    },
    "meeting": {
        "keywords": ["meeting", "call", "standup", "sync", "1:1", "one-on-one", 
                     "interview", "review", "discussion", "catchup", "catch-up", "huddle"],
        "default_duration": 30,
        "time_range": (9, 18),  # Business hours
        "subtypes": {
            "standup": {
                "keywords": ["standup", "stand-up", "daily"],
                "time_range": (9, 11),
                "duration": 15
            },
            "interview": {
                "keywords": ["interview"],
                "time_range": (10, 17),
                "duration": 60
            }
        }
    },
    "exercise": {
        "keywords": ["gym", "workout", "exercise", "run", "running", "yoga", "fitness",
                     "training", "jog", "swim", "cycling", "bike", "walk", "hiking"],
        "default_duration": 60,
        "time_ranges": [(6, 9), (17, 21)],  # Morning OR evening
        "preferred_range": (6, 9)  # Morning preferred
    },
    "deep_work": {
        "keywords": ["code", "coding", "write", "writing", "design", "plan", "planning",
                     "focus", "prep", "prepare", "research", "study", "analyze", "review",
                     "develop", "build", "create", "documentation", "strategy"],
        "default_duration": 90,
        "time_range": (9, 17)  # Work hours
    },
    "errand": {
        "keywords": ["errand", "shopping", "grocery", "bank", "post office", "pharmacy",
                     "doctor", "dentist", "appointment", "pickup", "drop off", "return"],
        "default_duration": 45,
        "time_range": (10, 18)  # Daytime
    },
    "personal": {
        "keywords": ["family", "friends", "relax", "rest", "hobby", "read", "game",
                     "movie", "show", "netflix", "leisure", "break"],
        "default_duration": 60,
        "time_range": (18, 22)  # Evening
    },
    "commute": {
        "keywords": ["commute", "travel", "drive", "transit"],
        "default_duration": 30,
        "time_ranges": [(7, 10), (16, 19)]  # Rush hours
    }
}


def classify_task(title: str) -> dict:
    """
    Classify a task based on its title and return scheduling hints.
    
    Args:
        title: The task title string
        
    Returns:
        dict with keys:
            - type: The task category (meal, meeting, exercise, etc.)
            - subtype: More specific classification if available
            - duration: Suggested duration in minutes
            - time_range: Tuple of (start_hour, end_hour) for preferred scheduling
            - time_ranges: List of possible time ranges (for flexible tasks)
            - constraint_strength: "strict" for meals, "flexible" for work
    """
    title_lower = title.lower().strip()
    
    # Check each task type
    for task_type, config in TASK_TYPES.items():
        # Check if any keyword matches
        for keyword in config["keywords"]:
            if keyword in title_lower:
                result = {
                    "type": task_type,
                    "subtype": None,
                    "duration": config["default_duration"],
                    "time_range": config.get("time_range"),
                    "time_ranges": config.get("time_ranges"),
                    "constraint_strength": "strict" if task_type == "meal" else "flexible"
                }
                
                # Check for subtypes (more specific matches)
                if "subtypes" in config:
                    for subtype_name, subtype_config in config["subtypes"].items():
                        for sub_keyword in subtype_config["keywords"]:
                            if sub_keyword in title_lower:
                                result["subtype"] = subtype_name
                                result["duration"] = subtype_config.get("duration", result["duration"])
                                result["time_range"] = subtype_config.get("time_range", result["time_range"])
                                break
                        if result["subtype"]:
                            break
                
                return result
    
    # Default: Generic task
    return {
        "type": "general",
        "subtype": None,
        "duration": 30,
        "time_range": (9, 18),  # Business hours default
        "time_ranges": None,
        "constraint_strength": "flexible"
    }


def get_time_constraint_text(classification: dict) -> str:
    """
    Generate human-readable time constraint text for AI prompt.
    """
    task_type = classification["type"]
    subtype = classification["subtype"]
    time_range = classification["time_range"]
    time_ranges = classification.get("time_ranges")
    
    if task_type == "meal":
        meal_name = subtype or "meal"
        if time_range:
            return f"[MUST schedule between {time_range[0]}:00-{time_range[1]}:00 - this is a {meal_name}!]"
        return f"[Schedule at appropriate meal time]"
    
    elif task_type == "exercise":
        if time_ranges:
            ranges_text = " OR ".join([f"{r[0]}:00-{r[1]}:00" for r in time_ranges])
            return f"[Best times: {ranges_text} - avoid middle of workday]"
        return "[Schedule morning or evening]"
    
    elif task_type == "meeting":
        return f"[Business hours {time_range[0]}:00-{time_range[1]}:00]"
    
    elif task_type == "deep_work":
        return f"[Focus time: morning or mid-afternoon preferred]"
    
    elif time_range:
        return f"[Suggested time: {time_range[0]}:00-{time_range[1]}:00]"
    
    return ""


def enrich_tasks_for_ai(tasks: list) -> list:
    """
    Classify all tasks and add semantic metadata for AI prompt.
    
    Args:
        tasks: List of task dicts with 'title' and 'priority' keys
        
    Returns:
        List of enriched task dicts with classification data
    """
    enriched = []
    for task in tasks:
        classification = classify_task(task.get("title", ""))
        enriched.append({
            **task,
            "classification": classification,
            "constraint_text": get_time_constraint_text(classification)
        })
    return enriched


# Quick test
if __name__ == "__main__":
    test_tasks = [
        "lunch",
        "Team standup",
        "Gym workout",
        "Code review for PR",
        "Dinner with family",
        "Grocery shopping",
        "Morning yoga",
        "Breakfast meeting with CEO"
    ]
    
    print("Task Classification Test Results:\n")
    for title in test_tasks:
        result = classify_task(title)
        constraint = get_time_constraint_text(result)
        print(f"'{title}'")
        print(f"  → Type: {result['type']}, Subtype: {result['subtype']}")
        print(f"  → Duration: {result['duration']}min, Range: {result['time_range']}")
        print(f"  → Constraint: {constraint}")
        print()
