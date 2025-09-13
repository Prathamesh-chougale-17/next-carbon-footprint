import { NextRequest, NextResponse } from 'next/server';
import client from '@/lib/mongodb';
import { Company } from '@/lib/models';

export async function GET(request: NextRequest) {
  try {
    await client.connect();
    const db = client.db('carbon-footprint');
    const companies = await db.collection<Company>('companies').find({}).toArray();
    
    return NextResponse.json(companies);
  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const companyData: Omit<Company, '_id'> = {
      ...body,
      products: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await client.connect();
    const db = client.db('carbon-footprint');
    
    // Check if company already exists
    const existingCompany = await db.collection<Company>('companies').findOne({
      walletAddress: companyData.walletAddress
    });
    
    if (existingCompany) {
      return NextResponse.json({ error: 'Company already registered' }, { status: 400 });
    }

    const result = await db.collection<Company>('companies').insertOne(companyData);
    
    return NextResponse.json({ 
      success: true, 
      id: result.insertedId,
      message: 'Company registered successfully' 
    });
  } catch (error) {
    console.error('Error creating company:', error);
    return NextResponse.json({ error: 'Failed to create company' }, { status: 500 });
  }
}
