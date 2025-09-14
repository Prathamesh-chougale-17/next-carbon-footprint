import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AvaxWalletProvider from "@/components/avax-wallet/provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CarbonTrack - Blockchain Carbon Footprint Tracking",
  description: "Track and manage your carbon footprint with blockchain transparency",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AvaxWalletProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="h-screen w-full bg-white relative">
              {/* Emerald Glow Background */}
              <div
                className="fixed inset-0 z-0"
                style={{
                  backgroundImage: `
                    radial-gradient(125% 125% at 50% 10%, #ffffff 40%, #10b981 100%)
                  `,
                  backgroundSize: "100% 100%",
                }}
              />
              {/* Content */}
              <div className="relative z-10">
                {children}
              </div>
            </div>
            <Toaster />
          </ThemeProvider>
        </AvaxWalletProvider>
      </body>
    </html>
  );
}
