import { NextRequest, NextResponse } from 'next/server';
import client from '@/lib/mongodb';
import { ProductBatch, ProductTemplate, BatchComponent } from '@/lib/models';
import { ObjectId } from 'mongodb';
import { smartContractService, BatchMintParams } from '@/lib/smart-contract';

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
      plantId,
      components
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

    // Validate and process components if provided
    let processedComponents: BatchComponent[] | undefined;
    if (components && Array.isArray(components) && components.length > 0) {
      processedComponents = components.map((comp: any) => ({
        tokenId: comp.tokenId,
        tokenName: comp.tokenName,
        quantity: comp.quantity,
        carbonFootprint: comp.carbonFootprint || 0
      }));
    }

    const batch: Omit<ProductBatch, '_id'> = {
      batchNumber,
      templateId,
      quantity: parseInt(quantity),
      productionDate: new Date(productionDate),
      carbonFootprint: carbonFootprint || (template.specifications.carbonFootprintPerUnit * parseInt(quantity)),
      manufacturerAddress,
      plantId: new ObjectId(plantId),
      components: processedComponents,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await batchesCollection.insertOne(batch);

    if (result.insertedId) {
      // Note: Token minting will be handled on the frontend
      // This is because it requires user interaction with MetaMask
      // The frontend will call the smart contract and then update the batch with token details

      return NextResponse.json(
        {
          message: 'Product batch created successfully. Please complete token minting on the frontend.',
          batchId: result.insertedId.toString(),
          requiresTokenMinting: true
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
