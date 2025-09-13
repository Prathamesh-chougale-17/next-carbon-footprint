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
    console.log('Product registration request body:', body);
    
    // Validate required fields
    const requiredFields = ['productName', 'description', 'weight', 'carbonFootprint', 'companyAddress', 'manufacturingAddress'];
    const missingFields = requiredFields.filter(field => !body[field] || body[field] === '');
    
    if (missingFields.length > 0) {
      return NextResponse.json({ 
        error: `Missing required fields: ${missingFields.join(', ')}` 
      }, { status: 400 });
    }
    
    // Validate numeric fields
    if (isNaN(parseFloat(body.weight)) || parseFloat(body.weight) <= 0) {
      return NextResponse.json({ 
        error: 'Weight must be a positive number' 
      }, { status: 400 });
    }
    
    if (isNaN(parseFloat(body.carbonFootprint)) || parseFloat(body.carbonFootprint) < 0) {
      return NextResponse.json({ 
        error: 'Carbon footprint must be a non-negative number' 
      }, { status: 400 });
    }
    
    const productData: Omit<Product, '_id'> = {
      productName: body.productName,
      description: body.description,
      weight: parseFloat(body.weight),
      carbonFootprint: parseFloat(body.carbonFootprint),
      companyAddress: body.companyAddress,
      isRawMaterial: Boolean(body.isRawMaterial),
      manufacturingAddress: body.manufacturingAddress,
      productImage: body.productImage || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log('Product data to be saved:', productData);

    await client.connect();
    const db = client.db('carbon-footprint');
    
    // Check if company exists
    const companyQuery = { walletAddress: productData.companyAddress.toLowerCase() };
    console.log('Looking for company with query:', companyQuery);
    
    const company = await db.collection<Company>('companies').findOne(companyQuery);
    console.log('Found company:', company);
    
    if (!company) {
      console.log('Company not found for address:', productData.companyAddress);
      return NextResponse.json({ 
        error: 'Company not registered. Please register your company first.',
        companyAddress: productData.companyAddress 
      }, { status: 400 });
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
