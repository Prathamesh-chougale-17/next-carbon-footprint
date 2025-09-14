// Smart Contract Configuration
export const CONTRACT_CONFIG = {
  // Deployed contract address on Avalanche Fuji testnet
  ADDRESS: "0x6f70264A4f3608FFa8Ff3ED5C6a1c4542D79fb88",

  // Network configuration
  NETWORK: {
    name: "Avalanche Fuji Testnet",
    chainId: 43113,
    rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc",
    explorerUrl: "https://testnet.snowtrace.io",
  },

  // Contract ABI (minimal functions needed for batch creation)
  ABI: [
    // mintBatch function
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "batchNumber",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "templateId",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "quantity",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "productionDate",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "expiryDate",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "carbonFootprint",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "plantId",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "metadataURI",
          "type": "string"
        },
        {
          "internalType": "bytes",
          "name": "data",
          "type": "bytes"
        }
      ],
      "name": "mintBatch",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },

    // Events
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "batchNumber",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "manufacturer",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "templateId",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "quantity",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "carbonFootprint",
          "type": "uint256"
        }
      ],
      "name": "BatchMinted",
      "type": "event"
    },

    // View functions
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        }
      ],
      "name": "balanceOf",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "getBatchInfo",
      "outputs": [
        {
          "components": [
            {
              "internalType": "uint256",
              "name": "batchNumber",
              "type": "uint256"
            },
            {
              "internalType": "address",
              "name": "manufacturer",
              "type": "address"
            },
            {
              "internalType": "string",
              "name": "templateId",
              "type": "string"
            },
            {
              "internalType": "uint256",
              "name": "quantity",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "productionDate",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "expiryDate",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "carbonFootprint",
              "type": "uint256"
            },
            {
              "internalType": "string",
              "name": "plantId",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "metadataURI",
              "type": "string"
            },
            {
              "internalType": "bool",
              "name": "isActive",
              "type": "bool"
            }
          ],
          "internalType": "struct SupplyChainTokens.BatchInfo",
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },

    {
      "inputs": [],
      "name": "getCurrentTokenId",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },

    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "batchNumber",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "manufacturer",
          "type": "address"
        }
      ],
      "name": "getTokenIdByBatch",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },

    // transferToPartner function
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "quantity",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "reason",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "metadata",
          "type": "string"
        }
      ],
      "name": "transferToPartner",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },

    // burnComponentTokens function
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "quantity",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "reason",
          "type": "string"
        }
      ],
      "name": "burnComponentTokens",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },

    // uri function for ERC-1155 metadata
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "uri",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ] as const,
} as const;

// Contract interaction helper functions
export const CONTRACT_HELPERS = {
  // Check if MetaMask is available
  isMetaMaskAvailable: () => {
    return typeof window !== 'undefined' && typeof (window as any).ethereum !== 'undefined';
  },

  // Get the current network
  getCurrentNetwork: async () => {
    if (!CONTRACT_HELPERS.isMetaMaskAvailable()) {
      throw new Error('MetaMask is not available');
    }

    const provider = (window as any).ethereum;
    const chainId = await provider.request({ method: 'eth_chainId' });
    return parseInt(chainId, 16);
  },

  // Switch to Fuji testnet if needed
  switchToFujiNetwork: async () => {
    if (!CONTRACT_HELPERS.isMetaMaskAvailable()) {
      throw new Error('MetaMask is not available');
    }

    try {
      await (window as any).ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${CONTRACT_CONFIG.NETWORK.chainId.toString(16)}` }],
      });
    } catch (switchError: any) {
      // If the network doesn't exist, add it
      if (switchError.code === 4902) {
        try {
          await (window as any).ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${CONTRACT_CONFIG.NETWORK.chainId.toString(16)}`,
                chainName: CONTRACT_CONFIG.NETWORK.name,
                rpcUrls: [CONTRACT_CONFIG.NETWORK.rpcUrl],
                nativeCurrency: {
                  name: 'AVAX',
                  symbol: 'AVAX',
                  decimals: 18,
                },
                blockExplorerUrls: [CONTRACT_CONFIG.NETWORK.explorerUrl],
              },
            ],
          });
        } catch (addError) {
          throw new Error('Failed to add Fuji network to MetaMask');
        }
      } else {
        throw new Error('Failed to switch to Fuji network');
      }
    }
  },

  // Get the contract instance
  getContract: async () => {
    if (!CONTRACT_HELPERS.isMetaMaskAvailable()) {
      throw new Error('MetaMask is not available');
    }

    const { ethers } = await import('ethers');
    const provider = new ethers.BrowserProvider((window as any).ethereum);
    const signer = await provider.getSigner();

    return new ethers.Contract(
      CONTRACT_CONFIG.ADDRESS,
      CONTRACT_CONFIG.ABI,
      signer
    );
  },
};

// Types for better TypeScript support
export interface BatchMintParams {
  batchNumber: number;
  templateId: string;
  quantity: number;
  productionDate: number;
  expiryDate: number;
  carbonFootprint: number; // Carbon footprint in kg CO₂ (stored in kg for precision, displayed in tons)
  plantId: string;
  metadataURI: string;
}

export interface BatchInfo {
  batchNumber: number;
  manufacturer: string;
  templateId: string;
  quantity: number;
  productionDate: number;
  expiryDate: number;
  carbonFootprint: number;
  plantId: string;
  metadataURI: string;
  isActive: boolean;
}
