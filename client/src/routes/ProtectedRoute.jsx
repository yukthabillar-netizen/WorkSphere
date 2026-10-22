import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute = () => {
  const location = useLocation();
  const { user, token, isLoading, initAuth } = useAuthStore();

  useEffect(() => {
    // Listen for global unauthorized event dispatched by Axios interceptor
    const handleUnauthorized = () => {
      useAuthStore.getState().logout();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center gap-3 bg-bg text-text">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-xs text-text-muted font-medium">Loading WorkSphere...</span>
      </div>
    );
  }

  if (!token && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};
