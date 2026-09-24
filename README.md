# Campus Support Desk
### Assignment 4 — Student Support & Ticket Management
Edumerge Solutions · Pre-Drive Product Engineering Assignment

A working ticket/support system for a college where students raise requests
(fees, attendance, ID cards, documents, certificates, other) and staff own,
prioritize, and resolve them, with SLA tracking, ageing, activity history,
and management visibility.

**Stack:** Angular 18 (frontend) + Node.js/Express (backend API) + PostgreSQL (database).

---

## 1. How to run it

Two projects, run side by side. Requires Node.js 18+.

**Backend** (terminal 1):
```bash
cd backend
npm install
npm run seed     # populates database schema, demo users, sample tickets & activity logs
npm start        # API at http://localhost:3000
```

**Frontend** (terminal 2):
```bash
cd frontend
npm install
npm start        # Angular dev server at http://localhost:4200, proxies /api to :3000
```

Open `http://localhost:4200`. Use the **"Acting as"** dropdown top-right to
switch between the seeded student/staff/admin users — the app doesn't need
a login flow to demonstrate role-based actions (see Assumptions).

Data is stored in PostgreSQL (configured via `.env` or defaults to `localhost:5432`).
*Note: If backend/database is offline, the frontend automatically activates an in-memory preview mode with demo fallback data and displays a warning banner.*

To build the frontend for production (static files):
```bash
cd frontend && npm run build   # output in frontend/dist/frontend
```

---

## 2. Problem understanding

Students raise requests across several categories that are handled by
different offices (Accounts, Academics, Administration). Today this likely
happens over email/WhatsApp/in person, with no shared record of what's
pending, who owns it, or how long it's been sitting. The core product need
isn't "a form that creates a row" — it's **visibility and accountability**:
a manager should be able to see what's overdue and unassigned at a glance,
and a student should be able to trust that a raised issue won't get lost.

That shaped three priorities:
1. **Nothing falls through the cracks** — every ticket has an owner path, an SLA clock, and a full audit trail.
2. **Status has meaning** — status changes follow a defined state machine, not a free-text field, so reports are trustworthy.
3. **The dashboard answers "what needs attention today"**, not just "list all tickets."

---

## 3. Assumptions

- **No authentication.** The brief doesn't ask for login/security, so I used a "pick your identity" dropdown to demonstrate role-specific actions without spending time on auth. In production this would be SSO against the college directory.
- **Three roles**: student (raises tickets), staff (owns/resolves tickets in their department), admin (full visibility, reassigns across departments).
- **Auto-routing by category**: each category maps to a default owning department (e.g. `fees` → Accounts) so tickets aren't born unassigned-and-ownerless. A ticket can still be manually reassigned.
- **SLA policy is by priority**: urgent = 6h, high = 24h, medium = 48h, low = 96h.
- **Dev-mode CORS is wide open** (`Access-Control-Allow-Origin: *`) so the Angular dev server can call the API without extra setup.

---

## 4. Ticket lifecycle (state machine)

```
open ──> in_progress ──> resolved ──> closed
  │           │                         ^
  │           ├──> pending_student ─────┤ (back to in_progress, or close)
  │           ├──> pending_department ──┤
  │                                     │
  └─────────────────────────────────────┘
resolved/closed ──> reopened ──> (back into the flow)
```

Transitions are **validated server-side** (`backend/src/services/ticketService.js` → `TRANSITIONS` map) and mirrored on the frontend (`frontend/src/app/models/ticket.model.ts`). For example, `open → resolved` directly is rejected — a ticket must pass through `in_progress` first.

`pending_student` and `pending_department` exist because a lot of real ticket ageing time isn't "staff being slow" — it's "waiting on the student to submit a document" or "waiting on another department." Splitting these out ensures dashboard reports remain fair and actionable.

---

## 5. Data model

- **users** — id, name, email, role (`student` / `staff` / `admin`), department
- **tickets** — subject, description, category, priority, status, raised_by, assigned_to, department, sla_hours, sla_due_at, resolved_at, closed_at, timestamps
- **ticket_activity** — append-only audit log: every create, status change, reassignment, priority change, and comment, with actor and timestamp

---

## 6. Architecture & stack

