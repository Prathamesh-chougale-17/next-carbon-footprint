import { NextRequest, NextResponse } from 'next/server';
import client from '@/lib/mongodb';

interface ManufacturingProcess {
  _id?: string;
  processName: string;
  rawMaterialIds: string[];
  outputProductId: string;
  quantity: number;
  carbonFootprint: number;
  manufacturingAddress: string;
  companyAddress: string;
  createdAt: Date;
  updatedAt: Date;
}

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
    
    const processes = await db.collection<ManufacturingProcess>('manufacturing').find(query).toArray();
    
    return NextResponse.json(processes);
  } catch (error) {
    console.error('Error fetching manufacturing processes:', error);
    return NextResponse.json({ error: 'Failed to fetch manufacturing processes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const processData: Omit<ManufacturingProcess, '_id'> = {
      ...body,
      companyAddress: body.companyAddress.toLowerCase(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await client.connect();
    const db = client.db('carbon-footprint');
    
    const result = await db.collection<ManufacturingProcess>('manufacturing').insertOne(processData);
    
    return NextResponse.json({ 
      success: true, 
      id: result.insertedId,
      message: 'Manufacturing process recorded successfully' 
    });
  } catch (error) {
    console.error('Error creating manufacturing process:', error);
    return NextResponse.json({ error: 'Failed to record manufacturing process' }, { status: 500 });
  }
}
