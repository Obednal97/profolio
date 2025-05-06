// /app/app/client-layout.tsx (CLIENT component)
'use client';

import LayoutWrapper from "@/components/layout/layoutWrapper";
import { useUser } from "@/lib/user";
import type { User } from '@/types/global';
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { data: user, loading } = useUser() as { data: User | null; loading: boolean };
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user?.token) {
      router.push("/auth/signIn");
    }
  }, [user, loading, router]);

  if (loading || !user?.token) return null;

  return (
    <LayoutWrapper>
      {children}
    </LayoutWrapper>
  );
}