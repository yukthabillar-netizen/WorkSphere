import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Avatar } from '../common/Avatar';
import { TASK_PRIORITIES } from '../../lib/constants';
import { formatDate } from '../../lib/utils';
import {
  Calendar,
  CheckSquare,
  MessageSquare,
  AlertCircle,
  Flag,
} from 'lucide-react';

export const TaskCard = ({ task, onClick, isDragging: isCustomDragging }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task._id,
    data: { task },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  const priorityObj = TASK_PRIORITIES.find((p) => p.key === task.priority) || TASK_PRIORITIES[1];

  // Overdue check
  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date().setHours(0, 0, 0, 0) &&
    task.status !== 'done';

  const completedSubtasks = task.subtasks?.filter((s) => s.done).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`group relative rounded-xl border border-border bg-surface p-3.5 shadow-xs transition-all duration-150 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-primary/40 select-none ${
        isDragging ? 'rotate-1 scale-[1.02] shadow-xl ring-2 ring-primary' : ''
      }`}
    >
      {/* Priority Flag and Labels */}
      <div className="flex items-center justify-between gap-1.5 mb-2">
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${priorityObj.bgClass}`}
            title={`Priority: ${priorityObj.label}`}
          >
            <Flag className="w-2.5 h-2.5 fill-current" />
            <span className="capitalize">{priorityObj.label}</span>
          </span>

          {task.labels && task.labels.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-text-muted bg-surface-2 px-1.5 py-0.5 rounded border border-border/60">
                #{task.labels[0]}
              </span>
              {task.labels.length > 1 && (
                <span className="text-[10px] text-text-muted bg-surface-2 px-1 py-0.5 rounded border border-border/60">
                  +{task.labels.length - 1}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Due Date chip (highlight red if overdue) */}
        {task.dueDate && (
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md ${
              isOverdue
                ? 'bg-danger/10 text-danger border border-danger/20 font-semibold'
                : 'text-text-muted bg-surface-2'
            }`}
          >
            {isOverdue && <AlertCircle className="w-2.5 h-2.5 shrink-0" />}
            {!isOverdue && <Calendar className="w-2.5 h-2.5 shrink-0" />}
            <span>{formatDate(task.dueDate)}</span>
          </span>
        )}
      </div>

      {/* Task Title (2-line clamp) */}
      <h4
        className={`text-xs font-semibold text-text line-clamp-2 leading-relaxed mb-3 group-hover:text-primary transition-colors ${
          task.status === 'done' ? 'line-through text-text-muted' : ''
        }`}
      >
        {task.title}
      </h4>

      {/* Footer Info (Subtask count, Comments, Assignees) */}
      <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[11px] text-text-muted">
        <div className="flex items-center gap-2.5">
          {totalSubtasks > 0 && (
            <div
              className={`flex items-center gap-1 ${
                completedSubtasks === totalSubtasks ? 'text-emerald-500 font-semibold' : ''
              }`}
            >
              <CheckSquare className="w-3 h-3" />
              <span>
                {completedSubtasks}/{totalSubtasks}
              </span>
            </div>
          )}
        </div>

        {/* Assignees stack */}
        <div className="flex -space-x-1.5 overflow-hidden">
          {task.assignees && task.assignees.length > 0 ? (
            task.assignees.slice(0, 3).map((assignee) => (
              <Avatar
                key={assignee._id}
                src={assignee.avatarUrl}
                name={assignee.name}
                size="xs"
              />
            ))
          ) : (
            <div className="w-5 h-5 rounded-full border border-dashed border-border flex items-center justify-center text-[9px] text-text-muted">
              +
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
