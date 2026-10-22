import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import { workspaceService } from '../services/workspaceService';
import { Input, Textarea } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/common/Avatar';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { PRESET_COLORS } from '../lib/constants';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Building,
  Palette,
  AlertTriangle,
  Lock,
  Sun,
  Moon,
  Laptop,
} from 'lucide-react';

export const Settings = () => {
  const navigate = useNavigate();
  const { user, updateUser, activeWorkspaceId, workspaces, setWorkspaces, setActiveWorkspaceId, theme, setTheme } =
    useAuthStore();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'workspace' | 'appearance' | 'danger'

  // Profile Form state
  const [name, setName] = useState(user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Workspace Form state
  const activeWorkspace = workspaces.find((w) => w._id === activeWorkspaceId);
  const [workspaceName, setWorkspaceName] = useState(activeWorkspace?.name || '');
  const [workspaceDescription, setWorkspaceDescription] = useState(activeWorkspace?.description || '');
  const [accentColor, setAccentColor] = useState(activeWorkspace?.accentColor || '#6366f1');
  const [isUpdatingWorkspace, setIsUpdatingWorkspace] = useState(false);

  // Delete Workspace state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setAvatarUrl(user.avatarUrl || '');
    }
  }, [user]);

  useEffect(() => {
    if (activeWorkspace) {
      setWorkspaceName(activeWorkspace.name || '');
      setWorkspaceDescription(activeWorkspace.description || '');
      setAccentColor(activeWorkspace.accentColor || '#6366f1');
    }
  }, [activeWorkspace]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    try {
      setIsUpdatingProfile(true);
      const res = await authService.updateProfile({ name: name.trim(), avatarUrl: avatarUrl.trim() });
      updateUser(res.data.user);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error('Please enter current and new password');
      return;
    }
    if (newPassword.length < 8 || !/\d/.test(newPassword)) {
      toast.error('New password must be at least 8 chars and contain a number');
      return;
    }
    try {
      setIsChangingPassword(true);
      await authService.changePassword({ currentPassword, newPassword });
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleUpdateWorkspace = async (e) => {
    e.preventDefault();
    if (!workspaceName.trim()) {
      toast.error('Workspace name cannot be empty');
      return;
    }
    try {
      setIsUpdatingWorkspace(true);
      const res = await workspaceService.updateWorkspace(activeWorkspaceId, {
        name: workspaceName.trim(),
        description: workspaceDescription.trim(),
        accentColor,
      });

      setWorkspaces(
        workspaces.map((w) => (w._id === activeWorkspaceId ? res.data : w))
      );
      toast.success('Workspace updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update workspace');
    } finally {
      setIsUpdatingWorkspace(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    try {
      setIsDeleting(true);
      await workspaceService.deleteWorkspace(activeWorkspaceId);
      toast.success('Workspace deleted');
      const remaining = workspaces.filter((w) => w._id !== activeWorkspaceId);
      setWorkspaces(remaining);
      if (remaining.length > 0) {
        setActiveWorkspaceId(remaining[0]._id);
      } else {
        navigate('/login');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete workspace');
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const isWorkspaceOwner = activeWorkspace?.owner === user?._id || activeWorkspace?.owner?._id === user?._id;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-text tracking-tight">Settings</h2>
        <p className="text-xs text-text-muted mt-0.5">
          Manage your account profile, workspace preferences, and appearance.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-1">
        {[
          { key: 'profile', label: 'My Profile', icon: User },
          { key: 'workspace', label: 'Workspace', icon: Building },
          { key: 'appearance', label: 'Appearance', icon: Palette },
          { key: 'danger', label: 'Danger Zone', icon: AlertTriangle },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                isActive
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-text-muted hover:text-text hover:bg-surface-2'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab: Profile */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <form
            onSubmit={handleUpdateProfile}
            className="rounded-2xl border border-border bg-surface p-6 shadow-xs space-y-5"
          >
            <h3 className="text-base font-bold text-text border-b border-border pb-2">
              Profile Information
            </h3>

            <div className="flex items-center gap-4">
              <Avatar src={avatarUrl} name={name} size="xl" />
              <div className="flex-1">
                <Input
                  label="Avatar Image URL"
                  placeholder="https://example.com/avatar.jpg"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  helperText="Paste any direct public image URL to update your avatar."
                />
              </div>
            </div>

            <Input
              label="Full Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <Input
              label="Email Address"
              disabled
              value={user?.email || ''}
              helperText="Email address cannot be changed."
            />

            <div className="flex justify-end pt-2">
              <Button type="submit" isLoading={isUpdatingProfile}>
                Save Profile
              </Button>
            </div>
          </form>

          {/* Password update */}
          <form
            onSubmit={handleChangePassword}
            className="rounded-2xl border border-border bg-surface p-6 shadow-xs space-y-4"
          >
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <Lock className="w-4 h-4 text-text-muted" />
              <h3 className="text-base font-bold text-text">Change Password</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Current Password"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <Input
                label="New Password"
                type="password"
                required
                placeholder="Min 8 characters, 1 number"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" variant="secondary" isLoading={isChangingPassword}>
                Update Password
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Tab: Workspace Settings */}
      {activeTab === 'workspace' && (
        <form
          onSubmit={handleUpdateWorkspace}
          className="rounded-2xl border border-border bg-surface p-6 shadow-xs space-y-5"
        >
          <h3 className="text-base font-bold text-text border-b border-border pb-2">
            Workspace Configuration
          </h3>

          <Input
            label="Workspace Name"
            required
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
          />

          <Textarea
            label="Workspace Description"
            rows={3}
            value={workspaceDescription}
            onChange={(e) => setWorkspaceDescription(e.target.value)}
          />

          <div>
            <label className="text-xs font-semibold text-text-muted block mb-2">
              Accent Brand Color
            </label>
            <div className="flex items-center gap-3">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setAccentColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform hover:scale-110 cursor-pointer ${
                    accentColor === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" isLoading={isUpdatingWorkspace}>
              Update Workspace
            </Button>
          </div>
        </form>
      )}

      {/* Tab: Appearance */}
      {activeTab === 'appearance' && (
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs space-y-5">
          <h3 className="text-base font-bold text-text border-b border-border pb-2">
            Theme & Display
          </h3>
          <p className="text-xs text-text-muted">
            Choose your preferred color theme across the WorkSphere platform.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {[
              { key: 'light', label: 'Light', icon: Sun, desc: 'Clean, high contrast daylight' },
              { key: 'dark', label: 'Dark', icon: Moon, desc: 'Deep calm tones, easy on the eyes' },
              { key: 'system', label: 'System', icon: Laptop, desc: 'Syncs automatically with OS' },
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = theme === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setTheme(item.key)}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                      : 'border-border bg-surface-2/40 hover:bg-surface-2'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon className="w-5 h-5 text-primary" />
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-text">{item.label}</h4>
                  <p className="text-[11px] text-text-muted mt-1 leading-snug">{item.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: Danger Zone */}
      {activeTab === 'danger' && (
        <div className="rounded-2xl border border-danger/30 bg-danger/5 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-danger">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="text-base font-bold">Danger Zone</h3>
          </div>
          <p className="text-xs text-text-muted leading-relaxed">
            Deleting this workspace will permanently erase all associated projects, tasks, comments, and member associations. This action cannot be reversed.
          </p>

          {isWorkspaceOwner ? (
            <div className="pt-2">
              <Button
                variant="danger"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                Delete This Workspace
              </Button>
            </div>
          ) : (
            <div className="text-xs text-text-muted font-medium italic">
              Only the workspace owner can delete this workspace.
            </div>
          )}

          <ConfirmDialog
            isOpen={isDeleteDialogOpen}
            onClose={() => setIsDeleteDialogOpen(false)}
            onConfirm={handleDeleteWorkspace}
            title="Permanently Delete Workspace?"
            message={`Are you sure you want to delete "${activeWorkspace?.name}"? All associated data will be removed forever.`}
            confirmLabel="Delete Workspace"
            isLoading={isDeleting}
          />
        </div>
      )}
    </div>
  );
};
