import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';

// GET /api/appointments - Get all appointments
export async function GET() {
  try {
    const appointments = await prisma.appointment.findMany({
      include: {
        client: true,
        staff: true,
        service: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}

// POST /api/appointments - Create a new appointment
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clientId, staffId, serviceId, date } = body;

    // Validate required fields
    if (!clientId || !staffId || !serviceId || !date) {
      return NextResponse.json(
        { error: 'Client, staff, service, and date are required' },
        { status: 400 }
      );
    }

    // Convert date string to Date object
    const appointmentDate = new Date(date);

    // Create the appointment
    const appointment = await prisma.appointment.create({
      data: {
        clientId,
        staffId,
        serviceId,
        date: appointmentDate,
        status: 'PENDING',
      },
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    );
  }
}
