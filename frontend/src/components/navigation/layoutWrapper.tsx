"use client";

import { usePathname } from "next/navigation";
import { HeaderLayout as Header } from "@/components/layout/headerLayout";
import { FooterLayout as Footer } from "@/components/layout/footerLayout";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideLayout = ["/login", "/signup", "/signout"].some((path) =>
    pathname.startsWith(path)
  );

  return (
    <>
      {!hideLayout && <Header />}
      <main className="flex-1">{children}</main>
      {!hideLayout && <Footer />}
    </>
  );
}