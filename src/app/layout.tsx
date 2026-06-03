import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import PWARegistration from "@/components/PWARegistration";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ultimate Chess Platform",
  description: "Next-generation chess ecosystem with AI coaching and a personalized journey.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Ultimate Chess",
    statusBarStyle: "default",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(geistSans.variable, geistMono.variable, "dark h-full")}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased selection:bg-primary-500/30">
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 flex flex-col h-full overflow-hidden bg-background">
            <Header />
            <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
              {children}
            </div>
          </main>
        </div>
        <PWARegistration />
      </body>
    </html>
  );
}
