"""
User Preferences Management

Handles storing, retrieving, and parsing user scheduling preferences
from natural language text into structured constraints.
"""

import logging
import re
from typing import Dict, List, Optional
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


def parse_preferences(preferences_text: str) -> Dict:
    """
    Parse natural language preferences into structured format.
    
    Args:
        preferences_text: Multi-line text with user preferences
        
    Returns:
        Structured dict with parsed preferences
    """
    if not preferences_text or not preferences_text.strip():
        return {"raw": "", "parsed": []}
    
    lines = [line.strip() for line in preferences_text.split('\n') if line.strip()]
    parsed_rules = []
    
    for line in lines:
        rule = {"text": line, "type": "general"}
        line_lower = line.lower()
        
        # Detect time-based rules
        if any(keyword in line_lower for keyword in ['morning', 'afternoon', 'evening', 'night', 'am', 'pm', 'before', 'after']):
            rule["type"] = "time_preference"
            
            # Extract time constraints
            time_patterns = [
                (r'before\s+(\d{1,2}(?::\d{2})?)\s*(am|pm)?', 'before'),
                (r'after\s+(\d{1,2}(?::\d{2})?)\s*(am|pm)?', 'after'),
                (r'(\d{1,2}(?::\d{2})?)\s*(am|pm)', 'at')
            ]
            
            for pattern, constraint_type in time_patterns:
                match = re.search(pattern, line_lower)
                if match:
                    rule["time_constraint"] = {
                        "type": constraint_type,
                        "time": match.group(0)
                    }
                    break
        
        # Detect work type preferences
        if any(keyword in line_lower for keyword in ['deep work', 'focus', 'meetings', 'calls', 'exercise', 'gym']):
            rule["type"] = "work_type_preference"
            
            # Identify work type
            if 'deep work' in line_lower or 'focus' in line_lower:
                rule["work_type"] = "deep_work"
            elif 'meeting' in line_lower or 'call' in line_lower:
                rule["work_type"] = "meetings"
            elif 'exercise' in line_lower or 'gym' in line_lower:
                rule["work_type"] = "exercise"
        
        # Detect avoid/prevent rules
        if any(keyword in line_lower for keyword in ['avoid', 'no', "don't", 'not']):
            rule["type"] = "avoid_rule"
        
        # Detect preference rules (prefer, like, love)
        if any(keyword in line_lower for keyword in ['prefer', 'like', 'love']):
            rule["type"] = "preference_rule"
        
        # Detect break/rest rules
        if any(keyword in line_lower for keyword in ['break', 'rest', 'lunch', 'downtime']):
            rule["type"] = "break_rule"
        
        parsed_rules.append(rule)
    
    return {
        "raw": preferences_text,
        "parsed": parsed_rules,
        "count": len(parsed_rules)
    }


async def save_user_preferences(db, session_id: str, preferences_text: str) -> Dict:
    """
    Save user preferences to database.
    
    Args:
        db: Database instance
        session_id: User session ID
        preferences_text: Natural language preferences
        
    Returns:
        Saved preferences dict
    """
    try:
        # Parse preferences
        parsed = parse_preferences(preferences_text)
        
        # Save to database
        result = await db.sessions.update_one(
            {"session_id": session_id},
            {
                "$set": {
                    "user_preferences": {
                        "text": preferences_text,
                        "parsed": parsed,
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }
                }
            }
        )
        
        if result.matched_count == 0:
            raise ValueError("Session not found")
        
        logger.info(f"Saved preferences for session {session_id}: {len(parsed['parsed'])} rules")
        return {
            "success": True,
            "preferences": parsed,
            "message": f"Saved {len(parsed['parsed'])} preference(s)"
        }
        
    except Exception as e:
        logger.error(f"Failed to save preferences: {e}")
        raise


async def get_user_preferences(db, session_id: str) -> Dict:
    """
    Get user preferences from database.
    
    Args:
        db: Database instance
        session_id: User session ID
        
    Returns:
        User preferences dict
    """
    try:
        session = await db.sessions.find_one({"session_id": session_id})
        if not session:
            raise ValueError("Session not found")
        
        prefs = session.get("user_preferences", {})
        
        if not prefs:
            # Return empty preferences
            return {
                "text": "",
                "parsed": {"raw": "", "parsed": [], "count": 0},
                "updated_at": None
            }
        
        return prefs
        
    except Exception as e:
        logger.error(f"Failed to get preferences: {e}")
        raise


def build_preferences_prompt(preferences_dict: Dict) -> str:
    """
    Build AI prompt section from parsed preferences.
    
    Args:
        preferences_dict: Parsed preferences dictionary
        
    Returns:
        Formatted string for AI prompt
    """
    if not preferences_dict or not preferences_dict.get("text"):
        return ""
    
    parsed = preferences_dict.get("parsed", {})
    rules = parsed.get("parsed", [])
    
    if not rules:
        return f"User Preferences:\n{preferences_dict.get('text')}\n"
    
    # Build structured prompt
    prompt_lines = ["USER PREFERENCES (MUST RESPECT):"]
    
    for rule in rules:
        prompt_lines.append(f"• {rule['text']}")
    
    prompt_lines.append("")
    prompt_lines.append("⚠️ CRITICAL: These preferences are NON-NEGOTIABLE. Violating them will reduce user trust.")
    
    return "\n".join(prompt_lines)


async def get_preferences_for_planning(db, session_id: str) -> str:
    """
    Get preferences formatted for AI planning prompt.
    
    Args:
        db: Database instance
        session_id: User session ID
        
    Returns:
        Formatted preferences string for AI prompt
    """
    try:
        prefs = await get_user_preferences(db, session_id)
        return build_preferences_prompt(prefs)
    except Exception as e:
        logger.error(f"Failed to get preferences for planning: {e}")
        return ""
