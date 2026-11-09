import { Suspense } from "react";
import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import { FlashToast } from "@/components/flash-toast";
import { Toaster } from "@/components/toaster";
import { ImageFallback } from "@/components/image-fallback";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Brew Haven — Order Ahead Coffee",
    template: "%s · Brew Haven",
  },
  description:
    "Order coffee and desserts online from Brew Haven and collect them at the café.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${fraunces.variable} h-full`}
    >
      <body className="flex min-h-full flex-col bg-cream text-espresso">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[60] focus:rounded-full focus:bg-espresso focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-cream"
        >
          Skip to content
        </a>
        {children}
        <Suspense fallback={null}>
          <FlashToast />
        </Suspense>
        <Toaster />
        <ImageFallback />
      </body>
    </html>
  );
}
