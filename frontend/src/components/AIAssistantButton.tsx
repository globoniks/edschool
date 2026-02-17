import { MessageCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface AIAssistantButtonProps {
  onClick: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  showBadge?: boolean;
  className?: string;
}

/**
 * Standalone floating action button for AI Assistant
 * Can be used independently if you want to control the chat panel separately
 */
export default function AIAssistantButton({
  onClick,
  position = 'bottom-right',
  showBadge = true,
  className,
}: AIAssistantButtonProps) {
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  };

  return (
    <button
      onClick={onClick}
      className={clsx(
        'fixed z-50',
        positionClasses[position],
        'w-14 h-14 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-full shadow-lg',
        'flex items-center justify-center',
        'hover:shadow-xl hover:scale-110',
        'active:scale-95',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        className
      )}
      aria-label="Open AI Assistant"
    >
      <MessageCircle className="w-6 h-6" />
      {showBadge && (
        <>
          {/* Animated ping effect */}
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-ping opacity-75" />
          {/* Static badge */}
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-white" />
        </>
      )}
    </button>
  );
}

