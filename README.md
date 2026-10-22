# WorkSphere 🚀

> **A collaborative workspace platform where modern teams manage tasks, track project roadmap progress, and communicate in one place.**

Built end-to-end to feel fast, calm, and responsive — closer to Linear/Notion with real-time sync, zero blocking spinners, and optimistic updates.

---

## 🌟 Key Features

- **Workspaces & Roles**: Multi-workspace architecture with granular role-based permissions (`Owner`, `Admin`, `Member`, `Viewer`) enforced directly at the server level.
- **Projects Roadmap**: Track progress percentages computed from completed tasks, milestone start/due dates, and member workload.
- **Interactive Kanban Board**: Drag-and-drop between columns and reorder within columns using `@dnd-kit`, featuring optimistic UI updates with rollback on error.
- **Dense List View**: Sortable table with inline status, priority, and assignee updates.
- **Task Drawer**: URL-addressable drawer (`/projects/:id?task=:taskId`) with inline editable title, property grid, markdown description, subtask checklist, and comments.
- **Contextual Collaboration**: Task comments with `@mentions` autocomplete and real-time broadcast via **Socket.IO**.
- **Live Audit Activity Feed**: Tracks task creations, moves, comments, status transitions, and project edits with actor avatars.
- **Real-Time Presence**: Live viewer avatars showing teammates currently active on the same project board.
- **Executive Dashboard**: Stat cards, 14-day completion trend area chart, task distribution donut chart, member workload bar chart, and upcoming deadlines.
- **Command Palette & Global Search**: Instant jump to projects, tasks, or actions with `⌘/Ctrl + K` and text search.
- **Keyboard Shortcuts**: Quick-add (`C`), focus search (`/`), cheat sheet (`?`), navigation chord sequences (`G then D`, `G then P`, `G then M`).
- **Dark & Light Modes**: Seamless tokenized color system with OS auto-detection and persistence.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 + Vite (route-level code-splitting with `React.lazy`)
- **Routing**: React Router v7
- **State Management**: Zustand
- **Styling**: Tailwind CSS + Custom Design Tokens (`globals.css`)
- **Drag & Drop**: `@dnd-kit/core` + `@dnd-kit/sortable`
- **Charts**: Recharts (Donut, Area, and Bar charts)
- **Icons**: `lucide-react`
- **Notifications**: `sonner` toasts

### Backend
- **Runtime**: Node.js + Express.js
- **Database**: MongoDB + Mongoose
- **Realtime**: Socket.IO (room-based events for `workspace:{id}` and `project:{id}`)
- **Authentication**: JWT access token (15m in memory) + HTTP-only refresh token cookie (7d with rotation) + `bcryptjs` (cost factor 12)
- **Security & Headers**: `helmet`, `cors`, `cookie-parser`, `express-rate-limit`

---

## ⚡ Quick Start

### Prerequisites
- Node.js 18+ (tested on Node v24)
- MongoDB instance (local or MongoDB Atlas)

### 1. Installation
Clone the repository and install dependencies:

```bash
# In the workspace root
npm install

# Install client dependencies
cd client && npm install

# Install server dependencies
cd ../server && npm install
```

### 2. Environment Configuration

Create `.env` in `server/`:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/worksphere
JWT_ACCESS_SECRET=worksphere_jwt_access_secret_super_secret_key_12345
JWT_REFRESH_SECRET=worksphere_jwt_refresh_secret_super_secret_key_67890
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=7d
CLIENT_URL=http://localhost:5173
```

Create `.env` in `client/`:
```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000
```

### 3. Seed Demo Data

Run the database seed script to populate demo users, workspace, projects, tasks, comments, and activity:

```bash
npm run seed
```

### 4. Run Development Servers

Start both frontend and backend concurrently from the root directory:

```bash
npm run dev
```

- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`

---

## 👥 Demo User Credentials

Every seeded user has the password: `Password123`

| Name | Role | Email | Password |
|---|---|---|---|
| **Alex Rivers** | Workspace Owner | `alex@worksphere.io` | `Password123` |
| **Sarah Chen** | Admin | `sarah@worksphere.io` | `Password123` |
| **Marcus Vance** | Team Member | `marcus@worksphere.io` | `Password123` |
| **Elena Rostova** | Team Member | `elena@worksphere.io` | `Password123` |

*(Tip: The login page includes one-click quick-fill buttons for each demo account.)*

---

## 🧪 Testing

Run backend tests for authentication, role permissions, and task movement logic:

```bash
npm run test
```

Run frontend build verification:

```bash
npm run build
```

Run ESLint check:

```bash
npm run lint
```

---

## 🐳 Docker Deployment

To launch the full stack with MongoDB, Express API, and Vite client via Docker Compose:

```bash
docker-compose up --build
```
