import { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface FeatureCardProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  badge?: string | number;
  onClick?: () => void;
  href?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';
}

const colorClasses = {
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-green-100 text-green-600',
  yellow: 'bg-yellow-100 text-yellow-600',
  red: 'bg-red-100 text-red-600',
  purple: 'bg-purple-100 text-purple-600',
  gray: 'bg-gray-100 text-gray-600',
};

export default function FeatureCard({
  title,
  description,
  icon: Icon,
  badge,
  onClick,
  href,
  color = 'blue',
}: FeatureCardProps) {
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
        isClickable && 'cursor-pointer hover:shadow-lg active:scale-95'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div className={clsx('p-2 rounded-lg', colorClasses[color])}>
            <Icon className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm md:text-base mb-1">{title}</h3>
            {description && (
              <p className="text-xs text-gray-600 line-clamp-2">{description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {badge && (
            <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-1 min-w-[20px] text-center">
              {badge}
            </span>
          )}
          {isClickable && (
            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
          )}
        </div>
      </div>
    </div>
  );
}

