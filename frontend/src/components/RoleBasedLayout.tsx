import { ReactNode } from 'react';
import { useRoleUI } from '../hooks/useRoleUI';
import { clsx } from 'clsx';

interface RoleBasedLayoutProps {
  children: ReactNode;
  className?: string;
}

/**
 * Wrapper component that applies role-specific styling and layout
 */
export default function RoleBasedLayout({ children, className }: RoleBasedLayoutProps) {
  const { config, role } = useRoleUI();

  return (
    <div
      className={clsx(
        'role-based-layout',
        `role-${role.toLowerCase()}`,
        `focus-${config.focus}`,
        className
      )}
      style={{
        // Apply role-specific CSS variables
        '--role-primary': `var(--color-${config.primaryColor})`,
        '--role-accent': `var(--color-${config.accentColor})`,
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

/**
 * Role-specific section wrapper
 */
export function RoleSection({ 
  children, 
  priority = 'normal',
  className 
}: { 
  children: ReactNode;
  priority?: 'high' | 'normal' | 'low';
  className?: string;
}) {
  const { config } = useRoleUI();

  return (
    <section
      className={clsx(
        'role-section',
        `priority-${priority}`,
        priority === 'high' && 'order-first',
        className
      )}
    >
      {children}
    </section>
  );
}

/**
 * Conditionally render based on role focus
 */
export function RoleConditional({ 
  showFor,
  children 
}: { 
  showFor: 'finance-alerts' | 'progress' | 'action' | 'data' | string[];
  children: ReactNode;
}) {
  const { focus } = useRoleUI();
  
  const shouldShow = Array.isArray(showFor) 
    ? showFor.includes(focus)
    : showFor === focus;

  if (!shouldShow) return null;
  
  return <>{children}</>;
}

