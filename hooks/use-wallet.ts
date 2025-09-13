"use client";

import { useAccount } from "wagmi";

export function useWallet() {
  const { address, isConnected, isConnecting } = useAccount();

  return {
    address: address?.toLowerCase() || null,
    isConnected,
    isConnecting,
    formattedAddress: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null,
  };
}
