import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Sparkles, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen w-full flex bg-bg text-text">
      {/* Left Column: Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-12 lg:p-16">
        <div>
          {/* Logo */}
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-md shadow-primary/30 transition-transform group-hover:scale-105">
              <Sparkles className="w-5 h-5 fill-current" />
            </div>
            <span className="text-xl font-bold tracking-tight text-text">
              Work<span className="text-primary">Sphere</span>
            </span>
          </Link>
        </div>

        <div className="w-full max-w-md mx-auto my-auto py-8">
          <Outlet />
        </div>

        <div className="text-xs text-text-muted text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-2 pt-6 border-t border-border/40">
          <span>&copy; {new Date().getFullYear()} WorkSphere Inc. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <span className="hover:text-text cursor-pointer">Privacy</span>
            <span className="hover:text-text cursor-pointer">Terms</span>
            <span className="hover:text-text cursor-pointer">Security</span>
          </div>
        </div>
      </div>

      {/* Right Column: Visual Showcase (Hidden < 1024px) */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-indigo-900 via-indigo-950 to-[#0b0d12] p-12 xl:p-16 flex-col justify-between relative overflow-hidden text-white border-l border-border/20">
        {/* Ambient background glows */}
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-medium text-indigo-200 mb-6">
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            Next-Gen Workspace Architecture
          </div>
          <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight leading-tight mb-4">
            Where high-performing teams manage work, effortlessly.
          </h1>
          <p className="text-base text-indigo-200/80 max-w-lg leading-relaxed">
            Experience real-time Kanban boards, instant search, and collaborative task tracking designed for clarity and speed.
          </p>
        </div>

        {/* CSS Mockup Board Illustration */}
        <div className="relative z-10 my-8 bg-surface/10 backdrop-blur-md rounded-2xl border border-white/15 p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="text-xs text-white/70 font-mono ml-2">Acme Product Board</span>
            </div>
            <div className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-white/80">
              Live Sync
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Card 1 */}
            <div className="bg-surface/80 dark:bg-black/40 rounded-xl p-3 border border-white/10 text-text shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold text-primary px-1.5 py-0.5 rounded bg-primary/10">
                  Feature
                </span>
                <span className="text-[10px] text-text-muted">Today</span>
              </div>
              <h4 className="text-xs font-semibold text-text mb-2">
                Real-time cursor presence & chat
              </h4>
              <div className="flex items-center justify-between pt-1">
                <div className="flex -space-x-1.5">
                  <div className="w-5 h-5 rounded-full bg-indigo-500 text-[9px] flex items-center justify-center font-bold text-white">
                    AR
                  </div>
                  <div className="w-5 h-5 rounded-full bg-pink-500 text-[9px] flex items-center justify-center font-bold text-white">
                    SC
                  </div>
                </div>
                <span className="text-[10px] text-emerald-500 font-medium">92% Done</span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-surface/80 dark:bg-black/40 rounded-xl p-3 border border-white/10 text-text shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold text-orange-500 px-1.5 py-0.5 rounded bg-orange-500/10">
                  Design
                </span>
                <span className="text-[10px] text-text-muted">In 2d</span>
              </div>
              <h4 className="text-xs font-semibold text-text mb-2">
                Tokenized Dark & Light theme
              </h4>
              <div className="flex items-center justify-between pt-1">
                <div className="w-5 h-5 rounded-full bg-emerald-500 text-[9px] flex items-center justify-center font-bold text-white">
                  MV
                </div>
                <span className="text-[10px] text-text-muted">3 subtasks</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-6 text-xs text-indigo-200/70 pt-4">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Zero latency optimistic UI</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span>Role-based workspace security</span>
          </div>
        </div>
      </div>
    </div>
  );
};
