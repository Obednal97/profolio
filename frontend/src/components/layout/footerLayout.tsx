import React from "react";

interface FooterLayoutProps {
  children?: React.ReactNode;
}

export const FooterLayout: React.FC<FooterLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col bg-background text-foreground flex-1">
      <main className="flex-1 px-6 py-8">{children}</main>
      <footer className="w-full border-t border-white/10 px-6 py-6 text-sm text-muted-foreground">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-7xl mx-auto">
          <div className="flex space-x-4">
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:underline">Twitter</a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:underline">GitHub</a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:underline">LinkedIn</a>
          </div>
          <div className="flex space-x-4">
            <a href="/privacy-policy" className="hover:underline">Privacy Policy</a>
            <a href="/contact" className="hover:underline">Contact</a>
            <a href="/support" className="hover:underline">Support</a>
          </div>
          <div className="text-center md:text-right w-full md:w-auto">
            &copy; {new Date().getFullYear()} Profolio. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
