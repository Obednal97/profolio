"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/unifiedAuth";
import { useAuth as useAuthHook } from "@/hooks/useAuth";
import { AuthLayout } from "@/components/layout/authLayout";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import ProfolioLogo from "@/components/ui/logo/ProfolioLogo";

function SignUpPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const {
    user,
    loading: authLoading,
    signUp,
    signInWithGoogleProvider,
    authMode,
    config,
  } = useAuth();
  const { signInWithDemo } = useAuthHook();
  const router = useRouter();
  const [showEmailForm, setShowEmailForm] = useState(authMode === "local"); // Expanded by default in self-hosted mode
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Check if user is in demo mode
  const isDemoMode =
    typeof window !== "undefined" &&
    localStorage.getItem("demo-mode") === "true";

  // Redirect if already authenticated (Firebase user or demo mode)
  useEffect(() => {
    // Only redirect if we have a valid user AND we're not in a loading state
    if (!authLoading && ((user && user.id) || isDemoMode)) {
      router.push("/app/dashboard");
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
      await signUp(
        formData.email.trim(),
        formData.password,
        formData.name.trim()
      );
      router.push("/app/dashboard");
    } catch (err: unknown) {
      console.error("Sign up error:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to create account. Please try again.";
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    if (!signInWithGoogleProvider) {
      setError("Google sign-up is not available");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await signInWithGoogleProvider();
      router.push("/app/dashboard");
    } catch (err: unknown) {
      console.error("Google sign up error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to sign up with Google";
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
  if (!authLoading && ((user && user.id) || isDemoMode)) return null;

  return (
    <AuthLayout>
      <div className="w-full">
        <div className="text-center mb-8">
          {/* Clickable Logo */}
          <Link
            href="/"
            className="inline-block mb-6 hover:scale-105 transition-transform duration-200"
          >
            <ProfolioLogo size="lg" />
          </Link>

          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Create your account
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Start managing your wealth in minutes
          </p>
          {authMode && (
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              {authMode === "local" ? "🏠 Self-hosted mode" : "☁️ Cloud mode"}
            </p>
          )}
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

        {/* Demo Mode Banner - consistent with sign in page */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <i className="fas fa-play-circle text-blue-600 dark:text-blue-400 mr-3 text-xl"></i>
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                  Try Demo Mode
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Explore all features with sample data - no account needed
                </p>
              </div>
            </div>
            <button
              onClick={handleDemoMode}
              disabled={demoLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {demoLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Starting...
                </div>
              ) : (
                "Try Demo"
              )}
            </button>
          </div>
        </motion.div>

        {/* Google Sign-up (show first in Firebase mode) */}
        {config?.enableGoogleAuth && signInWithGoogleProvider && (
          <div className="mb-6">
            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>
          </div>
        )}

        {/* Divider (only show when both Google and email are available) */}
        {config?.enableGoogleAuth && signInWithGoogleProvider && (
          <div className="mb-6">
            <div className="relative flex items-center">
              <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
              <span className="px-4 text-sm text-gray-500 dark:text-gray-400 bg-transparent">
                Or continue with
              </span>
              <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
            </div>
          </div>
        )}

        {/* Email sign-up - collapsible in cloud mode, expanded in self-hosted mode */}
        {authMode === "local" ? (
          // Self-hosted mode - always show email form
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
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700"
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
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700"
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
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700"
                placeholder="••••••••"
                required
                disabled={loading}
              />
              <div className="mt-3 space-y-2">
                {validatePassword(formData.password).map((req, index) => (
                  <div
                    key={index}
                    className={`text-sm flex items-center gap-2 transition-colors ${
                      req.met
                        ? "text-green-600 dark:text-green-400"
                        : "text-gray-400 dark:text-gray-500"
                    }`}
                  >
                    <i
                      className={`fas fa-${
                        req.met ? "check-circle" : "circle"
                      } text-xs`}
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
                className={`w-full px-4 py-3 border rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all bg-white dark:bg-gray-700 ${
                  formData.confirmPassword &&
                  formData.password !== formData.confirmPassword
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                }`}
                placeholder="••••••••"
                required
                disabled={loading}
              />
              {formData.confirmPassword &&
                formData.password !== formData.confirmPassword && (
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
        ) : (
          // Cloud mode - collapsible email form
          <div>
            {!showEmailForm ? (
              <button
                onClick={() => setShowEmailForm(true)}
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <i className="fas fa-envelope mr-2"></i>
                Sign up with Email
                <i className="fas fa-chevron-down ml-2"></i>
              </button>
            ) : (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Sign up with Email
                    </span>
                    <button
                      onClick={() => setShowEmailForm(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
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
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700"
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
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700"
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
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700"
                        placeholder="••••••••"
                        required
                        disabled={loading}
                      />
                      <div className="mt-3 space-y-2">
                        {validatePassword(formData.password).map(
                          (req, index) => (
                            <div
                              key={index}
                              className={`text-sm flex items-center gap-2 transition-colors ${
                                req.met
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-gray-400 dark:text-gray-500"
                              }`}
                            >
                              <i
                                className={`fas fa-${
                                  req.met ? "check-circle" : "circle"
                                } text-xs`}
                              ></i>
                              {req.text}
                            </div>
                          )
                        )}
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
                        className={`w-full px-4 py-3 border rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all bg-white dark:bg-gray-700 ${
                          formData.confirmPassword &&
                          formData.password !== formData.confirmPassword
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                        }`}
                        placeholder="••••••••"
                        required
                        disabled={loading}
                      />
                      {formData.confirmPassword &&
                        formData.password !== formData.confirmPassword && (
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
                </div>
              </motion.div>
            )}
          </div>
        )}

        <div className="mt-8 text-center space-y-4">
          <div>
            <span className="text-gray-600 dark:text-gray-400">
              Already have an account?{" "}
            </span>
            <Link
              href="/auth/signIn"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
            >
              Sign in
            </Link>
          </div>

          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              By creating an account, you agree to our{" "}
              <Link
                href="/terms"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}

export default SignUpPage;
