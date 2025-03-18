import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';

// GET /api/availability - Get staff availability
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const staffId = searchParams.get('staffId');

    if (!staffId) {
      return NextResponse.json(
        { error: 'Staff ID is required' },
        { status: 400 }
      );
    }

    // Get staff availability
    const availability = await prisma.availability.findMany({
      where: {
        staffId,
      },
      orderBy: {
        dayOfWeek: 'asc',
      },
    });

    return NextResponse.json(availability);
  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    );
  }
}

// POST /api/availability - Create staff availability
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { staffId, dayOfWeek, startTime, endTime } = body;

    if (!staffId || dayOfWeek === undefined || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Staff ID, day of week, start time, and end time are required' },
        { status: 400 }
      );
    }

    // Create availability record
    const availability = await prisma.availability.create({
      data: {
        staffId,
        dayOfWeek,
        startTime,
        endTime,
        isAvailable: true,
      },
    });

    return NextResponse.json(availability, { status: 201 });
  } catch (error) {
    console.error('Error creating availability:', error);
    return NextResponse.json(
      { error: 'Failed to create availability' },
      { status: 500 }
    );
  }
}
