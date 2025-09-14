import { ethers } from 'ethers';
import { CONTRACT_CONFIG, CONTRACT_HELPERS, BatchMintParams } from './contract';

// Re-export BatchMintParams for use in other modules
export type { BatchMintParams };

// Smart contract service for batch token minting
export class SmartContractService {
  private contract: ethers.Contract | null = null;
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;

  // Check if the service is initialized
  isInitialized(): boolean {
    return !!(this.contract && this.provider && this.signer);
  }

  // Initialize the contract connection
  async initialize() {
    if (!CONTRACT_HELPERS.isMetaMaskAvailable()) {
      throw new Error('MetaMask is not available. Please install MetaMask to continue.');
    }

    try {
      // Get provider and signer
      this.provider = new ethers.BrowserProvider((window as any).ethereum);
      this.signer = await this.provider.getSigner();

      // Create contract instance
      this.contract = new ethers.Contract(
        CONTRACT_CONFIG.ADDRESS,
        CONTRACT_CONFIG.ABI,
        this.signer
      );

      // Check if we're on the correct network
      const network = await this.provider.getNetwork();
      if (Number(network.chainId) !== CONTRACT_CONFIG.NETWORK.chainId) {
        await CONTRACT_HELPERS.switchToFujiNetwork();
        // Re-initialize after network switch
        this.provider = new ethers.BrowserProvider((window as any).ethereum);
        this.signer = await this.provider.getSigner();
        this.contract = new ethers.Contract(
          CONTRACT_CONFIG.ADDRESS,
          CONTRACT_CONFIG.ABI,
          this.signer
        );
      }

      return true;
    } catch (error) {
      console.error('Failed to initialize smart contract:', error);
      throw error;
    }
  }

