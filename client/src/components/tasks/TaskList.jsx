import React from 'react';
import { Avatar } from '../common/Avatar';
import { TASK_STATUSES, TASK_PRIORITIES } from '../../lib/constants';
import { formatDate } from '../../lib/utils';
import { Flag, Calendar, CheckSquare } from 'lucide-react';

export const TaskList = ({ tasks = [], onTaskClick, onTaskUpdate }) => {
  if (tasks.length === 0) {
    return (
      <div className="p-12 text-center text-xs text-text-muted border border-dashed border-border rounded-2xl bg-surface-2/40">
        No tasks match the selected filters.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-border bg-surface-2/70 text-text-muted font-semibold">
              <th className="py-3 px-4 min-w-[280px]">Task Title</th>
              <th className="py-3 px-4 min-w-[130px]">Status</th>
              <th className="py-3 px-4 min-w-[110px]">Priority</th>
              <th className="py-3 px-4 min-w-[140px]">Due Date</th>
              <th className="py-3 px-4 min-w-[140px]">Assignees</th>
              <th className="py-3 px-4 min-w-[90px]">Subtasks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {tasks.map((task) => {
              const priorityObj =
                TASK_PRIORITIES.find((p) => p.key === task.priority) || TASK_PRIORITIES[1];

              const completedSubtasks = task.subtasks?.filter((s) => s.done).length || 0;
              const totalSubtasks = task.subtasks?.length || 0;

              return (
                <tr
                  key={task._id}
                  className="hover:bg-surface-2/60 transition-colors group"
                >
                  {/* Title */}
                  <td
                    onClick={() => onTaskClick?.(task)}
                    className="py-3 px-4 font-medium text-text cursor-pointer group-hover:text-primary transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className={task.status === 'done' ? 'line-through text-text-muted' : ''}>
                        {task.title}
                      </span>
                      {task.labels && task.labels.length > 0 && (
                        <span className="text-[10px] text-text-muted px-1.5 py-0.2 rounded bg-surface-2 border border-border">
                          #{task.labels[0]}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Inline Status change */}
                  <td className="py-3 px-4">
                    <select
                      value={task.status}
                      onChange={(e) => onTaskUpdate?.(task._id, { status: e.target.value })}
                      className="bg-transparent border border-border/80 rounded-md px-2 py-1 text-xs text-text focus:outline-none focus:border-primary cursor-pointer"
                    >
                      {TASK_STATUSES.map((s) => (
                        <option key={s.key} value={s.key}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Inline Priority change */}
                  <td className="py-3 px-4">
                    <select
                      value={task.priority}
                      onChange={(e) => onTaskUpdate?.(task._id, { priority: e.target.value })}
                      className="bg-transparent border border-border/80 rounded-md px-2 py-1 text-xs text-text focus:outline-none focus:border-primary cursor-pointer capitalize"
                    >
                      {TASK_PRIORITIES.map((p) => (
                        <option key={p.key} value={p.key}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Due Date */}
                  <td className="py-3 px-4 text-text-muted">
                    {task.dueDate ? (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(task.dueDate)}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>

                  {/* Assignees */}
                  <td className="py-3 px-4">
                    <div className="flex -space-x-1.5">
                      {task.assignees && task.assignees.length > 0 ? (
                        task.assignees.map((a) => (
                          <Avatar
                            key={a._id}
                            src={a.avatarUrl}
                            name={a.name}
                            size="xs"
                          />
                        ))
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </div>
                  </td>

                  {/* Subtasks */}
                  <td className="py-3 px-4 text-text-muted">
                    {totalSubtasks > 0 ? (
                      <span className="flex items-center gap-1">
                        <CheckSquare className="w-3 h-3 text-text-muted" />
                        {completedSubtasks}/{totalSubtasks}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
