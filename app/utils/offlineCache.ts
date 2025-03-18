/**
 * Utility for managing offline data caching
 * This helps the application work properly when offline
 */

// Type definitions for cached items
type CachedItem<T> = {
  data: T;
  timestamp: number;
  expiry?: number; // Optional expiry time in milliseconds
};

/**
 * Save data to local storage with optional expiry
 * @param key The storage key
 * @param data The data to store
 * @param expiryMs Optional expiry time in milliseconds
 */
export const saveToCache = <T>(key: string, data: T, expiryMs?: number): void => {
  try {
    const item: CachedItem<T> = {
      data,
      timestamp: Date.now(),
      expiry: expiryMs ? Date.now() + expiryMs : undefined,
    };

    localStorage.setItem(`cache_${key}`, JSON.stringify(item));
  } catch (error) {
    console.error('Error saving to cache:', error);
  }
};

/**
 * Get data from local storage if it exists and is not expired
 * @param key The storage key
 * @returns The cached data or null if not found or expired
 */
export const getFromCache = <T>(key: string): T | null => {
  try {
    const cachedData = localStorage.getItem(`cache_${key}`);

    if (!cachedData) {
      return null;
    }

    const item: CachedItem<T> = JSON.parse(cachedData);

    // Check if the item has expired
    if (item.expiry && item.expiry < Date.now()) {
      // Remove expired item
      localStorage.removeItem(`cache_${key}`);
      return null;
    }

    return item.data;
  } catch (error) {
    console.error('Error retrieving from cache:', error);
    return null;
  }
};

/**
 * Remove an item from the cache
 * @param key The storage key
 */
export const removeFromCache = (key: string): void => {
  try {
    localStorage.removeItem(`cache_${key}`);
  } catch (error) {
    console.error('Error removing from cache:', error);
  }
};

/**
 * Clear all cached items
 */
export const clearCache = (): void => {
  try {
    const keys = Object.keys(localStorage);

    // Only remove items with our cache prefix
    keys.forEach(key => {
      if (key.startsWith('cache_')) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

/**
 * Get all cached keys
 * @returns Array of cached keys (without the prefix)
 */
export const getCachedKeys = (): string[] => {
  try {
    const keys = Object.keys(localStorage);
    return keys
      .filter(key => key.startsWith('cache_'))
      .map(key => key.replace('cache_', ''));
  } catch (error) {
    console.error('Error getting cached keys:', error);
    return [];
  }
};

/**
 * Check if the browser is currently online
 * @returns Boolean indicating online status
 */
export const isOnline = (): boolean => {
  return typeof navigator !== 'undefined' && navigator.onLine;
};

/**
 * Register callbacks for online/offline events
 * @param onOnline Callback for when the app goes online
 * @param onOffline Callback for when the app goes offline
 */
export const registerConnectivityListeners = (
  onOnline: () => void,
  onOffline: () => void
): () => void => {
  if (typeof window === 'undefined') {
    return () => {}; // Return empty cleanup function for SSR
  }

  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
};

/**
 * Queue operations to be performed when back online
 * @param operation The operation to queue
 */
type QueuedOperation = {
  id: string;
  operation: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  timestamp: number;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const queueOperation = (operation: string, data: any): void => {
  try {
    const queuedOps = getQueuedOperations();
    const newOp: QueuedOperation = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      operation,
      data,
      timestamp: Date.now(),
    };

    queuedOps.push(newOp);
    localStorage.setItem('offline_operations_queue', JSON.stringify(queuedOps));

    // Register for sync if service worker is available
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready
        .then(sw => {
          // Use type assertion to access sync property
          const registration = sw as ServiceWorkerRegistration & { sync?: { register: (tag: string) => Promise<void> } };
          if (registration.sync) {
            registration.sync.register('sync-operations')
              .catch(err => console.error('Failed to register background sync:', err));
          }
        })
        .catch(err => console.error('Failed to access service worker:', err));
    }
  } catch (error) {
    console.error('Error queuing operation:', error);
  }
};

export const getQueuedOperations = (): QueuedOperation[] => {
  try {
    const queue = localStorage.getItem('offline_operations_queue');
    return queue ? JSON.parse(queue) : [];
  } catch (error) {
    console.error('Error getting queued operations:', error);
    return [];
  }
};

export const removeQueuedOperation = (id: string): void => {
  try {
    const queuedOps = getQueuedOperations();
    const updatedQueue = queuedOps.filter(op => op.id !== id);
    localStorage.setItem('offline_operations_queue', JSON.stringify(updatedQueue));
  } catch (error) {
    console.error('Error removing queued operation:', error);
  }
};

export const clearOperationQueue = (): void => {
  try {
    localStorage.removeItem('offline_operations_queue');
  } catch (error) {
    console.error('Error clearing operation queue:', error);
  }
};
