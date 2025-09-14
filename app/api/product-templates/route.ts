import { NextRequest, NextResponse } from 'next/server';
import client from '@/lib/mongodb';
import { ProductTemplate, Company } from '@/lib/models';

// GET /api/product-templates - Fetch product templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const manufacturerAddress = searchParams.get('manufacturerAddress');
    const category = searchParams.get('category');
    const isActive = searchParams.get('isActive');

    await client.connect();
    const db = client.db('carbon-footprint');
    const collection = db.collection<ProductTemplate>('productTemplates');

    let query: any = {};

    if (manufacturerAddress) {
      query.manufacturerAddress = manufacturerAddress;
    }

    if (category) {
      query.category = category;
    }

    if (isActive !== null) {
      query.isActive = isActive === 'true';
    }

    const templates = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching product templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product templates' },
      { status: 500 }
    );
  }
}

// POST /api/product-templates - Create new product template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      templateName,
      description,
      category,
      imageUrl,
      specifications,
      manufacturerAddress,
      isRawMaterial = false
    } = body;

    // Validate required fields
    if (!templateName || !description || !category || !specifications || !manufacturerAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate specifications
    if (!specifications.weight || !specifications.materials || !specifications.carbonFootprintPerUnit) {
      return NextResponse.json(
        { error: 'Invalid specifications: weight, materials, and carbonFootprintPerUnit are required' },
        { status: 400 }
      );
    }

    await client.connect();
    const db = client.db('carbon-footprint');
    const templatesCollection = db.collection<ProductTemplate>('productTemplates');
    const companiesCollection = db.collection<Company>('companies');

    // Check if company exists (case-insensitive)
    const company = await companiesCollection.findOne({
      walletAddress: manufacturerAddress.toLowerCase()
    });
    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Check for duplicate template name for this manufacturer
    const existingTemplate = await templatesCollection.findOne({
      templateName,
      manufacturerAddress: manufacturerAddress.toLowerCase()
    });

    if (existingTemplate) {
      return NextResponse.json(
        { error: 'Template with this name already exists for this manufacturer' },
        { status: 409 }
      );
    }

    const template: Omit<ProductTemplate, '_id'> = {
      templateName,
      description,
      category,
      imageUrl: imageUrl || undefined,
      specifications: {
        weight: specifications.weight,
        dimensions: specifications.dimensions || undefined,
        materials: Array.isArray(specifications.materials)
          ? specifications.materials
          : specifications.materials.split(',').map((m: string) => m.trim()).filter((m: string) => m),
        carbonFootprintPerUnit: specifications.carbonFootprintPerUnit
      },
      manufacturerAddress: manufacturerAddress.toLowerCase(),
      isRawMaterial,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await templatesCollection.insertOne(template);

    if (result.insertedId) {
      // Update company's productTemplates array
      await companiesCollection.updateOne(
        { walletAddress: manufacturerAddress.toLowerCase() },
        {
          $addToSet: { productTemplates: result.insertedId.toString() },
          $set: { updatedAt: new Date() }
        }
      );

      return NextResponse.json(
        {
          message: 'Product template created successfully',
          templateId: result.insertedId.toString()
        },
        { status: 201 }
      );
    } else {
      return NextResponse.json(
        { error: 'Failed to create product template' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error creating product template:', error);
    return NextResponse.json(
      { error: 'Failed to create product template' },
      { status: 500 }
    );
  }
}
