# Testing Instructions for Chief AI Agent

This document provides comprehensive instructions for testing the **Chief AI Agent** application, both locally and in the deployed environment.

## 🧪 1. Local Development Testing

Before deploying, it's crucial to verify the application works locally.

### Prerequisites
- Node.js (v18+)
- Python (v3.11+)
- MongoDB (Local or Atlas connection string)
- valid `.env` files in `backend/` and `frontend/`

### Startup
1.  **Run the App:** Double-click `start-app.bat` in the root directory.
2.  **Verify Terminals:** Ensure two terminal windows open (one for Backend, one for Frontend) without errors.

### Backend Verification
- **Health Check:** Open `https://chief-ai-autonomous-agent-1.onrender.com/docs`. You should see the Swagger UI.
- **Test Endpoint:** Try the `/` endpoint (GET). It should return `{"message": "Chief AI Agent Backend is running"}`.
- **Database Connection:** Check the backend terminal logs. Look for: `connected to mongodb`.

### Frontend Verification
- **Access UI:** Open `http://localhost:3000`.
- **Login Flow:** Click "Sign In with Google". Verify you are redirected and logged in successfully.
- **Dashboard:** Ensure your tasks and analytics load correctly.

---

## 🤖 2. Automated Testing

### Backend Tests
*Currently, the backend does not have a dedicated test suite. Future tests should be added using `pytest`.*

To run tests (once implemented):
```bash
cd backend
pytest
```

### Frontend Tests
The frontend uses `react-scripts` (via `craco`) for testing.

To run the test suite:
```bash
cd frontend
npm test
```
*Note: This runs the interactive test watcher. Press `a` to run all tests.*

---

## 🚀 3. Deployment Verification (Production)

After deploying to **Vercel** and **Render**, follow these steps to verify the live environment.

### A. Connectivity Check
1.  **Frontend URL:** Go to the provided Vercel URL (e.g., `https://frontend-alpha-teal-68.vercel.app`).
2.  **Backend Response:** Open the browser's Developer Tools (F12) -> Network tab.
3.  Refresh the page. Look for a request to `https://chief-ai-autonomous-agent.onrender.com/api/...`.
    - **Status 200:** Success.
    - **Status Pending (Long):** Backend is waking up (Free Tier). Wait ~60s.
    - **Status 500/Cors Error:** Check Render logs or CORS settings.

### B. User Acceptance Testing (UAT) Scenarios

#### Scenario 1: New User Onboarding
1.  Open the live Frontend URL in an Incognito/Private window.
2.  Click "Get Started" or "Sign In".
3.  Authenticate with a Google account.
4.  **Success Criteria:** User is redirected to the Dashboard with a welcome message.

#### Scenario 2: Creating a Task
1.  Navigate to "Tasks" or "Planner".
2.  Create a new task (e.g., "Test Deployment Task").
3.  Set a date and priority.
4.  **Success Criteria:** The task appears in the list immediately and persists after a page refresh (verifies MongoDB write/read).

#### Scenario 3: AI Planner Execution
1.  Click the "Auto-Plan" or "Optimize" button (if available).
2.  **Success Criteria:** The AI generates a schedule or organizes tasks without throwing a backend error.

---

## 🐛 4. Troubleshooting & Reporting

### Common Issues
- **Backend "Not Found":** The Render service might be sleeping. Wait 1 minute and refresh.
- **CORS Error:** Ensure `FRONTEND_URL` in Render environment variables matches your Vercel URL exactly.
- **Google Login Error:** Verify `GOOGLE_REDIRECT_URI` in Render matches the authorized redirect URI in Google Cloud Console.

### Reporting Bugs
If you encounter issues not listed here:
1.  Capture a screenshot of the error.
2.  Copy the console logs (F12 -> Console).
3.  Open an issue in the standard project bug tracker.
