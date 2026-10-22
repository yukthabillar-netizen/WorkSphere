import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, isToday, isYesterday, isTomorrow, formatDistanceToNow } from 'date-fns';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d, yyyy');
}

export function formatRelativeTime(dateString) {
  if (!dateString) return '';
  return formatDistanceToNow(new Date(dateString), { addSuffix: true });
}

export function getInitials(name = '') {
  if (!name) return 'WS';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function stringToColor(string = '') {
  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    '#6366F1', '#EC4899', '#10B981', '#F59E0B', '#3B82F6',
    '#8B5CF6', '#14B8A6', '#F97316', '#06B6D4'
  ];
  return colors[Math.abs(hash) % colors.length];
}
