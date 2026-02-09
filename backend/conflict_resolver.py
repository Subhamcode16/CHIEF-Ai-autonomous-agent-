"""
Conflict Detector and Resolver

Detects scheduling conflicts and provides resolution strategies.
"""

import logging
from datetime import datetime
from typing import List, Dict, Tuple

logger = logging.getLogger(__name__)


def detect_conflicts(events: List[Dict]) -> List[Dict]:
    """
    Detect overlapping events in a list.
    
    Args:
        events: List of calendar events
        
    Returns:
        List of conflict dicts with details
    """
    conflicts = []
    
    # Sort events by start time
    sorted_events = sorted(
        events,
        key=lambda e: e.get('start', {}).get('dateTime', e.get('start', {}).get('date', ''))
    )
    
    for i in range(len(sorted_events)):
        for j in range(i + 1, len(sorted_events)):
            event1 = sorted_events[i]
            event2 = sorted_events[j]
            
            # Skip all-day events
            if 'date' in event1.get('start', {}) or 'date' in event2.get('start', {}):
                continue
            
            start1_str = event1.get('start', {}).get('dateTime')
            end1_str = event1.get('end', {}).get('dateTime')
            start2_str = event2.get('start', {}).get('dateTime')
            end2_str = event2.get('end', {}).get('dateTime')
            
            if not all([start1_str, end1_str, start2_str, end2_str]):
                continue
            
            try:
                start1 = datetime.fromisoformat(start1_str.replace('Z', '+00:00'))
                end1 = datetime.fromisoformat(end1_str.replace('Z', '+00:00'))
                start2 = datetime.fromisoformat(start2_str.replace('Z', '+00:00'))
                end2 = datetime.fromisoformat(end2_str.replace('Z', '+00:00'))
                
                # Check for overlap
                if (start1 < end2) and (end1 > start2):
                    conflicts.append({
                        "event1": {
                            "id": event1.get('id'),
                            "title": event1.get('summary', 'Untitled'),
                            "start": start1_str,
                            "end": end1_str
                        },
                        "event2": {
                            "id": event2.get('id'),
                            "title": event2.get('summary', 'Untitled'),
                            "start": start2_str,
                            "end": end2_str
                        },
                        "overlap_minutes": int((min(end1, end2) - max(start1, start2)).total_seconds() / 60)
                    })
                    
            except Exception as e:
                logger.error(f"Error detecting conflict: {e}")
                continue
    
    return conflicts


def assess_task_urgency(task: Dict) -> int:
    """
    Assess task urgency based on priority and deadline.
    
    Args:
        task: Task dict
        
    Returns:
        Urgency score (0-100, higher is more urgent)
    """
    # Priority-based baseline
    priority_scores = {
        'urgent': 90,
        'high': 70,
        'medium': 40,
        'low': 20
    }
    
    score = priority_scores.get(task.get('priority', 'medium'), 40)
    
    # TODO: Add deadline proximity adjustment when deadline field is added
    # For now, urgent tasks get top priority
    
    return score


def identify_flexible_events(events: List[Dict]) -> List[str]:
    """
    Identify events that can be rescheduled.
    
    Heuristics:
    - Created by Chief (marked in description)
    - Single-person events (no attendees)
    - Events without 'busy' status
    
    Args:
        events: List of calendar events
        
    Returns:
        List of event IDs that are flexible
    """
    flexible_ids = []
    
    for event in events:
        # Chief-created events are flexible
        if 'Created by Chief' in event.get('description', ''):
            flexible_ids.append(event.get('id'))
            continue
        
        # Events with no attendees (besides organizer) are flexible
        attendees = event.get('attendees', [])
        if len(attendees) <= 1:
            flexible_ids.append(event.get('id'))
            continue
    
    return flexible_ids


def suggest_resolution(
    conflict: Dict,
    tasks: List[Dict],
    all_events: List[Dict]
) -> Dict:
    """
    Suggest a resolution for a conflict.
    
    Args:
        conflict: Conflict dict from detect_conflicts
        tasks: List of tasks to consider
        all_events: All calendar events
        
    Returns:
        Resolution suggestion dict
    """
    event1_id = conflict['event1']['id']
    event2_id = conflict['event2']['id']
    
    # Check which events are flexible
    flexible_ids = identify_flexible_events(all_events)
    
    event1_flexible = event1_id in flexible_ids
    event2_flexible = event2_id in flexible_ids
    
    if event1_flexible and not event2_flexible:
        return {
            "strategy": "move_event1",
            "event_to_move": event1_id,
            "reason": f"{conflict['event1']['title']} is flexible and can be rescheduled"
        }
    elif event2_flexible and not event1_flexible:
        return {
            "strategy": "move_event2",
            "event_to_move": event2_id,
            "reason": f"{conflict['event2']['title']} is flexible and can be rescheduled"
        }
    elif event1_flexible and event2_flexible:
        # Both flexible - choose based on duration
        duration1 = conflict['overlap_minutes']
        return {
            "strategy": "move_shorter",
            "event_to_move": event1_id if duration1 < 45 else event2_id,
            "reason": "Moving shorter event to minimize disruption"
        }
    else:
        return {
            "strategy": "manual_review",
            "reason": "Both events appear to be important external commitments. Manual review recommended."
        }
