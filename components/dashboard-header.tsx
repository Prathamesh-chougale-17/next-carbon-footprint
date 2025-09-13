"use client";

import { AvaxConnectButton } from "@/components/avax-wallet/connect-button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import BalanceBadge from "./avax-wallet/balance";
import { AvaxChainDropdown } from "./avax-wallet/chain-dropdown";
import { ThemeToggle } from "./theme-toggle";

export function DashboardHeader() {

  return (
    <div className="flex items-center justify-between space-y-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-3">
      <div className="flex items-center space-x-2">
        <SidebarTrigger />
      </div>
      <div className="flex items-center space-x-2">
        <AvaxChainDropdown />
        <BalanceBadge />
        <AvaxConnectButton />
        <ThemeToggle />
      </div>
    </div>
  );
}
