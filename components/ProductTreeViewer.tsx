"use client";

import React, { useState, useEffect, useCallback } from "react";
import Tree, { type RawNodeDatum } from "react-d3-tree";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package,
  Factory,
  Leaf,
  MapPin,
  Zap,
  ExternalLink,
  Eye,
  Calendar,
  Weight,
  Hash,
} from "lucide-react";
import { format } from "date-fns";

interface ProductTreeData {
  tokenId: number;
  batch: {
    _id: string;
    batchNumber: string;
    templateId: string;
    quantity: number;
    productionDate: string;
    carbonFootprint: number;
    manufacturerAddress: string;
    plantId: string;
    components?: Array<{
      tokenId: number;
      tokenName: string;
      quantity: number;
      carbonFootprint: number;
      consumed: boolean;
      burnTxHash: string;
    }>;
    createdAt: string;
    updatedAt: string;
    blockNumber?: number;
    tokenContractAddress: string;
    tokenId: number;
    txHash: string;
  };
  product: {
    _id: string;
    templateName: string;
    description: string;
    category: string;
    imageUrl: string;
    specifications: {
      weight: number;
      dimensions: {
        length: number;
        width: number;
        height: number;
      };
      materials: string[];
      carbonFootprintPerUnit: number;
    };
    manufacturerAddress: string;
    isRawMaterial: boolean;
    createdAt: string;
    updatedAt: string;
  };
  plant: {
    _id: string;
    plantName: string;
    plantCode: string;
    description: string;
    companyAddress: string;
    location: {
      address: string;
      city: string;
      state: string;
      country: string;
      postalCode: string;
      coordinates: {
        latitude: number;
        longitude: number;
      };
    };
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  components?: Array<{
    batch: Record<string, unknown>;
    product: Record<string, unknown>;
    plant: Record<string, unknown>;
  }>;
}

interface TreeNode extends RawNodeDatum {
  name: string;
  attributes: {
    type: "product" | "component" | "raw-material";
    tokenId?: number;
    batchNumber?: string;
    quantity?: number;
    carbonFootprint?: number;
    carbonFootprintPerUnit?: number;
    weight?: number;
    plantName?: string;
    location?: string;
    productionDate?: string;
    isRawMaterial?: boolean;
    imageUrl?: string;
    description?: string;
    materials?: string;
    txHash?: string;
  };
  children?: TreeNode[];
}

interface ProductTreeViewerProps {
  tokenId: number;
  className?: string;
}

const ProductTreeViewer: React.FC<ProductTreeViewerProps> = ({
  tokenId,
  className = "",
}) => {
  const [treeData, setTreeData] = useState<TreeNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);

  // Transform API data to tree structure
  const transformToTree = useCallback((data: ProductTreeData): TreeNode => {
    const rootNode: TreeNode = {
      name: data.product.templateName,
      attributes: {
        type: data.product.isRawMaterial ? "raw-material" : "product",
        tokenId: data.tokenId,
        batchNumber: data.batch.batchNumber,
        quantity: data.batch.quantity,
        carbonFootprint: data.batch.carbonFootprint,
        carbonFootprintPerUnit: data.product.specifications.carbonFootprintPerUnit,
        weight: data.product.specifications.weight,
        plantName: data.plant.plantName,
        location: `${data.plant.location.city}, ${data.plant.location.country}`,
        productionDate: data.batch.productionDate,
        isRawMaterial: data.product.isRawMaterial,
        imageUrl: data.product.imageUrl,
        description: data.product.description,
        materials: data.product.specifications.materials.join(", "),
        txHash: data.batch.txHash,
      },
      children: [],
    };

    // Add components as children
    if (data.components && data.components.length > 0) {
      rootNode.children = data.components.map((component) => ({
        name: String(component.product.templateName),
        attributes: {
          type: (component.product.isRawMaterial as boolean) ? "raw-material" : "component",
          tokenId: component.batch.tokenId as number,
          batchNumber: String(component.batch.batchNumber),
          quantity: component.batch.quantity as number,
          carbonFootprint: component.batch.carbonFootprint as number,
          carbonFootprintPerUnit: (component.product.specifications as { carbonFootprintPerUnit: number }).carbonFootprintPerUnit,
          weight: (component.product.specifications as { weight: number }).weight,
          plantName: String(component.plant.plantName),
          location: `${(component.plant.location as { city: string }).city}, ${(component.plant.location as { country: string }).country}`,
          productionDate: String(component.batch.productionDate),
          isRawMaterial: component.product.isRawMaterial as boolean,
          imageUrl: String(component.product.imageUrl),
          description: String(component.product.description),
          materials: (component.product.specifications as { materials: string[] }).materials.join(", "),
          txHash: String(component.batch.txHash),
        },
        children: [],
      }));
    }

    return rootNode;
  }, []);

