import { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  subtitle?: string;
  badge?: string | number;
  onClick?: () => void;
  href?: string;
  className?: string;
}

const colorClasses = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500',
  purple: 'bg-purple-500',
};

export default function MetricCard({
  title,
  value,
  icon: Icon,
  color = 'blue',
  subtitle,
  badge,
  onClick,
  href,
  className,
}: MetricCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (href) {
      navigate(href);
    } else if (onClick) {
      onClick();
    }
  };

  const isClickable = !!onClick || !!href;

  return (
    <div
      onClick={handleClick}
      className={clsx(
        'bg-white rounded-xl shadow-md p-4 md:p-6 transition-all',
        isClickable && 'cursor-pointer hover:shadow-lg active:scale-95',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs md:text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl md:text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className="relative">
          <div className={clsx('p-3 rounded-lg', colorClasses[color])}>
            <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
          {badge && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {badge}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

