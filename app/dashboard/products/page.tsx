"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Plus,
  Search,
  Leaf,
  Factory,
  CheckCircle,
  Edit,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Product } from "@/lib/models";
import { useWallet } from "@/hooks/use-wallet";
import {
  PageHeaderSkeleton,
  SearchBarSkeleton,
  FormSkeleton,
  ProductCardsSkeleton,
  EmptyStateSkeleton,
} from "@/components/ui/loading-skeletons";

export default function ProductsPage() {
  const { address } = useWallet();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCompanyRegistered, setIsCompanyRegistered] = useState(true);
  const [formData, setFormData] = useState({
    productName: "",
    description: "",
    weight: "",
    carbonFootprint: "",
    isRawMaterial: false,
    manufacturingAddress: "",
    companyAddress: "",
  });

  useEffect(() => {
    fetchProducts();
  }, [address]);

  const fetchProducts = async () => {
    if (!address) return;

    try {
      const response = await fetch(`/api/products?companyAddress=${address}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
        setIsCompanyRegistered(true);
      } else if (response.status === 400) {
        // Company might not be registered
        setIsCompanyRegistered(false);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setIsInitialLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const productData = {
        ...formData,
        weight: parseFloat(formData.weight),
        carbonFootprint: parseFloat(formData.carbonFootprint),
        companyAddress: address,
      };

      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Product registered successfully!");
        setShowForm(false);
        setFormData({
          productName: "",
          description: "",
          weight: "",
          carbonFootprint: "",
          isRawMaterial: false,
          manufacturingAddress: "",
          companyAddress: "",
        });
        fetchProducts();
      } else {
        if (result.error?.includes("Company not registered")) {
          toast.error(
            "Please register your company first before adding products",
          );
        } else {
          toast.error(result.error || "Failed to register product");
        }
      }
    } catch (error) {
      console.error("Error registering product:", error);
      toast.error("An error occurred while registering the product");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (isInitialLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <PageHeaderSkeleton />
        <SearchBarSkeleton />
        <ProductCardsSkeleton />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Products</h2>
          <p className="text-muted-foreground">
            Manage your products and track their carbon footprint.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setShowForm(!showForm)}
            disabled={!isCompanyRegistered}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
          <SidebarTrigger />
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Company Registration Notice */}
      {!isCompanyRegistered && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <Factory className="h-8 w-8 text-orange-600" />
              <div>
                <h3 className="font-semibold text-orange-800 dark:text-orange-200">
                  Company Registration Required
                </h3>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  You need to register your company before you can add products.
                  <Link
                    href="/dashboard/register-company"
                    className="underline ml-1"
                  >
                    Register your company now
                  </Link>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Product Form */}
      {showForm &&
        isCompanyRegistered &&
        (isLoading ? (
          <FormSkeleton />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Register New Product
              </CardTitle>
              <CardDescription>
                Add a new product with its carbon footprint data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="productName">Product Name *</Label>
                    <Input
                      id="productName"
                      value={formData.productName}
                      onChange={(e) =>
                        handleInputChange("productName", e.target.value)
                      }
                      placeholder="Enter product name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (kg) *</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.01"
                      value={formData.weight}
                      onChange={(e) =>
                        handleInputChange("weight", e.target.value)
                      }
                      placeholder="Enter weight in kg"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    placeholder="Enter product description"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="carbonFootprint">
                      Carbon Footprint (kg CO₂/kg) *
                    </Label>
                    <Input
                      id="carbonFootprint"
                      type="number"
                      step="0.01"
                      value={formData.carbonFootprint}
                      onChange={(e) =>
                        handleInputChange("carbonFootprint", e.target.value)
                      }
                      placeholder="Enter carbon footprint"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="manufacturingAddress">
                      Manufacturing Address *
                    </Label>
                    <Input
                      id="manufacturingAddress"
                      value={formData.manufacturingAddress}
                      onChange={(e) =>
                        handleInputChange(
                          "manufacturingAddress",
                          e.target.value,
                        )
                      }
                      placeholder="Enter manufacturing address"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isRawMaterial"
                    checked={formData.isRawMaterial}
                    onCheckedChange={(checked) =>
                      handleInputChange("isRawMaterial", checked as boolean)
                    }
                  />
                  <Label htmlFor="isRawMaterial">Is Raw Material</Label>
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
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Registering...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Register Product
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ))}

      {/* Products List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.map((product) => (
          <Card
            key={product._id?.toString()}
            className="hover:shadow-md transition-shadow"
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{product.productName}</CardTitle>
                <Badge
                  variant={product.isRawMaterial ? "default" : "secondary"}
                >
                  {product.isRawMaterial ? "Raw Material" : "Product"}
                </Badge>
              </div>
              <CardDescription>{product.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Weight:</span>
                  <span>{product.weight} kg</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Carbon Footprint:
                  </span>
                  <div className="flex items-center gap-1">
                    <Leaf className="h-3 w-3 text-green-600" />
                    <span className="font-medium">
                      {product.carbonFootprint} kg CO₂/kg
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Manufacturing:</span>
                  <span
                    className="truncate max-w-[150px]"
                    title={product.manufacturingAddress}
                  >
                    {product.manufacturingAddress}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
                <Badge variant="outline" className="text-xs">
                  {new Date(product.createdAt).toLocaleDateString()}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && isCompanyRegistered && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No products found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm
                ? "No products match your search criteria."
                : "Get started by registering your first product."}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Product
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
