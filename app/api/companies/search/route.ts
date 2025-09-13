import { NextRequest, NextResponse } from "next/server";
import client from "@/lib/mongodb";
import { Company } from "@/lib/models";

// GET /api/companies/search - Search companies by name
export async function GET(request: NextRequest) {
  try {
    await client.connect();
    const db = client.db('carbon-footprint');
    const collection = db.collection<Company>('companies');

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!query || query.trim().length < 2) {
      return NextResponse.json([]);
    }

    // Search companies by name (case-insensitive)
    const companies = await collection.find(
      {
        companyName: { $regex: query, $options: "i" }
      },
      {
        projection: {
          _id: 1,
          companyName: 1,
          walletAddress: 1,
          companyAddress: 1,
          companyType: 1,
          companyEmail: 1
        }
      }
    )
    .limit(limit)
    .toArray();

    return NextResponse.json(companies);
  } catch (error) {
    console.error("Error searching companies:", error);
    return NextResponse.json(
      { error: "Failed to search companies" },
      { status: 500 }
    );
  }
}
