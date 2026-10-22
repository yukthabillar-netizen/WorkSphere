import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { toast } from 'sonner';
import { Lock, ArrowLeft } from 'lucide-react';

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error('Missing reset token');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 8 || !/\d/.test(password)) {
      toast.error('Password must be at least 8 chars and contain a number');
      return;
    }

    try {
      setIsLoading(true);
      await authService.resetPassword({ token, password });
      toast.success('Password reset successfully. You can now log in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to login</span>
        </Link>
        <h2 className="text-2xl font-bold text-text tracking-tight">Set new password</h2>
        <p className="text-xs text-text-muted mt-1">
          Enter your new password below to regain account access.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="New Password"
          type="password"
          required
          placeholder="Min 8 characters, 1 number"
          leftIcon={<Lock className="w-4 h-4" />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />

        <Input
          label="Confirm New Password"
          type="password"
          required
          placeholder="Repeat new password"
          leftIcon={<Lock className="w-4 h-4" />}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
          Reset Password & Log In
        </Button>
      </form>
    </div>
  );
};
