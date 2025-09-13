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
    Package,
    Search,
    Calendar,
    Factory,
    Hash,
    TrendingUp,
    AlertCircle,
    CheckCircle,
    Clock,
    Plus,
    Settings
} from "lucide-react";
import { ProductBatch, ProductTemplate, Plant } from "@/lib/models";
import { format } from "date-fns";

// Loading skeleton for the form
const FormSkeleton = () => (
    <Card>
        <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
            </div>
            <Skeleton className="h-10 w-32" />
        </CardContent>
    </Card>
);

export default function BatchesPage() {
    const { address } = useWallet();
    const [batches, setBatches] = useState<ProductBatch[]>([]);
    const [templates, setTemplates] = useState<ProductTemplate[]>([]);
    const [plants, setPlants] = useState<Plant[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        if (address) {
            fetchBatches();
            fetchTemplates();
            fetchPlants();
        }
    }, [address]);

    const fetchBatches = async () => {
        if (!address) return;

        setIsLoading(true);
        try {
            const response = await fetch(`/api/product-batches?manufacturerAddress=${address}`);
            if (response.ok) {
                const data = await response.json();
                setBatches(data);
            }
        } catch (error) {
            console.error("Error fetching batches:", error);
        } finally {
            setIsLoading(false);
            setIsInitialLoading(false);
        }
    };

    const fetchTemplates = async () => {
        if (!address) return;

        try {
            const response = await fetch(`/api/product-templates?manufacturerAddress=${address}`);
            if (response.ok) {
                const data = await response.json();
                setTemplates(data);
            }
        } catch (error) {
            console.error("Error fetching templates:", error);
        }
    };

    const fetchPlants = async () => {
        if (!address) return;

        try {
            const response = await fetch(`/api/plants?companyAddress=${address}`);
            if (response.ok) {
                const data = await response.json();
                setPlants(data);
            }
        } catch (error) {
            console.error("Error fetching plants:", error);
        }
    };

    const getTemplateName = (templateId: string) => {
        const template = templates.find(t => t._id?.toString() === templateId);
        return template?.templateName || "Unknown Template";
    };

    const getPlantName = (plantId: string) => {
        const plant = plants.find(p => p._id?.toString() === plantId);
        return plant?.plantName || "Unknown Plant";
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "production":
                return <Clock className="h-4 w-4 text-blue-500" />;
            case "completed":
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case "shipped":
                return <Package className="h-4 w-4 text-purple-500" />;
            case "delivered":
                return <CheckCircle className="h-4 w-4 text-green-600" />;
            default:
                return <AlertCircle className="h-4 w-4 text-gray-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "production":
                return "bg-blue-100 text-blue-800";
            case "completed":
                return "bg-green-100 text-green-800";
            case "shipped":
                return "bg-purple-100 text-purple-800";
            case "delivered":
                return "bg-green-100 text-green-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const filteredBatches = batches.filter(batch => {
        const matchesSearch = batch.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            getTemplateName(batch.templateId).toLowerCase().includes(searchTerm.toLowerCase()) ||
            getPlantName(batch.plantId?.toString() || "").toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    if (isInitialLoading) {
        return (
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <div>
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-96 mt-2" />
                    </div>
                </div>
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
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            {/* Header */}
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Batches</h2>
                    <p className="text-muted-foreground">
                        Manage and track your product batches
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button onClick={() => window.location.href = '/dashboard/products'}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Batch
                    </Button>
                    <SidebarTrigger />
                </div>
            </div>

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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{batches.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">In Production</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {batches.filter(b => b.batchStatus === "production").length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completed</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {batches.filter(b => b.batchStatus === "completed").length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {batches.reduce((sum, batch) => sum + batch.quantity, 0)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Batches List */}
            {filteredBatches.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Package className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No batches found</h3>
                        <p className="text-muted-foreground text-center mb-4">
                            {batches.length === 0
                                ? "You haven't created any batches yet. Create a product template first, then create batches from the Product Templates page."
                                : "No batches match your current search."}
                        </p>
                        <Button onClick={() => window.location.href = '/dashboard/products'}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Your First Batch
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredBatches.map((batch) => (
                        <Card key={batch._id?.toString()} className="hover:shadow-md transition-shadow">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-lg">{batch.batchNumber}</CardTitle>
                                        <CardDescription className="mt-1">
                                            {getTemplateName(batch.templateId)}
                                        </CardDescription>
                                    </div>
                                    <Badge className={getStatusColor(batch.batchStatus)}>
                                        <div className="flex items-center gap-1">
                                            {getStatusIcon(batch.batchStatus)}
                                            {batch.batchStatus}
                                        </div>
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Quantity:</span>
                                        <span className="font-medium">{batch.quantity} units</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Carbon Footprint:</span>
                                        <span className="font-medium">{batch.carbonFootprint.toFixed(2)} kg CO₂</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Production Date:</span>
                                        <span className="font-medium">{format(new Date(batch.productionDate), "MMM dd, yyyy")}</span>
                                    </div>
                                    {batch.expiryDate && (
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Expiry Date:</span>
                                            <span className="font-medium">{format(new Date(batch.expiryDate), "MMM dd, yyyy")}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Plant:</span>
                                        <span className="font-medium">{getPlantName(batch.plantId?.toString() || "")}</span>
                                    </div>

                                    {batch.tokenId && (
                                        <div className="p-2 bg-muted rounded-lg">
                                            <div className="text-xs text-muted-foreground mb-1">Token Details</div>
                                            <div className="text-sm font-mono">
                                                Token ID: {batch.tokenId}
                                            </div>
                                            {batch.txHash && (
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    TX: {batch.txHash.slice(0, 10)}...
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
