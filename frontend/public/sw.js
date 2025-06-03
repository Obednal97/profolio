const CACHE_NAME = 'profolio-v2';
const STATIC_CACHE_NAME = `${CACHE_NAME}-static`;
const DYNAMIC_CACHE_NAME = `${CACHE_NAME}-dynamic`;

// Static resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/app/dashboard',
  '/app/assetManager',
  '/app/expenseManager',
  '/app/propertyManager',
  '/app/settings',
  '/manifest.json',
  // All PNG icons for offline availability
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png'
];

// Resources that should not be cached
const CACHE_BLACKLIST = [
  '/api/auth/',
  '/api/setup/',
  'chrome-extension://',
  'extension://',
];

// Maximum cache size limits
const MAX_DYNAMIC_CACHE_SIZE = 50;
const CACHE_EXPIRY_TIME = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Utility function to check if URL should be cached
 * @param {string} url - URL to check
 * @returns {boolean} - Whether URL should be cached
 */
function shouldCache(url) {
  return !CACHE_BLACKLIST.some(pattern => url.includes(pattern));
}

/**
 * Utility function to clean up old cache entries
 * @param {string} cacheName - Name of cache to clean
 * @param {number} maxSize - Maximum number of entries
 */
async function limitCacheSize(cacheName, maxSize) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    
    if (keys.length > maxSize) {
      const keysToDelete = keys.slice(0, keys.length - maxSize);
      await Promise.all(
        keysToDelete.map(key => {
          console.log('🗑️ Removing old cache entry:', key.url);
          return cache.delete(key);
        })
      );
    }
  } catch (error) {
    console.error('❌ Cache cleanup failed:', error);
  }
}

/**
 * Check if cached response is still fresh
 * @param {Response} response - Cached response
 * @returns {boolean} - Whether response is fresh
 */
function isCacheFresh(response) {
  if (!response.headers.has('sw-cache-timestamp')) {
    return false;
  }
  
  const cacheTimestamp = parseInt(response.headers.get('sw-cache-timestamp'));
  const now = Date.now();
  
  return (now - cacheTimestamp) < CACHE_EXPIRY_TIME;
}

/**
 * Add timestamp to response for cache freshness tracking
 * @param {Response} response - Response to timestamp
 * @returns {Response} - Response with timestamp header
 */
function addTimestamp(response) {
  const responseWithTimestamp = response.clone();
  responseWithTimestamp.headers.set('sw-cache-timestamp', Date.now().toString());
  return responseWithTimestamp;
}

// Install event - cache static resources
self.addEventListener('install', (event) => {
  console.log('📦 Service Worker installing...', CACHE_NAME);
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE_NAME)
        .then(cache => {
          console.log('📦 Caching static assets...');
          return cache.addAll(STATIC_ASSETS);
        }),
      // Clean up old versions
      caches.keys()
        .then(cacheNames => {
          const oldCaches = cacheNames.filter(name => 
            name.startsWith('profolio-') && 
            !name.includes('v2')
          );
          
          return Promise.all(
            oldCaches.map(cacheName => {
              console.log('🗑️ Deleting old cache version:', cacheName);
              return caches.delete(cacheName);
            })
          );
        })
    ])
    .then(() => {
      console.log('✅ Static assets cached successfully');
      // Force activation of new service worker
      return self.skipWaiting();
    })
    .catch(error => {
      console.error('❌ Failed to cache static assets:', error);
    })
  );
});

// Fetch event - handle requests with caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const { method, url } = request;
  
  // Only handle GET requests
  if (method !== 'GET') {
    return;
  }
  
  // Skip non-HTTP requests
  if (!url.startsWith('http')) {
    return;
  }
  
  // Skip if blacklisted
  if (!shouldCache(url)) {
    return;
  }
  
  event.respondWith(
    handleFetchRequest(request)
      .catch(error => {
        console.error('❌ Fetch failed:', url, error);
        return handleFallback(request);
      })
  );
});

