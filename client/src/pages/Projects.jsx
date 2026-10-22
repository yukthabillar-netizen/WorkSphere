import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { projectService } from '../services/projectService';
import { ProjectCard } from '../components/projects/ProjectCard';
import { ProjectFormModal } from '../components/projects/ProjectFormModal';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/common/EmptyState';
import { CardSkeleton, TableSkeleton } from '../components/common/Skeletons';
import { Avatar } from '../components/common/Avatar';
import { formatDate } from '../lib/utils';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  FolderGit2,
  Calendar,
} from 'lucide-react';

export const Projects = () => {
  const { activeWorkspaceId } = useAuthStore();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchProjects = async () => {
    if (!activeWorkspaceId) return;
    try {
      setIsLoading(true);
      const res = await projectService.getWorkspaceProjects(activeWorkspaceId);
      setProjects(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [activeWorkspaceId]);

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text tracking-tight">Projects</h2>
          <p className="text-xs text-text-muted mt-0.5">
            Manage your workspace roadmap, sprints, and ongoing initiatives.
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          New Project
        </Button>
      </div>

      {/* Filter and Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-surface border border-border">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            className="w-full bg-surface-2/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-text placeholder:text-text-muted border border-border/60 focus:border-primary focus:outline-none"
          />
        </div>

        {/* Status Tabs & View Toggle */}
        <div className="flex items-center gap-3 overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center gap-1 bg-surface-2 p-1 rounded-xl border border-border">
            {[
              { key: 'all', label: 'All' },
              { key: 'active', label: 'Active' },
              { key: 'on_hold', label: 'On Hold' },
              { key: 'completed', label: 'Done' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  statusFilter === tab.key
                    ? 'bg-surface text-primary shadow-xs font-semibold'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Grid vs Table Toggle */}
          <div className="flex items-center bg-surface-2 p-1 rounded-xl border border-border">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-surface text-primary shadow-xs'
                  : 'text-text-muted hover:text-text'
              }`}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-surface text-primary shadow-xs'
                  : 'text-text-muted hover:text-text'
              }`}
              title="Table view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content View */}
      {isLoading ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <TableSkeleton />
        )
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          icon={<FolderGit2 className="w-6 h-6 text-primary" />}
          title="No projects found"
          description={
            searchQuery
              ? `No project matches "${searchQuery}". Try clearing filters.`
              : 'Create your first project to organize tasks, assign teammates, and track progress.'
          }
          actionLabel="Create Project"
          onAction={() => setIsModalOpen(true)}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((proj) => (
            <ProjectCard key={proj._id} project={proj} />
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-surface-2/60 text-text-muted font-semibold">
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Progress</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Members</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProjects.map((p) => (
                <tr key={p._id} className="hover:bg-surface-2/50 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-text">
                    <Link
                      to={`/projects/${p._id}`}
                      className="flex items-center gap-2.5 hover:text-primary transition-colors"
                    >
                      <span className="text-xl">{p.icon || '📁'}</span>
                      <div>
                        <div>{p.name}</div>
                        <div className="text-[10px] text-text-muted font-normal line-clamp-1 max-w-xs">
                          {p.description}
                        </div>
                      </div>
                    </Link>
                  </td>
                  <td className="py-3.5 px-4 capitalize">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-2 border border-border">
                      {p.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="w-32 space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span>{p.progress || 0}%</span>
                        <span className="text-text-muted">
                          {p.doneTasks || 0}/{p.totalTasks || 0}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-surface-3 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${p.progress || 0}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-text-muted">
                    {p.dueDate ? formatDate(p.dueDate) : '—'}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex -space-x-1.5">
                      {p.members?.slice(0, 3).map((m) => (
                        <Avatar
                          key={m._id}
                          src={m.avatarUrl}
                          name={m.name}
                          size="xs"
                        />
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      to={`/projects/${p._id}`}
                      className="text-primary hover:underline font-semibold"
                    >
                      Open →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Project Form Modal */}
      <ProjectFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProjectCreated={(newP) => setProjects([newP, ...projects])}
      />
    </div>
  );
};
