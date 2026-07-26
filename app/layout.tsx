import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "uc8Live — Real people. Right now.", description: "Go live and share the moment." };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#f4f1e9" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
