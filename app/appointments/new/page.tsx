'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Service {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  category: string;
}

interface Staff {
  id: string;
  user: {
    name: string;
    email: string;
  };
  specialization: string;
}

export default function NewAppointmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedServiceId = searchParams.get('serviceId');

  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [selectedService, setSelectedService] = useState<string>(preSelectedServiceId || '');
  const [selectedStaff, setSelectedStaff] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);

        // Fetch services
        const servicesResponse = await fetch('/api/services');
        if (!servicesResponse.ok) {
          throw new Error('Failed to fetch services');
        }
        const servicesData = await servicesResponse.json();
        setServices(servicesData);

        // Fetch staff
        const staffResponse = await fetch('/api/staff');
        if (!staffResponse.ok) {
          throw new Error('Failed to fetch staff');
        }
        const staffData = await staffResponse.json();
        setStaff(staffData);

        // If we have a preselected service, set it
        if (preSelectedServiceId) {
          setSelectedService(preSelectedServiceId);
        }
      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError('Failed to load necessary data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [preSelectedServiceId]);

  useEffect(() => {
    // When staff and date are selected, fetch available time slots
    const fetchAvailableTimeSlots = async () => {
      if (!selectedStaff || !selectedDate) return;
      
      try {
        const response = await fetch(`/api/availability?staffId=${selectedStaff}&date=${selectedDate}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch available time slots');
        }
        
        const data = await response.json();
        setAvailableTimeSlots(data);
      } catch (err) {
        console.error('Error fetching available time slots:', err);
        setError('Failed to load available time slots. Please try again later.');
      }
    };

    if (selectedStaff && selectedDate) {
      fetchAvailableTimeSlots();
    } else {
      setAvailableTimeSlots([]);
    }
  }, [selectedStaff, selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedService || !selectedStaff || !selectedDate || !selectedTime) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);

      // Combine date and time
      const appointmentDateTime = new Date(`${selectedDate}T${selectedTime}`);

      // For demo purposes, we'll use a hardcoded client ID
      // In a real app, this would come from authentication
      const clientId = 'cl001';

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          staffId: selectedStaff,
          serviceId: selectedService,
          date: appointmentDateTime.toISOString(),
          notes: notes || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to book appointment');
      }

      // Redirect to the appointments page
      router.push('/my-appointments');
    } catch (err: Error | unknown) {
      console.error('Error booking appointment:', err);
      setError(err instanceof Error ? err.message : 'Failed to book appointment. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  // Get today's date in YYYY-MM-DD format for min date input
  const today = new Date().toISOString().split('T')[0];

  // Get a date 3 months from now for max date input
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 3);
  const maxDateString = maxDate.toISOString().split('T')[0];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-pink-600 mb-8 text-center">Book an Appointment</h1>

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
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <label htmlFor="service" className="block text-gray-700 font-medium mb-2">
              Service <span className="text-red-500">*</span>
            </label>
            <select
              id="service"
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              required
            >
              <option value="">Select a service</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} - ${service.price.toFixed(2)} ({service.duration} min)
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label htmlFor="staff" className="block text-gray-700 font-medium mb-2">
              Staff Member <span className="text-red-500">*</span>
            </label>
            <select
              id="staff"
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              required
            >
              <option value="">Select a staff member</option>
              {staff.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.user.name} - {member.specialization}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label htmlFor="date" className="block text-gray-700 font-medium mb-2">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={today}
              max={maxDateString}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="time" className="block text-gray-700 font-medium mb-2">
              Time <span className="text-red-500">*</span>
            </label>
            {selectedStaff && selectedDate ? (
              availableTimeSlots.length > 0 ? (
                <select
                  id="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                  required
                >
                  <option value="">Select a time</option>
                  {availableTimeSlots.map((timeSlot) => (
                    <option key={timeSlot} value={timeSlot}>
                      {timeSlot}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-red-500">No available time slots for the selected date. Please choose another date.</p>
              )
            ) : (
              <p className="text-gray-500">Please select a staff member and date first.</p>
            )}
          </div>

          <div className="mb-6">
            <label htmlFor="notes" className="block text-gray-700 font-medium mb-2">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              rows={3}
              placeholder="Any special requests or information for your appointment"
            ></textarea>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-colors disabled:bg-pink-300"
              disabled={submitting}
            >
              {submitting ? 'Booking...' : 'Book Appointment'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
