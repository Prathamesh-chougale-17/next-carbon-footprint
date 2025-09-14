"use client";

import { useState, useEffect, useCallback } from "react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { ProductTemplate, Plant } from "@/lib/models";
import { useWallet } from "@/hooks/use-wallet";
import { NetworkStatus } from "@/components/network-status";
import {
  PageHeaderSkeleton,
  SearchBarSkeleton,
  FormSkeleton,
  ProductCardsSkeleton,
  EmptyStateSkeleton,
} from "@/components/ui/loading-skeletons";

interface TokenBalance {
  tokenId: number;
  balance: number;
  batchInfo: {
    batchNumber: number;
    manufacturer: string;
    templateId: string;
    quantity: number;
    productionDate: number;
    expiryDate: number;
    carbonFootprint: number;
    plantId: string;
    metadataURI: string;
    isActive: boolean;
  };
}

interface Component {
  tokenId: number;
  tokenName: string;
  quantity: number;
  availableBalance: number;
}

export default function ProductTemplatesPage() {
  const { address } = useWallet();
  const [templates, setTemplates] = useState<ProductTemplate[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [inventoryTokens, setInventoryTokens] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingPlants, setIsLoadingPlants] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ProductTemplate | null>(null);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [batchData, setBatchData] = useState({
    batchNumber: "",
    quantity: "",
    plantId: ""
  });
  const [components, setComponents] = useState<Component[]>([]);
  const [tokenProductTemplates, setTokenProductTemplates] = useState<{ [key: number]: any }>({});
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
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
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
  }, [address]);

  const fetchPlants = useCallback(async () => {
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
  }, [address]);

  // Fetch inventory tokens for component selection
  const fetchInventoryTokens = useCallback(async () => {
    if (!address) return;

    try {
      console.log('Fetching inventory tokens for address:', address);
      // Import smart contract service dynamically
      const { smartContractService } = await import('@/lib/smart-contract');

      await smartContractService.initialize();
      const balances = await smartContractService.getUserTokenBalances(address);
      console.log('Inventory tokens fetched:', balances);
      console.log('Token batch info details:', balances.map(t => ({
        tokenId: t.tokenId,
        templateId: t.batchInfo.templateId,
        templateIdType: typeof t.batchInfo.templateId
      })));
      setInventoryTokens(balances);

      // Fetch product templates for each token
      const templatePromises = balances.map(async (token) => {
        const template = await fetchProductTemplateById(token.batchInfo.templateId);
        return { tokenId: token.tokenId, template };
      });

      const templateResults = await Promise.all(templatePromises);
      const templateMap = templateResults.reduce((acc, { tokenId, template }) => {
        acc[tokenId] = template;
        return acc;
      }, {} as { [key: number]: any });

      console.log('Fetched product templates for tokens:', templateMap);
      setTokenProductTemplates(templateMap);
    } catch (error) {
      console.error('Error fetching inventory tokens:', error);
      setInventoryTokens([]);
    }
  }, [address]);

  useEffect(() => {
    fetchTemplates();
    fetchPlants();
    fetchInventoryTokens();
  }, [fetchTemplates, fetchPlants, fetchInventoryTokens]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  // Upload image to server
  const uploadImage = async (): Promise<string | null> => {
    if (!selectedImage) return null;

    try {
      const formData = new FormData();
      formData.append('image', selectedImage);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        return result.imageUrl;
      } else {
        throw new Error('Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  // Clear image selection
  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setUploadedImageUrl(null);
    // Reset file input
    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleBatchInputChange = (field: string, value: string) => {
    setBatchData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Component management functions
  const addComponent = (tokenId: number, tokenName: string, availableBalance: number) => {
    const newComponent: Component = {
      tokenId,
      tokenName,
      quantity: 1,
      availableBalance
    };
    setComponents(prev => [...prev, newComponent]);
  };

  const removeComponent = (index: number) => {
    setComponents(prev => prev.filter((_, i) => i !== index));
  };

  const updateComponentQuantity = (index: number, quantity: number) => {
    setComponents(prev => prev.map((comp, i) =>
      i === index ? { ...comp, quantity } : comp
    ));
  };

  // Calculate total carbon footprint including components
  const calculateTotalEmissions = () => {
    if (!selectedTemplate || !batchData.quantity) return 0;

    // Base emissions from the product template
    const baseEmissions = selectedTemplate.specifications.carbonFootprintPerUnit * parseInt(batchData.quantity);

    // Component emissions
    const componentEmissions = components.reduce((total, component) => {
      // Find the component token in inventory to get its carbon footprint
      const componentToken = inventoryTokens.find(token => token.tokenId === component.tokenId);
      if (componentToken) {
        // Calculate carbon footprint per unit for this component
        const carbonPerUnit = componentToken.batchInfo.carbonFootprint / componentToken.batchInfo.quantity;
        return total + (carbonPerUnit * component.quantity);
      }
      return total;
    }, 0);

    return baseEmissions + (componentEmissions / 1000); // Convert from kg to tons
  };

  // Fetch product template by ID from database (like in inventory page)
  const fetchProductTemplateById = async (templateId: string) => {
    try {
      const response = await fetch(`/api/product-templates/${templateId}`);
      if (response.ok) {
        const template = await response.json();
        return template;
      }
    } catch (error) {
      console.error('Error fetching product template:', error);
    }
    return null;
  };

  const openBatchModal = async (template: ProductTemplate) => {
    setSelectedTemplate(template);
    // Generate a numeric batch number (using timestamp)
    setBatchData({
      batchNumber: Date.now().toString(),
      quantity: "",
      plantId: ""
    });
    setComponents([]); // Reset components

    // Ensure plants are loaded when opening modal
    if (plants.length === 0) {
      await fetchPlants();
    }

    // Fetch fresh inventory tokens when opening modal for non-raw materials
    if (!template.isRawMaterial) {
      await fetchInventoryTokens();
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
    setComponents([]); // Reset components
  };

  const openEditDialog = (template: ProductTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      templateName: template.templateName,
      description: template.description,
      category: template.category,
      weight: template.specifications.weight.toString(),
      length: template.specifications.dimensions?.length?.toString() || "",
      width: template.specifications.dimensions?.width?.toString() || "",
      height: template.specifications.dimensions?.height?.toString() || "",
      materials: template.specifications.materials.join(', '),
      carbonFootprintPerUnit: template.specifications.carbonFootprintPerUnit.toString(),
      isRawMaterial: template.isRawMaterial,
      manufacturerAddress: template.manufacturerAddress
    });
    setShowEditDialog(true);
  };

  const closeEditDialog = () => {
    setShowEditDialog(false);
    setSelectedTemplate(null);
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
  };

  const openDeleteDialog = (template: ProductTemplate) => {
    setSelectedTemplate(template);
    setShowDeleteDialog(true);
  };

  const closeDeleteDialog = () => {
    setShowDeleteDialog(false);
    setSelectedTemplate(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;

    setIsEditLoading(true);
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
        isRawMaterial: formData.isRawMaterial,
        isActive: true
      };

      const response = await fetch(`/api/product-templates/${selectedTemplate._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(templateData),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Product template updated successfully!");
        closeEditDialog();
        fetchTemplates();
      } else {
        toast.error(result.error || "Failed to update template");
      }
    } catch (error) {
      console.error("Error updating template:", error);
      toast.error("An error occurred while updating the template");
    } finally {
      setIsEditLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTemplate) return;

    setIsDeleteLoading(true);
    try {
      const response = await fetch(`/api/product-templates/${selectedTemplate._id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Product template deleted successfully!");
        closeDeleteDialog();
        fetchTemplates();
      } else {
        toast.error(result.error || "Failed to delete template");
      }
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error("An error occurred while deleting the template");
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Upload image first if selected
      let imageUrl = null;
      if (selectedImage) {
        try {
          imageUrl = await uploadImage();
        } catch (error) {
          console.error('Failed to upload image:', error);
          toast.error('Failed to upload image. Please try again.');
          setIsLoading(false);
          return;
        }
      }

      const templateData = {
        templateName: formData.templateName,
        description: formData.description,
        category: formData.category,
        imageUrl: imageUrl,
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
        clearImage();
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

    // Validate form data before submission
    if (!batchData.batchNumber || !batchData.quantity || !batchData.plantId) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate components for non-raw materials
    if (!selectedTemplate.isRawMaterial && components.length === 0) {
      toast.error('Please add at least one component for this product');
      return;
    }

    const batchNumber = parseInt(batchData.batchNumber);
    const quantity = parseInt(batchData.quantity);

    if (isNaN(batchNumber) || batchNumber <= 0) {
      toast.error('Batch number must be a valid positive number');
      return;
    }

    if (isNaN(quantity) || quantity <= 0) {
      toast.error('Quantity must be a valid positive number');
      return;
    }

    setIsLoading(true);
    try {
      // Calculate total carbon footprint including components
      const totalEmissions = calculateTotalEmissions();

      // Prepare components data if this is a complex batch (non-raw material)
      let componentsData = undefined;
      if (!selectedTemplate.isRawMaterial && components.length > 0) {
        componentsData = components.map(component => {
          const componentToken = inventoryTokens.find(token => token.tokenId === component.tokenId);
          const carbonPerUnit = componentToken ? componentToken.batchInfo.carbonFootprint / componentToken.batchInfo.quantity : 0;
          const componentTotalCarbon = Math.round(carbonPerUnit * component.quantity); // Keep in kg

          return {
            tokenId: component.tokenId,
            tokenName: component.tokenName,
            quantity: component.quantity,
            carbonFootprint: componentTotalCarbon
          };
        });
      }

      // First, create the batch in the database
      const batchPayload = {
        batchNumber: batchData.batchNumber,
        templateId: selectedTemplate._id?.toString(),
        quantity: parseInt(batchData.quantity),
        productionDate: new Date().toISOString(),
        carbonFootprint: Math.round(totalEmissions * 1000), // Convert from tons to kg
        manufacturerAddress: address,
        plantId: batchData.plantId,
        components: componentsData
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
        toast.success('Product batch created successfully! You can now mint tokens from the Batches page.');

        closeBatchModal();
        setBatchData({ batchNumber: '', quantity: '', plantId: '' });
        fetchTemplates();
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

              {/* Image Upload Section */}
              <div className="space-y-2">
                <Label htmlFor="image-upload">Product Image</Label>
                <div className="space-y-3">
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="cursor-pointer"
                  />
                  {imagePreview && (
                    <div className="relative inline-block">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                        onClick={clearImage}
                      >
                        ×
                      </Button>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Upload a product image (max 5MB). This will be displayed in wallets as the token image.
                  </p>
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
                  <Label htmlFor="carbonFootprintPerUnit">Carbon Footprint per Unit (tons CO₂/unit) *</Label>
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
                <div className="flex items-center gap-3">
                  {template.imageUrl && (
                    <img
                      src={template.imageUrl}
                      alt={template.templateName}
                      className="w-12 h-12 object-cover rounded-lg border"
                    />
                  )}
                  <CardTitle className="text-lg">{template.templateName}</CardTitle>
                </div>
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
                      {template.specifications.carbonFootprintPerUnit} tons CO₂/unit
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(template)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => openDeleteDialog(template)}
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
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Product Batch</DialogTitle>
            <DialogDescription>
              Create a new production batch for {selectedTemplate?.templateName}
            </DialogDescription>
          </DialogHeader>
          <div className="mb-4">
            <NetworkStatus />
          </div>
          <form onSubmit={handleBatchSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="batchNumber">Batch Number *</Label>
              <Input
                id="batchNumber"
                type="number"
                value={batchData.batchNumber}
                onChange={(e) => handleBatchInputChange("batchNumber", e.target.value)}
                placeholder="Enter batch number"
                min="1"
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

            {/* Component Selection - Only for non-raw materials */}
            {selectedTemplate && !selectedTemplate.isRawMaterial && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Components</Label>
                  <div className="flex items-center gap-2">
                    <Select
                      onValueChange={(value) => {
                        const token = inventoryTokens.find(t => t.tokenId.toString() === value);
                        if (token) {
                          const productTemplate = tokenProductTemplates[token.tokenId];
                          const productName = productTemplate ? productTemplate.templateName : `Token #${token.tokenId}`;
                          addComponent(token.tokenId, productName, token.balance);
                        }
                      }}
                    >
                      <SelectTrigger className="w-40 h-8">
                        <SelectValue placeholder="Select token" />
                      </SelectTrigger>
                      <SelectContent>
                        {inventoryTokens
                          .filter(token => !components.some(comp => comp.tokenId === token.tokenId))
                          .map((token) => {
                            const productTemplate = tokenProductTemplates[token.tokenId];
                            console.log('Debug - token:', token.tokenId, 'templateId:', token.batchInfo.templateId, 'found template:', productTemplate);
                            const productName = productTemplate ? productTemplate.templateName : `Token #${token.tokenId}`;

                            return (
                              <SelectItem key={token.tokenId} value={token.tokenId.toString()}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{productName}</span>
                                  <span className="text-xs text-muted-foreground">
                                    Token #{token.tokenId} • Available: {token.balance}
                                  </span>
                                </div>
                              </SelectItem>
                            );
                          })}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={inventoryTokens.filter(token =>
                        !components.some(comp => comp.tokenId === token.tokenId)
                      ).length === 0}
                      className="text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>

                {components.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground border-2 border-dashed rounded-lg">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No components added</p>
                    <p className="text-xs">Add components from your inventory</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {components.map((component, index) => (
                      <div key={`${component.tokenId}-${index}`} className="flex items-center gap-2 p-2 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{component.tokenName}</span>
                              <span className="text-xs text-muted-foreground">
                                Token #{component.tokenId}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              Available: {component.availableBalance}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`quantity-${index}`} className="text-xs">Quantity:</Label>
                            <Input
                              id={`quantity-${index}`}
                              type="number"
                              min="1"
                              max={component.availableBalance}
                              value={component.quantity}
                              onChange={(e) => updateComponentQuantity(index, parseInt(e.target.value) || 1)}
                              className="w-20 h-8 text-xs"
                            />
                          </div>
                          {(() => {
                            const componentToken = inventoryTokens.find(token => token.tokenId === component.tokenId);
                            if (componentToken) {
                              const carbonPerUnit = componentToken.batchInfo.carbonFootprint / componentToken.batchInfo.quantity;
                              const componentTotalEmissions = (carbonPerUnit * component.quantity) / 1000;
                              return (
                                <div className="text-xs text-green-600 mt-1">
                                  Emissions: {componentTotalEmissions.toFixed(3)} tons CO₂
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeComponent(index)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {inventoryTokens.length === 0 && (
                  <p className="text-xs text-amber-600">
                    No inventory tokens found. You need tokens in your inventory to use as components.
                  </p>
                )}
              </div>
            )}

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
                    <span>{selectedTemplate.specifications.carbonFootprintPerUnit} tons CO₂</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Base carbon footprint:</span>
                    <span>
                      {batchData.quantity ?
                        (selectedTemplate.specifications.carbonFootprintPerUnit * parseInt(batchData.quantity)).toFixed(2) :
                        '0'
                      } tons CO₂
                    </span>
                  </div>

                  {/* Component emissions breakdown */}
                  {!selectedTemplate.isRawMaterial && components.length > 0 && (
                    <>
                      <div className="border-t pt-2 mt-2">
                        <div className="text-xs font-medium text-muted-foreground mb-1">Component Emissions:</div>
                        {components.map((component, index) => {
                          const componentToken = inventoryTokens.find(token => token.tokenId === component.tokenId);
                          if (!componentToken) return null;

                          const carbonPerUnit = componentToken.batchInfo.carbonFootprint / componentToken.batchInfo.quantity;
                          const componentTotalEmissions = (carbonPerUnit * component.quantity) / 1000; // Convert to tons

                          return (
                            <div key={index} className="flex justify-between text-xs">
                              <span className="text-muted-foreground">
                                {component.tokenName} ({component.quantity} units):
                              </span>
                              <span>{componentTotalEmissions.toFixed(3)} tons CO₂</span>
                            </div>
                          );
                        })}
                        <div className="flex justify-between text-xs font-medium border-t pt-1 mt-1">
                          <span>Total component emissions:</span>
                          <span>
                            {(components.reduce((total, component) => {
                              const componentToken = inventoryTokens.find(token => token.tokenId === component.tokenId);
                              if (componentToken) {
                                const carbonPerUnit = componentToken.batchInfo.carbonFootprint / componentToken.batchInfo.quantity;
                                return total + (carbonPerUnit * component.quantity);
                              }
                              return total;
                            }, 0) / 1000).toFixed(3)} tons CO₂
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between border-t pt-2 mt-2">
                    <span className="font-medium">Total carbon footprint:</span>
                    <span className="font-bold text-lg">
                      {calculateTotalEmissions().toFixed(3)} tons CO₂
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

      {/* Edit Template Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Product Template
            </DialogTitle>
            <DialogDescription>
              Update the product template specifications and carbon footprint data.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-templateName">Template Name *</Label>
                <Input
                  id="edit-templateName"
                  value={formData.templateName}
                  onChange={(e) =>
                    handleInputChange("templateName", e.target.value)
                  }
                  placeholder="e.g., Steel Bolt M8"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-category">Category *</Label>
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
              <Label htmlFor="edit-description">Description *</Label>
              <Textarea
                id="edit-description"
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
                <Label htmlFor="edit-weight">Weight (kg) *</Label>
                <Input
                  id="edit-weight"
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
                <Label htmlFor="edit-length">Length (cm)</Label>
                <Input
                  id="edit-length"
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
                <Label htmlFor="edit-width">Width (cm)</Label>
                <Input
                  id="edit-width"
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
                <Label htmlFor="edit-height">Height (cm)</Label>
                <Input
                  id="edit-height"
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
                <Label htmlFor="edit-carbonFootprintPerUnit">Carbon Footprint per Unit (tons CO₂/unit) *</Label>
                <Input
                  id="edit-carbonFootprintPerUnit"
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
              <Label htmlFor="edit-materials">Materials (comma-separated) *</Label>
              <Input
                id="edit-materials"
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
                id="edit-isRawMaterial"
                checked={formData.isRawMaterial}
                onCheckedChange={(checked) =>
                  handleInputChange("isRawMaterial", checked as boolean)
                }
              />
              <Label htmlFor="edit-isRawMaterial">Is Raw Material</Label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeEditDialog}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isEditLoading}>
                {isEditLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Update Template
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Template Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedTemplate?.templateName}"? This action cannot be undone.
              All associated product batches will also be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDeleteDialog}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleteLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleteLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Template
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
