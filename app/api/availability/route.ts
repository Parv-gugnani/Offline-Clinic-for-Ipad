import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';

// GET /api/availability - Get available time slots for a staff member on a specific date
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const staffId = searchParams.get('staffId');
    const dateParam = searchParams.get('date');

    if (!staffId || !dateParam) {
      return NextResponse.json(
        { error: 'Staff ID and date are required' },
        { status: 400 }
      );
    }

    // Parse the date
    const date = new Date(dateParam);
    const dayOfWeek = date.getDay();

    // Get staff availability for the day of week
    const availability = await prisma.availability.findMany({
      where: {
        staffId,
        dayOfWeek,
        isAvailable: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    if (availability.length === 0) {
      return NextResponse.json([]);
    }

    // Get existing appointments for the staff on the selected date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        staffId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
      },
      include: {
        service: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Generate available time slots based on availability and existing appointments
    const availableTimeSlots: string[] = [];

    // For each availability period
    for (const period of availability) {
      // Convert startTime and endTime strings to Date objects
      const [startHour, startMinute] = period.startTime.split(':').map(Number);
      const [endHour, endMinute] = period.endTime.split(':').map(Number);

      const periodStart = new Date(date);
      periodStart.setHours(startHour, startMinute, 0, 0);

      const periodEnd = new Date(date);
      periodEnd.setHours(endHour, endMinute, 0, 0);

      // Generate time slots in 30-minute intervals
      const currentSlot = new Date(periodStart);
      while (currentSlot < periodEnd) {
        // Check if this slot overlaps with any existing appointment
        let isSlotAvailable = true;

        for (const appointment of existingAppointments) {
          const appointmentStart = new Date(appointment.date);
          const appointmentEnd = new Date(appointment.date);
          appointmentEnd.setMinutes(appointmentEnd.getMinutes() + appointment.service.duration);

          // Check if the current slot overlaps with this appointment
          if (
            (currentSlot >= appointmentStart && currentSlot < appointmentEnd) ||
            (new Date(currentSlot.getTime() + 30 * 60000) > appointmentStart && 
             currentSlot < appointmentStart)
          ) {
            isSlotAvailable = false;
            break;
          }
        }

        if (isSlotAvailable) {
          // Format the time as HH:MM
          const hours = currentSlot.getHours().toString().padStart(2, '0');
          const minutes = currentSlot.getMinutes().toString().padStart(2, '0');
          availableTimeSlots.push(`${hours}:${minutes}`);
        }

        // Move to the next 30-minute slot
        currentSlot.setMinutes(currentSlot.getMinutes() + 30);
      }
    }

    return NextResponse.json(availableTimeSlots);
  } catch (error) {
    console.error('Error fetching available time slots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available time slots' },
      { status: 500 }
    );
  }
}

// POST /api/availability - Create or update staff availability
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { staffId, availabilityData } = body;

    if (!staffId || !availabilityData || !Array.isArray(availabilityData)) {
      return NextResponse.json(
        { error: 'Staff ID and availability data are required' },
        { status: 400 }
      );
    }

    // Delete existing availability for the staff
    await prisma.availability.deleteMany({
      where: { staffId },
    });

    // Create new availability records
    const availability = await prisma.availability.createMany({
      data: availabilityData.map((item: {
        dayOfWeek: number;
        startTime: string;
        endTime: string;
        isAvailable: boolean;
      }) => ({
        staffId,
        dayOfWeek: item.dayOfWeek,
        startTime: item.startTime,
        endTime: item.endTime,
        isAvailable: item.isAvailable,
      })),
    });

    return NextResponse.json({ 
      message: 'Availability updated successfully',
      count: availability.count 
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating availability:', error);
    return NextResponse.json(
      { error: 'Failed to update availability' },
      { status: 500 }
    );
  }
}
