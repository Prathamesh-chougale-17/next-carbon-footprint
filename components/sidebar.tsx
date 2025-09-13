"use client";

import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Package,
  Users,
  Truck,
  Coins,
  ArrowRightLeft,
  Factory,
  QrCode,
  LogOut,
  Leaf,
  Building2
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    access: ["Manufacturer", "OEM", "Logistics"]
  },
  {
    title: "Products Registration",
    url: "/dashboard/products",
    icon: Package,
    access: ["Manufacturer"]
  },
  {
    title: "Clients",
    url: "/dashboard/clients",
    icon: Users,
    access: ["Manufacturer", "OEM", "Logistics"]
  },
  {
    title: "Transportation",
    url: "/dashboard/transportation",
    icon: Truck,
    access: ["Logistics"]
  },
  {
    title: "Issue Token",
    url: "/dashboard/issue-token",
    icon: Coins,
    access: ["Manufacturer"]
  },
  {
    title: "Asset Transfer",
    url: "/dashboard/asset-transfer",
    icon: ArrowRightLeft,
    access: ["Manufacturer", "OEM", "Logistics"]
  },
  {
    title: "Manufacture",
    url: "/dashboard/manufacture",
    icon: Factory,
    access: ["Manufacturer"]
  },
  {
    title: "QR Code",
    url: "/dashboard/qr-code",
    icon: QrCode,
    access: ["Manufacturer", "OEM", "Logistics"]
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
