# CivicFix - Community Issue Reporting Platform

CivicFix is a complete MERN application for reporting, tracking, and resolving community maintenance problems. It includes JWT authentication, server-enforced roles, searchable issue feeds, reporter workflows, coordinator statistics and management, validated status transitions, resolution notes, and a permanent update timeline.

## Stack

- React 19, React Router, Tailwind CSS, Axios, Lucide icons
- Node.js, Express 5, MongoDB, Mongoose
- JWT authentication, bcrypt password hashing, Zod validation
- Vitest, Supertest, Testing Library, mongodb-memory-server

## Quick start

Requirements: Node.js 20+ and MongoDB 7+.

```bash
npm install
cp server/.env.example server/.env
cp client/.env.example client/.env
npm run seed
npm run dev
```

Open `http://localhost:5173`. The API runs at `http://localhost:5050` (port 5000 is commonly reserved by macOS AirPlay).

Development role accounts created by `npm run seed` (both use password `CivicFix123`):

| Role | Email |
|---|---|
| Coordinator | coordinator@civicfix.test |
| Viewer | viewer@civicfix.test |

Never commit `.env`. Use a long random `JWT_SECRET` outside local development. Public registration intentionally creates reporter accounts only; coordinator and viewer accounts must be provisioned by an administrator or seed process.

## Commands

```bash
npm run dev       # API and client with hot reload
npm run build     # production client build
npm test          # server and client test suites
npm run seed      # safely provision Coordinator and Viewer; never deletes data
npm run verify:persistence # execute real API + MongoDB workflow verification
npm start         # start the API
```

## Roles and permissions

- **Reporter:** register/login, submit an issue, browse the feed, filter/search, view details and timeline, view personal reports.
- **Coordinator:** browse all issues, view database-backed summary counts, add update notes, change statuses, resolve with a required note.
- **Viewer:** browse, search, filter, and view public issue details; cannot submit or modify.

All write permissions are enforced by API middleware. The UI is not treated as a security boundary.

## Status workflow

Valid transitions are:

```text
Submitted -> Under Review | Rejected
Under Review -> In Progress | Rejected
In Progress -> Resolved | Under Review
Resolved -> In Progress
Rejected -> Under Review
```

Resolution uses the dedicated endpoint and requires a resolution note. Every creation, status change, and coordinator note creates an `IssueUpdate` record. Reopening clears the former resolution metadata.

## REST API

All request/response bodies are JSON. Protected routes require `Authorization: Bearer <token>`.

| Method | Route | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register reporter/viewer |
| POST | `/api/auth/login` | Public | Authenticate and receive JWT |
| GET | `/api/auth/me` | Authenticated | Current user |
| POST | `/api/auth/logout` | Authenticated | Client logout acknowledgement |
| POST | `/api/issues` | Reporter | Submit issue |
| GET | `/api/issues` | Public | Paginated/searchable issue feed |
| GET | `/api/issues/:id` | Public | Issue and timeline |
| GET | `/api/me/issues` | Reporter | Reporter's own issues |
| PATCH | `/api/issues/:id/status` | Coordinator | Validated non-resolution status change |
| POST | `/api/issues/:id/updates` | Coordinator | Add timeline note |
| PATCH | `/api/issues/:id/resolve` | Coordinator | Resolve with note |
| GET | `/api/coordinator/summary` | Coordinator | Accurate grouped counts |
| GET | `/api/health` | Public | Health check |

`GET /api/issues` supports `search`, `category`, `priority`, `status`, `location`, `page`, and `limit` query parameters.

## Database schema

- **User:** `name`, unique normalized `email`, hidden `passwordHash`, `role`, timestamps.
- **Issue:** reporter reference, title, category, description, approximate location, priority, status, optional image URL, resolution note/time, timestamps. Search and filter indexes are included.
- **IssueUpdate:** issue and actor references, old/new statuses, note, timestamps. Notes without a status change use identical old/new values.

## Project layout

```text
client/src/        React pages, reusable components, auth context, API client
server/src/models  Mongoose schemas
server/src/controllers MVC request handlers
server/src/routes  REST route definitions
server/src/middleware Authentication, authorization, validation, errors
server/src/services Status transition business rules and consistency handling
server/tests       API integration tests against an in-memory MongoDB
```

## Demonstration screenshots

- [Landing page](screenshots/landing-page.png)
- [Reporter dashboard](screenshots/reporter-dashboard.png)
- [Issue details and status timeline](screenshots/issue-details-timeline.png)
- [Coordinator dashboard and management table](screenshots/coordinator-dashboard.png)

The application also includes dedicated registration, login, submission, issue feed, My Reports, Unauthorized, and Not Found pages. Use the seeded accounts above to demonstrate each role.

## Production notes

Build the client with `npm run build`, host `client/dist` on a static host, and deploy the API with `NODE_ENV=production`, a managed MongoDB URI, a strong JWT secret, and the deployed client URL in `CLIENT_URL`. Use HTTPS. JWT logout here removes the token client-side; for immediate server-side revocation, add a token denylist or short-lived access tokens with refresh-token rotation.

## Confirm MongoDB persistence

Set `MONGODB_URI` in `server/.env`. For local MongoDB, the default is:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/civicfix
```

Start MongoDB, run `npm run dev`, and then run `npm run verify:persistence` in another terminal. The verifier registers a clearly labeled test reporter through the API, submits **Streetlight Not Working**, checks the MongoDB document directly, checks My Reports and filters, confirms a reporter receives `403` for a status update, signs in as the development coordinator, advances and resolves the issue, and verifies the timeline and summary counts. Run `npm run clean:demo -w server` afterward to remove only these known test fixtures.

After restarting `npm run dev`, confirm the exact same record remains:

```bash
npm run verify:persistence -w server -- check
```

You can also inspect the collections directly with MongoDB Shell:

```bash
mongosh "$MONGODB_URI"
use civicfix
db.users.find({}, { name: 1, email: 1, role: 1 })
db.issues.find({}, { title: 1, status: 1, resolutionNote: 1, resolvedAt: 1 })
db.issueupdates.find({}).sort({ createdAt: 1 })
```
