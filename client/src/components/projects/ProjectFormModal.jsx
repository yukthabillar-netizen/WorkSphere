import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input, Textarea } from '../ui/Input';
import { PRESET_COLORS, PRESET_EMOJIS } from '../../lib/constants';
import { projectService } from '../../services/projectService';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';

export const ProjectFormModal = ({ isOpen, onClose, onProjectCreated, projectToEdit }) => {
  const { activeWorkspaceId, workspaces } = useAuthStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#6366F1');
  const [icon, setIcon] = useState('📁');
  const [status, setStatus] = useState('active');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const currentWorkspace = workspaces.find((w) => w._id === activeWorkspaceId);
  const workspaceMembers = currentWorkspace?.members || [];

  useEffect(() => {
    if (projectToEdit) {
      setName(projectToEdit.name || '');
      setDescription(projectToEdit.description || '');
      setColor(projectToEdit.color || '#6366F1');
      setIcon(projectToEdit.icon || '📁');
      setStatus(projectToEdit.status || 'active');
      setStartDate(projectToEdit.startDate ? projectToEdit.startDate.split('T')[0] : '');
      setDueDate(projectToEdit.dueDate ? projectToEdit.dueDate.split('T')[0] : '');
      setSelectedMembers(projectToEdit.members?.map((m) => m._id || m) || []);
    } else {
      setName('');
      setDescription('');
      setColor('#6366F1');
      setIcon('📁');
      setStatus('active');
      setStartDate('');
      setDueDate('');
      setSelectedMembers([]);
    }
  }, [projectToEdit, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Project name is required');
      return;
    }

    try {
      setIsLoading(true);
      const payload = {
        name: name.trim(),
        description: description.trim(),
        color,
        icon,
        status,
        startDate: startDate || null,
        dueDate: dueDate || null,
        members: selectedMembers,
      };

      let result;
      if (projectToEdit) {
        result = await projectService.updateProject(projectToEdit._id, payload);
        toast.success('Project updated successfully');
      } else {
        result = await projectService.createProject(activeWorkspaceId, payload);
        toast.success('Project created successfully');
      }

      onProjectCreated?.(result.data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save project');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMember = (memberId) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={projectToEdit ? 'Edit Project' : 'Create New Project'}
      description="Organize your team's tasks and milestones into a focused project."
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {/* Icon & Color selector */}
        <div className="flex items-center gap-4 p-3 bg-surface-2/60 rounded-xl border border-border">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-xs shrink-0"
            style={{ backgroundColor: color + '25', border: `2px solid ${color}` }}
          >
            {icon}
          </div>

          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {PRESET_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={`text-base p-1 rounded-md transition-transform hover:scale-110 cursor-pointer ${
                    icon === emoji ? 'bg-surface shadow-xs ring-2 ring-primary' : ''
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-5 h-5 rounded-full transition-transform hover:scale-110 cursor-pointer ${
                    color === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Select color ${c}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Name input */}
        <Input
          label="Project Name"
          required
          placeholder="e.g. Website Redesign"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        {/* Description */}
        <Textarea
          label="Description"
          placeholder="What is the goal of this project?"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {/* Date Row */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            type="date"
            label="Start Date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            type="date"
            label="Target Due Date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        {/* Members assignment */}
        {workspaceMembers.length > 0 && (
          <div>
            <label className="text-xs font-semibold text-text-muted block mb-2">
              Project Members
            </label>
            <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto p-1">
              {workspaceMembers.map((m) => {
                const u = m.user;
                if (!u) return null;
                const isSelected = selectedMembers.includes(u._id);
                return (
                  <button
                    key={u._id}
                    type="button"
                    onClick={() => toggleMember(u._id)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
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

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {projectToEdit ? 'Save Changes' : 'Create Project'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
