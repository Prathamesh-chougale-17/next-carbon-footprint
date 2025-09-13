import { NextRequest, NextResponse } from 'next/server';
import client from '@/lib/mongodb';
import { AssetTransfer } from '@/lib/models';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fromAddress = searchParams.get('fromAddress');
    const toAddress = searchParams.get('toAddress');
    
    await client.connect();
    const db = client.db('carbon-footprint');
    
    let query = {};
    if (fromAddress) {
      query = { fromAddress: fromAddress.toLowerCase() };
    } else if (toAddress) {
      query = { toAddress: toAddress.toLowerCase() };
    }
    
    const transfers = await db.collection<AssetTransfer>('assetTransfers').find(query).toArray();
    
    return NextResponse.json(transfers);
  } catch (error) {
    console.error('Error fetching asset transfers:', error);
    return NextResponse.json({ error: 'Failed to fetch asset transfers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const transferData: Omit<AssetTransfer, '_id'> = {
      ...body,
      fromAddress: body.fromAddress.toLowerCase(),
      toAddress: body.toAddress.toLowerCase(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await client.connect();
    const db = client.db('carbon-footprint');
    
    const result = await db.collection<AssetTransfer>('assetTransfers').insertOne(transferData);
    
    return NextResponse.json({ 
      success: true, 
      id: result.insertedId,
      message: 'Asset transfer recorded successfully' 
    });
  } catch (error) {
    console.error('Error creating asset transfer:', error);
    return NextResponse.json({ error: 'Failed to record asset transfer' }, { status: 500 });
  }
}
