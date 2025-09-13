# Supply Chain Tokens - Smart Contract

This project contains the ERC-1155 smart contract for supply chain traceability using blockchain technology.

## 🏗️ Contract Features

- **ERC-1155 Multi-Token Standard**: Efficient batch management
- **Batch Traceability**: Complete transfer history for each batch
- **Manufacturer Control**: Only manufacturers can mint and update their batches
- **Partner Transfers**: Secure transfers with metadata and reasons
- **Pausable**: Emergency stop functionality
- **Access Control**: Owner-only administrative functions

## 📦 Contract Functions

### Batch Management
- `mintBatch()` - Create new product batch with ERC-1155 tokens
- `updateBatch()` - Update batch quantity and carbon footprint
- `getBatchInfo()` - Get complete batch information
- `batchExists()` - Check if batch exists

### Transfer & Traceability
- `transferToPartner()` - Transfer tokens to partners with metadata
- `getTransferHistory()` - Get complete transfer history
- `getTransferCount()` - Get number of transfers

### Utility Functions
- `getTokenIdByBatch()` - Get token ID from batch number
- `getCurrentTokenId()` - Get current token ID counter
- `pause()` / `unpause()` - Emergency controls

## 🚀 Deployment

### Prerequisites
1. Install dependencies:
```bash
pnpm install
```

2. Set up environment variables (create `.env` file):
```bash
# Private key for deployment (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# Optional: SnowTrace API key for contract verification
SNOWTRACE_API_KEY=your_snowtrace_api_key

# Optional: Enable gas reporting
REPORT_GAS=true
```

### Compile Contract
```bash
npx hardhat compile
```

### Run Tests
```bash
npx hardhat test
```

### Deploy to Local Network
```bash
# Start local node
npx hardhat node

# Deploy to localhost (in another terminal)
npx hardhat run scripts/deploy.ts --network localhost
```

### Deploy to Avalanche Fuji Testnet
```bash
npx hardhat run scripts/deploy.ts --network fuji
```

### Deploy to Avalanche Mainnet
```bash
npx hardhat run scripts/deploy.ts --network avalanche
```

### Deploy with Ignition (Alternative)
```bash
npx hardhat ignition deploy ignition/modules/SupplyChainTokens.ts --network fuji
```

## 🔧 Configuration

### Networks
- **Hardhat**: Local development (Chain ID: 1337)
- **Fuji**: Avalanche testnet (Chain ID: 43113)
- **Avalanche**: Avalanche mainnet (Chain ID: 43114)
- **Localhost**: Local node (Chain ID: 1337)

### Gas Settings
- Gas price: 25 gwei
- Optimizer: Enabled (200 runs)

## 📊 Contract Structure

### BatchInfo Struct
```solidity
struct BatchInfo {
    uint256 batchNumber;
    address manufacturer;
    string templateId;
    uint256 quantity;
    uint256 productionDate;
    uint256 expiryDate;
    uint256 carbonFootprint;
    string plantId;
    string metadataURI;
    bool isActive;
}
```

### TransferRecord Struct
```solidity
struct TransferRecord {
    address from;
    address to;
    uint256 quantity;
    uint256 timestamp;
    string reason;
    string metadata;
}
```

## 🔍 Events

### BatchMinted
Emitted when a new batch is created
```solidity
event BatchMinted(
    uint256 indexed tokenId,
    uint256 indexed batchNumber,
    address indexed manufacturer,
    string templateId,
    uint256 quantity,
    uint256 carbonFootprint
);
```

### BatchTransferred
Emitted when tokens are transferred to partners
```solidity
event BatchTransferred(
    uint256 indexed tokenId,
    address indexed from,
    address indexed to,
    uint256 quantity,
    string reason
);
```

## 🧪 Testing

The test suite covers:
- ✅ Contract deployment
- ✅ Batch minting
- ✅ Partner transfers
- ✅ Batch information retrieval
- ✅ Transfer history
- ✅ Access controls
- ✅ Pausable functionality
- ✅ Error handling

Run tests with:
```bash
npx hardhat test
```

## 📝 Integration with Frontend

After deployment, you'll need to:

1. **Update Contract Address**: Add the deployed contract address to your frontend
2. **ABI Integration**: Import the contract ABI for frontend interactions
3. **Event Listeners**: Set up listeners for `BatchMinted` and `BatchTransferred` events
4. **Wallet Integration**: Connect with MetaMask or other wallet providers

### Example Frontend Integration
```typescript
import { ethers } from "ethers";

const contractAddress = "0x..."; // Deployed contract address
const contractABI = [...]; // Contract ABI

const provider = new ethers.BrowserProvider(window.ethereum);
const contract = new ethers.Contract(contractAddress, contractABI, provider);

// Mint a batch
const tx = await contract.mintBatch(
  batchNumber,
  templateId,
  quantity,
  productionDate,
  expiryDate,
  carbonFootprint,
  plantId,
  metadataURI,
  "0x"
);
```

## 🔒 Security Considerations

- **Access Control**: Only manufacturers can mint and update their batches
- **Reentrancy Protection**: All external calls are protected
- **Pausable**: Emergency stop mechanism available
- **Input Validation**: All inputs are validated
- **Gas Optimization**: Contract is optimized for gas efficiency

## 📄 License

MIT License - see LICENSE file for details
