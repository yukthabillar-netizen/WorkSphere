# WorkSphere — Product Requirements Document (PRD)

> **Audience:** AI coding agent (Google Antigravity). Build this project end-to-end from scratch.
> **Stack:** MERN — MongoDB, Express.js, React, Node.js.
> **Rule of engagement:** Follow this document literally. Where something is ambiguous, choose the simplest option consistent with the spec, note the decision in `DECISIONS.md`, and continue. Do not stop to ask questions.

---

## 1. Product Overview

**WorkSphere** is a collaborative workspace platform where teams manage tasks, track project progress, and communicate in one place. It must feel fast, calm, and modern — closer to Linear/Notion than to a legacy enterprise tool.

### 1.1 Goals
1. Let teams create workspaces, invite members, and organize work into projects.
2. Make task creation, assignment, and status tracking effortless (Kanban + list views).
3. Keep conversation next to the work (task comments, activity feed, notifications).
4. Provide clear visibility into progress (dashboard, project progress bars, charts).
5. Deliver a polished, accessible, responsive UI with light and dark themes.

### 1.2 Non-Goals (v1)
- Native mobile apps, billing/payments, third-party integrations (Slack, GitHub), time tracking, file storage beyond small attachments, SSO/SAML.

### 1.3 Target Users
| Persona | Need |
|---|---|
| **Team Member** | See "my tasks", update status quickly, comment. |
| **Project Manager / Admin** | Create projects, assign work, monitor progress, manage members. |
| **Workspace Owner** | Full control: members, roles, workspace settings. |

---

## 2. Tech Stack & Tooling

### Frontend
- React 18 + **Vite**, JavaScript (JSX) — TypeScript optional but not required
- React Router v6
- State: **Zustand** for client state, **TanStack Query (React Query)** for server state
- Styling: **Tailwind CSS** + **shadcn/ui** (Radix primitives) + `lucide-react` icons
- Forms: React Hook Form + Zod
- Drag & drop: `@dnd-kit/core` + `@dnd-kit/sortable`
- Charts: Recharts
- Animation: Framer Motion (subtle only)
- Toasts: `sonner`
- Dates: `date-fns`

### Backend
- Node.js 20 + Express.js
- MongoDB + Mongoose
- Auth: JWT (access token 15 min + refresh token 7 days in httpOnly cookie), `bcryptjs`
- Validation: Zod (or `express-validator`)
- Realtime: **Socket.IO** (notifications, live task updates, comments)
- Security: `helmet`, `cors`, `express-rate-limit`, `express-mongo-sanitize`, `cookie-parser`
- Logging: `morgan` + `winston`
- Testing: Jest + Supertest (backend), Vitest + React Testing Library (frontend)

### Tooling
- ESLint + Prettier, `.env.example` files, `concurrently` for running both apps, optional Docker Compose (mongo + api + web).

---

## 3. Repository Structure

```
worksphere/
├── PRD.md
├── DECISIONS.md
├── README.md
├── docker-compose.yml
├── package.json                 # root scripts: dev, build, seed, test
├── client/
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── .env.example
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── routes/              # route definitions + ProtectedRoute
│       ├── layouts/             # AuthLayout, AppLayout (sidebar + topbar)
│       ├── pages/               # Login, Register, Dashboard, Projects, ProjectDetail, MyTasks, Team, Settings, NotFound
│       ├── components/
│       │   ├── ui/              # shadcn components
│       │   ├── tasks/           # TaskCard, TaskBoard, TaskList, TaskModal, TaskFilters
│       │   ├── projects/        # ProjectCard, ProjectForm, ProgressBar
│       │   ├── comments/        # CommentThread, CommentInput
│       │   ├── common/          # EmptyState, Skeletons, Avatar, ConfirmDialog, CommandPalette
│       │   └── charts/
│       ├── hooks/               # useAuth, useSocket, useDebounce, useTheme
│       ├── services/            # api.js (axios instance), authService, taskService, ...
│       ├── store/               # zustand stores
│       ├── lib/                 # utils, constants, zod schemas
│       └── styles/              # globals.css (design tokens)
└── server/
    ├── .env.example
    ├── package.json
    └── src/
        ├── server.js            # http + socket bootstrap
        ├── app.js               # express app, middleware, routes
        ├── config/              # db.js, env.js
        ├── models/              # User, Workspace, Project, Task, Comment, Notification, Activity
        ├── controllers/
        ├── routes/
        ├── middleware/          # auth, role, validate, error, rateLimit
        ├── services/            # business logic
        ├── sockets/             # socket handlers
        ├── utils/               # ApiError, asyncHandler, tokens
        ├── seed/                # seed.js (demo data)
        └── tests/
```

