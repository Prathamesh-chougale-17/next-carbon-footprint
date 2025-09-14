"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
    Package,
    Factory,
    Calendar,
    MapPin,
    ExternalLink,
    Leaf,
    Users,
    Hash,
    Scale,
    Thermometer,
    QrCode,
    Download,
    Share2,
    Shield,
    CheckCircle,
    Globe,
    Clock,
    Building2
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import SupplyChainMap from "@/components/supply-chain-map";
import ProductTreeViewer from "@/components/ProductTreeViewer";
import { QRCode } from "@/components/ui/kibo-ui/qr-code";

interface TokenDetails {
    tokenId: number;
    batch: ProductBatch;
    product: ProductTemplate;
    plant: Plant;
    components?: ComponentDetails[];
    supplyChainLocations?: SupplyChainLocation[];
}

interface SupplyChainLocation {
    lat: number;
    lng: number;
    name: string;
    type: 'Manufacturing' | 'Raw Material' | 'Component' | 'Final Product';
    transport?: 'Road' | 'Sea' | 'Rail' | 'Air';
    carbonFootprint?: number;
    quantity?: number;
}

interface ComponentDetails {
    batch: ProductBatch;
    product: ProductTemplate;
    plant: Plant;
    components?: ComponentDetails[];
}

interface ProductBatch {
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
    components?: BatchComponent[];
}

interface ProductTemplate {
    _id: string;
    templateName: string;
    description: string;
    category: string;
    specifications: {
        weight: number;
        carbonFootprintPerUnit: number;
    };
    imageUrl?: string;
    isRawMaterial: boolean;
}

interface Plant {
    _id: string;
    plantName: string;
    location: {
        city?: string;
        country?: string;
        coordinates?: {
            latitude: number;
            longitude: number;
        };
    };
}

interface BatchComponent {
    tokenId: number;
    tokenName: string;
    quantity: number;
    carbonFootprint: number;
    consumed?: boolean;
    burnTxHash?: string;
}

