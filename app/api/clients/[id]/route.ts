import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';

// GET /api/clients/[id] - Get a specific client
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = params.id;

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error('Error fetching client:', error);
    return NextResponse.json(
      { error: 'Failed to fetch client' },
      { status: 500 }
    );
  }
}

// PUT /api/clients/[id] - Update a client
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = params.id;
    const body = await req.json();
    const { notes } = body;

    // Check if client exists
    const existingClient = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!existingClient) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Update client
    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: {
        notes,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
          },
        },
      },
    });

    return NextResponse.json(updatedClient);
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json(
      { error: 'Failed to update client' },
      { status: 500 }
    );
  }
}

// DELETE /api/clients/[id] - Delete a client
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = params.id;

    // Check if client exists
    const existingClient = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!existingClient) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Delete client
    await prisma.client.delete({
      where: { id: clientId },
    });

    return NextResponse.json(
      { message: 'Client deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json(
      { error: 'Failed to delete client' },
      { status: 500 }
    );
  }
}
