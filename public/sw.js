const CACHE_NAME = 'study-japan-v1';
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
  // Add data files that should be cached
  '/data/sprint_day1.json',
  '/data/sprint_day2.json',
  '/data/sprint_day3.json',
  '/data/sprint_day4.json',
  '/data/sprint_day5.json',
  '/data/sprint_day6.json',
  '/data/sprint_day7.json',
  '/data/sprint_day8.json',
  '/data/sprint_day9.json',
  '/data/sprint_day10.json',
  '/data/sprint_day11.json',
  '/data/sprint_day12.json',
  '/data/sprint_day13.json',
  '/data/sprint_day14.json',
  '/data/sprint_day15.json',
  '/data/sprint_day16.json',
  '/data/sprint_day17.json',
  '/data/sprint_day18.json',
  '/data/sprint_day19.json',
  '/data/sprint_day20.json',
  '/data/sprint_day21.json',
  '/data/sprint_day22.json',
  '/data/sprint_day23.json',
  '/data/sprint_day24.json',
  '/data/sprint_day25.json',
  '/data/sprint_day26.json',
  '/data/sprint_day27.json',
  '/data/sprint_day28.json',
  '/data/sprint_day29.json',
  '/data/sprint_day30.json',
  // Add other static assets as needed
];

// Install service worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Installed');
        return self.skipWaiting();
      })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
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
            
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(() => {
            // If both cache and network fail, return offline page for navigation requests
            if (event.request.destination === 'document') {
              return caches.match('/offline.html');
            }
            // For other requests, return a fallback response
            return new Response('Offline content not available', {
              status: 503,
              statusText: 'Service Unavailable'
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
