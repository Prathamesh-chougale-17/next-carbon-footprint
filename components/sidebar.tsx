"use client";

import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Package,
  Factory,
  LogOut,
  Leaf,
  Building2,
  Users,
  Wallet
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    access: ["Manufacturer", "Retailer", "Logistics"]
  },
  {
    title: "Plant Registration",
    url: "/dashboard/plants",
    icon: Building2,
    access: ["Manufacturer"]
  },
  {
    title: "Product Templates",
    url: "/dashboard/products",
    icon: Package,
    access: ["Manufacturer"]
  },
  {
    title: "Batches",
    url: "/dashboard/batches",
    icon: Factory,
    access: ["Manufacturer"]
  },
  {
    title: "Token Inventory",
    url: "/dashboard/inventory",
    icon: Wallet,
    access: ["Manufacturer", "Retailer", "Logistics"]
  },
  {
    title: "Partners",
    url: "/dashboard/partners",
    icon: Users,
    access: ["Manufacturer", "Retailer", "Logistics"]
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 px-4 py-2">
          <Leaf className="h-6 w-6 text-green-600" />
          <span className="font-semibold">CarbonTrack</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/">
                <LogOut className="h-4 w-4" />
                <span>Log out</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