  // Fetch product data
  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/tokens/${tokenId}`);
        if (!response.ok) {
          throw new Error(
            `Failed to fetch product data: ${response.statusText}`,
          );
        }

        const data: ProductTreeData = await response.json();
        const tree = transformToTree(data);
        setTreeData(tree);
      } catch (err) {
        console.error("Error fetching product data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load product data",
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (tokenId) {
      fetchProductData();
    }
  }, [tokenId, transformToTree]);

  // Custom node renderer
  const renderCustomNode = ({ nodeDatum }: { nodeDatum: RawNodeDatum }) => {
    const treeNode = nodeDatum as TreeNode;
    const { attributes } = treeNode;
    const isRawMaterial = attributes.isRawMaterial;
    const type = attributes.type;

    // Professional color scheme based on type
    const getNodeColors = () => {
      switch (type) {
        case "raw-material":
          return {
            bg: "bg-emerald-50",
            border: "border-emerald-200",
            text: "text-emerald-900",
            icon: "text-emerald-600",
            badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
          };
        case "component":
          return {
            bg: "bg-blue-50",
            border: "border-blue-200",
            text: "text-blue-900",
            icon: "text-blue-600",
            badge: "bg-blue-100 text-blue-800 border-blue-200",
          };
        case "product":
        default:
          return {
            bg: "bg-slate-50",
            border: "border-slate-200",
            text: "text-slate-900",
            icon: "text-slate-600",
            badge: "bg-slate-100 text-slate-800 border-slate-200",
          };
      }
    };

    const colors = getNodeColors();

    return (
      <g>
        <foreignObject width="320" height="160" x="-160" y="-80">
          <button
            type="button"
            className={`${colors.bg} ${colors.border} border rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer w-full text-left backdrop-blur-sm bg-white/80 hover:bg-white/90`}
            onClick={() => setSelectedNode(treeNode)}
          >
            <div className="flex items-start gap-3">
              {/* Product Image */}
              <div className="flex-shrink-0">
                <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200 shadow-sm">
                  {attributes.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={attributes.imageUrl as string}
                      alt={treeNode.name}
                      className="w-full h-full object-cover transition-transform hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-50">
                      {isRawMaterial ? (
                        <Leaf className="h-6 w-6 text-emerald-500" />
                      ) : type === "component" ? (
                        <Package className="h-6 w-6 text-blue-500" />
                      ) : (
                        <Factory className="h-6 w-6 text-slate-500" />
                      )}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-3">
                  <h4
                    className={`${colors.text} font-semibold text-sm truncate`}
                  >
                    {treeNode.name}
                  </h4>
                  <Badge
                    variant="outline"
                    className={`${colors.badge} text-xs font-medium px-2 py-0.5`}
                  >
                    #{attributes.tokenId}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5 text-slate-500" />
                    <span className="font-medium">{attributes.quantity?.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Weight className="h-3.5 w-3.5 text-slate-500" />
                    <span className="font-medium">{attributes.weight}kg</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-orange-500" />
                    <span className="font-medium">{attributes.carbonFootprintPerUnit?.toFixed(3)}/unit</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-500" />
                    <span className="font-medium">{attributes.productionDate ? format(new Date(attributes.productionDate), "MMM dd") : "N/A"}</span>
                  </div>

                  <div className="flex items-center gap-1.5 col-span-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-500" />
                    <span className="truncate font-medium">{attributes.location}</span>
                  </div>

                  {attributes.txHash && (
                    <div className="flex items-center gap-1.5 col-span-2">
                      <Hash className="h-3.5 w-3.5 text-slate-500" />
                      <span className="truncate font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                        {attributes.txHash.slice(0, 8)}...{attributes.txHash.slice(-6)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </button>
        </foreignObject>
      </g>
    );
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product Supply Chain Tree
          </CardTitle>
          <CardDescription>
            Visualizing the complete supply chain for Token #{tokenId}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product Supply Chain Tree
          </CardTitle>
          <CardDescription>
            Visualizing the complete supply chain for Token #{tokenId}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">Failed to load product data</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!treeData) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product Supply Chain Tree
          </CardTitle>
          <CardDescription>
            Visualizing the complete supply chain for Token #{tokenId}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No product data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Product Supply Chain Tree
        </CardTitle>
        <CardDescription>
          Visualizing the complete supply chain for Token #{tokenId}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Legend */}
          <div className="flex items-center gap-8 text-sm bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-slate-50 border border-slate-200 rounded-lg shadow-sm"></div>
              <span className="font-medium text-slate-700">Final Product</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-50 border border-blue-200 rounded-lg shadow-sm"></div>
              <span className="font-medium text-slate-700">Components</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-emerald-50 border border-emerald-200 rounded-lg shadow-sm"></div>
              <span className="font-medium text-slate-700">Raw Materials</span>
            </div>
          </div>

          {/* Tree Visualization */}
          <div className="border border-slate-200 rounded-xl p-6 bg-gradient-to-br from-slate-50 to-white min-h-[400px] shadow-sm">
            <div style={{ width: "100%", height: "400px" }}>
              <Tree
                data={treeData}
                orientation="horizontal"
                pathFunc="step"
                renderCustomNodeElement={renderCustomNode}
                nodeSize={{ x: 350, y: 180 }}
                separation={{ siblings: 1.8, nonSiblings: 2.2 }}
                translate={{ x: 150, y: 200 }}
                zoom={0.7}
                enableLegacyTransitions={true}
                transitionDuration={300}
              />
            </div>
          </div>

          {/* Node Details Panel */}
          {selectedNode && (
            <div className="border border-slate-200 rounded-xl p-6 bg-white shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  {/* Product Image */}
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200 shadow-sm">
                    {selectedNode.attributes.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={selectedNode.attributes.imageUrl as string}
                        alt={selectedNode.name}
                        className="w-full h-full object-cover transition-transform hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-50">
                        <Package className="h-8 w-8 text-slate-400" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-xl text-slate-900 mb-1">{selectedNode.name}</h4>
                    <Badge variant="outline" className="bg-slate-100 text-slate-800 border-slate-200">
                      Token #{selectedNode.attributes.tokenId}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedNode(null)}
                  className="text-slate-500 hover:text-slate-700"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-6 text-sm">
                <div className="space-y-1">
                  <span className="font-medium text-slate-600 text-xs uppercase tracking-wide">Token ID</span>
                  <p className="text-slate-900 font-semibold">#{selectedNode.attributes.tokenId}</p>
                </div>
                <div className="space-y-1">
                  <span className="font-medium text-slate-600 text-xs uppercase tracking-wide">Batch</span>
                  <p className="text-slate-900 font-semibold">#{selectedNode.attributes.batchNumber}</p>
                </div>
                <div className="space-y-1">
                  <span className="font-medium text-slate-600 text-xs uppercase tracking-wide">Quantity</span>
                  <p className="text-slate-900 font-semibold">{selectedNode.attributes.quantity?.toLocaleString()} units</p>
                </div>
                <div className="space-y-1">
                  <span className="font-medium text-slate-600 text-xs uppercase tracking-wide">Weight</span>
                  <p className="text-slate-900 font-semibold">{selectedNode.attributes.weight} kg</p>
                </div>
                <div className="space-y-1">
                  <span className="font-medium text-slate-600 text-xs uppercase tracking-wide">Carbon Footprint</span>
                  <p className="text-slate-900 font-semibold">
                    {((selectedNode.attributes.carbonFootprint || 0) / 1000).toFixed(2)} tons CO₂
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="font-medium text-slate-600 text-xs uppercase tracking-wide">Carbon per Unit</span>
                  <p className="text-slate-900 font-semibold">
                    {selectedNode.attributes.carbonFootprintPerUnit?.toFixed(3)} tons CO₂/unit
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="font-medium text-slate-600 text-xs uppercase tracking-wide">Plant</span>
                  <p className="text-slate-900 font-semibold">{selectedNode.attributes.plantName}</p>
                </div>
                <div className="space-y-1">
                  <span className="font-medium text-slate-600 text-xs uppercase tracking-wide">Location</span>
                  <p className="text-slate-900 font-semibold">{selectedNode.attributes.location}</p>
                </div>
                <div className="space-y-1">
                  <span className="font-medium text-slate-600 text-xs uppercase tracking-wide">Production Date</span>
                  <p className="text-slate-900 font-semibold">
                    {selectedNode.attributes.productionDate &&
                      format(new Date(selectedNode.attributes.productionDate), "MMM dd, yyyy")}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="font-medium text-slate-600 text-xs uppercase tracking-wide">Type</span>
                  <p className="text-slate-900 font-semibold">
                    {selectedNode.attributes.isRawMaterial ? "Raw Material" : "Manufactured Product"}
                  </p>
                </div>
              </div>

              {selectedNode.attributes.materials && (
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <span className="font-medium text-slate-600 text-xs uppercase tracking-wide block mb-3">
                    Materials
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedNode.attributes.materials.split(", ").map((material) => (
                      <Badge
                        key={material}
                        variant="secondary"
                        className="text-xs bg-slate-100 text-slate-700 border-slate-200"
                      >
                        {material}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedNode.attributes.description && (
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <span className="font-medium text-slate-600 text-xs uppercase tracking-wide block mb-3">
                    Description
                  </span>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {selectedNode.attributes.description}
                  </p>
                </div>
              )}

              {selectedNode.attributes.txHash && (
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <span className="font-medium text-slate-600 text-xs uppercase tracking-wide block mb-3">
                    Blockchain Transaction
                  </span>
                  <div className="flex items-center gap-3">
                    <code className="text-xs bg-slate-100 text-slate-700 px-3 py-2 rounded-lg font-mono border border-slate-200">
                      {selectedNode.attributes.txHash.slice(0, 10)}...
                      {selectedNode.attributes.txHash.slice(-8)}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-xs border-slate-200 hover:bg-slate-50"
                      onClick={() =>
                        window.open(
                          `https://testnet.snowtrace.io/tx/${selectedNode.attributes.txHash}`,
                          "_blank",
                        )
                      }
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View on Explorer
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductTreeViewer;
