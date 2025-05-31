import type { Metadata, Viewport } from "next";
import { ClientProviders } from "@/providers/client-providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Profolio",
  description: "Your personal finance OS - Track assets, expenses, and properties",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body className="bg-background text-foreground antialiased min-h-screen">
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
