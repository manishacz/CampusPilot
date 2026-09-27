# Campus Workflow AI (CampusPilot)

Document-to-task compiler for engineering students. Ingests unstructured campus
documents (placement drives, scholarship circulars, exam notices) and emits a
structured, prioritized, localized action queue.

- Product/architecture spec: see `PRD_for_project.pdf` and the Phase 0→10 build plan.
- Frontend dev server: see [`frontend/README.md`](frontend/README.md) — Vite + React, port 5173.
- Backend dev server: see [`backend/README.md`](backend/README.md) — FastAPI + uvicorn, port 8000.

## Quick start (Phase 0)

```bash
# terminal 1 — backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# terminal 2 — frontend
cd frontend
npm install
cp .env.example .env.local   # VITE_API_BASE_URL=http://localhost:8000
npm run dev                  # http://localhost:5173
```

Exit criterion for Phase 0: the frontend renders CampusPilot in demo/mock mode
(unchanged behavior), `GET http://localhost:8000/health` returns
`{"status": "healthy"}`, and both processes run concurrently without port
conflicts or CORS errors in the browser console.
