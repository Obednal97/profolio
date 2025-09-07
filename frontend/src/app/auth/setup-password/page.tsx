"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { EnhancedGlassCard } from "@/components/ui/enhanced-glass/EnhancedGlassCard";
import { Eye, EyeOff, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface TokenValidation {
  valid: boolean;
  email: string;
  expiresIn: number;
}

interface PasswordStrength {
  score: number;
  feedback: string[];
  meets: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
}

export default function SetupPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  // State management with race condition prevention
  const [isVerifying, setIsVerifying] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<TokenValidation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Password fields
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Password strength
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    feedback: [],
    meets: {
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false,
    },
  });

  // Refs for race condition prevention
  const mounted = useRef(true);
  const verificationAbortController = useRef<AbortController | null>(null);
  const submissionAbortController = useRef<AbortController | null>(null);

  // Check password strength
  const checkPasswordStrength = useCallback((pwd: string): PasswordStrength => {
    const strength: PasswordStrength = {
      score: 0,
      feedback: [],
      meets: {
        length: pwd.length >= 12,
        uppercase: /[A-Z]/.test(pwd),
        lowercase: /[a-z]/.test(pwd),
        number: /\d/.test(pwd),
        special: /[@$!%*?&]/.test(pwd),
      },
    };

    // Calculate score
    Object.values(strength.meets).forEach((met) => {
      if (met) strength.score += 20;
    });

    // Add feedback
    if (!strength.meets.length) strength.feedback.push("At least 12 characters");
    if (!strength.meets.uppercase) strength.feedback.push("One uppercase letter");
    if (!strength.meets.lowercase) strength.feedback.push("One lowercase letter");
    if (!strength.meets.number) strength.feedback.push("One number");
    if (!strength.meets.special) strength.feedback.push("One special character (@$!%*?&)");

    // Check for email in password
    if (tokenInfo?.email) {
      const emailLocal = tokenInfo.email.split("@")[0].toLowerCase();
      if (pwd.toLowerCase().includes(emailLocal)) {
        strength.score = Math.min(strength.score, 40);
        strength.feedback.push("Password cannot contain your email");
      }
    }

    return strength;
  }, [tokenInfo]);

  // Update password strength when password changes
  useEffect(() => {
    setPasswordStrength(checkPasswordStrength(password));
  }, [password, checkPasswordStrength]);

  // Verify token on mount
  useEffect(() => {
    if (!token) {
      setError("No token provided");
      setIsVerifying(false);
      return;
    }

    const verifyToken = async () => {
      // Cancel any pending verification
      if (verificationAbortController.current) {
        verificationAbortController.current.abort();
      }

      verificationAbortController.current = new AbortController();

      try {
        const response = await apiClient.post<TokenValidation>(
          "/api/auth/oauth/verify-setup-token",
          { token }
        );

        if (!mounted.current) return;

        if (response.valid) {
          setTokenInfo(response);
          setError(null);
        } else {
          setError("Invalid or expired token");
        }
      } catch (err) {
        if (!mounted.current) return;
        
        const error = err as { response?: { data?: { message?: string } }; name?: string };
        if (error.name === "AbortError") return;
        
        const errorMessage = error.response?.data?.message;
        setError(errorMessage || "Failed to verify token");
      } finally {
        if (mounted.current) {
          setIsVerifying(false);
        }
      }
    };

    verifyToken();

    return () => {
      mounted.current = false;
      if (verificationAbortController.current) {
        verificationAbortController.current.abort();
      }
    };
  }, [token]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double submission
    if (isSubmitting || hasSubmitted || !token) return;

    // Validate passwords
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (passwordStrength.score < 100) {
      setError("Password does not meet all requirements");
      return;
    }

    // Cancel any pending submission
    if (submissionAbortController.current) {
      submissionAbortController.current.abort();
    }

    submissionAbortController.current = new AbortController();

    setIsSubmitting(true);
    setHasSubmitted(true);
    setError(null);

    try {
      const response = await apiClient.post<{ success: boolean; message: string }>(
        "/api/auth/oauth/set-password",
        {
          token,
          password,
          confirmPassword,
        }
      );

      if (!mounted.current) return;

      if (response.success) {
        setSuccess(true);
        
        // Redirect to sign-in page after 3 seconds
        setTimeout(() => {
          if (mounted.current) {
            router.replace("/auth/signIn?passwordSet=true");
          }
        }, 3000);
      }
    } catch (err) {
      if (!mounted.current) return;
      
      const error = err as { response?: { data?: { message?: string } }; name?: string };
      if (error.name === "AbortError") return;
      
      const errorMessage = error.response?.data?.message;
      setError(errorMessage || "Failed to set password");
      
      setHasSubmitted(false); // Allow retry on error
    } finally {
      if (mounted.current) {
        setIsSubmitting(false);
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (submissionAbortController.current) {
        submissionAbortController.current.abort();
      }
    };
  }, []);

  // Loading state
  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <EnhancedGlassCard variant="prominent" padding="lg" hoverable={false} enableLensing={false} className="w-full max-w-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying your token...</p>
        </EnhancedGlassCard>
      </div>
    );
  }

  // Error state
  if (error && !tokenInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <EnhancedGlassCard variant="prominent" padding="lg" hoverable={false} enableLensing={false} className="w-full max-w-md text-center">
          <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Invalid Token</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => router.push("/auth/signIn")} variant="outline">
            Return to Sign In
          </Button>
        </EnhancedGlassCard>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <EnhancedGlassCard variant="prominent" padding="lg" hoverable={false} enableLensing={false} className="w-full max-w-md text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Password Set Successfully!</h2>
          <p className="text-muted-foreground mb-4">
            You can now sign in with your email and password.
          </p>
          <p className="text-sm text-muted-foreground">
            Redirecting to sign in page...
          </p>
        </EnhancedGlassCard>
      </div>
    );
  }

  // Main form
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <EnhancedGlassCard variant="prominent" padding="lg" hoverable={false} enableLensing={false} className="w-full max-w-md">
        <h1 className="text-2xl font-bold mb-2">Set Your Password</h1>
        <p className="text-muted-foreground mb-6">
          Create a password for your account: {tokenInfo?.email}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Password field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md pr-10"
                placeholder="Enter your password"
                required
                disabled={isSubmitting || hasSubmitted}
                data-testid="password-input"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                disabled={isSubmitting || hasSubmitted}
                data-testid="toggle-password-visibility"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm password field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md pr-10"
                placeholder="Confirm your password"
                required
                disabled={isSubmitting || hasSubmitted}
                data-testid="confirm-password-input"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                disabled={isSubmitting || hasSubmitted}
                data-testid="toggle-confirm-password-visibility"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>

          {/* Password strength indicator */}
          {password && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      passwordStrength.score <= 20
                        ? "bg-red-500"
                        : passwordStrength.score <= 40
                        ? "bg-orange-500"
                        : passwordStrength.score <= 60
                        ? "bg-yellow-500"
                        : passwordStrength.score <= 80
                        ? "bg-blue-500"
                        : "bg-green-500"
                    }`}
                    style={{ width: `${passwordStrength.score}%` }}
                  />
                </div>
                <span className="text-sm text-muted-foreground">
                  {passwordStrength.score <= 40
                    ? "Weak"
                    : passwordStrength.score <= 80
                    ? "Good"
                    : "Strong"}
                </span>
              </div>

              {/* Requirements checklist */}
              <div className="space-y-1 text-sm">
                <div className={`flex items-center gap-1 ${passwordStrength.meets.length ? "text-green-600" : "text-muted-foreground"}`}>
                  {passwordStrength.meets.length ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    <XCircle className="h-3 w-3" />
                  )}
                  At least 12 characters
                </div>
                <div className={`flex items-center gap-1 ${passwordStrength.meets.uppercase ? "text-green-600" : "text-muted-foreground"}`}>
                  {passwordStrength.meets.uppercase ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    <XCircle className="h-3 w-3" />
                  )}
                  One uppercase letter
                </div>
                <div className={`flex items-center gap-1 ${passwordStrength.meets.lowercase ? "text-green-600" : "text-muted-foreground"}`}>
                  {passwordStrength.meets.lowercase ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    <XCircle className="h-3 w-3" />
                  )}
                  One lowercase letter
                </div>
                <div className={`flex items-center gap-1 ${passwordStrength.meets.number ? "text-green-600" : "text-muted-foreground"}`}>
                  {passwordStrength.meets.number ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    <XCircle className="h-3 w-3" />
                  )}
                  One number
                </div>
                <div className={`flex items-center gap-1 ${passwordStrength.meets.special ? "text-green-600" : "text-muted-foreground"}`}>
                  {passwordStrength.meets.special ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    <XCircle className="h-3 w-3" />
                  )}
                  One special character
                </div>
              </div>
            </div>
          )}

          {/* Password match indicator */}
          {confirmPassword && (
            <div className="text-sm">
              {password === confirmPassword ? (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-3 w-3" />
                  Passwords match
                </div>
              ) : (
                <div className="flex items-center gap-1 text-red-600">
                  <XCircle className="h-3 w-3" />
                  Passwords do not match
                </div>
              )}
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Submit button */}
          <Button
            type="submit"
            className="w-full"
            disabled={
              isSubmitting ||
              hasSubmitted ||
              passwordStrength.score < 100 ||
              password !== confirmPassword ||
              !password ||
              !confirmPassword
            }
            data-testid="submit-password-button"
          >
            {isSubmitting ? "Setting Password..." : "Set Password"}
          </Button>

          {/* Token expiry warning */}
          {tokenInfo && tokenInfo.expiresIn < 600 && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 text-yellow-800 rounded-md">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p className="text-sm">
                This link expires in {Math.floor(tokenInfo.expiresIn / 60)} minutes
              </p>
            </div>
          )}
        </form>
      </EnhancedGlassCard>
    </div>
  );
}