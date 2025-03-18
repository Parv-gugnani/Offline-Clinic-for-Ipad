'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { initDatabase } from '../src/lib/indexedDB';

// Define the type for the install prompt event
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Home() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    // Initialize IndexedDB
    initDatabase().catch(console.error);

    // Handle PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show the install button
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      // Clear the saved prompt since it can't be used again
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    });
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-6 bg-gradient-to-b from-pink-50 to-white">
      {showInstallPrompt && (
        <button
          onClick={handleInstallClick}
          className="mb-6 p-3 bg-pink-500 text-white rounded-lg shadow-lg hover:bg-pink-600 transition-colors"
        >
          Install as App for Offline Use
        </button>
      )}

      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-pink-600 mb-2">Beauty Clinic</h1>
        <p className="text-gray-600 text-lg">Book your beauty treatments with ease</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        <Link href="/appointments" className="group">
          <div className="p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-pink-100 text-pink-600 mb-4 mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-center mb-2 text-gray-800 group-hover:text-pink-600 transition-colors">Book Appointment</h2>
            <p className="text-gray-600 text-center">Schedule your next beauty treatment</p>
          </div>
        </Link>

        <Link href="/services" className="group">
          <div className="p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-pink-100 text-pink-600 mb-4 mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-center mb-2 text-gray-800 group-hover:text-pink-600 transition-colors">Our Services</h2>
            <p className="text-gray-600 text-center">Explore our range of beauty treatments</p>
          </div>
        </Link>

        <Link href="/profile" className="group">
          <div className="p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-pink-100 text-pink-600 mb-4 mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-center mb-2 text-gray-800 group-hover:text-pink-600 transition-colors">My Profile</h2>
            <p className="text-gray-600 text-center">View and edit your profile information</p>
          </div>
        </Link>

        <Link href="/my-appointments" className="group">
          <div className="p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-pink-100 text-pink-600 mb-4 mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 12l2 2 4-4" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-center mb-2 text-gray-800 group-hover:text-pink-600 transition-colors">My Appointments</h2>
            <p className="text-gray-600 text-center">View and manage your bookings</p>
          </div>
        </Link>
      </div>

      <div className="mt-12 text-center">
        <p className="text-gray-500">
          <span className="font-semibold">Works Offline!</span> This app is designed to work even when you&apos;re not connected to the internet.
        </p>
      </div>
    </main>
  );
}
