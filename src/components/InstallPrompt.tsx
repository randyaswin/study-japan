'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
  };

  if (!showInstallPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg border-2 border-orange-200 p-4 z-50 md:max-w-sm md:left-auto md:right-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <span className="text-2xl">📱</span>
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-800 mb-1">Install Study Japan</h3>
          <p className="text-sm text-gray-600 mb-3">
            Install aplikasi ini untuk akses yang lebih mudah dan cepat tanpa browser!
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleInstallClick}
              className="bg-orange-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-orange-600 transition-colors"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-300 transition-colors"
            >
              Nanti
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