---

## 4. Roles & Permissions

Roles are scoped **per workspace**.

| Capability | Owner | Admin | Member | Viewer |
|---|:--:|:--:|:--:|:--:|
| Delete workspace / transfer ownership | ✅ | ❌ | ❌ | ❌ |
| Invite / remove members, change roles | ✅ | ✅ | ❌ | ❌ |
| Create / edit / archive projects | ✅ | ✅ | ❌ | ❌ |
| Create tasks | ✅ | ✅ | ✅ | ❌ |
| Edit any task | ✅ | ✅ | ❌ (own/assigned only) | ❌ |
| Change status of assigned task | ✅ | ✅ | ✅ | ❌ |
| Comment | ✅ | ✅ | ✅ | ❌ |
| View everything | ✅ | ✅ | ✅ | ✅ |

---

## 5. Functional Requirements

### 5.1 Authentication & Account
- **FR-A1** Register with name, email, password (min 8 chars, 1 number). Email unique, case-insensitive.
- **FR-A2** Login → returns access token (memory) + refresh token (httpOnly, SameSite=Lax cookie).
- **FR-A3** Silent token refresh via Axios interceptor; on failure redirect to `/login`.
- **FR-A4** Logout clears cookie and client state.
- **FR-A5** Profile: edit name, avatar (initials fallback, optional image URL), change password.
- **FR-A6** Forgot/reset password UI + endpoint (token logged to console in dev; email integration out of scope).

### 5.2 Workspaces
- **FR-W1** On first signup, auto-create a personal workspace ("{Name}'s Workspace").
- **FR-W2** Users can create additional workspaces and switch via a sidebar switcher.
- **FR-W3** Invite members by email → creates an invite (token link `/invite/:token`). If the user exists, add on acceptance; otherwise prompt signup.
- **FR-W4** Manage members: change role, remove member.
- **FR-W5** Workspace settings: rename, description, accent color.

### 5.3 Projects
- **FR-P1** CRUD projects: name, description, color, icon (emoji), start/due date, status (`active`, `on_hold`, `completed`, `archived`).
- **FR-P2** Project members (subset of workspace members).
- **FR-P3** Computed progress = completed tasks / total tasks (shown as progress bar + %).
- **FR-P4** Project detail has tabs: **Board**, **List**, **Overview**, **Activity**.

### 5.4 Tasks (core)
- **FR-T1** Create task: title (required), description (rich-text-lite / markdown), project, assignee(s), status, priority, due date, labels, subtasks (checklist).
- **FR-T2** Statuses: `todo`, `in_progress`, `in_review`, `done`. Priorities: `low`, `medium`, `high`, `urgent`.
- **FR-T3** **Kanban board** with drag-and-drop between columns and reordering within a column; optimistic updates with rollback on error.
- **FR-T4** **List view**: sortable table (title, status, priority, assignee, due date), inline status/priority change.
- **FR-T5** Task detail opens in a **right-side drawer/modal** (URL-addressable: `/projects/:id?task=:taskId`).
- **FR-T6** Filters: assignee, status, priority, label, due (overdue / today / this week), text search (debounced 300 ms). Filters persist in URL query.
- **FR-T7** Quick-add: press `C` anywhere to open "New task" dialog.
- **FR-T8** Overdue tasks highlighted with a red due-date chip.
- **FR-T9** Soft delete with undo toast (5 s).
- **FR-T10** **My Tasks** page: all tasks assigned to me across projects, grouped by Today / Upcoming / Overdue / No date.

### 5.5 Collaboration & Communication
- **FR-C1** Comments on tasks (create, edit own, delete own; admins can delete any). Supports `@mentions` of workspace members.
- **FR-C2** **Activity log** per task and per project (created, status changed, assigned, commented, due date changed) with actor + timestamp.
- **FR-C3** **Notifications**: assigned to a task, mentioned, status changed on a task I own/created, due soon (within 24 h, computed on fetch). Bell icon with unread badge, dropdown list, "Mark all read".
- **FR-C4** **Realtime** via Socket.IO: new comments, task moves, assignments, and notifications appear without refresh. Join rooms `workspace:{id}` and `project:{id}`.
- **FR-C5** Presence (optional, nice-to-have): avatars of users currently viewing a project.

