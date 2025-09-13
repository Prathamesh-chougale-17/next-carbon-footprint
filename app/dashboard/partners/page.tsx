"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/hooks/use-wallet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
    Users,
    Search,
    Plus,
    Building2,
    UserCheck,
    UserX,
    Mail,
    Phone,
    MapPin,
    Calendar
} from "lucide-react";
import { PartnerRelationship, Company } from "@/lib/models";
import { format } from "date-fns";
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
            <Skeleton className="h-10 w-32" />
        </CardContent>
    </Card>
);

export default function PartnersPage() {
    const { address } = useWallet();
    const [suppliers, setSuppliers] = useState<PartnerRelationship[]>([]);
    const [customers, setCustomers] = useState<PartnerRelationship[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [showAddPartner, setShowAddPartner] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedPartner, setSelectedPartner] = useState<any>(null);
    const [relationshipType, setRelationshipType] = useState<"supplier" | "customer">("customer");
    const [notes, setNotes] = useState("");

    useEffect(() => {
        if (address) {
            fetchPartners();
        }
    }, [address]);

    const fetchPartners = async () => {
        if (!address) return;

        setIsLoading(true);
        try {
            // Fetch suppliers
            const suppliersResponse = await fetch(`/api/partners?companyAddress=${address}&relationshipType=supplier`);
            if (suppliersResponse.ok) {
                const suppliersData = await suppliersResponse.json();
                setSuppliers(suppliersData);
            }

            // Fetch customers
            const customersResponse = await fetch(`/api/partners?companyAddress=${address}&relationshipType=customer`);
            if (customersResponse.ok) {
                const customersData = await customersResponse.json();
                setCustomers(customersData);
            }
        } catch (error) {
            console.error("Error fetching partners:", error);
        } finally {
            setIsLoading(false);
            setIsInitialLoading(false);
        }
    };

    const searchPartners = async (term: string) => {
        if (!term || !address) return;

        setIsSearching(true);
        try {
            const response = await fetch(`/api/partners?companyAddress=${address}&search=${encodeURIComponent(term)}`);
            if (response.ok) {
                const data = await response.json();
                setSearchResults(data);
            }
        } catch (error) {
            console.error("Error searching partners:", error);
            toast.error("Failed to search partners");
        } finally {
            setIsSearching(false);
        }
    };

    const handleAddPartner = async (partner: any) => {
        if (!address) return;

        setIsLoading(true);
        try {
            const response = await fetch('/api/partners', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    companyAddress: address,
                    partnerAddress: partner.companyAddress,
                    relationshipType,
                    notes
                }),
            });

            const result = await response.json();

            if (response.ok) {
                toast.success(`Successfully added ${partner.companyName} as ${relationshipType}`);
                setShowAddPartner(false);
                setSelectedPartner(null);
                setNotes("");
                fetchPartners(); // Refresh the partners list
            } else {
                toast.error(result.error || "Failed to add partner");
            }
        } catch (error) {
            console.error("Error adding partner:", error);
            toast.error("An error occurred while adding the partner");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        if (value.length > 2) {
            searchPartners(value);
        } else {
            setSearchResults([]);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "active":
                return "bg-green-100 text-green-800";
            case "inactive":
                return "bg-red-100 text-red-800";
            case "pending":
                return "bg-yellow-100 text-yellow-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    if (isInitialLoading) {
        return (
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <div>
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-96 mt-2" />
                    </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, i) => (
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
                    <h2 className="text-3xl font-bold tracking-tight">Partners</h2>
                    <p className="text-muted-foreground">
                        Manage your suppliers and customers
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Dialog open={showAddPartner} onOpenChange={setShowAddPartner}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Partner
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Add New Partner</DialogTitle>
                                <DialogDescription>
                                    Search for companies and add them as suppliers or customers
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="search">Search Companies</Label>
                                    <div className="relative">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="search"
                                            placeholder="Search by company name or address..."
                                            value={searchTerm}
                                            onChange={(e) => handleSearchChange(e.target.value)}
                                            className="pl-8"
                                        />
                                    </div>
                                </div>

                                {searchResults.length > 0 && (
                                    <div className="space-y-2">
                                        <Label>Search Results</Label>
                                        <div className="max-h-40 overflow-y-auto space-y-2">
                                            {searchResults.map((partner) => (
                                                <Card
                                                    key={partner.companyAddress}
                                                    className={`cursor-pointer hover:shadow-md transition-shadow ${selectedPartner?.companyAddress === partner.companyAddress
                                                            ? 'ring-2 ring-blue-500'
                                                            : ''
                                                        }`}
                                                    onClick={() => setSelectedPartner(partner)}
                                                >
                                                    <CardContent className="p-3">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <h4 className="font-medium">{partner.companyName}</h4>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {partner.companyAddress.slice(0, 10)}...
                                                                </p>
                                                            </div>
                                                            <Badge variant="outline">{partner.businessType}</Badge>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedPartner && (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="relationshipType">Relationship Type</Label>
                                            <Select value={relationshipType} onValueChange={(value: "supplier" | "customer") => setRelationshipType(value)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select relationship type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="customer">Customer</SelectItem>
                                                    <SelectItem value="supplier">Supplier</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="notes">Notes (Optional)</Label>
                                            <Textarea
                                                id="notes"
                                                placeholder="Add any notes about this partnership..."
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                rows={3}
                                            />
                                        </div>

                                        <div className="flex justify-end space-x-2">
                                            <Button variant="outline" onClick={() => setShowAddPartner(false)}>
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={() => handleAddPartner(selectedPartner)}
                                                disabled={isLoading}
                                            >
                                                {isLoading ? "Adding..." : "Add Partner"}
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>
                    <SidebarTrigger />
                </div>
            </div>

            {/* Search */}
            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search partners..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Suppliers</CardTitle>
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{suppliers.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Customers</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{customers.length}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Partners Lists */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Suppliers */}
                <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <UserCheck className="h-5 w-5" />
                        Suppliers ({suppliers.length})
                    </h3>
                    <div className="space-y-4">
                        {suppliers.length === 0 ? (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center py-8">
                                    <UserX className="h-8 w-8 text-muted-foreground mb-2" />
                                    <p className="text-muted-foreground text-center">
                                        No suppliers added yet
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            suppliers.map((supplier) => (
                                <Card key={supplier._id?.toString()} className="hover:shadow-md transition-shadow">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <CardTitle className="text-lg">
                                                    {supplier.partnerDetails?.companyName || "Unknown Company"}
                                                </CardTitle>
                                                <CardDescription className="mt-1">
                                                    {supplier.partnerAddress.slice(0, 10)}...
                                                </CardDescription>
                                            </div>
                                            <Badge className={getStatusColor(supplier.status)}>
                                                {supplier.status}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            {supplier.partnerDetails?.businessType && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                                    <span className="capitalize">{supplier.partnerDetails.businessType}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Calendar className="h-4 w-4" />
                                                <span>Established: {format(new Date(supplier.establishedDate), "MMM dd, yyyy")}</span>
                                            </div>
                                            {supplier.notes && (
                                                <div className="text-sm text-muted-foreground">
                                                    <strong>Notes:</strong> {supplier.notes}
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </div>

                {/* Customers */}
                <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Customers ({customers.length})
                    </h3>
                    <div className="space-y-4">
                        {customers.length === 0 ? (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center py-8">
                                    <UserX className="h-8 w-8 text-muted-foreground mb-2" />
                                    <p className="text-muted-foreground text-center">
                                        No customers added yet
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            customers.map((customer) => (
                                <Card key={customer._id?.toString()} className="hover:shadow-md transition-shadow">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <CardTitle className="text-lg">
                                                    {customer.partnerDetails?.companyName || "Unknown Company"}
                                                </CardTitle>
                                                <CardDescription className="mt-1">
                                                    {customer.partnerAddress.slice(0, 10)}...
                                                </CardDescription>
                                            </div>
                                            <Badge className={getStatusColor(customer.status)}>
                                                {customer.status}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            {customer.partnerDetails?.businessType && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                                    <span className="capitalize">{customer.partnerDetails.businessType}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Calendar className="h-4 w-4" />
                                                <span>Established: {format(new Date(customer.establishedDate), "MMM dd, yyyy")}</span>
                                            </div>
                                            {customer.notes && (
                                                <div className="text-sm text-muted-foreground">
                                                    <strong>Notes:</strong> {customer.notes}
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
