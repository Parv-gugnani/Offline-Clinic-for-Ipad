// This service worker can be customized further
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('beauty-clinic-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.json',
        '/icons/icon-192x192.png',
        '/icons/icon-512x512.png',
        // Add other static assets here
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response
      if (response) {
        return response;
      }

      // Clone the request
      const fetchRequest = event.request.clone();

      return fetch(fetchRequest).then((response) => {
        // Check if we received a valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();

        caches.open('beauty-clinic-v1').then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(() => {
        // If fetch fails, return offline page
        if (event.request.mode === 'navigate') {
          return caches.match('/offline.html');
        }
      });
    })
  );
});

// Background sync for offline data
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-appointments') {
    event.waitUntil(syncAppointments());
  }
});

// Function to sync appointments when back online
async function syncAppointments() {
  try {
    const db = await openIndexedDB();
    const pendingAppointments = await db.getAll('pendingAppointments');
    
    for (const appointment of pendingAppointments) {
      try {
        const response = await fetch('/api/appointments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(appointment),
        });
        
        if (response.ok) {
          await db.delete('pendingAppointments', appointment.id);
        }
      } catch (error) {
        console.error('Failed to sync appointment:', error);
      }
    }
  } catch (error) {
    console.error('Error syncing appointments:', error);
  }
}

// Helper function to open IndexedDB
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('beautyClinicDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      resolve({
        getAll: (storeName) => {
          return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
          });
        },
        delete: (storeName, id) => {
          return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
          });
        }
      });
    };
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('pendingAppointments')) {
        db.createObjectStore('pendingAppointments', { keyPath: 'id' });
      }
    };
  });
}