### 5.6 Dashboard
- **FR-D1** Greeting + date, stats cards: *My open tasks*, *Due this week*, *Overdue*, *Completed this week*.
- **FR-D2** Charts: tasks by status (donut), completion trend over last 14 days (area/line), workload per member (bar).
- **FR-D3** "Recent activity" feed and "Projects at a glance" with progress bars.

### 5.7 Team Page
- **FR-M1** Member directory with avatar, role, open-task count; click for member's tasks.

### 5.8 Global UX Features
- **FR-G1** Command palette (`Cmd/Ctrl + K`): jump to projects, tasks, pages; create task.
- **FR-G2** Global search (tasks + projects) from the topbar.
- **FR-G3** Theme toggle: light / dark / system, persisted.
- **FR-G4** Keyboard shortcuts help dialog (`?`).

---

## 6. Data Models (Mongoose)

All schemas use `timestamps: true`. Index fields marked ⚡.

### User
```js
{
  name: String (required, trim),
  email: String (required, unique ⚡, lowercase),
  passwordHash: String (required, select: false),
  avatarUrl: String,
  lastActiveWorkspace: ObjectId -> Workspace,
  refreshTokenHash: String (select: false)
}
```

### Workspace
```js
{
  name: String (required),
  description: String,
  accentColor: String (default '#6366f1'),
  owner: ObjectId -> User,
  members: [{ user: ObjectId -> User ⚡, role: enum['owner','admin','member','viewer'] }],
  invites: [{ email, token, role, expiresAt, status: enum['pending','accepted','revoked'] }]
}
```

### Project
```js
{
  workspace: ObjectId ⚡,
  name: String (required),
  description: String,
  color: String, icon: String,
  status: enum['active','on_hold','completed','archived'] (default 'active'),
  startDate: Date, dueDate: Date,
  members: [ObjectId -> User],
  createdBy: ObjectId -> User
}
```

### Task
```js
{
  workspace: ObjectId ⚡,
  project: ObjectId ⚡,
  title: String (required),
  description: String,
  status: enum['todo','in_progress','in_review','done'] ⚡,
  priority: enum['low','medium','high','urgent'],
  assignees: [ObjectId -> User] ⚡,
  labels: [String],
  dueDate: Date ⚡,
  subtasks: [{ title: String, done: Boolean }],
  order: Number,                // position within a status column
  completedAt: Date,
  createdBy: ObjectId -> User,
  deletedAt: Date               // soft delete
}
```
Compound index: `{ project: 1, status: 1, order: 1 }`.

### Comment
```js
{ task: ObjectId ⚡, author: ObjectId, body: String, mentions: [ObjectId], editedAt: Date }
```

### Notification
```js
{ user: ObjectId ⚡, type: enum['assigned','mentioned','status_changed','due_soon','comment'],
  task: ObjectId, project: ObjectId, actor: ObjectId, message: String, read: { type: Boolean, default: false } }
```

### Activity
```js
{ workspace, project, task, actor: ObjectId, action: String, meta: Object }
```

---

## 7. REST API Specification

Base URL: `/api/v1`. All responses: `{ success: boolean, data?, message?, errors? }`. Errors use proper HTTP codes (400/401/403/404/409/422/500). Protected routes need `Authorization: Bearer <token>`. List endpoints support `?page=&limit=&sort=&q=`.

### Auth
| Method | Route | Description |
|---|---|---|
| POST | `/auth/register` | Create user + personal workspace |
| POST | `/auth/login` | Login |
| POST | `/auth/refresh` | Rotate access token |
| POST | `/auth/logout` | Logout |
| GET | `/auth/me` | Current user + workspaces |
| PATCH | `/auth/me` | Update profile |
| PATCH | `/auth/password` | Change password |
| POST | `/auth/forgot-password`, `/auth/reset-password` | Reset flow |

