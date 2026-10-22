import React from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '../common/Avatar';
import { Badge } from '../ui/Badge';
import { formatDate } from '../../lib/utils';
import { Calendar, CheckCircle2 } from 'lucide-react';

export const ProjectCard = ({ project, onEdit, onDelete }) => {
  const statusVariants = {
    active: 'success',
    on_hold: 'warning',
    completed: 'primary',
    archived: 'default',
  };

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-xs hover:shadow-md hover:border-primary/40 transition-all flex flex-col justify-between group">
      {/* Top Color Accent Strip */}
      <div
        className="h-1.5 w-full"
        style={{ backgroundColor: project.color || '#6366f1' }}
      />

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Header with Icon, Name, and Status Badge */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <Link
              to={`/projects/${project._id}`}
              className="flex items-center gap-2.5 min-w-0"
            >
              <span className="text-2xl p-1.5 rounded-xl bg-surface-2 shrink-0">
                {project.icon || '📁'}
              </span>
              <h3 className="text-sm font-bold text-text truncate group-hover:text-primary transition-colors">
                {project.name}
              </h3>
            </Link>
            <Badge variant={statusVariants[project.status] || 'default'} className="capitalize shrink-0">
              {project.status.replace('_', ' ')}
            </Badge>
          </div>

          {/* Description (2-line clamp) */}
          <p className="text-xs text-text-muted line-clamp-2 mb-4 leading-relaxed">
            {project.description || 'No description provided.'}
          </p>
        </div>

        <div>
          {/* Progress Bar & % */}
          <div className="space-y-1.5 mb-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-muted font-medium">Progress</span>
              <span className="font-bold text-text">{project.progress || 0}%</span>
            </div>
            <div className="w-full bg-surface-3 rounded-full h-2 overflow-hidden">
              <div
                className="h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${project.progress || 0}%`,
                  backgroundColor: project.color || '#6366f1',
                }}
              />
            </div>
            <div className="text-[11px] text-text-muted flex items-center justify-between pt-0.5">
              <span>
                {project.doneTasks || 0} / {project.totalTasks || 0} tasks done
              </span>
              {project.dueDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(project.dueDate)}
                </span>
              )}
            </div>
          </div>

          {/* Member Avatar Stack & Details Link */}
          <div className="flex items-center justify-between pt-3 border-t border-border/60">
            <div className="flex -space-x-2 overflow-hidden">
              {project.members && project.members.length > 0 ? (
                project.members.slice(0, 4).map((member) => (
                  <Avatar
                    key={member._id}
                    src={member.avatarUrl}
                    name={member.name}
                    size="sm"
                  />
                ))
              ) : (
                <span className="text-xs text-text-muted">No members</span>
              )}
              {project.members && project.members.length > 4 && (
                <div className="w-7 h-7 rounded-full bg-surface-3 border border-surface text-[10px] font-semibold text-text-muted flex items-center justify-center">
                  +{project.members.length - 4}
                </div>
              )}
            </div>

            <Link
              to={`/projects/${project._id}`}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Open Board →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
