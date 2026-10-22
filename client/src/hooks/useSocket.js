import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const getSocket = () => socket;

export const useSocket = (activeProjectId = null) => {
  const { token, activeWorkspaceId } = useAuthStore();
  const [clientSocket, setClientSocket] = useState(socket);

  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.disconnect();
        socket = null;
        setClientSocket(null);
      }
      return;
    }

    if (!socket) {
      socket = io(SOCKET_URL, {
        auth: { token },
        withCredentials: true,
        transports: ['websocket', 'polling'],
      });
      setClientSocket(socket);
    }

    // Join workspace room
    if (activeWorkspaceId && socket) {
      socket.emit('workspace:join', activeWorkspaceId);
    }

    // Join project room if given
    if (activeProjectId && socket) {
      socket.emit('project:join', { projectId: activeProjectId });
    }

    return () => {
      if (activeProjectId && socket) {
        socket.emit('project:leave', { projectId: activeProjectId });
      }
    };
  }, [token, activeWorkspaceId, activeProjectId]);

  return clientSocket;
};
