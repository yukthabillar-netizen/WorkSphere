import React from 'react';
import { TASK_STATUSES, TASK_PRIORITIES } from '../../lib/constants';
import { Search, X, Filter } from 'lucide-react';

export const TaskFilters = ({
  filters,
  onChange,
  onReset,
  workspaceMembers = [],
}) => {
  const hasActiveFilters =
    filters.search ||
    filters.status !== 'all' ||
    filters.priority !== 'all' ||
    filters.assignee !== 'all' ||
    filters.due !== 'all';

  return (
    <div className="flex flex-wrap items-center gap-2.5 p-3 rounded-2xl bg-surface border border-border text-xs">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[180px] max-w-xs">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-text-muted" />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder="Filter tasks by title or label..."
          className="w-full bg-surface-2 rounded-lg pl-8 pr-2.5 py-1 text-xs text-text placeholder:text-text-muted border border-border focus:outline-none focus:border-primary"
        />
      </div>

      {/* Status filter */}
      <select
        value={filters.status}
        onChange={(e) => onChange({ ...filters, status: e.target.value })}
        className="bg-surface-2 border border-border rounded-lg px-2.5 py-1 text-xs text-text focus:outline-none focus:border-primary cursor-pointer"
      >
        <option value="all">Status: All</option>
        {TASK_STATUSES.map((s) => (
          <option key={s.key} value={s.key}>
            {s.label}
          </option>
        ))}
      </select>

      {/* Priority filter */}
      <select
        value={filters.priority}
        onChange={(e) => onChange({ ...filters, priority: e.target.value })}
        className="bg-surface-2 border border-border rounded-lg px-2.5 py-1 text-xs text-text focus:outline-none focus:border-primary cursor-pointer"
      >
        <option value="all">Priority: All</option>
        {TASK_PRIORITIES.map((p) => (
          <option key={p.key} value={p.key}>
            {p.label}
          </option>
        ))}
      </select>

      {/* Due date filter */}
      <select
        value={filters.due}
        onChange={(e) => onChange({ ...filters, due: e.target.value })}
        className="bg-surface-2 border border-border rounded-lg px-2.5 py-1 text-xs text-text focus:outline-none focus:border-primary cursor-pointer"
      >
        <option value="all">Due: All Time</option>
        <option value="overdue">Overdue</option>
        <option value="today">Due Today</option>
        <option value="this_week">Due This Week</option>
      </select>

      {/* Assignee filter */}
      {workspaceMembers.length > 0 && (
        <select
          value={filters.assignee}
          onChange={(e) => onChange({ ...filters, assignee: e.target.value })}
          className="bg-surface-2 border border-border rounded-lg px-2.5 py-1 text-xs text-text focus:outline-none focus:border-primary cursor-pointer"
        >
          <option value="all">Assignee: Anyone</option>
          {workspaceMembers.map((m) => (
            <option key={m.user._id} value={m.user._id}>
              {m.user.name}
            </option>
          ))}
        </select>
      )}

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <button
          onClick={onReset}
          className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline px-2 py-1 cursor-pointer font-medium"
        >
          <X className="w-3 h-3" />
          <span>Reset</span>
        </button>
      )}
    </div>
  );
};
