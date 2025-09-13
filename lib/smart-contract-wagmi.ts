"use client";

import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useChainId,
  useSwitchChain,
} from "wagmi";
import { CONTRACT_CONFIG, type BatchMintParams } from "./contract";
import { useEffect, useState } from "react";

// Re-export BatchMintParams for use in other modules
export type { BatchMintParams };

// Wagmi-based smart contract hooks and utilities
export function useSmartContract() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const isCorrectNetwork = chainId === CONTRACT_CONFIG.NETWORK.chainId;

  const switchToCorrectNetwork = async () => {
    if (!isCorrectNetwork) {
      await switchChain({ chainId: CONTRACT_CONFIG.NETWORK.chainId });
    }
  };

  return {
    address,
    isConnected,
    isInitialized: isConnected && !!address,
    chainId,
    isCorrectNetwork,
    switchToCorrectNetwork,
  };
}

// Hook for minting batch tokens
export function useMintBatch() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    data: receipt,
  } = useWaitForTransactionReceipt({
    hash,
  });

  const mintBatch = async (params: BatchMintParams) => {
    if (!params.batchNumber || params.batchNumber <= 0) {
      throw new Error("Invalid batch number. Must be a positive number.");
    }

    if (!params.quantity || params.quantity <= 0) {
      throw new Error("Invalid quantity. Must be a positive number.");
    }

    if (!params.templateId || params.templateId.trim() === "") {
      throw new Error("Template ID is required.");
    }

    if (!params.plantId || params.plantId.trim() === "") {
      throw new Error("Plant ID is required.");
    }

    if (!params.carbonFootprint || params.carbonFootprint <= 0) {
      throw new Error("Carbon footprint must be a positive number.");
    }

    if (!Number.isInteger(params.carbonFootprint)) {
      throw new Error("Carbon footprint must be an integer value (in kg).");
    }

    const metadataURI = `https://api.carbontrack.com/metadata/batch/${params.batchNumber}`;

    try {
      writeContract({
            address: CONTRACT_CONFIG.ADDRESS as `0x${string}`,
            abi: CONTRACT_CONFIG.ABI,
            functionName: "mintBatch",
            args: [
                BigInt(params.batchNumber),
                params.templateId,
                BigInt(params.quantity),
                BigInt(params.productionDate),
                BigInt(params.expiryDate),
                BigInt(params.carbonFootprint),
                params.plantId,
                metadataURI,
                "0x" as `0x${string}`, // Empty data
            ],
            gas: BigInt(500000), // Set explicit gas limit to avoid estimation issues
        });
    } catch (error: unknown) {
      // Provide user-friendly error messages
      const errorWithCode = error as { code?: string; message?: string };
      if (errorWithCode.code === "INSUFFICIENT_FUNDS") {
        throw new Error(
          "Insufficient funds for gas. Please add AVAX to your wallet.",
        );
      } else if (errorWithCode.code === "USER_REJECTED") {
        throw new Error("Transaction was rejected by user.");
      } else if (errorWithCode.message?.includes("Batch already exists")) {
        throw new Error(
          "A batch with this number already exists for your address.",
        );
      } else if (
        errorWithCode.message?.includes("Quantity must be greater than 0")
      ) {
        throw new Error("Batch quantity must be greater than 0.");
      } else if (
        errorWithCode.message?.includes("transaction underpriced") ||
        errorWithCode.message?.includes("gas fee cap")
      ) {
        throw new Error(
          "Gas fee too low. Please try again - the network may be congested.",
        );
      } else if (errorWithCode.message?.includes("UNKNOWN_ERROR")) {
        throw new Error(
          "Network error. Please check your connection and try again.",
        );
      } else if (errorWithCode.message?.includes("missing revert data") ||
        errorWithCode.message?.includes("CALL_EXCEPTION")
      ) {
        throw new Error(
          "Contract call failed. Please check your parameters and try again.",
        );
      } else if (errorWithCode.message?.includes("execution reverted")) {
        throw new Error(
          "Transaction failed. The contract rejected the transaction. Please check your parameters.",
        );
      } else {
        throw new Error(
          `Failed to mint tokens: ${errorWithCode.message || "Unknown error"}`,
        );
      }
    }
  };

  // Extract token ID from receipt logs when transaction is confirmed
  const getTokenIdFromReceipt = () => {
    if (!receipt || !receipt.logs) return null;

    try {
      // Find the BatchMinted event in the logs
      const batchMintedEvent = receipt.logs.find((log: unknown) => {
        try {
          // Parse the log to check if it's a BatchMinted event
          // This is a simplified check - in a real implementation you'd decode the event properly
          const logWithTopics = log as { topics?: unknown[] };
          return logWithTopics.topics && logWithTopics.topics.length > 0;
        } catch {
          return false;
        }
      });

      if (batchMintedEvent) {
        // Extract token ID from the event data
        // This is a simplified extraction - you'd need proper event decoding
        const eventWithTopics = batchMintedEvent as { topics?: string[] };
        const tokenIdHex = eventWithTopics.topics?.[1];
        if (tokenIdHex) {
          return parseInt(tokenIdHex, 16);
        }
      }
    } catch (error) {
      console.warn("Failed to extract token ID from receipt:", error);
    }

    return null;
  };

  const tokenId = isConfirmed ? getTokenIdFromReceipt() : null;

  return {
    mintBatch,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    isLoading: isPending || isConfirming,
    receipt,
    tokenId,
  };
}

