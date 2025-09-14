import { ObjectId } from 'mongodb';

export interface Company {
  _id?: ObjectId;
  walletAddress: string;
  companyName: string;
  companyAddress: string;
  companyType: 'Manufacturer' | 'Retailer' | 'Logistics';
  companyScale: 'small' | 'medium' | 'large';
  companyZipCode: string;
  companyWebsite: string;
  companyEmail: string;
  companyPhone: string;
  companyLogo?: string;
  productTemplates: string[]; // Changed from products to productTemplates
  createdAt: Date;
  updatedAt: Date;
}

// Product Template - Definition of a product type
export interface ProductTemplate {
  _id?: ObjectId;
  templateName: string;
  description: string;
  category: string;
  imageUrl?: string; // URL to the product image
  specifications: {
    weight: number;
    dimensions?: {
      length: number;
      width: number;
      height: number;
    };
    materials: string[];
    carbonFootprintPerUnit: number;
  };
  manufacturerAddress: string;
  isRawMaterial: boolean;
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Product Batch - Actual production run that mints ERC-1155 tokens
export interface BatchComponent {
  tokenId: number;
  tokenName: string;
  quantity: number;
  carbonFootprint: number; // Total carbon footprint for this component quantity
  consumed?: boolean; // Track if component tokens have been consumed/burned
  burnTxHash?: string; // Transaction hash of the burn operation
}

export interface ProductBatch {
  _id?: ObjectId;
  batchNumber: string;
  templateId: string; // Reference to ProductTemplate
  quantity: number;
  productionDate: Date;
  expiryDate?: Date;
  carbonFootprint: number; // Total carbon footprint for this batch
  manufacturerAddress: string;
  plantId: ObjectId; // Reference to Plant
  // Components for complex batches (non-raw materials)
  components?: BatchComponent[];
  // ERC-1155 Token details
  tokenId?: number;
  tokenContractAddress?: string;
  txHash?: string;
  blockNumber?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Partner Relationship - Simple bidirectional relationship model
export interface Partner {
  _id?: ObjectId;
  selfAddress: string; // Your company address (the one creating the relationship)
  companyAddress: string; // Partner company address
  relationship: 'supplier' | 'customer'; // From your perspective
  companyName?: string; // Optional: partner company name
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

// Legacy Product interface for backward compatibility
export interface Product {
  _id?: ObjectId;
  productName: string;
  description: string;
  weight: number;
  carbonFootprint: number;
  companyAddress: string;
  isRawMaterial: boolean;
  manufacturingAddress: string;
  productImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Token {
  _id?: ObjectId;
  tokenId: number;
  productId: string;
  manufacturerAddress: string;
  quantity: number;
  cid: string;
  blockNumber?: number;
  txHash?: string;
  etherscanLink?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssetTransfer {
  _id?: ObjectId;
  fromAddress: string;
  toAddress: string;
  productId: string;
  quantity: number;
  transferType: 'manufacturing' | 'retail' | 'logistics';
  carbonFootprint: number;
  txHash?: string;
  blockNumber?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transportation {
  _id?: ObjectId;
  companyAddress: string;
  vehicleType: string;
  distance: number;
  fuelType: string;
  fuelConsumption: number;
  carbonFootprint: number;
  fromLocation: string;
  toLocation: string;
  productIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Client {
  _id?: ObjectId;
  companyAddress: string;
  clientName: string;
  clientAddress: string;
  clientType: 'Manufacturer' | 'Retailer' | 'Logistics';
  clientEmail: string;
  clientPhone: string;
  relationshipType: 'supplier' | 'customer' | 'partner';
  createdAt: Date;
  updatedAt: Date;
}

export interface Material {
  _id?: ObjectId;
  material: string;
  unit: number;
  carbonFootprint: number;
  type: 'Plastic' | 'Wood' | 'Metal' | 'Other';
  createdAt: Date;
  updatedAt: Date;
}

export interface QRCodeRecord {
  _id?: ObjectId;
  productId: string;
  productName: string;
  qrData: string;
  qrType: 'product' | 'asset' | 'token';
  companyAddress: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ManufacturingProcess {
  _id?: ObjectId;
  processName: string;
  rawMaterialIds: string[];
  outputProductId: string;
  quantity: number;
  carbonFootprint: number;
  manufacturingAddress: string;
  companyAddress: string;
  createdAt: Date;
  updatedAt: Date;
}

// Plant Registration - Manufacturing facility location metadata
export interface Plant {
  _id?: ObjectId;
  plantName: string;
  plantCode: string; // Unique identifier for the plant
  description: string;
  companyAddress: string; // Reference to Company
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Token Transfer Record - Track blockchain token transfers
export interface TokenTransfer {
  _id?: ObjectId;
  fromAddress: string; // Sender's wallet address
  toAddress: string; // Recipient's wallet address
  tokenId: number; // ERC-1155 token ID
  quantity: number; // Amount transferred
  reason?: string; // Transfer reason/description
  txHash: string; // Blockchain transaction hash
  blockNumber?: number; // Block number where transaction was mined
  gasUsed?: string; // Gas used for the transaction
  status: 'pending' | 'confirmed' | 'failed'; // Transfer status
  createdAt: Date;
  updatedAt: Date;
}
