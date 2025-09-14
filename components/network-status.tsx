"use client";

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CONTRACT_CONFIG, CONTRACT_HELPERS } from '@/lib/contract';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';

interface NetworkStatusProps {
    onNetworkSwitch?: () => void;
}

export function NetworkStatus({ onNetworkSwitch }: NetworkStatusProps) {
    const [isConnected, setIsConnected] = useState(false);
    const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
    const [networkName, setNetworkName] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkNetworkStatus();
    }, []);

    const checkNetworkStatus = async () => {
        try {
            if (!CONTRACT_HELPERS.isMetaMaskAvailable()) {
                setIsConnected(false);
                setIsCorrectNetwork(false);
                setNetworkName('');
                setIsLoading(false);
                return;
            }

            const provider = (window as any).ethereum;
            const chainId = await provider.request({ method: 'eth_chainId' });
            const networkId = parseInt(chainId, 16);

            setIsConnected(true);
            setIsCorrectNetwork(networkId === CONTRACT_CONFIG.NETWORK.chainId);

            // Get network name
            switch (networkId) {
                case 43113:
                    setNetworkName('Avalanche Fuji');
                    break;
                case 43114:
                    setNetworkName('Avalanche Mainnet');
                    break;
                case 1:
                    setNetworkName('Ethereum Mainnet');
                    break;
                case 11155111:
                    setNetworkName('Ethereum Sepolia');
                    break;
                default:
                    setNetworkName(`Chain ${networkId}`);
            }
        } catch (error) {
            console.error('Error checking network status:', error);
            setIsConnected(false);
            setIsCorrectNetwork(false);
            setNetworkName('');
        } finally {
            setIsLoading(false);
        }
    };

    const switchToFujiNetwork = async () => {
        try {
            setIsLoading(true);
            await CONTRACT_HELPERS.switchToFujiNetwork();
            await checkNetworkStatus();
            onNetworkSwitch?.();
        } catch (error: any) {
            console.error('Failed to switch network:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <Badge variant="secondary" className="flex items-center gap-1">
                <Wifi className="h-3 w-3 animate-pulse" />
                Checking...
            </Badge>
        );
    }

    if (!isConnected) {
        return (
            <Alert className="border-red-200 bg-red-50">
                <WifiOff className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                    MetaMask not detected. Please install MetaMask to create batches.
                </AlertDescription>
            </Alert>
        );
    }

    if (!isCorrectNetwork) {
        return (
            <Alert className="border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                    <div className="flex items-center justify-between">
                        <span>
                            Connected to {networkName}. Switch to Avalanche Fuji to create batches.
                        </span>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={switchToFujiNetwork}
                            disabled={isLoading}
                            className="ml-2"
                        >
                            Switch Network
                        </Button>
                    </div>
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800 hover:bg-green-200">
            <Wifi className="h-3 w-3" />
            Connected to {networkName}
        </Badge>
    );
}
