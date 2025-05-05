"use client";
import React, { useState } from "react";
import { useAuth, useUser } from "@/hooks/useAuth";
import { AuthLayout } from "@/components/layout/authLayout";

function SignUpPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signUpWithCredentials } = useAuth();
  const { data: user } = useUser();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const validatePassword = (password: string) => {
    const requirements = [
      { test: /.{8,}/, text: "At least 8 characters" },
      { test: /[A-Z]/, text: "One uppercase letter" },
      { test: /[a-z]/, text: "One lowercase letter" },
      { test: /[0-9]/, text: "One number" },
      { test: /[^A-Za-z0-9]/, text: "One special character" },
    ];
    return requirements.map((req) => ({
      ...req,
      met: req.test.test(password),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const passwordReqs = validatePassword(formData.password);
    if (!passwordReqs.every((req) => req.met)) {
      setError("Please meet all password requirements");
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      await signUpWithCredentials({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        callbackUrl: "/app/dashboard",
        redirect: true,
      });
    } catch (err) {
      console.error("Sign up error:", err);
      setError("Failed to create account. Please try again.");
      setLoading(false);
    }
  };

  if (user) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-green-400 to-green-500 bg-clip-text text-transparent">
              Already Signed In
            </h2>
            <p className="text-white/60 max-w-md mx-auto">
              You are already signed in to your account.
            </p>
            <a
              href="/app/dashboard"
              className="inline-block px-6 py-3 bg-green-500 text-black rounded-xl font-medium hover:bg-green-400 shadow-[0_0_8px_#00ff88] hover:shadow-[0_0_12px_#00ff88] transition-all duration-200"
            >
              <i className="fas fa-chart-line mr-2"></i>
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-md p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold bg-gradient-to-r from-green-400 to-green-500 bg-clip-text text-transparent">
            Create Account
          </h1>
          <p className="text-white/60 mt-2">
            Start managing your portfolio today
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
            <p className="text-red-400 flex items-center">
              <i className="fas fa-exclamation-circle mr-2"></i>
              {error}
            </p>
          </div>
        )}

        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-green-500/50"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-green-500/50"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-1">
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-green-500/50"
                required
              />
              <div className="mt-2 space-y-1">
                {validatePassword(formData.password).map((req, index) => (
                  <div
                    key={index}
                    className={`text-sm flex items-center ${
                      req.met ? "text-green-400" : "text-white/40"
                    }`}
                  >
                    <i
                      className={`fas fa-${req.met ? "check" : "circle"} w-4`}
                    ></i>
                    {req.text}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    confirmPassword: e.target.value,
                  })
                }
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-green-500/50"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-green-500 text-black rounded-xl font-medium hover:bg-green-400 shadow-[0_0_8px_#00ff88] hover:shadow-[0_0_12px_#00ff88] transition-all duration-200 disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin h-5 w-5 border-2 border-black border-t-transparent rounded-full mr-2"></div>
                  Creating Account...
                </div>
              ) : (
                <>
                  <i className="fas fa-user-plus mr-2"></i>
                  Create Account
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-white/60">
              Already have an account?{" "}
              <a
                href="/auth/signin"
                className="text-green-400 hover:text-green-300 transition-colors"
              >
                Sign In
              </a>
            </p>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}

export default SignUpPage;