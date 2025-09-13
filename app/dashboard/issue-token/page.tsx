"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import {
  Coins,
  Package,
  Leaf,
  ExternalLink,
  CheckCircle,
  Loader2,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { Product, Token } from "@/lib/models";
import { useWallet } from "@/hooks/use-wallet";
import {
  PageHeaderSkeleton,
  FormSkeleton,
  ProductCardsSkeleton
} from "@/components/ui/loading-skeletons";

export default function IssueTokenPage() {
  const { address } = useWallet();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [mintedToken, setMintedToken] = useState<Token | null>(null);
  const [isMinting, setIsMinting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [address]);

  const fetchProducts = async () => {
    if (!address) return;

    try {
      const response = await fetch(`/api/products?companyAddress=${address}`);
      if (response.ok) {
        const data = await response.json();
        // Filter only raw materials for token minting
        const rawMaterials = data.filter((product: Product) => product.isRawMaterial);
        setProducts(rawMaterials);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsInitialLoading(false);
    }
  };

  const handleMintToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !quantity) return;

    setIsMinting(true);
    try {
      // Simulate blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 3000));

      const tokenData = {
        productId: selectedProduct._id?.toString(),
        manufacturerAddress: address,
        quantity: parseInt(quantity),
        cid: `Qm${Math.random().toString(36).substring(2, 15)}`, // Mock IPFS hash
        blockNumber: Math.floor(Math.random() * 1000000) + 1000000,
        txHash: `0x${Math.random().toString(16).substring(2, 66)}`,
        etherscanLink: `https://sepolia.etherscan.io/tx/0x${Math.random().toString(16).substring(2, 66)}`
      };

      const response = await fetch('/api/tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tokenData),
      });

      const result = await response.json();

      if (response.ok) {
        setMintedToken(result);
        toast.success("Token minted successfully!");
        setQuantity("");
        setSelectedProduct(null);
      } else {
        toast.error(result.error || "Failed to mint token");
      }
    } catch (error) {
      console.error('Error minting token:', error);
      toast.error("An error occurred while minting the token");
    } finally {
      setIsMinting(false);
    }
  };

  const totalCarbonFootprint = selectedProduct && quantity
    ? (selectedProduct.carbonFootprint * parseFloat(quantity)).toFixed(2)
    : "0";

  if (isInitialLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <PageHeaderSkeleton />
        <div className="grid gap-6 lg:grid-cols-2">
          <FormSkeleton />
          <ProductCardsSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Issue Token</h2>
          <p className="text-muted-foreground">
            Mint carbon credit tokens for your raw materials.
          </p>
        </div>
        <SidebarTrigger />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Token Minting Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              Mint Carbon Token
            </CardTitle>
            <CardDescription>
              Create blockchain tokens representing carbon credits for your raw materials.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleMintToken} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="product">Select Raw Material *</Label>
                <Select
                  value={selectedProduct?._id?.toString() || ""}
                  onValueChange={(value) => {
                    const product = products.find(p => p._id?.toString() === value);
                    setSelectedProduct(product || null);
                  }}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a raw material" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product._id?.toString()} value={product._id?.toString() || ""}>
                        <div className="flex items-center justify-between w-full">
                          <span>{product.productName}</span>
                          <Badge variant="outline" className="ml-2">
                            {product.carbonFootprint} tons CO₂/kg
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {products.length === 0 && (
                  <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                    <AlertCircle className="h-4 w-4" />
                    No raw materials found. Register raw materials first to mint tokens.
                  </div>
                )}
              </div>

              {selectedProduct && (
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Product:</span>
                        <span className="text-sm">{selectedProduct.productName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Description:</span>
                        <span className="text-sm">{selectedProduct.description}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Weight:</span>
                        <span className="text-sm">{selectedProduct.weight} kg</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Carbon Footprint:</span>
                        <div className="flex items-center gap-1">
                          <Leaf className="h-3 w-3 text-green-600" />
                          <span className="text-sm font-medium">{selectedProduct.carbonFootprint} tons CO₂/kg</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Enter quantity"
                  required
                  min="1"
                />
              </div>

              {selectedProduct && quantity && (
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Total Carbon Footprint:</span>
                      <div className="flex items-center gap-1">
                        <Leaf className="h-4 w-4 text-green-600" />
                        <span className="text-lg font-bold text-green-700">
                          {totalCarbonFootprint} tons CO₂
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button
                type="submit"
                disabled={isMinting || !selectedProduct || !quantity || products.length === 0}
                className="w-full"
              >
                {isMinting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Minting Token...
                  </>
                ) : (
                  <>
                    <Coins className="h-4 w-4 mr-2" />
                    Mint Token
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Minted Token Details */}
        {mintedToken && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                Token Minted Successfully
              </CardTitle>
              <CardDescription>
                Your carbon credit token has been created on the blockchain.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Token ID:</span>
                  <Badge variant="outline">{mintedToken.tokenId}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Quantity:</span>
                  <span className="text-sm">{mintedToken.quantity}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Block Number:</span>
                  <span className="text-sm font-mono">{mintedToken.blockNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Transaction Hash:</span>
                  <span className="text-sm font-mono truncate max-w-[200px]">
                    {mintedToken.txHash}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">IPFS CID:</span>
                  <span className="text-sm font-mono">{mintedToken.cid}</span>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => window.open(mintedToken.etherscanLink, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on Etherscan
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => window.open(`https://${mintedToken.cid}.ipfs.nftstorage.link`, '_blank')}
                >
                  <Package className="h-4 w-4 mr-2" />
                  View NFT Metadata
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Available Raw Materials */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Available Raw Materials
            </CardTitle>
            <CardDescription>
              Raw materials available for token minting.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {products.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => (
                  <Card key={product._id?.toString()} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{product.productName}</h4>
                          <Badge variant="outline">Raw Material</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{product.description}</p>
                        <div className="flex items-center justify-between text-sm">
                          <span>Weight: {product.weight} kg</span>
                          <div className="flex items-center gap-1">
                            <Leaf className="h-3 w-3 text-green-600" />
                            <span className="font-medium">{product.carbonFootprint} tons CO₂/kg</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Raw Materials Found</h3>
                <p className="text-muted-foreground mb-4">
                  Register raw materials first to mint carbon credit tokens.
                </p>
                <Button asChild>
                  <a href="/dashboard/products">Register Raw Materials</a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
