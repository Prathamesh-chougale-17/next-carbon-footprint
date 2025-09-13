import { NextRequest, NextResponse } from 'next/server';
import client from '@/lib/mongodb';
import { Token } from '@/lib/models';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const manufacturerAddress = searchParams.get('manufacturerAddress');
    
    await client.connect();
    const db = client.db('carbon-footprint');
    
    let query = {};
    if (manufacturerAddress) {
      query = { manufacturerAddress: manufacturerAddress.toLowerCase() };
    }
    
    const tokens = await db.collection<Token>('tokens').find(query).toArray();
    
    return NextResponse.json(tokens);
  } catch (error) {
    console.error('Error fetching tokens:', error);
    return NextResponse.json({ error: 'Failed to fetch tokens' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tokenData: Omit<Token, '_id'> = {
      ...body,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await client.connect();
    const db = client.db('carbon-footprint');
    
    // Get next token ID
    const lastToken = await db.collection<Token>('tokens')
      .findOne({}, { sort: { tokenId: -1 } });
    
    const nextTokenId = lastToken ? lastToken.tokenId + 1 : 1;
    tokenData.tokenId = nextTokenId;
    
    const result = await db.collection<Token>('tokens').insertOne(tokenData);
    
    return NextResponse.json({ 
      success: true, 
      id: result.insertedId,
      tokenId: nextTokenId,
      message: 'Token minted successfully' 
    });
  } catch (error) {
    console.error('Error creating token:', error);
    return NextResponse.json({ error: 'Failed to create token' }, { status: 500 });
  }
}
