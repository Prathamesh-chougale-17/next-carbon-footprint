"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRightLeft, 
  Plus, 
  Search, 
  Package,
  Leaf,
  CheckCircle,
  Edit,
  Trash2,
  Truck,
  Factory,
  Store,
  ExternalLink,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { AssetTransfer, Product } from "@/lib/models";
import { useWallet } from "@/hooks/use-wallet";

export default function AssetTransferPage() {
  const { address } = useWallet();
  const [transfers, setTransfers] = useState<AssetTransfer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    toAddress: "",
    productId: "",
    quantity: "",
    transferType: "",
    carbonFootprint: "",
    fromAddress: ""
  });

  useEffect(() => {
    fetchTransfers();
    fetchProducts();
  }, [address]);

  const fetchTransfers = async () => {
    if (!address) return;
    
    try {
      const response = await fetch(`/api/asset-transfers?fromAddress=${address}`);
      if (response.ok) {
        const data = await response.json();
        setTransfers(data);
      }
    } catch (error) {
      console.error('Error fetching transfers:', error);
    }
  };

  const fetchProducts = async () => {
    if (!address) return;
    
    try {
      const response = await fetch(`/api/products?companyAddress=${address}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const selectedProduct = products.find(p => p._id?.toString() === formData.productId);
      if (!selectedProduct) {
        toast.error("Please select a valid product");
        return;
      }

      const transferData = {
        ...formData,
        fromAddress: address,
        quantity: parseFloat(formData.quantity),
        carbonFootprint: parseFloat(formData.carbonFootprint) || (selectedProduct.carbonFootprint * parseFloat(formData.quantity)),
        txHash: `0x${Math.random().toString(16).substring(2, 66)}`, // Mock transaction hash
        blockNumber: Math.floor(Math.random() * 1000000) + 1000000
      };

      const response = await fetch('/api/asset-transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transferData),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Asset transfer recorded successfully!");
        setShowForm(false);
        setFormData({
          toAddress: "",
          productId: "",
          quantity: "",
          transferType: "",
          carbonFootprint: "",
          fromAddress: ""
        });
        fetchTransfers();
      } else {
        toast.error(result.error || "Failed to record asset transfer");
      }
    } catch (error) {
      console.error('Error recording transfer:', error);
      toast.error("An error occurred while recording the transfer");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTransfers = transfers.filter(transfer =>
    transfer.toAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transfer.productId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTransferTypeIcon = (type: string) => {
    switch (type) {
      case "manufacturing": return <Factory className="h-4 w-4" />;
      case "retail": return <Store className="h-4 w-4" />;
      case "logistics": return <Truck className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getTransferTypeColor = (type: string) => {
    switch (type) {
      case "manufacturing": return "bg-blue-100 text-blue-800";
      case "retail": return "bg-green-100 text-green-800";
      case "logistics": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Asset Transfer</h2>
          <p className="text-muted-foreground">
            Transfer assets with immutable carbon emission records on the blockchain.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Record Transfer
          </Button>
          <SidebarTrigger />
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transfers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Add Transfer Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5" />
              Record Asset Transfer
            </CardTitle>
            <CardDescription>
              Record the transfer of assets with carbon emission data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="toAddress">To Address *</Label>
                  <Input
                    id="toAddress"
                    value={formData.toAddress}
                    onChange={(e) => handleInputChange('toAddress', e.target.value)}
                    placeholder="0x..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transferType">Transfer Type *</Label>
                  <Select
                    value={formData.transferType}
                    onValueChange={(value) => handleInputChange('transferType', value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select transfer type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="logistics">Logistics</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="productId">Product *</Label>
                  <Select
                    value={formData.productId}
                    onValueChange={(value) => handleInputChange('productId', value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product._id?.toString()} value={product._id?.toString() || ""}>
                          <div className="flex items-center justify-between w-full">
                            <span>{product.productName}</span>
                            <Badge variant="outline" className="ml-2">
                              {product.carbonFootprint} kg CO₂/kg
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange('quantity', e.target.value)}
                    placeholder="Enter quantity"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="carbonFootprint">Carbon Footprint (kg CO₂)</Label>
                <Input
                  id="carbonFootprint"
                  type="number"
                  step="0.01"
                  value={formData.carbonFootprint}
                  onChange={(e) => handleInputChange('carbonFootprint', e.target.value)}
                  placeholder="Auto-calculated if left empty"
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to auto-calculate based on product carbon footprint and quantity.
                </p>
              </div>

              <div className="flex items-center justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Recording...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Record Transfer
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Transfers List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTransfers.map((transfer) => (
          <Card key={transfer._id?.toString()} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ArrowRightLeft className="h-4 w-4" />
                  Asset Transfer
                </CardTitle>
                <Badge className={getTransferTypeColor(transfer.transferType)}>
                  <div className="flex items-center gap-1">
                    {getTransferTypeIcon(transfer.transferType)}
                    {transfer.transferType}
                  </div>
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">From:</span>
                  <span className="font-mono text-xs">{transfer.fromAddress.slice(0, 6)}...{transfer.fromAddress.slice(-4)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">To:</span>
                  <span className="font-mono text-xs">{transfer.toAddress.slice(0, 6)}...{transfer.toAddress.slice(-4)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Product ID:</span>
                  <span className="font-mono text-xs">{transfer.productId.slice(0, 8)}...</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Quantity:</span>
                  <span>{transfer.quantity}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Carbon Footprint:</span>
                  <div className="flex items-center gap-1">
                    <Leaf className="h-3 w-3 text-green-600" />
                    <span className="font-medium">{transfer.carbonFootprint} kg CO₂</span>
                  </div>
                </div>
                {transfer.txHash && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Transaction:</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`https://snowtrace.io/tx/${transfer.txHash}`, '_blank')}
                      className="h-auto p-0 text-xs"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
                <Badge variant="outline" className="text-xs">
                  {new Date(transfer.createdAt).toLocaleDateString()}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTransfers.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ArrowRightLeft className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No transfers found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm ? "No transfers match your search criteria." : "Get started by recording your first asset transfer."}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Record First Transfer
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      {transfers.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Transfers</p>
                  <p className="text-2xl font-bold">{transfers.length}</p>
                </div>
                <ArrowRightLeft className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total CO₂ Transferred</p>
                  <p className="text-2xl font-bold">
                    {transfers.reduce((sum, t) => sum + t.carbonFootprint, 0).toFixed(1)} kg
                  </p>
                </div>
                <Leaf className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Manufacturing</p>
                  <p className="text-2xl font-bold">
                    {transfers.filter(t => t.transferType === 'manufacturing').length}
                  </p>
                </div>
                <Factory className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Retail</p>
                  <p className="text-2xl font-bold">
                    {transfers.filter(t => t.transferType === 'retail').length}
                  </p>
                </div>
                <Store className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
