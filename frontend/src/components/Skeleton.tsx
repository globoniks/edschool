import { clsx } from 'clsx';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  lines?: number;
  animated?: boolean;
}

export default function Skeleton({
  className,
  variant = 'rectangular',
  width,
  height,
  lines = 1,
  animated = true,
}: SkeletonProps) {
  const baseClasses = clsx(
    'bg-gray-200 rounded',
    animated && 'animate-pulse'
  );

  if (variant === 'text' && lines > 1) {
    return (
      <div className={clsx('space-y-2', className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={clsx(baseClasses, 'h-4')}
            style={{ width: i === lines - 1 ? '80%' : '100%' }}
          />
        ))}
      </div>
    );
  }

  const variantClasses = {
    text: 'h-4',
    circular: 'rounded-full aspect-square',
    rectangular: '',
    rounded: 'rounded-lg',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={clsx(baseClasses, variantClasses[variant], className)}
      style={style}
    />
  );
}

// Pre-built Skeleton Components
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={clsx('card', className)}>
      <Skeleton variant="rectangular" height="200px" className="mb-4 rounded-lg" />
      <Skeleton variant="text" lines={2} className="mb-2" />
      <Skeleton variant="text" width="60%" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4, className }: { rows?: number; cols?: number; className?: string }) {
  return (
    <div className={clsx('card overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="px-4 py-3 text-left">
                  <Skeleton variant="text" width="100px" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, rowIdx) => (
              <tr key={rowIdx} className="border-t border-gray-100">
                {Array.from({ length: cols }).map((_, colIdx) => (
                  <td key={colIdx} className="px-4 py-3">
                    <Skeleton variant="text" width={colIdx === 0 ? '150px' : '100px'} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SkeletonList({ items = 5, className }: { items?: number; className?: string }) {
  return (
    <div className={clsx('space-y-3', className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="40%" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonGrid({ items = 6, cols = 3, className }: { items?: number; cols?: number; className?: string }) {
  return (
    <div className={clsx(`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${cols} gap-4`, className)}>
      {Array.from({ length: items }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonAvatar({ size = 40, className }: { size?: number; className?: string }) {
  return <Skeleton variant="circular" width={size} height={size} className={className} />;
}

export function SkeletonButton({ className }: { className?: string }) {
  return <Skeleton variant="rounded" width={120} height={40} className={className} />;
}

export function SkeletonInput({ className }: { className?: string }) {
  return <Skeleton variant="rounded" width="100%" height={40} className={className} />;
}

export function SkeletonParagraph({ lines = 3, className }: { lines?: number; className?: string }) {
  return <Skeleton variant="text" lines={lines} className={className} />;
}

// Dashboard-specific skeletons
export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton variant="text" width={200} height={32} />
          <Skeleton variant="text" width={300} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card">
            <Skeleton variant="text" width="60%" className="mb-4" />
            <Skeleton variant="text" width={80} height={32} />
          </div>
        ))}
      </div>
    </div>
  );
}
