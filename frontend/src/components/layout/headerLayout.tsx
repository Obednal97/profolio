import React from "react";
import Link from 'next/link';
// import Image from 'next/image';
import { Button } from '@/components/ui/button/button';

function HeaderActions() {
  return (
    <div className="flex items-center space-x-4">
      <select
        onChange={(e) =>
          document.documentElement.setAttribute('data-theme', e.target.value)
        }
        className="bg-card text-foreground border border-gray-600 rounded px-2 py-1 text-sm"
        defaultValue="system"
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="system">System</option>
      </select>
      <Button asChild>
        <Link href="/login">Login</Link>
      </Button>
    </div>
  );
}

export const HeaderLayout: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        {/* <Image
          src="/logomark.png"
          alt="Profolio preview"
          width={120}
          height={40}
          className="rounded-xl shadow-xl shadow-neon/30 object-cover"
        /> */}
        <div className="flex flex-col leading-tight">
          <span className="text-xl font-bold text-foreground">Profolio</span>
          <span className="text-sm text-muted-foreground">Your Personal Wealth OS</span>
        </div>
      </div>
      <HeaderActions />
    </header>
  );
};