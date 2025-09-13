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
    Plus,
    Settings,
    Edit,
    Trash2
} from "lucide-react";
import { ProductBatch, ProductTemplate, Plant } from "@/lib/models";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

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
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedBatch, setSelectedBatch] = useState<ProductBatch | null>(null);
    const [editData, setEditData] = useState({
        batchNumber: "",
        quantity: "",
        productionDate: "",
        expiryDate: "",
        carbonFootprint: "",
        plantId: ""
    });

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

    const openEditModal = (batch: ProductBatch) => {
        setSelectedBatch(batch);
        setEditData({
            batchNumber: batch.batchNumber,
            quantity: batch.quantity.toString(),
            productionDate: format(new Date(batch.productionDate), "yyyy-MM-dd"),
            expiryDate: batch.expiryDate ? format(new Date(batch.expiryDate), "yyyy-MM-dd") : "",
            carbonFootprint: batch.carbonFootprint.toString(),
            plantId: batch.plantId?.toString() || ""
        });
        setShowEditModal(true);
    };

    const closeEditModal = () => {
        setShowEditModal(false);
        setSelectedBatch(null);
        setEditData({
            batchNumber: "",
            quantity: "",
            productionDate: "",
            expiryDate: "",
            carbonFootprint: "",
            plantId: ""
        });
    };

    const handleEditInputChange = (field: string, value: string) => {
        setEditData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBatch) return;

        setIsLoading(true);
        try {
            const response = await fetch(`/api/product-batches/${selectedBatch._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    batchNumber: editData.batchNumber,
                    quantity: parseInt(editData.quantity),
                    productionDate: editData.productionDate,
                    expiryDate: editData.expiryDate || null,
                    carbonFootprint: parseFloat(editData.carbonFootprint),
                    plantId: editData.plantId
                }),
            });

            const result = await response.json();

            if (response.ok) {
                toast.success("Batch updated successfully");
                closeEditModal();
                fetchBatches(); // Refresh the batches list
            } else {
                toast.error(result.error || "Failed to update batch");
            }
        } catch (error) {
            console.error("Error updating batch:", error);
            toast.error("An error occurred while updating the batch");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteBatch = async (batchId: string) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/product-batches/${batchId}`, {
                method: 'DELETE',
            });

            const result = await response.json();

            if (response.ok) {
                toast.success("Batch deleted successfully");
                fetchBatches(); // Refresh the batches list
            } else {
                toast.error(result.error || "Failed to delete batch");
            }
        } catch (error) {
            console.error("Error deleting batch:", error);
            toast.error("An error occurred while deleting the batch");
        } finally {
            setIsLoading(false);
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

                                    {/* Action Buttons */}
                                    <div className="flex justify-end space-x-2 pt-2 border-t">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openEditModal(batch)}
                                            disabled={isLoading}
                                        >
                                            <Edit className="h-4 w-4 mr-1" />
                                            Edit
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={isLoading || !!batch.tokenId}
                                                >
                                                    <Trash2 className="h-4 w-4 mr-1" />
                                                    Delete
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Delete Batch</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Are you sure you want to delete batch "{batch.batchNumber}"?
                                                        This action cannot be undone.
                                                        {batch.tokenId && (
                                                            <span className="block mt-2 text-red-600 font-medium">
                                                                Note: This batch has minted tokens and cannot be deleted.
                                                            </span>
                                                        )}
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    {!batch.tokenId && (
                                                        <AlertDialogAction
                                                            onClick={() => handleDeleteBatch(batch._id?.toString() || "")}
                                                            className="bg-red-600 hover:bg-red-700"
                                                        >
                                                            Delete
                                                        </AlertDialogAction>
                                                    )}
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Edit Batch Modal */}
            <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Batch</DialogTitle>
                        <DialogDescription>
                            Update the batch information
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEditSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="editBatchNumber">Batch Number</Label>
                            <Input
                                id="editBatchNumber"
                                value={editData.batchNumber}
                                onChange={(e) => handleEditInputChange("batchNumber", e.target.value)}
                                placeholder="Enter batch number"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="editQuantity">Quantity</Label>
                            <Input
                                id="editQuantity"
                                type="number"
                                min="1"
                                value={editData.quantity}
                                onChange={(e) => handleEditInputChange("quantity", e.target.value)}
                                placeholder="Enter quantity"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="editProductionDate">Production Date</Label>
                            <Input
                                id="editProductionDate"
                                type="date"
                                value={editData.productionDate}
                                onChange={(e) => handleEditInputChange("productionDate", e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="editExpiryDate">Expiry Date (Optional)</Label>
                            <Input
                                id="editExpiryDate"
                                type="date"
                                value={editData.expiryDate}
                                onChange={(e) => handleEditInputChange("expiryDate", e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="editPlant">Plant</Label>
                            <Select
                                value={editData.plantId}
                                onValueChange={(value) => handleEditInputChange("plantId", value)}
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select plant" />
                                </SelectTrigger>
                                <SelectContent>
                                    {plants.map((plant) => (
                                        <SelectItem key={plant._id?.toString()} value={plant._id?.toString() || ""}>
                                            {plant.plantName} - {plant.plantCode}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="editCarbonFootprint">Carbon Footprint (kg CO₂)</Label>
                            <Input
                                id="editCarbonFootprint"
                                type="number"
                                step="0.01"
                                min="0"
                                value={editData.carbonFootprint}
                                onChange={(e) => handleEditInputChange("carbonFootprint", e.target.value)}
                                placeholder="Enter carbon footprint"
                                required
                            />
                        </div>

                        <div className="flex justify-end space-x-2">
                            <Button type="button" variant="outline" onClick={closeEditModal}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? "Updating..." : "Update Batch"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
