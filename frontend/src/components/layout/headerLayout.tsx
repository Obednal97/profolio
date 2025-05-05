import React from "react";

interface HeaderLayoutProps {
  children?: React.ReactNode;
}

export const HeaderLayout: React.FC<HeaderLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="text-xl font-bold">Profolio</div>
        <div className="flex items-center gap-4">
          {/* Future: theme toggle, notifications, user menu */}
        </div>
      </header>
      <main className="flex-1 px-6 py-8">
        {children}
      </main>
    </div>
  );
};
