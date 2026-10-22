import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { workspaceService } from '../../services/workspaceService';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';
import { KeyRound, ArrowRight, Sparkles } from 'lucide-react';

export const JoinWorkspaceModal = ({ isOpen, onClose, onJoined }) => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setActiveWorkspaceId, addWorkspace } = useAuthStore();

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error('Please enter a workspace code');
      return;
    }

    try {
      setIsLoading(true);
      const res = await workspaceService.joinByCode(code.trim());
      const ws = res.data.workspace;

      if (addWorkspace) {
        addWorkspace(ws);
      }
      setActiveWorkspaceId(ws._id);

      toast.success(res.message || `Joined "${ws.name}" successfully!`);
      setCode('');
      onClose();
      if (onJoined) onJoined(ws);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join workspace. Please verify the code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Join a Workspace">
      <form onSubmit={handleJoin} className="space-y-4">
        <div className="p-3 rounded-xl bg-primary/5 border border-primary/15 text-xs text-text-muted flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <span>
            Enter the 6-character Workspace Code shared by your workspace Owner or Admin (e.g.{' '}
            <strong className="font-mono text-primary font-bold">WS-K8F29A</strong>).
          </span>
        </div>

        <Input
          label="Workspace Code"
          required
          placeholder="e.g. WS-K8F29A"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          leftIcon={<KeyRound className="w-4 h-4 text-primary" />}
          autoFocus
          className="font-mono uppercase tracking-wider"
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isLoading}
            disabled={!code.trim()}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Join Workspace
          </Button>
        </div>
      </form>
    </Modal>
  );
};
