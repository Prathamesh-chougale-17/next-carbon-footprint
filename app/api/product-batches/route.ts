import { NextRequest, NextResponse } from 'next/server';
import client from '@/lib/mongodb';
import { ProductBatch, ProductTemplate } from '@/lib/models';
import { ObjectId } from 'mongodb';

// GET /api/product-batches - Fetch product batches
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const manufacturerAddress = searchParams.get('manufacturerAddress');
    const templateId = searchParams.get('templateId');

    await client.connect();
    const db = client.db('carbon-footprint');
    const collection = db.collection<ProductBatch>('productBatches');

    let query: any = {};

    if (manufacturerAddress) {
      query.manufacturerAddress = manufacturerAddress;
    }


    if (templateId) {
      query.templateId = templateId;
    }

    const batches = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(batches);
  } catch (error) {
    console.error('Error fetching product batches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product batches' },
      { status: 500 }
    );
  }
}

// POST /api/product-batches - Create new product batch
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      batchNumber,
      templateId,
      quantity,
      productionDate,
      carbonFootprint,
      manufacturerAddress,
      plantId
    } = body;

    // Validate required fields
    if (!batchNumber || !templateId || !quantity || !manufacturerAddress || !plantId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await client.connect();
    const db = client.db('carbon-footprint');
    const batchesCollection = db.collection<ProductBatch>('productBatches');
    const templatesCollection = db.collection<ProductTemplate>('productTemplates');

    // Check if template exists
    const template = await templatesCollection.findOne({ _id: new ObjectId(templateId) });
    if (!template) {
      return NextResponse.json(
        { error: 'Product template not found' },
        { status: 404 }
      );
    }

    // Check for duplicate batch number for this manufacturer
    const existingBatch = await batchesCollection.findOne({
      batchNumber,
      manufacturerAddress
    });

    if (existingBatch) {
      return NextResponse.json(
        { error: 'Batch with this number already exists for this manufacturer' },
        { status: 409 }
      );
    }

    const batch: Omit<ProductBatch, '_id'> = {
      batchNumber,
      templateId,
      quantity: parseInt(quantity),
      productionDate: new Date(productionDate),
      carbonFootprint: carbonFootprint || (template.specifications.carbonFootprintPerUnit * parseInt(quantity)),
      manufacturerAddress,
      plantId: new ObjectId(plantId),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await batchesCollection.insertOne(batch);

    if (result.insertedId) {
      return NextResponse.json(
        {
          message: 'Product batch created successfully',
          batchId: result.insertedId.toString()
        },
        { status: 201 }
      );
    } else {
      return NextResponse.json(
        { error: 'Failed to create product batch' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error creating product batch:', error);
    return NextResponse.json(
      { error: 'Failed to create product batch' },
      { status: 500 }
    );
  }
}