### Workspaces
| Method | Route | Description |
|---|---|---|
| GET/POST | `/workspaces` | List mine / create |
| GET/PATCH/DELETE | `/workspaces/:id` | Read / update / delete |
| POST | `/workspaces/:id/invites` | Invite by email |
| POST | `/invites/:token/accept` | Accept invite |
| PATCH | `/workspaces/:id/members/:userId` | Change role |
| DELETE | `/workspaces/:id/members/:userId` | Remove member |

### Projects
| Method | Route | Description |
|---|---|---|
| GET/POST | `/workspaces/:wid/projects` | List / create |
| GET/PATCH/DELETE | `/projects/:id` | Read (with progress) / update / archive |
| GET | `/projects/:id/activity` | Activity feed |

### Tasks
| Method | Route | Description |
|---|---|---|
| GET | `/projects/:pid/tasks` | List with filters |
| POST | `/projects/:pid/tasks` | Create |
| GET/PATCH/DELETE | `/tasks/:id` | Read / update / soft-delete |
| PATCH | `/tasks/:id/move` | `{ status, order }` — drag & drop |
| POST | `/tasks/:id/restore` | Undo delete |
| GET | `/tasks/mine` | My tasks across workspace |
| GET/POST | `/tasks/:id/comments` | List / add comment |
| PATCH/DELETE | `/comments/:id` | Edit / delete |

### Dashboard, Notifications, Search
| Method | Route | Description |
|---|---|---|
| GET | `/workspaces/:id/dashboard` | Stats + chart data |
| GET | `/notifications` | List (paginated) |
| PATCH | `/notifications/:id/read`, `/notifications/read-all` | Mark read |
| GET | `/search?q=` | Tasks + projects |

### Socket.IO Events
- Client → server: `workspace:join`, `project:join`, `project:leave`
- Server → client: `task:created`, `task:updated`, `task:moved`, `task:deleted`, `comment:created`, `notification:new`, `presence:update`

---

## 8. UI / UX Specification

### 8.1 Design Principles
1. **Clarity first** — one primary action per screen, generous whitespace, strong hierarchy.
2. **Speed** — optimistic UI, skeleton loaders (no blocking spinners), keyboard shortcuts.
3. **Calm & modern** — soft surfaces, subtle borders, restrained color; color is used to signal status/priority, not to decorate.
4. **Consistency** — every component comes from the design system below.
5. **Accessible** — WCAG 2.1 AA contrast, full keyboard navigation, visible focus rings, ARIA labels, `prefers-reduced-motion` respected.

### 8.2 Design Tokens (define as CSS variables in `globals.css`; map in Tailwind config)

**Typography:** `Inter` (UI), `JetBrains Mono` (code/ids). Scale: 12 / 14 (base) / 16 / 18 / 20 / 24 / 30 / 36. Weights 400 / 500 / 600. Line-height 1.5 body, 1.25 headings.

**Spacing:** 4-pt grid (4, 8, 12, 16, 24, 32, 48, 64).
**Radius:** 6 (inputs/buttons), 10 (cards), 16 (modals), full (avatars/chips).
**Shadows:** `sm` for cards, `md` for dropdowns, `lg` for modals/drawers. Very soft, low opacity.

**Colors**

| Token | Light | Dark |
|---|---|---|
| `--bg` | `#FAFAFB` | `#0B0D12` |
| `--surface` | `#FFFFFF` | `#12151C` |
| `--surface-2` | `#F3F4F6` | `#1A1E27` |
| `--border` | `#E5E7EB` | `#262B36` |
| `--text` | `#0F172A` | `#E6E8EE` |
| `--text-muted` | `#64748B` | `#8B93A7` |
| `--primary` | `#6366F1` (indigo) | `#818CF8` |
| `--primary-fg` | `#FFFFFF` | `#0B0D12` |
| `--success` | `#10B981` | `#34D399` |
| `--warning` | `#F59E0B` | `#FBBF24` |
| `--danger` | `#EF4444` | `#F87171` |
| `--info` | `#0EA5E9` | `#38BDF8` |

**Status colors:** todo = slate, in_progress = blue, in_review = amber, done = green.
**Priority colors:** low = slate, medium = blue, high = orange, urgent = red (with flag icon).

### 8.3 App Shell (AppLayout)
- **Left sidebar (256 px, collapsible to 72 px icon rail; drawer on mobile):**
  - Workspace switcher (avatar + name + chevron) at top
  - Nav: Dashboard, My Tasks, Projects (expandable list with colored dots), Team, Settings
  - "+ New project" button, user menu at bottom
