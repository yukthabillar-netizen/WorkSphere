import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Compass, ArrowLeft } from 'lucide-react';

export const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-bg text-text">
      <div className="w-full max-w-md text-center p-8 rounded-2xl bg-surface border border-border shadow-xl space-y-4 animate-scale-in">
        <div className="w-16 h-16 rounded-3xl bg-primary-subtle text-primary mx-auto flex items-center justify-center shadow-xs">
          <Compass className="w-8 h-8 animate-spin-slow" />
        </div>

        <h1 className="text-3xl font-extrabold text-text tracking-tight">404</h1>
        <h2 className="text-base font-semibold text-text">Page not found</h2>
        <p className="text-xs text-text-muted leading-relaxed max-w-xs mx-auto">
          The page you are looking for doesn't exist, was deleted, or you might not have access to it.
        </p>

        <div className="pt-2 flex justify-center">
          <Link to="/dashboard">
            <Button leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
