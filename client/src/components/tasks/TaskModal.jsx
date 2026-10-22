import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input, Textarea } from '../ui/Input';
import { TASK_STATUSES, TASK_PRIORITIES } from '../../lib/constants';
import { taskService } from '../../services/taskService';
import { projectService } from '../../services/projectService';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { toast } from 'sonner';
import { Plus, X, Tag } from 'lucide-react';

export const TaskModal = ({ defaultProjectId, onTaskCreated }) => {
  const { isQuickTaskOpen, setQuickTaskOpen } = useUIStore();
  const { activeWorkspaceId, workspaces } = useAuthStore();

  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState(defaultProjectId || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('todo');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [selectedAssignees, setSelectedAssignees] = useState([]);
  const [labels, setLabels] = useState([]);
  const [labelInput, setLabelInput] = useState('');
  const [subtasks, setSubtasks] = useState([]);
  const [subtaskInput, setSubtaskInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const currentWorkspace = workspaces.find((w) => w._id === activeWorkspaceId);
  const workspaceMembers = currentWorkspace?.members || [];

  useEffect(() => {
    if (activeWorkspaceId && isQuickTaskOpen) {
      projectService
        .getWorkspaceProjects(activeWorkspaceId, { status: 'active' })
        .then((res) => {
          const projs = res.data || [];
          setProjects(projs);
          if (!projectId && projs.length > 0) {
            setProjectId(defaultProjectId || projs[0]._id);
          }
        })
        .catch((err) => console.error(err));
    }
  }, [activeWorkspaceId, isQuickTaskOpen, defaultProjectId]);

  useEffect(() => {
    if (defaultProjectId) {
      setProjectId(defaultProjectId);
    }
  }, [defaultProjectId]);

  const handleAddLabel = () => {
    if (labelInput.trim() && !labels.includes(labelInput.trim())) {
      setLabels([...labels, labelInput.trim()]);
      setLabelInput('');
    }
  };

  const handleAddSubtask = () => {
    if (subtaskInput.trim()) {
      setSubtasks([...subtasks, { title: subtaskInput.trim(), done: false }]);
      setSubtaskInput('');
    }
  };

  const handleRemoveSubtask = (index) => {
    setSubtasks(subtasks.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Task title is required');
      return;
    }
    if (!projectId) {
      toast.error('Please select a project');
      return;
    }

    try {
      setIsLoading(true);
      const res = await taskService.createTask(projectId, {
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        dueDate: dueDate || null,
        assignees: selectedAssignees,
        labels,
        subtasks,
      });

      toast.success('Task created successfully');
      onTaskCreated?.(res.data);
      // Reset form
      setTitle('');
      setDescription('');
      setDueDate('');
      setLabels([]);
      setSubtasks([]);
      setSelectedAssignees([]);
      setQuickTaskOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAssignee = (userId) => {
    setSelectedAssignees((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  return (
    <Modal
      isOpen={isQuickTaskOpen}
      onClose={() => setQuickTaskOpen(false)}
      title="Create New Task"
      description="Add details, assign teammates, and organize your work."
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {/* Project & Status row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-text-muted block mb-1">
              Project <span className="text-danger">*</span>
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
              required
            >
              <option value="" disabled>Select project...</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.icon || '📁'} {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-text-muted block mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
            >
              {TASK_STATUSES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Title */}
        <Input
          label="Task Title"
          required
          placeholder="e.g. Implement user login with JWT auth"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />

        {/* Priority & Due Date row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-text-muted block mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
            >
              {TASK_PRIORITIES.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <Input
            type="date"
            label="Due Date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        {/* Description */}
        <Textarea
          label="Description (Markdown supported)"
          placeholder="Provide context, acceptance criteria, or links..."
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {/* Assignees */}
        {workspaceMembers.length > 0 && (
          <div>
            <label className="text-xs font-semibold text-text-muted block mb-1.5">Assignees</label>
            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
              {workspaceMembers.map((m) => {
                const u = m.user;
                if (!u) return null;
                const isSelected = selectedAssignees.includes(u._id);
                return (
                  <button
                    key={u._id}
                    type="button"
                    onClick={() => toggleAssignee(u._id)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-primary text-white border-primary shadow-xs'
                        : 'bg-surface-2 text-text border-border hover:bg-surface-3'
                    }`}
                  >
                    <span>{u.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Labels Input */}
        <div>
          <label className="text-xs font-semibold text-text-muted block mb-1.5">Labels</label>
          <div className="flex items-center gap-2 mb-2">
            <div className="relative flex-1">
              <Tag className="w-3.5 h-3.5 absolute left-3 top-2.5 text-text-muted" />
              <input
                type="text"
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddLabel();
                  }
                }}
                placeholder="Add a label & press Enter..."
                className="w-full rounded-md border border-border bg-surface pl-8 pr-3 py-1.5 text-xs text-text placeholder:text-text-muted/60 focus:border-primary focus:outline-none"
              />
            </div>
            <Button type="button" size="sm" variant="secondary" onClick={handleAddLabel}>
              Add
            </Button>
          </div>
          {labels.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {labels.map((l) => (
                <span
                  key={l}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-2 text-text text-xs border border-border"
                >
                  #{l}
                  <button
                    type="button"
                    onClick={() => setLabels(labels.filter((item) => item !== l))}
                    className="hover:text-danger cursor-pointer ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Subtasks checklist */}
        <div>
          <label className="text-xs font-semibold text-text-muted block mb-1.5">Subtasks Checklist</label>
          <div className="flex items-center gap-2 mb-2">
            <input
              type="text"
              value={subtaskInput}
              onChange={(e) => setSubtaskInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSubtask();
                }
              }}
              placeholder="Add checklist item..."
              className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-text placeholder:text-text-muted/60 focus:border-primary focus:outline-none"
            />
            <Button type="button" size="sm" variant="secondary" onClick={handleAddSubtask}>
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
          {subtasks.length > 0 && (
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {subtasks.map((st, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-md bg-surface-2 border border-border/50 text-xs"
                >
                  <span className="truncate pr-2">{st.title}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubtask(idx)}
                    className="text-text-muted hover:text-danger cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={() => setQuickTaskOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Create Task
          </Button>
        </div>
      </form>
    </Modal>
  );
};