export default function DigitalProductPassport() {
    const params = useParams();
    const tokenId = params.tokenId as string;

    const [tokenDetails, setTokenDetails] = useState<TokenDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dppUrl, setDppUrl] = useState<string>("");

    useEffect(() => {
        const fetchTokenDetails = async () => {
            try {
                setIsLoading(true);
                const response = await fetch(`/api/tokens/${tokenId}`);

                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error('Token not found');
                    }
                    throw new Error('Failed to fetch token details');
                }

                const data = await response.json();
                setTokenDetails(data);

                // Set the DPP URL for QR code
                const currentUrl = window.location.href;
                setDppUrl(currentUrl);
            } catch (error) {
                console.error('Error fetching token details:', error);
                setError(error instanceof Error ? error.message : 'Unknown error');
                toast.error('Failed to load token details');
            } finally {
                setIsLoading(false);
            }
        };

        if (tokenId) {
            fetchTokenDetails();
        }
    }, [tokenId]);

    const formatAddress = (address: string): string => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const getExplorerUrl = (txHash: string): string => {
        return `https://testnet.snowtrace.io/tx/${txHash}?chainid=43113`;
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Digital Product Passport - ${product?.templateName}`,
                    text: `View the complete supply chain and carbon footprint for ${product?.templateName}`,
                    url: dppUrl,
                });
            } catch (error) {
                console.error('Error sharing:', error);
            }
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(dppUrl);
            toast.success('Link copied to clipboard');
        }
    };

    const handleDownloadQR = () => {
        const qrElement = document.querySelector('[data-qr-code]');
        if (qrElement) {
            const svg = qrElement.querySelector('svg');
            if (svg) {
                const svgData = new XMLSerializer().serializeToString(svg);
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const img = new Image();

                img.onload = () => {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx?.drawImage(img, 0, 0);

                    const link = document.createElement('a');
                    link.download = `dpp-qr-${tokenId}.png`;
                    link.href = canvas.toDataURL();
                    link.click();
                };

                img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
            }
        }
    };

    if (isLoading) {
        return (
            <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
                <div className="text-center">
                    <Skeleton className="h-8 w-48 mx-auto mb-2" />
                    <Skeleton className="h-4 w-64 mx-auto" />
                </div>
                <div className="max-w-4xl mx-auto space-y-6">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
            </div>
        );
    }

    if (error || !tokenDetails) {
        return (
            <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold">Digital Product Passport</h1>
                    <p className="text-muted-foreground">
                        Sustainable Supply Chain Transparency
                    </p>
                </div>
                <div className="max-w-4xl mx-auto">
                    <Card className="border-red-200">
                        <CardContent className="p-8 text-center">
                            <Package className="h-12 w-12 mx-auto mb-4 text-red-500" />
                            <h2 className="text-xl font-semibold mb-2">Token Not Found</h2>
                            <p className="text-muted-foreground">
                                {error || 'The requested token could not be found.'}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    const { batch, product, plant, components, supplyChainLocations } = tokenDetails;

    return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-3xl font-bold">Digital Product Passport</h1>
                <p className="text-muted-foreground">
                    Sustainable Supply Chain Transparency
                </p>
            </div>

            <div className="max-w-4xl mx-auto space-y-6">
                {/* Passport Header */}
                <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                {product.imageUrl ? (
                                    <img
                                        src={product.imageUrl}
                                        alt={product.templateName}
                                        className="w-16 h-16 rounded-lg object-cover border-2 border-white shadow-sm"
                                    />
                                ) : (
                                    <div className="w-16 h-16 rounded-lg bg-muted border-2 border-white shadow-sm flex items-center justify-center">
                                        <Package className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                )}
                                <div>
                                    <CardTitle className="text-2xl text-blue-900">{product.templateName}</CardTitle>
                                    <CardDescription className="text-blue-700">
                                        Token #{tokenDetails.tokenId} • Batch #{batch.batchNumber}
                                    </CardDescription>
                                    <div className="flex gap-4 mt-2">
                                        <Badge variant="secondary" className="bg-white text-blue-900 border-blue-300">
                                            <Hash className="h-3 w-3 mr-1" />
                                            {product.category}
                                        </Badge>
                                        <Badge variant={product.isRawMaterial ? "default" : "outline"} className="bg-white text-blue-900 border-blue-300">
                                            <Leaf className="h-3 w-3 mr-1" />
                                            {product.isRawMaterial ? "Raw Material" : "Manufactured Product"}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-shrink-0">
                                <QRCode
                                    data={dppUrl}
                                    className="w-32 h-32"
                                />
                            </div>
                        </div>
                    </CardHeader>
                </Card>


                {/* Product Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Product Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-medium mb-2">Product Details</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Name:</span>
                                        <span className="font-medium">{product.templateName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Category:</span>
                                        <span className="font-medium">{product.category}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Weight:</span>
                                        <span className="font-medium">{product.specifications.weight} kg</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Carbon per Unit:</span>
                                        <span className="font-medium">{product.specifications.carbonFootprintPerUnit} tons CO₂</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-medium mb-2">Batch Details</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Batch Number:</span>
                                        <span className="font-medium">#{batch.batchNumber}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Quantity:</span>
                                        <span className="font-medium">{batch.quantity} units</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Production Date:</span>
                                        <span className="font-medium">{format(new Date(batch.productionDate), 'MMM dd, yyyy')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Total Carbon:</span>
                                        <span className="font-medium">{(batch.carbonFootprint / 1000).toFixed(2)} tons CO₂</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {product.description && (
                            <>
                                <Separator />
                                <div>
                                    <h4 className="font-medium mb-2">Description</h4>
                                    <p className="text-sm text-muted-foreground">{product.description}</p>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Manufacturing Plant */}
                <Card className="shadow-lg border-0 bg-white">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-3 text-xl">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <Factory className="h-6 w-6 text-orange-600" />
                            </div>
                            Manufacturing Plant
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h4 className="font-semibold text-slate-900 text-lg mb-4">Plant Information</h4>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                        <span className="text-slate-600 font-medium">Plant Name</span>
                                        <span className="font-semibold text-slate-900">{plant.plantName}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                        <span className="text-slate-600 font-medium">Location</span>
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-slate-400" />
                                            <span className="font-semibold text-slate-900">
                                                {plant.location?.city && plant.location?.country
                                                    ? `${plant.location.city}, ${plant.location.country}`
                                                    : 'Location not specified'
                                                }
                                            </span>
                                        </div>
                                    </div>
                                    {plant.location?.coordinates && (
                                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                            <span className="text-slate-600 font-medium">Coordinates</span>
                                            <span className="font-mono text-sm text-slate-600">
                                                {plant.location.coordinates.latitude.toFixed(4)}, {plant.location.coordinates.longitude.toFixed(4)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-semibold text-slate-900 text-lg mb-4">Manufacturer Details</h4>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                        <span className="text-slate-600 font-medium">Wallet Address</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-sm font-semibold text-slate-900">{formatAddress(batch.manufacturerAddress)}</span>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-6 w-6 p-0 hover:bg-slate-100"
                                                onClick={() => window.open(`https://testnet.snowtrace.io/address/${batch.manufacturerAddress}`, '_blank')}
                                            >
                                                <ExternalLink className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                        <span className="text-slate-600 font-medium">Blockchain</span>
                                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                            Avalanche Fuji
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Components */}
                {components && components.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Product Components
                            </CardTitle>
                            <CardDescription>
                                This product is made from the following components. Click on any component to view its Digital Product Passport.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2">
                                {components.map((component, index) => (
                                    <Card key={index} className="border border-blue-200 hover:border-blue-300 transition-colors">
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-3">
                                                {component.product.imageUrl ? (
                                                    <img
                                                        src={component.product.imageUrl}
                                                        alt={component.product.templateName}
                                                        className="w-12 h-12 rounded-lg object-cover border"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-lg bg-muted border flex items-center justify-center">
                                                        <Package className="h-6 w-6 text-muted-foreground" />
                                                    </div>
                                                )}

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <h4 className="font-medium text-sm">{component.product.templateName}</h4>
                                                        <Badge variant="outline" className="text-xs">
                                                            Token #{component.batch.tokenId}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mb-2">
                                                        {component.product.category} • {batch.components?.find(c => c.tokenId === component.batch.tokenId)?.quantity || 0} units
                                                    </p>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs text-muted-foreground">
                                                            {((component.batch.carbonFootprint / 1000) * (batch.components?.find(c => c.tokenId === component.batch.tokenId)?.quantity || 0) / component.batch.quantity).toFixed(2)} tons CO₂
                                                        </span>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-6 px-2 text-xs"
                                                            onClick={() => window.open(`/tokens/${component.batch.tokenId}`, '_blank')}
                                                        >
                                                            <ExternalLink className="h-3 w-3 mr-1" />
                                                            View DPP
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Environmental Impact Summary */}
                <Card className="border-0 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 overflow-hidden">
                    <CardHeader className="pb-6">
                        <CardTitle className="flex items-center gap-3 text-2xl text-green-900">
                            <div className="p-3 bg-green-100 rounded-xl">
                                <Thermometer className="h-8 w-8 text-green-600" />
                            </div>
                            Environmental Impact
                        </CardTitle>
                        <p className="text-green-700 font-medium">Complete carbon footprint analysis for this product batch</p>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-2xl shadow-lg border border-green-200 text-center hover:shadow-xl transition-shadow">
                                <div className="text-4xl font-bold text-green-900 mb-2">{(batch.carbonFootprint / 1000).toFixed(2)}</div>
                                <div className="text-sm font-semibold text-green-700 uppercase tracking-wide">Total CO₂ (tons)</div>
                                <div className="text-xs text-green-600 mt-1">For entire batch</div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-lg border border-green-200 text-center hover:shadow-xl transition-shadow">
                                <div className="text-4xl font-bold text-green-900 mb-2">{(batch.carbonFootprint / 1000 / batch.quantity).toFixed(3)}</div>
                                <div className="text-sm font-semibold text-green-700 uppercase tracking-wide">CO₂ per Unit (tons)</div>
                                <div className="text-xs text-green-600 mt-1">Individual product impact</div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-lg border border-green-200 text-center hover:shadow-xl transition-shadow">
                                <div className="text-4xl font-bold text-green-900 mb-2">{batch.quantity}</div>
                                <div className="text-sm font-semibold text-green-700 uppercase tracking-wide">Total Units</div>
                                <div className="text-xs text-green-600 mt-1">In this batch</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Supply Chain Map */}
                {supplyChainLocations && supplyChainLocations.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="h-5 w-5" />
                                Supply Chain Journey
                            </CardTitle>
                            <CardDescription>
                                Visual representation of the complete supply chain from raw materials to final product
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <SupplyChainMap
                                locations={supplyChainLocations}
                                height={400}
                                zoom={2}
                                showLines={true}
                            />
                        </CardContent>
                    </Card>
                )}

                {/* Supply Chain Tree */}
                {tokenDetails && (
                    <ProductTreeViewer
                        tokenId={tokenDetails.tokenId}
                        className="w-full"
                    />
                )}

                {/* Blockchain Information */}
                {batch.txHash && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Hash className="h-5 w-5" />
                                Blockchain Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-sm font-medium text-green-900 mb-1">Transaction Hash</div>
                                        <code className="text-xs bg-white px-2 py-1 rounded border font-mono">
                                            {batch.txHash.slice(0, 10)}...{batch.txHash.slice(-8)}
                                        </code>
                                        {batch.blockNumber && (
                                            <div className="text-xs text-green-700 mt-1">Block: {batch.blockNumber}</div>
                                        )}
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-green-300 text-green-700 hover:bg-green-100"
                                        onClick={() => window.open(getExplorerUrl(batch.txHash!), '_blank')}
                                    >
                                        <ExternalLink className="h-3 w-3 mr-1" />
                                        View on Explorer
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
