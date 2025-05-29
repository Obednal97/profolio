"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useAuth as useAuthHook } from "@/hooks/useAuth";
import { AuthLayout } from "@/components/layout/authLayout";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

function SignUpPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const { user, loading: authLoading, signUp, signInWithGoogleProvider } = useAuth();
  const { signInWithDemo } = useAuthHook();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Check if user is in demo mode
  const isDemoMode = typeof window !== 'undefined' && localStorage.getItem('demo-mode') === 'true';

  // Redirect if already authenticated (Firebase user or demo mode)
  useEffect(() => {
    if ((user && !authLoading) || isDemoMode) {
      router.push('/app/dashboard');
    }
  }, [user, authLoading, isDemoMode, router]);

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

  const isFormValid = () => {
    const passwordReqs = validatePassword(formData.password);
    const passwordsMatch = formData.password === formData.confirmPassword;
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
    return (
      formData.name.trim() !== "" &&
      isValidEmail &&
      passwordsMatch &&
      passwordReqs.every((req) => req.met)
    );
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

    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
    if (!isValidEmail) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    try {
      await signUp(formData.email.trim(), formData.password, formData.name.trim());
      router.push('/app/dashboard');
    } catch (err: unknown) {
      console.error("Sign up error:", err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create account. Please try again.';
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError(null);
    setLoading(true);

    try {
      await signInWithGoogleProvider();
      router.push('/app/dashboard');
    } catch (err: unknown) {
      console.error('Google sign up error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign up with Google';
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleDemoMode = async () => {
    setError(null);
    setDemoLoading(true);

    try {
      await signInWithDemo({
        callbackUrl: "/app/dashboard",
        redirect: true,
      });
    } catch (err) {
      console.error("Demo mode error:", err);
      setError("Failed to start demo mode. Please try again.");
      setDemoLoading(false);
    }
  };

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      </AuthLayout>
    );
  }

  // Don't render if user is already authenticated or in demo mode
  if (user || isDemoMode) return null;

  return (
    <AuthLayout>
      <div className="w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Create your account
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Start managing your wealth in minutes
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6"
          >
            <p className="text-red-600 dark:text-red-400 flex items-center text-sm">
              <i className="fas fa-exclamation-circle mr-2"></i>
              {error}
            </p>
          </motion.div>
        )}

        {/* Demo Mode Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-6"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Try Profolio Demo
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Explore all features with sample data - no signup required
              </p>
            </div>
            <button
              onClick={handleDemoMode}
              disabled={demoLoading}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
              {demoLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Loading Demo...
                </div>
              ) : (
                <>
                  <i className="fas fa-play mr-2"></i>
                  Try Demo Mode
                </>
              )}
            </button>
          </div>
        </motion.div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="John Doe"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="john@example.com"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                minLength={8}
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="••••••••"
                required
                disabled={loading}
              />
              <div className="mt-3 space-y-2">
                {validatePassword(formData.password).map((req, index) => (
                  <div
                    key={index}
                    className={`text-sm flex items-center gap-2 transition-colors ${
                      req.met ? "text-green-600 dark:text-green-400" : "text-gray-400 dark:text-gray-500"
                    }`}
                  >
                    <i
                      className={`fas fa-${req.met ? "check-circle" : "circle"} text-xs`}
                    ></i>
                    {req.text}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                minLength={8}
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    confirmPassword: e.target.value,
                  })
                }
                className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                  formData.confirmPassword &&
                  formData.password !== formData.confirmPassword
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 dark:border-gray-700 focus:ring-blue-500'
                }`}
                placeholder="••••••••"
                required
                disabled={loading}
              />
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  Passwords do not match
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !isFormValid()}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
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

          <div className="mt-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Already have an account?{" "}
              <Link
                href="/auth/signIn"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                Or continue with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={loading}
              className="flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="fab fa-google mr-2 text-red-500"></i>
              Continue with Google
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            By creating an account, you agree to our{" "}
            <Link href="/terms" className="text-blue-600 dark:text-blue-400 hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}

export default SignUpPage;