"use client";
import React, { useEffect, useState } from "react";
import { useAuth, useUser } from "@/hooks/useAuth";
import { AuthLayout } from "@/components/layout/authLayout";

function SignOut() {
  const { signOut } = useAuth();
  const { data: user } = useUser();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleLogout = async () => {
      try {
        await signOut({
          callbackUrl: "/",
          redirect: true,
        });
      } catch (err) {
        console.error("Logout error:", err);
        setError("Failed to sign out. Please try again.");
      }
    };

    if (user) {
      handleLogout();
    }
  }, [user, signOut]);

  return (
    <AuthLayout>
      <div className="min-h-screen bg-[#1a1a1a] text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-6">
          {error ? (
            <>
              <h2 className="text-2xl font-semibold bg-gradient-to-r from-red-400 to-red-500 bg-clip-text text-transparent">
                Error Signing Out
              </h2>
              <p className="text-white/60">{error}</p>
              <a
                href="/dashboard"
                className="inline-block px-6 py-3 bg-green-500 text-black rounded-xl font-medium hover:bg-green-400 shadow-[0_0_8px_#00ff88] hover:shadow-[0_0_12px_#00ff88] transition-all duration-200"
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Return to Dashboard
              </a>
            </>
          ) : (
            <>
              <div className="animate-spin h-8 w-8 border-2 border-green-500 border-t-transparent rounded-full shadow-[0_0_8px_#00ff88] mx-auto" />
              <h2 className="text-2xl font-semibold bg-gradient-to-r from-green-400 to-green-500 bg-clip-text text-transparent">
                Signing Out
              </h2>
              <p className="text-white/60">Please wait while we sign you out...</p>
            </>
          )}
        </div>
      </div>
    </AuthLayout>
  );
}

export default SignOut;