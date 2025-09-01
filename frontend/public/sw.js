const CACHE_NAME = 'profolio-v5';
const STATIC_CACHE_NAME = `${CACHE_NAME}-static`;
const DYNAMIC_CACHE_NAME = `${CACHE_NAME}-dynamic`;

// Static resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/about',
  '/pricing',
  '/how-it-works',
  '/offline',  // 🚀 OFFLINE UX: Cache custom offline page
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

// Resources that should not be cached (including authenticated app routes)
const CACHE_BLACKLIST = [
  '/api/',
  '/app/',
  '/auth/',
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
 * Create a new response with timestamp metadata (without modifying headers)
 * @param {Response} response - Response to add timestamp to
 * @returns {Response} - New response with timestamp in custom header
 */
function addTimestamp(response) {
  // Create new response with same body but new headers
  const headers = new Headers(response.headers);
  headers.set('sw-cache-timestamp', Date.now().toString());
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers
  });
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
            !name.includes('v5')
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
  
  // Skip if blacklisted (including all /app/ routes for auth safety)
  if (!shouldCache(url)) {
    // Only log API/auth skips, not every request
    if (url.includes('/api/') || url.includes('/app/') || url.includes('/auth/')) {
      console.log('🚫 Skipping cache for protected route:', url.split('?')[0]);
    }
    return;
  }
  
  // Only intercept specific routes we want to cache
  // Let Next.js static assets, chunks, and other resources pass through normally
  const shouldIntercept = 
    STATIC_ASSETS.some(asset => url.includes(asset)) || // Static assets we explicitly cache
    url.includes('/icons/') ||                          // PWA icons
    url.includes('manifest.json') ||                    // PWA manifest
    (request.mode === 'navigate' && !url.includes('/app/') && !url.includes('/auth/')); // Public page navigation
  
  if (!shouldIntercept) {
    return; // Let the request go through normally
  }
  
  event.respondWith(
    handleFetchRequest(request)
      .catch(error => {
        console.error('❌ Fetch failed:', url.split('?')[0], error);
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
      return staticResponse;
    }
  }
  
  // Check dynamic cache
  const dynamicCache = await caches.open(DYNAMIC_CACHE_NAME);
  const cachedResponse = await dynamicCache.match(request);
  
  if (cachedResponse && isCacheFresh(cachedResponse)) {
    return cachedResponse;
  }
  
  // Fetch from network
  try {
    const networkResponse = await fetch(request);
    
    // Only cache successful responses for static content
    if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
      // Only cache if it's truly static content (not app routes)
      if (shouldCache(url)) {
        try {
          // Clone response for caching (can only be consumed once)
          const responseToCache = addTimestamp(networkResponse.clone());
          
          // Cache the response asynchronously
          dynamicCache.put(request, responseToCache)
            .then(() => limitCacheSize(DYNAMIC_CACHE_NAME, MAX_DYNAMIC_CACHE_SIZE))
            .catch(error => console.warn('⚠️ Failed to cache response:', error));
          
        } catch (cacheError) {
          console.warn('⚠️ Failed to add timestamp to response, serving without caching:', cacheError);
        }
      }
    }
    
    return networkResponse;
    
  } catch (networkError) {
    // Network failed, try to serve stale cache only for non-auth content
    if (cachedResponse && !url.includes('/app/') && !url.includes('/auth/')) {
      console.log('📂 Serving stale cached response (network failed):', url.split('?')[0]);
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
  const url = request.url;
  
  // For app routes, don't serve fallback - let them fail properly
  if (url.includes('/app/') || url.includes('/auth/')) {
    return new Response('Network Error', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
  
  // 🚀 OFFLINE UX: For navigation requests, serve our custom offline page
  if (request.mode === 'navigate') {
    // Try to serve our custom offline page first
    const offlinePage = await caches.match('/offline', { cacheName: STATIC_CACHE_NAME });
    if (offlinePage) {
      console.log('📱 Serving custom offline page');
      return offlinePage;
    }
    
    // Fallback to app shell if offline page not available
    const appShell = await caches.match('/', { cacheName: STATIC_CACHE_NAME });
    if (appShell) {
      console.log('📂 Serving app shell as fallback');
      return appShell;
    }
    
    // Last resort: Basic offline HTML (should rarely happen)
    return new Response(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>Profolio - Offline</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: system-ui, sans-serif; 
              text-align: center; 
              padding: 2rem; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              min-height: 100vh;
              margin: 0;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
            }
            .container { 
              background: rgba(255,255,255,0.1); 
              padding: 2rem; 
              border-radius: 1rem; 
              backdrop-filter: blur(10px);
            }
            button {
              background: #667eea;
              color: white;
              border: none;
              padding: 1rem 2rem;
              border-radius: 0.5rem;
              cursor: pointer;
              font-size: 1rem;
              margin-top: 1rem;
            }
            button:hover { background: #5a6fd8; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>📱 Profolio</h1>
            <p>You're currently offline, but your portfolio data is safely cached.</p>
            <p>Check your connection and try again.</p>
            <button onclick="window.location.reload()">
              🔄 Retry Connection
            </button>
          </div>
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
  
  if (data && data.type === 'CLEAR_AUTH_CACHE') {
    console.log('📨 Clearing auth-related cache entries');
    
    // Use event.waitUntil to ensure the cache clearing completes
    event.waitUntil(
      (async () => {
        try {
          const cacheNames = await caches.keys();
          
          // Clear entries from all caches
          await Promise.all(
            cacheNames.map(async (cacheName) => {
              const cache = await caches.open(cacheName);
              const keys = await cache.keys();
              
              // More aggressive clearing - include API responses and Next.js assets
              const keysToDelete = keys.filter(key => 
                key.url.includes('/app/') || 
                key.url.includes('/auth/') ||
                key.url.includes('/api/') ||
                key.url.includes('/_next/') ||
                key.url.includes('.json') ||
                // Don't delete static assets like icons and manifest
                (!key.url.includes('/icons/') && !key.url.includes('/manifest.json'))
              );
              
              if (keysToDelete.length > 0) {
                console.log(`🧹 Clearing ${keysToDelete.length} entries from ${cacheName}`);
                await Promise.all(keysToDelete.map(key => cache.delete(key)));
              }
            })
          );
          
          console.log('✅ Auth cache cleared successfully');
          
          // Send confirmation back if port is available
          if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({ success: true });
          }
        } catch (error) {
          console.error('❌ Failed to clear auth cache:', error);
          if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({ success: false, error: error.message });
          }
        }
      })()
    );
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