'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Service {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  category: string;
  image: string | null;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check online status
    setIsOnline(navigator.onLine);
    window.addEventListener('online', () => setIsOnline(true));
    window.addEventListener('offline', () => setIsOnline(false));

    const fetchServices = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/services');
        
        if (!response.ok) {
          throw new Error('Failed to fetch services');
        }
        
        const data = await response.json();
        setServices(data);
        
        // Store in IndexedDB for offline access
        if (window.indexedDB) {
          const db = await window.indexedDB.open('beautyClinicDB', 1);
          db.onsuccess = (event) => {
            const database = (event.target as IDBOpenDBRequest).result;
            const transaction = database.transaction(['services'], 'readwrite');
            const store = transaction.objectStore('services');
            
            // Clear existing data and add new data
            store.clear();
            data.forEach((service: Service) => {
              store.add(service);
            });
          };
        }
      } catch (err) {
        console.error('Error fetching services:', err);
        setError('Failed to load services. Please try again later.');
        
        // Try to load from IndexedDB if offline
        if (!navigator.onLine && window.indexedDB) {
          const db = await window.indexedDB.open('beautyClinicDB', 1);
          db.onsuccess = (event) => {
            const database = (event.target as IDBOpenDBRequest).result;
            const transaction = database.transaction(['services'], 'readonly');
            const store = transaction.objectStore('services');
            const request = store.getAll();
            
            request.onsuccess = () => {
              if (request.result.length > 0) {
                setServices(request.result);
                setError(null);
              }
            };
          };
        }
      } finally {
        setLoading(false);
      }
    };

    fetchServices();

    return () => {
      window.removeEventListener('online', () => setIsOnline(true));
      window.removeEventListener('offline', () => setIsOnline(false));
    };
  }, []);

  // Group services by category
  const servicesByCategory: Record<string, Service[]> = {};
  services.forEach(service => {
    if (!servicesByCategory[service.category]) {
      servicesByCategory[service.category] = [];
    }
    servicesByCategory[service.category].push(service);
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-pink-600 mb-8 text-center">Our Services</h1>
      
      {!isOnline && (
        <div className="w-full max-w-4xl mx-auto mb-6 p-4 bg-amber-100 text-amber-800 rounded-lg shadow-md">
          <p className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            You are currently offline. Showing cached services.
          </p>
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
        </div>
      ) : error && services.length === 0 ? (
        <div className="text-center text-red-500 p-4 bg-red-50 rounded-lg">
          {error}
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          {Object.keys(servicesByCategory).length > 0 ? (
            Object.entries(servicesByCategory).map(([category, categoryServices]) => (
              <div key={category} className="mb-10">
                <h2 className="text-2xl font-semibold text-pink-600 mb-4 border-b border-pink-200 pb-2">
                  {category}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {categoryServices.map((service) => (
                    <div 
                      key={service.id} 
                      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      <div className="p-6">
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">{service.name}</h3>
                        <p className="text-gray-600 mb-4">{service.description}</p>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-gray-700">
                              <span className="font-medium">Duration:</span> {service.duration} min
                            </p>
                            <p className="text-gray-700">
                              <span className="font-medium">Price:</span> ${service.price.toFixed(2)}
                            </p>
                          </div>
                          <Link 
                            href={`/appointments/new?serviceId=${service.id}`}
                            className="px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-colors"
                          >
                            Book Now
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 p-8">
              No services available at the moment.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