- **Topbar (56 px, sticky):** breadcrumb / page title, global search (⌘K trigger), notification bell, theme toggle, user avatar menu.
- **Content:** max-width 1400 px, 24 px padding, scrolls independently from the sidebar.

### 8.4 Page Specifications

**Login / Register (AuthLayout)**
Split screen: left = form (logo, heading, inputs with inline validation, primary button with loading state, link to alternate page); right (hidden < 1024 px) = gradient panel (indigo → violet) with product tagline and a mock board illustration built from CSS cards.

**Dashboard**
Row 1: 4 stat cards (icon, number, label, small delta). Row 2: 2/3 width "Completion trend" area chart + 1/3 "Tasks by status" donut. Row 3: "My tasks due soon" list + "Recent activity" feed. Row 4: "Projects at a glance" grid with progress bars.

**Projects (list)**
Responsive card grid (1/2/3/4 columns). Card: color strip, emoji icon, name, description (2-line clamp), progress bar with %, member avatar stack, due date, status badge. Toggle grid/table view. Empty state with illustration and CTA.

**Project Detail**
Header: icon, name, status badge, member avatars, "Invite", "+ New task". Tabs: **Board | List | Overview | Activity**.
- **Board:** 4 equal-width columns (horizontal scroll on mobile with snap). Column header: status dot, name, count, "+" quick add. **TaskCard**: title (2-line clamp), priority icon, label chips (max 2 + "+n"), due-date chip, assignee avatars, subtask progress (e.g., 2/5), comment count. Hover: elevated shadow; dragging: slight rotate + scale 1.02 + drop-shadow; drop target column highlights with dashed primary border.
- **List:** dense table, sticky header, row hover, inline dropdowns for status/priority/assignee.
- **Overview:** description, key dates, progress ring, member workload, mini charts.
- **Activity:** vertical timeline.

**Task Drawer (right-side, 560 px, full-screen on mobile)**
Sticky header with title (inline editable), close, "…" menu (duplicate, delete). Body: property grid (Status, Priority, Assignees, Due date, Labels, Project), Markdown description editor with preview, subtask checklist (add/check/delete/reorder), tabs for **Comments | Activity**. Footer: comment input (sticky) with @mention autocomplete.

**My Tasks**
Grouped accordion sections (Overdue, Today, Upcoming, No date) with checkbox-to-complete, project dot, priority, due date.

**Team** — table/grid of members with role select (admin only), open-task counts, remove action. "Invite member" modal.

**Settings** — tabs: Profile, Workspace, Members & Roles, Appearance, Danger zone.

**404 / Error** — friendly illustration, "Back to dashboard" button.

### 8.5 Component Behavior & States
- **Every async view needs 4 states:** loading (skeleton matching layout), empty (icon + message + CTA), error (message + Retry), populated.
- **Buttons:** primary / secondary / ghost / destructive; sizes sm/md/lg; loading spinner replaces icon and disables click.
- **Forms:** labels above inputs, inline error text in `--danger`, disabled submit while invalid or pending.
- **Modals/Drawers:** focus trap, `Esc` to close, click-outside to close (confirm if unsaved changes).
- **Toasts:** bottom-right, auto-dismiss 4 s, success/error/info variants, undo action where relevant.
- **Destructive actions** always use a ConfirmDialog (except soft-delete with undo).

### 8.6 Motion
- Durations: 120 ms (hover/press), 200 ms (dropdowns, tabs), 300 ms (drawer/modal). Easing `cubic-bezier(0.2, 0.8, 0.2, 1)`.
- Page transitions: 150 ms fade + 4 px upward slide. List items: staggered fade-in (max 8 items animated).
- Disable non-essential motion under `prefers-reduced-motion`.

### 8.7 Responsive Breakpoints
`sm 640` · `md 768` · `lg 1024` · `xl 1280`. Below `lg` the sidebar becomes a slide-over; Kanban scrolls horizontally with scroll-snap; tables collapse to stacked cards below `md`.

### 8.8 Keyboard Shortcuts
`⌘/Ctrl+K` palette · `C` new task · `/` focus search · `G then D` dashboard · `G then P` projects · `G then M` my tasks · `?` shortcuts help · `Esc` close overlay.

