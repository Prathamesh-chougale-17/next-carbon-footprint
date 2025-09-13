# CarbonTrack - Blockchain Carbon Footprint Tracking Platform

A comprehensive Next.js application for tracking and managing carbon footprints using blockchain technology and MongoDB.

## Features

### 🏢 Company Management
- **Company Registration**: Register companies as Manufacturer, Retailer, or Logistics provider
- **Profile Management**: Complete company profiles with contact information and logos
- **Wallet Integration**: Avalanche wallet integration for secure authentication

### 📦 Product Tracking
- **Product Registration**: Register products with detailed carbon footprint data
- **Raw Material Classification**: Distinguish between raw materials and finished products
- **Carbon Footprint Calculation**: Track CO₂ emissions per product

### 🪙 Token Management
- **Carbon Credit Tokens**: Mint blockchain tokens representing carbon credits
- **NFT Metadata**: Store product and company data as IPFS-hosted NFTs
- **Blockchain Transparency**: All transactions recorded on Avalanche blockchain

### 🚛 Transportation Tracking
- **Vehicle Management**: Track different vehicle types and fuel consumption
- **Route Recording**: Record transportation routes and distances
- **Carbon Calculation**: Automatic carbon footprint calculation based on fuel type and consumption

### 👥 Client Management
- **B2B Relationships**: Manage supplier, customer, and partner relationships
- **Network Tracking**: Track carbon data across business networks
- **Contact Management**: Complete client contact information

### 📊 Dashboard & Analytics
- **Real-time Metrics**: Track carbon footprint, products, clients, and transportation
- **Visual Analytics**: Charts and graphs for carbon footprint trends
- **Quick Actions**: Easy access to common tasks

## Tech Stack

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Modern UI component library
- **Lucide React**: Beautiful icons

### Backend
- **MongoDB**: NoSQL database for data storage
- **Next.js API Routes**: Serverless API endpoints
- **Mongoose**: MongoDB object modeling

### Blockchain
- **Avalanche**: High-performance blockchain platform
- **Wagmi**: React hooks for Ethereum
- **MetaMask**: Wallet integration
- **IPFS**: Decentralized file storage for NFT metadata

## Getting Started

### Prerequisites
- Node.js 18+ 
- MongoDB (local or cloud)
- MetaMask browser extension
- Avalanche wallet setup

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd next-carbon-footprint
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Environment Setup**
   Create a `.env.local` file:
   ```env
   MONGODB_URI=mongodb://localhost:27017/carbon-footprint
   CONTRACT_ADDRESS=0x8B6a27094D62816F75F20c38EBC58199922F501A
   CHAIN_ID=0xaa36a7
   ```

4. **Start the development server**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### 1. Connect Wallet
- Click "Connect Wallet" on the landing page
- Connect your MetaMask wallet
- Ensure you're on Avalanche network

### 2. Register Company
- Navigate to the dashboard
- Fill in company information
- Wallet address is automatically filled from connected wallet

### 3. Add Products
- Go to Products section
- Register products with carbon footprint data
- Mark raw materials for token minting

### 4. Mint Tokens
- Navigate to Issue Token section
- Select raw materials
- Mint carbon credit tokens

### 5. Track Transportation
- Record transportation activities
- Calculate carbon emissions
- Track routes and fuel consumption

### 6. Manage Clients
- Add business partners
- Track B2B relationships
- Monitor network carbon data

## API Endpoints

### Companies
- `GET /api/companies` - Get all companies
- `POST /api/companies` - Create new company
- `GET /api/companies/[address]` - Get company by wallet address
- `PUT /api/companies/[address]` - Update company

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create new product

### Tokens
- `GET /api/tokens` - Get all tokens
- `POST /api/tokens` - Mint new token

### Clients
- `GET /api/clients` - Get all clients
- `POST /api/clients` - Add new client

### Transportation
- `GET /api/transportation` - Get all transportation records
- `POST /api/transportation` - Record new transportation

## Database Schema

### Company
```typescript
{
  walletAddress: string;
  companyName: string;
  companyType: 'Manufacturer' | 'Retailer' | 'Logistics';
  companyScale: 'small' | 'medium' | 'large';
  // ... other fields
}
```

### Product
```typescript
{
  productName: string;
  carbonFootprint: number;
  isRawMaterial: boolean;
  companyAddress: string;
  // ... other fields
}
```

### Token
```typescript
{
  tokenId: number;
  productId: string;
  manufacturerAddress: string;
  quantity: number;
  cid: string; // IPFS hash
  // ... other fields
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation

## Roadmap

- [ ] Real blockchain integration with smart contracts
- [ ] Advanced analytics and reporting
- [ ] Mobile application
- [ ] API rate limiting and authentication
- [ ] Multi-language support
- [ ] Carbon offset marketplace
- [ ] Integration with external carbon databases
- [ ] Automated carbon footprint calculations
- [ ] Supply chain visualization
- [ ] Carbon credit trading platform