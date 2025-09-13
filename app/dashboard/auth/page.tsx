import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaf, Shield, Globe } from "lucide-react";
import {AvaxConnectButton} from "@/components/avax-wallet/connect-button"

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Leaf className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">CarbonTrack</h1>
          <p className="text-gray-600 mt-2">
            Connect your wallet to access the carbon tracking platform
          </p>
        </div>

        <AvaxConnectButton />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4" />
              Security Features
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Globe className="h-3 w-3" />
              <span>Blockchain-powered transparency</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-3 w-3" />
              <span>Secure wallet integration</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Leaf className="h-3 w-3" />
              <span>Immutable carbon records</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
