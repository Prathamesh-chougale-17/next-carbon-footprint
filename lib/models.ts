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
  products: string[];
  createdAt: Date;
  updatedAt: Date;
}

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
