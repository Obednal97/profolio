"use client";

import { usePathname } from "next/navigation";
import { HeaderLayout as Header } from "@/components/layout/headerLayout";
import { FooterLayout as Footer } from "@/components/layout/footerLayout";
import { useUser } from "@/lib/user";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { data: user } = useUser();
    
    const hideLayout = ["/login", "/signup", "/signout"].some((path) =>
      pathname.startsWith(path)
    );
    
    // Check if we're in the app section
    const isAppSection = pathname.startsWith("/app");
    
    // For app section, always show app navigation (with mock user if needed)
    // For public pages, show public navigation
    const headerUser = isAppSection ? (user || { name: "Demo User", email: "demo@example.com" }) : undefined;
  
    return (
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        {!hideLayout && <Header user={headerUser} currentPath={pathname} />}
        <main className="flex-1">{children}</main>
        {!hideLayout && <Footer />}
      </div>
    );
  }