// Hook for getting batch information
export function useBatchInfo(tokenId: number) {
  const { data, error, isLoading, refetch } = useReadContract({
    address: CONTRACT_CONFIG.ADDRESS as `0x${string}`,
    abi: CONTRACT_CONFIG.ABI,
    functionName: "getBatchInfo",
    args: [BigInt(tokenId)],
    query: {
      enabled: tokenId > 0,
    },
  });

  return {
    batchInfo: data
      ? {
          batchNumber: Number(data.batchNumber),
          manufacturer: data.manufacturer,
          templateId: data.templateId,
          quantity: Number(data.quantity),
          productionDate: Number(data.productionDate),
          expiryDate: Number(data.expiryDate),
          carbonFootprint: Number(data.carbonFootprint),
          plantId: data.plantId,
          metadataURI: data.metadataURI,
          isActive: data.isActive,
        }
      : null,
    error,
    isLoading,
    refetch,
  };
}

// Hook for getting current token ID
export function useCurrentTokenId() {
  const { data, error, isLoading, refetch } = useReadContract({
    address: CONTRACT_CONFIG.ADDRESS as `0x${string}`,
    abi: CONTRACT_CONFIG.ABI,
    functionName: "getCurrentTokenId",
  });

  return {
    currentTokenId: data ? Number(data) : 0,
    error,
    isLoading,
    refetch,
  };
}

// Hook for checking if batch exists
export function useBatchExists(
  batchNumber: number,
  manufacturerAddress: string,
) {
  const { data, error, isLoading, refetch } = useReadContract({
    address: CONTRACT_CONFIG.ADDRESS as `0x${string}`,
    abi: CONTRACT_CONFIG.ABI,
    functionName: "getTokenIdByBatch",
    args: [BigInt(batchNumber), manufacturerAddress as `0x${string}`],
    query: {
      enabled: batchNumber > 0 && !!manufacturerAddress,
    },
  });

  return {
    exists: data ? Number(data) > 0 : false,
    tokenId: data ? Number(data) : 0,
    error,
    isLoading,
    refetch,
  };
}

// Hook for getting token balance
export function useTokenBalance(userAddress: string, tokenId: number) {
  const { data, error, isLoading, refetch } = useReadContract({
    address: CONTRACT_CONFIG.ADDRESS as `0x${string}`,
    abi: CONTRACT_CONFIG.ABI,
    functionName: "balanceOf",
    args: [userAddress as `0x${string}`, BigInt(tokenId)],
    query: {
      enabled: !!userAddress && tokenId > 0,
    },
  });

  return {
    balance: data ? Number(data) : 0,
    error,
    isLoading,
    refetch,
  };
}

// Custom hook for getting all user token balances
export function useAllUserTokenBalances(userAddress: string) {
  const { currentTokenId, isLoading: isLoadingTokenId } = useCurrentTokenId();
  const [balances, setBalances] = useState<
    Array<{
      tokenId: number;
      balance: number;
      batchInfo: unknown;
    }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userAddress || !currentTokenId || isLoadingTokenId) return;

    const fetchBalances = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const tokenBalances = [];

        for (let tokenId = 1; tokenId < currentTokenId; tokenId++) {
          try {
            // Check balance for this token
            const balanceResponse = await fetch("/api/contract/balance", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userAddress, tokenId }),
            });

            if (balanceResponse.ok) {
              const { balance } = await balanceResponse.json();
              if (balance > 0) {
                // Get batch info for this token
                const batchResponse = await fetch("/api/contract/batch-info", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ tokenId }),
                });

                if (batchResponse.ok) {
                  const { batchInfo } = await batchResponse.json();
                  tokenBalances.push({
                    tokenId,
                    balance,
                    batchInfo,
                  });
                }
              }
            }
          } catch (tokenError) {
            console.warn(`Error checking token ${tokenId}:`, tokenError);
          }
        }

        setBalances(tokenBalances);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalances();
  }, [userAddress, currentTokenId, isLoadingTokenId]);

  return {
    balances,
    isLoading,
    error,
  };
}