  // Mint tokens for a batch
  async mintBatch(params: BatchMintParams): Promise<{
    tokenId: number;
    txHash: string;
    gasUsed: string;
  }> {
    if (!this.contract) {
      throw new Error('Contract not initialized. Call initialize() first.');
    }

    try {
      console.log('Minting batch tokens with params:', params);

      // Validate parameters before minting
      if (!params.batchNumber || params.batchNumber <= 0) {
        throw new Error('Invalid batch number. Must be a positive number.');
      }

      if (!params.quantity || params.quantity <= 0) {
        throw new Error('Invalid quantity. Must be a positive number.');
      }

      if (!params.templateId || params.templateId.trim() === '') {
        throw new Error('Template ID is required.');
      }

      if (!params.plantId || params.plantId.trim() === '') {
        throw new Error('Plant ID is required.');
      }

      if (!params.carbonFootprint || params.carbonFootprint <= 0) {
        throw new Error('Carbon footprint must be a positive number.');
      }

      // Ensure carbon footprint is an integer (stored in kg for precision, displayed in tons)
      if (!Number.isInteger(params.carbonFootprint)) {
        throw new Error('Carbon footprint must be an integer value (in kg).');
      }

      // Use the metadata URI from params, or fallback to a placeholder
      const metadataURI = params.metadataURI || `https://api.carbontrack.com/metadata/batch/${params.batchNumber}`;

      // Estimate gas first
      const gasEstimate = await this.contract.mintBatch.estimateGas(
        params.batchNumber,
        params.templateId,
        params.quantity,
        params.productionDate,
        params.expiryDate,
        params.carbonFootprint,
        params.plantId,
        metadataURI,
        "0x" // Empty data
      );

      console.log('Gas estimate:', gasEstimate.toString());

      // Execute the minting transaction
      // Get current gas price and set minimum for Avalanche Fuji
      const gasPrice = await this.provider!.getFeeData();
      console.log('Gas price data for minting:', gasPrice);

      // Set minimum gas prices for Avalanche Fuji (25 gwei minimum)
      const minGasPrice = ethers.parseUnits('25', 'gwei'); // 25 gwei minimum
      const minMaxFeePerGas = ethers.parseUnits('30', 'gwei'); // 30 gwei for max fee
      const minMaxPriorityFeePerGas = ethers.parseUnits('2', 'gwei'); // 2 gwei for priority

      const finalGasPrice = gasPrice.gasPrice && gasPrice.gasPrice > minGasPrice ? gasPrice.gasPrice : minGasPrice;
      const finalMaxFeePerGas = gasPrice.maxFeePerGas && gasPrice.maxFeePerGas > minMaxFeePerGas ? gasPrice.maxFeePerGas : minMaxFeePerGas;
      const finalMaxPriorityFeePerGas = gasPrice.maxPriorityFeePerGas && gasPrice.maxPriorityFeePerGas > minMaxPriorityFeePerGas ? gasPrice.maxPriorityFeePerGas : minMaxPriorityFeePerGas;

      console.log('Final gas configuration for minting:', {
        gasPrice: ethers.formatUnits(finalGasPrice, 'gwei') + ' gwei',
        maxFeePerGas: ethers.formatUnits(finalMaxFeePerGas, 'gwei') + ' gwei',
        maxPriorityFeePerGas: ethers.formatUnits(finalMaxPriorityFeePerGas, 'gwei') + ' gwei'
      });

      const tx = await this.contract.mintBatch(
        params.batchNumber,
        params.templateId,
        params.quantity,
        params.productionDate,
        params.expiryDate,
        params.carbonFootprint,
        params.plantId,
        metadataURI,
        "0x", // Empty data
        {
          gasLimit: gasEstimate * BigInt(200) / BigInt(100), // Add 100% buffer
          gasPrice: finalGasPrice,
          maxFeePerGas: finalMaxFeePerGas,
          maxPriorityFeePerGas: finalMaxPriorityFeePerGas,
        }
      );

      console.log('Transaction submitted:', tx.hash);

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      if (!receipt) {
        throw new Error('Transaction failed - no receipt received');
      }

      console.log('Transaction confirmed:', receipt);

      // Get the token ID from the event
      const batchMintedEvent = receipt.logs.find((log: any) => {
        try {
          const decoded = this.contract!.interface.parseLog(log);
          return decoded?.name === 'BatchMinted';
        } catch {
          return false;
        }
      });

      if (!batchMintedEvent) {
        throw new Error('BatchMinted event not found in transaction receipt');
      }

      const decodedEvent = this.contract.interface.parseLog(batchMintedEvent);
      const tokenId = Number(decodedEvent!.args.tokenId);

      return {
        tokenId,
        txHash: tx.hash,
        gasUsed: receipt.gasUsed.toString(),
      };

    } catch (error: any) {
      console.error('Failed to mint batch tokens:', error);

      // Provide user-friendly error messages
      if (error.code === 'INSUFFICIENT_FUNDS') {
        throw new Error('Insufficient funds for gas. Please add AVAX to your wallet.');
      } else if (error.code === 'USER_REJECTED') {
        throw new Error('Transaction was rejected by user.');
      } else if (error.message.includes('Batch already exists')) {
        throw new Error('A batch with this number already exists for your address.');
      } else if (error.message.includes('Quantity must be greater than 0')) {
        throw new Error('Batch quantity must be greater than 0.');
      } else if (error.message.includes('transaction underpriced') || error.message.includes('gas fee cap')) {
        throw new Error('Gas fee too low. Please try again - the network may be congested.');
      } else if (error.message.includes('UNKNOWN_ERROR')) {
        throw new Error('Network error. Please check your connection and try again.');
      } else {
        throw new Error(`Failed to mint tokens: ${error.message}`);
      }
    }
  }

  // Get batch information from blockchain
  async getBatchInfo(tokenId: number) {
    if (!this.contract) {
      throw new Error('Contract not initialized. Call initialize() first.');
    }

    try {
      const batchInfo = await this.contract.getBatchInfo(tokenId);
      return {
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
      };
    } catch (error) {
      console.error('Failed to get batch info:', error);
      throw error;
    }
  }

  // Get current token ID counter
  async getCurrentTokenId(): Promise<number> {
    if (!this.contract) {
      throw new Error('Contract not initialized. Call initialize() first.');
    }

    try {
      const tokenId = await this.contract.getCurrentTokenId();
      return Number(tokenId);
    } catch (error) {
      console.error('Failed to get current token ID:', error);
      throw error;
    }
  }

  // Check if batch exists
  async batchExists(batchNumber: number, manufacturerAddress: string): Promise<boolean> {
    if (!this.contract) {
      throw new Error('Contract not initialized. Call initialize() first.');
    }

    try {
      const tokenId = await this.contract.getTokenIdByBatch(batchNumber, manufacturerAddress);
      return Number(tokenId) > 0;
    } catch (error) {
      console.error('Failed to check if batch exists:', error);
      return false;
    }
  }

