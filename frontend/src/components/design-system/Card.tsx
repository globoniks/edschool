import { HTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'flat' | 'outlined' | 'interactive' | 'hover' | 'primary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  header?: ReactNode;
  title?: string;
  subtitle?: string;
  footer?: ReactNode;
  children: ReactNode;
}

export default function Card({
  variant = 'default',
  size = 'md',
  header,
  title,
  subtitle,
  footer,
  children,
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={clsx(
        'card',
        `card-${variant}`,
        `card-${size}`,
        className
      )}
      {...props}
    >
      {(header || title) && (
        <div className="card-header">
          {header || (
            <>
              {title && <h3 className="card-title">{title}</h3>}
              {subtitle && <p className="card-subtitle">{subtitle}</p>}
            </>
          )}
        </div>
      )}
      <div className="card-body">
        {children}
      </div>
      {footer && (
        <div className="card-footer">
          {footer}
        </div>
      )}
    </div>
  );
}

