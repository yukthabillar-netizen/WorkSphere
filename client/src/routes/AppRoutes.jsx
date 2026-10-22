import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AuthLayout } from '../layouts/AuthLayout';
import { AppLayout } from '../layouts/AppLayout';
import { Loader2 } from 'lucide-react';

// Route-level code splitting with React.lazy (PRD §9)
const Login = lazy(() => import('../pages/Login').then((m) => ({ default: m.Login })));
const Register = lazy(() => import('../pages/Register').then((m) => ({ default: m.Register })));
const ForgotPassword = lazy(() => import('../pages/ForgotPassword').then((m) => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import('../pages/ResetPassword').then((m) => ({ default: m.ResetPassword })));
const InviteAccept = lazy(() => import('../pages/InviteAccept').then((m) => ({ default: m.InviteAccept })));
const Dashboard = lazy(() => import('../pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const Projects = lazy(() => import('../pages/Projects').then((m) => ({ default: m.Projects })));
const ProjectDetail = lazy(() => import('../pages/ProjectDetail').then((m) => ({ default: m.ProjectDetail })));
const MyTasks = lazy(() => import('../pages/MyTasks').then((m) => ({ default: m.MyTasks })));
const Team = lazy(() => import('../pages/Team').then((m) => ({ default: m.Team })));
const Settings = lazy(() => import('../pages/Settings').then((m) => ({ default: m.Settings })));
const NotFound = lazy(() => import('../pages/NotFound').then((m) => ({ default: m.NotFound })));

const SuspenseLoader = () => (
  <div className="h-64 w-full flex items-center justify-center p-8">
    <Loader2 className="w-6 h-6 animate-spin text-primary" />
  </div>
);

export const AppRoutes = () => {
  return (
    <Suspense fallback={<SuspenseLoader />}>
      <Routes>
        {/* Public Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        {/* Invite Acceptance */}
        <Route path="/invite/:token" element={<InviteAccept />} />

        {/* Protected App Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/my-tasks" element={<MyTasks />} />
            <Route path="/team" element={<Team />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        {/* 404 Catch-All */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};
