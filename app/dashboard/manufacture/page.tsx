"use client";

import { useState, useEffect } from "react";
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
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import {
  Factory,
  Plus,
  Search,
  Package,
  Leaf,
  CheckCircle,
  Edit,
  Trash2,
  Settings,
  Zap,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Product } from "@/lib/models";
import { useWallet } from "@/hooks/use-wallet";
import {
  PageHeaderSkeleton,
  SearchBarSkeleton,
  FormSkeleton,
  ProductCardsSkeleton,
  StatsSummarySkeleton
} from "@/components/ui/loading-skeletons";

interface ManufacturingProcess {
  _id?: string;
  processName: string;
  rawMaterialIds: string[];
  outputProductId: string;
  quantity: number;
  carbonFootprint: number;
  manufacturingAddress: string;
  companyAddress: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function ManufacturePage() {
  const { address } = useWallet();
  const [processes, setProcesses] = useState<ManufacturingProcess[]>([]);
  const [rawMaterials, setRawMaterials] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    processName: "",
    rawMaterialIds: [] as string[],
    outputProductId: "",
    quantity: "",
    carbonFootprint: "",
    manufacturingAddress: "",
    companyAddress: "",
  });

  useEffect(() => {
    fetchProcesses();
    fetchRawMaterials();
  }, [address]);

  const fetchProcesses = async () => {
    if (!address) return;

    try {
      const response = await fetch(
        `/api/manufacturing?companyAddress=${address}`,
      );
      if (response.ok) {
        const data = await response.json();
        setProcesses(data);
      }
    } catch (error) {
      console.error("Error fetching processes:", error);
    }
  };

  const fetchRawMaterials = async () => {
    if (!address) return;

    try {
      const response = await fetch(`/api/products?companyAddress=${address}`);
      if (response.ok) {
        const data = await response.json();
        // Filter only raw materials
        const rawMaterials = data.filter(
          (product: Product) => product.isRawMaterial,
        );
        setRawMaterials(rawMaterials);
      }
    } catch (error) {
      console.error("Error fetching raw materials:", error);
    } finally {
      setIsInitialLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRawMaterialToggle = (materialId: string) => {
    setFormData((prev) => ({
      ...prev,
      rawMaterialIds: prev.rawMaterialIds.includes(materialId)
        ? prev.rawMaterialIds.filter((id) => id !== materialId)
        : [...prev.rawMaterialIds, materialId],
    }));
  };

  const calculateTotalCarbonFootprint = () => {
    if (formData.rawMaterialIds.length === 0) return 0;

    const selectedMaterials = rawMaterials.filter((material) =>
      formData.rawMaterialIds.includes(material._id?.toString() || ""),
    );

    return selectedMaterials.reduce((total, material) => {
      return (
        total + material.carbonFootprint * parseFloat(formData.quantity || "0")
      );
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const processData = {
        ...formData,
        quantity: parseFloat(formData.quantity),
        carbonFootprint:
          parseFloat(formData.carbonFootprint) ||
          calculateTotalCarbonFootprint(),
        companyAddress: address,
      };

      const response = await fetch("/api/manufacturing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(processData),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Manufacturing process recorded successfully!");
        setShowForm(false);
        setFormData({
          processName: "",
          rawMaterialIds: [],
          outputProductId: "",
          quantity: "",
          carbonFootprint: "",
          manufacturingAddress: "",
          companyAddress: "",
        });
        fetchProcesses();
      } else {
        toast.error(result.error || "Failed to record manufacturing process");
      }
    } catch (error) {
      console.error("Error recording process:", error);
      toast.error("An error occurred while recording the process");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProcesses = processes.filter(
    (process) =>
      process.processName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      process.manufacturingAddress
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
  );

  if (isInitialLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <PageHeaderSkeleton />
        <SearchBarSkeleton />
        <ProductCardsSkeleton />
        <StatsSummarySkeleton />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Manufacturing</h2>
          <p className="text-muted-foreground">
            Record manufacturing processes and track carbon emissions from raw
            materials to finished products.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Process
          </Button>
          <SidebarTrigger />
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search processes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Add Process Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Factory className="h-5 w-5" />
              Manufacturing Process
            </CardTitle>
            <CardDescription>
              Record a new manufacturing process with raw materials and carbon
              footprint data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="processName">Process Name *</Label>
                  <Input
                    id="processName"
                    value={formData.processName}
                    onChange={(e) =>
                      handleInputChange("processName", e.target.value)
                    }
                    placeholder="Enter process name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Output Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) =>
                      handleInputChange("quantity", e.target.value)
                    }
                    placeholder="Enter output quantity"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="outputProductId">Output Product *</Label>
                <Input
                  id="outputProductId"
                  value={formData.outputProductId}
                  onChange={(e) =>
                    handleInputChange("outputProductId", e.target.value)
                  }
                  placeholder="Enter output product name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Raw Materials *</Label>
                {rawMaterials.length === 0 ? (
                  <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                    <AlertCircle className="h-4 w-4" />
                    No raw materials found. Register raw materials first to
                    create manufacturing processes.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                    {rawMaterials.map((material) => (
                      <div
                        key={material._id?.toString()}
                        className={`flex items-center space-x-2 p-2 rounded cursor-pointer transition-colors ${formData.rawMaterialIds.includes(
                          material._id?.toString() || "",
                        )
                          ? "bg-green-100 border border-green-300"
                          : "bg-gray-50 border border-gray-200 hover:bg-gray-100"
                          }`}
                        onClick={() =>
                          handleRawMaterialToggle(
                            material._id?.toString() || "",
                          )
                        }
                      >
                        <input
                          type="checkbox"
                          checked={formData.rawMaterialIds.includes(
                            material._id?.toString() || "",
                          )}
                          onChange={() => { }}
                          className="rounded"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {material.productName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {material.carbonFootprint} tons CO₂/kg
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="carbonFootprint">
                    Carbon Footprint (tons CO₂)
                  </Label>
                  <Input
                    id="carbonFootprint"
                    type="number"
                    step="0.01"
                    value={formData.carbonFootprint}
                    onChange={(e) =>
                      handleInputChange("carbonFootprint", e.target.value)
                    }
                    placeholder="Auto-calculated if left empty"
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
                      handleInputChange("manufacturingAddress", e.target.value)
                    }
                    placeholder="Enter manufacturing address"
                    required
                  />
                </div>
              </div>

              {/* Carbon Footprint Preview */}
              {formData.rawMaterialIds.length > 0 && formData.quantity && (
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Estimated Carbon Footprint:
                      </span>
                      <div className="flex items-center gap-1">
                        <Leaf className="h-4 w-4 text-green-600" />
                        <span className="text-lg font-bold text-green-700">
                          {calculateTotalCarbonFootprint().toFixed(2)} tons CO₂
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-green-600 mt-1">
                      Based on selected raw materials and quantity
                    </p>
                  </CardContent>
                </Card>
              )}

              <div className="flex items-center justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || rawMaterials.length === 0}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Recording...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Record Process
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Processes List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredProcesses.map((process) => (
          <Card key={process._id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Factory className="h-4 w-4" />
                  {process.processName}
                </CardTitle>
                <Badge variant="outline">
                  <Settings className="h-3 w-3 mr-1" />
                  Process
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Output Product:</span>
                  <span className="font-medium">{process.outputProductId}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Quantity:</span>
                  <span>{process.quantity}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Raw Materials:</span>
                  <span>{process.rawMaterialIds.length} materials</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Carbon Footprint:
                  </span>
                  <div className="flex items-center gap-1">
                    <Leaf className="h-3 w-3 text-green-600" />
                    <span className="font-medium">
                      {process.carbonFootprint} tons CO₂
                    </span>
                  </div>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">
                    Manufacturing Address:
                  </span>
                  <p className="text-xs mt-1 line-clamp-2">
                    {process.manufacturingAddress}
                  </p>
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
                  {new Date(process.createdAt).toLocaleDateString()}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProcesses.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Factory className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No manufacturing processes found
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm
                ? "No processes match your search criteria."
                : "Get started by recording your first manufacturing process."}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Process
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      {processes.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Processes
                  </p>
                  <p className="text-2xl font-bold">{processes.length}</p>
                </div>
                <Factory className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Output
                  </p>
                  <p className="text-2xl font-bold">
                    {processes
                      .reduce((sum, p) => sum + p.quantity, 0)
                      .toFixed(0)}
                  </p>
                </div>
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total CO₂
                  </p>
                  <p className="text-2xl font-bold">
                    {processes
                      .reduce((sum, p) => sum + p.carbonFootprint, 0)
                      .toFixed(1)}{" "}
                    kg
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
                  <p className="text-sm font-medium text-muted-foreground">
                    Avg CO₂/Process
                  </p>
                  <p className="text-2xl font-bold">
                    {(
                      processes.reduce((sum, p) => sum + p.carbonFootprint, 0) /
                      processes.length
                    ).toFixed(1)}{" "}
                    kg
                  </p>
                </div>
                <Zap className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
