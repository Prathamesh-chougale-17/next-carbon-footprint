"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { 
  StatsCardsSkeleton, 
  QuickActionsSkeleton, 
  RecentActivitySkeleton, 
  ChartSkeleton,
  ProductCardsSkeleton,
  ClientCardsSkeleton,
  TransportationCardsSkeleton,
  FormSkeleton,
  SearchBarSkeleton,
  PageHeaderSkeleton,
  StatsSummarySkeleton,
  EmptyStateSkeleton
} from "@/components/ui/loading-skeletons";

export default function LoadingDemoPage() {
  const [activeDemo, setActiveDemo] = useState<string | null>(null);

  const demos = [
    { id: "stats", name: "Stats Cards", component: <StatsCardsSkeleton /> },
    { id: "quick-actions", name: "Quick Actions", component: <QuickActionsSkeleton /> },
    { id: "recent-activity", name: "Recent Activity", component: <RecentActivitySkeleton /> },
    { id: "chart", name: "Chart", component: <ChartSkeleton /> },
    { id: "products", name: "Product Cards", component: <ProductCardsSkeleton /> },
    { id: "clients", name: "Client Cards", component: <ClientCardsSkeleton /> },
    { id: "transportation", name: "Transportation Cards", component: <TransportationCardsSkeleton /> },
    { id: "form", name: "Form", component: <FormSkeleton /> },
    { id: "search", name: "Search Bar", component: <SearchBarSkeleton /> },
    { id: "page-header", name: "Page Header", component: <PageHeaderSkeleton /> },
    { id: "stats-summary", name: "Stats Summary", component: <StatsSummarySkeleton /> },
    { id: "empty-state", name: "Empty State", component: <EmptyStateSkeleton /> },
  ];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Loading States Demo</h2>
          <p className="text-muted-foreground">
            Explore all the beautiful loading skeleton components used throughout the dashboard.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <SidebarTrigger />
        </div>
      </div>

      {/* Demo Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Select a Loading Component to Preview</CardTitle>
          <CardDescription>
            Click on any component below to see its loading skeleton in action.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {demos.map((demo) => (
              <Button
                key={demo.id}
                variant={activeDemo === demo.id ? "default" : "outline"}
                onClick={() => setActiveDemo(activeDemo === demo.id ? null : demo.id)}
                className="justify-start"
              >
                {demo.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Demo Preview */}
      {activeDemo && (
        <Card>
          <CardHeader>
            <CardTitle>
              {demos.find(d => d.id === activeDemo)?.name} Loading State
            </CardTitle>
            <CardDescription>
              This is how the {demos.find(d => d.id === activeDemo)?.name.toLowerCase()} component appears while loading.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {demos.find(d => d.id === activeDemo)?.component}
          </CardContent>
        </Card>
      )}

      {/* All Components Preview */}
      <Card>
        <CardHeader>
          <CardTitle>All Loading Components</CardTitle>
          <CardDescription>
            Here's a preview of all loading skeleton components at once.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Dashboard Components</h3>
            <div className="space-y-4">
              <StatsCardsSkeleton />
              <QuickActionsSkeleton />
              <div className="grid gap-4 md:grid-cols-2">
                <RecentActivitySkeleton />
                <ChartSkeleton />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Page Components</h3>
            <div className="space-y-4">
              <PageHeaderSkeleton />
              <SearchBarSkeleton />
              <FormSkeleton />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Data Display Components</h3>
            <div className="space-y-4">
              <ProductCardsSkeleton />
              <ClientCardsSkeleton />
              <TransportationCardsSkeleton />
              <StatsSummarySkeleton />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Empty States</h3>
            <EmptyStateSkeleton />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
