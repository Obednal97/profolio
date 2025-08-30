"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface PoliciesLayoutProps {
  children: React.ReactNode;
}

interface Heading {
  id: string;
  text: string;
  level: number;
}

const tabs = [
  { href: "/policy-hub/terms", label: "Terms of Service" },
  { href: "/policy-hub/privacy", label: "Privacy Policy" },
  { href: "/policy-hub/community", label: "Community Guidelines" },
  { href: "/policy-hub/cookies", label: "Cookie Policy" },
  { href: "/policy-hub/aup", label: "Acceptable Use Policy" },
];

export const PoliciesLayout: React.FC<PoliciesLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const contentRef = useRef<HTMLDivElement>(null);
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (!contentRef.current) return;

    const elements = Array.from(
      contentRef.current.querySelectorAll("h2, h3")
    ) as HTMLHeadingElement[];

    const mapped = elements.map((el) => ({
      id: el.id,
      text: el.textContent || "",
      level: el.tagName === "H2" ? 2 : 3,
    }));

    setHeadings(mapped);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find(entry => entry.isIntersecting);
        if (visible?.target?.id) {
          setActiveId(visible.target.id);
        }
      },
      { rootMargin: "0px 0px -60% 0px", threshold: 0.1 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pathname]);

  const handleScrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen">
      <div className="px-6 py-8 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8">
        <aside className="space-y-6 sticky top-24 self-start max-h-[calc(100vh-8rem)] overflow-y-auto">
          <nav className="border-b border-white/10 pb-4">
            <div className="flex flex-col gap-2">
              {tabs.map((tab) => (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    "text-sm font-medium transition-colors duration-200",
                    pathname === tab.href
                      ? "text-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab.label}
                </Link>
              ))}
            </div>
          </nav>
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground uppercase tracking-wide text-xs">Contents</p>
            {headings.map((heading, index) => (
              <button
                key={heading.id || `heading-${index}`}
                onClick={() => handleScrollTo(heading.id)}
                className={cn(
                  "block text-left hover:text-foreground transition-colors",
                  heading.level === 3 ? "ml-4 text-sm" : "text-base",
                  activeId === heading.id
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground"
                )}
              >
                {heading.text}
              </button>
            ))}
          </div>
        </aside>
        <div ref={contentRef} className="prose dark:prose-invert max-w-none !bg-transparent">
          {children}
        </div>
      </div>
    </div>
  );
};