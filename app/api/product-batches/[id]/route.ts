import { NextRequest, NextResponse } from 'next/server';
import client from '@/lib/mongodb';
import { ProductBatch } from '@/lib/models';
import { ObjectId } from 'mongodb';

// PUT /api/product-batches/[id] - Update batch with token information
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: batchId } = await params;
    const body = await request.json();
    const { tokenId, txHash, blockNumber, consumedComponents } = body;

    // Validate required fields
    if (!tokenId || !txHash) {
      return NextResponse.json(
        { error: 'Missing required fields: tokenId, txHash' },
        { status: 400 }
      );
    }

    await client.connect();
    const db = client.db('carbon-footprint');
    const collection = db.collection<ProductBatch>('productBatches');

    // Build query - try ObjectId first, then batchNumber
    let query;
    if (ObjectId.isValid(batchId)) {
      query = { _id: new ObjectId(batchId) };
    } else {
      query = { batchNumber: batchId };
    }

    // Build update object
    const updateFields: any = {
      tokenId: parseInt(tokenId),
      tokenContractAddress: '0x6f70264A4f3608FFa8Ff3ED5C6a1c4542D79fb88', // Updated contract address
      txHash,
      blockNumber: blockNumber ? parseInt(blockNumber) : undefined,
      updatedAt: new Date(),
    };

    // Update component consumption status if provided
    if (consumedComponents && Array.isArray(consumedComponents)) {
      // Get the current batch to update components
      const currentBatch = await collection.findOne(query);
      if (currentBatch && currentBatch.components) {
        const updatedComponents = currentBatch.components.map((component: any) => {
          const consumedComponent = consumedComponents.find((c: any) => c.tokenId === component.tokenId);
          if (consumedComponent) {
            return {
              ...component,
              consumed: true,
              burnTxHash: consumedComponent.burnTxHash
            };
          }
          return component;
        });
        updateFields.components = updatedComponents;
      }
    }

    // Update batch with token information
    const result = await collection.updateOne(
      query,
      {
        $set: updateFields,
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      );
    }

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'No changes made to batch' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'Batch updated with token information successfully',
      batchId,
      tokenId: parseInt(tokenId),
      txHash,
    });
  } catch (error) {
    console.error('Error updating batch with token info:', error);
    return NextResponse.json(
      { error: 'Failed to update batch' },
      { status: 500 }
    );
  }
}

// GET /api/product-batches/[id] - Get specific batch by ObjectId or batchNumber
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: batchId } = await params;

    await client.connect();
    const db = client.db('carbon-footprint');
    const collection = db.collection<ProductBatch>('productBatches');

    let batch;

    // Try to find by ObjectId first (if it's a valid ObjectId)
    if (ObjectId.isValid(batchId)) {
      batch = await collection.findOne({ _id: new ObjectId(batchId) });
    }

    // If not found by ObjectId, try to find by batchNumber
    if (!batch) {
      batch = await collection.findOne({ batchNumber: batchId });
    }

    if (!batch) {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(batch);
  } catch (error) {
    console.error('Error fetching batch:', error);
    return NextResponse.json(
      { error: 'Failed to fetch batch' },
      { status: 500 }
    );
  }
}
