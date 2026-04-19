import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { Providers } from "@/components/Providers";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-space",
});

export const metadata: Metadata = {
  title: "Mayen Family Hub",
  description: "Keep your family organized",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`md:h-full ${spaceGrotesk.variable}`}>
      <body className="min-h-screen md:flex md:h-full md:overflow-hidden bg-white" style={{ fontFamily: "var(--font-space), sans-serif" }}>
        <Providers>
          <Sidebar />
          <main className="md:flex-1 md:overflow-y-auto p-4 md:p-8 lg:p-12 pb-24 md:pb-8 lg:pb-12">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
