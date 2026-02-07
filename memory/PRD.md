# Chief - AI Chief of Staff - PRD

## Original Problem Statement
Build a full-stack website for "Chief - Your AI Chief of Staff" - an AI-powered autonomous daily planner with Google Calendar integration, task management, AI-powered scheduling via Gemini, and transparent decision logging.

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI (Dark executive theme)
- **Backend**: FastAPI + MongoDB + Google Calendar API + Gemini 3 Flash (via Emergent LLM key)
- **Auth**: Google OAuth 2.0 (session-based, no traditional auth)
- **AI**: Gemini 3 Flash for schedule optimization and task planning

## User Personas
- Busy professionals, executives, founders needing autonomous schedule optimization
- Demo/hackathon judges evaluating AI agent capabilities

## Core Requirements
1. Google Calendar OAuth connect (read/write)
2. Calendar timeline day view
3. Task input with priority levels (urgent/high/medium/low)
4. AI Planning Agent ("Let Chief Plan My Day")
5. Decision Log with transparent reasoning ("Why I did this")

## What's Been Implemented (Feb 2026)
- Landing page with brand identity and Google Calendar connect flow
- Google OAuth 2.0 integration with token refresh
- Dashboard with calendar timeline, task management, AI planning
- Gemini 3 Flash AI planner for schedule optimization
- Decision log showing AI actions and reasoning
- Full CRUD for tasks with priority levels
- Session management via MongoDB
- **Glassmorphism UI redesign** — 3-level glass token system (blur 8/16/24px), surface hierarchy, glass buttons/inputs/cards, animated background orbs, inner highlight gradients, 150-300ms ease-out motion, backdrop-filter with fallback

## Prioritized Backlog
### P0 (Critical)
- None remaining for MVP

### P1 (High)
- Live rescheduling (auto-detect calendar conflicts)
- Conflict detection and resolution UI
- Task editing (inline edit task title/priority)

### P2 (Nice to have)
- Multi-day planning view
- Energy-based scheduling
- Recurring task support
- Calendar event creation from dashboard directly
- User preferences (working hours, timezone)

## Next Tasks
1. Test full Google OAuth flow end-to-end with real user
2. Add live rescheduling conflict detection
3. Add task editing capability
4. Add weekly calendar view option
