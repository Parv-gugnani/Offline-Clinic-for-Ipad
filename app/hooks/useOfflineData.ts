import { useState, useEffect, useCallback } from 'react';
import { 
  saveToCache, 
  getFromCache, 
  isOnline, 
  registerConnectivityListeners,
  queueOperation
} from '../utils/offlineCache';

/**
 * Custom hook for managing data with offline support
 * @param key The cache key for this data
 * @param fetchFn The function to fetch data from the API
 * @param expiryMs Optional cache expiry time in milliseconds (default: 1 hour)
 */
export function useOfflineData<T>(
  key: string, 
  fetchFn: () => Promise<T>,
  expiryMs: number = 60 * 60 * 1000 // 1 hour default
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [online, setOnline] = useState<boolean>(isOnline());

  // Function to load data from cache or API
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Try to get data from cache first
      const cachedData = getFromCache<T>(key);
      
      if (cachedData) {
        setData(cachedData);
        setLoading(false);
      }
      
      // If online, fetch fresh data
      if (isOnline()) {
        try {
          const freshData = await fetchFn();
          setData(freshData);
          saveToCache(key, freshData, expiryMs);
        } catch (fetchError) {
          console.error('Error fetching fresh data:', fetchError);
          // If we already have cached data, don't set an error
          if (!cachedData) {
            setError(fetchError as Error);
          }
        }
      } else if (!cachedData) {
        // If offline and no cached data
        setError(new Error('You are offline and no cached data is available'));
      }
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [key, fetchFn, expiryMs]);

  // Function to update data with offline support
  const updateData = useCallback(async <U>(
    updateFn: (data: U) => Promise<T>,
    updateData: U,
    optimistic: boolean = true
  ) => {
    try {
      if (isOnline()) {
        // If online, perform the update immediately
        const updatedData = await updateFn(updateData);
        setData(updatedData);
        saveToCache(key, updatedData, expiryMs);
        return { success: true, data: updatedData };
      } else {
        // If offline, queue the operation for later
        queueOperation('update', { key, updateFn: updateFn.toString(), updateData });
        
        if (optimistic && data) {
          // For optimistic updates, update the UI immediately
          // This is a simplified approach - in a real app, you'd need to
          // merge the update with existing data in a more sophisticated way
          const optimisticData = { ...data, ...updateData } as T;
          setData(optimisticData);
          saveToCache(key, optimisticData, expiryMs);
          return { success: true, data: optimisticData, offline: true };
        }
        
        return { success: false, offline: true, message: 'Operation queued for when online' };
      }
    } catch (error) {
      console.error('Error updating data:', error);
      return { success: false, error };
    }
  }, [data, key, expiryMs]);

  // Set up online/offline listeners
  useEffect(() => {
    const cleanup = registerConnectivityListeners(
      // When coming back online
      () => {
        setOnline(true);
        loadData(); // Refresh data when coming back online
      },
      // When going offline
      () => {
        setOnline(false);
      }
    );
    
    return cleanup;
  }, [loadData]);

  // Initial data load
  useEffect(() => {
    loadData();
  }, [loadData]);

  return { 
    data, 
    loading, 
    error, 
    online,
    refresh: loadData,
    updateData
  };
}

export default useOfflineData;
