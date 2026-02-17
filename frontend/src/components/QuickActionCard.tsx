import { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';

interface QuickAction {
  label: string;
  icon: LucideIcon;
  onClick?: () => void;
  href?: string;
  primary?: boolean;
}

interface QuickActionCardProps {
  actions: QuickAction[];
  title?: string;
}

export default function QuickActionCard({ actions, title }: QuickActionCardProps) {
  const navigate = useNavigate();

  const handleAction = (action: QuickAction) => {
    if (action.href) {
      navigate(action.href);
    } else if (action.onClick) {
      action.onClick();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={index}
              onClick={() => handleAction(action)}
              className={clsx(
                'flex flex-col items-center justify-center gap-2 p-4 rounded-lg transition-all min-h-[88px]',
                action.primary
                  ? 'bg-primary-600 text-white hover:bg-primary-700 active:scale-95'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100 active:scale-95'
              )}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium text-center">{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

