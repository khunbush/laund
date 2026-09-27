import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Plus_Jakarta_Sans } from "next/font/google";
import { ClientPwaRegister } from "@/components/ClientPwaRegister";
import { WarmupPing } from "@/components/WarmupPing";
import { SplashScreen } from "@/components/SplashScreen";
import { AppleSplashLinks } from "@/components/AppleSplashLinks";
import { BottomTabBar } from "@/components/BottomTabBar";
import { I18nProvider } from "@/components/I18nProvider";
import { getLang } from "@/lib/i18n-server";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

// Ledger theme: money figures render in Instrument Serif (font-serif).
const serif = Instrument_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400"],
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
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#2c2418",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const lang = await getLang();

  return (
    <html
      lang={lang}
      className={`${jakarta.variable} ${serif.variable} h-full antialiased`}
    >
      <head>
        <AppleSplashLinks />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <SplashScreen />
        {children}
        <I18nProvider lang={lang}>
          <BottomTabBar />
        </I18nProvider>
        <ClientPwaRegister />
        <WarmupPing />
      </body>
    </html>
  );
}
