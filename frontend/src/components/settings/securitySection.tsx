"use client";

import React, { useState } from "react";

interface SecuritySectionProps {
  email: string;
  loading?: boolean;
  onChangePassword?: (oldPassword: string, newPassword: string) => void;
  onToggle2FA?: (enabled: boolean) => void;
}

export default function SecuritySection({
  email,
  loading = false,
  onChangePassword,
  onToggle2FA,
}: SecuritySectionProps) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);

  const handlePasswordChange = () => {
    if (newPassword !== confirmPassword) return alert("Passwords do not match.");
    if (onChangePassword) onChangePassword(oldPassword, newPassword);
  };

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-semibold">Security</h2>

      <div>
        <label className="block text-sm mb-1">Email Address</label>
        <input
          type="email"
          value={email}
          readOnly
          className="w-full rounded-md border border-white/10 bg-white/10 px-3 py-2 text-sm text-white opacity-60"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm mb-1">Current Password</label>
          <input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          />
        </div>
      </div>

      <button
        onClick={handlePasswordChange}
        disabled={loading}
        className="px-4 py-2 mt-2 rounded-md bg-green-500 text-black font-medium hover:bg-green-400 disabled:opacity-50"
      >
        {loading ? "Saving..." : "Change Password"}
      </button>

      <div className="flex items-center justify-between mt-6">
        <span className="text-sm">Enable Two-Factor Authentication (2FA)</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={twoFAEnabled}
            onChange={() => {
              const newVal = !twoFAEnabled;
              setTwoFAEnabled(newVal);
              if (onToggle2FA) onToggle2FA(newVal);
            }}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:bg-green-500 transition-all"></div>
          <span className="ml-3 text-sm text-white/80">
            {twoFAEnabled ? "Enabled" : "Disabled"}
          </span>
        </label>
      </div>
    </section>
  );
}