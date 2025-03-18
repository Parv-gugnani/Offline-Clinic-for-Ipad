import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';

// GET /api/appointments - Get all appointments
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    const staffId = searchParams.get('staffId');
    const date = searchParams.get('date');

    // Build filter conditions
    const where: {
      clientId?: string;
      staffId?: string;
      date?: {
        gte?: Date;
        lte?: Date;
      };
    } = {};

    if (clientId) {
      where.clientId = clientId;
    }

    if (staffId) {
      where.staffId = staffId;
    }

    if (date) {
      // Filter appointments for a specific date
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      where.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        client: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        staff: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
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
    const { clientId, staffId, serviceId, date, notes } = body;

    // Validate required fields
    if (!clientId || !staffId || !serviceId || !date) {
      return NextResponse.json(
        { error: 'Client, staff, service, and date are required' },
        { status: 400 }
      );
    }

    // Convert date string to Date object
    const appointmentDate = new Date(date);

    // Check if the staff is available at the requested time
    const dayOfWeek = appointmentDate.getDay();
    const timeString = appointmentDate.toTimeString().slice(0, 5); // Format: "HH:MM"

    const staffAvailability = await prisma.availability.findFirst({
      where: {
        staffId,
        dayOfWeek,
        startTime: {
          lte: timeString,
        },
        endTime: {
          gte: timeString,
        },
        isAvailable: true,
      },
    });

    if (!staffAvailability) {
      return NextResponse.json(
        { error: 'Staff is not available at the requested time' },
        { status: 400 }
      );
    }

    // Check for overlapping appointments
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    const appointmentEndTime = new Date(appointmentDate);
    appointmentEndTime.setMinutes(appointmentEndTime.getMinutes() + service.duration);

    const overlappingAppointment = await prisma.appointment.findFirst({
      where: {
        staffId,
        date: {
          lt: appointmentEndTime,
        },
        AND: {
          date: {
            gte: appointmentDate,
          },
        },
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
      },
    });

    if (overlappingAppointment) {
      return NextResponse.json(
        { error: 'Staff already has an appointment at this time' },
        { status: 400 }
      );
    }

    // Create the appointment
    const appointment = await prisma.appointment.create({
      data: {
        clientId,
        staffId,
        serviceId,
        date: appointmentDate,
        notes,
        status: 'PENDING',
      },
      include: {
        client: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        staff: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        service: true,
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