  // Get user's wallet address
  async getWalletAddress(): Promise<string> {
    if (!this.signer) {
      throw new Error('Signer not initialized. Call initialize() first.');
    }

    return await this.signer.getAddress();
  }

  // Get network information
  async getNetworkInfo() {
    if (!this.provider) {
      throw new Error('Provider not initialized. Call initialize() first.');
    }

    const network = await this.provider.getNetwork();
    return {
      name: network.name,
      chainId: Number(network.chainId),
      isCorrectNetwork: Number(network.chainId) === CONTRACT_CONFIG.NETWORK.chainId,
    };
  }

  // Get all token balances for a user
  async getUserTokenBalances(userAddress: string): Promise<Array<{
    tokenId: number;
    balance: number;
    batchInfo: any;
  }>> {
    if (!this.contract) {
      throw new Error('Contract not initialized. Call initialize() first.');
    }

    try {
      console.log('Getting token balances for address:', userAddress);

      // Get current token ID counter to know how many tokens exist
      const currentTokenId = await this.contract.getCurrentTokenId();
      console.log('Current token ID counter:', Number(currentTokenId));

      const tokenBalances = [];

      // Check balances for all existing tokens
      for (let tokenId = 1; tokenId < Number(currentTokenId); tokenId++) {
        try {
          console.log(`Checking balance for token ID ${tokenId}...`);
          const balance = await this.contract.balanceOf(userAddress, tokenId);
          const balanceNumber = Number(balance);
          console.log(`Token ${tokenId} balance:`, balanceNumber);

          if (balanceNumber > 0) {
            console.log(`Token ${tokenId} has balance > 0, getting batch info...`);
            // Get batch information for this token
            const batchInfo = await this.getBatchInfo(tokenId);
            console.log(`Batch info for token ${tokenId}:`, batchInfo);

            tokenBalances.push({
              tokenId,
              balance: balanceNumber,
              batchInfo,
            });
          }
        } catch (tokenError) {
          console.warn(`Error checking token ${tokenId}:`, tokenError);
          // Continue with other tokens even if one fails
        }
      }

      console.log('Final token balances:', tokenBalances);
      return tokenBalances;
    } catch (error) {
      console.error('Failed to get user token balances:', error);
      throw error;
    }
  }

  // Get all tokens that have been minted (for debugging)
  async getAllMintedTokens(): Promise<Array<{
    tokenId: number;
    batchInfo: any;
  }>> {
    if (!this.contract) {
      throw new Error('Contract not initialized. Call initialize() first.');
    }

    try {
      console.log('Getting all minted tokens...');

      // Get current token ID counter to know how many tokens exist
      const currentTokenId = await this.contract.getCurrentTokenId();
      console.log('Current token ID counter:', Number(currentTokenId));

      const mintedTokens = [];

      // Check all tokens that have been minted
      for (let tokenId = 1; tokenId < Number(currentTokenId); tokenId++) {
        try {
          console.log(`Getting batch info for token ID ${tokenId}...`);
          const batchInfo = await this.getBatchInfo(tokenId);
          console.log(`Token ${tokenId} batch info:`, batchInfo);

          mintedTokens.push({
            tokenId,
            batchInfo,
          });
        } catch (tokenError) {
          console.warn(`Error getting batch info for token ${tokenId}:`, tokenError);
          // Continue with other tokens even if one fails
        }
      }

      console.log('All minted tokens:', mintedTokens);
      return mintedTokens;
    } catch (error) {
      console.error('Failed to get all minted tokens:', error);
      throw error;
    }
  }

