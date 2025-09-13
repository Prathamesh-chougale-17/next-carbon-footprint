# 🚀 Deployment Guide

## Prerequisites

1. **MetaMask Wallet**: Set up with some AVAX for gas fees
2. **Private Key**: Export from MetaMask (Account Details > Export Private Key)
3. **AVAX Tokens**: Get testnet AVAX from [Avalanche Faucet](https://faucet.avax.network/)

## Step 1: Configure Environment

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` file and add your private key:
```bash
# Replace with your actual private key (without 0x prefix)
PRIVATE_KEY=1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef

# Optional: Add SnowTrace API key for contract verification
SNOWTRACE_API_KEY=your_snowtrace_api_key_here
```

## Step 2: Get Testnet AVAX

1. Go to [Avalanche Fuji Faucet](https://faucet.avax.network/)
2. Enter your wallet address
3. Complete the captcha
4. Wait for AVAX to arrive (usually within minutes)

## Step 3: Deploy to Fuji Testnet

```bash
# Compile the contract
npx hardhat compile

# Run tests to ensure everything works
npx hardhat test

# Deploy to Fuji testnet
npx hardhat run scripts/deploy.ts --network fuji
```

## Step 4: Verify Deployment

After successful deployment, you'll see:
- Contract address
- Deployment transaction hash
- Gas used
- Deployment info saved to `deployments/` folder

## Step 5: Verify on SnowTrace

1. Go to [SnowTrace Fuji](https://testnet.snowtrace.io/)
2. Search for your contract address
3. Click "Contract" tab
4. Click "Verify and Publish"
5. Fill in the verification details:
   - Compiler Type: Solidity
   - Compiler Version: 0.8.28
   - License: MIT
   - Constructor Arguments: (your base URI)

## Step 6: Update Frontend

1. Copy the contract address from deployment output
2. Update your frontend configuration
3. Add the contract ABI from `artifacts/contracts/SupplyChainTokens.sol/SupplyChainTokens.json`

## Troubleshooting

### Common Issues:

1. **"Insufficient funds"**: Get more AVAX from faucet
2. **"Invalid private key"**: Ensure no 0x prefix in .env
3. **"Network error"**: Check internet connection and RPC endpoint
4. **"Gas estimation failed"**: Increase gas limit or check contract code

### Gas Fees:
- Fuji Testnet: Very low (usually < $0.01)
- Mainnet: Higher (depends on network congestion)

## Security Notes

- ⚠️ **Never commit your `.env` file to version control**
- ⚠️ **Never share your private key**
- ⚠️ **Use testnet for development and testing**
- ⚠️ **Test thoroughly before mainnet deployment**

## Next Steps

After successful deployment:
1. Test contract functions on SnowTrace
2. Integrate with your frontend
3. Set up event listeners
4. Test batch creation and transfers
5. Deploy to mainnet when ready

## Support

- [Hardhat Documentation](https://hardhat.org/docs)
- [Avalanche Documentation](https://docs.avax.network/)
- [SnowTrace Explorer](https://snowtrace.io/)
