import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';

// GET /api/appointments/[id] - Get a specific appointment
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
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

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(appointment);
  } catch (error) {
    console.error('Error fetching appointment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointment' },
      { status: 500 }
    );
  }
}

// PUT /api/appointments/[id] - Update an appointment
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await req.json();
    const { staffId, serviceId, date, status, notes } = body;

    // Check if appointment exists
    const existingAppointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!existingAppointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: Record<string, string | Date | undefined> = {};
    
    if (staffId) updateData.staffId = staffId;
    if (serviceId) updateData.serviceId = serviceId;
    if (notes !== undefined) updateData.notes = notes;
    if (status) updateData.status = status;
    
    if (date) {
      // Convert date string to Date object
      const appointmentDate = new Date(date);
      updateData.date = appointmentDate;
      
      // If date is changing, check availability
      if (staffId || date) {
        const checkStaffId = staffId || existingAppointment.staffId;
        const dayOfWeek = appointmentDate.getDay();
        const timeString = appointmentDate.toTimeString().slice(0, 5); // Format: "HH:MM"

        const staffAvailability = await prisma.availability.findFirst({
          where: {
            staffId: checkStaffId,
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
        const checkServiceId = serviceId || existingAppointment.serviceId;
        const service = await prisma.service.findUnique({
          where: { id: checkServiceId },
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
            id: { not: id }, // Exclude current appointment
            staffId: checkStaffId,
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
      }
    }

    // Update the appointment
    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(updatedAppointment);
  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json(
      { error: 'Failed to update appointment' },
      { status: 500 }
    );
  }
}

// DELETE /api/appointments/[id] - Delete an appointment
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // Check if appointment exists
    const existingAppointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!existingAppointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Delete the appointment
    await prisma.appointment.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    return NextResponse.json(
      { error: 'Failed to delete appointment' },
      { status: 500 }
    );
  }
}
