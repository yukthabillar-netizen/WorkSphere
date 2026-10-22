import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { toast } from 'sonner';
import { Mail, ArrowLeft, KeyRound } from 'lucide-react';

export const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [devToken, setDevToken] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setIsLoading(true);
      const res = await authService.forgotPassword(email.trim());
      toast.success(res.message);
      if (res.devResetToken) {
        setDevToken(res.devResetToken);
      }
    } catch (err) {
      toast.error('Failed to request password reset');
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
        <h2 className="text-2xl font-bold text-text tracking-tight">Reset password</h2>
        <p className="text-xs text-text-muted mt-1">
          Enter your email address and we'll generate password reset instructions.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Account Email"
          type="email"
          required
          placeholder="alex@worksphere.io"
          leftIcon={<Mail className="w-4 h-4" />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
        />

        <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
          Send Reset Instructions
        </Button>
      </form>

      {devToken && (
        <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 space-y-2 text-xs">
          <div className="flex items-center gap-2 font-semibold text-primary">
            <KeyRound className="w-4 h-4" />
            <span>Development Reset Link:</span>
          </div>
          <p className="text-text-muted">
            Token generated: <code className="font-mono text-text">{devToken}</code>
          </p>
          <Button
            size="sm"
            onClick={() => navigate(`/reset-password?token=${devToken}`)}
            className="w-full mt-2"
          >
            Proceed to Reset Password
          </Button>
        </div>
      )}
    </div>
  );
};
