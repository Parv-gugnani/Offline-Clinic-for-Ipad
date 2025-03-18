'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
}

interface Client {
  id: string;
  userId: string;
  notes: string | null;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const userId = 'user001';

    const fetchUserData = async () => {
      try {
        setLoading(true);

        const userResponse = await fetch(`/api/users/${userId}`);
        if (!userResponse.ok) {
          throw new Error('Failed to fetch user data');
        }
        const userData = await userResponse.json();
        setUser(userData);

        setName(userData.name || '');
        setEmail(userData.email || '');
        setPhone(userData.phone || '');
        setAddress(userData.address || '');

        const clientResponse = await fetch(`/api/clients?userId=${userId}`);
        if (clientResponse.ok) {
          const clientData = await clientResponse.json();
          if (clientData.length > 0) {
            setClient(clientData[0]);
            setNotes(clientData[0].notes || '');
          }
        }

        if (window.indexedDB) {
          const openRequest = window.indexedDB.open('beautyClinicDB', 1);
          openRequest.onsuccess = (event) => {
            const database = (event.target as IDBOpenDBRequest).result;

            const userTransaction = database.transaction(['users'], 'readwrite');
            const userStore = userTransaction.objectStore('users');
            userStore.put(userData);

            if (clientResponse.ok) {
              clientResponse.json().then(data => {
                if (data.length > 0) {
                  const clientTransaction = database.transaction(['clients'], 'readwrite');
                  const clientStore = clientTransaction.objectStore('clients');
                  clientStore.put(data[0]);
                }
              });
            }
          };
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load profile data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      const userResponse = await fetch(`/api/users/${user?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          address,
        }),
      });

      if (!userResponse.ok) {
        throw new Error('Failed to update user data');
      }

      if (client) {
        const clientResponse = await fetch(`/api/clients/${client.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            notes,
          }),
        });

        if (!clientResponse.ok) {
          throw new Error('Failed to update client data');
        }
      }

      const updatedUserResponse = await fetch(`/api/users/${user?.id}`);
      const updatedUserData = await updatedUserResponse.json();
      setUser(updatedUserData);

      if (client) {
        const updatedClientResponse = await fetch(`/api/clients/${client.id}`);
        const updatedClientData = await updatedClientResponse.json();
        setClient(updatedClientData);
      }

      setIsEditing(false);
    } catch (err: Error | unknown) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-pink-600 mb-8 text-center">My Profile</h1>

      {error && (
        <div className="w-full max-w-2xl mx-auto mb-6 p-4 bg-red-100 text-red-800 rounded-lg shadow-md">
          <p className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
          {isEditing ? (
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label htmlFor="name" className="block text-gray-700 font-medium mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                  required
                />
              </div>

              <div className="mb-6">
                <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                  required
                />
              </div>

              <div className="mb-6">
                <label htmlFor="phone" className="block text-gray-700 font-medium mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div className="mb-6">
                <label htmlFor="address" className="block text-gray-700 font-medium mb-2">
                  Address
                </label>
                <textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                  rows={3}
                ></textarea>
              </div>

              {client && (
                <div className="mb-6">
                  <label htmlFor="notes" className="block text-gray-700 font-medium mb-2">
                    Special Notes (allergies, preferences, etc.)
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    rows={3}
                  ></textarea>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-colors disabled:bg-pink-300"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">Personal Information</h2>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-colors"
                >
                  Edit Profile
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <p className="text-gray-500 text-sm mb-1">Full Name</p>
                  <p className="text-gray-800 font-medium">{user?.name || 'Not provided'}</p>
                </div>

                <div>
                  <p className="text-gray-500 text-sm mb-1">Email</p>
                  <p className="text-gray-800 font-medium">{user?.email || 'Not provided'}</p>
                </div>

                <div>
                  <p className="text-gray-500 text-sm mb-1">Phone Number</p>
                  <p className="text-gray-800 font-medium">{user?.phone || 'Not provided'}</p>
                </div>

                <div>
                  <p className="text-gray-500 text-sm mb-1">Address</p>
                  <p className="text-gray-800 font-medium">{user?.address || 'Not provided'}</p>
                </div>
              </div>

              {client && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Client Information</h3>
                  <div>
                    <p className="text-gray-500 text-sm mb-1">Special Notes</p>
                    <p className="text-gray-800">{client.notes || 'No special notes provided'}</p>
                  </div>
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Quick Links</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link href="/my-appointments" className="px-4 py-3 bg-pink-50 text-pink-600 rounded-md hover:bg-pink-100 transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    My Appointments
                  </Link>
                  <Link href="/services" className="px-4 py-3 bg-pink-50 text-pink-600 rounded-md hover:bg-pink-100 transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h8V3a1 1 0 112 0v1h1a2 2 0 012 2v10a2 2 0 01-2 2H3a2 2 0 01-2-2V6a2 2 0 012-2h1V3a1 1 0 011-1zm2 5a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                    Browse Services
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
