import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Leaf,
  Users,
  Factory,
  ArrowRight,
  MapPin,
  TreePine,
  FileText,
  Coins,
  Eye,
  Lock,
  Network,
  Building2,
  Package
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LandingPage() {
  return (
    <div className="min-h-screen w-full bg-background relative">
              {/* Emerald Glow Background */}
              {/* Light mode gradient */}
              <div
                className="fixed inset-0 z-0 dark:hidden"
                style={{
                  backgroundImage: `
                    radial-gradient(125% 125% at 50% 10%, #ffffff 40%, #10b981 100%)
                  `,
                  backgroundSize: "100% 100%",
                }}
              />
              {/* Dark mode gradient */}
              <div
                className="fixed inset-0 z-0 hidden dark:block"
                style={{
                  backgroundImage: `
                    radial-gradient(125% 125% at 50% 10%, #0b0f12 40%, #064e3b 100%)
                  `,
                  backgroundSize: "100% 100%",
                }}
              />
                {/* Content */}
              <div className="relative z-10">
    
      {/* Navigation */}
      <nav className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Leaf className="h-8 w-8 text-green-600 dark:text-green-400" />
              <span className="text-xl font-bold text-foreground">CarbonTrack</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="outline" size="sm">
                  Login
                </Button>
              </Link>
              <Link href="/login">
                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                  Get Started
                </Button>
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <Badge variant="secondary" className="mb-4 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
            <Coins className="h-4 w-4 mr-1" />
            ERC-1155 Blockchain Supply Chain
          </Badge>
          <h1 className="text-4xl sm:text-6xl font-bold text-foreground mb-6">
            Complete Supply Chain
            <span className="text-green-600 dark:text-green-400"> Transparency</span>
            <br />
            with Digital Product Passports
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Track every product from raw materials to final delivery using ERC-1155 tokens on Avalanche blockchain. 
            Generate immutable Digital Product Passports with complete carbon footprint data and supply chain verification.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 py-3">
                Create Digital Passport
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="px-8 py-3">
              View Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Complete Blockchain Supply Chain Solution
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From ERC-1155 token minting to Digital Product Passports, we provide end-to-end 
              supply chain transparency with immutable blockchain verification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border border-border/50 bg-card/60 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                  <Coins className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle>ERC-1155 Token Minting</CardTitle>
                <CardDescription>
                  Mint blockchain tokens on Avalanche Fuji Testnet representing product batches with immutable metadata and carbon footprint data.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border border-border/50 bg-card/60 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle>Digital Product Passports</CardTitle>
                <CardDescription>
                  Generate public-facing DPPs with complete supply chain traceability, carbon emissions, and blockchain verification links.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border border-border/50 bg-card/60 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                  <MapPin className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle>Interactive Supply Chain Map</CardTitle>
                <CardDescription>
                  Visualize your complete supply chain with OpenLayers maps showing plant locations, transport routes, and carbon impact.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border border-border/50 bg-card/60 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mb-4">
                  <TreePine className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <CardTitle>Hierarchical Tree Visualization</CardTitle>
                <CardDescription>
                  D3.js-powered tree view showing complete product breakdown from raw materials to final products with component tracking.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border border-border/50 bg-card/60 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center mb-4">
                  <Lock className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <CardTitle>Immutable Blockchain Records</CardTitle>
                <CardDescription>
                  All carbon footprint data and supply chain information is permanently recorded on Avalanche blockchain for complete transparency.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border border-border/50 bg-card/60 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center mb-4">
                  <Network className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <CardTitle>Multi-Tier Supply Chain</CardTitle>
                <CardDescription>
                  Track complex supply chains with recursive component consumption, partner management, and B2B token transfers.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From company registration to public Digital Product Passports - 
              complete supply chain transparency in 4 simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">1. Register Company</h3>
              <p className="text-muted-foreground text-sm">
                Register your company and manufacturing plants with GPS coordinates and detailed location data.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">2. Create Products</h3>
              <p className="text-muted-foreground text-sm">
                Define product templates with specifications, carbon footprint data, and component relationships.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Coins className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">3. Mint Tokens</h3>
              <p className="text-muted-foreground text-sm">
                Create product batches and mint ERC-1155 tokens on Avalanche blockchain with immutable metadata.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">4. Public DPP</h3>
              <p className="text-muted-foreground text-sm">
                Generate public Digital Product Passports with complete supply chain transparency and verification.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Perfect For Every Industry
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From manufacturing to logistics, our platform serves diverse industries 
              with complete supply chain transparency needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border border-border/50 bg-card/60 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                  <Factory className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle>Manufacturing Companies</CardTitle>
                <CardDescription>
                  Track complete product lifecycle from raw materials to finished goods. 
                  Verify supplier sustainability claims and generate transparent product passports.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border border-border/50 bg-card/60 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle>Consumers & Regulators</CardTitle>
                <CardDescription>
                  Verify product sustainability claims with blockchain-verified data. 
                  Access complete supply chain transparency and environmental impact metrics.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border border-border/50 bg-card/60 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                  <Network className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle>Supply Chain Partners</CardTitle>
                <CardDescription>
                  Share verified sustainability data across your business network. 
                  Transfer ownership of product tokens and collaborate on environmental goals.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Trusted by Industry Leaders
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our platform delivers measurable results for supply chain transparency and sustainability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">100%</div>
              <div className="text-lg font-semibold mb-1">Blockchain Verified</div>
              <div className="text-muted-foreground text-sm">All data immutably recorded on Avalanche</div>
            </div>

            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">ERC-1155</div>
              <div className="text-lg font-semibold mb-1">Token Standard</div>
              <div className="text-muted-foreground text-sm">Industry-standard for digital assets</div>
            </div>

            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">∞</div>
              <div className="text-lg font-semibold mb-1">Supply Chain Depth</div>
              <div className="text-muted-foreground text-sm">Track from raw materials to final delivery</div>
            </div>

            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600 dark:text-orange-400 mb-2">24/7</div>
              <div className="text-lg font-semibold mb-1">Public Access</div>
              <div className="text-muted-foreground text-sm">Digital Product Passports always available</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-green-400 dark:bg-green-800">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Supply Chain?
          </h2>
          <p className="text-xl text-green-100 dark:text-green-200 mb-8">
            Join the blockchain revolution in supply chain transparency. Create immutable Digital Product Passports 
            and build trust with complete carbon footprint verification.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg" variant="secondary" className="px-8 py-3">
                Start Creating DPPs
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted text-muted-foreground py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Leaf className="h-6 w-6 text-green-600 dark:text-green-400" />
                <span className="text-lg font-bold text-foreground">CarbonTrack</span>
              </div>
              <p className="text-muted-foreground text-sm">
                Complete supply chain transparency with blockchain-verified Digital Product Passports.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-4">Platform</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/login" className="text-muted-foreground hover:text-foreground">Dashboard</Link></li>
                <li><Link href="/dashboard/tree-demo" className="text-muted-foreground hover:text-foreground">Demo</Link></li>
                <li><span className="text-muted-foreground">API Documentation</span></li>
                <li><span className="text-muted-foreground">Smart Contracts</span></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-4">Features</h3>
              <ul className="space-y-2 text-sm">
                <li><span className="text-muted-foreground">ERC-1155 Tokens</span></li>
                <li><span className="text-muted-foreground">Digital Product Passports</span></li>
                <li><span className="text-muted-foreground">Supply Chain Maps</span></li>
                <li><span className="text-muted-foreground">Carbon Tracking</span></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-4">Technology</h3>
              <ul className="space-y-2 text-sm">
                <li><span className="text-muted-foreground">Avalanche Blockchain</span></li>
                <li><span className="text-muted-foreground">Next.js 15</span></li>
                <li><span className="text-muted-foreground">MongoDB</span></li>
                <li><span className="text-muted-foreground">OpenLayers</span></li>
              </ul>
            </div>
          </div>

          <div className="border-t pt-8 text-center">
            <p className="text-muted-foreground/70 text-sm">
              &copy; 2024 CarbonTrack. All rights reserved. Built on Avalanche Fuji Testnet.
            </p>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
