"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/hooks/use-wallet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
    Package,
    Search,
    ArrowRightLeft,
    ExternalLink,
    Eye,
    TrendingUp,
    Wallet,
    RefreshCw,
    ArrowDownToLine,
    ArrowUpFromLine
} from "lucide-react";
import { toast } from "sonner";
import { NetworkStatus } from "@/components/network-status";
import { smartContractService } from "@/lib/smart-contract";
import { format } from "date-fns";
import { Partner, TokenTransfer } from "@/lib/models";
import Link from "next/link";

// Loading skeleton components
const PageHeaderSkeleton = () => (
    <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
    </div>
);

const SearchBarSkeleton = () => (
    <div className="relative flex-1 max-w-sm">
        <Skeleton className="h-10 w-full" />
    </div>
);

const TokenCardsSkeleton = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                        <Skeleton className="h-6 w-16" />
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex justify-between">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-12" />
                    </div>
                    <div className="flex justify-between">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-8 w-full" />
                </CardContent>
            </Card>
        ))}
    </div>
);

interface TokenBalance {
    tokenId: number;
    balance: number;
    batchInfo: {
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
    };
}

interface DatabaseBatch {
    _id: string;
    batchNumber: string;
    templateId: string;
    quantity: number;
    productionDate: string;
    carbonFootprint: number;
    manufacturerAddress: string;
    plantId: string;
    tokenId?: number;
    txHash?: string;
    blockNumber?: number;
}

