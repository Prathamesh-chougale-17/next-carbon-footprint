import { NextRequest, NextResponse } from "next/server";
import client from "@/lib/mongodb";
import { Partner } from "@/lib/models";

// GET /api/partners - Get all partners for a specific company address
export async function GET(request: NextRequest) {
  try {
    await client.connect();
    const db = client.db('carbon-footprint');
    const collection = db.collection<Partner>('partners');

    const { searchParams } = new URL(request.url);
    const selfAddress = searchParams.get("selfAddress");

    if (!selfAddress) {
      return NextResponse.json(
        { error: "Self address is required" },
        { status: 400 }
      );
    }

    // Get all partners where selfAddress matches
    const partners = await collection.find({
      selfAddress: selfAddress.toLowerCase(),
      status: "active"
    }).sort({ createdAt: -1 }).toArray();

    return NextResponse.json(partners);
  } catch (error) {
    console.error("Error fetching partners:", error);
    return NextResponse.json(
      { error: "Failed to fetch partners" },
      { status: 500 }
    );
  }
}

// POST /api/partners - Create a new partner relationship (bidirectional)
export async function POST(request: NextRequest) {
  try {
    await client.connect();
    const db = client.db('carbon-footprint');
    const collection = db.collection<Partner>('partners');

    const body = await request.json();
    const {
      selfAddress,
      companyAddress,
      relationship,
      companyName
    } = body;

    // Validation
    if (!selfAddress || !companyAddress || !relationship) {
      return NextResponse.json(
        { error: "Self address, company address, and relationship are required" },
        { status: 400 }
      );
    }

    if (selfAddress.toLowerCase() === companyAddress.toLowerCase()) {
      return NextResponse.json(
        { error: "Cannot add yourself as a partner" },
        { status: 400 }
      );
    }

    if (!["supplier", "customer"].includes(relationship)) {
      return NextResponse.json(
        { error: "Relationship must be either 'supplier' or 'customer'" },
        { status: 400 }
      );
    }

    // Check if relationship already exists
    const existingPartner = await collection.findOne({
      selfAddress: selfAddress.toLowerCase(),
      companyAddress: companyAddress.toLowerCase()
    });

    if (existingPartner) {
      return NextResponse.json(
        { error: "Partner relationship already exists" },
        { status: 409 }
      );
    }

    // Fetch partner's company name from companies collection
    const companiesCollection = db.collection('companies');
    const partnerCompany = await companiesCollection.findOne({
      walletAddress: companyAddress.toLowerCase()
    });

    // Also fetch your company name for the reverse entry
    const yourCompany = await companiesCollection.findOne({
      walletAddress: selfAddress.toLowerCase()
    });

    // Create two entries for bidirectional relationship
    const now = new Date();

    // Entry 1: From your perspective
    const partner1: Omit<Partner, '_id'> = {
      selfAddress: selfAddress.toLowerCase(),
      companyAddress: companyAddress.toLowerCase(),
      relationship: relationship,
      companyName: companyName || partnerCompany?.companyName,
      status: "active",
      createdAt: now,
      updatedAt: now
    };

    // Entry 2: From partner's perspective (reverse relationship)
    const partner2: Omit<Partner, '_id'> = {
      selfAddress: companyAddress.toLowerCase(),
      companyAddress: selfAddress.toLowerCase(),
      relationship: relationship === "supplier" ? "customer" : "supplier",
      companyName: yourCompany?.companyName || undefined, // Partner sees YOUR company name
      status: "active",
      createdAt: now,
      updatedAt: now
    };

    // Insert both entries
    const result = await collection.insertMany([partner1, partner2]);

    return NextResponse.json({
      message: "Partner relationship created successfully",
      partner: partner1
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating partner:", error);
    return NextResponse.json(
      { error: "Failed to create partner relationship" },
      { status: 500 }
    );
  }
}
