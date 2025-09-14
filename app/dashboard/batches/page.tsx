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
import {
    Package,
    Search,
    Factory,
    ExternalLink,
    CheckCircle,
    Clock,
    AlertCircle,
    RefreshCw,
    Coins,
    TrendingUp,
    Calendar
} from "lucide-react";
import { toast } from "sonner";
import { NetworkStatus } from "@/components/network-status";
import { smartContractService } from "@/lib/smart-contract";
import { format } from "date-fns";
import { ProductBatch, ProductTemplate, Plant, BatchComponent } from "@/lib/models";

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

const BatchCardsSkeleton = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
                <CardHeader>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                </CardContent>
            </Card>
        ))}
    </div>
);

interface EnrichedBatch extends ProductBatch {
    template?: ProductTemplate;
    plant?: Plant;
}

export default function BatchesPage() {
    const { address } = useWallet();
    const [batches, setBatches] = useState<EnrichedBatch[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedBatch, setSelectedBatch] = useState<EnrichedBatch | null>(null);
    const [showMintModal, setShowMintModal] = useState(false);
    const [isMinting, setIsMinting] = useState(false);

    // Fetch batches
    const fetchBatches = async () => {
        if (!address) return;

        try {
            console.log('Fetching batches for address:', address);
            const response = await fetch(`/api/product-batches?manufacturerAddress=${address}`);
            if (response.ok) {
                const batchData = await response.json();
                console.log('Batches fetched:', batchData);

                // Enrich batches with template and plant data
                const enrichedBatches = await Promise.all(
                    batchData.map(async (batch: ProductBatch) => {
                        const [template, plant] = await Promise.all([
                            fetchProductTemplate(batch.templateId),
                            fetchPlant(batch.plantId.toString())
                        ]);

                        return {
                            ...batch,
                            template,
                            plant
                        };
                    })
                );

                setBatches(enrichedBatches);
            } else {
                console.error('Failed to fetch batches:', response.statusText);
            }
        } catch (error) {
            console.error('Error fetching batches:', error);
        }
    };

    // Fetch product template by ID
    const fetchProductTemplate = async (templateId: string) => {
        try {
            const response = await fetch(`/api/product-templates/${templateId}`);
            if (response.ok) {
                return await response.json();
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
                return await response.json();
            }
        } catch (error) {
            console.error('Error fetching plant:', error);
        }
        return null;
    };

    // Load data on component mount
    useEffect(() => {
        const loadData = async () => {
            setIsInitialLoading(true);
            await fetchBatches();
            setIsInitialLoading(false);
        };

        if (address) {
            loadData();
        }
    }, [address]);

    // Helper functions
    const getExplorerUrl = (txHash: string): string => {
        return `https://testnet.snowtrace.io/tx/${txHash}?chainid=43113`;
    };

    const formatAddress = (address: string): string => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    // Mint tokens for a batch
    const handleMintTokens = async () => {
        if (!selectedBatch || !address) return;

        setIsMinting(true);
        try {
            console.log('Starting token minting for batch:', selectedBatch);

            // Initialize smart contract service
            await smartContractService.initialize();

            // Validate and prepare minting parameters
            const batchNumber = parseInt(selectedBatch.batchNumber);
            const quantity = selectedBatch.quantity;

            if (isNaN(batchNumber) || batchNumber <= 0) {
                throw new Error('Invalid batch number. Please enter a valid positive number.');
            }

            if (quantity <= 0) {
                throw new Error('Invalid quantity. Please enter a valid positive number.');
            }

            // Calculate carbon footprint (convert from tons to kg by multiplying by 1000)
            const totalCarbonFootprintKg = Math.round(selectedBatch.carbonFootprint * 1000);

            console.log('Carbon footprint calculation (tons to kg):', {
                carbonFootprintTons: selectedBatch.carbonFootprint,
                totalCarbonFootprintKg
            });

            const mintParams = {
                batchNumber,
                templateId: selectedBatch.templateId,
                quantity,
                productionDate: Math.floor(new Date(selectedBatch.productionDate).getTime() / 1000), // Unix timestamp
                expiryDate: selectedBatch.expiryDate ? Math.floor(new Date(selectedBatch.expiryDate).getTime() / 1000) : 0,
                carbonFootprint: totalCarbonFootprintKg,
                plantId: selectedBatch.plantId.toString(),
                metadataURI: `${window.location.origin}/api/metadata/${batchNumber}`
            };

            console.log('Minting batch tokens with params:', mintParams);

            // Burn component tokens if this batch uses components
            let consumedComponents: any[] = [];
            if (selectedBatch.components && selectedBatch.components.length > 0) {
                console.log('Burning component tokens:', selectedBatch.components);

                for (const component of selectedBatch.components) {
                    console.log(`Burning ${component.quantity} tokens of Token ID ${component.tokenId}`);

                    const burnResult = await smartContractService.burnComponentTokens(
                        component.tokenId,
                        component.quantity,
                        `Component consumption for batch ${selectedBatch.batchNumber}`
                    );

                    console.log(`Burned component tokens:`, burnResult);

                    // Track consumed component for database update
                    consumedComponents.push({
                        tokenId: component.tokenId,
                        burnTxHash: burnResult.txHash
                    });
                }

                toast.success(`Burned ${selectedBatch.components.length} component token types`);
            }

            // Mint tokens
            const mintResult = await smartContractService.mintBatch(mintParams);

            console.log('Mint result:', mintResult);

            // Update the batch with token information
            const updateResponse = await fetch(`/api/product-batches/${selectedBatch._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    tokenId: mintResult.tokenId,
                    txHash: mintResult.txHash,
                    blockNumber: undefined, // Will be filled later
                    consumedComponents: consumedComponents
                }),
            });

            if (updateResponse.ok) {
                toast.success(`Tokens minted successfully! Token ID: ${mintResult.tokenId}`);
                // Refresh batches to show updated status
                await fetchBatches();
            } else {
                toast.warning('Tokens minted but failed to update batch with token information');
            }

            // Close modal
            setShowMintModal(false);
            setSelectedBatch(null);

        } catch (error: any) {
            console.error('Minting error:', error);

            // Check if it's a user rejection error
            if (error.message?.includes('user rejected') || error.code === 4001) {
                toast.error('Minting cancelled by user');
            } else if (error.message?.includes('insufficient funds')) {
                toast.error('Insufficient funds for gas');
            } else if (error.message?.includes('network')) {
                toast.error('Network error. Please check your connection.');
            } else if (error.message?.includes('Batch already exists')) {
                toast.error('A batch with this number already exists on the blockchain.');
            } else {
                toast.error(`Minting failed: ${error.message || 'Unknown error'}`);
            }
        } finally {
            setIsMinting(false);
        }
    };

    const openMintModal = (batch: EnrichedBatch) => {
        setSelectedBatch(batch);
        setShowMintModal(true);
    };

    // Filter batches based on search and minting status
    const filteredBatches = batches.filter(batch => {
        const searchLower = searchTerm.toLowerCase();
        const templateName = batch.template?.templateName || '';
        const batchNumber = batch.batchNumber || '';

        return (
            batchNumber.toLowerCase().includes(searchLower) ||
            templateName.toLowerCase().includes(searchLower)
        );
    });

    // Separate minted and unminted batches
    const mintedBatches = filteredBatches.filter(batch => batch.tokenId);
    const unmintedBatches = filteredBatches.filter(batch => !batch.tokenId);

    if (isInitialLoading) {
        return (
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <PageHeaderSkeleton />
                <SearchBarSkeleton />
                <BatchCardsSkeleton />
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            {/* Header */}
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Product Batches</h2>
                    <p className="text-muted-foreground">
                        Manage your production batches and mint blockchain tokens
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button onClick={fetchBatches}>
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
                        placeholder="Search batches..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{batches.length}</div>
                        <p className="text-xs text-muted-foreground">
                            All production batches
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Minted Tokens</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{mintedBatches.length}</div>
                        <p className="text-xs text-muted-foreground">
                            Blockchain-anchored
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Minting</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">{unmintedBatches.length}</div>
                        <p className="text-xs text-muted-foreground">
                            Awaiting tokens
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Carbon</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {batches.reduce((sum, batch) => sum + batch.carbonFootprint, 0).toFixed(2)} tons
                        </div>
                        <p className="text-xs text-muted-foreground">
                            CO₂ footprint
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Pending Minting Section */}
            {unmintedBatches.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-orange-600" />
                        <h3 className="text-lg font-semibold">Pending Token Minting</h3>
                        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                            {unmintedBatches.length} batches
                        </Badge>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {unmintedBatches.map((batch) => (
                            <Card key={batch._id?.toString()} className="border-orange-200">
                                <CardHeader>
                                    <div className="flex items-start gap-4">
                                        {/* Product Image */}
                                        <div className="flex-shrink-0">
                                            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-muted to-muted/50 border shadow-sm">
                                                {batch.template?.imageUrl ? (
                                                    <img
                                                        src={batch.template.imageUrl}
                                                        alt={batch.template?.templateName || 'Product'}
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

                                        {/* Batch Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <CardTitle className="text-lg">Batch #{batch.batchNumber}</CardTitle>
                                                <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                                                    <Clock className="h-3 w-3 mr-1" />
                                                    Pending
                                                </Badge>
                                            </div>
                                            <CardDescription className="line-clamp-2">
                                                {batch.template?.templateName || 'Unknown Template'}
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <Label className="text-muted-foreground">Quantity</Label>
                                            <p className="font-medium">{batch.quantity} units</p>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground">Carbon Footprint</Label>
                                            <p className="font-medium">{batch.carbonFootprint.toFixed(2)} tons CO₂</p>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground">Production Date</Label>
                                            <p className="font-medium">{format(new Date(batch.productionDate), 'MMM dd, yyyy')}</p>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground">Plant</Label>
                                            <p className="font-medium">{batch.plant?.plantName || 'Unknown'}</p>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => openMintModal(batch)}
                                        className="w-full"
                                        disabled={isMinting}
                                    >
                                        <Coins className="h-4 w-4 mr-2" />
                                        Mint Tokens
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Minted Batches Section */}
            {mintedBatches.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <h3 className="text-lg font-semibold">Minted Batches</h3>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                            {mintedBatches.length} batches
                        </Badge>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {mintedBatches.map((batch) => (
                            <Card key={batch._id?.toString()} className="border-green-200">
                                <CardHeader>
                                    <div className="flex items-start gap-4">
                                        {/* Product Image */}
                                        <div className="flex-shrink-0">
                                            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-muted to-muted/50 border shadow-sm">
                                                {batch.template?.imageUrl ? (
                                                    <img
                                                        src={batch.template.imageUrl}
                                                        alt={batch.template?.templateName || 'Product'}
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

                                        {/* Batch Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <CardTitle className="text-lg">Batch #{batch.batchNumber}</CardTitle>
                                                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                    Minted
                                                </Badge>
                                            </div>
                                            <CardDescription className="line-clamp-2">
                                                {batch.template?.templateName || 'Unknown Template'}
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <Label className="text-muted-foreground">Token ID</Label>
                                            <p className="font-medium">#{batch.tokenId}</p>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground">Quantity</Label>
                                            <p className="font-medium">{batch.quantity} units</p>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground">Carbon Footprint</Label>
                                            <p className="font-medium">{batch.carbonFootprint.toFixed(2)} tons CO₂</p>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground">Plant</Label>
                                            <p className="font-medium">{batch.plant?.plantName || 'Unknown'}</p>
                                        </div>
                                    </div>
                                    {batch.txHash && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => window.open(getExplorerUrl(batch.txHash!), '_blank')}
                                            className="w-full"
                                        >
                                            <ExternalLink className="h-3 w-3 mr-1" />
                                            View on Explorer
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {batches.length === 0 && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Package className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No batches found</h3>
                        <p className="text-muted-foreground text-center mb-4">
                            Create your first product batch from the Product Templates page to get started.
                        </p>
                        <Button onClick={() => window.location.href = '/dashboard/products'}>
                            <Factory className="h-4 w-4 mr-2" />
                            Create First Batch
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Mint Modal */}
            <Dialog open={showMintModal} onOpenChange={setShowMintModal}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <div className="flex items-center gap-4">
                            {/* Product Image */}
                            {selectedBatch?.template?.imageUrl && (
                                <div className="flex-shrink-0">
                                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-muted to-muted/50 border shadow-sm">
                                        <img
                                            src={selectedBatch.template.imageUrl}
                                            alt={selectedBatch.template?.templateName || 'Product'}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />
                                    </div>
                                </div>
                            )}

                            {/* Title and Description */}
                            <div className="flex-1 min-w-0">
                                <DialogTitle>Mint Blockchain Tokens</DialogTitle>
                                <DialogDescription>
                                    Mint ERC-1155 tokens for Batch #{selectedBatch?.batchNumber}
                                    {selectedBatch?.template?.templateName && (
                                        <span className="block text-xs text-muted-foreground mt-1">
                                            {selectedBatch.template.templateName}
                                        </span>
                                    )}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    {selectedBatch && (
                        <div className="space-y-4">
                            <div className="p-4 bg-muted rounded-lg">
                                <h4 className="font-medium mb-3">Batch Details</h4>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <Label className="text-muted-foreground">Template</Label>
                                        <p className="font-medium">{selectedBatch.template?.templateName}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Quantity</Label>
                                        <p className="font-medium">{selectedBatch.quantity} units</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Carbon Footprint</Label>
                                        <p className="font-medium">{(selectedBatch.carbonFootprint / 1000).toFixed(3)} tons CO₂</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Plant</Label>
                                        <p className="font-medium">{selectedBatch.plant?.plantName}</p>
                                    </div>
                                </div>

                                {/* Component Information */}
                                {selectedBatch.components && selectedBatch.components.length > 0 && (
                                    <div className="mt-4 pt-4 border-t">
                                        <h5 className="font-medium mb-2 text-sm">Components Used</h5>
                                        <div className="space-y-2">
                                            {selectedBatch.components.map((component, index) => (
                                                <div key={index} className={`flex items-center justify-between p-2 rounded border text-xs ${component.consumed ? 'bg-green-50 border-green-200' : 'bg-background'
                                                    }`}>
                                                    <div className="flex items-center gap-2">
                                                        <Package className={`h-3 w-3 ${component.consumed ? 'text-green-600' : 'text-muted-foreground'}`} />
                                                        <span className="font-medium">Token #{component.tokenId}</span>
                                                        <span className="text-muted-foreground">({component.tokenName})</span>
                                                        {component.consumed && (
                                                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                                                Consumed
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3 text-muted-foreground">
                                                        <span>{component.quantity} units</span>
                                                        <span>{(component.carbonFootprint / 1000).toFixed(3)} tons CO₂</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                                    <div className="text-sm text-blue-800">
                                        <p className="font-medium mb-1">Blockchain Minting</p>
                                        <p>This will create ERC-1155 tokens on Avalanche Fuji testnet. You'll need to approve the transaction in your wallet.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowMintModal(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleMintTokens}
                            disabled={isMinting}
                        >
                            {isMinting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                    Minting...
                                </>
                            ) : (
                                <>
                                    <Coins className="h-4 w-4 mr-2" />
                                    Mint Tokens
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
