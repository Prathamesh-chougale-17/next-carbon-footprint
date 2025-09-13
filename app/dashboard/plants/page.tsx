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
import { Textarea } from "@/components/ui/textarea";
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
  Building2,
  Plus,
  Search,
  MapPin,
  CheckCircle,
  Edit,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import type { Plant } from "@/lib/models";
import { useWallet } from "@/hooks/use-wallet";

export default function PlantsPage() {
  const { address } = useWallet();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [formData, setFormData] = useState({
    plantName: "",
    plantCode: "",
    description: "",
    location: {
      address: "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
      coordinates: {
        latitude: "",
        longitude: "",
      },
    },
  });

  const fetchPlants = useCallback(async () => {
    if (!address) return;

    try {
      const response = await fetch(`/api/plants?companyAddress=${address}`);
      if (response.ok) {
        const data = await response.json();
        setPlants(data);
      }
    } catch (error) {
      console.error("Error fetching plants:", error);
    } finally {
      setIsInitialLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchPlants();
  }, [fetchPlants]);

  const handleInputChange = (field: string, value: string | boolean) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      if (parent === "location" && child === "coordinates") {
        const [coordField] = field.split(".").slice(2);
        setFormData((prev) => ({
          ...prev,
          location: {
            ...prev.location,
            coordinates: {
              ...prev.location.coordinates,
              [coordField]: value,
            },
          },
        }));
      } else if (parent === "location") {
        setFormData((prev) => ({
          ...prev,
          location: {
            ...prev.location,
            [child]: value,
          },
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const plantData = {
        ...formData,
        companyAddress: address,
        location: {
          ...formData.location,
          coordinates: {
            latitude: parseFloat(formData.location.coordinates.latitude),
            longitude: parseFloat(formData.location.coordinates.longitude),
          },
        },
      };

      const response = await fetch("/api/plants", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(plantData),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Plant registered successfully!");
        setShowForm(false);
        setFormData({
          plantName: "",
          plantCode: "",
          description: "",
          location: {
            address: "",
            city: "",
            state: "",
            country: "",
            postalCode: "",
            coordinates: {
              latitude: "",
              longitude: "",
            },
          },
        });
        fetchPlants();
      } else {
        toast.error(result.error || "Failed to register plant");
      }
    } catch (error) {
      console.error("Error registering plant:", error);
      toast.error("An error occurred while registering the plant");
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (plant: Plant) => {
    setSelectedPlant(plant);
    setFormData({
      plantName: plant.plantName,
      plantCode: plant.plantCode,
      description: plant.description,
      location: {
        address: plant.location.address,
        city: plant.location.city,
        state: plant.location.state,
        country: plant.location.country,
        postalCode: plant.location.postalCode,
        coordinates: {
          latitude: plant.location.coordinates.latitude.toString(),
          longitude: plant.location.coordinates.longitude.toString(),
        },
      },
    });
    setShowEditDialog(true);
  };

  const closeEditDialog = () => {
    setShowEditDialog(false);
    setSelectedPlant(null);
    setFormData({
      plantName: "",
      plantCode: "",
      description: "",
      location: {
        address: "",
        city: "",
        state: "",
        country: "",
        postalCode: "",
        coordinates: {
          latitude: "",
          longitude: "",
        },
      },
    });
  };

  const openDeleteDialog = (plant: Plant) => {
    setSelectedPlant(plant);
    setShowDeleteDialog(true);
  };

  const closeDeleteDialog = () => {
    setShowDeleteDialog(false);
    setSelectedPlant(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlant) return;

    setIsEditLoading(true);
    try {
      const plantData = {
        ...formData,
        location: {
          ...formData.location,
          coordinates: {
            latitude: parseFloat(formData.location.coordinates.latitude),
            longitude: parseFloat(formData.location.coordinates.longitude),
          },
        },
      };

      const response = await fetch(`/api/plants/${selectedPlant._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(plantData),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Plant updated successfully!");
        closeEditDialog();
        fetchPlants();
      } else {
        toast.error(result.error || "Failed to update plant");
      }
    } catch (error) {
      console.error("Error updating plant:", error);
      toast.error("An error occurred while updating the plant");
    } finally {
      setIsEditLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPlant) return;

    setIsDeleteLoading(true);
    try {
      const response = await fetch(`/api/plants/${selectedPlant._id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Plant deleted successfully!");
        closeDeleteDialog();
        fetchPlants();
      } else {
        toast.error(result.error || "Failed to delete plant");
      }
    } catch (error) {
      console.error("Error deleting plant:", error);
      toast.error("An error occurred while deleting the plant");
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const filteredPlants = plants.filter(
    (plant) =>
      plant.plantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plant.plantCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plant.location.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plant.location.country.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (isInitialLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Plant Registration
            </h2>
            <p className="text-muted-foreground">
              Register and manage your manufacturing plants.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Plant Registration
          </h2>
          <p className="text-muted-foreground">
            Register and manage your manufacturing plants with location and
            processing metadata.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Register Plant
          </Button>
          <SidebarTrigger />
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search plants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Register Plant Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Register New Plant
            </CardTitle>
            <CardDescription>
              Register a new manufacturing plant with location coordinates and
              processing capabilities.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="plantName">Plant Name *</Label>
                  <Input
                    id="plantName"
                    value={formData.plantName}
                    onChange={(e) =>
                      handleInputChange("plantName", e.target.value)
                    }
                    placeholder="e.g., Textile Manufacturing Plant A"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plantCode">Plant Code *</Label>
                  <Input
                    id="plantCode"
                    value={formData.plantCode}
                    onChange={(e) =>
                      handleInputChange("plantCode", e.target.value)
                    }
                    placeholder="e.g., TXT-PLANT-001"
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
                  placeholder="Describe the plant's purpose and capabilities"
                  required
                />
              </div>

              {/* Location Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Address *</Label>
                    <Input
                      id="address"
                      value={formData.location.address}
                      onChange={(e) =>
                        handleInputChange("location.address", e.target.value)
                      }
                      placeholder="Street address"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={formData.location.city}
                      onChange={(e) =>
                        handleInputChange("location.city", e.target.value)
                      }
                      placeholder="City"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="state">State/Province *</Label>
                    <Input
                      id="state"
                      value={formData.location.state}
                      onChange={(e) =>
                        handleInputChange("location.state", e.target.value)
                      }
                      placeholder="State/Province"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Country *</Label>
                    <Input
                      id="country"
                      value={formData.location.country}
                      onChange={(e) =>
                        handleInputChange("location.country", e.target.value)
                      }
                      placeholder="Country"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code *</Label>
                    <Input
                      id="postalCode"
                      value={formData.location.postalCode}
                      onChange={(e) =>
                        handleInputChange("location.postalCode", e.target.value)
                      }
                      placeholder="Postal Code"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="latitude">Latitude *</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="0.000001"
                      value={formData.location.coordinates.latitude}
                      onChange={(e) =>
                        handleInputChange(
                          "location.coordinates.latitude",
                          e.target.value,
                        )
                      }
                      placeholder="e.g., 40.7128"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="longitude">Longitude *</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="0.000001"
                      value={formData.location.coordinates.longitude}
                      onChange={(e) =>
                        handleInputChange(
                          "location.coordinates.longitude",
                          e.target.value,
                        )
                      }
                      placeholder="e.g., -74.0060"
                      required
                    />
                  </div>
                </div>
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
                      Register Plant
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Plants List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredPlants.map((plant) => (
          <Card
            key={plant._id?.toString()}
            className="hover:shadow-md transition-shadow"
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{plant.plantName}</CardTitle>
                <Badge variant={plant.isActive ? "default" : "secondary"}>
                  {plant.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <CardDescription>{plant.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {plant.location.city}, {plant.location.country}
                  </span>
                </div>

                <div className="text-sm">
                  <span className="text-muted-foreground">Code:</span>
                  <span className="ml-2 font-mono">{plant.plantCode}</span>
                </div>

                <div className="text-sm">
                  <span className="text-muted-foreground">Address:</span>
                  <span className="ml-2">{plant.location.address}</span>
                </div>

                <div className="text-sm">
                  <span className="text-muted-foreground">State:</span>
                  <span className="ml-2">{plant.location.state}</span>
                </div>

                <div className="text-sm">
                  <span className="text-muted-foreground">Postal Code:</span>
                  <span className="ml-2">{plant.location.postalCode}</span>
                </div>

                <div className="text-sm">
                  <span className="text-muted-foreground">Coordinates:</span>
                  <span className="ml-2 font-mono text-xs">
                    {plant.location.coordinates.latitude.toFixed(6)},{" "}
                    {plant.location.coordinates.longitude.toFixed(6)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(plant)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => openDeleteDialog(plant)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
                <Badge variant="outline" className="text-xs">
                  {new Date(plant.createdAt).toLocaleDateString()}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPlants.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No plants found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm
                ? "No plants match your search criteria."
                : "Register your first manufacturing plant to get started."}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Register First Plant
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Plant Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Plant
            </DialogTitle>
            <DialogDescription>
              Update the plant information and location details.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-plantName">Plant Name *</Label>
                <Input
                  id="edit-plantName"
                  value={formData.plantName}
                  onChange={(e) =>
                    handleInputChange("plantName", e.target.value)
                  }
                  placeholder="e.g., Textile Manufacturing Plant A"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-plantCode">Plant Code *</Label>
                <Input
                  id="edit-plantCode"
                  value={formData.plantCode}
                  onChange={(e) =>
                    handleInputChange("plantCode", e.target.value)
                  }
                  placeholder="e.g., TXT-PLANT-001"
                  required
                />
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
                placeholder="Describe the plant's purpose and capabilities"
                required
              />
            </div>

            {/* Location Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-address">Address *</Label>
                  <Input
                    id="edit-address"
                    value={formData.location.address}
                    onChange={(e) =>
                      handleInputChange("location.address", e.target.value)
                    }
                    placeholder="Street address"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-city">City *</Label>
                  <Input
                    id="edit-city"
                    value={formData.location.city}
                    onChange={(e) =>
                      handleInputChange("location.city", e.target.value)
                    }
                    placeholder="City"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-state">State/Province *</Label>
                  <Input
                    id="edit-state"
                    value={formData.location.state}
                    onChange={(e) =>
                      handleInputChange("location.state", e.target.value)
                    }
                    placeholder="State/Province"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-country">Country *</Label>
                  <Input
                    id="edit-country"
                    value={formData.location.country}
                    onChange={(e) =>
                      handleInputChange("location.country", e.target.value)
                    }
                    placeholder="Country"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-postalCode">Postal Code *</Label>
                  <Input
                    id="edit-postalCode"
                    value={formData.location.postalCode}
                    onChange={(e) =>
                      handleInputChange("location.postalCode", e.target.value)
                    }
                    placeholder="Postal Code"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-latitude">Latitude *</Label>
                  <Input
                    id="edit-latitude"
                    type="number"
                    step="0.000001"
                    value={formData.location.coordinates.latitude}
                    onChange={(e) =>
                      handleInputChange(
                        "location.coordinates.latitude",
                        e.target.value,
                      )
                    }
                    placeholder="e.g., 40.7128"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-longitude">Longitude *</Label>
                  <Input
                    id="edit-longitude"
                    type="number"
                    step="0.000001"
                    value={formData.location.coordinates.longitude}
                    onChange={(e) =>
                      handleInputChange(
                        "location.coordinates.longitude",
                        e.target.value,
                      )
                    }
                    placeholder="e.g., -74.0060"
                    required
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeEditDialog}>
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
                    Update Plant
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Plant Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Plant</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedPlant?.plantName}"? This
              action cannot be undone. The plant will be marked as inactive and
              removed from active operations.
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
                  Delete Plant
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
