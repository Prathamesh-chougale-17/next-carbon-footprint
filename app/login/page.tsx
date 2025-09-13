"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useConnect } from "wagmi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
    Wallet,
    Shield,
    Zap,
    Leaf,
    CheckCircle,
    AlertCircle,
    Loader2,
    ArrowRight
} from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
    const router = useRouter();
    const { address, isConnected, isConnecting } = useAccount();
    const { connect, connectors, isPending } = useConnect();
    const [isCheckingCompany, setIsCheckingCompany] = useState(false);
    const [companyExists, setCompanyExists] = useState<boolean | null>(null);

    // Check if company exists for connected wallet
    const checkCompanyExists = async (walletAddress: string) => {
        setIsCheckingCompany(true);
        try {
            const response = await fetch(`/api/companies/${walletAddress}`);
            if (response.ok) {
                setCompanyExists(true);
                // Company exists, redirect to dashboard
                router.push('/dashboard');
            } else if (response.status === 404) {
                setCompanyExists(false);
                // Company doesn't exist, redirect to onboarding
                router.push('/onboarding');
            } else {
                throw new Error('Failed to check company status');
            }
        } catch (error) {
            console.error('Error checking company:', error);
            toast.error("Failed to verify company registration");
            setCompanyExists(null);
        } finally {
            setIsCheckingCompany(false);
        }
    };

    // Handle wallet connection
    const handleConnectWallet = async () => {
        try {
            const connector = connectors[0];
            if (connector) {
                await connect({ connector });
            }
        } catch (error) {
            console.error('Error connecting wallet:', error);
            toast.error("Failed to connect wallet");
        }
    };

    // Check company when wallet connects
    useEffect(() => {
        if (isConnected && address && !isCheckingCompany) {
            checkCompanyExists(address);
        }
    }, [isConnected, address]);

    if (isConnecting || isCheckingCompany) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
                <Card className="w-full max-w-md border-0 bg-white/80 shadow-xl backdrop-blur-sm dark:bg-gray-900/80">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">
                            {isConnecting ? "Connecting Wallet..." : "Verifying Company..."}
                        </h3>
                        <p className="text-muted-foreground text-center">
                            {isConnecting
                                ? "Please confirm the connection in your MetaMask wallet"
                                : "Checking if your company is registered"
                            }
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
            {/* Navigation */}
            <nav className="border-b bg-background/80 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-2">
                            <Leaf className="h-8 w-8 text-green-600 dark:text-green-400" />
                            <span className="text-xl font-bold text-foreground">CarbonTrack</span>
                        </div>
                        <Badge variant="secondary" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                            <Shield className="h-4 w-4 mr-1" />
                            Secure Login
                        </Badge>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
                <Card className="w-full max-w-md border-0 bg-white/80 shadow-xl backdrop-blur-sm dark:bg-gray-900/80">
                    <CardHeader className="space-y-4 text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-indigo-600">
                            <Wallet className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <CardTitle className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text font-bold text-2xl text-transparent">
                                Welcome to CarbonTrack
                            </CardTitle>
                            <CardDescription className="mt-2 text-gray-600 dark:text-gray-400">
                                Connect your MetaMask wallet to access your carbon tracking dashboard
                            </CardDescription>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {/* Features */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
                                <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
                                <div className="text-sm">
                                    <div className="font-medium text-green-800 dark:text-green-200">
                                        Secure & Private
                                    </div>
                                    <div className="text-green-600 dark:text-green-400">
                                        Your wallet stays in your control
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
                                <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                <div className="text-sm">
                                    <div className="font-medium text-blue-800 dark:text-blue-200">
                                        Fast & Reliable
                                    </div>
                                    <div className="text-blue-600 dark:text-blue-400">
                                        Lightning-fast on Avalanche blockchain
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 rounded-lg border border-purple-200 bg-purple-50 p-3 dark:border-purple-800 dark:bg-purple-900/20">
                                <Leaf className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                <div className="text-sm">
                                    <div className="font-medium text-purple-800 dark:text-purple-200">
                                        Carbon Tracking
                                    </div>
                                    <div className="text-purple-600 dark:text-purple-400">
                                        Track and manage your carbon footprint
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Network Info */}
                        <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                            <AlertDescription className="text-amber-800 dark:text-amber-200">
                                <strong>Supported Networks:</strong>
                                <div className="mt-2 flex gap-2">
                                    <Badge
                                        className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                        variant="secondary"
                                    >
                                        Avalanche Mainnet
                                    </Badge>
                                    <Badge
                                        className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                                        variant="secondary"
                                    >
                                        Fuji Testnet
                                    </Badge>
                                </div>
                            </AlertDescription>
                        </Alert>

                        {/* Connect Button */}
                        <div className="pt-2">
                            <Button
                                className="w-full gap-2 border-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl"
                                disabled={isPending}
                                onClick={handleConnectWallet}
                                size="lg"
                            >
                                <Wallet className="h-5 w-5" />
                                {isPending ? "Connecting..." : "Connect MetaMask Wallet"}
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Status Messages */}
                        {companyExists === false && (
                            <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
                                <CheckCircle className="h-4 w-4 text-blue-600" />
                                <AlertDescription className="text-blue-800 dark:text-blue-200">
                                    <strong>New User Detected!</strong>
                                    <br />
                                    You'll be taken through a quick onboarding process to register your company.
                                </AlertDescription>
                            </Alert>
                        )}

                        {companyExists === true && (
                            <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <AlertDescription className="text-green-800 dark:text-green-200">
                                    <strong>Company Found!</strong>
                                    <br />
                                    Redirecting you to your dashboard...
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Footer */}
            <footer className="bg-muted/50 text-muted-foreground py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                        <Leaf className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <span className="font-semibold text-foreground">CarbonTrack</span>
                    </div>
                    <p className="text-sm">
                        Blockchain-powered carbon footprint tracking for sustainable businesses.
                    </p>
                </div>
            </footer>
        </div>
    );
}
