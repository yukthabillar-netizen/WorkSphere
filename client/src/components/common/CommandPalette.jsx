import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { searchService } from '../../services/dashboardService';
import { useDebounce } from '../../hooks/useDebounce';
import {
  Search,
  LayoutDashboard,
  FolderGit2,
  CheckSquare,
  Users,
  Settings,
  PlusCircle,
  Hash,
  ArrowRight,
} from 'lucide-react';

export const CommandPalette = () => {
  const navigate = useNavigate();
  const { isCommandPaletteOpen, setCommandPaletteOpen, setQuickTaskOpen } = useUIStore();
  const { activeWorkspaceId } = useAuthStore();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 250);
  const [results, setResults] = useState({ projects: [], tasks: [] });
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!debouncedQuery.trim() || !activeWorkspaceId) {
      setResults({ projects: [], tasks: [] });
      return;
    }

    let isMounted = true;
    setIsSearching(true);
    searchService
      .search(debouncedQuery, activeWorkspaceId)
      .then((res) => {
        if (isMounted) {
          setResults(res.data || { projects: [], tasks: [] });
        }
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (isMounted) setIsSearching(false);
      });

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery, activeWorkspaceId]);

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery('');
      setResults({ projects: [], tasks: [] });
    }
  }, [isCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  const navigateTo = (path) => {
    setCommandPaletteOpen(false);
    navigate(path);
  };

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Projects', icon: FolderGit2, path: '/projects' },
    { label: 'My Tasks', icon: CheckSquare, path: '/my-tasks' },
    { label: 'Team Members', icon: Users, path: '/team' },
    { label: 'Workspace Settings', icon: Settings, path: '/settings' },
  ];

  const filteredNav = query
    ? navItems.filter((i) => i.label.toLowerCase().includes(query.toLowerCase()))
    : navItems;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={() => setCommandPaletteOpen(false)}
      />

      <div className="relative w-full max-w-xl rounded-2xl bg-surface border border-border shadow-2xl z-10 animate-scale-in flex flex-col overflow-hidden">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-border gap-3">
          <Search className="w-5 h-5 text-text-muted shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search tasks & projects..."
            className="w-full bg-transparent text-sm text-text placeholder:text-text-muted focus:outline-none"
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold text-text-muted bg-surface-2 border border-border rounded-md">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-border/40 text-xs">
          {/* Quick Actions */}
          <div className="py-1">
            <button
              onClick={() => {
                setCommandPaletteOpen(false);
                setQuickTaskOpen(true);
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-text hover:bg-primary-subtle hover:text-primary transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <PlusCircle className="w-4 h-4 text-primary" />
                <span className="font-medium">Create new task</span>
              </div>
              <kbd className="text-[10px] text-text-muted bg-surface-2 px-1.5 py-0.5 rounded border border-border">
                C
              </kbd>
            </button>
          </div>

          {/* Navigation Pages */}
          {filteredNav.length > 0 && (
            <div className="py-2">
              <span className="px-3 text-[11px] font-semibold text-text-muted tracking-wider uppercase">
                Pages
              </span>
              <div className="mt-1 space-y-0.5">
                {filteredNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => navigateTo(item.path)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-text hover:bg-surface-2 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-text-muted" />
                        <span>{item.label}</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-text-muted opacity-0 group-hover:opacity-100" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Projects results */}
          {results.projects.length > 0 && (
            <div className="py-2">
              <span className="px-3 text-[11px] font-semibold text-text-muted tracking-wider uppercase">
                Projects
              </span>
              <div className="mt-1 space-y-0.5">
                {results.projects.map((proj) => (
                  <button
                    key={proj._id}
                    onClick={() => navigateTo(`/projects/${proj._id}`)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-text hover:bg-surface-2 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{proj.icon || '📁'}</span>
                      <span className="font-medium">{proj.name}</span>
                    </div>
                    <span className="text-[11px] text-text-muted capitalize">
                      {proj.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tasks results */}
          {results.tasks.length > 0 && (
            <div className="py-2">
              <span className="px-3 text-[11px] font-semibold text-text-muted tracking-wider uppercase">
                Tasks
              </span>
              <div className="mt-1 space-y-0.5">
                {results.tasks.map((task) => (
                  <button
                    key={task._id}
                    onClick={() =>
                      navigateTo(`/projects/${task.project._id}?task=${task._id}`)
                    }
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-text hover:bg-surface-2 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 truncate pr-2">
                      <Hash className="w-3.5 h-3.5 text-text-muted shrink-0" />
                      <span className="truncate font-medium">{task.title}</span>
                    </div>
                    <span className="text-[10px] text-text-muted shrink-0 px-1.5 py-0.5 rounded bg-surface-2">
                      {task.project?.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {query && !isSearching && results.projects.length === 0 && results.tasks.length === 0 && filteredNav.length === 0 && (
            <div className="p-6 text-center text-text-muted text-xs">
              No results found for "{query}".
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
