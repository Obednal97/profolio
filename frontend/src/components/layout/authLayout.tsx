import React from "react";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground px-6 py-12">
      <div className="w-full max-w-md bg-white/5 backdrop-blur rounded-xl shadow-md p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Profolio</h1>
          <p className="text-muted-foreground text-sm">Secure access to your account</p>
        </div>
        {children}
      </div>
    </div>
  );
};
