import { NextRequest, NextResponse } from 'next/server';
import client from '@/lib/mongodb';
import { Plant } from '@/lib/models';
import { ObjectId } from 'mongodb';

// GET /api/plants/[id] - Get specific plant
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string } >}
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid plant ID' },
        { status: 400 }
      );
    }

    await client.connect();
    const db = client.db('carbon-footprint');
    const collection = db.collection<Plant>('plants');

    const plant = await collection.findOne({ _id: new ObjectId(id) });

    if (!plant) {
      return NextResponse.json(
        { error: 'Plant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(plant);
  } catch (error) {
    console.error('Error fetching plant:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plant' },
      { status: 500 }
    );
  }
}

// PUT /api/plants/[id] - Update plant
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid plant ID' },
        { status: 400 }
      );
    }

    await client.connect();
    const db = client.db('carbon-footprint');
    const collection = db.collection<Plant>('plants');

    // Check if plant exists
    const existingPlant = await collection.findOne({ _id: new ObjectId(id) });
    if (!existingPlant) {
      return NextResponse.json(
        { error: 'Plant not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: Partial<Plant> = {
      ...body,
      updatedAt: new Date()
    };

    // Handle location coordinates if provided
    if (body.location) {
      updateData.location = {
        ...body.location,
        coordinates: {
          latitude: parseFloat(body.location.coordinates.latitude),
          longitude: parseFloat(body.location.coordinates.longitude)
        }
      };
    }


    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Plant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Plant updated successfully' });
  } catch (error) {
    console.error('Error updating plant:', error);
    return NextResponse.json(
      { error: 'Failed to update plant' },
      { status: 500 }
    );
  }
}

// DELETE /api/plants/[id] - Delete plant
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } =await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid plant ID' },
        { status: 400 }
      );
    }

    await client.connect();
    const db = client.db('carbon-footprint');
    const collection = db.collection<Plant>('plants');

    // Check if plant exists
    const plant = await collection.findOne({ _id: new ObjectId(id) });
    if (!plant) {
      return NextResponse.json(
        { error: 'Plant not found' },
        { status: 404 }
      );
    }

    // Permanently delete the plant from database
    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to delete plant' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Plant deleted successfully' });
  } catch (error) {
    console.error('Error deleting plant:', error);
    return NextResponse.json(
      { error: 'Failed to delete plant' },
      { status: 500 }
    );
  }
}
