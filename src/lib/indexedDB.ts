// IndexedDB utility for offline data storage

const DB_NAME = 'beautyClinicDB';
const DB_VERSION = 1;

// Store names
export const STORES = {
  APPOINTMENTS: 'appointments',
  SERVICES: 'services',
  STAFF: 'staff',
  CLIENTS: 'clients',
  AVAILABILITY: 'availability',
  SYNC_QUEUE: 'syncQueue'
};

interface DBSchema {
  [key: string]: { keyPath: string; indexes?: { name: string; keyPath: string; options?: IDBIndexParameters }[] };
}

// Define interfaces for our data types
interface SyncQueueItem {
  id: string;
  operation: 'create' | 'update' | 'delete';
  storeName: string;
  data: Record<string, unknown>;
  createdAt: string;
}

// Interface for SyncManager
interface SyncManager {
  register(tag: string): Promise<void>;
}

// Extended ServiceWorkerRegistration with SyncManager
interface ExtendedServiceWorkerRegistration extends ServiceWorkerRegistration {
  sync: SyncManager;
}

// Database schema definition
const schema: DBSchema = {
  [STORES.APPOINTMENTS]: {
    keyPath: 'id',
    indexes: [
      { name: 'clientId', keyPath: 'clientId' },
      { name: 'staffId', keyPath: 'staffId' },
      { name: 'date', keyPath: 'date' },
      { name: 'syncStatus', keyPath: 'syncStatus' }
    ]
  },
  [STORES.SERVICES]: {
    keyPath: 'id',
    indexes: [
      { name: 'category', keyPath: 'category' }
    ]
  },
  [STORES.STAFF]: {
    keyPath: 'id'
  },
  [STORES.CLIENTS]: {
    keyPath: 'id',
    indexes: [
      { name: 'email', keyPath: 'email', options: { unique: true } }
    ]
  },
  [STORES.AVAILABILITY]: {
    keyPath: 'id',
    indexes: [
      { name: 'staffId', keyPath: 'staffId' },
      { name: 'dayOfWeek', keyPath: 'dayOfWeek' }
    ]
  },
  [STORES.SYNC_QUEUE]: {
    keyPath: 'id',
    indexes: [
      { name: 'operation', keyPath: 'operation' },
      { name: 'storeName', keyPath: 'storeName' },
      { name: 'createdAt', keyPath: 'createdAt' }
    ]
  }
};

// Open database connection
export const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Error opening IndexedDB', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = () => {
      const db = request.result;
      
      // Create object stores based on schema
      Object.entries(schema).forEach(([storeName, storeSchema]) => {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: storeSchema.keyPath });
          
          // Create indexes
          storeSchema.indexes?.forEach(index => {
            store.createIndex(index.name, index.keyPath, index.options);
          });
        }
      });
    };
  });
};

// Generic CRUD operations
export const dbOperations = {
  // Add or update an item
  put: async <T>(storeName: string, item: T): Promise<T> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);

      request.onerror = () => {
        console.error(`Error putting item in ${storeName}`, request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve(item);
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  },

  // Get an item by id
  get: async <T>(storeName: string, id: string): Promise<T | null> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onerror = () => {
        console.error(`Error getting item from ${storeName}`, request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  },

  // Get all items
  getAll: async <T>(storeName: string): Promise<T[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onerror = () => {
        console.error(`Error getting all items from ${storeName}`, request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  },

  // Query items by index
  getByIndex: async <T>(storeName: string, indexName: string, value: IDBValidKey): Promise<T[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onerror = () => {
        console.error(`Error querying ${storeName} by ${indexName}`, request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  },

  // Delete an item
  delete: async (storeName: string, id: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onerror = () => {
        console.error(`Error deleting item from ${storeName}`, request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve();
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  },

  // Clear all items from a store
  clear: async (storeName: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onerror = () => {
        console.error(`Error clearing ${storeName}`, request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve();
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  }
};

// Add to sync queue for offline operations
export const addToSyncQueue = async (operation: 'create' | 'update' | 'delete', storeName: string, data: Record<string, unknown>): Promise<void> => {
  await dbOperations.put<SyncQueueItem>(STORES.SYNC_QUEUE, {
    id: crypto.randomUUID(),
    operation,
    storeName,
    data,
    createdAt: new Date().toISOString()
  });

  // Try to sync if online
  if (navigator.onLine) {
    try {
      await syncData();
    } catch (error) {
      console.error('Failed to sync data:', error);
    }
  }
};

// Sync data with server when online
export const syncData = async (): Promise<void> => {
  if (!navigator.onLine) return;

  const syncQueue = await dbOperations.getAll<SyncQueueItem>(STORES.SYNC_QUEUE);
  
  for (const item of syncQueue) {
    try {
      let endpoint = `/api/${item.storeName}`;
      let method = 'POST';
      
      if (item.operation === 'update') {
        endpoint = `/api/${item.storeName}/${item.data.id}`;
        method = 'PUT';
      } else if (item.operation === 'delete') {
        endpoint = `/api/${item.storeName}/${item.data.id}`;
        method = 'DELETE';
      }
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: item.operation !== 'delete' ? JSON.stringify(item.data) : undefined,
      });
      
      if (response.ok) {
        // If successful, remove from sync queue
        await dbOperations.delete(STORES.SYNC_QUEUE, item.id);
        
        // If it was a create or update operation, update the local item with synced status
        if (item.operation === 'create' || item.operation === 'update') {
          const responseData = await response.json();
          await dbOperations.put(item.storeName, {
            ...responseData,
            syncStatus: 'SYNCED'
          });
        }
      }
    } catch (error) {
      console.error(`Failed to sync item ${item.id}:`, error);
    }
  }
};

// Initialize sync event listeners
export const initSyncListeners = (): void => {
  // Sync when coming back online
  window.addEventListener('online', async () => {
    try {
      await syncData();
    } catch (error) {
      console.error('Failed to sync data:', error);
    }
  });

  // Register background sync if supported
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready.then(registration => {
      // Using proper type for the registration with sync manager
      const extendedRegistration = registration as ExtendedServiceWorkerRegistration;
      if (extendedRegistration.sync) {
        extendedRegistration.sync.register('sync-data');
      }
    }).catch(error => {
      console.error('Error registering background sync:', error);
    });
  }
};

// Initialize the database
export const initDatabase = async (): Promise<void> => {
  try {
    await openDB();
    initSyncListeners();
    console.log('IndexedDB initialized successfully');
  } catch (error) {
    console.error('Failed to initialize IndexedDB:', error);
  }
};
