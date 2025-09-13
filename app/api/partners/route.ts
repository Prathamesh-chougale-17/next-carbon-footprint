import { NextRequest, NextResponse } from 'next/server';
import client from '@/lib/mongodb';
import { Partner, PartnerRelationship, Company } from '@/lib/models';

// GET /api/partners - Search for potential partners or get existing partners
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyAddress = searchParams.get('companyAddress');
    const searchTerm = searchParams.get('search');
    const relationshipType = searchParams.get('relationshipType'); // 'supplier' or 'customer'
    const status = searchParams.get('status');

    await client.connect();
    const db = client.db('carbon-footprint');

    if (searchTerm) {
      // Search for potential partners (companies that can be added as partners)
      const companiesCollection = db.collection<Company>('companies');
      const partnersCollection = db.collection<Partner>('partners');

      // Find companies matching the search term
      const companies = await companiesCollection
        .find({
          companyAddress: { $ne: companyAddress }, // Exclude current user
          $or: [
            { companyName: { $regex: searchTerm, $options: 'i' } },
            { companyAddress: { $regex: searchTerm, $options: 'i' } }
          ]
        })
        .limit(10)
        .toArray();

      // Convert companies to partner format for display
      const potentialPartners = companies.map(company => ({
        companyAddress: company.companyAddress,
        companyName: company.companyName,
        businessType: company.businessType || 'manufacturer',
        description: company.description,
        isExistingPartner: false
      }));

      return NextResponse.json(potentialPartners);
    }

    // Get existing partners for a company
    const relationshipsCollection = db.collection<PartnerRelationship>('partnerRelationships');
    let query: any = { companyAddress };

    if (relationshipType) {
      query.relationshipType = relationshipType;
    }

    if (status) {
      query.status = status;
    }

    const relationships = await relationshipsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    // Get partner details
    const companiesCollection = db.collection<Company>('companies');
    const partnersWithDetails = await Promise.all(
      relationships.map(async (relationship) => {
        const company = await companiesCollection.findOne({
          companyAddress: relationship.partnerAddress
        });

        return {
          ...relationship,
          partnerDetails: company ? {
            companyName: company.companyName,
            businessType: company.businessType,
            description: company.description
          } : null
        };
      })
    );

    return NextResponse.json(partnersWithDetails);
  } catch (error) {
    console.error('Error fetching partners:', error);
    return NextResponse.json(
      { error: 'Failed to fetch partners' },
      { status: 500 }
    );
  }
}

// POST /api/partners - Add a new partner relationship
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      companyAddress,
      partnerAddress,
      relationshipType,
      notes
    } = body;

    // Validate required fields
    if (!companyAddress || !partnerAddress || !relationshipType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate relationship type
    if (!['supplier', 'customer'].includes(relationshipType)) {
      return NextResponse.json(
        { error: 'Invalid relationship type' },
        { status: 400 }
      );
    }

    // Prevent self-partnership
    if (companyAddress === partnerAddress) {
      return NextResponse.json(
        { error: 'Cannot add yourself as a partner' },
        { status: 400 }
      );
    }

    await client.connect();
    const db = client.db('carbon-footprint');
    const relationshipsCollection = db.collection<PartnerRelationship>('partnerRelationships');
    const companiesCollection = db.collection<Company>('companies');

    // Check if partner company exists
    const partnerCompany = await companiesCollection.findOne({
      companyAddress: partnerAddress
    });

    if (!partnerCompany) {
      return NextResponse.json(
        { error: 'Partner company not found' },
        { status: 404 }
      );
    }

    // Check if relationship already exists
    const existingRelationship = await relationshipsCollection.findOne({
      companyAddress,
      partnerAddress
    });

    if (existingRelationship) {
      return NextResponse.json(
        { error: 'Partnership already exists' },
        { status: 409 }
      );
    }

    // Create bidirectional relationships
    const now = new Date();

    // Relationship from company to partner
    const relationship1: Omit<PartnerRelationship, '_id'> = {
      companyAddress,
      partnerAddress,
      relationshipType,
      status: 'active',
      notes,
      establishedDate: now,
      createdAt: now,
      updatedAt: now
    };

    // Inverse relationship from partner to company
    const inverseRelationshipType = relationshipType === 'supplier' ? 'customer' : 'supplier';
    const relationship2: Omit<PartnerRelationship, '_id'> = {
      companyAddress: partnerAddress,
      partnerAddress: companyAddress,
      relationshipType: inverseRelationshipType,
      status: 'active',
      notes: `Partner relationship established with ${partnerCompany.companyName}`,
      establishedDate: now,
      createdAt: now,
      updatedAt: now
    };

    // Insert both relationships
    const result1 = await relationshipsCollection.insertOne(relationship1);
    const result2 = await relationshipsCollection.insertOne(relationship2);

    if (result1.insertedId && result2.insertedId) {
      return NextResponse.json(
        {
          message: 'Partnership established successfully',
          relationshipId: result1.insertedId.toString()
        },
        { status: 201 }
      );
    } else {
      return NextResponse.json(
        { error: 'Failed to establish partnership' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error creating partnership:', error);
    return NextResponse.json(
      { error: 'Failed to create partnership' },
      { status: 500 }
    );
  }
}
