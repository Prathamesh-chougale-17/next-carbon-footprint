import { NextRequest, NextResponse } from "next/server";
import client from "@/lib/mongodb";
import { TokenTransfer } from "@/lib/models";

// GET /api/transfers - Get transfer records for a specific address
export async function GET(request: NextRequest) {
  try {
    await client.connect();
    const db = client.db('carbon-footprint');
    const collection = db.collection<TokenTransfer>('tokenTransfers');

    const { searchParams } = new URL(request.url);
    const fromAddress = searchParams.get("fromAddress");
    const toAddress = searchParams.get("toAddress");
    const address = searchParams.get("address"); // Either from or to

    let query: any = {};

    if (address) {
      // Get transfers where the address is either sender or receiver
      query = {
        $or: [
          { fromAddress: address.toLowerCase() },
          { toAddress: address.toLowerCase() }
        ]
      };
    } else if (fromAddress || toAddress) {
      if (fromAddress) query.fromAddress = fromAddress.toLowerCase();
      if (toAddress) query.toAddress = toAddress.toLowerCase();
    }

    const transfers = await collection.find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(transfers);
  } catch (error) {
    console.error("Error fetching transfers:", error);
    return NextResponse.json(
      { error: "Failed to fetch transfers" },
      { status: 500 }
    );
  }
}

// POST /api/transfers - Create a new transfer record
export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/transfers - Starting transfer record creation');
    await client.connect();
    const db = client.db('carbon-footprint');
    const collection = db.collection<TokenTransfer>('tokenTransfers');

    const body = await request.json();
    console.log('Transfer data received:', body);
    const {
      fromAddress,
      toAddress,
      tokenId,
      quantity,
      reason,
      txHash,
      blockNumber,
      gasUsed,
      status = 'pending'
    } = body;

    // Validation
    if (!fromAddress || !toAddress || !tokenId || !quantity || !txHash) {
      return NextResponse.json(
        { error: "Missing required fields: fromAddress, toAddress, tokenId, quantity, txHash" },
        { status: 400 }
      );
    }

    const now = new Date();

    const transfer: Omit<TokenTransfer, '_id'> = {
      fromAddress: fromAddress.toLowerCase(),
      toAddress: toAddress.toLowerCase(),
      tokenId: parseInt(tokenId),
      quantity: parseInt(quantity),
      reason,
      txHash,
      blockNumber: blockNumber ? parseInt(blockNumber) : undefined,
      gasUsed,
      status,
      createdAt: now,
      updatedAt: now
    };

    console.log('Inserting transfer record:', transfer);
    const result = await collection.insertOne(transfer);
    console.log('Insert result:', result);

    if (result.insertedId) {
      console.log('Transfer record created successfully with ID:', result.insertedId);
      return NextResponse.json({
        message: "Transfer record created successfully",
        transfer: { ...transfer, _id: result.insertedId }
      }, { status: 201 });
    } else {
      console.error('Failed to create transfer record - no inserted ID');
      return NextResponse.json(
        { error: "Failed to create transfer record" },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Error creating transfer:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: "Failed to create transfer record", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
