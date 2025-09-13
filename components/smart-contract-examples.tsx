"use client";

import { useState } from "react";
import { useSmartContract, useMintBatch, useBatchInfo, useCurrentTokenId, useTransferTokens, useAllUserTokenBalances } from "@/lib/smart-contract-wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

// Example component showing how to use the wagmi smart contract hooks
export function SmartContractExamples() {
  const { address, isConnected, isCorrectNetwork, switchToCorrectNetwork } = useSmartContract();
  const { currentTokenId, isLoading: isLoadingTokenId } = useCurrentTokenId();
  // Token balances will be loaded in the TokenBalancesList component

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please connect your wallet to interact with the smart contract.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please switch to Avalanche Fuji Testnet to continue.
            </AlertDescription>
          </Alert>
          <Button onClick={switchToCorrectNetwork} className="mt-4">
            Switch Network
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Smart Contract Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">Address:</span>
              <Badge variant="outline">{address}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Network:</span>
              <Badge variant="outline">Avalanche Fuji Testnet</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Current Token ID:</span>
              {isLoadingTokenId ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Badge variant="outline">{currentTokenId}</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <MintBatchForm />
      <TransferTokensForm />
      <TokenBalancesList />
    </div>
  );
}

// Component for minting batch tokens
function MintBatchForm() {
  const { mintBatch, isLoading, isConfirmed, error, tokenId } = useMintBatch();
  const [formData, setFormData] = useState({
    batchNumber: "",
    templateId: "",
    quantity: "",
    productionDate: "",
    expiryDate: "",
    carbonFootprint: "",
    plantId: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await mintBatch({
        batchNumber: parseInt(formData.batchNumber),
        templateId: formData.templateId,
        quantity: parseInt(formData.quantity),
        productionDate: new Date(formData.productionDate).getTime() / 1000,
        expiryDate: new Date(formData.expiryDate).getTime() / 1000,
        carbonFootprint: parseInt(formData.carbonFootprint),
        plantId: formData.plantId,
        metadataURI: "", // Will be set in the hook
      });

      toast.success("Batch minted successfully!");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast.error(errorMessage);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mint Batch Tokens</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="batchNumber">Batch Number</Label>
              <Input
                id="batchNumber"
                type="number"
                value={formData.batchNumber}
                onChange={(e) =>
                  setFormData({ ...formData, batchNumber: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="templateId">Template ID</Label>
              <Input
                id="templateId"
                value={formData.templateId}
                onChange={(e) =>
                  setFormData({ ...formData, templateId: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="carbonFootprint">Carbon Footprint (kg CO₂)</Label>
              <Input
                id="carbonFootprint"
                type="number"
                value={formData.carbonFootprint}
                onChange={(e) =>
                  setFormData({ ...formData, carbonFootprint: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="plantId">Plant ID</Label>
              <Input
                id="plantId"
                value={formData.plantId}
                onChange={(e) =>
                  setFormData({ ...formData, plantId: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="productionDate">Production Date</Label>
              <Input
                id="productionDate"
                type="date"
                value={formData.productionDate}
                onChange={(e) =>
                  setFormData({ ...formData, productionDate: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) =>
                  setFormData({ ...formData, expiryDate: e.target.value })
                }
                required
              />
            </div>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Minting...
              </>
            ) : (
              "Mint Batch"
            )}
          </Button>

          {isConfirmed && tokenId && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Batch minted successfully! Token ID: {tokenId}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

// Component for transferring tokens
function TransferTokensForm() {
  const { transferTokens, isLoading, isConfirmed, error } = useTransferTokens();
  const [formData, setFormData] = useState({
    to: "",
    tokenId: "",
    quantity: "",
    reason: "Transfer to partner",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await transferTokens(
        formData.to,
        parseInt(formData.tokenId),
        parseInt(formData.quantity),
        formData.reason
      );

      toast.success("Tokens transferred successfully!");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast.error(errorMessage);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transfer Tokens</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="to">Recipient Address</Label>
            <Input
              id="to"
              value={formData.to}
              onChange={(e) => setFormData({ ...formData, to: e.target.value })}
              placeholder="0x..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tokenId">Token ID</Label>
              <Input
                id="tokenId"
                type="number"
                value={formData.tokenId}
                onChange={(e) =>
                  setFormData({ ...formData, tokenId: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="reason">Reason</Label>
            <Input
              id="reason"
              value={formData.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value })
              }
            />
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Transferring...
              </>
            ) : (
              "Transfer Tokens"
            )}
          </Button>

          {isConfirmed && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Tokens transferred successfully!
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

// Component for displaying token balances
function TokenBalancesList() {
  const { address } = useSmartContract();
  const { balances, isLoading } = useAllUserTokenBalances(address || "");

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Token Balances</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-6">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading balances...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Token Balances</CardTitle>
      </CardHeader>
      <CardContent>
        {balances.length === 0 ? (
          <p className="text-muted-foreground">No token balances found.</p>
        ) : (
          <div className="space-y-4">
            {balances.map((balance) => (
              <TokenBalanceItem key={balance.tokenId} balance={balance} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Component for individual token balance item
function TokenBalanceItem({ balance }: { balance: { tokenId: number; balance: number; batchInfo: unknown } }) {
  const { batchInfo, isLoading } = useBatchInfo(balance.tokenId);

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium">Token ID: {balance.tokenId}</h4>
        <Badge variant="outline">Balance: {balance.balance}</Badge>
      </div>
      
      {isLoading ? (
        <div className="flex items-center">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          <span className="text-sm text-muted-foreground">Loading batch info...</span>
        </div>
      ) : batchInfo ? (
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="font-medium">Batch Number:</span> {batchInfo.batchNumber}
          </div>
          <div>
            <span className="font-medium">Template ID:</span> {batchInfo.templateId}
          </div>
          <div>
            <span className="font-medium">Quantity:</span> {batchInfo.quantity}
          </div>
          <div>
            <span className="font-medium">Carbon Footprint:</span> {batchInfo.carbonFootprint} kg CO₂
          </div>
          <div>
            <span className="font-medium">Plant ID:</span> {batchInfo.plantId}
          </div>
          <div>
            <span className="font-medium">Status:</span>{" "}
            <Badge variant={batchInfo.isActive ? "default" : "secondary"}>
              {batchInfo.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No batch info available</p>
      )}
    </div>
  );
}
