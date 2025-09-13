import { NextRequest, NextResponse } from 'next/server';
import client from '@/lib/mongodb';
import { ProductBatch, ProductTemplate } from '@/lib/models';
import { ObjectId } from 'mongodb';

// GET /api/product-batches/[id] - Get a specific batch
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    await client.connect();
    const db = client.db('carbon-footprint');
    const collection = db.collection<ProductBatch>('productBatches');

    const batch = await collection.findOne({ _id: new ObjectId(id) });

    if (!batch) {
      return NextResponse.json(
        { error: 'Product batch not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(batch);
  } catch (error) {
    console.error('Error fetching product batch:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product batch' },
      { status: 500 }
    );
  }
}

// PUT /api/product-batches/[id] - Update a specific batch
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const {
      batchNumber,
      quantity,
      productionDate,
      expiryDate,
      carbonFootprint,
      plantId
    } = body;

    await client.connect();
    const db = client.db('carbon-footprint');
    const batchesCollection = db.collection<ProductBatch>('productBatches');
    const templatesCollection = db.collection<ProductTemplate>('productTemplates');

    // Check if batch exists
    const existingBatch = await batchesCollection.findOne({ _id: new ObjectId(id) });
    if (!existingBatch) {
      return NextResponse.json(
        { error: 'Product batch not found' },
        { status: 404 }
      );
    }

    // Check for duplicate batch number if batchNumber is being changed
    if (batchNumber && batchNumber !== existingBatch.batchNumber) {
      const duplicateBatch = await batchesCollection.findOne({
        batchNumber,
        manufacturerAddress: existingBatch.manufacturerAddress,
        _id: { $ne: new ObjectId(id) }
      });

      if (duplicateBatch) {
        return NextResponse.json(
          { error: 'Batch with this number already exists for this manufacturer' },
          { status: 409 }
        );
      }
    }

    // If template or quantity changed, recalculate carbon footprint
    let calculatedCarbonFootprint = carbonFootprint;
    if (quantity !== undefined || carbonFootprint === undefined) {
      const template = await templatesCollection.findOne({ _id: new ObjectId(existingBatch.templateId) });
      if (template) {
        calculatedCarbonFootprint = template.specifications.carbonFootprintPerUnit * (quantity || existingBatch.quantity);
      }
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date()
    };

    if (batchNumber !== undefined) updateData.batchNumber = batchNumber;
    if (quantity !== undefined) updateData.quantity = parseInt(quantity);
    if (productionDate !== undefined) updateData.productionDate = new Date(productionDate);
    if (expiryDate !== undefined) updateData.expiryDate = expiryDate ? new Date(expiryDate) : null;
    if (calculatedCarbonFootprint !== undefined) updateData.carbonFootprint = calculatedCarbonFootprint;
    if (plantId !== undefined) updateData.plantId = new ObjectId(plantId);

    const result = await batchesCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.modifiedCount > 0) {
      return NextResponse.json(
        { message: 'Product batch updated successfully' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: 'No changes made to the batch' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error updating product batch:', error);
    return NextResponse.json(
      { error: 'Failed to update product batch' },
      { status: 500 }
    );
  }
}

// DELETE /api/product-batches/[id] - Delete a specific batch
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    await client.connect();
    const db = client.db('carbon-footprint');
    const collection = db.collection<ProductBatch>('productBatches');

    // Check if batch exists
    const batch = await collection.findOne({ _id: new ObjectId(id) });
    if (!batch) {
      return NextResponse.json(
        { error: 'Product batch not found' },
        { status: 404 }
      );
    }

    // Check if batch has tokens minted (should not be deleted if tokens exist)
    if (batch.tokenId) {
      return NextResponse.json(
        { error: 'Cannot delete batch with minted tokens. Tokens must be burned first.' },
        { status: 400 }
      );
    }

    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount > 0) {
      return NextResponse.json(
        { message: 'Product batch deleted successfully' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: 'Failed to delete product batch' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error deleting product batch:', error);
    return NextResponse.json(
      { error: 'Failed to delete product batch' },
      { status: 500 }
    );
  }
}
