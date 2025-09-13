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
  QrCode, 
  Plus, 
  Search, 
  Download,
  Eye,
  Copy,
  CheckCircle,
  Edit,
  Trash2,
  Package,
  Leaf,
  ExternalLink,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { Product } from "@/lib/models";
import { useWallet } from "@/hooks/use-wallet";
import { QRCode } from "@/components/ui/kibo-ui/qr-code";

interface QRCodeRecord {
  _id?: string;
  productId: string;
  productName: string;
  qrData: string;
  qrType: 'product' | 'asset' | 'token';
  companyAddress: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function QRCodePage() {
  const { address } = useWallet();
  const [qrCodes, setQrCodes] = useState<QRCodeRecord[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedQR, setSelectedQR] = useState<QRCodeRecord | null>(null);
  const [formData, setFormData] = useState({
    productId: "",
    qrType: "",
    customData: "",
    companyAddress: ""
  });

  useEffect(() => {
    fetchQRCodes();
    fetchProducts();
  }, [address]);

  const fetchQRCodes = async () => {
    if (!address) return;
    
    try {
      const response = await fetch(`/api/qr-codes?companyAddress=${address}`);
      if (response.ok) {
        const data = await response.json();
        setQrCodes(data);
      }
    } catch (error) {
      console.error('Error fetching QR codes:', error);
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

  const generateQRData = () => {
    const selectedProduct = products.find(p => p._id?.toString() === formData.productId);
    if (!selectedProduct) return formData.customData;

    const qrData = {
      type: formData.qrType,
      productId: selectedProduct._id,
      productName: selectedProduct.productName,
      carbonFootprint: selectedProduct.carbonFootprint,
      weight: selectedProduct.weight,
      companyAddress: address,
      timestamp: new Date().toISOString(),
      blockchain: "avalanche",
      customData: formData.customData
    };

    return JSON.stringify(qrData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const qrData = generateQRData();
      const selectedProduct = products.find(p => p._id?.toString() === formData.productId);

      const qrCodeData = {
        productId: formData.productId,
        productName: selectedProduct?.productName || "Custom QR Code",
        qrData: qrData,
        qrType: formData.qrType,
        companyAddress: address
      };

      const response = await fetch('/api/qr-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(qrCodeData),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("QR Code generated successfully!");
        setShowForm(false);
        setFormData({
          productId: "",
          qrType: "",
          customData: "",
          companyAddress: ""
        });
        fetchQRCodes();
      } else {
        toast.error(result.error || "Failed to generate QR code");
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error("An error occurred while generating the QR code");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredQRCodes = qrCodes.filter(qr =>
    qr.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    qr.qrType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getQRTypeColor = (type: string) => {
    switch (type) {
      case "product": return "bg-blue-100 text-blue-800";
      case "asset": return "bg-green-100 text-green-800";
      case "token": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const downloadQRCode = async (qrCode: QRCodeRecord) => {
    try {
      // Import QR library dynamically
      const QR = (await import('qrcode')).default;
      
      // Generate QR code as PNG
      const canvas = document.createElement('canvas');
      await QR.toCanvas(canvas, qrCode.qrData, {
        width: 256,
        errorCorrectionLevel: 'M',
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      // Download the image
      const link = document.createElement('a');
      link.download = `qr-code-${qrCode.productName.replace(/\s+/g, '-')}.png`;
      link.href = canvas.toDataURL();
      link.click();
      
      toast.success("QR Code downloaded successfully!");
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast.error("Failed to download QR code");
    }
  };

  const copyQRData = (qrCode: QRCodeRecord) => {
    navigator.clipboard.writeText(qrCode.qrData);
    toast.success("QR Code data copied to clipboard");
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">QR Code Generator</h2>
          <p className="text-muted-foreground">
            Generate QR codes for products, assets, and tokens with blockchain verification.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Generate QR Code
          </Button>
          <SidebarTrigger />
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search QR codes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Generate QR Code Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Generate QR Code
            </CardTitle>
            <CardDescription>
              Create QR codes for products, assets, or tokens with embedded blockchain data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
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
                  <Label htmlFor="qrType">QR Code Type *</Label>
                  <Select
                    value={formData.qrType}
                    onValueChange={(value) => handleInputChange('qrType', value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select QR type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="product">Product QR</SelectItem>
                      <SelectItem value="asset">Asset QR</SelectItem>
                      <SelectItem value="token">Token QR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customData">Custom Data (Optional)</Label>
                <Textarea
                  id="customData"
                  value={formData.customData}
                  onChange={(e) => handleInputChange('customData', e.target.value)}
                  placeholder="Add any additional data to include in the QR code"
                  rows={3}
                />
              </div>

              {/* QR Code Preview */}
              {formData.productId && formData.qrType && (
                <Card className="bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-sm">QR Code Preview</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center space-y-4">
                    <div className="bg-white p-4 rounded-lg border w-32 h-32">
                      <QRCode 
                        data={generateQRData()} 
                        robustness="M"
                        className="w-full h-full"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      This QR code contains blockchain-verified product information
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
                <Button type="submit" disabled={isLoading || !formData.productId || !formData.qrType}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Generate QR Code
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* QR Codes List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredQRCodes.map((qrCode) => (
          <Card key={qrCode._id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <QrCode className="h-4 w-4" />
                  {qrCode.productName}
                </CardTitle>
                <Badge className={getQRTypeColor(qrCode.qrType)}>
                  {qrCode.qrType}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* QR Code Display */}
                <div className="flex justify-center">
                  <div className="bg-white p-3 rounded-lg border w-30 h-30">
                    <QRCode 
                      data={qrCode.qrData} 
                      robustness="M"
                      className="w-full h-full"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Product ID:</span>
                    <span className="font-mono text-xs">{qrCode.productId.slice(0, 8)}...</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="capitalize">{qrCode.qrType}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Created:</span>
                    <span>{new Date(qrCode.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedQR(qrCode)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => downloadQRCode(qrCode)}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => copyQRData(qrCode)}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredQRCodes.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <QrCode className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No QR codes found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm ? "No QR codes match your search criteria." : "Get started by generating your first QR code."}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Generate First QR Code
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* QR Code Detail Modal */}
      {selectedQR && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  QR Code Details
                </CardTitle>
                <Button variant="outline" onClick={() => setSelectedQR(null)}>
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-lg border w-48 h-48">
                  <QRCode 
                    data={selectedQR.qrData} 
                    robustness="M"
                    className="w-full h-full"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Product Name</Label>
                  <p className="text-sm text-muted-foreground">{selectedQR.productName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">QR Code Type</Label>
                  <Badge className={getQRTypeColor(selectedQR.qrType)}>
                    {selectedQR.qrType}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">QR Code Data</Label>
                  <div className="bg-muted p-3 rounded-lg">
                    <pre className="text-xs overflow-x-auto">
                      {JSON.stringify(JSON.parse(selectedQR.qrData), null, 2)}
                    </pre>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => downloadQRCode(selectedQR)} className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button variant="outline" onClick={() => copyQRData(selectedQR)} className="flex-1">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stats */}
      {qrCodes.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total QR Codes</p>
                  <p className="text-2xl font-bold">{qrCodes.length}</p>
                </div>
                <QrCode className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Product QR Codes</p>
                  <p className="text-2xl font-bold">
                    {qrCodes.filter(qr => qr.qrType === 'product').length}
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
                  <p className="text-sm font-medium text-muted-foreground">Asset QR Codes</p>
                  <p className="text-2xl font-bold">
                    {qrCodes.filter(qr => qr.qrType === 'asset').length}
                  </p>
                </div>
                <ExternalLink className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Token QR Codes</p>
                  <p className="text-2xl font-bold">
                    {qrCodes.filter(qr => qr.qrType === 'token').length}
                  </p>
                </div>
                <Leaf className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
