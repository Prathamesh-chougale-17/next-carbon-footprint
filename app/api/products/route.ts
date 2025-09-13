import { NextRequest, NextResponse } from 'next/server';
import client from '@/lib/mongodb';
import { Product, Company } from '@/lib/models';

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
    
    const products = await db.collection<Product>('products').find(query).toArray();
    
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const productData: Omit<Product, '_id'> = {
      ...body,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await client.connect();
    const db = client.db('carbon-footprint');
    
    // Check if company exists
    const company = await db.collection<Company>('companies').findOne({
      walletAddress: productData.companyAddress.toLowerCase()
    });
    
    if (!company) {
      return NextResponse.json({ error: 'Company not registered' }, { status: 400 });
    }

    // Create product
    const result = await db.collection<Product>('products').insertOne(productData);
    
    // Update company's products array
    await db.collection<Company>('companies').updateOne(
      { walletAddress: productData.companyAddress.toLowerCase() },
      { 
        $push: { products: result.insertedId.toString() },
        $set: { updatedAt: new Date() }
      }
    );
    
    return NextResponse.json({ 
      success: true, 
      id: result.insertedId,
      message: 'Product registered successfully' 
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
