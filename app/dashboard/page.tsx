import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  TrendingDown,
  Package,
  Coins,
  Leaf,
  BarChart3,
  Activity,
  Factory,
  Users,
} from "lucide-react";
import Link from "next/link";
import {
  StatsCardsSkeleton,
  QuickActionsSkeleton,
  RecentActivitySkeleton,
  ChartSkeleton,
} from "@/components/ui/loading-skeletons";

export default function DashboardPage() {
  // Mock loading state - in real app, this would come from API loading state
  const isLoading = false; // Set to false to show actual content

  // Mock data - in real app, this would come from API
  const stats = {
    totalCarbonFootprint: 1250.5,
    carbonReduction: -15.2,
    productTemplates: 8,
    productBatches: 45,
    transportationTrips: 8,
    tokensMinted: 23,
  };

  const recentActivities = [
    {
      id: 1,
      type: "template",
      title: "New product template created",
      description: "Steel Bolt M8 - 0.5kg CO2/unit",
      time: "2 hours ago",
      icon: Package,
    },
    {
      id: 2,
      type: "token",
      title: "Token minted",
      description: "Carbon credit token #1234",
      time: "4 hours ago",
      icon: Coins,
    },
    {
      id: 3,
      type: "transportation",
      title: "Transportation recorded",
      description: "Delivery to Warehouse A - 45kg CO2",
      time: "6 hours ago",
      icon: Package,
    },
  ];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your carbon footprint tracking.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <SidebarTrigger />
        </div>
      </div>

      {/* Stats Cards */}
      {isLoading ? (
        <StatsCardsSkeleton />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Carbon Footprint
              </CardTitle>
              <Leaf className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(stats.totalCarbonFootprint / 1000).toFixed(2)} tons CO₂
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+2.1%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Carbon Reduction
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {Math.abs(stats.carbonReduction)}%
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">-0.3%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Product Templates
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.productTemplates}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+2</span> new this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Product Batches
              </CardTitle>
              <Factory className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.productBatches}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+8</span> new this month
              </p>
            </CardContent>
          </Card>


          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Transportation Trips
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.transportationTrips}
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="text-red-600">+2</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tokens Minted
              </CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.tokensMinted}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+5</span> this month
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      {isLoading ? (
        <QuickActionsSkeleton />
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/dashboard/products">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Create Template
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Define product specifications and carbon footprint data
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/dashboard/batches">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Create Batch
                </CardTitle>
                <Factory className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Start production run and mint ERC-1155 tokens
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/dashboard/partners">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Manage Partners
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Add suppliers and customers to your network
                </p>
              </CardContent>
            </Link>
          </Card>
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        {isLoading ? (
          <RecentActivitySkeleton />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest updates from your carbon tracking activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center space-x-4"
                  >
                    <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                      <activity.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.description}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {activity.time}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <ChartSkeleton />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Carbon Footprint Trend
              </CardTitle>
              <CardDescription>
                Your carbon footprint over the last 6 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Chart will be displayed here</p>
                  <p className="text-xs">
                    Integration with charting library needed
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
