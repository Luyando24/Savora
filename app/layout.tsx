import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Savora - Secure Village Banking & Cooperative Management Platform",
  description: "Digitize your savings group, agricultural cooperative, or SACCO in Zambia. Track member registries, contributions, loans, and payouts securely with Airtel & MTN Mobile Money.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans bg-light-ice text-slate-ink" suppressHydrationWarning>{children}</body>
    </html>
  );
}
