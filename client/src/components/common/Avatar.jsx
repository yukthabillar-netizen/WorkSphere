import React, { useState } from 'react';
import { cn, getInitials, stringToColor } from '../../lib/utils';

export const Avatar = ({ src, name = '', size = 'md', className, ...props }) => {
  const [imgError, setImgError] = useState(false);

  const sizes = {
    xs: 'w-5 h-5 text-[10px]',
    sm: 'w-7 h-7 text-xs',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm font-semibold',
    xl: 'w-16 h-16 text-lg font-semibold',
  };

  const bgColor = stringToColor(name || 'User');
  const initials = getInitials(name);

  return (
    <div
      className={cn(
        'relative rounded-full shrink-0 flex items-center justify-center select-none overflow-hidden border border-border/40 shadow-xs font-medium',
        sizes[size],
        className
      )}
      style={{ backgroundColor: !src || imgError ? bgColor : undefined }}
      title={name}
      {...props}
    >
      {src && !imgError ? (
        <img
          src={src}
          alt={name}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="text-white drop-shadow-xs">{initials}</span>
      )}
    </div>
  );
};
