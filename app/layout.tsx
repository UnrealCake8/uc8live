import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "uc8Live — Real people. Right now.", description: "Go live and share the moment." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
