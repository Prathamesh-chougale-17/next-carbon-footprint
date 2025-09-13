import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { avalancheFuji } from 'viem/chains';
import { CONTRACT_CONFIG } from '@/lib/contract';

const publicClient = createPublicClient({
  chain: avalancheFuji,
  transport: http(),
});

export async function POST(request: NextRequest) {
  try {
    const { tokenId } = await request.json();

    if (!tokenId) {
      return NextResponse.json(
        { error: 'Missing tokenId' },
        { status: 400 }
      );
    }

    const batchInfo = await publicClient.readContract({
      address: CONTRACT_CONFIG.ADDRESS as `0x${string}`,
      abi: CONTRACT_CONFIG.ABI,
      functionName: 'getBatchInfo',
      args: [BigInt(tokenId)],
    });

    return NextResponse.json({
      batchInfo: {
        batchNumber: Number(batchInfo.batchNumber),
        manufacturer: batchInfo.manufacturer,
        templateId: batchInfo.templateId,
        quantity: Number(batchInfo.quantity),
        productionDate: Number(batchInfo.productionDate),
        expiryDate: Number(batchInfo.expiryDate),
        carbonFootprint: Number(batchInfo.carbonFootprint),
        plantId: batchInfo.plantId,
        metadataURI: batchInfo.metadataURI,
        isActive: batchInfo.isActive,
      },
    });
  } catch (error) {
    console.error('Error getting batch info:', error);
    return NextResponse.json(
      { error: 'Failed to get batch info' },
      { status: 500 }
    );
  }
}
