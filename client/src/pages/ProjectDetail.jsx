import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { projectService } from '../services/projectService';
import { taskService } from '../services/taskService';
import { useAuthStore } from '../store/authStore';
import { useSocket } from '../hooks/useSocket';
import { TaskBoard } from '../components/tasks/TaskBoard';
import { TaskList } from '../components/tasks/TaskList';
import { TaskDrawer } from '../components/tasks/TaskDrawer';
import { TaskModal } from '../components/tasks/TaskModal';
import { TaskFilters } from '../components/tasks/TaskFilters';
import { ProjectFormModal } from '../components/projects/ProjectFormModal';
import { Avatar } from '../components/common/Avatar';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { BoardSkeleton } from '../components/common/Skeletons';
import { formatDate, formatRelativeTime } from '../lib/utils';
import { toast } from 'sonner';
import {
  Kanban,
  List as ListIcon,
  PieChart as OverviewIcon,
  Activity as ActivityIcon,
  Plus,
  Settings,
  Calendar,
  CheckCircle2,
  Users,
  Eye,
} from 'lucide-react';

export const ProjectDetail = () => {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { workspaces, activeWorkspaceId } = useAuthStore();
  const socket = useSocket(id);

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [presenceUsers, setPresenceUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('board'); // 'board' | 'list' | 'overview' | 'activity'
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
  const [quickAddStatus, setQuickAddStatus] = useState('todo');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  // URL Query synced task drawer
  const activeTaskId = searchParams.get('task');

  // Filters synced to state & URL
  const [filters, setFilters] = useState({
    search: searchParams.get('q') || '',
    status: searchParams.get('status') || 'all',
    priority: searchParams.get('priority') || 'all',
    assignee: searchParams.get('assignee') || 'all',
    due: searchParams.get('due') || 'all',
  });

  const currentWorkspace = workspaces.find((w) => w._id === activeWorkspaceId);
  const workspaceMembers = currentWorkspace?.members || [];

  const fetchProjectData = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const [projRes, tasksRes, actRes] = await Promise.all([
        projectService.getProjectById(id),
        taskService.getProjectTasks(id),
        projectService.getProjectActivity(id),
      ]);
      setProject(projRes.data);
      setTasks(tasksRes.data || []);
      setActivities(actRes.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load project details');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  // Realtime updates via Socket.IO
  useEffect(() => {
    if (!socket) return;

    const handleTaskCreated = (newTask) => {
      if (newTask.project?._id === id || newTask.project === id) {
        setTasks((prev) => {
          if (prev.some((t) => t._id === newTask._id)) return prev;
          return [...prev, newTask];
        });
      }
    };

    const handleTaskUpdated = (updatedTask) => {
      if (updatedTask.project?._id === id || updatedTask.project === id) {
        setTasks((prev) =>
          prev.map((t) => (t._id === updatedTask._id ? updatedTask : t))
        );
      }
    };

    const handleTaskMoved = (movedTask) => {
      if (movedTask.project?._id === id || movedTask.project === id) {
        setTasks((prev) =>
          prev.map((t) => (t._id === movedTask._id ? movedTask : t))
        );
      }
    };

    const handleTaskDeleted = ({ taskId }) => {
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    };

    const handlePresence = ({ projectId, users }) => {
      if (projectId === id) {
        setPresenceUsers(users || []);
      }
    };

    socket.on('task:created', handleTaskCreated);
    socket.on('task:updated', handleTaskUpdated);
    socket.on('task:moved', handleTaskMoved);
    socket.on('task:deleted', handleTaskDeleted);
    socket.on('presence:update', handlePresence);

    return () => {
      socket.off('task:created', handleTaskCreated);
      socket.off('task:updated', handleTaskUpdated);
      socket.off('task:moved', handleTaskMoved);
      socket.off('task:deleted', handleTaskDeleted);
      socket.off('presence:update', handlePresence);
    };
  }, [socket, id]);

  const handleTaskClick = (task) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('task', task._id);
      return next;
    });
  };

  const handleCloseDrawer = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('task');
      return next;
    });
  };

  const handleTaskMove = async (taskId, { status, order }) => {
    // 1. Optimistic UI update
    const previousTasks = [...tasks];
    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, status, order } : t))
    );

    try {
      await taskService.moveTask(taskId, { status, order });
    } catch (err) {
      toast.error('Failed to move task. Reverting...');
      setTasks(previousTasks); // Rollback on error
    }
  };

  const handleTaskUpdate = async (taskId, updates) => {
    try {
      const res = await taskService.updateTask(taskId, updates);
      setTasks((prev) => prev.map((t) => (t._id === taskId ? res.data : t)));
      toast.success('Task updated');
    } catch (err) {
      toast.error('Failed to update task');
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchLabel = t.labels?.some((l) => l.toLowerCase().includes(q));
      if (!matchTitle && !matchLabel) return false;
    }
    if (filters.status !== 'all' && t.status !== filters.status) return false;
    if (filters.priority !== 'all' && t.priority !== filters.priority) return false;
    if (filters.assignee !== 'all') {
      const hasAssignee = t.assignees?.some(
        (a) => (a._id || a) === filters.assignee
      );
      if (!hasAssignee) return false;
    }
    if (filters.due !== 'all' && t.dueDate) {
      const d = new Date(t.dueDate);
      const today = new Date().setHours(0, 0, 0, 0);
      if (filters.due === 'overdue' && (d >= today || t.status === 'done')) return false;
      if (filters.due === 'today') {
        const isToday = new Date(d).toDateString() === new Date().toDateString();
        if (!isToday) return false;
      }
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-12 w-64 bg-border/40 rounded-xl animate-pulse" />
        <BoardSkeleton />
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Project Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-xs shrink-0"
            style={{
              backgroundColor: (project.color || '#6366f1') + '20',
              border: `2px solid ${project.color || '#6366f1'}`,
            }}
          >
            {project.icon || '📁'}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-text tracking-tight">
                {project.name}
              </h2>
              <Badge variant="primary" className="capitalize">
                {project.status.replace('_', ' ')}
              </Badge>
            </div>
            <p className="text-xs text-text-muted mt-0.5 line-clamp-1 max-w-xl">
              {project.description || 'No description provided.'}
            </p>
          </div>
        </div>

        {/* Action Controls & Realtime Presence */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Active Live Presence Avatars */}
          {presenceUsers.length > 0 && (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-2 border border-border text-xs text-text-muted"
              title="Users currently viewing this project"
            >
              <Eye className="w-3.5 h-3.5 text-primary animate-pulse" />
              <div className="flex -space-x-1.5">
                {presenceUsers.map((u) => (
                  <Avatar key={u.userId} src={u.avatarUrl} name={u.name} size="xs" />
                ))}
              </div>
            </div>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsEditProjectModalOpen(true)}
            leftIcon={<Settings className="w-3.5 h-3.5" />}
          >
            Settings
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setQuickAddStatus('todo');
              setIsTaskModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            New Task
          </Button>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center justify-between border-b border-border pb-1">
        <div className="flex items-center gap-2">
          {[
            { key: 'board', label: 'Board', icon: Kanban },
            { key: 'list', label: 'List View', icon: ListIcon },
            { key: 'overview', label: 'Overview', icon: OverviewIcon },
            { key: 'activity', label: 'Activity Log', icon: ActivityIcon },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-text-muted hover:text-text hover:bg-surface-2'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Progress stats */}
        <div className="hidden sm:flex items-center gap-3 text-xs text-text-muted">
          <span>
            {tasks.filter((t) => t.status === 'done').length}/{tasks.length} tasks completed
          </span>
          <div className="w-20 bg-surface-3 rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{
                width: `${
                  tasks.length > 0
                    ? Math.round(
                        (tasks.filter((t) => t.status === 'done').length / tasks.length) * 100
                      )
                    : 0
                }%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Filters Bar (Only on Board & List views) */}
      {(activeTab === 'board' || activeTab === 'list') && (
        <TaskFilters
          filters={filters}
          onChange={(newFilters) => setFilters(newFilters)}
          onReset={() =>
            setFilters({
              search: '',
              status: 'all',
              priority: 'all',
              assignee: 'all',
              due: 'all',
            })
          }
          workspaceMembers={workspaceMembers}
        />
      )}

      {/* Active Tab View */}
      {activeTab === 'board' && (
        <TaskBoard
          tasks={filteredTasks}
          onTaskClick={handleTaskClick}
          onTaskMove={handleTaskMove}
          onQuickAdd={(status) => {
            setQuickAddStatus(status);
            setIsTaskModalOpen(true);
          }}
        />
      )}

      {activeTab === 'list' && (
        <TaskList
          tasks={filteredTasks}
          onTaskClick={handleTaskClick}
          onTaskUpdate={handleTaskUpdate}
        />
      )}

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
              <h3 className="text-base font-bold text-text mb-2">About this project</h3>
              <p className="text-xs text-text leading-relaxed whitespace-pre-wrap">
                {project.description || 'No detailed description provided.'}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
              <h3 className="text-base font-bold text-text mb-4">Milestones & Key Dates</h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-surface-2/60 rounded-xl border border-border">
                  <span className="text-text-muted block mb-1">Start Date</span>
                  <span className="font-semibold text-text">
                    {project.startDate ? formatDate(project.startDate) : 'Not specified'}
                  </span>
                </div>
                <div className="p-3 bg-surface-2/60 rounded-xl border border-border">
                  <span className="text-text-muted block mb-1">Target Completion</span>
                  <span className="font-semibold text-text">
                    {project.dueDate ? formatDate(project.dueDate) : 'Not specified'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
              <h3 className="text-base font-bold text-text mb-4">Project Members</h3>
              <div className="space-y-2.5">
                {project.members && project.members.length > 0 ? (
                  project.members.map((m) => (
                    <div key={m._id} className="flex items-center gap-2.5 text-xs">
                      <Avatar src={m.avatarUrl} name={m.name} size="sm" />
                      <div>
                        <div className="font-semibold text-text">{m.name}</div>
                        <div className="text-[10px] text-text-muted">{m.email}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-text-muted">No members assigned</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs max-w-2xl">
          <h3 className="text-base font-bold text-text mb-4 pb-2 border-b border-border">
            Project Activity History
          </h3>
          <div className="space-y-4">
            {activities.length === 0 ? (
              <div className="py-8 text-center text-xs text-text-muted">
                No activity records yet for this project.
              </div>
            ) : (
              activities.map((act) => (
                <div key={act._id} className="flex items-start gap-3 text-xs">
                  <Avatar
                    src={act.actor?.avatarUrl}
                    name={act.actor?.name || 'User'}
                    size="sm"
                  />
                  <div className="flex-1">
                    <p className="text-text leading-snug">
                      <span className="font-semibold">{act.actor?.name}</span>{' '}
                      <span className="text-text-muted">{act.action.replace('_', ' ')}</span>{' '}
                      {act.task?.title && (
                        <span className="font-semibold text-text">"{act.task.title}"</span>
                      )}
                    </p>
                    <span className="text-[10px] text-text-muted mt-0.5 block">
                      {formatRelativeTime(act.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Task Drawer */}
      <TaskDrawer
        taskId={activeTaskId}
        isOpen={Boolean(activeTaskId)}
        onClose={handleCloseDrawer}
        onTaskUpdated={(updated) => {
          setTasks((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
        }}
        onTaskDeleted={(deletedId) => {
          setTasks((prev) => prev.filter((t) => t._id !== deletedId));
        }}
        workspaceMembers={workspaceMembers}
      />

      {/* Quick Add Task Modal */}
      <TaskModal
        defaultProjectId={id}
        onTaskCreated={(newTask) => {
          setTasks((prev) => [...prev, newTask]);
        }}
      />

      {/* Edit Project Modal */}
      <ProjectFormModal
        isOpen={isEditProjectModalOpen}
        onClose={() => setIsEditProjectModalOpen(false)}
        projectToEdit={project}
        onProjectCreated={(updated) => setProject(updated)}
      />
    </div>
  );
};
