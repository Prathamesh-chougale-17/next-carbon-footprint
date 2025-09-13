import { AppSidebar } from "@/components/sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import AuthLayout from "@/components/avax-wallet/auth-layout";
import { DashboardHeader } from "@/components/dashboard-header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthLayout>
      <SidebarProvider>
        <div className="flex h-screen w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <DashboardHeader />
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </AuthLayout>
  );
}
