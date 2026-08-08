import React from "react";

interface FooterLayoutProps {
  children?: React.ReactNode;
  user?: {
    name?: string;
    email?: string;
  };
}

export const FooterLayout: React.FC<FooterLayoutProps> = () => {
  return (
    <div className="flex flex-col bg-background text-foreground flex-1">
      <footer className="w-full border-t border-white/10 px-6 py-6 text-sm text-muted-foreground">
        <div className="flex flex-col md:grid md:grid-cols-3 items-center gap-4 max-w-7xl mx-auto">
          <div className="flex justify-start">
            <a href="https://github.com/Obednal97/profolio" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">GitHub</a>
          </div>
          <div className="flex justify-center space-x-4">
            <a href="/policy-hub" className="text-muted-foreground hover:text-foreground transition-colors">Policy Hub</a>
            <a href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact</a>
          </div>
          <div className="text-center md:text-right">
            &copy; {new Date().getFullYear()} Profolio. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
