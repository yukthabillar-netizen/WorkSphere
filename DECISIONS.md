# Decisions Log — WorkSphere

This document records architectural, design, and implementation decisions made during the build of WorkSphere in accordance with the PRD.

## Decision 1: Root & Monorepo Structure
- Root `package.json` with npm scripts `dev`, `build`, `seed`, `test`, `lint`.
- Client runs on Vite (`http://localhost:5173`), Server runs on Express + Socket.IO (`http://localhost:5000`).
- Concurrently runs both in development with colored prefix logging.

## Decision 2: Database & Connection
- Support both local MongoDB (`mongodb://localhost:27017/worksphere`) and MongoDB Atlas URI (via `MONGODB_URI` / `MONGO_URI`).
- Automatic fallback gracefully logs connection state.

## Decision 3: Auth & Cookie Security
- Access token (15m expiry) passed in `Authorization: Bearer <token>` and kept in client Zustand memory.
- Refresh token (7d expiry) stored in httpOnly cookie (`refreshToken`) and hashed in the User model (`refreshTokenHash`) for rotation and invalidation upon logout.
- Silent refresh via Axios response interceptor on 401.

## Decision 4: Realtime Protocol (Socket.IO)
- Socket server integrated directly with the HTTP server on port 5000.
- Rooms: `workspace:<workspaceId>` and `project:<projectId>`.
- Client attaches JWT on handshake for authenticated connections and joins active workspace/project rooms.
- Server-side presence mapping (`projectPresence` map) tracks connected sockets per project room and broadcasts `presence:update` with member avatars.

## Decision 5: Subdocument Unique Indexes in MongoDB
- Removed `unique: true` on `invites.token` inside the embedded `Workspace.invites` subdocument schema, as MongoDB compound uniqueness on subdocument arrays can cause duplicate key errors for empty arrays without sparse indexing. Uniqueness and validity are handled deterministically at generation and query time.

## Decision 6: Express 5 Routing & Rate Limiting in Test Environment
- Adapted catch-all 404 handler to `app.use((req, res, next) => ...)` to be fully compatible with path-to-regexp v8 / Express 5.
- Bypassed auth rate limiting when `process.env.NODE_ENV === 'test'` so test suites run rapidly without 429 throttling.

## Decision 7: Route-Level Code Splitting
- Implemented `React.lazy` and React `Suspense` with an animated spinner across all route pages in `AppRoutes.jsx`, keeping the initial entry bundle lean and ensuring LCP < 2.5s.
