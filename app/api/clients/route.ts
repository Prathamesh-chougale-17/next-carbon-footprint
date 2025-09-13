import { NextRequest, NextResponse } from 'next/server';
import client from '@/lib/mongodb';
import { Client } from '@/lib/models';

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
    
    const clients = await db.collection<Client>('clients').find(query).toArray();
    
    return NextResponse.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const clientData: Omit<Client, '_id'> = {
      ...body,
      companyAddress: body.companyAddress.toLowerCase(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await client.connect();
    const db = client.db('carbon-footprint');
    
    const result = await db.collection<Client>('clients').insertOne(clientData);
    
    return NextResponse.json({ 
      success: true, 
      id: result.insertedId,
      message: 'Client added successfully' 
    });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}
