"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/hooks/use-wallet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Plus, Building2, Users, Search, Edit, Trash2, UserPlus, Check } from "lucide-react";
import { Partner, Company } from "@/lib/models";

export default function PartnersPage() {
    const { address, isConnected } = useWallet();
    const [partners, setPartners] = useState<Partner[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);

    // Form data for adding new partner
    const [newPartner, setNewPartner] = useState({
        companyAddress: "",
        relationship: "" as "supplier" | "customer" | "",
        companyName: ""
    });

    // Company search state
    const [companySearch, setCompanySearch] = useState("");
    const [searchResults, setSearchResults] = useState<Company[]>([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

    // Form data for editing partner
    const [editPartner, setEditPartner] = useState({
        companyName: "",
        status: "active" as "active" | "inactive"
    });

    // Load partners data
    const fetchPartners = async () => {
        if (!address) return;

        setIsLoading(true);
        try {
            const response = await fetch(`/api/partners?selfAddress=${address}`);
            if (response.ok) {
                const data = await response.json();
                setPartners(data);
                console.log('Fetched partners:', data);
            } else {
                console.error('Failed to fetch partners');
            }
        } catch (error) {
            console.error('Error fetching partners:', error);
        } finally {
            setIsLoading(false);
            setIsInitialLoading(false);
        }
    };

    // Search companies
    const searchCompanies = async (query: string) => {
        if (query.length < 2) {
            setSearchResults([]);
            setShowSearchResults(false);
            return;
        }

        try {
            const response = await fetch(`/api/companies/search?q=${encodeURIComponent(query)}&limit=10`);
            if (response.ok) {
                const companies = await response.json();
                setSearchResults(companies);
                setShowSearchResults(true);
            }
        } catch (error) {
            console.error('Error searching companies:', error);
            setSearchResults([]);
            setShowSearchResults(false);
        }
    };

    // Handle company search input
    const handleCompanySearch = (query: string) => {
        setCompanySearch(query);
        if (query.trim().length >= 2) {
            searchCompanies(query);
        } else {
            setSearchResults([]);
            setShowSearchResults(false);
            setSelectedCompany(null);
            setNewPartner(prev => ({ ...prev, companyAddress: "", companyName: "" }));
        }
    };

    // Select a company from search results
    const selectCompany = (company: Company) => {
        setSelectedCompany(company);
        setCompanySearch(company.companyName);
        setNewPartner(prev => ({
            ...prev,
            companyAddress: company.walletAddress,
            companyName: company.companyName
        }));
        setShowSearchResults(false);
    };

    // Load data on component mount
    useEffect(() => {
        if (isConnected && address) {
            fetchPartners();
        } else {
            setIsInitialLoading(false);
        }
    }, [isConnected, address]);

    // Close search results when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (!target.closest('.company-search-container')) {
                setShowSearchResults(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Filter partners based on search term
    const filteredPartners = partners.filter(partner =>
        partner.companyAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
        partner.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Group partners by relationship type
    const customers = filteredPartners.filter(p => p.relationship === "customer");
    const suppliers = filteredPartners.filter(p => p.relationship === "supplier");

    // Handle add partner
    const handleAddPartner = async () => {
        if (!address || !newPartner.companyAddress || !newPartner.relationship) return;

        setIsLoading(true);
        try {
            const response = await fetch("/api/partners", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    selfAddress: address,
                    companyAddress: newPartner.companyAddress,
                    relationship: newPartner.relationship,
                    companyName: newPartner.companyName || undefined
                }),
            });

            if (response.ok) {
                await fetchPartners();
                setShowAddModal(false);
                setNewPartner({
                    companyAddress: "",
                    relationship: "",
                    companyName: ""
                });
                // Reset company search state
                setCompanySearch("");
                setSelectedCompany(null);
                setSearchResults([]);
                setShowSearchResults(false);
            } else {
                const error = await response.json();
                alert(error.error || "Failed to add partner");
            }
        } catch (error) {
            console.error("Error adding partner:", error);
            alert("Failed to add partner");
        } finally {
            setIsLoading(false);
        }
    };

    // Handle edit partner
    const handleEditPartner = async () => {
        if (!editingPartner) return;

        setIsLoading(true);
        try {
            const response = await fetch(`/api/partners/${editingPartner._id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(editPartner),
            });

            if (response.ok) {
                await fetchPartners();
                setShowEditModal(false);
                setEditingPartner(null);
            } else {
                const error = await response.json();
                alert(error.error || "Failed to update partner");
            }
        } catch (error) {
            console.error("Error updating partner:", error);
            alert("Failed to update partner");
        } finally {
            setIsLoading(false);
        }
    };

    // Handle delete partner
    const handleDeletePartner = async (partner: Partner) => {
        if (!confirm(`Are you sure you want to delete the partnership with ${partner.companyName || partner.companyAddress}?`)) {
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`/api/partners/${partner._id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                await fetchPartners();
            } else {
                const error = await response.json();
                alert(error.error || "Failed to delete partner");
            }
        } catch (error) {
            console.error("Error deleting partner:", error);
            alert("Failed to delete partner");
        } finally {
            setIsLoading(false);
        }
    };

    // Open edit modal
    const openEditModal = (partner: Partner) => {
        setEditingPartner(partner);
        setEditPartner({
            companyName: partner.companyName || "",
            status: partner.status
        });
        setShowEditModal(true);
    };

    // Partner Card Component
    const PartnerCard = ({ partner }: { partner: Partner }) => (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-lg">
                            {partner.companyName || "Unknown Company"}
                        </CardTitle>
                        <CardDescription className="font-mono text-sm">
                            {partner.companyAddress.slice(0, 6)}...{partner.companyAddress.slice(-4)}
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant={partner.relationship === "customer" ? "default" : "secondary"}>
                            {partner.relationship === "customer" ? "Customer" : "Supplier"}
                        </Badge>
                        <Badge variant={partner.status === "active" ? "default" : "secondary"}>
                            {partner.status}
                        </Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex justify-between items-center pt-2">
                    <span className="text-xs text-muted-foreground">
                        Added {new Date(partner.createdAt).toLocaleDateString()}
                    </span>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(partner)}
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeletePartner(partner)}
                            className="text-red-600 hover:text-red-700"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    // Loading skeleton
    if (isInitialLoading) {
        return (
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <div className="flex items-center space-x-2">
                        <SidebarTrigger />
                        <h2 className="text-3xl font-bold tracking-tight">Partners</h2>
                    </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-48 w-full" />
                    ))}
                </div>
            </div>
        );
    }

    // Not connected state
    if (!isConnected) {
        return (
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <div className="flex items-center space-x-2">
                        <SidebarTrigger />
                        <h2 className="text-3xl font-bold tracking-tight">Partners</h2>
                    </div>
                </div>
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <Users className="h-16 w-16 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
                        <p className="text-muted-foreground text-center">
                            Please connect your wallet to manage your business partners.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            {/* Header */}
            <div className="flex items-center justify-between space-y-2">
                <div className="flex items-center space-x-2">
                    <SidebarTrigger />
                    <h2 className="text-3xl font-bold tracking-tight">Partners</h2>
                </div>
                <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Partner
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Add New Partner</DialogTitle>
                            <DialogDescription>
                                Create a new business partnership. This will create bidirectional relationships.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2 relative company-search-container">
                                <Label htmlFor="companySearch">Search Company *</Label>
                                <div className="relative">
                                    <Input
                                        id="companySearch"
                                        value={companySearch}
                                        onChange={(e) => handleCompanySearch(e.target.value)}
                                        placeholder="Type company name to search..."
                                        required
                                    />
                                    <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                </div>

                                {/* Search Results Dropdown */}
                                {showSearchResults && searchResults.length > 0 && (
                                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                                        {searchResults.map((company) => (
                                            <div
                                                key={company._id?.toString()}
                                                className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                                onClick={() => selectCompany(company)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-medium text-sm">{company.companyName}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {company.companyType} • {company.walletAddress.slice(0, 6)}...{company.walletAddress.slice(-4)}
                                                        </p>
                                                    </div>
                                                    {selectedCompany?._id === company._id && (
                                                        <Check className="h-4 w-4 text-green-600" />
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* No results message */}
                                {showSearchResults && searchResults.length === 0 && companySearch.length >= 2 && (
                                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-4">
                                        <p className="text-sm text-muted-foreground">No companies found matching "{companySearch}"</p>
                                    </div>
                                )}

                                {/* Selected Company Display */}
                                {selectedCompany && (
                                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                                        <div className="flex items-center gap-2">
                                            <Check className="h-4 w-4 text-green-600" />
                                            <div>
                                                <p className="text-sm font-medium text-green-800">{selectedCompany.companyName}</p>
                                                <p className="text-xs text-green-600">
                                                    {selectedCompany.companyType} • {selectedCompany.walletAddress.slice(0, 6)}...{selectedCompany.walletAddress.slice(-4)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="relationship">Relationship Type *</Label>
                                <Select
                                    value={newPartner.relationship}
                                    onValueChange={(value: "supplier" | "customer") =>
                                        setNewPartner(prev => ({ ...prev, relationship: value }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select relationship type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="customer">Customer (they buy from you)</SelectItem>
                                        <SelectItem value="supplier">Supplier (you buy from them)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setShowAddModal(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleAddPartner}
                                disabled={isLoading || !selectedCompany || !newPartner.relationship}
                            >
                                {isLoading ? "Adding..." : "Add Partner"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Partners</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{partners.length}</div>
                        <p className="text-xs text-muted-foreground">
                            {customers.length} customers, {suppliers.length} suppliers
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Partners</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {partners.filter(p => p.status === "active").length}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Currently active partnerships
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Your Address</CardTitle>
                        <UserPlus className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm font-mono">
                            {address?.slice(0, 6)}...{address?.slice(-4)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Your company address
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search partners by address or name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </div>

            {/* Partners List */}
            <Tabs defaultValue="all" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="all">All Partners ({filteredPartners.length})</TabsTrigger>
                    <TabsTrigger value="customers">Customers ({customers.length})</TabsTrigger>
                    <TabsTrigger value="suppliers">Suppliers ({suppliers.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4">
                    {isLoading ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {[...Array(6)].map((_, i) => (
                                <Skeleton key={i} className="h-48 w-full" />
                            ))}
                        </div>
                    ) : filteredPartners.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-16">
                                <Users className="h-16 w-16 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">
                                    {searchTerm ? "No partners found" : "No partners yet"}
                                </h3>
                                <p className="text-muted-foreground text-center">
                                    {searchTerm
                                        ? "Try adjusting your search terms"
                                        : "Add your first business partner to get started"
                                    }
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {filteredPartners.map((partner) => (
                                <PartnerCard key={partner._id?.toString()} partner={partner} />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="customers" className="space-y-4">
                    {isLoading ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {[...Array(3)].map((_, i) => (
                                <Skeleton key={i} className="h-48 w-full" />
                            ))}
                        </div>
                    ) : customers.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-16">
                                <Users className="h-16 w-16 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No customers yet</h3>
                                <p className="text-muted-foreground text-center">
                                    Add customers who purchase from your company
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {customers.map((partner) => (
                                <PartnerCard key={partner._id?.toString()} partner={partner} />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="suppliers" className="space-y-4">
                    {isLoading ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {[...Array(3)].map((_, i) => (
                                <Skeleton key={i} className="h-48 w-full" />
                            ))}
                        </div>
                    ) : suppliers.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-16">
                                <Users className="h-16 w-16 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No suppliers yet</h3>
                                <p className="text-muted-foreground text-center">
                                    Add suppliers who provide materials to your company
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {suppliers.map((partner) => (
                                <PartnerCard key={partner._id?.toString()} partner={partner} />
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Edit Partner Modal */}
            <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit Partner</DialogTitle>
                        <DialogDescription>
                            Update partner information. Changes will be reflected on both sides of the relationship.
                        </DialogDescription>
                    </DialogHeader>
                    {editingPartner && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Partner Address</Label>
                                <p className="text-sm font-mono bg-muted p-2 rounded">
                                    {editingPartner.companyAddress}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label>Relationship</Label>
                                <p className="text-sm bg-muted p-2 rounded capitalize">
                                    {editingPartner.relationship}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-companyName">Company Name</Label>
                                <Input
                                    id="edit-companyName"
                                    value={editPartner.companyName}
                                    onChange={(e) => setEditPartner(prev => ({ ...prev, companyName: e.target.value }))}
                                    placeholder="Partner company name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-status">Status</Label>
                                <Select
                                    value={editPartner.status}
                                    onValueChange={(value: "active" | "inactive") =>
                                        setEditPartner(prev => ({ ...prev, status: value }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                    <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setShowEditModal(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleEditPartner} disabled={isLoading}>
                            {isLoading ? "Updating..." : "Update Partner"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