  // Transfer tokens to another address
  async transferTokens(
    to: string,
    tokenId: number,
    quantity: number,
    reason: string = 'Transfer to partner'
  ): Promise<{
    txHash: string;
    gasUsed: string;
  }> {
    // Ensure contract is initialized
    if (!this.contract || !this.provider || !this.signer) {
      console.log('Contract not initialized, initializing now...');
      await this.initialize();
    }

    if (!this.contract) {
      throw new Error('Failed to initialize contract. Please check your wallet connection.');
    }

    try {
      console.log('Transferring tokens:', { to, tokenId, quantity, reason });
      console.log('Contract instance:', !!this.contract);
      console.log('Provider instance:', !!this.provider);
      console.log('Signer instance:', !!this.signer);

      // Validate inputs
      if (!to || to === ethers.ZeroAddress) {
        throw new Error('Invalid recipient address');
      }

      if (!quantity || quantity <= 0) {
        throw new Error('Quantity must be greater than 0');
      }

      if (!tokenId || tokenId <= 0) {
        throw new Error('Invalid token ID');
      }

      // Check balance
      const userAddress = await this.getWalletAddress();
      const balance = await this.contract.balanceOf(userAddress, tokenId);
      if (Number(balance) < quantity) {
        throw new Error(`Insufficient balance. You have ${Number(balance)} tokens, trying to transfer ${quantity}`);
      }

      // Estimate gas
      console.log('Estimating gas for transfer...');
      if (!this.contract.transferToPartner) {
        throw new Error('transferToPartner method not found on contract');
      }

      const gasEstimate = await this.contract.transferToPartner.estimateGas(
        to,
        tokenId,
        quantity,
        reason,
        '' // metadata
      );
      console.log('Gas estimate:', gasEstimate.toString());

      // Get current gas price and set minimum for Avalanche Fuji
      const gasPrice = await this.provider!.getFeeData();
      console.log('Gas price data:', gasPrice);

      // Set minimum gas prices for Avalanche Fuji (25 gwei minimum)
      const minGasPrice = ethers.parseUnits('25', 'gwei'); // 25 gwei minimum
      const minMaxFeePerGas = ethers.parseUnits('30', 'gwei'); // 30 gwei for max fee
      const minMaxPriorityFeePerGas = ethers.parseUnits('2', 'gwei'); // 2 gwei for priority

      const finalGasPrice = gasPrice.gasPrice && gasPrice.gasPrice > minGasPrice ? gasPrice.gasPrice : minGasPrice;
      const finalMaxFeePerGas = gasPrice.maxFeePerGas && gasPrice.maxFeePerGas > minMaxFeePerGas ? gasPrice.maxFeePerGas : minMaxFeePerGas;
      const finalMaxPriorityFeePerGas = gasPrice.maxPriorityFeePerGas && gasPrice.maxPriorityFeePerGas > minMaxPriorityFeePerGas ? gasPrice.maxPriorityFeePerGas : minMaxPriorityFeePerGas;

      console.log('Final gas configuration:', {
        gasPrice: ethers.formatUnits(finalGasPrice, 'gwei') + ' gwei',
        maxFeePerGas: ethers.formatUnits(finalMaxFeePerGas, 'gwei') + ' gwei',
        maxPriorityFeePerGas: ethers.formatUnits(finalMaxPriorityFeePerGas, 'gwei') + ' gwei'
      });

      // Execute transfer with proper gas configuration
      const tx = await this.contract.transferToPartner(
        to,
        tokenId,
        quantity,
        reason,
        '', // metadata
        {
          gasLimit: gasEstimate * BigInt(120) / BigInt(100), // Add 20% buffer
          gasPrice: finalGasPrice,
          maxFeePerGas: finalMaxFeePerGas,
          maxPriorityFeePerGas: finalMaxPriorityFeePerGas,
        }
      );

      console.log('Transfer transaction submitted:', tx.hash);

      // Wait for confirmation
      const receipt = await tx.wait();

      if (!receipt) {
        throw new Error('Transfer failed - no receipt received');
      }

      console.log('Transfer confirmed:', receipt);

      return {
        txHash: tx.hash,
        gasUsed: receipt.gasUsed.toString(),
      };

    } catch (error: any) {
      console.error('Failed to transfer tokens:', error);

      // Provide user-friendly error messages
      if (error.code === 'INSUFFICIENT_FUNDS') {
        throw new Error('Insufficient funds for gas. Please add AVAX to your wallet.');
      } else if (error.code === 'USER_REJECTED') {
        throw new Error('Transfer was rejected by user.');
      } else if (error.message.includes('Insufficient balance')) {
        throw new Error(error.message);
      } else if (error.message.includes('transaction underpriced') || error.message.includes('gas fee cap')) {
        throw new Error('Gas fee too low. Please try again - the network may be congested.');
      } else if (error.message.includes('UNKNOWN_ERROR')) {
        throw new Error('Network error. Please check your connection and try again.');
      } else {
        throw new Error(`Failed to transfer tokens: ${error.message}`);
      }
    }
  }

