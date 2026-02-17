import { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running as PWA
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    // Check if iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    // Don't show if already installed
    if (standalone) {
      return;
    }

    // Don't show if dismissed before (but allow showing again after 24 hours)
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const dismissedTime = localStorage.getItem('pwa-install-dismissed-time');
    if (dismissed && dismissedTime) {
      const hoursSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60);
      if (hoursSinceDismissed < 24) {
        return; // Don't show if dismissed less than 24 hours ago
      }
    }

    // For non-iOS devices, listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt after a delay
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000); // Show after 3 seconds
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Show prompt even if beforeinstallprompt doesn't fire (for manual install instructions)
    // This helps when running in dev mode or if browser doesn't support the event
    const showPromptTimeout = setTimeout(() => {
      setShowPrompt(true);
    }, 5000); // Show after 5 seconds

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(showPromptTimeout);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('PWA installed');
    } else {
      console.log('PWA installation dismissed');
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
    localStorage.setItem('pwa-install-dismissed-time', Date.now().toString());
  };

  const handleRemindLater = () => {
    setShowPrompt(false);
    // Will show again next session since we don't set localStorage
  };

  // Don't show if already installed or if user dismissed / chose "Later"
  if (isStandalone || !showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white border-2 border-primary-500 rounded-xl shadow-2xl p-4 z-[1060] animate-slide-up">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Smartphone className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 text-base">Install EdSchool</h3>
            <p className="text-xs text-gray-600">
              Access faster with offline support
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
          className="ml-2 text-gray-400 hover:text-gray-600 transition-colors p-1"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {isIOS ? (
        // iOS Manual Instructions
        <div className="space-y-3 text-sm text-gray-700 mb-4 bg-blue-50 p-3 rounded-lg">
          <p className="font-medium text-primary-700">To install on iOS:</p>
          <ol className="list-decimal list-inside space-y-1 text-xs">
            <li>Tap the Share button <span className="inline-block px-1.5 py-0.5 bg-white rounded text-primary-600">⎙</span></li>
            <li>Scroll down and tap "Add to Home Screen"</li>
            <li>Tap "Add" in the top-right corner</li>
          </ol>
        </div>
      ) : (
        // Benefits list for Android/Desktop
        <div className="mb-4 space-y-2">
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <div className="w-5 h-5 bg-success-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-success-600 text-xs">✓</span>
            </div>
            <span className="text-xs">Works offline</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <div className="w-5 h-5 bg-success-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-success-600 text-xs">✓</span>
            </div>
            <span className="text-xs">Faster loading</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <div className="w-5 h-5 bg-success-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-success-600 text-xs">✓</span>
            </div>
            <span className="text-xs">Home screen shortcut</span>
          </div>
        </div>
      )}

      {!isIOS && (
        <div className="flex gap-2">
          {deferredPrompt ? (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleInstall(); }}
                className="flex-1 bg-primary-600 text-white px-4 py-2.5 rounded-lg hover:bg-primary-700 transition-colors text-sm font-semibold flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Install Now
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleRemindLater(); }}
                className="px-4 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors text-sm"
              >
                Later
              </button>
            </>
          ) : (
            <>
              <div className="flex-1 text-xs text-gray-600 bg-blue-50 p-3 rounded-lg">
                <p className="font-medium text-primary-700 mb-1">Install EdSchool</p>
                <p className="text-xs">Look for the install icon (⊕) in your browser's address bar, or use the browser menu → "Install app"</p>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
                className="px-4 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors text-sm"
              >
                Dismiss
              </button>
            </>
          )}
        </div>
      )}

      {isIOS && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
          className="w-full px-4 py-2.5 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors text-sm font-medium"
        >
          Got it
        </button>
      )}
    </div>
  );
}

// Add animation styles to your global CSS
const styles = `
@keyframes slide-up {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}
`;

// Export styles to be added to index.css
export const PWAStyles = styles;

