"use client";

import { usePathname } from "next/navigation";
import { HeaderLayout as Header } from "@/components/layout/headerLayout";
import { FooterLayout as Footer } from "@/components/layout/footerLayout";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const hideLayout = ["/login", "/signup", "/signout"].some((path) =>
      pathname.startsWith(path)
    );
  
    return (
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        {!hideLayout && <Header />}
        <main className="flex-1 px-6 py-8">{children}</main>
        {!hideLayout && <Footer />}
      </div>
    );
  }