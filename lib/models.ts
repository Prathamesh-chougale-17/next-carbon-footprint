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
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Product Batch - Actual production run that mints ERC-1155 tokens
export interface ProductBatch {
  _id?: ObjectId;
  batchNumber: string;
  templateId: string; // Reference to ProductTemplate
  quantity: number;
  productionDate: Date;
  expiryDate?: Date;
  batchStatus: 'production' | 'completed' | 'shipped' | 'delivered';
  carbonFootprint: number; // Total carbon footprint for this batch
  manufacturerAddress: string;
  manufacturingLocation: string;
  qualityControl: {
    passed: boolean;
    notes?: string;
    inspectorName?: string;
    inspectionDate?: Date;
  };
  // ERC-1155 Token details
  tokenId?: number;
  tokenContractAddress?: string;
  txHash?: string;
  blockNumber?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Token Transfer - Movement of tokens in supply chain
export interface TokenTransfer {
  _id?: ObjectId;
  tokenId: number;
  batchId: string; // Reference to ProductBatch
  fromAddress: string;
  toAddress: string;
  quantity: number;
  transferType: 'manufacturing' | 'logistics' | 'retail' | 'consumer';
  transferReason: string;
  carbonFootprint: number;
  // Blockchain details
  txHash: string;
  blockNumber: number;
  gasUsed?: number;
  // Supply chain details
  fromLocation: string;
  toLocation: string;
  transportMethod?: string;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
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
