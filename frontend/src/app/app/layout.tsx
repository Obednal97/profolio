'use client';

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import LayoutWrapper from "@/components/layout/layoutWrapper";
import { useUser } from "@/lib/user";
import type { User } from '@/types/global';
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Profolio",
  description: "Your personal finance OS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const { data: user, loading } = useUser() as { data: User | null; loading: boolean };
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user?.token) {
      router.push("/auth/signIn");
    }
  }, [user, loading, router]);

  if (loading || !user?.token) return null;

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-background text-foreground antialiased min-h-screen flex flex-col`}
      >
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}