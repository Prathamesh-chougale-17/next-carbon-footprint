import { NextRequest, NextResponse } from 'next/server';
import client from '@/lib/mongodb';

interface QRCodeRecord {
  _id?: string;
  productId: string;
  productName: string;
  qrData: string;
  qrType: 'product' | 'asset' | 'token';
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
    
    const qrCodes = await db.collection<QRCodeRecord>('qrCodes').find(query).toArray();
    
    return NextResponse.json(qrCodes);
  } catch (error) {
    console.error('Error fetching QR codes:', error);
    return NextResponse.json({ error: 'Failed to fetch QR codes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const qrCodeData: Omit<QRCodeRecord, '_id'> = {
      ...body,
      companyAddress: body.companyAddress.toLowerCase(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await client.connect();
    const db = client.db('carbon-footprint');
    
    const result = await db.collection<QRCodeRecord>('qrCodes').insertOne(qrCodeData);
    
    return NextResponse.json({ 
      success: true, 
      id: result.insertedId,
      message: 'QR Code generated successfully' 
    });
  } catch (error) {
    console.error('Error creating QR code:', error);
    return NextResponse.json({ error: 'Failed to generate QR code' }, { status: 500 });
  }
}
