"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/unifiedAuth";
import { useAppContext } from "@/components/layout/layoutWrapper";
import { BaseModal } from "@/components/modals/modal";
import { Button } from "@/components/ui/button/button";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/providers/theme-provider";
import { useRouter } from "next/navigation";
import { logger } from "@/lib/logger";
import { SettingsSkeleton } from "@/components/ui/skeleton";

interface Tab {
  id: string;
  label: string;
  icon: string;
}

const tabs: Tab[] = [
  { id: "profile", label: "Profile", icon: "fa-user" },
  { id: "security", label: "Security", icon: "fa-lock" },
  { id: "preferences", label: "Preferences", icon: "fa-cog" },
  { id: "account", label: "Account", icon: "fa-user-cog" },
];

// Country list for dropdown
const countries = [
  { code: "", name: "Select Country" },
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "GB", name: "United Kingdom" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
  { code: "NL", name: "Netherlands" },
  { code: "BE", name: "Belgium" },
  { code: "CH", name: "Switzerland" },
  { code: "AT", name: "Austria" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "DK", name: "Denmark" },
  { code: "FI", name: "Finland" },
  { code: "IE", name: "Ireland" },
  { code: "PT", name: "Portugal" },
  { code: "GR", name: "Greece" },
  { code: "PL", name: "Poland" },
  { code: "CZ", name: "Czech Republic" },
  { code: "HU", name: "Hungary" },
  { code: "SK", name: "Slovakia" },
  { code: "SI", name: "Slovenia" },
  { code: "HR", name: "Croatia" },
  { code: "BG", name: "Bulgaria" },
  { code: "RO", name: "Romania" },
  { code: "EE", name: "Estonia" },
  { code: "LV", name: "Latvia" },
  { code: "LT", name: "Lithuania" },
  { code: "LU", name: "Luxembourg" },
  { code: "MT", name: "Malta" },
  { code: "CY", name: "Cyprus" },
  { code: "IS", name: "Iceland" },
  { code: "LI", name: "Liechtenstein" },
  { code: "MC", name: "Monaco" },
  { code: "SM", name: "San Marino" },
  { code: "VA", name: "Vatican City" },
  { code: "AD", name: "Andorra" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "CN", name: "China" },
  { code: "IN", name: "India" },
  { code: "SG", name: "Singapore" },
  { code: "HK", name: "Hong Kong" },
  { code: "TW", name: "Taiwan" },
  { code: "MY", name: "Malaysia" },
  { code: "TH", name: "Thailand" },
  { code: "ID", name: "Indonesia" },
  { code: "PH", name: "Philippines" },
  { code: "VN", name: "Vietnam" },
  { code: "NZ", name: "New Zealand" },
  { code: "MX", name: "Mexico" },
  { code: "BR", name: "Brazil" },
  { code: "AR", name: "Argentina" },
  { code: "CL", name: "Chile" },
  { code: "CO", name: "Colombia" },
  { code: "PE", name: "Peru" },
  { code: "UY", name: "Uruguay" },
  { code: "PY", name: "Paraguay" },
  { code: "BO", name: "Bolivia" },
  { code: "EC", name: "Ecuador" },
  { code: "VE", name: "Venezuela" },
  { code: "GY", name: "Guyana" },
  { code: "SR", name: "Suriname" },
  { code: "ZA", name: "South Africa" },
  { code: "EG", name: "Egypt" },
  { code: "MA", name: "Morocco" },
  { code: "TN", name: "Tunisia" },
  { code: "DZ", name: "Algeria" },
  { code: "LY", name: "Libya" },
  { code: "SD", name: "Sudan" },
  { code: "ET", name: "Ethiopia" },
  { code: "KE", name: "Kenya" },
  { code: "UG", name: "Uganda" },
  { code: "TZ", name: "Tanzania" },
  { code: "RW", name: "Rwanda" },
  { code: "NG", name: "Nigeria" },
  { code: "GH", name: "Ghana" },
  { code: "CI", name: "Côte d'Ivoire" },
  { code: "SN", name: "Senegal" },
  { code: "ML", name: "Mali" },
  { code: "BF", name: "Burkina Faso" },
  { code: "NE", name: "Niger" },
  { code: "TD", name: "Chad" },
  { code: "CM", name: "Cameroon" },
  { code: "CF", name: "Central African Republic" },
  { code: "CG", name: "Republic of the Congo" },
  { code: "CD", name: "Democratic Republic of the Congo" },
  { code: "GA", name: "Gabon" },
  { code: "GQ", name: "Equatorial Guinea" },
  { code: "ST", name: "São Tomé and Príncipe" },
  { code: "AO", name: "Angola" },
  { code: "ZM", name: "Zambia" },
  { code: "ZW", name: "Zimbabwe" },
  { code: "BW", name: "Botswana" },
  { code: "NA", name: "Namibia" },
  { code: "SZ", name: "Eswatini" },
  { code: "LS", name: "Lesotho" },
  { code: "MG", name: "Madagascar" },
  { code: "MU", name: "Mauritius" },
  { code: "SC", name: "Seychelles" },
  { code: "KM", name: "Comoros" },
  { code: "DJ", name: "Djibouti" },
  { code: "SO", name: "Somalia" },
  { code: "ER", name: "Eritrea" },
  { code: "IL", name: "Israel" },
  { code: "PS", name: "Palestine" },
  { code: "JO", name: "Jordan" },
  { code: "LB", name: "Lebanon" },
  { code: "SY", name: "Syria" },
  { code: "IQ", name: "Iraq" },
  { code: "IR", name: "Iran" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "QA", name: "Qatar" },
  { code: "BH", name: "Bahrain" },
  { code: "KW", name: "Kuwait" },
  { code: "OM", name: "Oman" },
  { code: "YE", name: "Yemen" },
  { code: "TR", name: "Turkey" },
  { code: "AM", name: "Armenia" },
  { code: "AZ", name: "Azerbaijan" },
  { code: "GE", name: "Georgia" },
  { code: "KZ", name: "Kazakhstan" },
  { code: "KG", name: "Kyrgyzstan" },
  { code: "TJ", name: "Tajikistan" },
  { code: "TM", name: "Turkmenistan" },
  { code: "UZ", name: "Uzbekistan" },
  { code: "AF", name: "Afghanistan" },
  { code: "PK", name: "Pakistan" },
  { code: "BD", name: "Bangladesh" },
  { code: "LK", name: "Sri Lanka" },
  { code: "MV", name: "Maldives" },
  { code: "BT", name: "Bhutan" },
  { code: "NP", name: "Nepal" },
  { code: "MM", name: "Myanmar" },
  { code: "LA", name: "Laos" },
  { code: "KH", name: "Cambodia" },
  { code: "BN", name: "Brunei" },
  { code: "TL", name: "Timor-Leste" },
  { code: "PG", name: "Papua New Guinea" },
  { code: "SB", name: "Solomon Islands" },
  { code: "VU", name: "Vanuatu" },
  { code: "FJ", name: "Fiji" },
  { code: "NC", name: "New Caledonia" },
  { code: "PF", name: "French Polynesia" },
  { code: "WS", name: "Samoa" },
  { code: "TO", name: "Tonga" },
  { code: "KI", name: "Kiribati" },
  { code: "TV", name: "Tuvalu" },
  { code: "NR", name: "Nauru" },
  { code: "PW", name: "Palau" },
  { code: "FM", name: "Micronesia" },
  { code: "MH", name: "Marshall Islands" },
  { code: "RU", name: "Russia" },
  { code: "BY", name: "Belarus" },
  { code: "UA", name: "Ukraine" },
  { code: "MD", name: "Moldova" },
  { code: "MN", name: "Mongolia" },
  { code: "KP", name: "North Korea" },
];

