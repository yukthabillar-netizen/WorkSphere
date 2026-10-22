import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { dashboardService } from '../services/dashboardService';
import { StatusDonutChart, CompletionTrendChart, MemberWorkloadChart } from '../components/charts/DashboardCharts';
import { Avatar } from '../components/common/Avatar';
import { CardSkeleton } from '../components/common/Skeletons';
import { EmptyState } from '../components/common/EmptyState';
import { formatDate, formatRelativeTime } from '../lib/utils';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  ArrowUpRight,
  Sparkles,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';

export const Dashboard = () => {
  const { user, activeWorkspaceId, workspaces } = useAuthStore();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const activeWorkspace = workspaces.find((w) => w._id === activeWorkspaceId);

  const fetchDashboardData = async () => {
    if (!activeWorkspaceId) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await dashboardService.getWorkspaceDashboard(activeWorkspaceId);
      setData(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load dashboard metrics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [activeWorkspaceId]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <div className="h-8 w-64 bg-border/40 rounded-lg animate-pulse" />
          <div className="h-4 w-40 bg-border/40 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-border/30 rounded-2xl animate-pulse" />
          <div className="h-72 bg-border/30 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12">
        <EmptyState
          icon={<AlertCircle className="w-6 h-6 text-danger" />}
          title="Could not load dashboard"
          description={error}
          actionLabel="Retry"
          onAction={fetchDashboardData}
        />
      </div>
    );
  }

  const { stats, charts, myDueSoonTasks = [], recentActivity = [], projects = [] } = data || {};

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Greeting Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Workspace Overview</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-text tracking-tight">
            {getGreeting()}, {user?.name?.split(' ')[0] || 'Team'}
          </h2>
          <p className="text-sm text-text-muted mt-1 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>{todayFormatted}</span>
            <span>•</span>
            <span className="font-medium text-text">{activeWorkspace?.name}</span>
          </p>
        </div>
      </div>

      {/* Row 1: 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: My Open Tasks */}
        <Link
          to="/my-tasks"
          className="rounded-2xl border border-border bg-surface p-5 shadow-xs hover:border-primary/40 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              My Open Tasks
            </span>
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-text mb-1">{stats?.myOpenTasks || 0}</div>
          <div className="text-xs text-text-muted flex items-center gap-1">
            <span>Assigned to you</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
          </div>
        </Link>

        {/* Card 2: Due This Week */}
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Due This Week
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-text mb-1">{stats?.dueThisWeek || 0}</div>
          <div className="text-xs text-text-muted">Requires team focus</div>
        </div>

        {/* Card 3: Overdue */}
        <div
          className={`rounded-2xl border p-5 shadow-xs transition-all ${
            stats?.overdue > 0
              ? 'border-danger/30 bg-danger/5'
              : 'border-border bg-surface'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Overdue
            </span>
            <div className="w-9 h-9 rounded-xl bg-danger/10 text-danger flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-3xl font-bold mb-1 ${stats?.overdue > 0 ? 'text-danger' : 'text-text'}`}>
            {stats?.overdue || 0}
          </div>
          <div className="text-xs text-text-muted">
            {stats?.overdue > 0 ? 'Urgent attention required' : 'No overdue work'}
          </div>
        </div>

        {/* Card 4: Completed This Week */}
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Completed
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-text mb-1">{stats?.completedThisWeek || 0}</div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Finished in last 7 days</span>
          </div>
        </div>
      </div>

      {/* Row 2: Charts (Completion Trend + Tasks by Status Donut) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2/3 Width Area Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-surface p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-text">Completion Trend</h3>
              <p className="text-xs text-text-muted">Tasks completed over the last 14 days</p>
            </div>
          </div>
          <CompletionTrendChart data={charts?.completionTrend || []} />
        </div>

        {/* 1/3 Width Donut Chart */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-base font-semibold text-text">Task Distribution</h3>
              <p className="text-xs text-text-muted">Active tasks by status</p>
            </div>
          </div>
          <StatusDonutChart data={charts?.tasksByStatus || []} />
        </div>
      </div>

      {/* Row 3: My Tasks Due Soon + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Due soon tasks */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
            <div>
              <h3 className="text-base font-semibold text-text">My Tasks Due Soon</h3>
              <p className="text-xs text-text-muted">Upcoming deadlines requiring your attention</p>
            </div>
            <Link
              to="/my-tasks"
              className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex-1 divide-y divide-border/60">
            {myDueSoonTasks.length === 0 ? (
              <div className="py-8 text-center text-xs text-text-muted">
                No upcoming deadlines for you this week. Great job!
              </div>
            ) : (
              myDueSoonTasks.map((t) => (
                <Link
                  key={t._id}
                  to={`/projects/${t.project?._id}?task=${t._id}`}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-surface-2/60 px-2 rounded-lg transition-colors group"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-text truncate group-hover:text-primary transition-colors">
                      {t.title}
                    </p>
                    <span className="text-[10px] text-text-muted flex items-center gap-1.5 mt-0.5">
                      <span>{t.project?.icon || '📁'}</span>
                      <span className="truncate">{t.project?.name}</span>
                    </span>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <span className="text-xs text-text-muted font-medium px-2 py-0.5 rounded-md bg-surface-2 border border-border">
                      {formatDate(t.dueDate)}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
            <div>
              <h3 className="text-base font-semibold text-text">Recent Workspace Activity</h3>
              <p className="text-xs text-text-muted">Live audit trail of edits and updates</p>
            </div>
          </div>

          <div className="flex-1 divide-y divide-border/60">
            {recentActivity.length === 0 ? (
              <div className="py-8 text-center text-xs text-text-muted">
                No recent activity recorded yet.
              </div>
            ) : (
              recentActivity.map((act) => (
                <div key={act._id} className="py-3 flex items-start gap-3">
                  <Avatar
                    src={act.actor?.avatarUrl}
                    name={act.actor?.name || 'User'}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-text leading-snug">
                      <span className="font-semibold">{act.actor?.name}</span>{' '}
                      <span className="text-text-muted">
                        {act.action.replace('_', ' ')}
                      </span>{' '}
                      {act.task?.title && (
                        <span className="font-medium text-text">"{act.task.title}"</span>
                      )}
                      {act.project?.name && (
                        <span className="text-text-muted"> in {act.project.name}</span>
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
      </div>

      {/* Row 4: Member Workload + Projects at a Glance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Member Workload Bar Chart */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs flex flex-col justify-between">
          <div className="mb-2">
            <h3 className="text-base font-semibold text-text">Team Workload</h3>
            <p className="text-xs text-text-muted">Active open tasks per member</p>
          </div>
          <MemberWorkloadChart data={charts?.memberWorkload || []} />
        </div>

        {/* Projects at a Glance (2 columns wide) */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-surface p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
            <div>
              <h3 className="text-base font-semibold text-text">Projects at a Glance</h3>
              <p className="text-xs text-text-muted">Progress across workspace projects</p>
            </div>
            <Link
              to="/projects"
              className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
            >
              All projects <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {projects.map((proj) => (
              <Link
                key={proj._id}
                to={`/projects/${proj._id}`}
                className="p-4 rounded-xl border border-border bg-surface-2/40 hover:bg-surface-2 hover:border-primary/40 transition-all flex flex-col justify-between group"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-2xl">{proj.icon || '📁'}</span>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-text truncate group-hover:text-primary transition-colors">
                        {proj.name}
                      </h4>
                      <span className="text-[10px] text-text-muted capitalize">
                        {proj.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-primary">{proj.progress || 0}%</span>
                </div>

                <div className="space-y-2 mt-2">
                  <div className="w-full bg-surface-3 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-primary h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${proj.progress || 0}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-text-muted pt-1">
                    <span>
                      {proj.doneTasks || 0} of {proj.totalTasks || 0} done
                    </span>
                    <div className="flex -space-x-1.5">
                      {proj.members?.slice(0, 3).map((m) => (
                        <Avatar
                          key={m._id}
                          src={m.avatarUrl}
                          name={m.name}
                          size="xs"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