/**
 * Main fetch handling logic with caching strategy
 * @param {Request} request - The fetch request
 * @returns {Promise<Response>} - Response from cache or network
 */
async function handleFetchRequest(request) {
  const { url } = request;
  
  // Check static cache first for known static assets
  if (STATIC_ASSETS.some(asset => url.includes(asset))) {
    const staticResponse = await caches.match(request, { cacheName: STATIC_CACHE_NAME });
    if (staticResponse) {
      console.log('📂 Serving static asset from cache:', url);
      return staticResponse;
    }
  }
  
  // Check dynamic cache
  const dynamicCache = await caches.open(DYNAMIC_CACHE_NAME);
  const cachedResponse = await dynamicCache.match(request);
  
  if (cachedResponse && isCacheFresh(cachedResponse)) {
    console.log('📂 Serving fresh cached response:', url);
    return cachedResponse;
  }
  
  // Fetch from network
  try {
    const networkResponse = await fetch(request);
    
    // Only cache successful responses
    if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
      // Clone response for caching (can only be consumed once)
      const responseToCache = addTimestamp(networkResponse.clone());
      
      // Cache the response asynchronously
      dynamicCache.put(request, responseToCache)
        .then(() => limitCacheSize(DYNAMIC_CACHE_NAME, MAX_DYNAMIC_CACHE_SIZE))
        .catch(error => console.warn('⚠️ Failed to cache response:', error));
      
      console.log('🌐 Serving fresh network response:', url);
    }
    
    return networkResponse;
    
  } catch (networkError) {
    // Network failed, try to serve stale cache
    if (cachedResponse) {
      console.log('📂 Serving stale cached response (network failed):', url);
      return cachedResponse;
    }
    
    throw networkError;
  }
}

/**
 * Handle fallback responses when both cache and network fail
 * @param {Request} request - The failed request
 * @returns {Response} - Fallback response
 */
async function handleFallback(request) {
  // For navigation requests, try to serve the main app shell
  if (request.mode === 'navigate') {
    const appShell = await caches.match('/', { cacheName: STATIC_CACHE_NAME });
    if (appShell) {
      console.log('📂 Serving app shell as fallback');
      return appShell;
    }
    
    // Last resort offline page
    return new Response(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>Profolio - Offline</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: system-ui, sans-serif; text-align: center; padding: 2rem; }
            .offline { color: #666; }
          </style>
        </head>
        <body>
          <h1>Profolio</h1>
          <p class="offline">App is currently offline. Please check your connection and try again.</p>
          <button onclick="window.location.reload()">Retry</button>
        </body>
      </html>`,
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      }
    );
  }
  
  // For other requests, return a generic offline response
  return new Response('Offline', {
    status: 503,
    statusText: 'Service Unavailable'
  });
}

// Activate event - take control and clean up
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...', CACHE_NAME);
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys()
        .then(cacheNames => {
          const oldCaches = cacheNames.filter(name => 
            name.startsWith('profolio-') && 
            name !== STATIC_CACHE_NAME && 
            name !== DYNAMIC_CACHE_NAME
          );
          
          return Promise.all(
            oldCaches.map(cacheName => {
              console.log('🗑️ Deleting obsolete cache:', cacheName);
              return caches.delete(cacheName);
            })
          );
        }),
      // Take control of all clients immediately
      self.clients.claim()
    ])
    .then(() => {
      console.log('✅ Service Worker activated and ready');
    })
    .catch(error => {
      console.error('❌ Service Worker activation failed:', error);
    })
  );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  const { data } = event;
  
  if (data && data.type === 'SKIP_WAITING') {
    console.log('📨 Received skip waiting message');
    self.skipWaiting();
  }
  
  if (data && data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// Handle unhandled promise rejections
self.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Unhandled promise rejection in SW:', event.reason);
  event.preventDefault();
});

// Handle errors
self.addEventListener('error', (event) => {
  console.error('❌ Service Worker error:', event.error);
}); 