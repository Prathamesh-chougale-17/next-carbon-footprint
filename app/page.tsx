import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Leaf, 
  Shield, 
  TrendingUp, 
  Users, 
  Truck, 
  Factory, 
  Store, 
  BarChart3,
  ArrowRight,
  CheckCircle,
  Globe,
  Zap
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Leaf className="h-8 w-8 text-green-600" />
              <span className="text-xl font-bold text-gray-900">CarbonTrack</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  Dashboard
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <Badge variant="secondary" className="mb-4 bg-green-100 text-green-800">
            <Globe className="h-4 w-4 mr-1" />
            Blockchain-Powered Carbon Tracking
          </Badge>
          <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
            Track Your Carbon
            <span className="text-green-600"> Footprint</span>
            <br />
            with Transparency
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            A comprehensive platform for companies to register, track, and manage their carbon emissions 
            using blockchain technology. Ensure transparency and accountability in your sustainability journey.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 py-3">
                Start Tracking
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="px-8 py-3">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for Carbon Management
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From company registration to token minting, we provide all the tools 
              you need to manage your carbon footprint effectively.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Factory className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Company Registration</CardTitle>
                <CardDescription>
                  Register your company as a Manufacturer, Retailer, or Logistics provider with complete profile management.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Product Tracking</CardTitle>
                <CardDescription>
                  Register products with detailed carbon footprint data and track their lifecycle emissions.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Token Minting</CardTitle>
                <CardDescription>
                  Mint blockchain tokens representing carbon credits and offsets with full transparency.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <Truck className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle>Transportation Tracking</CardTitle>
                <CardDescription>
                  Monitor transportation activities and calculate their carbon impact across your supply chain.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle>Asset Transfer</CardTitle>
                <CardDescription>
                  Securely transfer assets with immutable carbon emission records on the blockchain.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-indigo-600" />
                </div>
                <CardTitle>Client Management</CardTitle>
                <CardDescription>
                  Manage B2B relationships and track carbon data across your business network.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-green-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Start Your Carbon Journey?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Join thousands of companies already tracking their carbon footprint with transparency and accountability.
          </p>
          <Link href="/dashboard">
            <Button size="lg" variant="secondary" className="px-8 py-3">
              Get Started Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Leaf className="h-6 w-6 text-green-400" />
              <span className="text-lg font-bold">CarbonTrack</span>
            </div>
            <p className="text-gray-400 mb-4">
              Blockchain-powered carbon footprint tracking for sustainable businesses.
            </p>
            <p className="text-gray-500">&copy; 2024 CarbonTrack. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}