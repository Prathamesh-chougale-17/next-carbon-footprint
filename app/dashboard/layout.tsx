"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import AuthLayout from "@/components/avax-wallet/auth-layout";
import { DashboardHeader } from "@/components/dashboard-header";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { address, isConnected } = useWallet();
  const [isCheckingCompany, setIsCheckingCompany] = useState(true);
  const [companyExists, setCompanyExists] = useState<boolean | null>(null);

  // Check if company exists for connected wallet
  useEffect(() => {
    const checkCompany = async () => {
      if (!isConnected || !address) {
        router.push('/login');
        return;
      }

      try {
        const response = await fetch(`/api/companies/${address}`);
        if (response.ok) {
          setCompanyExists(true);
        } else if (response.status === 404) {
          setCompanyExists(false);
          router.push('/onboarding');
        } else {
          throw new Error('Failed to check company status');
        }
      } catch (error) {
        console.error('Error checking company:', error);
        setCompanyExists(false);
      } finally {
        setIsCheckingCompany(false);
      }
    };

    checkCompany();
  }, [address, isConnected, router]);

  if (isCheckingCompany) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Verifying Company</h3>
            <p className="text-muted-foreground text-center">
              Checking if your company is registered...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (companyExists === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Company Not Found</h3>
            <p className="text-muted-foreground text-center mb-4">
              Your company is not registered. Redirecting to onboarding...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