  // Burn component tokens during batch creation
  async burnComponentTokens(tokenId: number, quantity: number, reason: string = "Component Consumption") {
    if (!this.contract || !this.provider || !this.signer) {
      throw new Error('Smart contract not initialized. Please connect your wallet first.');
    }

    try {
      console.log(`Burning ${quantity} tokens of Token ID ${tokenId} for reason: ${reason}`);

      // Estimate gas for the burn operation
      const gasEstimate = await this.contract.burnComponentTokens.estimateGas(
        tokenId,
        quantity,
        reason
      );
      console.log('Estimated gas for burning:', gasEstimate.toString());

      // Get current gas prices and set minimum for Avalanche Fuji
      const gasPrice = await this.provider.getFeeData();
      console.log('Gas price data for burning:', gasPrice);

      // Set minimum gas prices for Avalanche Fuji (25 gwei minimum)
      const minGasPrice = ethers.parseUnits('25', 'gwei'); // 25 gwei minimum
      const minMaxFeePerGas = ethers.parseUnits('30', 'gwei'); // 30 gwei for max fee
      const minMaxPriorityFeePerGas = ethers.parseUnits('2', 'gwei'); // 2 gwei for priority

      const finalGasPrice = gasPrice.gasPrice && gasPrice.gasPrice > minGasPrice ? gasPrice.gasPrice : minGasPrice;
      const finalMaxFeePerGas = gasPrice.maxFeePerGas && gasPrice.maxFeePerGas > minMaxFeePerGas ? gasPrice.maxFeePerGas : minMaxFeePerGas;
      const finalMaxPriorityFeePerGas = gasPrice.maxPriorityFeePerGas && gasPrice.maxPriorityFeePerGas > minMaxPriorityFeePerGas ? gasPrice.maxPriorityFeePerGas : minMaxPriorityFeePerGas;

      console.log('Final gas configuration for burning:', {
        gasPrice: ethers.formatUnits(finalGasPrice, 'gwei') + ' gwei',
        maxFeePerGas: ethers.formatUnits(finalMaxFeePerGas, 'gwei') + ' gwei',
        maxPriorityFeePerGas: ethers.formatUnits(finalMaxPriorityFeePerGas, 'gwei') + ' gwei'
      });

      // Execute the burn transaction
      const tx = await this.contract.burnComponentTokens(
        tokenId,
        quantity,
        reason,
        {
          gasLimit: gasEstimate * BigInt(120) / BigInt(100), // Add 20% buffer
          gasPrice: finalGasPrice,
          maxFeePerGas: finalMaxFeePerGas,
          maxPriorityFeePerGas: finalMaxPriorityFeePerGas,
        }
      );

      console.log('Burn transaction sent:', tx.hash);

      // Wait for confirmation
      const receipt = await tx.wait();

      if (!receipt) {
        throw new Error('Burn failed - no receipt received');
      }

      console.log('Burn confirmed:', receipt);

      return {
        txHash: tx.hash,
        gasUsed: receipt.gasUsed.toString(),
      };

    } catch (error: any) {
      console.error('Failed to burn component tokens:', error);

      // Provide user-friendly error messages
      if (error.code === 'INSUFFICIENT_FUNDS') {
        throw new Error('Insufficient funds for gas. Please add AVAX to your wallet.');
      } else if (error.code === 'USER_REJECTED') {
        throw new Error('Burn was rejected by user.');
      } else if (error.message.includes('Insufficient balance')) {
        throw new Error('Insufficient component token balance for burning.');
      } else if (error.message.includes('transaction underpriced') || error.message.includes('gas fee cap')) {
        throw new Error('Gas fee too low. Please try again - the network may be congested.');
      } else if (error.message.includes('UNKNOWN_ERROR')) {
        throw new Error('Network error. Please check your connection and try again.');
      } else {
        throw new Error(`Failed to burn component tokens: ${error.message}`);
      }
    }
  }
}

// Create a singleton instance
export const smartContractService = new SmartContractService();
