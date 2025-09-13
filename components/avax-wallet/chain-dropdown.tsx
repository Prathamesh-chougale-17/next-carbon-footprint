"use client";
import { ChevronDown } from "lucide-react";
import { useChainId, useSwitchChain } from "wagmi";
import { avalanche, avalancheFuji } from "wagmi/chains";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const CHAIN_NAMES = {
  [avalanche.id]: "Avalanche",
  [avalancheFuji.id]: "Fuji",
} as const;

export function AvaxChainDropdown() {
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const handleChainSwitch = (newChainId: number) => {
    switchChain({ chainId: newChainId });
  };

  const currentChainName =
    CHAIN_NAMES[chainId as keyof typeof CHAIN_NAMES] || "Unknown";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="gap-2" size="sm" variant="outline">
          {currentChainName}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleChainSwitch(avalanche.id)}>
          Avalanche Mainnet
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleChainSwitch(avalancheFuji.id)}>
          Avalanche Fuji
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
