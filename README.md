# Carbon Footprint Supply Chain Tracking System

A comprehensive blockchain-based supply chain transparency platform that enables companies to track, verify, and display the complete carbon footprint of their products from raw materials to final delivery.

## 🌟 Features

### 🏭 **Company & Plant Management**
- Company registration with blockchain wallet integration
- Multi-plant management with GPS coordinates
- Partner system for bidirectional company relationships
- Comprehensive location tracking and verification

### 📦 **Product Lifecycle Tracking**
- Product template creation with detailed specifications
- Raw material vs. manufactured product classification
- Image upload and storage for product visualization
- Carbon footprint calculations per unit

### 🔗 **Blockchain Integration**
- ERC-1155 token minting on Avalanche Fuji Testnet
- Automatic component token burning during manufacturing
- Blockchain transaction recording with metadata URI support
- Gas-optimized smart contracts for Avalanche network

### 🗺️ **Supply Chain Visualization**
- **Interactive Map**: OpenLayers-based geographical supply chain visualization
- **Tree View**: D3.js hierarchical tree showing complete product breakdown
- **Component Tracking**: Recursive component consumption from raw materials
- **Transport Methods**: Visual representation of shipping routes

### 📋 **Digital Product Passport (DPP)**
- Public-facing token details with complete traceability
- Environmental impact metrics (CO₂ emissions in tons)
- Manufacturing plant details and blockchain verification
- Component breakdown with quantities and carbon footprints

