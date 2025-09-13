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
    const { userAddress, tokenId } = await request.json();

    if (!userAddress || !tokenId) {
      return NextResponse.json(
        { error: 'Missing userAddress or tokenId' },
        { status: 400 }
      );
    }

    const balance = await publicClient.readContract({
      address: CONTRACT_CONFIG.ADDRESS as `0x${string}`,
      abi: CONTRACT_CONFIG.ABI,
      functionName: 'balanceOf',
      args: [userAddress as `0x${string}`, BigInt(tokenId)],
    });

    return NextResponse.json({
      balance: Number(balance),
    });
  } catch (error) {
    console.error('Error getting token balance:', error);
    return NextResponse.json(
      { error: 'Failed to get token balance' },
      { status: 500 }
    );
  }
}
