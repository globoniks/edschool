import { HTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'gray' | 'solid-primary' | 'solid-success' | 'solid-warning' | 'solid-error';
  status?: 'active' | 'inactive' | 'pending' | 'completed' | 'cancelled';
  role?: 'admin' | 'teacher' | 'parent' | 'student';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export default function Badge({
  variant,
  status,
  role,
  size = 'md',
  children,
  className,
  ...props
}: BadgeProps) {
  // Determine variant based on status or role if provided
  let badgeVariant = variant;
  if (status) {
    badgeVariant = `badge-${status}` as any;
  } else if (role) {
    badgeVariant = `badge-role-${role}` as any;
  } else if (!badgeVariant) {
    badgeVariant = 'gray';
  }

  return (
    <span
      className={clsx(
        'badge',
        badgeVariant,
        `badge-${size}`,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

