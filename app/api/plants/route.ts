import { NextRequest, NextResponse } from 'next/server';
import client from '@/lib/mongodb';
import { Plant, Company } from '@/lib/models';

// GET /api/plants - Fetch plants
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyAddress = searchParams.get('companyAddress');
    const operationalStatus = searchParams.get('operationalStatus');
    const processingType = searchParams.get('processingType');

    await client.connect();
    const db = client.db('carbon-footprint');
    const collection = db.collection<Plant>('plants');

    let query: any = {};

    if (companyAddress) {
      query.companyAddress = companyAddress;
    }

    if (operationalStatus) {
      query.operationalStatus = operationalStatus;
    }

    if (processingType) {
      query.processingTypes = { $in: [processingType] };
    }

    const plants = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(plants);
  } catch (error) {
    console.error('Error fetching plants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plants' },
      { status: 500 }
    );
  }
}

// POST /api/plants - Create new plant
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      plantName,
      plantCode,
      description,
      companyAddress,
      location
    } = body;

    // Validate required fields
    if (!plantName || !plantCode || !description || !companyAddress || !location) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate location coordinates
    if (!location.coordinates || !location.coordinates.latitude || !location.coordinates.longitude) {
      return NextResponse.json(
        { error: 'Location coordinates (latitude and longitude) are required' },
        { status: 400 }
      );
    }

    await client.connect();
    const db = client.db('carbon-footprint');
    const plantsCollection = db.collection<Plant>('plants');
    const companiesCollection = db.collection<Company>('companies');

    // Check if company exists (case-insensitive)
    const company = await companiesCollection.findOne({
      walletAddress: companyAddress.toLowerCase()
    });
    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Check for duplicate plant code
    const existingPlant = await plantsCollection.findOne({
      plantCode,
      companyAddress: companyAddress.toLowerCase()
    });

    if (existingPlant) {
      return NextResponse.json(
        { error: 'Plant with this code already exists for this company' },
        { status: 409 }
      );
    }

    const plant: Omit<Plant, '_id'> = {
      plantName,
      plantCode,
      description,
      companyAddress: companyAddress.toLowerCase(),
      location: {
        address: location.address,
        city: location.city,
        state: location.state,
        country: location.country,
        postalCode: location.postalCode,
        coordinates: {
          latitude: parseFloat(location.coordinates.latitude),
          longitude: parseFloat(location.coordinates.longitude)
        }
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await plantsCollection.insertOne(plant);

    if (result.insertedId) {
      return NextResponse.json(
        {
          message: 'Plant registered successfully',
          plantId: result.insertedId.toString()
        },
        { status: 201 }
      );
    } else {
      return NextResponse.json(
        { error: 'Failed to register plant' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error creating plant:', error);
    return NextResponse.json(
      { error: 'Failed to create plant' },
      { status: 500 }
    );
  }
}