### Backend — `backend/`
- **Node.js + Express**, REST API (`server.js`)
- **PostgreSQL** via `pg` pool — parameterized queries preventing SQL injection.
- API is stateless JSON over HTTP; the frontend is a separate app that talks to it over `/api/*`.

### Frontend — `frontend/`
- **Angular 18**, standalone components (no NgModules), Angular signals (`AppStateService`) for shared application state.
- **Structure**:
  - `services/api.service.ts` — Typed `HttpClient` wrapper with RxJS fallback resilience for offline preview mode.
  - `services/app-state.service.ts` — Signal store for active user role, current view tab, and detail modal state.
  - `models/ticket.model.ts` — Interfaces, status state machine rules, and SLA definitions.
  - `components/` — Standalone views (`dashboard`, `ticket-list`, `new-ticket`, `ticket-modal`, `ticket-table`, `topbar`).

---

## 7. Edge cases considered

- **Invalid status transitions** are rejected by the API with an error listing valid options, while the UI only presents valid state transitions.
- **Unassigned tickets** are tracked as a dedicated dashboard metric to highlight ownerless issues.
- **SLA breach calculation excludes resolved/closed tickets** — closed tickets do not clutter the active SLA breach alert queue.
- **Priority escalation resets the SLA clock from now**, giving urgent escalations a fresh 6-hour window.
- **Offline Backend Resilience** — if the backend server is unreachable, the frontend automatically falls back to in-memory demo data with an offline warning banner.

---

## Mandatory AI Usage Report

**AI TOOL USED:** Antigravity (Gemini 3.6 Flash / Google DeepMind AI Coding Assistant)

**WHAT I ASKED AI TO DO:**
1. Verify frontend-backend integration, API endpoints, proxy configuration, and PostgreSQL data access layer.
2. Troubleshoot blank UI rendering issues when backend is disconnected and build graceful RxJS error fallback mechanisms.
3. Create PostgreSQL seeding scripts (`seed.js`), audit code against Assignment 4 requirements, and update documentation.

**PROMPT THAT WAS MOST USEFUL:**
"check my UI is empty" & "check if its fine or else develop" — this triggered an end-to-end audit of component lifecycle conditionals, signal initialization, RxJS error handling, database schema constraints, and SLA state machine logic.

**CODE GENERATED BY AI:**
- Full Angular 18 standalone components (`app-topbar`, `app-dashboard`, `app-ticket-list`, `app-new-ticket`, `app-ticket-modal`, `app-ticket-table`).
- Express API controllers, services, routes, PostgreSQL database initialization script (`db.js`), and seed script (`seed.js`).

**CODE I MODIFIED:**
- `api.service.ts`: Added RxJS `catchError` handlers and mock fallback data structures.
- `app-state.service.ts`: Updated signal state to provide default initial user and track backend offline status.
- `app.component.html`: Removed blocking `*ngIf` from `<main>` and added the offline warning banner.
- `styles.css`: Added styles for `.offline-banner`.
- `seed.js`: Added full table truncation and sample data population for users, tickets, and activity logs.

**AI OUTPUT THAT WAS WRONG:**
1. `app.component.html` placed `*ngIf="appState.currentUser()"` on `<main>` without fallback error handling, which caused the entire main UI to blank out whenever backend API calls failed or were delayed.
2. The initial mock object for `getTicket` in `api.service.ts` inferred `action` as a generic `string`, causing TypeScript compilation error `TS2322`.
3. `README.md` initially referenced SQLite instead of PostgreSQL.

**HOW I IDENTIFIED THE PROBLEM:**
1. Inspected browser DOM rendering and traced signal evaluation in `app.component.html` and `app-state.service.ts`.
2. Executed `npm run build` in `frontend/` to catch TypeScript compiler errors.
3. Inspected `backend/package.json` and `backend/src/config/db.js` to verify PostgreSQL connection drivers.

**HOW I FIXED IT:**
1. Removed blocking `*ngIf` from `<main>`, provided default signal states, and added RxJS `catchError` fallbacks in `api.service.ts`.
2. Added `as const` type assertion to `action` in `api.service.ts` to satisfy `TicketDetail` interface constraints.
3. Updated `seed.js` to populate PostgreSQL tables and updated `README.md` to reflect PostgreSQL and the completed AI Usage Report.