### 8.9 Microcopy
Friendly, short, action-oriented. Examples: empty board — *"Nothing here yet. Add your first task and get moving."*; success — *"Task moved to In Review."*; error — *"Couldn't save changes. Try again."*

---

## 9. Non-Functional Requirements

| Area | Requirement |
|---|---|
| **Performance** | LCP < 2.5 s on broadband; route-level code splitting (`React.lazy`); API p95 < 300 ms for list endpoints; paginate (default 20, max 100). |
| **Security** | Passwords hashed with bcrypt (cost 12); JWT secrets via env; refresh token rotation; rate-limit auth routes (10/min/IP); sanitize inputs; CORS restricted to `CLIENT_URL`; never return `passwordHash`; authorization check on **every** resource by workspace membership. |
| **Reliability** | Centralized error handler; graceful shutdown; DB reconnect logic; request IDs in logs. |
| **Accessibility** | WCAG 2.1 AA; axe checks pass on main pages. |
| **Browser support** | Latest 2 versions of Chrome, Edge, Firefox, Safari. |
| **Code quality** | ESLint clean, consistent folder structure, small components (< 250 lines), no hardcoded secrets, meaningful commit-style comments only where needed. |

---

## 10. Environment Variables

**server/.env.example**
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/worksphere
JWT_ACCESS_SECRET=change_me
JWT_REFRESH_SECRET=change_me_too
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=7d
CLIENT_URL=http://localhost:5173
```

**client/.env.example**
```
VITE_API_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000
```

---

## 11. Seed Data

`npm run seed` must create: 1 demo workspace, 4 users (owner, admin, 2 members; password `Password123`), 3 projects with varied statuses, ~30 tasks spread across statuses/priorities/due dates (include overdue and due-today), sample comments, and activity entries — so every screen looks rich on first run.

---

## 12. Implementation Plan (build in this order)

Complete each phase fully and verify it runs before starting the next.

1. **Scaffold** — monorepo, Vite + Tailwind + shadcn setup, Express app, Mongo connection, ESLint/Prettier, env files, root scripts.
2. **Design system** — tokens, theme provider (light/dark/system), base UI components, AppLayout shell (sidebar + topbar), skeleton and empty-state components.
3. **Auth** — models, endpoints, JWT + refresh, Login/Register pages, ProtectedRoute, Axios interceptors.
4. **Workspaces & Team** — workspace CRUD, switcher, invites, roles middleware, Team + Settings pages.
5. **Projects** — CRUD, cards grid, project detail shell with tabs.
6. **Tasks** — CRUD, Kanban with dnd-kit + optimistic moves, List view, Task drawer, filters synced to URL, My Tasks.
7. **Collaboration** — comments with mentions, activity log, notifications, Socket.IO realtime.
8. **Dashboard & Search** — stats endpoint, charts, command palette, global search.
9. **Polish** — animations, keyboard shortcuts, responsive QA, accessibility pass, error/empty states everywhere.
10. **Quality** — tests for auth, permissions, and task move logic; seed script; README with setup steps; optional Docker Compose.

---

## 13. Acceptance Criteria

The project is complete when all of the following are true:

- [ ] `npm run dev` from the root starts both client and API; `npm run seed` populates demo data.
- [ ] A new user can register, land in a personal workspace, create a project, add tasks, drag them across the board, assign teammates, and comment — all without page reloads.
- [ ] Two browsers logged in as different users see task moves, comments, and notifications update in realtime.
- [ ] Role permissions from §4 are enforced on the **server** (verified by tests), not just hidden in the UI.
- [ ] Light and dark themes both look correct on every page; no unreadable contrast.
- [ ] Every page is usable at 375 px width.
- [ ] Every data view has loading, empty, and error states.
- [ ] Lighthouse accessibility score ≥ 90 on Dashboard and Project Board.
- [ ] No console errors or unhandled promise rejections during the primary flows.
- [ ] README documents setup, env vars, scripts, folder structure, and demo credentials.

---

## 14. Final Instructions to the Agent

1. Build everything above; do not leave placeholder "TODO" screens.
2. Prioritize **visual polish and UX details** (spacing, hover/focus states, transitions, empty states) — they are as important as functionality.
3. Use real, working code only — no mocked API responses in the final app (except seed data in the DB).
4. After each phase, run the app and fix any errors before moving on.
5. When finished, output a short summary: what was built, how to run it, and any deviations recorded in `DECISIONS.md`.
