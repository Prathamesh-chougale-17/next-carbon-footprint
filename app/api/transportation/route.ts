import { NextRequest, NextResponse } from 'next/server';
import client from '@/lib/mongodb';
import { Transportation } from '@/lib/models';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyAddress = searchParams.get('companyAddress');
    
    await client.connect();
    const db = client.db('carbon-footprint');
    
    let query = {};
    if (companyAddress) {
      query = { companyAddress: companyAddress.toLowerCase() };
    }
    
    const transportations = await db.collection<Transportation>('transportation').find(query).toArray();
    
    return NextResponse.json(transportations);
  } catch (error) {
    console.error('Error fetching transportations:', error);
    return NextResponse.json({ error: 'Failed to fetch transportations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const transportationData: Omit<Transportation, '_id'> = {
      ...body,
      companyAddress: body.companyAddress.toLowerCase(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await client.connect();
    const db = client.db('carbon-footprint');
    
    const result = await db.collection<Transportation>('transportation').insertOne(transportationData);
    
    return NextResponse.json({ 
      success: true, 
      id: result.insertedId,
      message: 'Transportation recorded successfully' 
    });
  } catch (error) {
    console.error('Error creating transportation:', error);
    return NextResponse.json({ error: 'Failed to record transportation' }, { status: 500 });
  }
}
