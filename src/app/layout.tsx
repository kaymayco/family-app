import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

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
    <html lang="en" className={`h-full ${spaceGrotesk.variable}`}>
      <body className="flex h-full overflow-hidden bg-white" style={{ fontFamily: "var(--font-space), sans-serif" }}>
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-8 md:p-12">
          {children}
        </main>
      </body>
    </html>
  );
}
