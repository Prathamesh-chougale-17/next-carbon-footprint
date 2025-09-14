import { NextRequest, NextResponse } from 'next/server';
import client from '@/lib/mongodb';
import { ProductBatch, ProductTemplate } from '@/lib/models';
import { ObjectId } from 'mongodb';

// GET /api/metadata/[tokenId] - Get ERC-1155 metadata for a token
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  try {
    const { tokenId } = await params;

    await client.connect();
    const db = client.db('carbon-footprint');
    const batchesCollection = db.collection<ProductBatch>('productBatches');
    const templatesCollection = db.collection<ProductTemplate>('productTemplates');

    // Find batch by tokenId or batchNumber
    let batch;
    if (tokenId === 'placeholder') {
      return NextResponse.json(
        { error: 'Token not yet minted' },
        { status: 404 }
      );
    }

    // Try to find by tokenId first
    batch = await batchesCollection.findOne({ tokenId: parseInt(tokenId) });

    // If not found by tokenId, try by batchNumber
    if (!batch) {
      batch = await batchesCollection.findOne({ batchNumber: tokenId });
    }

    if (!batch) {
      return NextResponse.json(
        { error: 'Token not found' },
        { status: 404 }
      );
    }

    // Get template information
    const template = await templatesCollection.findOne({ _id: new ObjectId(batch.templateId) });

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Create ERC-1155 metadata
    const metadata = {
      name: `${template.templateName} - Batch #${batch.batchNumber}`,
      description: `${template.description}\n\nBatch Number: ${batch.batchNumber}\nQuantity: ${batch.quantity} units\nCarbon Footprint: ${(batch.carbonFootprint / 1000).toFixed(3)} tons CO₂`,
      image: template.imageUrl || `${request.nextUrl.origin}/api/placeholder/400/400`,
      external_url: `${request.nextUrl.origin}/dashboard/batches`,
      attributes: [
        {
          trait_type: "Batch Number",
          value: batch.batchNumber
        },
        {
          trait_type: "Template Name",
          value: template.templateName
        },
        {
          trait_type: "Category",
          value: template.category
        },
        {
          trait_type: "Quantity",
          value: batch.quantity
        },
        {
          trait_type: "Carbon Footprint",
          value: `${(batch.carbonFootprint / 1000).toFixed(3)} tons CO₂`
        },
        {
          trait_type: "Production Date",
          value: new Date(batch.productionDate).toISOString().split('T')[0]
        },
        {
          trait_type: "Is Raw Material",
          value: template.isRawMaterial
        }
      ]
    };

    return NextResponse.json(metadata);

  } catch (error) {
    console.error('Error fetching metadata:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metadata' },
      { status: 500 }
    );
  }
}
