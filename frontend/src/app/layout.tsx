import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { HeaderLayout as Header } from "@/components/layout/headerLayout";
import { FooterLayout as Footer } from "@/components/layout/footerLayout";
import { usePathname } from "next/navigation";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Profolio",
  description: "Your personal finance OS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const hideLayout = ["/login", "/signup", "/signout"].some((path) =>
    pathname.startsWith(path)
  );

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-background text-foreground antialiased min-h-screen flex flex-col`}
      >
        {!hideLayout && <Header />}
        <main className="flex-1">{children}</main>
        {!hideLayout && <Footer />}
      </body>
    </html>
  );
}
