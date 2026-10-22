import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input, Textarea } from '../ui/Input';
import { PRESET_COLORS } from '../../lib/constants';
import { workspaceService } from '../../services/workspaceService';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';

export const WorkspaceModal = ({ isOpen, onClose, onCreated }) => {
  const { setWorkspaces, setActiveWorkspaceId, workspaces } = useAuthStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [accentColor, setAccentColor] = useState('#6366f1');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Workspace name is required');
      return;
    }

    try {
      setIsLoading(true);
      const res = await workspaceService.createWorkspace({
        name: name.trim(),
        description: description.trim(),
        accentColor,
      });

      const newWorkspace = res.data;
      setWorkspaces([...workspaces, newWorkspace]);
      setActiveWorkspaceId(newWorkspace._id);
      toast.success(`Workspace "${newWorkspace.name}" created!`);
      onCreated?.(newWorkspace);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create workspace');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Workspace"
      description="Workspaces let you collaborate across different teams and departments."
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        <Input
          label="Workspace Name"
          required
          placeholder="e.g. Design Studio"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <Textarea
          label="Description"
          placeholder="What is this workspace for?"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div>
          <label className="text-xs font-semibold text-text-muted block mb-2">
            Accent Brand Color
          </label>
          <div className="flex items-center gap-2.5">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setAccentColor(c)}
                className={`w-6 h-6 rounded-full transition-transform hover:scale-110 cursor-pointer ${
                  accentColor === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''
                }`}
                style={{ backgroundColor: c }}
                aria-label={`Select color ${c}`}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Create Workspace
          </Button>
        </div>
      </form>
    </Modal>
  );
};
