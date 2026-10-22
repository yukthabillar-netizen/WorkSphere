import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { workspaceService } from '../services/workspaceService';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { Sparkles, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const InviteAccept = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, token: authToken, setActiveWorkspaceId } = useAuthStore();
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'prompt_auth' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token) return;

    if (!authToken) {
      setStatus('prompt_auth');
      return;
    }

    const accept = async () => {
      try {
        setStatus('loading');
        const res = await workspaceService.acceptInvite(token);
        setActiveWorkspaceId(res.data.workspaceId);
        setStatus('success');
        toast.success('Workspace invite accepted!');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } catch (err) {
        setStatus('error');
        setErrorMessage(err.response?.data?.message || 'Invalid or expired invitation token');
      }
    };

    accept();
  }, [token, authToken, navigate, setActiveWorkspaceId]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-bg text-text">
      <div className="w-full max-w-md rounded-2xl bg-surface border border-border p-8 shadow-xl text-center space-y-5 animate-scale-in">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
          <Sparkles className="w-6 h-6" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-text">Workspace Invitation</h2>
          <p className="text-xs text-text-muted mt-1">
            You have been invited to join a collaborative workspace on WorkSphere.
          </p>
        </div>

        {status === 'loading' && (
          <div className="py-6 flex flex-col items-center gap-3 text-xs text-text-muted">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span>Verifying and accepting invitation...</span>
          </div>
        )}

        {status === 'success' && (
          <div className="py-6 space-y-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-text">Invite accepted successfully!</p>
            <p className="text-xs text-text-muted">Redirecting you to the workspace dashboard...</p>
          </div>
        )}

        {status === 'prompt_auth' && (
          <div className="py-4 space-y-4 text-xs">
            <p className="text-text-muted">
              Please sign in or create an account to accept this invitation.
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={() => navigate('/login')}>Sign In</Button>
              <Button variant="outline" onClick={() => navigate('/register')}>
                Create Account
              </Button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="py-4 space-y-4">
            <div className="p-3.5 rounded-xl bg-danger/10 border border-danger/20 text-xs text-danger font-medium">
              {errorMessage}
            </div>
            <Button variant="outline" onClick={() => navigate('/login')} className="w-full">
              Back to Login
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
