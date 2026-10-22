import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { toast } from 'sonner';
import { Mail, Lock, Sparkles, ArrowRight } from 'lucide-react';

export const Login = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    try {
      setIsLoading(true);
      const res = await authService.login({ email, password });
      setAuth(res.data.user, res.data.accessToken, res.data.workspaces);
      toast.success(`Welcome back, ${res.data.user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick fill helper for demo accounts
  const quickFill = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('Password123');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-text tracking-tight">Welcome back</h2>
        <p className="text-xs text-text-muted mt-1">
          Sign in to your account to continue collaborating.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          required
          placeholder="alex@worksphere.io"
          leftIcon={<Mail className="w-4 h-4" />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
        />

        <div className="space-y-1">
          <Input
            label="Password"
            type="password"
            required
            placeholder="••••••••"
            leftIcon={<Lock className="w-4 h-4" />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="flex justify-end pt-1">
            <Link
              to="/forgot-password"
              className="text-xs text-primary hover:underline font-medium"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full mt-2"
          size="lg"
          isLoading={isLoading}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Sign In
        </Button>
      </form>

      {/* Demo Credentials Quick-login Chips */}
      <div className="pt-4 border-t border-border/80">
        <div className="flex items-center gap-1.5 text-xs text-text-muted mb-2 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span>One-Click Demo Accounts:</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { name: 'Alex Rivers (Owner)', email: 'alex@worksphere.io' },
            { name: 'Sarah Chen (Admin)', email: 'sarah@worksphere.io' },
            { name: 'Marcus Vance (Member)', email: 'marcus@worksphere.io' },
            { name: 'Elena Rostova (Member)', email: 'elena@worksphere.io' },
          ].map((acc) => (
            <button
              key={acc.email}
              type="button"
              onClick={() => quickFill(acc.email)}
              className="px-2.5 py-1.5 rounded-lg border border-border bg-surface-2/60 hover:bg-surface-2 hover:border-primary/40 text-left transition-colors cursor-pointer text-xs"
            >
              <div className="font-semibold text-text truncate">{acc.name}</div>
              <div className="text-[10px] text-text-muted truncate">{acc.email}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="text-center text-xs text-text-muted pt-2">
        Don't have an account?{' '}
        <Link to="/register" className="text-primary font-semibold hover:underline">
          Create an account
        </Link>
      </div>
    </div>
  );
};
