const { Server } = require('socket.io');
const { verifyAccessToken } = require('../utils/tokens');
const User = require('../models/User');

let io = null;
// Track project presence: projectId -> Map(socketId -> { userId, name, avatarUrl, email })
const projectPresence = new Map();

const initSocket = (httpServer, clientUrl) => {
  io = new Server(httpServer, {
    cors: {
      origin: clientUrl,
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (token) {
        try {
          const decoded = verifyAccessToken(token);
          const user = await User.findById(decoded.userId).select('name email avatarUrl');
          if (user) {
            socket.user = user;
          }
        } catch (err) {
          // Token error, allow anonymous or reject if needed
        }
      }
      next();
    } catch (err) {
      next(err);
    }
  });

  io.on('connection', (socket) => {
    // Join workspace room
    socket.on('workspace:join', (workspaceId) => {
      if (workspaceId) {
        socket.join(`workspace:${workspaceId}`);
      }
    });

    // Join project room and update presence
    socket.on('project:join', ({ projectId }) => {
      if (!projectId) return;
      const room = `project:${projectId}`;
      socket.join(room);

      if (socket.user) {
        if (!projectPresence.has(projectId)) {
          projectPresence.set(projectId, new Map());
        }
        projectPresence.get(projectId).set(socket.id, {
          userId: socket.user._id.toString(),
          name: socket.user.name,
          email: socket.user.email,
          avatarUrl: socket.user.avatarUrl,
        });

        // Broadcast presence
        const activeUsers = Array.from(projectPresence.get(projectId).values());
        // Deduplicate by userId
        const uniqueUsers = Array.from(new Map(activeUsers.map(u => [u.userId, u])).values());
        io.to(room).emit('presence:update', { projectId, users: uniqueUsers });
      }
    });

    // Leave project room and update presence
    socket.on('project:leave', ({ projectId }) => {
      if (!projectId) return;
      const room = `project:${projectId}`;
      socket.leave(room);

      if (projectPresence.has(projectId)) {
        projectPresence.get(projectId).delete(socket.id);
        const activeUsers = Array.from(projectPresence.get(projectId).values());
        const uniqueUsers = Array.from(new Map(activeUsers.map(u => [u.userId, u])).values());
        io.to(room).emit('presence:update', { projectId, users: uniqueUsers });
      }
    });

    socket.on('disconnect', () => {
      // Clean up presence across all projects
      projectPresence.forEach((socketMap, projectId) => {
        if (socketMap.has(socket.id)) {
          socketMap.delete(socket.id);
          const activeUsers = Array.from(socketMap.values());
          const uniqueUsers = Array.from(new Map(activeUsers.map(u => [u.userId, u])).values());
          io.to(`project:${projectId}`).emit('presence:update', { projectId, users: uniqueUsers });
        }
      });
    });
  });

  return io;
};

const getIO = () => {
  return io;
};

const emitToWorkspace = (workspaceId, event, data) => {
  if (io && workspaceId) {
    io.to(`workspace:${workspaceId}`).emit(event, data);
  }
};

const emitToProject = (projectId, event, data) => {
  if (io && projectId) {
    io.to(`project:${projectId}`).emit(event, data);
  }
};

module.exports = {
  initSocket,
  getIO,
  emitToWorkspace,
  emitToProject,
};
