import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { useSocket } from '../hooks/useSocket';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { Avatar } from '../components/common/Avatar';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { NotificationDropdown } from '../components/common/NotificationDropdown';
import { CommandPalette } from '../components/common/CommandPalette';
import { KeyboardShortcutsModal } from '../components/common/KeyboardShortcutsModal';
import { TaskModal } from '../components/tasks/TaskModal';
import { ProjectFormModal } from '../components/projects/ProjectFormModal';
import { WorkspaceModal } from '../components/workspaces/WorkspaceModal';
import { JoinWorkspaceModal } from '../components/workspaces/JoinWorkspaceModal';
import { projectService } from '../services/projectService';
import { cn } from '../lib/utils';
import {
  LayoutDashboard,
  FolderGit2,
  CheckSquare,
  Users,
  Settings,
  Plus,
  Search,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  LogOut,
  Sparkles,
  HelpCircle,
  Menu,
  X,
  KeyRound,
} from 'lucide-react';

export const AppLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, workspaces, activeWorkspaceId, setActiveWorkspaceId, logout } = useAuthStore();
  const {
    isSidebarCollapsed,
    toggleSidebar,
    isMobileSidebarOpen,
    setMobileSidebarOpen,
    setCommandPaletteOpen,
    setShortcutsOpen,
    setQuickTaskOpen,
  } = useUIStore();

  useKeyboardShortcuts();
  useSocket(); // Realtime socket connection

  const [workspaceProjects, setWorkspaceProjects] = useState([]);
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isNewWorkspaceModalOpen, setIsNewWorkspaceModalOpen] = useState(false);
  const [isJoinWorkspaceModalOpen, setIsJoinWorkspaceModalOpen] = useState(false);

  const activeWorkspace =
    workspaces.find((w) => w._id === activeWorkspaceId) || workspaces[0];

  useEffect(() => {
    if (activeWorkspaceId) {
      projectService
        .getWorkspaceProjects(activeWorkspaceId)
        .then((res) => setWorkspaceProjects(res.data || []))
        .catch((err) => console.error(err));
    }
  }, [activeWorkspaceId]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
    setIsWorkspaceMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/my-tasks', label: 'My Tasks', icon: CheckSquare },
    { to: '/projects', label: 'Projects', icon: FolderGit2, hasChildren: true },
    { to: '/team', label: 'Team', icon: Users },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/projects/')) return 'Project Overview';
    if (path === '/projects') return 'Projects';
    if (path === '/dashboard') return 'Dashboard';
    if (path === '/my-tasks') return 'My Tasks';
    if (path === '/team') return 'Team Directory';
    if (path === '/settings') return 'Workspace Settings';
    return 'WorkSphere';
  };

  return (
    <div className="flex h-screen w-full bg-bg text-text overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden animate-fade-in"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={cn(
          'fixed lg:static top-0 bottom-0 left-0 z-40 flex flex-col bg-surface border-r border-border transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] shadow-sm lg:shadow-none',
          isSidebarCollapsed ? 'w-18' : 'w-64',
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Workspace Switcher Header */}
        <div className="p-3 border-b border-border relative">
          <button
            onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-surface-2 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-xs"
                style={{ backgroundColor: activeWorkspace?.accentColor || '#6366f1' }}
              >
                {activeWorkspace?.name?.substring(0, 2).toUpperCase() || 'WS'}
              </div>
              {!isSidebarCollapsed && (
                <div className="text-left truncate">
                  <h2 className="text-xs font-semibold text-text truncate">
                    {activeWorkspace?.name || 'Workspace'}
                  </h2>
                  <span className="text-[10px] text-text-muted capitalize">
                    {workspaces.length} workspace{workspaces.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
            {!isSidebarCollapsed && (
              <ChevronDown className="w-3.5 h-3.5 text-text-muted group-hover:text-text shrink-0" />
            )}
          </button>

          {/* Workspace Switcher Dropdown */}
          {isWorkspaceMenuOpen && (
            <div className="absolute top-full left-3 right-3 mt-1 bg-surface border border-border rounded-xl shadow-xl p-1.5 z-50 animate-scale-in">
              <div className="text-[10px] font-semibold text-text-muted px-2 py-1 uppercase tracking-wider">
                Workspaces
              </div>
              <div className="space-y-0.5 max-h-48 overflow-y-auto">
                {workspaces.map((ws) => (
                  <button
                    key={ws._id}
                    onClick={() => {
                      setActiveWorkspaceId(ws._id);
                      setIsWorkspaceMenuOpen(false);
                    }}
                    className={cn(
                      'w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left',
                      ws._id === activeWorkspaceId
                        ? 'bg-primary-subtle text-primary font-medium'
                        : 'hover:bg-surface-2 text-text'
                    )}
                  >
                    <div
                      className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                      style={{ backgroundColor: ws.accentColor || '#6366f1' }}
                    >
                      {ws.name.substring(0, 1).toUpperCase()}
                    </div>
                    <span className="truncate">{ws.name}</span>
                  </button>
                ))}
              </div>

              <div className="pt-1.5 mt-1 border-t border-border space-y-0.5">
                <button
                  onClick={() => {
                    setIsWorkspaceMenuOpen(false);
                    setIsNewWorkspaceModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-primary hover:bg-primary-subtle transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create workspace</span>
                </button>
                <button
                  onClick={() => {
                    setIsWorkspaceMenuOpen(false);
                    setIsJoinWorkspaceModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-text hover:bg-surface-2 transition-colors cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 text-primary" />
                  <span>Join with code</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Primary Navigation */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <div key={link.to}>
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all group select-none',
                      isActive
                        ? 'bg-primary text-white shadow-sm shadow-primary/20'
                        : 'text-text-muted hover:text-text hover:bg-surface-2'
                    )
                  }
                  title={isSidebarCollapsed ? link.label : undefined}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!isSidebarCollapsed && <span>{link.label}</span>}
                </NavLink>

                {/* Sub-projects list under Projects link */}
                {link.hasChildren && !isSidebarCollapsed && workspaceProjects.length > 0 && (
                  <div className="ml-7 mt-1 space-y-0.5 border-l border-border/60 pl-2">
                    {workspaceProjects.slice(0, 5).map((p) => (
                      <NavLink
                        key={p._id}
                        to={`/projects/${p._id}`}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] transition-colors truncate',
                            isActive
                              ? 'text-primary font-semibold bg-primary-subtle'
                              : 'text-text-muted hover:text-text hover:bg-surface-2'
                          )
                        }
                      >
                        <span className="text-xs">{p.icon || '📁'}</span>
                        <span className="truncate">{p.name}</span>
                      </NavLink>
                    ))}
                    {workspaceProjects.length > 5 && (
                      <NavLink
                        to="/projects"
                        className="block px-2 py-1 text-[10px] text-text-muted hover:text-primary"
                      >
                        +{workspaceProjects.length - 5} more projects
                      </NavLink>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Quick Action Button: New Project */}
          {!isSidebarCollapsed && (
            <div className="pt-4 px-1">
              <button
                onClick={() => setIsNewProjectModalOpen(true)}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-dashed border-border hover:border-primary hover:text-primary text-text-muted text-xs font-medium transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Project</span>
              </button>
            </div>
          )}
        </div>

        {/* Sidebar Footer with User Menu & Collapse toggle */}
        <div className="p-3 border-t border-border flex items-center justify-between gap-2 relative">
          <div className="flex-1 min-w-0">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="w-full flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-surface-2 transition-colors cursor-pointer text-left"
            >
              <Avatar
                src={user?.avatarUrl}
                name={user?.name || 'User'}
                size={isSidebarCollapsed ? 'sm' : 'md'}
              />
              {!isSidebarCollapsed && (
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-text truncate">{user?.name}</div>
                  <div className="text-[10px] text-text-muted truncate">{user?.email}</div>
                </div>
              )}
            </button>
          </div>

          {!isSidebarCollapsed && (
            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-md text-text-muted hover:text-text hover:bg-surface-2 transition-colors cursor-pointer hidden lg:flex"
              title="Collapse sidebar"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
          )}

          {isSidebarCollapsed && (
            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-md text-text-muted hover:text-text hover:bg-surface-2 transition-colors cursor-pointer hidden lg:flex mx-auto"
              title="Expand sidebar"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          )}

          {/* User Popover Menu */}
          {isUserMenuOpen && (
            <div className="absolute bottom-full left-3 mb-2 w-52 bg-surface border border-border rounded-xl shadow-xl p-1.5 z-50 animate-scale-in">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-xs font-semibold text-text">{user?.name}</p>
                <p className="text-[11px] text-text-muted truncate">{user?.email}</p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    navigate('/settings');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-text hover:bg-surface-2 rounded-lg cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-text-muted" />
                  <span>Profile & Settings</span>
                </button>
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    setShortcutsOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-text hover:bg-surface-2 rounded-lg cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-text-muted" />
                  <span>Shortcuts</span>
                  <kbd className="ml-auto text-[10px] font-mono text-text-muted">?</kbd>
                </button>
              </div>

              <div className="pt-1 border-t border-border">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-danger hover:bg-danger/10 rounded-lg cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main App Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar (56px sticky) */}
        <header className="h-14 px-4 sm:px-6 bg-surface/80 backdrop-blur-md border-b border-border flex items-center justify-between shrink-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface-2 lg:hidden cursor-pointer"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-sm sm:text-base font-semibold text-text truncate">
              {getPageTitle()}
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Task Add Button */}
            <button
              onClick={() => setQuickTaskOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:opacity-90 shadow-sm transition-all cursor-pointer"
              title="Create new task (Press C)"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Task</span>
              <kbd className="hidden md:inline px-1 py-0.2 rounded bg-white/20 text-[10px] font-mono">
                C
              </kbd>
            </button>

            {/* Global Search trigger (Cmd+K) */}
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-2/80 hover:bg-surface-2 border border-border/80 text-text-muted text-xs transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Search...</span>
              <kbd className="hidden sm:inline px-1.5 py-0.5 rounded text-[10px] font-semibold bg-surface border border-border text-text">
                ⌘K
              </kbd>
            </button>

            {/* Notification Bell */}
            <NotificationDropdown />

            {/* Theme Toggle */}
            <ThemeToggle />
          </div>
        </header>

        {/* Page Content Body (Scrollable, max 1400px) */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global Modals & Dialogs */}
      <CommandPalette />
      <KeyboardShortcutsModal />
      <TaskModal />
      <ProjectFormModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onProjectCreated={(newProj) => {
          setWorkspaceProjects((prev) => [newProj, ...prev]);
        }}
      />
      <WorkspaceModal
        isOpen={isNewWorkspaceModalOpen}
        onClose={() => setIsNewWorkspaceModalOpen(false)}
      />
      <JoinWorkspaceModal
        isOpen={isJoinWorkspaceModalOpen}
        onClose={() => setIsJoinWorkspaceModalOpen(false)}
      />
    </div>
  );
};
