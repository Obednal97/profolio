import { HeaderLayout } from "@/components/layout/headerLayout";
import { FooterLayout } from "@/components/layout/footerLayout";
import React, { useState, useEffect } from "react";
import { useUser } from "@/lib/user";
import ProfileSection from "@/components/settings/profileSection";
import SecuritySection from "@/components/settings/securitySection";
import TaxSection from "@/components/settings/taxSection";
import { BaseModal as Modal } from "@/components/modals/modal";
import type {
  ProfileData,
  PasswordData,
  PreferencesData,
  TaxData,
} from "@/types/settings";

type Tab = { id: "profile" | "security" | "tax"; label: string; icon: string };
const tabs: Tab[] = [
  { id: "profile", label: "Profile & Preferences", icon: "fa-user-cog" },
  { id: "security", label: "Security", icon: "fa-lock" },
  { id: "tax", label: "Taxes & Income", icon: "fa-file-invoice-dollar" },
];

function SettingsPage() {
  // Logic and rendering copied from MainComponent
  const { data: user } = useUser();
  const [activeTab, setActiveTab] = useState("profile");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [userPreferences, setUserPreferences] = useState<PreferencesData | null>(null);

  // Fetch user preferences on mount
  useEffect(() => {
    const fetchPreferences = async () => {
      if (!user) return;
      try {
        const response = await fetch("/api/user/preferences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            method: "GET",
            userId: user.id,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch preferences");
        }

        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }

        setUserPreferences(data);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An unknown error occurred";
        console.error("Error fetching preferences:", err);
        setError(errorMessage || "Failed to load preferences");
      }
    };

    fetchPreferences();
  }, [user]);

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

  const handleProfileUpdate = async (profileData: ProfileData) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "UPDATE",
          userId: user.id,
          ...profileData,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to update profile");
      }

      setSuccess("Profile updated successfully");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      console.error("Profile update error:", err);
      setError(errorMessage || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (passwordData: PasswordData) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch("/api/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "UPDATE",
          userId: user.id,
          ...passwordData,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update password");
      }

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setSuccess("Password updated successfully");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      console.error("Password update error:", err);
      setError(errorMessage || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesUpdate = async (preferencesData: PreferencesData) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch("/api/user/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "UPDATE",
          userId: user.id,
          ...preferencesData,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to update preferences");
      }

      setUserPreferences(data);
      setSuccess("Preferences updated successfully");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      console.error("Preferences update error:", err);
      setError(errorMessage || "Failed to update preferences");
    } finally {
      setLoading(false);
    }
  };

  const handleTaxInfoUpdate = async (taxData: TaxData) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch("/api/user/tax", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "UPDATE",
          userId: user.id,
          ...taxData,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update tax information");
      }

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setSuccess("Tax information updated successfully");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      console.error("Tax info update error:", err);
      setError(errorMessage || "Failed to update tax information");
    } finally {
      setLoading(false);
    }
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleAccountDeletion = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/user/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "DELETE",
          userId: user.id,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to delete account");
      }
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      window.location.href = "/";
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      console.error("Account deletion error:", err);
      setError(errorMessage || "Failed to delete account");
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
    }
  };
}

export default SettingsPage;