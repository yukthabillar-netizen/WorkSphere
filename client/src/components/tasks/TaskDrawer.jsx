import React, { useState, useEffect } from 'react';
import { Drawer } from '../ui/Drawer';
import { Avatar } from '../common/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { CommentThread } from '../comments/CommentThread';
import { TASK_STATUSES, TASK_PRIORITIES } from '../../lib/constants';
import { taskService } from '../../services/taskService';
import { projectService } from '../../services/projectService';
import { formatDate, formatRelativeTime } from '../../lib/utils';
import { toast } from 'sonner';
import {
  Calendar,
  Flag,
  Tag,
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Clock,
  MessageSquare,
  Activity as ActivityIcon,
  X,
  Copy,
} from 'lucide-react';

export const TaskDrawer = ({ taskId, isOpen, onClose, onTaskUpdated, onTaskDeleted, workspaceMembers = [] }) => {
  const [task, setTask] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('comments'); // 'comments' | 'activity'
  const [activities, setActivities] = useState([]);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descriptionValue, setDescriptionValue] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newLabel, setNewLabel] = useState('');

  const fetchTaskDetails = async () => {
    if (!taskId) return;
    try {
      setIsLoading(true);
      const res = await taskService.getTaskById(taskId);
      const t = res.data;
      setTask(t);
      setTitleValue(t.title);
      setDescriptionValue(t.description || '');

      // Also fetch activities if on project
      if (t.project?._id) {
        projectService
          .getProjectActivity(t.project._id)
          .then((actRes) => {
            const taskActs = (actRes.data || []).filter(
              (a) => a.task?._id === taskId || a.task === taskId
            );
            setActivities(taskActs);
          })
          .catch(() => {});
      }
    } catch (err) {
      console.error(err);
      toast.error('Could not load task details');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && taskId) {
      fetchTaskDetails();
    } else {
      setTask(null);
    }
  }, [taskId, isOpen]);

  const handleUpdate = async (updates) => {
    try {
      const res = await taskService.updateTask(task._id, updates);
      setTask(res.data);
      onTaskUpdated?.(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update task');
    }
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (titleValue.trim() && titleValue !== task.title) {
      handleUpdate({ title: titleValue.trim() });
    }
  };

  const handleDescriptionBlur = () => {
    setIsEditingDescription(false);
    if (descriptionValue !== task.description) {
      handleUpdate({ description: descriptionValue });
    }
  };

  const handleToggleSubtask = (index) => {
    const updated = [...task.subtasks];
    updated[index].done = !updated[index].done;
    handleUpdate({ subtasks: updated });
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    const updated = [...(task.subtasks || []), { title: newSubtaskTitle.trim(), done: false }];
    handleUpdate({ subtasks: updated });
    setNewSubtaskTitle('');
  };

  const handleDeleteSubtask = (index) => {
    const updated = task.subtasks.filter((_, idx) => idx !== index);
    handleUpdate({ subtasks: updated });
  };

  const handleAddLabel = () => {
    if (!newLabel.trim() || task.labels?.includes(newLabel.trim())) return;
    const updated = [...(task.labels || []), newLabel.trim()];
    handleUpdate({ labels: updated });
    setNewLabel('');
  };

  const handleRemoveLabel = (labelToRemove) => {
    const updated = task.labels.filter((l) => l !== labelToRemove);
    handleUpdate({ labels: updated });
  };

  const toggleAssignee = (userId) => {
    const currentIds = (task.assignees || []).map((a) => a._id || a);
    const updated = currentIds.includes(userId)
      ? currentIds.filter((id) => id !== userId)
      : [...currentIds, userId];
    handleUpdate({ assignees: updated });
  };

  const handleDeleteTask = async () => {
    try {
      await taskService.deleteTask(task._id);
      onTaskDeleted?.(task._id);
      onClose();

      toast('Task moved to trash', {
        action: {
          label: 'Undo',
          onClick: async () => {
            try {
              const res = await taskService.restoreTask(task._id);
              onTaskUpdated?.(res.data);
              toast.success('Task restored');
            } catch (err) {
              toast.error('Failed to undo delete');
            }
          },
        },
        duration: 5000,
      });
    } catch (err) {
      toast.error('Failed to delete task');
    }
  };

  if (!task) return null;

  const priorityObj = TASK_PRIORITIES.find((p) => p.key === task.priority) || TASK_PRIORITIES[1];
  const statusObj = TASK_STATUSES.find((s) => s.key === task.status) || TASK_STATUSES[0];

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-text-muted">
            {task.project?.name || 'Task'}
          </span>
          <span className="text-text-muted">•</span>
          <span className="text-xs text-text-muted">ID: {task._id.slice(-6)}</span>
        </div>
      }
      headerActions={
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success('Task URL copied to clipboard');
            }}
            className="p-1.5 rounded-md text-text-muted hover:text-text hover:bg-surface-2 transition-colors cursor-pointer"
            title="Copy task URL"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={handleDeleteTask}
            className="p-1.5 rounded-md text-text-muted hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
            title="Move task to trash"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      }
    >
      <div className="space-y-6 pb-8">
        {/* Title (Inline editable) */}
        <div>
          {isEditingTitle ? (
            <input
              type="text"
              autoFocus
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleBlur()}
              className="w-full text-lg font-bold text-text bg-transparent border-b-2 border-primary focus:outline-none"
            />
          ) : (
            <h2
              onClick={() => setIsEditingTitle(true)}
              className="text-lg font-bold text-text hover:bg-surface-2/60 p-1 -ml-1 rounded-md transition-colors cursor-pointer select-text"
            >
              {task.title}
            </h2>
          )}
        </div>

        {/* Property Grid (Status, Priority, Assignees, Due date) */}
        <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-surface-2/50 border border-border text-xs">
          {/* Status */}
          <div className="space-y-1">
            <span className="text-text-muted font-medium">Status</span>
            <select
              value={task.status}
              onChange={(e) => handleUpdate({ status: e.target.value })}
              className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 font-medium text-text focus:outline-none focus:border-primary cursor-pointer"
            >
              {TASK_STATUSES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div className="space-y-1">
            <span className="text-text-muted font-medium">Priority</span>
            <select
              value={task.priority}
              onChange={(e) => handleUpdate({ priority: e.target.value })}
              className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 font-medium text-text focus:outline-none focus:border-primary cursor-pointer"
            >
              {TASK_PRIORITIES.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Due date */}
          <div className="space-y-1">
            <span className="text-text-muted font-medium">Due Date</span>
            <input
              type="date"
              value={task.dueDate ? task.dueDate.split('T')[0] : ''}
              onChange={(e) => handleUpdate({ dueDate: e.target.value || null })}
              className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-text focus:outline-none focus:border-primary"
            />
          </div>

          {/* Created by info */}
          <div className="space-y-1">
            <span className="text-text-muted font-medium">Created By</span>
            <div className="flex items-center gap-2 pt-1">
              <Avatar
                src={task.createdBy?.avatarUrl}
                name={task.createdBy?.name || 'User'}
                size="xs"
              />
              <span className="text-text font-medium truncate">{task.createdBy?.name}</span>
            </div>
          </div>
        </div>

        {/* Assignees selector */}
        <div>
          <span className="text-xs font-semibold text-text-muted block mb-2">Assignees</span>
          <div className="flex flex-wrap gap-2">
            {workspaceMembers.map((m) => {
              const u = m.user;
              if (!u) return null;
              const isAssigned = (task.assignees || []).some(
                (a) => (a._id || a) === u._id
              );
              return (
                <button
                  key={u._id}
                  type="button"
                  onClick={() => toggleAssignee(u._id)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                    isAssigned
                      ? 'bg-primary text-white border-primary shadow-xs'
                      : 'bg-surface-2 text-text border-border hover:bg-surface-3'
                  }`}
                >
                  <Avatar src={u.avatarUrl} name={u.name} size="xs" />
                  <span>{u.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Labels chips */}
        <div>
          <span className="text-xs font-semibold text-text-muted block mb-2">Labels</span>
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            {task.labels && task.labels.length > 0 ? (
              task.labels.map((l) => (
                <span
                  key={l}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-surface-2 text-text text-xs border border-border"
                >
                  #{l}
                  <button
                    onClick={() => handleRemoveLabel(l)}
                    className="hover:text-danger cursor-pointer ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))
            ) : (
              <span className="text-xs text-text-muted">No labels added yet.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLabel())}
              placeholder="Add label & enter..."
              className="bg-surface border border-border rounded-lg px-2.5 py-1 text-xs text-text placeholder:text-text-muted focus:outline-none focus:border-primary"
            />
            <Button size="xs" variant="secondary" onClick={handleAddLabel}>
              Add
            </Button>
          </div>
        </div>

        {/* Description Editor / Preview */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-text-muted">Description</span>
            {!isEditingDescription && (
              <button
                onClick={() => setIsEditingDescription(true)}
                className="text-xs text-primary font-medium hover:underline cursor-pointer"
              >
                Edit
              </button>
            )}
          </div>

          {isEditingDescription ? (
            <div className="space-y-2">
              <textarea
                rows={5}
                value={descriptionValue}
                onChange={(e) => setDescriptionValue(e.target.value)}
                onBlur={handleDescriptionBlur}
                className="w-full p-3 rounded-xl border border-border bg-surface text-xs text-text placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Add rich description..."
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button size="xs" variant="secondary" onClick={() => setIsEditingDescription(false)}>
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => setIsEditingDescription(true)}
              className="p-3.5 rounded-xl bg-surface-2/40 border border-border/80 text-xs text-text leading-relaxed cursor-pointer hover:bg-surface-2 min-h-[60px] whitespace-pre-wrap"
            >
              {task.description || (
                <span className="text-text-muted italic">Click here to add a description...</span>
              )}
            </div>
          )}
        </div>

        {/* Subtask checklist */}
        <div>
          <span className="text-xs font-semibold text-text-muted block mb-2">
            Subtasks Checklist (
            {task.subtasks?.filter((s) => s.done).length || 0}/{task.subtasks?.length || 0})
          </span>

          <div className="space-y-1.5 mb-2">
            {task.subtasks && task.subtasks.map((st, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-lg bg-surface-2/60 border border-border/60 text-xs group"
              >
                <button
                  type="button"
                  onClick={() => handleToggleSubtask(idx)}
                  className="flex items-center gap-2 cursor-pointer flex-1 text-left"
                >
                  {st.done ? (
                    <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-text-muted shrink-0" />
                  )}
                  <span className={st.done ? 'line-through text-text-muted' : 'text-text'}>
                    {st.title}
                  </span>
                </button>
                <button
                  onClick={() => handleDeleteSubtask(idx)}
                  className="text-text-muted opacity-0 group-hover:opacity-100 hover:text-danger cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubtask())}
              placeholder="Add checklist item..."
              className="w-full bg-surface border border-border rounded-lg px-2.5 py-1 text-xs text-text placeholder:text-text-muted focus:outline-none focus:border-primary"
            />
            <Button size="xs" variant="secondary" onClick={handleAddSubtask}>
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Tabs: Comments vs Activity */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-center gap-3 border-b border-border pb-2 mb-4">
            <button
              onClick={() => setActiveTab('comments')}
              className={`flex items-center gap-1.5 text-xs font-semibold pb-1 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'comments'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-muted hover:text-text'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Comments</span>
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`flex items-center gap-1.5 text-xs font-semibold pb-1 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'activity'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-muted hover:text-text'
              }`}
            >
              <ActivityIcon className="w-3.5 h-3.5" />
              <span>Task Activity</span>
            </button>
          </div>

          {activeTab === 'comments' ? (
            <CommentThread taskId={task._id} workspaceMembers={workspaceMembers} />
          ) : (
            <div className="space-y-3">
              {activities.length === 0 ? (
                <div className="py-6 text-center text-xs text-text-muted">
                  No activity history logged for this task yet.
                </div>
              ) : (
                activities.map((act) => (
                  <div key={act._id} className="flex items-start gap-3 text-xs">
                    <Avatar
                      src={act.actor?.avatarUrl}
                      name={act.actor?.name || 'User'}
                      size="xs"
                    />
                    <div className="flex-1">
                      <p className="text-text">
                        <span className="font-semibold">{act.actor?.name}</span>{' '}
                        <span className="text-text-muted">{act.action.replace('_', ' ')}</span>
                      </p>
                      <span className="text-[10px] text-text-muted">
                        {formatRelativeTime(act.createdAt)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
};
