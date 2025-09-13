import { NextRequest, NextResponse } from 'next/server';
import client from '@/lib/mongodb';
import { ProductTemplate } from '@/lib/models';
import { ObjectId } from 'mongodb';

// GET /api/product-templates/[id] - Get specific product template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid template ID' },
        { status: 400 }
      );
    }

    await client.connect();
    const db = client.db('carbon-footprint');
    const collection = db.collection<ProductTemplate>('productTemplates');

    const template = await collection.findOne({ _id: new ObjectId(id) });

    if (!template) {
      return NextResponse.json(
        { error: 'Product template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error fetching product template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product template' },
      { status: 500 }
    );
  }
}

// PUT /api/product-templates/[id] - Update product template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid template ID' },
        { status: 400 }
      );
    }

    await client.connect();
    const db = client.db('carbon-footprint');
    const collection = db.collection<ProductTemplate>('productTemplates');

    // Check if template exists
    const existingTemplate = await collection.findOne({ _id: new ObjectId(id) });
    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Product template not found' },
        { status: 404 }
      );
    }

    // Check for duplicate template name if templateName is being changed
    if (body.templateName && body.templateName !== existingTemplate.templateName) {
      const duplicateTemplate = await collection.findOne({
        templateName: body.templateName,
        manufacturerAddress: (body.manufacturerAddress || existingTemplate.manufacturerAddress).toLowerCase(),
        _id: { $ne: new ObjectId(id) }
      });

      if (duplicateTemplate) {
        return NextResponse.json(
          { error: 'Template with this name already exists for this manufacturer' },
          { status: 409 }
        );
      }
    }

    // Prepare update data
    const updateData: Partial<ProductTemplate> = {
      ...body,
      updatedAt: new Date()
    };

    // Normalize manufacturerAddress to lowercase if provided
    if (body.manufacturerAddress) {
      updateData.manufacturerAddress = body.manufacturerAddress.toLowerCase();
    }

    // If specifications are being updated, ensure proper structure
    if (body.specifications) {
      updateData.specifications = {
        weight: body.specifications.weight,
        dimensions: body.specifications.dimensions || undefined,
        materials: Array.isArray(body.specifications.materials)
          ? body.specifications.materials
          : body.specifications.materials.split(',').map((m: string) => m.trim()).filter((m: string) => m),
        carbonFootprintPerUnit: body.specifications.carbonFootprintPerUnit
      };
    }

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Product template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Product template updated successfully' });
  } catch (error) {
    console.error('Error updating product template:', error);
    return NextResponse.json(
      { error: 'Failed to update product template' },
      { status: 500 }
    );
  }
}

// DELETE /api/product-templates/[id] - Delete product template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid template ID' },
        { status: 400 }
      );
    }

    await client.connect();
    const db = client.db('carbon-footprint');
    const templatesCollection = db.collection<ProductTemplate>('productTemplates');
    const companiesCollection = db.collection('companies');

    // Check if template exists
    const template = await templatesCollection.findOne({ _id: new ObjectId(id) });
    if (!template) {
      return NextResponse.json(
        { error: 'Product template not found' },
        { status: 404 }
      );
    }

    // Delete the template
    const result = await templatesCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to delete product template' },
        { status: 500 }
      );
    }

    // Remove template ID from company's productTemplates array
    await companiesCollection.updateOne(
      { walletAddress: template.manufacturerAddress.toLowerCase() },
      {
        $pull: { productTemplates: id as any },
        $set: { updatedAt: new Date() }
      }
    );

    return NextResponse.json({ message: 'Product template deleted successfully' });
  } catch (error) {
    console.error('Error deleting product template:', error);
    return NextResponse.json(
      { error: 'Failed to delete product template' },
      { status: 500 }
    );
  }
}