// Hook for transferring tokens
export function useTransferTokens() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const transferTokens = async (
    to: string,
    tokenId: number,
    quantity: number,
    reason: string = "Transfer to partner",
  ) => {
    if (!to || to === "0x0000000000000000000000000000000000000000") {
      throw new Error("Invalid recipient address");
    }

    if (!quantity || quantity <= 0) {
      throw new Error("Quantity must be greater than 0");
    }

    if (!tokenId || tokenId <= 0) {
      throw new Error("Invalid token ID");
    }

    try {
      await writeContract({
        address: CONTRACT_CONFIG.ADDRESS as `0x${string}`,
        abi: CONTRACT_CONFIG.ABI,
        functionName: "transferToPartner",
        args: [
          to as `0x${string}`,
          BigInt(tokenId),
          BigInt(quantity),
          reason,
          "", // metadata
        ],
        gas: BigInt(300000), // Set explicit gas limit for transfers
      });
    } catch (error: unknown) {
      // Provide user-friendly error messages
      const errorWithCode = error as { code?: string; message?: string };
      if (errorWithCode.code === "INSUFFICIENT_FUNDS") {
        throw new Error(
          "Insufficient funds for gas. Please add AVAX to your wallet.",
        );
      } else if (errorWithCode.code === "USER_REJECTED") {
        throw new Error("Transfer was rejected by user.");
      } else if (errorWithCode.message?.includes("Insufficient balance")) {
        throw new Error(errorWithCode.message);
      } else if (
        errorWithCode.message?.includes("transaction underpriced") ||
        errorWithCode.message?.includes("gas fee cap")
      ) {
        throw new Error(
          "Gas fee too low. Please try again - the network may be congested.",
        );
      } else if (errorWithCode.message?.includes("UNKNOWN_ERROR")) {
        throw new Error(
          "Network error. Please check your connection and try again.",
        );
      } else {
        throw new Error(
          `Failed to transfer tokens: ${errorWithCode.message || "Unknown error"}`,
        );
      }
    }
  };

  return {
    transferTokens,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    isLoading: isPending || isConfirming,
  };
}

// Hook for getting all minted tokens (for debugging)
export function useAllMintedTokens() {
  const { currentTokenId, isLoading: isLoadingTokenId } = useCurrentTokenId();
  const [mintedTokens, setMintedTokens] = useState<
    Array<{
      tokenId: number;
      batchInfo: unknown;
    }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!currentTokenId || isLoadingTokenId) return;

    const fetchMintedTokens = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const tokens = [];

        for (let tokenId = 1; tokenId < currentTokenId; tokenId++) {
          try {
            // Get batch info for this token
            const batchResponse = await fetch("/api/contract/batch-info", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ tokenId }),
            });

            if (batchResponse.ok) {
              const { batchInfo } = await batchResponse.json();
              tokens.push({
                tokenId,
                batchInfo,
              });
            }
          } catch (tokenError) {
            console.warn(
              `Error getting batch info for token ${tokenId}:`,
              tokenError,
            );
          }
        }

        setMintedTokens(tokens);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMintedTokens();
  }, [currentTokenId, isLoadingTokenId]);

  return {
    mintedTokens,
    isLoading,
    error,
  };
}

// Hook for getting network information
export function useNetworkInfo() {
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const networkInfo = {
    chainId,
    isCorrectNetwork: chainId === CONTRACT_CONFIG.NETWORK.chainId,
    networkName:
      chainId === CONTRACT_CONFIG.NETWORK.chainId
        ? CONTRACT_CONFIG.NETWORK.name
        : "Unknown Network",
  };

  const switchToCorrectNetwork = async () => {
    if (!networkInfo.isCorrectNetwork) {
      await switchChain({ chainId: CONTRACT_CONFIG.NETWORK.chainId });
    }
  };

  return {
    ...networkInfo,
    switchToCorrectNetwork,
  };
}

// Legacy compatibility - Create a service-like interface for gradual migration
export class WagmiSmartContractService {
  private address: string | undefined;
  private isConnected: boolean;

  constructor() {
    // This would need to be used within a React component context
    // For now, we'll provide a placeholder implementation
    this.address = undefined;
    this.isConnected = false;
  }

  // This method should be called from within a React component
  initializeFromHooks(hooks: {
    address: string | undefined;
    isConnected: boolean;
    chainId: number;
    isCorrectNetwork: boolean;
  }) {
    this.address = hooks.address;
    this.isConnected = hooks.isConnected;
  }

  isInitialized(): boolean {
    return this.isConnected && !!this.address;
  }

  async getWalletAddress(): Promise<string> {
    if (!this.address) {
      throw new Error("Wallet not connected");
    }
    return this.address;
  }

  async getNetworkInfo() {
    return {
      chainId: 43113, // Fuji testnet
      isCorrectNetwork: true,
      name: "Avalanche Fuji Testnet",
    };
  }
}

// Create a singleton instance for backward compatibility
export const wagmiSmartContractService = new WagmiSmartContractService();
