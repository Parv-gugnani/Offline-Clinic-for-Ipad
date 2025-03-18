'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface User {
  name: string;
  email: string;
}

interface Client {
  id: string;
  user: User;
}

interface Staff {
  id: string;
  user: User;
}

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}

interface Appointment {
  id: string;
  date: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  notes: string | null;
  client: Client;
  staff: Staff;
  service: Service;
}

export default function MyAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    // Check online status
    setIsOnline(navigator.onLine);
    window.addEventListener('online', () => setIsOnline(true));
    window.addEventListener('offline', () => setIsOnline(false));

    // For demo purposes, we'll use a hardcoded client ID
    // In a real app, this would come from authentication
    setClientId('cl001');

    const fetchAppointments = async () => {
      if (!clientId) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/appointments?clientId=${clientId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch appointments');
        }

        const data = await response.json();
        setAppointments(data);

        // Store in IndexedDB for offline access
        if (window.indexedDB) {
          const db = await window.indexedDB.open('beautyClinicDB', 1);
          db.onsuccess = (event) => {
            const database = (event.target as IDBOpenDBRequest).result;
            const transaction = database.transaction(['appointments'], 'readwrite');
            const store = transaction.objectStore('appointments');

            // Clear existing data and add new data
            store.clear();
            data.forEach((appointment: Appointment) => {
              store.add(appointment);
            });
          };
        }
      } catch (err) {
        console.error('Error fetching appointments:', err);
        setError('Failed to load appointments. Please try again later.');

        // Try to load from IndexedDB if offline
        if (!navigator.onLine && window.indexedDB) {
          const db = await window.indexedDB.open('beautyClinicDB', 1);
          db.onsuccess = (event) => {
            const database = (event.target as IDBOpenDBRequest).result;
            const transaction = database.transaction(['appointments'], 'readonly');
            const store = transaction.objectStore('appointments');
            const request = store.getAll();

            request.onsuccess = () => {
              if (request.result.length > 0) {
                setAppointments(request.result);
                setError(null);
              }
            };
          };
        }
      } finally {
        setLoading(false);
      }
    };

    if (clientId) {
      fetchAppointments();
    }

    return () => {
      window.removeEventListener('online', () => setIsOnline(true));
      window.removeEventListener('offline', () => setIsOnline(false));
    };
  }, [clientId]);

  const handleCancelAppointment = async (id: string) => {
    if (!isOnline) {
      alert('You are offline. Please try again when you have an internet connection.');
      return;
    }

    if (confirm('Are you sure you want to cancel this appointment?')) {
      try {
        const response = await fetch(`/api/appointments/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'CANCELLED' }),
        });

        if (!response.ok) {
          throw new Error('Failed to cancel appointment');
        }

        // Update the local state
        setAppointments(appointments.map(appointment =>
          appointment.id === id
            ? { ...appointment, status: 'CANCELLED' }
            : appointment
        ));
      } catch (err) {
        console.error('Error cancelling appointment:', err);
        alert('Failed to cancel appointment. Please try again later.');
      }
    }
  };

  // Group appointments by date
  const groupedAppointments: Record<string, Appointment[]> = {};
  appointments.forEach(appointment => {
    const date = new Date(appointment.date).toLocaleDateString();
    if (!groupedAppointments[date]) {
      groupedAppointments[date] = [];
    }
    groupedAppointments[date].push(appointment);
  });

  // Sort dates in ascending order
  const sortedDates = Object.keys(groupedAppointments).sort((a, b) =>
    new Date(a).getTime() - new Date(b).getTime()
  );

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-pink-600 mb-8 text-center">My Appointments</h1>

      {!isOnline && (
        <div className="w-full max-w-4xl mx-auto mb-6 p-4 bg-amber-100 text-amber-800 rounded-lg shadow-md">
          <p className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            You are currently offline. Showing cached appointments.
          </p>
        </div>
      )}

      <div className="flex justify-end mb-6">
        <Link
          href="/appointments/new"
          className="px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-colors flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Book New Appointment
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
        </div>
      ) : error && appointments.length === 0 ? (
        <div className="text-center text-red-500 p-4 bg-red-50 rounded-lg">
          {error}
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          {sortedDates.length > 0 ? (
            sortedDates.map(date => (
              <div key={date} className="mb-8">
                <h2 className="text-xl font-semibold text-pink-600 mb-4 border-b border-pink-200 pb-2">
                  {new Date(date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </h2>
                <div className="space-y-4">
                  {groupedAppointments[date].map((appointment) => (
                    <div
                      key={appointment.id}
                      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-800">{appointment.service.name}</h3>
                            <p className="text-gray-600">
                              {new Date(appointment.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                              {new Date(new Date(appointment.date).getTime() + appointment.service.duration * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(appointment.status)}`}>
                            {appointment.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-gray-700">
                              <span className="font-medium">Staff:</span> {appointment.staff.user.name}
                            </p>
                            <p className="text-gray-700">
                              <span className="font-medium">Duration:</span> {appointment.service.duration} min
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-700">
                              <span className="font-medium">Price:</span> ${appointment.service.price.toFixed(2)}
                            </p>
                            {appointment.notes && (
                              <p className="text-gray-700">
                                <span className="font-medium">Notes:</span> {appointment.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-end space-x-2">
                          <Link
                            href={`/appointments/${appointment.id}`}
                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                          >
                            Details
                          </Link>
                          {appointment.status === 'PENDING' || appointment.status === 'CONFIRMED' ? (
                            <button
                              onClick={() => handleCancelAppointment(appointment.id)}
                              className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                              disabled={!isOnline}
                            >
                              Cancel
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center p-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500 mb-4">You dont have any appointments yet.</p>
              <Link
                href="/appointments/new"
                className="px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-colors"
              >
                Book Your First Appointment
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
