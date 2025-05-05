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


  if (user === null) {
    return (
      <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white">
        <></>
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-green-400 to-green-500 bg-clip-text text-transparent">
              Account Settings
            </h2>
            <p className="text-gray-600 dark:text-white/60 max-w-md mx-auto">
              Please sign in to manage your account settings.
            </p>
            <a
              href="/account/signin"
              className="inline-block px-6 py-3 bg-green-500 text-black rounded-xl font-medium hover:bg-green-400 shadow-[0_0_8px_#00ff88] hover:shadow-[0_0_12px_#00ff88] transition-all duration-200"
            >
              <i className="fas fa-sign-in-alt mr-2"></i>
              Sign In
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Notification component removed (unused)

  return (
    <HeaderLayout>
      <div className="min-h-screen bg-[#1a1a1a] text-white">
        <div className="p-4 md:p-6 max-w-3xl mx-auto">
          <h1 className="text-3xl font-semibold bg-gradient-to-r from-green-400 to-green-500 bg-clip-text text-transparent mb-8">
            Account Settings
          </h1>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
              <p className="text-red-400 flex items-center">
                <i className="fas fa-exclamation-circle mr-2"></i>
                {error}
              </p>
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6">
              <p className="text-green-400 flex items-center">
                <i className="fas fa-check-circle mr-2"></i>
                {success}
              </p>
            </div>
          )}

          <div className="bg-[#2a2a2a] rounded-xl border border-white/10">
            <div className="flex overflow-x-auto">
              {tabs.map((tab: Tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? "text-green-400 border-b-2 border-green-400"
                      : "text-white/60 hover:text-white/80"
                  }`}
                >
                  <i className={`fas ${tab.icon} mr-2`}></i>
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6">
              {activeTab === "profile" && (
                <>
                  <ProfileSection
                    user={user}
                    loading={loading}
                    onSubmit={(data) =>
                      handleProfileUpdate({
                        name: data.displayName,
                        email: user.email,
                      })
                    }
                    onPreferencesSubmit={handlePreferencesUpdate}
                    userPreferences={userPreferences}
                    onDelete={() => setShowDeleteModal(true)}
                  />
                </>
              )}
              {activeTab === "security" && (
                <SecuritySection
                  email={user.email}
                  loading={loading}
                  onChangePassword={(oldPassword, newPassword) =>
                    handlePasswordUpdate({
                      oldPassword,
                      newPassword,
                      confirmNewPassword: newPassword,
                    })
                  }
                  onToggle2FA={(enabled) => console.log("2FA toggled:", enabled)}
                />
              )}
              {activeTab === "tax" && (
                <TaxSection
                  loading={loading}
                  onSubmit={(data) =>
                    handleTaxInfoUpdate({
                      taxResidency: data.taxResidency,
                      salary: data.salary,
                      taxCode: data.taxCode,
                      pensionContribution: data.pensionContribution,
                      studentLoanStatus: data.studentLoanStatus,
                    })
                  }
                />
              )}
            </div>
          </div>
        </div>
      </div>
      <FooterLayout />
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirm Account Deletion"
        description="Are you sure you want to delete your account? This action cannot be undone."
        confirmText="Delete Account"
        confirmVariant="destructive"
        onConfirm={handleAccountDeletion}
      />
    </HeaderLayout>
  );
}

export default SettingsPage;