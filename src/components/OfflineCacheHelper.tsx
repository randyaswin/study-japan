'use client';

import { useEffect } from 'react';
import { preloadCriticalData } from '@/lib/offlineUtils';

export default function OfflineCacheHelper() {
  useEffect(() => {
    // Register background sync when available (with type assertion for background sync)
    const registerBackgroundSync = async () => {
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        try {
          const registration = await navigator.serviceWorker.ready;
          if ('sync' in registration) {
            await (registration as any).sync.register('background-sync');
            console.log('Background sync registered');
          }
        } catch (error) {
          console.warn('Background sync registration failed:', error);
        }
      }
    };

    // Pre-cache essential data with delay to avoid blocking initial render
    const timer = setTimeout(async () => {
      try {
        await preloadCriticalData();
        await registerBackgroundSync();
        console.log('Offline features setup complete');
      } catch (error) {
        console.warn('Failed to setup offline features:', error);
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  return null; // This component doesn't render anything
}
