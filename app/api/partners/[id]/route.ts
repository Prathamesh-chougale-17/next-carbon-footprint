import { NextRequest, NextResponse } from "next/server";
import client from "@/lib/mongodb";
import { Partner } from "@/lib/models";
import { ObjectId } from "mongodb";

// GET /api/partners/[id] - Get a specific partner
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await client.connect();
    const db = client.db('carbon-footprint');
    const collection = db.collection<Partner>('partners');
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid partner ID" }, { status: 400 });
    }

    const partner = await collection.findOne({ _id: new ObjectId(id) });
    if (!partner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    return NextResponse.json(partner);
  } catch (error) {
    console.error("Error fetching partner:", error);
    return NextResponse.json(
      { error: "Failed to fetch partner" },
      { status: 500 }
    );
  }
}

// PUT /api/partners/[id] - Update partner information
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await client.connect();
    const db = client.db('carbon-footprint');
    const collection = db.collection<Partner>('partners');
    const { id } = await params;
    const body = await request.json();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid partner ID" }, { status: 400 });
    }


    const { companyName, status } = body;

    // Only allow updating specific fields
    const updateData: any = {
      updatedAt: new Date()
    };

    if (companyName !== undefined) updateData.companyName = companyName;
    if (status !== undefined) updateData.status = status;

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    // If status is being updated, update the corresponding partner entry too
    if (status !== undefined && result) {
      await collection.updateOne(
        {
          selfAddress: result.companyAddress,
          companyAddress: result.selfAddress
        },
        { $set: { status, updatedAt: new Date() } }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating partner:", error);
    return NextResponse.json(
      { error: "Failed to update partner" },
      { status: 500 }
    );
  }
}

// DELETE /api/partners/[id] - Delete partner relationship (both sides)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await client.connect();
    const db = client.db('carbon-footprint');
    const collection = db.collection<Partner>('partners');
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid partner ID" }, { status: 400 });
    }

    const partner = await collection.findOne({ _id: new ObjectId(id) });
    if (!partner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    // Delete both sides of the relationship
    await Promise.all([
      collection.deleteOne({ _id: new ObjectId(id) }),
      collection.deleteOne({
        selfAddress: partner.companyAddress,
        companyAddress: partner.selfAddress
      })
    ]);

    return NextResponse.json({ message: "Partner relationship deleted successfully" });
  } catch (error) {
    console.error("Error deleting partner:", error);
    return NextResponse.json(
      { error: "Failed to delete partner" },
      { status: 500 }
    );
  }
}
