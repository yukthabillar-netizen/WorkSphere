import React from 'react';
import { cn } from '../../lib/utils';

export const Skeleton = ({ className, ...props }) => {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-border/50', className)}
      {...props}
    />
  );
};

export const CardSkeleton = () => (
  <div className="rounded-xl border border-border bg-surface p-5 space-y-4 shadow-sm">
    <div className="flex items-center justify-between">
      <Skeleton className="h-6 w-24" />
      <Skeleton className="h-4 w-12 rounded-full" />
    </div>
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-2 w-full rounded-full" />
    <div className="flex items-center justify-between pt-2">
      <div className="flex -space-x-2">
        <Skeleton className="h-7 w-7 rounded-full" />
        <Skeleton className="h-7 w-7 rounded-full" />
      </div>
      <Skeleton className="h-4 w-16" />
    </div>
  </div>
);

export const BoardSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-[calc(100vh-220px)]">
    {[1, 2, 3, 4].map((col) => (
      <div key={col} className="rounded-xl bg-surface-2/60 border border-border p-3 flex flex-col gap-3">
        <div className="flex items-center justify-between pb-2 border-b border-border/50">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-5 rounded-md" />
        </div>
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-28 w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-lg" />
      </div>
    ))}
  </div>
);

export const TableSkeleton = () => (
  <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-xs">
    <div className="p-4 border-b border-border flex justify-between">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-5 w-20" />
    </div>
    <div className="divide-y divide-border">
      {[1, 2, 3, 4, 5].map((row) => (
        <div key={row} className="p-4 flex items-center justify-between gap-4">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-20 rounded-full" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-7 w-7 rounded-full" />
        </div>
      ))}
    </div>
  </div>
);
