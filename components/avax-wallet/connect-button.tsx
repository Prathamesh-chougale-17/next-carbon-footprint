"use client";
import { Check, ChevronDown, Copy, LogOut, Wallet } from "lucide-react";
import { useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Address display constants
const ADDRESS_PREFIX_LENGTH = 6;
const ADDRESS_SUFFIX_LENGTH = 4;
const COPY_FEEDBACK_DURATION = 2000;

export function AvaxConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), COPY_FEEDBACK_DURATION);
    }
  };

  if (isConnected && address) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="gap-2 border-green-200 bg-green-50 text-green-800 hover:bg-green-100 dark:border-green-800 dark:bg-green-900/20 dark:text-green-200 dark:hover:bg-green-900/30"
            variant="outline"
          >
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
              <span className="font-mono">
                {`${address.slice(0, ADDRESS_PREFIX_LENGTH)}...${address.slice(-ADDRESS_SUFFIX_LENGTH)}`}
              </span>
            </div>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-2">
            <p className="font-medium text-sm">Connected Wallet</p>
            <div className="mt-1 flex items-center gap-2">
              <Badge
                className="bg-green-100 text-green-800 text-xs dark:bg-green-900/30 dark:text-green-300"
                variant="secondary"
              >
                Connected
              </Badge>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer gap-2"
            onClick={handleCopyAddress}
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied ? "Copied!" : "Copy Address"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer gap-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            onClick={() => disconnect()}
          >
            <LogOut className="h-4 w-4" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button
      className="w-full gap-2 border-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl"
      disabled={isPending}
      onClick={() => {
        const connector = connectors[0]; // Use the first available connector
        if (connector) {
          connect({ connector });
        }
      }}
    >
      <Wallet className="h-5 w-5" />
      {isPending ? "Connecting..." : "Connect Wallet"}
    </Button>
  );
}
