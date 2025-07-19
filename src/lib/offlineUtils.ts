// Utility for handling data fetching with offline fallback
export async function fetchWithOfflineSupport(url: string, fallbackData?: any) {
  try {
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      // Store in localStorage as backup
      if (typeof window !== 'undefined') {
        localStorage.setItem(`offline_${url}`, JSON.stringify(data));
      }
      return data;
    }
    throw new Error(`HTTP ${response.status}`);
  } catch (error) {
    console.warn(`Failed to fetch ${url}, trying offline fallback:`, error);
    
    // Try to get from localStorage
    if (typeof window !== 'undefined') {
      const cachedData = localStorage.getItem(`offline_${url}`);
      if (cachedData) {
        console.log(`Using cached data for ${url}`);
        return JSON.parse(cachedData);
      }
    }
    
    // Try to get from service worker cache
    if ('caches' in window) {
      try {
        const cache = await caches.open('study-japan-v2');
        const cachedResponse = await cache.match(url);
        if (cachedResponse) {
          console.log(`Using service worker cache for ${url}`);
          return await cachedResponse.json();
        }
      } catch (cacheError) {
        console.warn('Failed to access cache:', cacheError);
      }
    }
    
    // Return fallback data if provided
    if (fallbackData) {
      console.log(`Using fallback data for ${url}`);
      return fallbackData;
    }
    
    // If all else fails, throw error
    throw error;
  }
}

// Preload critical data for offline use
export async function preloadCriticalData() {
  const criticalEndpoints = [
    '/api/data/grammar/n5',
    '/api/data/vocabulary/n5',
    '/api/data/kanji/n5',
    '/api/data/conversation/n5',
  ];

  const promises = criticalEndpoints.map(async (endpoint) => {
    try {
      await fetchWithOfflineSupport(endpoint);
      console.log(`Preloaded: ${endpoint}`);
    } catch (error) {
      console.warn(`Failed to preload: ${endpoint}`, error);
    }
  });

  await Promise.allSettled(promises);
  console.log('Critical data preload complete');
}

// Check if app is in offline mode
export function isOfflineMode() {
  return !navigator.onLine;
}

// Get offline status with more detailed info
export function getConnectionStatus() {
  if (typeof navigator === 'undefined') return { online: true, type: 'unknown' };
  
  return {
    online: navigator.onLine,
    type: (navigator as any).connection?.effectiveType || 'unknown',
    saveData: (navigator as any).connection?.saveData || false
  };
}
