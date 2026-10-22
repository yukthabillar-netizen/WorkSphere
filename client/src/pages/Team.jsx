import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { workspaceService } from '../services/workspaceService';
import { Avatar } from '../components/common/Avatar';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { TableSkeleton } from '../components/common/Skeletons';
import { toast } from 'sonner';
import {
  UserPlus,
  Shield,
  Trash2,
  Copy,
  Check,
  Users,
  KeyRound,
} from 'lucide-react';

export const Team = () => {
  const { user, activeWorkspaceId, workspaces } = useAuthStore();
  const [workspace, setWorkspace] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [isInviting, setIsInviting] = useState(false);
  const [generatedInviteLink, setGeneratedInviteLink] = useState('');
  const [copied, setCopied] = useState(false);

  // Member removal state
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const fetchWorkspaceMembers = async () => {
    if (!activeWorkspaceId) return;
    try {
      setIsLoading(true);
      const res = await workspaceService.getWorkspaceById(activeWorkspaceId);
      setWorkspace(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load team directory');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaceMembers();
  }, [activeWorkspaceId]);

  const activeWorkspace = workspaces.find((w) => w._id === activeWorkspaceId);
  const isOwner = workspace?.owner?._id === user?._id || activeWorkspace?.owner === user?._id;
  const userMemberRecord = workspace?.members?.find((m) => m.user?._id === user?._id);
  const isAdminOrOwner = isOwner || userMemberRecord?.role === 'admin';

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      toast.error('Email is required');
      return;
    }

    try {
      setIsInviting(true);
      const res = await workspaceService.createInvite(activeWorkspaceId, {
        email: inviteEmail.trim(),
        role: inviteRole,
      });

      setGeneratedInviteLink(res.data.inviteLink);
      toast.success('Invite link created!');
      fetchWorkspaceMembers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send invite');
    } finally {
      setIsInviting(false);
    }
  };

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(generatedInviteLink);
    setCopied(true);
    toast.success('Invite link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      await workspaceService.changeMemberRole(activeWorkspaceId, userId, newRole);
      toast.success('Member role updated');
      fetchWorkspaceMembers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update member role');
    }
  };

  const handleConfirmRemove = async () => {
    if (!memberToRemove) return;
    try {
      setIsRemoving(true);
      await workspaceService.removeMember(activeWorkspaceId, memberToRemove._id);
      toast.success(`Removed ${memberToRemove.name} from workspace`);
      setMemberToRemove(null);
      fetchWorkspaceMembers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    } finally {
      setIsRemoving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-border/40 rounded-xl animate-pulse" />
        <TableSkeleton />
      </div>
    );
  }

  const members = workspace?.members || [];

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text tracking-tight">Team Directory</h2>
          <p className="text-xs text-text-muted mt-0.5">
            Manage teammates, roles, and pending invitations for {workspace?.name}.
          </p>
        </div>

        {isAdminOrOwner && (
          <Button
            onClick={() => {
              setGeneratedInviteLink('');
              setInviteEmail('');
              setIsInviteModalOpen(true);
            }}
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            Invite Member
          </Button>
        )}
      </div>

      {/* Workspace Join Code Card */}
      <div className="p-4 rounded-2xl border border-primary/20 bg-primary/5 dark:bg-primary/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-text uppercase tracking-wider">Workspace Join Code</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">Quick Join</span>
          </div>
          <p className="text-xs text-text-muted">
            Share this code with teammates. They can click <strong className="text-text font-medium">"Join with code"</strong> in the workspace switcher to join instantly as a Member!
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3.5 py-1.5 rounded-xl bg-surface border border-border font-mono text-sm font-bold text-primary tracking-widest select-all shadow-xs">
            {workspace?.joinCode || 'WS-PENDING'}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (workspace?.joinCode) {
                navigator.clipboard.writeText(workspace.joinCode);
                toast.success(`Copied code "${workspace.joinCode}" to clipboard!`);
              }
            }}
            leftIcon={<Copy className="w-3.5 h-3.5" />}
          >
            Copy Code
          </Button>
        </div>
      </div>

      {/* Members Directory Table */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-xs">
        <div className="p-4 border-b border-border bg-surface-2/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-text-muted" />
            <span className="text-xs font-bold text-text">Workspace Members</span>
            <span className="px-2 py-0.5 rounded-full bg-primary-subtle text-primary font-bold text-[10px]">
              {members.length}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-surface-2/70 text-text-muted font-semibold">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                {isAdminOrOwner && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {members.map((member) => {
                const u = member.user;
                if (!u) return null;
                const isThisUserOwner = workspace.owner?._id === u._id;

                return (
                  <tr key={u._id} className="hover:bg-surface-2/50 transition-colors">
                    {/* User name & avatar */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar src={u.avatarUrl} name={u.name} size="sm" />
                        <div>
                          <div className="font-semibold text-text flex items-center gap-1.5">
                            <span>{u.name}</span>
                            {u._id === user?._id && (
                              <span className="text-[10px] text-text-muted font-normal">
                                (You)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-3.5 px-4 text-text-muted font-mono text-[11px]">
                      {u.email}
                    </td>

                    {/* Role dropdown or badge */}
                    <td className="py-3.5 px-4">
                      {isThisUserOwner ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold text-[11px] border border-primary/20">
                          <Shield className="w-3 h-3 fill-current" />
                          Owner
                        </span>
                      ) : isAdminOrOwner && u._id !== user?._id ? (
                        <select
                          value={member.role}
                          onChange={(e) => handleChangeRole(u._id, e.target.value)}
                          className="bg-surface-2 border border-border rounded-lg px-2.5 py-1 text-xs text-text focus:outline-none focus:border-primary cursor-pointer capitalize font-medium"
                        >
                          <option value="admin">Admin</option>
                          <option value="member">Member</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      ) : (
                        <span className="capitalize px-2 py-0.5 rounded-md bg-surface-2 text-text-muted font-medium border border-border">
                          {member.role}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    {isAdminOrOwner && (
                      <td className="py-3.5 px-4 text-right">
                        {!isThisUserOwner && u._id !== user?._id && (
                          <button
                            onClick={() => setMemberToRemove(u)}
                            className="p-1.5 rounded-md text-text-muted hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                            title="Remove member"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Invites List */}
      {workspace?.invites && workspace.invites.filter((i) => i.status === 'pending').length > 0 && (
        <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-xs">
          <div className="p-4 border-b border-border bg-surface-2/40">
            <h3 className="text-xs font-bold text-text">Pending Invitations</h3>
          </div>
          <div className="divide-y divide-border text-xs">
            {workspace.invites
              .filter((i) => i.status === 'pending')
              .map((inv) => (
                <div
                  key={inv._id}
                  className="p-3.5 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-text-muted" />
                    <span className="font-medium text-text">{inv.email}</span>
                    <span className="capitalize text-[10px] text-text-muted px-1.5 py-0.2 rounded bg-surface-2 border border-border">
                      {inv.role}
                    </span>
                  </div>

                  <span className="text-[11px] text-amber-500 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full">
                    Pending Acceptance
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite Teammate"
        description="Send an invite link to onboard a new member to this workspace."
        maxWidth="max-w-md"
      >
        {!generatedInviteLink ? (
          <form onSubmit={handleSendInvite} className="space-y-4 pt-1">
            <Input
              label="Teammate Email Address"
              type="email"
              required
              placeholder="sarah@company.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              autoFocus
            />

            <div>
              <label className="text-xs font-semibold text-text-muted block mb-1.5">
                Workspace Role
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-xs text-text focus:outline-none focus:border-primary capitalize font-medium"
              >
                <option value="member">Member — Can create, edit assigned tasks & comment</option>
                <option value="admin">Admin — Can manage projects, invite & manage members</option>
                <option value="viewer">Viewer — Read-only access across all workspace projects</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsInviteModalOpen(false)}
                disabled={isInviting}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={isInviting}>
                Generate Invite Link
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400">
              Invite link generated successfully! Share this link with your teammate.
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={generatedInviteLink}
                className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs text-text font-mono select-all"
              />
              <Button
                size="sm"
                onClick={handleCopyInvite}
                leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              >
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>

            <div className="flex justify-end pt-3 border-t border-border">
              <Button onClick={() => setIsInviteModalOpen(false)}>Done</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirm Remove Member Dialog */}
      <ConfirmDialog
        isOpen={Boolean(memberToRemove)}
        onClose={() => setMemberToRemove(null)}
        onConfirm={handleConfirmRemove}
        title="Remove Member from Workspace?"
        message={`Are you sure you want to remove ${memberToRemove?.name}? They will lose access to all projects and tasks in this workspace.`}
        confirmLabel="Remove Member"
        isLoading={isRemoving}
      />
    </div>
  );
};
