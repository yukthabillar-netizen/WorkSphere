import React, { useState, useEffect } from 'react';
import { taskService } from '../services/taskService';
import { useAuthStore } from '../store/authStore';
import { formatDate } from '../lib/utils';
import { TASK_PRIORITIES } from '../lib/constants';
import { Avatar } from '../components/common/Avatar';
import { TableSkeleton } from '../components/common/Skeletons';
import { EmptyState } from '../components/common/EmptyState';
import { toast } from 'sonner';
import {
  CheckSquare,
  Square,
  Calendar,
  AlertCircle,
  Flag,
  Clock,
  Layers,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const MyTasks = () => {
  const { activeWorkspaceId } = useAuthStore();
  const [tasksGrouped, setTasksGrouped] = useState({
    overdue: [],
    today: [],
    upcoming: [],
    noDate: [],
  });
  const [allTasks, setAllTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [collapsedSections, setCollapsedSections] = useState({});

  const fetchMyTasks = async () => {
    try {
      setIsLoading(true);
      const res = await taskService.getMyTasks(activeWorkspaceId);
      setAllTasks(res.data.all || []);
      setTasksGrouped(
        res.data.grouped || { overdue: [], today: [], upcoming: [], noDate: [] }
      );
    } catch (err) {
      console.error(err);
      toast.error('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTasks();
  }, [activeWorkspaceId]);

  const toggleSection = (sectionKey) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const handleToggleDone = async (task) => {
    const newStatus = task.status === 'done' ? 'in_progress' : 'done';
    try {
      await taskService.updateTask(task._id, { status: newStatus });
      fetchMyTasks();
      if (newStatus === 'done') {
        toast.success(`"${task.title}" completed!`);
      }
    } catch (err) {
      toast.error('Failed to update task');
    }
  };

  const sections = [
    {
      key: 'overdue',
      title: 'Overdue',
      icon: AlertCircle,
      tasks: tasksGrouped.overdue,
      badgeColor: 'text-danger bg-danger/10 border-danger/20',
    },
    {
      key: 'today',
      title: 'Due Today',
      icon: Clock,
      tasks: tasksGrouped.today,
      badgeColor: 'text-primary bg-primary/10 border-primary/20',
    },
    {
      key: 'upcoming',
      title: 'Upcoming Deadlines',
      icon: Calendar,
      tasks: tasksGrouped.upcoming,
      badgeColor: 'text-text-muted bg-surface-2 border-border',
    },
    {
      key: 'noDate',
      title: 'No Due Date',
      icon: Layers,
      tasks: tasksGrouped.noDate,
      badgeColor: 'text-text-muted bg-surface-2 border-border',
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-border/40 rounded-xl animate-pulse" />
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-text tracking-tight">My Tasks</h2>
        <p className="text-xs text-text-muted mt-0.5">
          Everything assigned to you across projects in this workspace.
        </p>
      </div>

      {allTasks.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="w-6 h-6 text-primary" />}
          title="No tasks assigned to you"
          description="You're completely caught up! Tasks assigned to you will automatically show up here."
        />
      ) : (
        <div className="space-y-4">
          {sections.map((section) => {
            const Icon = section.icon;
            const isCollapsed = collapsedSections[section.key];
            if (section.tasks.length === 0 && section.key === 'overdue') return null;

            return (
              <div
                key={section.key}
                className="rounded-2xl border border-border bg-surface overflow-hidden shadow-xs"
              >
                {/* Section Header */}
                <button
                  type="button"
                  onClick={() => toggleSection(section.key)}
                  className="w-full flex items-center justify-between p-3.5 bg-surface-2/40 hover:bg-surface-2 transition-colors cursor-pointer border-b border-border/60"
                >
                  <div className="flex items-center gap-2">
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4 text-text-muted" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-text-muted" />
                    )}
                    <Icon className="w-4 h-4 text-text-muted" />
                    <span className="text-xs font-bold text-text">{section.title}</span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${section.badgeColor}`}
                    >
                      {section.tasks.length}
                    </span>
                  </div>
                </button>

                {/* Section Items */}
                {!isCollapsed && (
                  <div className="divide-y divide-border/60">
                    {section.tasks.length === 0 ? (
                      <div className="p-4 text-center text-xs text-text-muted">
                        No tasks in this group.
                      </div>
                    ) : (
                      section.tasks.map((task) => {
                        const isDone = task.status === 'done';
                        const priorityObj =
                          TASK_PRIORITIES.find((p) => p.key === task.priority) ||
                          TASK_PRIORITIES[1];

                        return (
                          <div
                            key={task._id}
                            className="p-3.5 flex items-center justify-between gap-3 hover:bg-surface-2/50 transition-colors group text-xs"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              {/* Checkbox */}
                              <button
                                onClick={() => handleToggleDone(task)}
                                className="cursor-pointer text-text-muted hover:text-primary transition-colors shrink-0"
                              >
                                {isDone ? (
                                  <CheckSquare className="w-4 h-4 text-emerald-500" />
                                ) : (
                                  <Square className="w-4 h-4" />
                                )}
                              </button>

                              {/* Title & Project Name */}
                              <Link
                                to={`/projects/${task.project?._id}?task=${task._id}`}
                                className="min-w-0 flex-1 group-hover:text-primary transition-colors"
                              >
                                <span
                                  className={`font-semibold text-text truncate block ${
                                    isDone ? 'line-through text-text-muted' : ''
                                  }`}
                                >
                                  {task.title}
                                </span>
                                <span className="text-[10px] text-text-muted flex items-center gap-1.5 mt-0.5">
                                  <span>{task.project?.icon || '📁'}</span>
                                  <span>{task.project?.name}</span>
                                </span>
                              </Link>
                            </div>

                            {/* Priority & Due Date Chips */}
                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded ${priorityObj.bgClass}`}
                              >
                                <Flag className="w-2.5 h-2.5 fill-current" />
                                <span className="capitalize">{priorityObj.label}</span>
                              </span>

                              {task.dueDate && (
                                <span className="text-[11px] text-text-muted px-2 py-0.5 rounded bg-surface-2 border border-border">
                                  {formatDate(task.dueDate)}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
