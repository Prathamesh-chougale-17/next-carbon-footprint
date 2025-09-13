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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Package,
  Plus,
  Search,
  Leaf,
  Factory,
  CheckCircle,
  Edit,
  Trash2,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import { ProductTemplate, Plant } from "@/lib/models";
import { useWallet } from "@/hooks/use-wallet";
import {
  PageHeaderSkeleton,
  SearchBarSkeleton,
  FormSkeleton,
  ProductCardsSkeleton,
  EmptyStateSkeleton,
} from "@/components/ui/loading-skeletons";

export default function ProductTemplatesPage() {
  const { address } = useWallet();
  const [templates, setTemplates] = useState<ProductTemplate[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingPlants, setIsLoadingPlants] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ProductTemplate | null>(null);
  const [batchData, setBatchData] = useState({
    batchNumber: "",
    quantity: "",
    plantId: ""
  });
  const [formData, setFormData] = useState({
    templateName: "",
    description: "",
    category: "",
    weight: "",
    length: "",
    width: "",
    height: "",
    materials: "",
    carbonFootprintPerUnit: "",
    isRawMaterial: false,
    manufacturerAddress: ""
  });

  useEffect(() => {
    fetchTemplates();
    fetchPlants();
  }, [address]);

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
    } finally {
      setIsInitialLoading(false);
    }
  };

  const fetchPlants = async () => {
    if (!address) return;

    setIsLoadingPlants(true);
    try {
      console.log("Fetching plants for address:", address);
      const response = await fetch(`/api/plants?companyAddress=${address}`);
      console.log("Plants API response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Plants fetched:", data);
        setPlants(data);
      } else {
        console.error("Failed to fetch plants:", response.status, response.statusText);
        const errorData = await response.json();
        console.error("Error details:", errorData);
      }
    } catch (error) {
      console.error("Error fetching plants:", error);
    } finally {
      setIsLoadingPlants(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleBatchInputChange = (field: string, value: string) => {
    setBatchData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const openBatchModal = async (template: ProductTemplate) => {
    setSelectedTemplate(template);
    setBatchData({
      batchNumber: `BATCH-${Date.now()}`,
      quantity: "",
      plantId: ""
    });

    // Ensure plants are loaded when opening modal
    if (plants.length === 0) {
      await fetchPlants();
    }

    setShowBatchModal(true);
  };

  const closeBatchModal = () => {
    setShowBatchModal(false);
    setSelectedTemplate(null);
    setBatchData({
      batchNumber: "",
      quantity: "",
      plantId: ""
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const templateData = {
        templateName: formData.templateName,
        description: formData.description,
        category: formData.category,
        specifications: {
          weight: parseFloat(formData.weight),
          dimensions: formData.length && formData.width && formData.height ? {
            length: parseFloat(formData.length),
            width: parseFloat(formData.width),
            height: parseFloat(formData.height)
          } : undefined,
          materials: formData.materials.split(',').map(m => m.trim()).filter(m => m),
          carbonFootprintPerUnit: parseFloat(formData.carbonFootprintPerUnit)
        },
        manufacturerAddress: address,
        isRawMaterial: formData.isRawMaterial,
        isActive: true
      };

      const response = await fetch("/api/product-templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(templateData),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Product template created successfully!");
        setShowForm(false);
        setFormData({
          templateName: "",
          description: "",
          category: "",
          weight: "",
          length: "",
          width: "",
          height: "",
          materials: "",
          carbonFootprintPerUnit: "",
          isRawMaterial: false,
          manufacturerAddress: ""
        });
        fetchTemplates();
      } else {
        toast.error(result.error || "Failed to create template");
      }
    } catch (error) {
      console.error("Error creating template:", error);
      toast.error("An error occurred while creating the template");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;

    setIsLoading(true);
    try {
      const batchPayload = {
        batchNumber: batchData.batchNumber,
        templateId: selectedTemplate._id?.toString(),
        quantity: parseInt(batchData.quantity),
        productionDate: new Date().toISOString(),
        carbonFootprint: selectedTemplate.specifications.carbonFootprintPerUnit * parseInt(batchData.quantity),
        manufacturerAddress: address,
        plantId: batchData.plantId
      };

      const response = await fetch('/api/product-batches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batchPayload),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Product batch created successfully!');
        closeBatchModal();
      } else {
        toast.error(result.error || 'Failed to create batch');
      }
    } catch (error) {
      console.error('Error creating batch:', error);
      toast.error('An error occurred while creating the batch');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTemplates = templates.filter(
    (template) =>
      template.templateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.category.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h2 className="text-3xl font-bold tracking-tight">Product Templates</h2>
          <p className="text-muted-foreground">
            Define product specifications and carbon footprint data for your manufacturing.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
          <SidebarTrigger />
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>


      {/* Create Template Form */}
      {showForm && (isLoading ? (
        <FormSkeleton />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Create Product Template
            </CardTitle>
            <CardDescription>
              Define a reusable product template with specifications and carbon footprint data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="templateName">Template Name *</Label>
                  <Input
                    id="templateName"
                    value={formData.templateName}
                    onChange={(e) =>
                      handleInputChange("templateName", e.target.value)
                    }
                    placeholder="e.g., Steel Bolt M8"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleInputChange("category", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fasteners">Fasteners</SelectItem>
                      <SelectItem value="Textiles">Textiles</SelectItem>
                      <SelectItem value="Electronics">Electronics</SelectItem>
                      <SelectItem value="Packaging">Packaging</SelectItem>
                      <SelectItem value="Automotive">Automotive</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
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
                  placeholder="Describe the product template"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="length">Length (cm)</Label>
                  <Input
                    id="length"
                    type="number"
                    step="0.1"
                    value={formData.length}
                    onChange={(e) =>
                      handleInputChange("length", e.target.value)
                    }
                    placeholder="0.0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="width">Width (cm)</Label>
                  <Input
                    id="width"
                    type="number"
                    step="0.1"
                    value={formData.width}
                    onChange={(e) =>
                      handleInputChange("width", e.target.value)
                    }
                    placeholder="0.0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    step="0.1"
                    value={formData.height}
                    onChange={(e) =>
                      handleInputChange("height", e.target.value)
                    }
                    placeholder="0.0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="carbonFootprintPerUnit">Carbon Footprint per Unit (kg CO₂/unit) *</Label>
                  <Input
                    id="carbonFootprintPerUnit"
                    type="number"
                    step="0.01"
                    value={formData.carbonFootprintPerUnit}
                    onChange={(e) =>
                      handleInputChange("carbonFootprintPerUnit", e.target.value)
                    }
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="materials">Materials (comma-separated) *</Label>
                <Input
                  id="materials"
                  value={formData.materials}
                  onChange={(e) =>
                    handleInputChange("materials", e.target.value)
                  }
                  placeholder="Steel, Zinc, Plastic"
                  required
                />
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
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Create Template
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ))}

      {/* Templates List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.map((template) => (
          <Card
            key={template._id?.toString()}
            className="hover:shadow-md transition-shadow"
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{template.templateName}</CardTitle>
                <Badge variant={template.isActive ? "default" : "secondary"}>
                  {template.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Category:</span>
                  <span className="capitalize">{template.category}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Type:</span>
                  <Badge variant={template.isRawMaterial ? "default" : "secondary"} className="text-xs">
                    {template.isRawMaterial ? "Raw Material" : "Product"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Weight:</span>
                  <span>{template.specifications.weight} kg</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Carbon Footprint:</span>
                  <div className="flex items-center gap-1">
                    <Leaf className="h-3 w-3 text-green-600" />
                    <span className="font-medium">
                      {template.specifications.carbonFootprintPerUnit} kg CO₂/unit
                    </span>
                  </div>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Materials:</span>
                  <p className="text-xs mt-1">{template.specifications.materials.join(', ')}</p>
                </div>
                {template.specifications.dimensions && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Dimensions:</span>
                    <p className="text-xs mt-1">
                      {template.specifications.dimensions.length} × {template.specifications.dimensions.width} × {template.specifications.dimensions.height} cm
                    </p>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openBatchModal(template)}
                  >
                    <Factory className="h-3 w-3 mr-1" />
                    Create Batch
                  </Button>
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
                  {new Date(template.createdAt).toLocaleDateString()}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No templates found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm
                ? "No templates match your search criteria."
                : "Create your first product template to get started."}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Template
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Batch Modal */}
      <Dialog open={showBatchModal} onOpenChange={setShowBatchModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Product Batch</DialogTitle>
            <DialogDescription>
              Create a new production batch for {selectedTemplate?.templateName}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBatchSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="batchNumber">Batch Number *</Label>
              <Input
                id="batchNumber"
                value={batchData.batchNumber}
                onChange={(e) => handleBatchInputChange("batchNumber", e.target.value)}
                placeholder="Enter batch number"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={batchData.quantity}
                onChange={(e) => handleBatchInputChange("quantity", e.target.value)}
                placeholder="Enter quantity to produce"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plantId">Plant *</Label>
              <Select
                value={batchData.plantId}
                onValueChange={(value) => handleBatchInputChange("plantId", value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    isLoadingPlants
                      ? "Loading plants..."
                      : plants.length === 0
                        ? "No plants available"
                        : "Select plant"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingPlants ? (
                    <SelectItem value="" disabled>
                      Loading plants...
                    </SelectItem>
                  ) : plants.length === 0 ? (
                    <SelectItem value="" disabled>
                      No plants registered. Please register a plant first.
                    </SelectItem>
                  ) : (
                    plants.map((plant) => (
                      <SelectItem key={plant._id?.toString()} value={plant._id?.toString() || ""}>
                        {plant.plantName} - {plant.plantCode}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <div className="flex items-center justify-between">
                {isLoadingPlants ? (
                  <p className="text-sm text-muted-foreground">
                    Loading plants...
                  </p>
                ) : plants.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No plants found. Please register a plant first in the Plant Registration section.
                  </p>
                ) : null}
                {!isLoadingPlants && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={fetchPlants}
                    className="text-xs"
                  >
                    Refresh Plants
                  </Button>
                )}
              </div>
            </div>
            {selectedTemplate && (
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Batch Details</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Template:</span>
                    <span>{selectedTemplate.templateName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Carbon per unit:</span>
                    <span>{selectedTemplate.specifications.carbonFootprintPerUnit} kg CO₂</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total carbon footprint:</span>
                    <span className="font-medium">
                      {batchData.quantity ?
                        (selectedTemplate.specifications.carbonFootprintPerUnit * parseInt(batchData.quantity)).toFixed(2) :
                        '0'
                      } kg CO₂
                    </span>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeBatchModal}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Factory className="h-4 w-4 mr-2" />
                    Create Batch
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
