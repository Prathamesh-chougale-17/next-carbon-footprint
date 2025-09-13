import { NextRequest, NextResponse } from 'next/server';
import client from '@/lib/mongodb';
import { ProductBatch } from '@/lib/models';
import { ObjectId } from 'mongodb';

// PUT /api/product-batches/[id] - Update batch with token information
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const batchId = params.id;
    const body = await request.json();
    const { tokenId, txHash, blockNumber } = body;

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

    // Update batch with token information
    const result = await collection.updateOne(
      { _id: new ObjectId(batchId) },
      {
        $set: {
          tokenId: parseInt(tokenId),
          tokenContractAddress: '0xD6B231A6605490E83863D3B71c1C01e4E5B1212D', // Contract address
          txHash,
          blockNumber: blockNumber ? parseInt(blockNumber) : undefined,
          updatedAt: new Date(),
        },
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

// GET /api/product-batches/[id] - Get specific batch
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const batchId = params.id;

    await client.connect();
    const db = client.db('carbon-footprint');
    const collection = db.collection<ProductBatch>('productBatches');

    const batch = await collection.findOne({ _id: new ObjectId(batchId) });

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