### 💰 **Token Management**
- Token balance tracking per company
- Transfer functionality between companies
- Transfer history with partner details
- QR code generation for token verification

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- MongoDB database
- MetaMask wallet
- Avalanche Fuji Testnet configured in MetaMask

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd next-carbon-footprint
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/carbon-footprint
   NEXT_PUBLIC_CONTRACT_ADDRESS=0x6f70264A4f3608FFa8Ff3ED5C6a1c4542D79fb88
   NEXT_PUBLIC_CHAIN_ID=43113
   NEXT_PUBLIC_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
   ```

4. **Database Setup**
   Ensure MongoDB is running and accessible at the configured URI.

5. **Start Development Server**
   ```bash
   pnpm dev
   ```

6. **Access the Application**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Project Structure

```
next-carbon-footprint/
├── app/                          # Next.js App Router
│   ├── api/                     # API routes
│   │   ├── companies/           # Company management
│   │   ├── plants/              # Plant management
│   │   ├── product-templates/   # Product template CRUD
│   │   ├── product-batches/     # Batch creation and management
│   │   ├── tokens/              # Token details and transfers
│   │   └── upload/              # File upload handling
│   ├── dashboard/               # Protected dashboard pages
│   │   ├── batches/             # Batch management
│   │   ├── inventory/           # Token inventory
│   │   ├── products/            # Product management
│   │   ├── plants/              # Plant management
│   │   └── partners/            # Partner management
│   └── tokens/[tokenId]/        # Public DPP pages
├── components/                  # React components
│   ├── ui/                     # Reusable UI components
│   ├── avax-wallet/            # Blockchain wallet integration
│   ├── supply-chain-map.tsx    # OpenLayers map visualization
│   └── ProductTreeViewer.tsx   # D3.js tree visualization
├── lib/                        # Utility libraries
│   ├── models.ts               # TypeScript interfaces
│   ├── mongodb.ts              # Database connection
│   ├── smart-contract.ts       # Blockchain interaction
│   ├── contract.ts             # Contract configuration
│   └── utils.ts                # Utility functions
├── hardhat/                    # Smart contract development
│   ├── contracts/              # Solidity contracts
│   ├── scripts/                # Deployment scripts
│   └── test/                   # Contract tests
└── public/                     # Static assets
```

## 🔧 Smart Contract

### Contract Address
**Avalanche Fuji Testnet**: `0x6f70264A4f3608FFa8Ff3ED5C6a1c4542D79fb88`

### Key Features
- **ERC-1155 Standard**: Multi-token standard for efficient batch operations
- **Batch Minting**: Mint multiple tokens with metadata URI support
- **Component Burning**: Automatic consumption of component tokens
- **Gas Optimization**: Optimized for Avalanche network gas prices
- **Security**: Pausable and Ownable with ReentrancyGuard

### Deployment
```bash
cd hardhat
pnpm install
pnpm hardhat compile
pnpm hardhat deploy --network fuji
```

## 📊 Data Models

### Company
```typescript
interface Company {
  walletAddress: string;
  companyName: string;
  companyType: 'Manufacturer' | 'Retailer' | 'Logistics';
  // ... other fields
}
```

### ProductTemplate
```typescript
interface ProductTemplate {
  templateName: string;
  description: string;
  category: string;
  imageUrl?: string;
  specifications: {
    weight: number;
    carbonFootprintPerUnit: number;
  };
  isRawMaterial: boolean;
  // ... other fields
}
```

### ProductBatch
```typescript
interface ProductBatch {
  batchNumber: string;
  templateId: string;
  quantity: number;
  carbonFootprint: number;
  components?: BatchComponent[];
  tokenId?: number;
  txHash?: string;
  // ... other fields
}
```

## 🎨 User Interface

### Dashboard Features
- **Company Registration**: Register and manage company information
- **Plant Management**: Add plants with GPS coordinates and details
- **Product Templates**: Create product definitions with specifications
- **Batch Creation**: Create production batches with component consumption
- **Token Inventory**: View and manage blockchain tokens
- **Partner Management**: Manage company partnerships

### Public DPP Features
- **Product Passport**: Complete product traceability information
- **Supply Chain Map**: Interactive geographical visualization
- **Component Tree**: Hierarchical product breakdown
- **Environmental Metrics**: Carbon footprint and sustainability data
- **Blockchain Verification**: Transaction links and verification

### Visualization Components
- **Interactive Maps**: OpenLayers-based geographical supply chain
- **Tree Visualization**: D3.js hierarchical product breakdown
- **Modal Dialogs**: Large-scale visualization (90% screen size)
- **Responsive Design**: Optimized for all device sizes

## 🌍 Environmental Impact

### Carbon Footprint Tracking
- Per-unit carbon footprint calculations
- Total batch carbon emissions (stored in kg, displayed in tons)
- Component-based carbon aggregation
- Supply chain carbon footprint visualization

### Sustainability Metrics
- Environmental impact summaries
- Carbon efficiency per unit
- Supply chain transparency
- Blockchain-verified sustainability claims

## 🔐 Security & Privacy

### Blockchain Security
- Smart contract audited and tested
- Gas optimization to prevent transaction failures
- Proper access controls and ownership management

### Data Privacy
- Wallet-based authentication
- Public transparency with controlled access
- Secure file upload and storage
- MongoDB security best practices

## 🚀 Deployment

### Production Build
```bash
pnpm build
pnpm start
```

### Environment Variables
```env
# Database
MONGODB_URI=your_mongodb_connection_string

# Blockchain
NEXT_PUBLIC_CONTRACT_ADDRESS=your_contract_address
NEXT_PUBLIC_CHAIN_ID=43113
NEXT_PUBLIC_RPC_URL=your_rpc_url

# Optional: File storage
UPLOAD_DIR=./public/uploads
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation in the `/docs` folder
- Review the smart contract tests in `/hardhat/test`

## 🔮 Roadmap

- [ ] IPFS integration for decentralized image storage
- [ ] Mobile application development
- [ ] Advanced analytics and reporting
- [ ] Multi-chain support (Ethereum, Polygon)
- [ ] API for third-party integrations
- [ ] Advanced carbon calculation methodologies

## 🙏 Acknowledgments

- OpenZeppelin for secure smart contract libraries
- Next.js team for the excellent framework
- Tailwind CSS for the utility-first CSS framework
- OpenLayers for interactive map functionality
- D3.js for data visualization capabilities

---

**Built with ❤️ for sustainable supply chain transparency**
