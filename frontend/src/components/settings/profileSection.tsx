"use client";

import React, { useState } from "react";
import Image from "next/image";
import { PreferencesData } from "@/types/settings";

interface ProfileSectionProps {
    user?: {
      name?: string;
      avatarUrl?: string;
    };
    loading?: boolean;
    userPreferences?: PreferencesData | null;
    onSubmit?: (data: {
      displayName: string;
      theme: "light" | "dark" | "system";
      locale: string;
      currency: string;
    }) => void;
    onPreferencesSubmit?: (preferencesData: PreferencesData) => void;
    onDelete?: () => void;
  }

export default function ProfileSection({
  user,
  loading = false,
  onSubmit,
}: ProfileSectionProps) {
  const [displayName, setDisplayName] = useState(user?.name || "");
  const [theme, setTheme] = useState<"light" | "dark" | "system">("dark");
  const [locale, setLocale] = useState("en-GB");
  const [currency, setCurrency] = useState("GBP");

  const handleSave = () => {
    if (onSubmit) {
      onSubmit({ displayName, theme, locale, currency });
    }
  };

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-semibold">Profile & Preferences</h2>

      <div className="flex items-center space-x-4">
        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-xl font-bold">
          {user?.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt="Profile"
              width={64}
              height={64}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            displayName?.charAt(0).toUpperCase() || "U"
          )}
        </div>
        <div>
          <label className="block text-sm mb-1">Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none"
            placeholder="Enter your name"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm mb-1">Theme</label>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as "light" | "dark" | "system")}
            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1">Locale</label>
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          >
            <option value="en-GB">English (UK)</option>
            <option value="en-US">English (US)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1">Currency</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          >
            <option value="GBP">GBP £</option>
            <option value="USD">USD $</option>
            <option value="EUR">EUR €</option>
          </select>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={loading}
        className="px-4 py-2 mt-2 rounded-md bg-green-500 text-black font-medium hover:bg-green-400 disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save Preferences"}
      </button>
    </section>
  );
}