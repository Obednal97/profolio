import type { Metadata } from "next";
import ClientLayout from './client-layout';

export const metadata: Metadata = {
  title: "Profolio - Dashboard",
  description: "Your personal finance dashboard",
};

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ClientLayout>{children}</ClientLayout>;
}