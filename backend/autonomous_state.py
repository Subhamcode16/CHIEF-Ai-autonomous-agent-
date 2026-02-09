"""
Autonomous Mode State Management

Manages the autonomous mode state for each user session.
Tracks whether autonomous mode is active and provides utilities 
to check and update the mode status.
"""

import logging
from datetime import datetime, timezone
from typing import Optional, Dict

logger = logging.getLogger(__name__)


class AutonomousState:
    """Manages autonomous mode state."""
    
    def __init__(self, db):
        self.db = db
    
    async def activate(self, session_id: str) -> Dict:
        """
        Activate autonomous mode for a session.
        
        Args:
            session_id: User session ID
            
        Returns:
            Status dict with mode and timestamp
        """
        try:
            result = await self.db.sessions.update_one(
                {"session_id": session_id},
                {
                    "$set": {
                        "autonomous_mode": {
                            "active": True,
                            "activated_at": datetime.now(timezone.utc).isoformat(),
                            "status": "active"
                        }
                    }
                }
            )
            
            if result.matched_count == 0:
                raise ValueError("Session not found")
            
            logger.info(f"Autonomous mode activated for session {session_id}")
            return {
                "active": True,
                "status": "active",
                "message": "Autonomous mode activated"
            }
            
        except Exception as e:
            logger.error(f"Failed to activate autonomous mode: {e}")
            raise
    
    async def deactivate(self, session_id: str) -> Dict:
        """
        Deactivate/pause autonomous mode for a session.
        
        Args:
            session_id: User session ID
            
        Returns:
            Status dict with mode and timestamp
        """
        try:
            result = await self.db.sessions.update_one(
                {"session_id": session_id},
                {
                    "$set": {
                        "autonomous_mode": {
                            "active": False,
                            "deactivated_at": datetime.now(timezone.utc).isoformat(),
                            "status": "paused"
                        }
                    }
                }
            )
            
            if result.matched_count == 0:
                raise ValueError("Session not found")
            
            logger.info(f"Autonomous mode deactivated for session {session_id}")
            return {
                "active": False,
                "status": "paused",
                "message": "Autonomous mode paused"
            }
            
        except Exception as e:
            logger.error(f"Failed to deactivate autonomous mode: {e}")
            raise
    
    async def get_status(self, session_id: str) -> Dict:
        """
        Get current autonomous mode status for a session.
        
        Args:
            session_id: User session ID
            
        Returns:
            Status dict with current state
        """
        try:
            session = await self.db.sessions.find_one({"session_id": session_id})
            if not session:
                raise ValueError("Session not found")
            
            mode = session.get("autonomous_mode", {})
            active = mode.get("active", False)
            status = mode.get("status", "paused")
            
            return {
                "active": active,
                "status": status,
                "activated_at": mode.get("activated_at"),
                "deactivated_at": mode.get("deactivated_at")
            }
            
        except Exception as e:
            logger.error(f"Failed to get autonomous mode status: {e}")
            raise
    
    async def is_active(self, session_id: str) -> bool:
        """
        Check if autonomous mode is active for a session.
        
        Args:
            session_id: User session ID
            
        Returns:
            True if autonomous mode is active, False otherwise
        """
        try:
            status = await self.get_status(session_id)
            return status.get("active", False)
        except:
            return False
    
    async def update_status(self, session_id: str, status: str) -> Dict:
        """
        Update the status label (active, planning, monitoring, paused).
        
        Args:
            session_id: User session ID
            status: New status ('active', 'planning', 'monitoring', 'paused')
            
        Returns:
            Updated status dict
        """
        valid_statuses = ['active', 'planning', 'monitoring', 'paused']
        if status not in valid_statuses:
            raise ValueError(f"Invalid status. Must be one of: {valid_statuses}")
        
        try:
            result = await self.db.sessions.update_one(
                {"session_id": session_id},
                {
                    "$set": {
                        "autonomous_mode.status": status,
                        "autonomous_mode.last_updated": datetime.now(timezone.utc).isoformat()
                    }
                }
            )
            
            if result.matched_count == 0:
                raise ValueError("Session not found")
            
            logger.info(f"Updated autonomous status to '{status}' for session {session_id}")
            return await self.get_status(session_id)
            
        except Exception as e:
            logger.error(f"Failed to update autonomous status: {e}")
            raise


# Singleton instance utilities
_state_manager: Optional[AutonomousState] = None


def init_autonomous_state(db):
    """Initialize the autonomous state manager with database."""
    global _state_manager
    _state_manager = AutonomousState(db)
    return _state_manager


def get_autonomous_state() -> AutonomousState:
    """Get the autonomous state manager instance."""
    if _state_manager is None:
        raise RuntimeError("Autonomous state manager not initialized. Call init_autonomous_state first.")
    return _state_manager
