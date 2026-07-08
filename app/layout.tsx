import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ClientPwaRegister } from "@/components/ClientPwaRegister";
import { SplashScreen } from "@/components/SplashScreen";
import { AppleSplashLinks } from "@/components/AppleSplashLinks";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Laund",
  description: "Cash collection tracker for the laundromat",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Laund",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#14142b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jakarta.variable} h-full antialiased`}>
      <head>
        <AppleSplashLinks />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <SplashScreen />
        {children}
        <ClientPwaRegister />
      </body>
    </html>
  );
}
