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
  Truck, 
  Plus, 
  Search, 
  MapPin,
  Leaf,
  CheckCircle,
  Edit,
  Trash2,
  Route,
  Fuel
} from "lucide-react";
import { toast } from "sonner";
import { Transportation } from "@/lib/models";
import { useWallet } from "@/hooks/use-wallet";
import { 
  PageHeaderSkeleton, 
  SearchBarSkeleton, 
  FormSkeleton, 
  TransportationCardsSkeleton,
  StatsSummarySkeleton 
} from "@/components/ui/loading-skeletons";

export default function TransportationPage() {
  const { address } = useWallet();
  const [transportations, setTransportations] = useState<Transportation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    vehicleType: "",
    distance: "",
    fuelType: "",
    fuelConsumption: "",
    fromLocation: "",
    toLocation: "",
    productIds: "",
    companyAddress: ""
  });

  useEffect(() => {
    fetchTransportations();
  }, [address]);

  const fetchTransportations = async () => {
    if (!address) return;
    
    try {
      const response = await fetch(`/api/transportation?companyAddress=${address}`);
      if (response.ok) {
        const data = await response.json();
        setTransportations(data);
      }
    } catch (error) {
      console.error('Error fetching transportations:', error);
    } finally {
      setIsInitialLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateCarbonFootprint = () => {
    const distance = parseFloat(formData.distance) || 0;
    const fuelConsumption = parseFloat(formData.fuelConsumption) || 0;
    
    // Basic carbon footprint calculation (kg CO2 per liter of fuel)
    const emissionFactors: { [key: string]: number } = {
      'diesel': 2.68,
      'gasoline': 2.31,
      'electric': 0.12,
      'lpg': 1.51,
      'cng': 1.64
    };
    
    const emissionFactor = emissionFactors[formData.fuelType] || 2.31;
    return (distance * fuelConsumption * emissionFactor).toFixed(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const carbonFootprint = parseFloat(calculateCarbonFootprint());
      const productIds = formData.productIds.split(',').map(id => id.trim()).filter(id => id);

      const transportationData = {
        ...formData,
        distance: parseFloat(formData.distance),
        fuelConsumption: parseFloat(formData.fuelConsumption),
        carbonFootprint,
        productIds,
        companyAddress: address
      };

      const response = await fetch('/api/transportation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transportationData),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Transportation recorded successfully!");
        setShowForm(false);
        setFormData({
          vehicleType: "",
          distance: "",
          fuelType: "",
          fuelConsumption: "",
          fromLocation: "",
          toLocation: "",
          productIds: "",
          companyAddress: ""
        });
        fetchTransportations();
      } else {
        toast.error(result.error || "Failed to record transportation");
      }
    } catch (error) {
      console.error('Error recording transportation:', error);
      toast.error("An error occurred while recording transportation");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTransportations = transportations.filter(transportation =>
    transportation.fromLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transportation.toLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transportation.vehicleType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFuelTypeColor = (type: string) => {
    switch (type) {
      case "diesel": return "bg-gray-100 text-gray-800";
      case "gasoline": return "bg-red-100 text-red-800";
      case "electric": return "bg-green-100 text-green-800";
      case "lpg": return "bg-blue-100 text-blue-800";
      case "cng": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (isInitialLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <PageHeaderSkeleton />
        <SearchBarSkeleton />
        <TransportationCardsSkeleton />
        <StatsSummarySkeleton />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Transportation</h2>
          <p className="text-muted-foreground">
            Track transportation activities and their carbon impact.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Record Transport
          </Button>
          <SidebarTrigger />
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transportations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Add Transportation Form */}
      {showForm && (
        isLoading ? (
          <FormSkeleton />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Record Transportation
              </CardTitle>
              <CardDescription>
                Record transportation activities and calculate their carbon footprint.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicleType">Vehicle Type *</Label>
                  <Select
                    value={formData.vehicleType}
                    onValueChange={(value) => handleInputChange('vehicleType', value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="truck">Truck</SelectItem>
                      <SelectItem value="van">Van</SelectItem>
                      <SelectItem value="car">Car</SelectItem>
                      <SelectItem value="motorcycle">Motorcycle</SelectItem>
                      <SelectItem value="ship">Ship</SelectItem>
                      <SelectItem value="plane">Plane</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fuelType">Fuel Type *</Label>
                  <Select
                    value={formData.fuelType}
                    onValueChange={(value) => handleInputChange('fuelType', value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select fuel type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diesel">Diesel</SelectItem>
                      <SelectItem value="gasoline">Gasoline</SelectItem>
                      <SelectItem value="electric">Electric</SelectItem>
                      <SelectItem value="lpg">LPG</SelectItem>
                      <SelectItem value="cng">CNG</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="distance">Distance (km) *</Label>
                  <Input
                    id="distance"
                    type="number"
                    step="0.1"
                    value={formData.distance}
                    onChange={(e) => handleInputChange('distance', e.target.value)}
                    placeholder="Enter distance in km"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fuelConsumption">Fuel Consumption (L/100km) *</Label>
                  <Input
                    id="fuelConsumption"
                    type="number"
                    step="0.1"
                    value={formData.fuelConsumption}
                    onChange={(e) => handleInputChange('fuelConsumption', e.target.value)}
                    placeholder="Enter fuel consumption"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fromLocation">From Location *</Label>
                  <Input
                    id="fromLocation"
                    value={formData.fromLocation}
                    onChange={(e) => handleInputChange('fromLocation', e.target.value)}
                    placeholder="Enter origin location"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="toLocation">To Location *</Label>
                  <Input
                    id="toLocation"
                    value={formData.toLocation}
                    onChange={(e) => handleInputChange('toLocation', e.target.value)}
                    placeholder="Enter destination location"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="productIds">Product IDs (comma-separated)</Label>
                <Input
                  id="productIds"
                  value={formData.productIds}
                  onChange={(e) => handleInputChange('productIds', e.target.value)}
                  placeholder="Enter product IDs separated by commas"
                />
                <p className="text-xs text-muted-foreground">
                  Optional: Enter product IDs that were transported
                </p>
              </div>

              {/* Carbon Footprint Preview */}
              {formData.distance && formData.fuelConsumption && formData.fuelType && (
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Estimated Carbon Footprint:</span>
                      <div className="flex items-center gap-1">
                        <Leaf className="h-4 w-4 text-green-600" />
                        <span className="text-lg font-bold text-green-700">
                          {calculateCarbonFootprint()} kg CO₂
                        </span>
                      </div>
                    </div>
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
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Recording...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Record Transportation
                    </>
                  )}
                </Button>
              </div>
              </form>
            </CardContent>
          </Card>
        )
      )}

      {/* Transportation List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTransportations.map((transportation) => (
          <Card key={transportation._id?.toString()} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  {transportation.vehicleType}
                </CardTitle>
                <Badge className={getFuelTypeColor(transportation.fuelType)}>
                  {transportation.fuelType}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Route className="h-3 w-3 text-muted-foreground" />
                  <span>{transportation.fromLocation} → {transportation.toLocation}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Distance:</span>
                  <span>{transportation.distance} km</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Fuel Consumption:</span>
                  <span>{transportation.fuelConsumption} L/100km</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Carbon Footprint:</span>
                  <div className="flex items-center gap-1">
                    <Leaf className="h-3 w-3 text-green-600" />
                    <span className="font-medium">{transportation.carbonFootprint} kg CO₂</span>
                  </div>
                </div>
                {transportation.productIds.length > 0 && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Products:</span>
                    <p className="text-xs mt-1">{transportation.productIds.join(', ')}</p>
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
                  {new Date(transportation.createdAt).toLocaleDateString()}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTransportations.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Truck className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No transportation records found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm ? "No transportation records match your search criteria." : "Get started by recording your first transportation activity."}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Record First Transportation
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      {transportations.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Trips</p>
                  <p className="text-2xl font-bold">{transportations.length}</p>
                </div>
                <Truck className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Distance</p>
                  <p className="text-2xl font-bold">
                    {transportations.reduce((sum, t) => sum + t.distance, 0).toFixed(0)} km
                  </p>
                </div>
                <Route className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total CO₂</p>
                  <p className="text-2xl font-bold">
                    {transportations.reduce((sum, t) => sum + t.carbonFootprint, 0).toFixed(1)} kg
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
                  <p className="text-sm font-medium text-muted-foreground">Avg CO₂/Trip</p>
                  <p className="text-2xl font-bold">
                    {(transportations.reduce((sum, t) => sum + t.carbonFootprint, 0) / transportations.length).toFixed(1)} kg
                  </p>
                </div>
                <Fuel className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