export default function InventoryPage() {
    const { address } = useWallet();
    const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
    const [databaseBatches, setDatabaseBatches] = useState<DatabaseBatch[]>([]);
    const [customers, setCustomers] = useState<Partner[]>([]);
    const [transferHistory, setTransferHistory] = useState<TokenTransfer[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedToken, setSelectedToken] = useState<TokenBalance | null>(null);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [showBatchModal, setShowBatchModal] = useState(false);
    const [transferData, setTransferData] = useState({
        to: "",
        quantity: "",
        reason: ""
    });

    // Fetch token balances from blockchain
    const fetchTokenBalances = async () => {
        if (!address) {
            console.log('No wallet address available');
            return;
        }

        try {
            console.log('Fetching token balances for address:', address);
            await smartContractService.initialize();

            // First, let's check what tokens exist
            const allTokens = await smartContractService.getAllMintedTokens();
            console.log('All minted tokens on blockchain:', allTokens);

            // Then get balances for this user
            const balances = await smartContractService.getUserTokenBalances(address);
            console.log('Token balances fetched for user:', balances);
            setTokenBalances(balances);

            if (balances.length === 0 && allTokens.length > 0) {
                toast.info(`Found ${allTokens.length} tokens on blockchain, but none owned by your address. Check console for details.`);
            } else if (balances.length > 0) {
                toast.success(`Found ${balances.length} tokens owned by your address`);
            }
        } catch (error) {
            console.error('Error fetching token balances:', error);
            toast.error('Failed to fetch token balances from blockchain');
        }
    };

    // Fetch database batches for additional info
    const fetchDatabaseBatches = async () => {
        if (!address) return;

        try {
            const response = await fetch(`/api/product-batches?manufacturerAddress=${address}`);
            if (response.ok) {
                const batches = await response.json();
                setDatabaseBatches(batches);
            }
        } catch (error) {
            console.error('Error fetching database batches:', error);
        }
    };

    // Fetch customers from partners
    const fetchCustomers = async () => {
        if (!address) return;

        try {
            const response = await fetch(`/api/partners?selfAddress=${address}`);
            if (response.ok) {
                const partners = await response.json();
                // Filter only customers (not suppliers)
                const customersData = partners.filter((partner: Partner) => partner.relationship === "customer" && partner.status === "active");
                setCustomers(customersData);
                console.log('Fetched customers:', customersData);
            }
        } catch (error) {
            console.error('Error fetching customers:', error);
        }
    };

    // Fetch batch details by batch ID
    const fetchBatchDetails = async (batchId: string) => {
        try {
            const response = await fetch(`/api/product-batches/${batchId}`);
            if (response.ok) {
                const batch = await response.json();
                return batch;
            }
        } catch (error) {
            console.error('Error fetching batch details:', error);
        }
        return null;
    };

    // Fetch product template by ID
    const fetchProductTemplate = async (templateId: string) => {
        try {
            const response = await fetch(`/api/product-templates/${templateId}`);
            if (response.ok) {
                const template = await response.json();
                return template;
            }
        } catch (error) {
            console.error('Error fetching product template:', error);
        }
        return null;
    };

    // Fetch plant by ID
    const fetchPlant = async (plantId: string) => {
        try {
            const response = await fetch(`/api/plants/${plantId}`);
            if (response.ok) {
                const plant = await response.json();
                return plant;
            }
        } catch (error) {
            console.error('Error fetching plant:', error);
        }
        return null;
    };

    // Fetch transfer history
    const fetchTransferHistory = async () => {
        if (!address) return;

        try {
            console.log('Fetching transfer history for address:', address);
            const response = await fetch(`/api/transfers?address=${address}`);
            if (response.ok) {
                const transfers = await response.json();
                console.log('Transfer history fetched:', transfers);
                setTransferHistory(transfers);
            } else {
                console.error('Failed to fetch transfer history:', response.statusText);
            }
        } catch (error) {
            console.error('Error fetching transfer history:', error);
        }
    };

    // Load data on component mount
    useEffect(() => {
        const loadData = async () => {
            setIsInitialLoading(true);
            await Promise.all([
                fetchTokenBalances(),
                fetchDatabaseBatches(),
                fetchCustomers(),
                fetchTransferHistory()
            ]);
            setIsInitialLoading(false);
        };

        if (address) {
            loadData();
        }
    }, [address]);

    // Helper functions
    const getDatabaseBatch = (tokenId: number): DatabaseBatch | undefined => {
        return databaseBatches.find(batch => batch.tokenId === tokenId);
    };

    const getExplorerUrl = (txHash: string): string => {
        return `https://testnet.snowtrace.io/tx/${txHash}?chainid=43113`;
    };

    const getContractExplorerUrl = (): string => {
        return `https://testnet.snowtrace.io/address/0xD6B231A6605490E83863D3B71c1C01e4E5B1212D`;
    };

    const formatAddress = (address: string): string => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    // Get database batch by batch number
    const getDatabaseBatchByNumber = (batchNumber: string) => {
        return databaseBatches.find(batch => batch.batchNumber === batchNumber);
    };

    // Token Card Component with dynamic data fetching
    const TokenCard = ({ token, dbBatch }: { token: TokenBalance; dbBatch?: DatabaseBatch }) => {
        const [productTemplate, setProductTemplate] = useState<any>(null);
        const [plant, setPlant] = useState<any>(null);
        const [loading, setLoading] = useState(false);

        useEffect(() => {
            const loadEnrichedData = async () => {
                setLoading(true);
                try {
                    // Fetch batch details first
                    const batchDetails = await fetchBatchDetails(token.batchInfo.batchNumber.toString());

                    if (batchDetails) {
                        // Fetch product template and plant from batch
                        const [template, plantData] = await Promise.all([
                            fetchProductTemplate(batchDetails.templateId),
                            fetchPlant(batchDetails.plantId)
                        ]);

                        console.log('TokenCard - Fetched plant data:', plantData);
                        setProductTemplate(template);
                        setPlant(plantData);
                    }
                } catch (error) {
                    console.error('Error loading enriched data:', error);
                } finally {
                    setLoading(false);
                }
            };

            loadEnrichedData();
        }, [token.tokenId]);

        return (
            <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                    <div className="flex items-start gap-4">
                        {/* Product Image */}
                        <div className="flex-shrink-0">
                            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-muted to-muted/50 border shadow-sm">
                                {productTemplate?.imageUrl ? (
                                    <img
                                        src={productTemplate.imageUrl}
                                        alt={productTemplate.templateName || 'Product'}
                                        className="w-full h-full object-cover transition-transform hover:scale-105"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Package className="h-6 w-6 text-muted-foreground/60" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />
                            </div>
                        </div>

                        {/* Token Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <CardTitle className="text-lg">Token #{token.tokenId}</CardTitle>
                                <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">
                                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                                    Owned
                                </Badge>
                            </div>
                            <CardDescription className="mt-1">
                                Batch #{token.batchInfo.batchNumber}
                                {productTemplate && (
                                    <span className="block text-xs text-muted-foreground mt-1 line-clamp-2">
                                        {productTemplate.templateName}
                                    </span>
                                )}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Balance:</span>
                            <span className="font-medium">{token.balance} / {token.batchInfo.quantity} units</span>
                        </div>
                        {loading ? (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Product:</span>
                                <span className="font-medium">Loading...</span>
                            </div>
                        ) : productTemplate ? (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Product:</span>
                                <span className="font-medium">{productTemplate.templateName}</span>
                            </div>
                        ) : null}
                        {loading ? (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Plant:</span>
                                <span className="font-medium">Loading...</span>
                            </div>
                        ) : plant ? (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Plant:</span>
                                <span className="font-medium">{plant.plantName}</span>
                            </div>
                        ) : null}
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Production Date:</span>
                            <span className="font-medium">
                                {format(new Date(token.batchInfo.productionDate * 1000), "MMM dd, yyyy")}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Carbon Footprint:</span>
                            <span className="font-medium">
                                {((token.batchInfo.carbonFootprint * token.balance / token.batchInfo.quantity) / 1000).toFixed(2)} tons
                            </span>
                        </div>
                        {dbBatch?.txHash && (
                            <div className="p-2 bg-muted rounded-lg">
                                <div className="text-xs text-muted-foreground mb-1">Blockchain Info</div>
                                <div className="text-xs font-mono">
                                    TX: {dbBatch.txHash.slice(0, 10)}...{dbBatch.txHash.slice(-8)}
                                </div>
                            </div>
                        )}

                        <div className="flex gap-2 mt-3">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openBatchModal(token)}
                                className="flex-1"
                            >
                                <Eye className="h-4 w-4 mr-1" />
                                View Details
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => openTransferModal(token)}
                                className="flex-1"
                            >
                                <ArrowRightLeft className="h-4 w-4 mr-1" />
                                Transfer
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    };

    // Token Details Modal Component with dynamic data fetching
    const TokenDetailsModal = ({ token, dbBatch }: { token: TokenBalance; dbBatch?: DatabaseBatch }) => {
        const [productTemplate, setProductTemplate] = useState<any>(null);
        const [plant, setPlant] = useState<any>(null);
        const [loading, setLoading] = useState(false);

        useEffect(() => {
            const loadEnrichedData = async () => {
                setLoading(true);
                try {
                    // Fetch batch details first
                    const batchDetails = await fetchBatchDetails(token.batchInfo.batchNumber.toString());

                    if (batchDetails) {
                        // Fetch product template and plant from batch
                        const [template, plantData] = await Promise.all([
                            fetchProductTemplate(batchDetails.templateId),
                            fetchPlant(batchDetails.plantId)
                        ]);

                        console.log('TokenDetailsModal - Fetched plant data:', plantData);
                        setProductTemplate(template);
                        setPlant(plantData);
                    }
                } catch (error) {
                    console.error('Error loading enriched data for modal:', error);
                } finally {
                    setLoading(false);
                }
            };

            loadEnrichedData();
        }, [token.tokenId]);

        return (
            <div className="space-y-6">
                {/* Token Information */}
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-900 border-b pb-2">Token Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="text-sm font-medium">Token ID</Label>
                            <p className="text-sm text-muted-foreground">#{token.tokenId}</p>
                        </div>
                        <div>
                            <Label className="text-sm font-medium">Your Balance</Label>
                            <p className="text-sm text-muted-foreground">{token.balance} units</p>
                        </div>
                        <div>
                            <Label className="text-sm font-medium">Batch Number</Label>
                            <p className="text-sm text-muted-foreground">#{token.batchInfo.batchNumber}</p>
                        </div>
                        <div>
                            <Label className="text-sm font-medium">Total Quantity</Label>
                            <p className="text-sm text-muted-foreground">{token.batchInfo.quantity} units</p>
                        </div>
                    </div>

                    {/* Digital Product Passport Link */}
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label className="text-sm font-medium text-blue-900">Digital Product Passport</Label>
                                <p className="text-xs text-blue-700 mt-1">
                                    View complete product traceability and sustainability information
                                </p>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                className="border-blue-300 text-blue-700 hover:bg-blue-100"
                                onClick={() => window.open(`/tokens/${token.tokenId}`, '_blank')}
                            >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                View DPP
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Product Information */}
                {loading ? (
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-gray-900 border-b pb-2">Product Information</h4>
                        <div className="text-sm text-muted-foreground">Loading product details...</div>
                    </div>
                ) : productTemplate ? (
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-gray-900 border-b pb-2">Product Information</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-sm font-medium">Product Name</Label>
                                <p className="text-sm text-muted-foreground">{productTemplate.templateName}</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium">Category</Label>
                                <p className="text-sm text-muted-foreground">{productTemplate.category}</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium">Carbon per Unit</Label>
                                <p className="text-sm text-muted-foreground">{productTemplate.specifications.carbonFootprintPerUnit} tons CO₂/unit</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium">Raw Material</Label>
                                <p className="text-sm text-muted-foreground">{productTemplate.specifications.isRawMaterial ? 'Yes' : 'No'}</p>
                            </div>
                        </div>
                        {productTemplate.description && (
                            <div>
                                <Label className="text-sm font-medium">Description</Label>
                                <p className="text-sm text-muted-foreground">{productTemplate.description}</p>
                            </div>
                        )}
                    </div>
                ) : null}

                {/* Plant Information */}
                {loading ? (
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-gray-900 border-b pb-2">Manufacturing Plant</h4>
                        <div className="text-sm text-muted-foreground">Loading plant details...</div>
                    </div>
                ) : plant ? (
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-gray-900 border-b pb-2">Manufacturing Plant</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-sm font-medium">Plant Name</Label>
                                <p className="text-sm text-muted-foreground">{plant.plantName}</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium">Location</Label>
                                <p className="text-sm text-muted-foreground">
                                    {plant.location?.coordinates?.latitude && plant.location?.coordinates?.longitude
                                        ? `${plant.location.coordinates.latitude.toFixed(4)}, ${plant.location.coordinates.longitude.toFixed(4)}`
                                        : plant.location?.city && plant.location?.country
                                            ? `${plant.location.city}, ${plant.location.country}`
                                            : 'Location not available'
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                ) : null}

                {/* Batch Details */}
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-900 border-b pb-2">Batch Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="text-sm font-medium">Production Date</Label>
                            <p className="text-sm text-muted-foreground">
                                {format(new Date(token.batchInfo.productionDate * 1000), "MMM dd, yyyy")}
                            </p>
                        </div>
                        <div>
                            <Label className="text-sm font-medium">Manufacturer</Label>
                            <div className="flex items-center gap-2 mt-1">
                                <p className="text-sm text-muted-foreground font-mono">
                                    {formatAddress(token.batchInfo.manufacturer)}
                                </p>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 px-2 text-xs"
                                    onClick={() => window.open(`https://testnet.snowtrace.io/address/${token.batchInfo.manufacturer}`, '_blank')}
                                >
                                    <ExternalLink className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Environmental Impact */}
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-900 border-b pb-2">Environmental Impact</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="text-sm font-medium">Your Carbon Footprint</Label>
                            <p className="text-sm text-muted-foreground">
                                {((token.batchInfo.carbonFootprint * token.balance / token.batchInfo.quantity) / 1000).toFixed(2)} tons CO₂
                            </p>
                        </div>
                        <div>
                            <Label className="text-sm font-medium">Total Batch Carbon</Label>
                            <p className="text-sm text-muted-foreground">
                                {(token.batchInfo.carbonFootprint / 1000).toFixed(2)} tons CO₂
                            </p>
                        </div>
                    </div>
                </div>

                {/* Blockchain Information */}
                {dbBatch?.txHash && (
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-gray-900 border-b pb-2">Blockchain Information</h4>
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="text-xs font-medium text-green-800 mb-2">Transaction Hash</div>
                            <div className="flex items-center justify-between">
                                <code className="text-xs bg-white px-2 py-1 rounded border font-mono">
                                    {dbBatch.txHash.slice(0, 10)}...{dbBatch.txHash.slice(-8)}
                                </code>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-6 px-2 text-xs"
                                    onClick={() => dbBatch.txHash && window.open(getExplorerUrl(dbBatch.txHash), '_blank')}
                                >
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    View on Explorer
                                </Button>
                            </div>
                            {dbBatch.blockNumber && (
                                <div className="mt-2">
                                    <div className="text-xs text-green-700">Block Number: {dbBatch.blockNumber}</div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Transfer functions
    const handleTransfer = async () => {
        if (!selectedToken || !address) return;

        setIsLoading(true);
        try {
            // Ensure contract is initialized
            if (!smartContractService.isInitialized()) {
                await smartContractService.initialize();
            }

            console.log('Initiating transfer:', {
                to: transferData.to,
                tokenId: selectedToken.tokenId,
                quantity: transferData.quantity,
                reason: transferData.reason
            });

            const result = await smartContractService.transferTokens(
                transferData.to,
                selectedToken.tokenId,
                parseInt(transferData.quantity),
                transferData.reason
            );

            console.log('Transfer result:', result);

            // Save transfer record to database
            try {
                const transferResponse = await fetch('/api/transfers', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        fromAddress: address,
                        toAddress: transferData.to,
                        tokenId: selectedToken.tokenId,
                        quantity: parseInt(transferData.quantity),
                        reason: transferData.reason,
                        txHash: result.txHash,
                        blockNumber: undefined, // Will be updated later if needed
                        gasUsed: result.gasUsed,
                        status: 'confirmed'
                    }),
                });

                if (!transferResponse.ok) {
                    console.error('Failed to save transfer record:', await transferResponse.text());
                } else {
                    console.log('Transfer record saved successfully');
                }
            } catch (dbError) {
                console.error('Error saving transfer record:', dbError);
                // Don't fail the entire transfer if DB save fails
            }

            toast.success(`Transfer successful! Transaction: ${result.txHash.slice(0, 10)}...`);

            // Refresh token balances and transfer history
            await Promise.all([
                fetchTokenBalances(),
                fetchTransferHistory()
            ]);

            // Close modal and reset form
            setShowTransferModal(false);
            setTransferData({ to: "", quantity: "", reason: "" });
            setSelectedToken(null);

        } catch (error: any) {
            console.error('Transfer error:', error);

            // Check if it's a user rejection error
            if (error.message?.includes('user rejected') || error.code === 4001) {
                toast.error('Transfer cancelled by user');
            } else if (error.message?.includes('insufficient funds')) {
                toast.error('Insufficient funds for gas');
            } else if (error.message?.includes('network')) {
                toast.error('Network error. Please check your connection.');
            } else {
                toast.error(`Transfer failed: ${error.message || 'Unknown error'}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const openTransferModal = (token: TokenBalance) => {
        setSelectedToken(token);
        setTransferData({ to: "", quantity: "", reason: "" });
        setShowTransferModal(true);
    };

    const openBatchModal = (token: TokenBalance) => {
        setSelectedToken(token);
        setShowBatchModal(true);
    };

    // Filter tokens based on search
    const filteredTokens = tokenBalances.filter(token => {
        const batch = getDatabaseBatch(token.tokenId);
        const searchLower = searchTerm.toLowerCase();

        return (
            token.batchInfo.batchNumber.toString().includes(searchLower) ||
            token.batchInfo.templateId.toLowerCase().includes(searchLower) ||
            (batch && batch.batchNumber.toLowerCase().includes(searchLower))
        );
    });

    if (isInitialLoading) {
        return (
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <PageHeaderSkeleton />
                <SearchBarSkeleton />
                <TokenCardsSkeleton />
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            {/* Header */}
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Token Inventory</h2>
                    <p className="text-muted-foreground">
                        Manage your blockchain-anchored product tokens
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        onClick={async () => {
                            try {
                                console.log('=== DEBUGGING TOKEN INVENTORY ===');
                                console.log('Wallet address:', address);

                                await smartContractService.initialize();
                                console.log('Smart contract service initialized');

                                // Test basic contract connection
                                const currentTokenId = await smartContractService.getCurrentTokenId();
                                console.log('Current token ID counter:', currentTokenId);

                                // Get all minted tokens
                                const allTokens = await smartContractService.getAllMintedTokens();
                                console.log('All minted tokens:', allTokens);

                                // Get user balances
                                if (address) {
                                    const userBalances = await smartContractService.getUserTokenBalances(address);
                                    console.log('User token balances:', userBalances);
                                }

                                toast.success(`Found ${allTokens.length} minted tokens. Check console for details.`);
                            } catch (error) {
                                console.error('Debug error:', error);
                                toast.error(`Debug failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                            }
                        }}
                    >
                        <Package className="h-4 w-4 mr-2" />
                        Debug
                    </Button>
                    <Button onClick={() => Promise.all([fetchTokenBalances(), fetchDatabaseBatches(), fetchCustomers(), fetchTransferHistory()])}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                    <SidebarTrigger />
                </div>
            </div>

            {/* Network Status */}
            <NetworkStatus />

            {/* Search */}
            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search tokens..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{tokenBalances.length}</div>
                        <p className="text-xs text-muted-foreground">
                            Unique token types
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {tokenBalances.reduce((sum, token) => sum + token.balance, 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Total token units
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Carbon Footprint</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {(tokenBalances.reduce((sum, token) => sum + (token.batchInfo.carbonFootprint * token.balance / token.batchInfo.quantity), 0) / 1000).toFixed(2)} tons
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Total CO₂ footprint
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Inward Inventory</CardTitle>
                        <ArrowDownToLine className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{tokenBalances.length}</div>
                        <p className="text-xs text-muted-foreground">
                            Active token types
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Transfer History</CardTitle>
                        <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{transferHistory.length}</div>
                        <p className="text-xs text-muted-foreground">
                            Total transactions
                        </p>
                    </CardContent>
                </Card>
            </div>


            {/* Token Inventory with Tabs */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Token Inventory
                    </CardTitle>
                    <CardDescription>
                        Manage your blockchain tokens and view transfer history
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="tokens" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="tokens" className="flex items-center gap-2">
                                <Package className="h-4 w-4" />
                                My Tokens
                            </TabsTrigger>
                            <TabsTrigger value="transfers" className="flex items-center gap-2">
                                <ArrowRightLeft className="h-4 w-4" />
                                Transfer History
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="tokens" className="mt-6">
                            {/* Token List Content - Move existing token list here */}
                            {filteredTokens.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No tokens found</p>
                                    <p className="text-sm">
                                        {tokenBalances.length === 0
                                            ? "You don't have any tokens yet. Create batches from the Product Templates page to mint tokens."
                                            : "No tokens match your current search."}
                                    </p>
                                    {tokenBalances.length === 0 && (
                                        <Button onClick={() => window.location.href = '/dashboard/products'} className="mt-4">
                                            <Package className="h-4 w-4 mr-2" />
                                            Create Your First Batch
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {filteredTokens.map((token) => {
                                        const dbBatch = getDatabaseBatch(token.tokenId);
                                        return <TokenCard key={token.tokenId} token={token} dbBatch={dbBatch} />;
                                    })}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="transfers" className="mt-6">
                            {transferHistory.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <ArrowRightLeft className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No transfer transactions found</p>
                                    <p className="text-sm">Transfer tokens to see transaction history here</p>
                                </div>
                            ) : (
                                <div className="border rounded-lg">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[100px]">Status</TableHead>
                                                <TableHead>Token</TableHead>
                                                <TableHead>From</TableHead>
                                                <TableHead>To</TableHead>
                                                <TableHead>Quantity</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead className="w-[100px]">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {transferHistory
                                                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                                .map((transfer) => {
                                                    const dbBatch = getDatabaseBatch(transfer.tokenId);
                                                    return (
                                                        <TableRow key={transfer._id?.toString() || transfer.txHash}>
                                                            <TableCell>
                                                                <Badge
                                                                    variant={
                                                                        transfer.status === 'confirmed' ? 'default' :
                                                                            transfer.status === 'pending' ? 'secondary' :
                                                                                'destructive'
                                                                    }
                                                                    className="text-xs"
                                                                >
                                                                    {transfer.status}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium">Token #{transfer.tokenId}</span>
                                                                    {dbBatch && (
                                                                        <span className="text-xs text-muted-foreground">
                                                                            Batch #{dbBatch.batchNumber}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="font-mono text-sm">
                                                                    {formatAddress(transfer.fromAddress)}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="font-mono text-sm">
                                                                    {formatAddress(transfer.toAddress)}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium">{transfer.quantity}</span>
                                                                    {dbBatch && (
                                                                        <span className="text-xs text-muted-foreground">
                                                                            {(dbBatch.carbonFootprint / 1000).toFixed(2)} tons CO₂
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm">
                                                                        {format(new Date(transfer.createdAt), 'MMM dd, yyyy')}
                                                                    </span>
                                                                    <span className="text-xs text-muted-foreground">
                                                                        {format(new Date(transfer.createdAt), 'HH:mm')}
                                                                    </span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2">
                                                                    {transfer.reason && (
                                                                        <TooltipProvider>
                                                                            <Tooltip>
                                                                                <TooltipTrigger asChild>
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="sm"
                                                                                        className="h-8 w-8 p-0"
                                                                                    >
                                                                                        <Eye className="h-3 w-3" />
                                                                                    </Button>
                                                                                </TooltipTrigger>
                                                                                <TooltipContent>
                                                                                    <p className="max-w-xs">{transfer.reason}</p>
                                                                                </TooltipContent>
                                                                            </Tooltip>
                                                                        </TooltipProvider>
                                                                    )}
                                                                    <TooltipProvider>
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    onClick={() => window.open(getExplorerUrl(transfer.txHash), '_blank')}
                                                                                    className="h-8 w-8 p-0"
                                                                                >
                                                                                    <ExternalLink className="h-3 w-3" />
                                                                                </Button>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent>
                                                                                <p>View on Explorer</p>
                                                                            </TooltipContent>
                                                                        </Tooltip>
                                                                    </TooltipProvider>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Transfer Modal */}
            <Dialog open={showTransferModal} onOpenChange={setShowTransferModal}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Transfer Tokens</DialogTitle>
                        <DialogDescription>
                            Transfer Token #{selectedToken?.tokenId} to a customer
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="customer">Select Customer *</Label>
                            <Select
                                value={transferData.to}
                                onValueChange={(value) => setTransferData(prev => ({ ...prev, to: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose a customer to transfer to" />
                                </SelectTrigger>
                                <SelectContent>
                                    {customers.length === 0 ? (
                                        <SelectItem value="no-customers" disabled>
                                            No customers found. Add customers in Partners page.
                                        </SelectItem>
                                    ) : (
                                        customers.map((customer) => (
                                            <SelectItem key={customer._id?.toString()} value={customer.companyAddress}>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">
                                                        {customer.companyName || 'Unknown Company'}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {customer.companyAddress.slice(0, 6)}...{customer.companyAddress.slice(-4)}
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                            {customers.length === 0 && (
                                <p className="text-xs text-amber-600">
                                    No customers found. Please add customers in the Partners page first.
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="quantity">Quantity *</Label>
                            <Input
                                id="quantity"
                                type="number"
                                value={transferData.quantity}
                                onChange={(e) => setTransferData(prev => ({ ...prev, quantity: e.target.value }))}
                                placeholder="Enter quantity"
                                min="1"
                                max={selectedToken?.balance || 0}
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                Available balance: {selectedToken?.balance || 0} units
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="reason">Transfer Reason</Label>
                            <Textarea
                                id="reason"
                                value={transferData.reason}
                                onChange={(e) => setTransferData(prev => ({ ...prev, reason: e.target.value }))}
                                placeholder="e.g., Product delivery, Customer order fulfillment"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowTransferModal(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleTransfer}
                            disabled={isLoading || !transferData.to || transferData.to === "no-customers" || !transferData.quantity || parseInt(transferData.quantity) > (selectedToken?.balance || 0) || customers.length === 0}
                        >
                            {isLoading ? (
                                <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Transferring...
                                </>
                            ) : (
                                <>
                                    <ArrowRightLeft className="h-4 w-4 mr-2" />
                                    Transfer Tokens
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Batch Details Modal */}
            <Dialog open={showBatchModal} onOpenChange={setShowBatchModal}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Token Details - #{selectedToken?.tokenId}</DialogTitle>
                        <DialogDescription>
                            Complete information about this blockchain-anchored batch
                        </DialogDescription>
                    </DialogHeader>
                    {selectedToken && (
                        <TokenDetailsModal
                            token={selectedToken}
                            dbBatch={getDatabaseBatch(selectedToken.tokenId)}
                        />
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowBatchModal(false)}>
                            Close
                        </Button>
                        <Button onClick={() => {
                            setShowBatchModal(false);
                            openTransferModal(selectedToken!);
                        }}>
                            <ArrowRightLeft className="h-4 w-4 mr-2" />
                            Transfer Tokens
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
