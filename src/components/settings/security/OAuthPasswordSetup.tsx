"use client";

import React, { useState } from "react";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { EnhancedGlassCard } from "@/components/ui/enhanced-glass/EnhancedGlassCard";
import { AlertCircle, CheckCircle, Mail, Lock } from "lucide-react";

interface OAuthPasswordSetupProps {
  userEmail?: string;
  provider?: string;
  hasPassword?: boolean;
  onPasswordSetupRequested?: () => void;
}

export const OAuthPasswordSetup: React.FC<OAuthPasswordSetupProps> = ({
  userEmail,
  provider,
  hasPassword = false,
  onPasswordSetupRequested,
}) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only show for OAuth users without a password
  const isOAuthUser = provider === "firebase" || provider === "google" || provider === "github";
  const showSetupOption = isOAuthUser && !hasPassword;

  const handleRequestPasswordSetup = async () => {
    if (isRequesting || requestSent) return;

    setIsRequesting(true);
    setError(null);

    try {
      const response = await apiClient.post<{ success: boolean; message: string }>("/api/auth/oauth/request-password-setup", {});

      if (response.success) {
        setRequestSent(true);
        onPasswordSetupRequested?.();
      } else {
        setError(response.message || "Failed to send password setup email");
      }
    } catch (err) {
      const errorMessage = (err as { response?: { data?: { message?: string } } })
        .response?.data?.message;
      setError(errorMessage || "Failed to request password setup");
    } finally {
      setIsRequesting(false);
    }
  };

  if (!showSetupOption) {
    return null;
  }

  if (requestSent) {
    return (
      <EnhancedGlassCard 
        variant="prominent" 
        padding="lg" 
        hoverable={false} 
        enableLensing={false}
      >
        <div className="flex items-start space-x-3">
          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Password Setup Email Sent
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-3">
              We&apos;ve sent a password setup link to <strong>{userEmail}</strong>. 
              Please check your email and follow the instructions to set your password.
            </p>
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <Mail className="h-4 w-4" />
              <span>The link will expire in 1 hour</span>
            </div>
          </div>
        </div>
      </EnhancedGlassCard>
    );
  }

  return (
    <EnhancedGlassCard 
      variant="prominent" 
      padding="lg" 
      hoverable={false} 
      enableLensing={false}
    >
      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <Lock className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Enable Password Authentication
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You&apos;re currently signed in with {provider === "firebase" ? "Google" : provider}. 
              Set up a password to enable email and password authentication as an additional 
              sign-in option.
            </p>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <p className="font-medium mb-1">Benefits of setting a password:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Sign in with email and password if OAuth is unavailable</li>
                    <li>Additional security with two authentication methods</li>
                    <li>Backup access method for your account</li>
                  </ul>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              </div>
            )}

            <Button
              onClick={handleRequestPasswordSetup}
              disabled={isRequesting}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium px-6 py-3"
              data-testid="request-password-setup-button"
            >
              {isRequesting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Password Setup Email
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </EnhancedGlassCard>
  );
};