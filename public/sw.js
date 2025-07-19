const CACHE_NAME = 'study-japan-v2';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
  '/favicon.ico',
  '/offline.html',
  
  // All main pages
  '/hiragana/',
  '/katakana/',
  '/number/',
  '/time/',
  '/n5/',
  '/kaiwa/',
  '/quiz/',
  
  // API routes for data
  '/api/data/grammar/n5',
  '/api/data/vocabulary/n5',
  '/api/data/kanji/n5',
  '/api/data/conversation/n5',
  '/api/data/conversation/n4',
  '/api/data/conversation/n3',
  '/api/data/quiz/quizzes_N5',
  '/api/data/quiz/quizzes_N4',
  '/api/data/quiz/quizzes_N3',
  '/api/data/quiz/quizzes_N2',
  '/api/data/quiz/quizzes_N1',
  
  // Static assets that might be needed
  '/_next/static/chunks/framework-*.js',
  '/_next/static/chunks/main-*.js',
  '/_next/static/chunks/pages/_app-*.js',
];

// Install service worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files');
        // Cache essential files first
        const essentialFiles = urlsToCache.filter(url => 
          !url.includes('_next/static') && !url.includes('/api/')
        );
        return cache.addAll(essentialFiles);
      })
      .then(() => {
        console.log('Service Worker: Installed');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Install failed', error);
      })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) return;
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          console.log('Service Worker: Serving from cache:', event.request.url);
          return response;
        }
        
        // Clone the request because it's a stream
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest)
          .then((response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response because it's a stream
            const responseToCache = response.clone();
            
            // Cache the response for future use
            caches.open(CACHE_NAME)
              .then((cache) => {
                // Only cache GET requests and avoid caching large files
                if (event.request.method === 'GET' && 
                    !event.request.url.includes('chrome-extension://') &&
                    response.headers.get('content-length') < 5000000) { // 5MB limit
                  console.log('Service Worker: Caching new resource:', event.request.url);
                  cache.put(event.request, responseToCache);
                }
              });
            
            return response;
          })
          .catch((error) => {
            console.log('Service Worker: Fetch failed:', event.request.url, error);
            
            // If network fails, try to serve from cache or fallback
            return caches.match(event.request)
              .then((cachedResponse) => {
                if (cachedResponse) {
                  return cachedResponse;
                }
                
                // For navigation requests, return offline page
                if (event.request.destination === 'document' || 
                    event.request.headers.get('accept').includes('text/html')) {
                  return caches.match('/offline.html');
                }
                
                // For API requests, return cached data if available
                if (event.request.url.includes('/api/')) {
                  // Try to find similar cached API response
                  return caches.match(event.request.url.replace(/\?.*$/, ''))
                    .then((apiResponse) => {
                      if (apiResponse) {
                        return apiResponse;
                      }
                      // Return a basic JSON error response
                      return new Response(JSON.stringify({
                        error: 'Offline mode: Data not available',
                        cached: false
                      }), {
                        status: 503,
                        statusText: 'Service Unavailable',
                        headers: { 'Content-Type': 'application/json' }
                      });
                    });
                }
                
                // For other requests, return a fallback response
                return new Response('Offline content not available', {
                  status: 503,
                  statusText: 'Service Unavailable'
                });
              });
          });
      })
  );
});

// Activate service worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activated');
      return self.clients.claim();
    })
  );
});

// Background sync for when connection is restored
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Service Worker: Background sync triggered');
    event.waitUntil(syncData());
  }
});

// Function to sync data when back online
async function syncData() {
  try {
    const cache = await caches.open(CACHE_NAME);
    
    // Update cache with fresh data when back online
    const criticalEndpoints = [
      '/api/data/grammar/n5',
      '/api/data/vocabulary/n5',
      '/api/data/kanji/n5',
      '/api/data/conversation/n5',
      '/api/data/conversation/n4',
      '/api/data/conversation/n3',
    ];

    for (const endpoint of criticalEndpoints) {
      try {
        const response = await fetch(endpoint);
        if (response.ok) {
          await cache.put(endpoint, response.clone());
          console.log(`Background sync: Updated cache for ${endpoint}`);
        }
      } catch (error) {
        console.warn(`Background sync: Failed to update ${endpoint}`, error);
      }
    }
    
    console.log('Service Worker: Background sync completed');
  } catch (error) {
    console.error('Service Worker: Background sync failed', error);
  }
}

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});
