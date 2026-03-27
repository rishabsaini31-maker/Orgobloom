import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "react-hot-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
// import "@/lib/sentry"; // TODO: Fix Sentry initialization for Next.js builds

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Orgobloom - Organic Fertilizers",
  description:
    "Premium organic fertilizers for healthy plants and sustainable farming",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <Header />
          <main className="pt-20 min-h-screen bg-gray-50">{children}</main>
          <Footer />
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
