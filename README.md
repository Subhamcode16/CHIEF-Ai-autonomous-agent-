# CHIEF AI - Autonomous Scheduling Agent

**CHIEF** (Chief Executive Intelligent Forecaster) is an autonomous AI agent that actively manages your Google Calendar. It doesn't just list tasks; it understands your time, respects your preferences, and autonomously reschedules actively when conflicts arise or new tasks are added.

![CHIEF Dashboard](https://via.placeholder.com/800x400?text=CHIEF+AI+Dashboard+Preview)

## 🚀 Key Features

### 🧠 Autonomous Mode
- **Continuous Monitoring:** Runs in the background, watching for schedule changes every 10 seconds.
- **Auto-Replanning:** Automatically finds the best time for new tasks without user intervention.
- **Conflict Resolution:** Detects double-bookings (e.g., "Meeting" vs "Lunch") and intelligently suggests fixes.

### 📅 Real-Time Sync
- **Hybrid Sync Engine:** 
  - **Active Mode:** Polls Google Calendar every 10s for instant updates.
  - **Passive Mode:** Checks every 30s to keep resource usage low.
- **Bi-Directional:** Changes in Google Calendar app appear in CHIEF instantly, and viz-a-versa.

### 🗣️ Natural Language Preferences
- Tell CHIEF how you like to work:
  - *"I hate meetings before 10 AM"*
  - *"I need a 15-minute break after every deep work session"*
  - *"Keep my Friday afternoons free"*
- CHIEF parses these into strict scheduling rules using AI.

### 🔍 Transparent Decision Log
- **"Why Chief Acted":** Every autonomous move is logged with a clear reason.
- **Trust but Verify:** See exactly what was moved, when, and why.

---

## 🛠️ Tech Stack

### Core
- **Frontend:** React, Tailwind CSS, Framer Motion
- **Backend:** Python, FastAPI, Uvicorn
- **Database:** MongoDB (Motor async driver)
- **Auth:** Google OAuth 2.0

### AI & Intelligence
- **Model:** Google Gemini 2.5 Flash
- **Reasoning:** Custom-built conflict resolution & urgency scoring algorithms

### Integrations
- **Calendar:** Google Calendar API (Real-time read/write)

---

## 🏁 Getting Started

### Prerequisites
- Python 3.9+
- Node.js 16+
- MongoDB Instance
- Google Cloud Project with Calendar API enabled

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/chief-ai.git
   cd chief-ai
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # or venv\Scripts\activate on Windows
   pip install -r requirements.txt
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```

4. **Environment Variables**
   Create `.env` files in both `backend/` and `frontend/` directories.
   
   **Backend (.env):**
   ```env
   MONGO_URI=your_mongodb_uri
   DB_NAME=chief_db
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   GEMINI_API_KEY=your_gemini_key
   SECRET_KEY=your_session_secret
   FRONTEND_URL=http://localhost:3000
   ```

### Running the App

We've included a handy startup script:

**Windows:**
```powershell
.\start-app.bat
```

**Manual Start:**
1. Backend: `uvicorn server:app --reload --port 8000`
2. Frontend: `npm start`

---

## 📖 project Structure

```
chief-ai/
├── backend/
│   ├── ai_planner.py       # Core AI scheduling logic
│   ├── auto_replanner.py   # Autonomous background service
│   ├── conflict_resolver.py # Overlap detection algorithms
│   ├── server.py           # FastAPI endpoints
│   └── ...
├── frontend/
│   ├── src/
│   │   ├── components/     # UI Components (DecisionLog, StatusIndicator)
│   │   ├── pages/          # Dashboard, Login
│   │   └── ...
│   └── ...
└── ...
```

## 🛡️ License

MIT License - feel free to build on top of CHIEF!
