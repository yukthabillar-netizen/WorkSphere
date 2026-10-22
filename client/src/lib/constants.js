export const TASK_STATUSES = [
  { key: 'todo', label: 'To Do', color: '#94A3B8', bgClass: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20' },
  { key: 'in_progress', label: 'In Progress', color: '#38BDF8', bgClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  { key: 'in_review', label: 'In Review', color: '#FBBF24', bgClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  { key: 'done', label: 'Done', color: '#34D399', bgClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
];

export const TASK_PRIORITIES = [
  { key: 'low', label: 'Low', color: '#94A3B8', bgClass: 'bg-slate-500/10 text-slate-500' },
  { key: 'medium', label: 'Medium', color: '#38BDF8', bgClass: 'bg-blue-500/10 text-blue-500' },
  { key: 'high', label: 'High', color: '#F97316', bgClass: 'bg-orange-500/10 text-orange-500' },
  { key: 'urgent', label: 'Urgent', color: '#EF4444', bgClass: 'bg-red-500/10 text-red-500' },
];

export const PROJECT_STATUSES = [
  { key: 'active', label: 'Active', color: '#10B981' },
  { key: 'on_hold', label: 'On Hold', color: '#F59E0B' },
  { key: 'completed', label: 'Completed', color: '#3B82F6' },
  { key: 'archived', label: 'Archived', color: '#6B7280' },
];

export const PRESET_COLORS = [
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#EF4444', // Red
  '#F97316', // Orange
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
];

export const PRESET_EMOJIS = ['📁', '🚀', '📱', '🎨', '⚡', '💻', '🎯', '🔥', '📊', '🛡️', '📦', '💡'];