// Type definitions for tab components
interface ProfileTabProps {
  profileData: {
    name: string;
    email: string;
    phone: string;
    bio: string;
    location: string;
  };
  setProfileData: React.Dispatch<
    React.SetStateAction<{
      name: string;
      email: string;
      phone: string;
      bio: string;
      location: string;
    }>
  >;
  profileLoading: boolean;
  handleProfileUpdate: (e: React.FormEvent) => Promise<void>;
  loading: boolean;
  isDemoMode: boolean;
}

// Type for preferences
interface PreferencesType {
  theme: "light" | "dark" | "system";
  currency: string;
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    marketing: boolean;
  };
  privacy: {
    profileVisible: boolean;
    dataSharing: boolean;
  };
}

// Define ProfileTab outside of SettingsPage to prevent recreation on every render
const ProfileTab = ({
  profileData,
  setProfileData,
  profileLoading,
  handleProfileUpdate,
  loading,
  isDemoMode,
}: ProfileTabProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-6"
  >
    {profileLoading ? (
      <div className="bg-gray-50 dark:bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-white/10">
        <div className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-16 w-16 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
              <div className="h-3 w-48 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
              <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
              <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
            </div>
          </div>
        </div>
      </div>
    ) : (
      <form onSubmit={handleProfileUpdate} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={profileData.name}
              onChange={(e) =>
                setProfileData({ ...profileData, name: e.target.value })
              }
              className="w-full bg-gray-50 dark:bg-white/5 backdrop-blur-sm border border-gray-300 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500/50 focus:bg-white dark:focus:bg-white/10 transition-all duration-200"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address
              {!isDemoMode && (
                <span className="text-gray-500 text-xs ml-2">
                  (cannot be changed)
                </span>
              )}
            </label>
            <input
              type="email"
              value={profileData.email}
              onChange={(e) =>
                setProfileData({ ...profileData, email: e.target.value })
              }
              disabled={!isDemoMode}
              className={`w-full backdrop-blur-sm border rounded-xl px-4 py-3 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none transition-all duration-200 ${
                !isDemoMode
                  ? "bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  : "bg-gray-50 dark:bg-white/5 border-gray-300 dark:border-white/10 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-500/50 focus:bg-white dark:focus:bg-white/10"
              }`}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phone Number{" "}
              <span className="text-gray-500 text-xs">(optional)</span>
            </label>
            <input
              type="tel"
              value={profileData.phone}
              onChange={(e) =>
                setProfileData({ ...profileData, phone: e.target.value })
              }
              className="w-full bg-gray-50 dark:bg-white/5 backdrop-blur-sm border border-gray-300 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500/50 focus:bg-white dark:focus:bg-white/10 transition-all duration-200"
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Location <span className="text-gray-500 text-xs">(optional)</span>
            </label>
            <select
              value={profileData.location}
              onChange={(e) =>
                setProfileData({ ...profileData, location: e.target.value })
              }
              className="w-full bg-gray-50 dark:bg-white/5 backdrop-blur-sm border border-gray-300 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-500/50 focus:bg-white dark:focus:bg-white/10 transition-all duration-200"
            >
              {countries.map((country) => (
                <option key={country.code} value={country.name}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Bio
          </label>
          <textarea
            value={profileData.bio}
            onChange={(e) =>
              setProfileData({ ...profileData, bio: e.target.value })
            }
            className="w-full bg-gray-50 dark:bg-white/5 backdrop-blur-sm border border-gray-300 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500/50 focus:bg-white dark:focus:bg-white/10 transition-all duration-200"
            rows={4}
            placeholder="Tell us about yourself..."
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium px-6 py-3"
        >
          {loading ? "Updating..." : "Update Profile"}
        </Button>
      </form>
    )}
  </motion.div>
);

// SECURITY FIX: Remove client-side token management to prevent XSS vulnerabilities
// Tokens should ONLY be managed server-side via httpOnly cookies

// Secure preferences management (non-sensitive data only)
function getSecurePreferences(): { tokenExpiration?: string } {
  try {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user-preferences");
      return stored ? JSON.parse(stored) : {};
    }
  } catch (error) {
    console.warn("Failed to get preferences:", error);
  }
  return {};
}

function setSecurePreferences(prefs: { tokenExpiration?: string }): void {
  try {
    if (typeof window !== "undefined") {
      const existing = getSecurePreferences();
      const updated = { ...existing, ...prefs };
      localStorage.setItem("user-preferences", JSON.stringify(updated));
    }
  } catch (error) {
    console.warn("Failed to set preferences:", error);
  }
}

// Security Tab component
const SecurityTab = ({
  handlePasswordUpdate,
  loading,
  userProfile,
  isDemoMode,
}: {
  handlePasswordUpdate: (data: {
    currentPassword?: string;
    newPassword: string;
    confirmPassword: string;
  }) => Promise<void>;
  loading: boolean;
  userProfile?: { provider?: string; email?: string };
  isDemoMode: boolean;
}) => {
  const [tokenExpiration, setTokenExpiration] = useState(() => {
    if (typeof window !== "undefined") {
      const prefs = getSecurePreferences();
      return prefs.tokenExpiration || "30days";
    }
    return "30days";
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Determine if user is a Google/Firebase user
  const isGoogleUser =
    userProfile?.provider === "firebase" || userProfile?.email?.includes("@");
  const hasPassword = !isGoogleUser; // For now, assume non-Google users have passwords

  // Password validation
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

  const passwordRequirements = validatePassword(passwordData.newPassword);
  const passwordsMatch =
    passwordData.newPassword === passwordData.confirmPassword;
  const isFormValid = () => {
    // For Google users (setting password), no current password needed
    // For existing users (changing password), current password required
    const currentPasswordValid =
      isGoogleUser || passwordData.currentPassword.length > 0;
    const newPasswordValid = passwordRequirements.every((req) => req.met);
    const confirmPasswordValid =
      passwordsMatch && passwordData.confirmPassword.length > 0;

    return currentPasswordValid && newPasswordValid && confirmPasswordValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) return;

    await handlePasswordUpdate({
      currentPassword: isGoogleUser ? undefined : passwordData.currentPassword,
      newPassword: passwordData.newPassword,
      confirmPassword: passwordData.confirmPassword,
    });
  };

  // Check if we're in cloud mode
  const isCloudMode =
    typeof window !== "undefined" &&
    (window.location.hostname.includes(".vercel.app") ||
      window.location.hostname.includes(".netlify.app") ||
      process.env.NODE_ENV === "production");

  const handleTokenExpirationChange = (value: string) => {
    setTokenExpiration(value);
    if (typeof window !== "undefined") {
      setSecurePreferences({ tokenExpiration: value });
    }
  };

  const tokenOptions = [
    { value: "1day", label: "1 Day" },
    { value: "7days", label: "7 Days" },
    { value: "30days", label: "30 Days" },
    { value: "unlimited", label: "Unlimited" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Authentication Methods Status */}
      <div className="bg-gray-50 dark:bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-white/10">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Authentication Methods
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <i className="fab fa-google text-xl text-red-500"></i>
              <span className="text-gray-700 dark:text-gray-300">
                Google Sign-In
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {isGoogleUser ? (
                <span className="text-green-500 text-sm">✓ Connected</span>
              ) : (
                <span className="text-gray-400 text-sm">○ Not Connected</span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <i className="fas fa-lock text-xl text-blue-500"></i>
              <span className="text-gray-700 dark:text-gray-300">
                Password Authentication
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {hasPassword ? (
                <span className="text-green-500 text-sm">✓ Set</span>
              ) : (
                <span className="text-gray-400 text-sm">○ Not Set</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Password Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-gray-50 dark:bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-white/10">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {isGoogleUser ? "Set Password" : "Change Password"}
          </h3>

          {isGoogleUser && (
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-blue-700 dark:text-blue-300 text-sm">
                <i className="fas fa-info-circle mr-2"></i>
                You&apos;re signed in with Google. Set a password to enable
                email authentication as an additional sign-in option.
              </p>
            </div>
          )}

          {!isGoogleUser && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current Password
              </label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    currentPassword: e.target.value,
                  })
                }
                className="w-full bg-gray-50 dark:bg-white/5 backdrop-blur-sm border border-gray-300 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500/50 focus:bg-white dark:focus:bg-white/10 transition-all duration-200"
                required={!isGoogleUser}
                disabled={isDemoMode}
                placeholder={
                  isDemoMode
                    ? "Not available in demo mode"
                    : "Enter current password"
                }
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              New Password
            </label>
            <input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  newPassword: e.target.value,
                })
              }
              className="w-full bg-gray-50 dark:bg-white/5 backdrop-blur-sm border border-gray-300 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500/50 focus:bg-white dark:focus:bg-white/10 transition-all duration-200"
              required
              disabled={isDemoMode}
              placeholder={
                isDemoMode ? "Not available in demo mode" : "Enter new password"
              }
            />
            {/* Password Requirements */}
            {passwordData.newPassword && (
              <div className="mt-3 space-y-2">
                {passwordRequirements.map((req, index) => (
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
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  confirmPassword: e.target.value,
                })
              }
              className={`w-full bg-gray-50 dark:bg-white/5 backdrop-blur-sm border rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                passwordData.confirmPassword && !passwordsMatch
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 dark:border-white/10 focus:ring-blue-500"
              }`}
              required
              disabled={isDemoMode}
              placeholder={
                isDemoMode
                  ? "Not available in demo mode"
                  : "Confirm new password"
              }
            />
            {passwordData.confirmPassword && !passwordsMatch && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                Passwords do not match
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading || !isFormValid() || isDemoMode}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium px-6 py-3"
          >
            {loading
              ? "Updating..."
              : isGoogleUser
              ? "Set Password"
              : "Update Password"}
          </Button>

          {isDemoMode && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Password changes are not available in demo mode
            </p>
          )}
        </div>
      </form>

      {/* Session Management */}
      <div className="border-t border-gray-200 dark:border-white/10 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Session Management
        </h3>

        {!isCloudMode && (
          <div className="bg-gray-50 dark:bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-white/10 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-gray-900 dark:text-white font-medium mb-2">
                  Session Duration
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  Choose how long you stay signed in before being automatically
                  logged out for security.
                </p>
                <select
                  value={tokenExpiration}
                  onChange={(e) => handleTokenExpirationChange(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-white/5 backdrop-blur-sm border border-gray-300 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-500/50 focus:bg-white dark:focus:bg-white/10 transition-all duration-200"
                >
                  {tokenOptions.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                      className="bg-white dark:bg-gray-800"
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {isCloudMode && (
          <div className="bg-blue-50 dark:bg-blue-900/20 backdrop-blur-sm rounded-xl p-6 border border-blue-200 dark:border-blue-800 mb-6">
            <div className="flex items-center">
              <i className="fas fa-info-circle text-blue-500 mr-3"></i>
              <div>
                <p className="text-blue-900 dark:text-blue-200 font-medium">
                  Cloud Mode Security
                </p>
                <p className="text-blue-700 dark:text-blue-300 text-sm">
                  For security, sessions automatically expire after 30 days in
                  cloud mode.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 dark:border-white/10 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Two-Factor Authentication
        </h3>
        <div className="bg-gray-50 dark:bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-900 dark:text-white font-medium">
                Authenticator App
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Use an authenticator app to generate codes
              </p>
            </div>
            <Button
              variant="ghost"
              className="text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10"
            >
              Enable
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Preferences Tab component
const PreferencesTab = ({
  preferences,
  setPreferences,
  handlePreferencesUpdate,
  loading,
}: {
  preferences: PreferencesType;
  setPreferences: React.Dispatch<React.SetStateAction<PreferencesType>>;
  handlePreferencesUpdate: () => Promise<void>;
  loading: boolean;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-6"
  >
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Theme
        </label>
        <select
          value={preferences.theme}
          onChange={(e) =>
            setPreferences({
              ...preferences,
              theme: e.target.value as "light" | "dark" | "system",
            })
          }
          className="w-full bg-gray-50 dark:bg-white/5 backdrop-blur-sm border border-gray-300 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-500/50 focus:bg-white dark:focus:bg-white/10 transition-all duration-200"
        >
          <option value="light" className="bg-white dark:bg-gray-800">
            Light
          </option>
          <option value="dark" className="bg-white dark:bg-gray-800">
            Dark
          </option>
          <option value="system" className="bg-white dark:bg-gray-800">
            System
          </option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Currency
        </label>
        <select
          value={preferences.currency}
          onChange={(e) =>
            setPreferences({ ...preferences, currency: e.target.value })
          }
          className="w-full bg-gray-50 dark:bg-white/5 backdrop-blur-sm border border-gray-300 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-500/50 focus:bg-white dark:focus:bg-white/10 transition-all duration-200"
        >
          <option value="USD" className="bg-white dark:bg-gray-800">
            USD ($)
          </option>
          <option value="EUR" className="bg-white dark:bg-gray-800">
            EUR (€)
          </option>
          <option value="GBP" className="bg-white dark:bg-gray-800">
            GBP (£)
          </option>
          <option value="JPY" className="bg-white dark:bg-gray-800">
            JPY (¥)
          </option>
        </select>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Notifications
        </h3>

        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">
              Email Notifications
            </span>
            <input
              type="checkbox"
              checked={preferences.notifications.email}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  notifications: {
                    ...preferences.notifications,
                    email: e.target.checked,
                  },
                })
              }
              className="form-checkbox h-5 w-5 text-blue-500 rounded border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-white/10 focus:ring-blue-500"
            />
          </label>

          <label className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">
              Push Notifications
            </span>
            <input
              type="checkbox"
              checked={preferences.notifications.push}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  notifications: {
                    ...preferences.notifications,
                    push: e.target.checked,
                  },
                })
              }
              className="form-checkbox h-5 w-5 text-blue-500 rounded border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-white/10 focus:ring-blue-500"
            />
          </label>

          <label className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">
              Marketing Emails
            </span>
            <input
              type="checkbox"
              checked={preferences.notifications.marketing}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  notifications: {
                    ...preferences.notifications,
                    marketing: e.target.checked,
                  },
                })
              }
              className="form-checkbox h-5 w-5 text-blue-500 rounded border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-white/10 focus:ring-blue-500"
            />
          </label>
        </div>
      </div>

      <Button
        onClick={handlePreferencesUpdate}
        disabled={loading}
        className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-medium px-6 py-3"
      >
        {loading ? "Saving..." : "Save Preferences"}
      </Button>
    </div>
  </motion.div>
);

// Account Tab component
const AccountTab = ({
  setShowDeleteModal,
  isDemoMode,
}: {
  setShowDeleteModal: (value: boolean) => void;
  isDemoMode: boolean;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-6"
  >
    <div className="bg-red-900/20 backdrop-blur-sm border border-red-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h3>
      {isDemoMode ? (
        <div>
          <p className="text-gray-300 mb-4">
            Account deletion is not available in demo mode. Sign up for a real
            account to manage account settings.
          </p>
          <Button
            disabled
            className="bg-gray-600 text-gray-400 font-medium px-6 py-3 cursor-not-allowed"
          >
            Delete Account (Demo Mode)
          </Button>
        </div>
      ) : (
        <div>
          <p className="text-gray-300 mb-4">
            Once you delete your account, there is no going back. Please be
            certain.
          </p>
          <Button
            onClick={() => setShowDeleteModal(true)}
            className="bg-red-600 hover:bg-red-700 text-white font-medium px-6 py-3"
          >
            Delete Account
          </Button>
        </div>
      )}
    </div>
  </motion.div>
);

// Helper function to clear corrupted authentication data
const clearAuthData = () => {
  if (typeof window !== "undefined") {
    // Clear any remaining localStorage items (legacy cleanup)
    localStorage.removeItem("userToken");
    localStorage.removeItem("firebase-token");
    logger.auth("Cleared corrupted authentication data");
  }
};

// Helper function to get fresh authentication token
const getFreshAuthToken = async (): Promise<string | null> => {
  try {
    const { getAuth } = await import("firebase/auth");
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      logger.auth("No Firebase user found");
      return null;
    }

    // Get fresh Firebase token
    const firebaseToken = await user.getIdToken(true);
    logger.auth("Got fresh Firebase token");

    // Exchange for backend JWT
    const response = await fetch("/api/auth/firebase-exchange", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ firebaseToken }),
    });

    logger.auth("Firebase token exchange response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      logger.auth("Token exchange failed:", response.status, errorText);
      return null;
    }

    const data = await response.json();
    logger.auth("Token exchange response:", data);

    if (data.success && data.token) {
      return data.token;
    } else {
      logger.auth("Token exchange successful but no token in response");
      return null;
    }
  } catch (error) {
    logger.auth("Error getting fresh auth token:", error);
    return null;
  }
};

function SettingsPage() {
  const { user, refreshUserProfile } = useAuth(); // Use Firebase authentication and get refreshUserProfile
  const { theme, setTheme } = useTheme(); // Get theme and setTheme from theme provider
  const { currency, setCurrency } = useAppContext();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab["id"]>("profile");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Check if user is in demo mode
  const isDemoMode =
    typeof window !== "undefined" &&
    localStorage.getItem("demo-mode") === "true";

  // Use Firebase user data or demo user data with enhanced Google profile extraction
  const currentUser = useMemo(() => {
    if (user) {
      return {
        id: user.id,
        name:
          user.displayName || user.name || user.email?.split("@")[0] || "User",
        email: user.email || "",
        phone: "", // Will be loaded from userProfile if available
        photoURL: "", // Will be loaded from userProfile if available
      };
    } else if (isDemoMode) {
      return {
        id: "demo-user-id",
        name: "Demo User",
        email: "demo@profolio.com",
        phone: "+1 (555) 123-4567",
        location: "San Francisco, CA",
      };
    }
    return null;
  }, [user, isDemoMode]);

  // Profile form state - start with empty values
  const [profileData, setProfileData] = useState(() => ({
    name: "",
    email: "",
    phone: "",
    bio: "",
    location: "",
  }));

  // Track loading state for profile data
  const [profileLoading, setProfileLoading] = useState(true);

  // Load profile data from database when component mounts
  useEffect(() => {
    const loadProfileFromDatabase = async () => {
      if (!currentUser?.id) {
        setProfileLoading(false);
        return;
      }

      try {
        logger.auth("Loading profile from database for user:", currentUser.id);

        if (isDemoMode) {
          // For demo mode, load from localStorage
          const storedUserData = localStorage.getItem("user-data");
          if (storedUserData) {
            const parsedData = JSON.parse(storedUserData);
            setProfileData({
              name: parsedData.name || currentUser.name || "",
              email: parsedData.email || currentUser.email || "",
              phone: parsedData.phone || "",
              bio: parsedData.bio || "",
              location: parsedData.location || "",
            });
          } else {
            // Use current user data as fallback
            setProfileData({
              name: currentUser.name || "",
              email: currentUser.email || "",
              phone: "",
              bio: "",
              location: "",
            });
          }
        } else {
          // Handle real user - use the backend API endpoint
          logger.auth("Starting profile load...");

          // Clear any corrupted authentication data first
          clearAuthData();

          // Get fresh authentication token
          const backendToken = await getFreshAuthToken();

          if (!backendToken) {
            throw new Error(
              "Failed to obtain authentication token. Please sign out and sign in again."
            );
          }

          const response = await fetch("/api/auth/profile", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${backendToken}`,
            },
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
              errorData.message ||
                `HTTP ${response.status}: ${response.statusText}`
            );
          }

          const data = await response.json();

          if (data.success && data.user) {
            logger.auth("Profile loaded from database:", data.user);
            setProfileData({
              name: data.user.name || currentUser.name || "",
              email: data.user.email || currentUser.email || "",
              phone: data.user.phone || "",
              bio: data.user.bio || "",
              location: data.user.location || "",
            });
          } else {
            // No profile in database yet, use auth data as initial values
            logger.auth("No profile in database, using auth data");
            setProfileData({
              name: currentUser.name || "",
              email: currentUser.email || "",
              phone: "",
              bio: "",
              location: "",
            });
          }
        }
      } catch (error) {
        logger.auth("Failed to load profile from database:", error);
        // Fallback to auth data
        setProfileData({
          name: currentUser.name || "",
          email: currentUser.email || "",
          phone: "",
          bio: "",
          location: "",
        });
      } finally {
        setProfileLoading(false);
      }
    };

    loadProfileFromDatabase();
  }, [
    currentUser?.id,
    currentUser?.email,
    currentUser?.name,
    isDemoMode,
    user,
  ]);

  // Preferences state
  const [preferences, setPreferences] = useState<PreferencesType>({
    theme: theme as "light" | "dark" | "system",
    currency: currency,
    language: "en",
    notifications: {
      email: true,
      push: true,
      marketing: false,
    },
    privacy: {
      profileVisible: true,
      dataSharing: false,
    },
  });

  // Update preferences when global context changes
  useEffect(() => {
    setPreferences((prev) => ({
      ...prev,
      theme: theme as "light" | "dark" | "system",
      currency: currency,
    }));
  }, [theme, currency]);

  // Clear notifications after delay
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!currentUser?.id) {
        throw new Error("User not authenticated");
      }

      logger.auth(
        "Updating profile for:",
        currentUser.id,
        "isDemoMode:",
        isDemoMode
      );

      if (isDemoMode) {
        // Handle demo mode - store in localStorage
        const demoUserData = {
          id: "demo-user-id",
          name: profileData.name,
          email: profileData.email,
          phone: profileData.phone,
          lastUpdated: Date.now(),
        };

        localStorage.setItem("user-data", JSON.stringify(demoUserData));
        logger.auth("Demo profile saved to localStorage:", profileData.name);

        setSuccess("Profile updated successfully!");

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        // Handle real user - use the backend API endpoint
        logger.auth("Starting profile update...");

        // Clear any corrupted authentication data first
        clearAuthData();

        // Get fresh authentication token
        const backendToken = await getFreshAuthToken();

        if (!backendToken) {
          throw new Error(
            "Failed to obtain authentication token. Please sign out and sign in again."
          );
        }

        const response = await fetch("/api/auth/profile", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${backendToken}`,
          },
          body: JSON.stringify({
            name: profileData.name,
            email: profileData.email,
            phone: profileData.phone,
            bio: profileData.bio,
            location: profileData.location,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message ||
              `HTTP ${response.status}: ${response.statusText}`
          );
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message || "Failed to update profile");
        }

        logger.auth("Profile saved, refreshing...");

        setSuccess("Profile updated successfully!");

        // Refresh the user profile in auth context to update header/dashboard
        if (refreshUserProfile) {
          logger.auth("Waiting for profile refresh to complete...");
          await refreshUserProfile();
          logger.auth("Profile refresh completed");

          // Small delay for state propagation, then navigate
          setTimeout(() => {
            logger.auth("Navigating to dashboard with updated state");
            router.push("/app/dashboard?updated=profile");
          }, 1000); // Reduced delay since we fixed the auth race condition
        } else {
          // Fallback: if no refresh function, just redirect
          setTimeout(() => {
            router.push("/app/dashboard?updated=profile");
          }, 1500);
        }
      }
    } catch (error) {
      logger.auth("Profile update error:", error);
      setError(
        error instanceof Error ? error.message : "Failed to update profile"
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (data: {
    currentPassword?: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!currentUser?.id) {
        throw new Error("User not authenticated");
      }

      // Validate passwords match
      if (data.newPassword !== data.confirmPassword) {
        throw new Error("Passwords do not match");
      }

      if (isDemoMode) {
        // For demo mode, just show success
        setSuccess("Password updated successfully (demo mode)");
        return;
      }

      // Get fresh authentication token
      const backendToken = await getFreshAuthToken();

      if (!backendToken) {
        throw new Error(
          "Failed to obtain authentication token. Please sign out and sign in again."
        );
      }

      // Call the password change API
      const response = await fetch("/api/auth/password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${backendToken}`,
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const responseData = await response.json();

      if (!responseData.success) {
        throw new Error(responseData.message || "Failed to update password");
      }

      logger.auth("Password updated successfully");
      setSuccess(responseData.message || "Password updated successfully");
    } catch (err) {
      logger.auth("Password update error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to update password"
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesUpdate = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Update theme setting - this was missing!
      setTheme(preferences.theme);

      // Update global currency setting
      await setCurrency(preferences.currency);

      // Simulate API call for other preferences (notifications, privacy, etc.)
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSuccess("Preferences updated successfully");
    } catch (err) {
      logger.auth("Preferences update error:", err);
      setError("Failed to update preferences");
    } finally {
      setLoading(false);
    }
  };

  const handleAccountDeletion = async () => {
    // Prevent account deletion in demo mode
    if (isDemoMode) {
      setError(
        "Account deletion is not available in demo mode. Please sign up for a real account to manage account settings."
      );
      setShowDeleteModal(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // For real users, call the account deletion API
      const backendToken = await getFreshAuthToken();

      if (!backendToken) {
        throw new Error("Authentication required to delete account");
      }

      const response = await fetch("/api/auth/delete-account", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${backendToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete account");
      }

      // Account deleted successfully - redirect to homepage
      window.location.href = "/";
    } catch (err) {
      logger.auth("Account deletion error:", err);
      setError(err instanceof Error ? err.message : "Failed to delete account");
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  // Show loading if no user data is available or profile data is still loading
  if (!currentUser) {
    return <SettingsSkeleton />;
  }

  return (
    <div className="min-h-screen text-gray-900 dark:text-white">
      <div className="relative z-10 p-4 md:p-6 max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your account and preferences
          </p>
        </motion.div>

        {/* Notifications */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-red-900/20 backdrop-blur-sm border border-red-800 rounded-xl p-4 mb-6"
            >
              <p className="text-red-400 flex items-center">
                <i className="fas fa-exclamation-circle mr-2"></i>
                {error}
              </p>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-green-900/20 backdrop-blur-sm border border-green-800 rounded-xl p-4 mb-6"
            >
              <p className="text-green-400 flex items-center">
                <i className="fas fa-check-circle mr-2"></i>
                {success}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                  : "hover:bg-white/10"
              }`}
            >
              <i className={`fas ${tab.icon} mr-2`} />
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-gray-50 dark:bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-white/10">
          <AnimatePresence mode="wait">
            {activeTab === "profile" && (
              <ProfileTab
                key="profile"
                profileData={profileData}
                setProfileData={setProfileData}
                profileLoading={profileLoading}
                handleProfileUpdate={handleProfileUpdate}
                loading={loading}
                isDemoMode={isDemoMode}
              />
            )}
            {activeTab === "security" && (
              <SecurityTab
                key="security"
                handlePasswordUpdate={handlePasswordUpdate}
                loading={loading}
                userProfile={currentUser}
                isDemoMode={isDemoMode}
              />
            )}
            {activeTab === "preferences" && (
              <PreferencesTab
                key="preferences"
                preferences={preferences}
                setPreferences={setPreferences}
                handlePreferencesUpdate={handlePreferencesUpdate}
                loading={loading}
              />
            )}
            {activeTab === "account" && (
              <AccountTab
                key="account"
                setShowDeleteModal={setShowDeleteModal}
                isDemoMode={isDemoMode}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <BaseModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
        >
          <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 rounded-2xl p-8 w-full max-w-md border border-gray-200 dark:border-white/10 shadow-2xl">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-100 mb-4">
                <i className="fas fa-exclamation-triangle text-red-600 text-xl"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Delete Account
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to delete your account? This action cannot
                be undone.
              </p>
              <div className="flex space-x-4">
                <Button
                  onClick={() => setShowDeleteModal(false)}
                  variant="ghost"
                  className="flex-1 hover:bg-gray-100 dark:hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAccountDeletion}
                  disabled={loading}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  {loading ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          </div>
        </BaseModal>
      )}
    </div>
  );
}

export default SettingsPage;
