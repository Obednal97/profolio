"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { useAppContext } from "@/components/layout/layoutWrapper";
import { BaseModal as Modal } from "@/components/modals/modal";
import { Button } from "@/components/ui/button/button";
import { motion, AnimatePresence } from "framer-motion";

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

function SettingsPage() {
  const { user } = useAuth(); // Use Firebase authentication
  const { theme, currency, setCurrency } = useAppContext();
  const [activeTab, setActiveTab] = useState<Tab["id"]>("profile");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Check if user is in demo mode
  const isDemoMode = typeof window !== 'undefined' && localStorage.getItem('demo-mode') === 'true';
  
  // Use Firebase user data or demo user data with enhanced Google profile extraction
  const currentUser = useMemo(() => {
    if (user) {
      return {
        id: user.uid,
        name: user.displayName || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        phone: user.phoneNumber || '',
        photoURL: user.photoURL || '',
      };
    } else if (isDemoMode) {
      return {
        id: 'demo-user-id',
        name: 'Demo User',
        email: 'demo@profolio.com',
        phone: '+1 (555) 123-4567',
        location: 'San Francisco, CA'
      };
    }
    return null;
  }, [user?.uid, user?.displayName, user?.email, user?.phoneNumber, user?.photoURL, isDemoMode]);

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
        console.log('Loading profile from database for user:', currentUser.id);
        
        const { apiCall } = await import('@/lib/mockApi');
        const response = await apiCall('/api/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            method: 'GET_PROFILE_FROM_STORAGE',
            userId: currentUser.id
          }),
        });
        
        const data = await response.json();
        
        if (data.user && !data.error) {
          console.log('Profile loaded from database:', data.user);
          setProfileData({
            name: data.user.name || currentUser.name || '',
            email: data.user.email || currentUser.email || '',
            phone: data.user.phone || '',
            bio: data.user.bio || '',
            location: data.user.location || '',
          });
        } else {
          // No profile in database yet, use auth data as initial values
          console.log('No profile in database, using auth data');
          setProfileData({
            name: currentUser.name || '',
            email: currentUser.email || '',
            phone: currentUser.phone || '',
            bio: '',
            location: '',
          });
        }
      } catch (error) {
        console.error('Failed to load profile from database:', error);
        // Fallback to auth data
        setProfileData({
          name: currentUser.name || '',
          email: currentUser.email || '',
          phone: currentUser.phone || '',
          bio: '',
          location: '',
        });
      } finally {
        setProfileLoading(false);
      }
    };

    loadProfileFromDatabase();
  }, [currentUser?.id]); // Only depend on user ID

  // Preferences state
  const [preferences, setPreferences] = useState({
    theme: theme as 'light' | 'dark' | 'system',
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
    setPreferences(prev => ({
      ...prev,
      theme: theme as 'light' | 'dark' | 'system',
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
        throw new Error('User not authenticated');
      }

      // Save profile data to our API
      const { apiCall } = await import('@/lib/mockApi');
      const response = await apiCall('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          method: 'UPDATE_PROFILE',
          userId: currentUser.id,
          profileData: {
            ...profileData,
            lastUpdated: Date.now(),
          }
        }),
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setSuccess("Profile updated successfully");
    } catch (err) {
      console.error("Profile update error:", err);
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess("Password updated successfully");
    } catch (err) {
      console.error("Password update error:", err);
      setError("Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesUpdate = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Update global currency setting
      await setCurrency(preferences.currency);
      
      // Simulate API call for other preferences
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess("Preferences updated successfully");
    } catch (err) {
      console.error("Preferences update error:", err);
      setError("Failed to update preferences");
    } finally {
      setLoading(false);
    }
  };

  const handleAccountDeletion = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      window.location.href = "/";
    } catch (err) {
      console.error("Account deletion error:", err);
      setError("Failed to delete account");
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  const ProfileTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {profileLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
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
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                className="w-full bg-gray-50 dark:bg-white/5 backdrop-blur-sm border border-gray-300 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500/50 focus:bg-white dark:focus:bg-white/10 transition-all duration-200"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
                {!isDemoMode && <span className="text-gray-500 text-xs ml-2">(cannot be changed)</span>}
              </label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                disabled={!isDemoMode}
                className={`w-full backdrop-blur-sm border rounded-xl px-4 py-3 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none transition-all duration-200 ${
                  !isDemoMode 
                    ? 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : 'bg-gray-50 dark:bg-white/5 border-gray-300 dark:border-white/10 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-500/50 focus:bg-white dark:focus:bg-white/10'
                }`}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number <span className="text-gray-500 text-xs">(optional)</span>
              </label>
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
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
                onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
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
              onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
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

  const SecurityTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <form onSubmit={handlePasswordUpdate} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Current Password
          </label>
          <input
            type="password"
            className="w-full bg-gray-50 dark:bg-white/5 backdrop-blur-sm border border-gray-300 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500/50 focus:bg-white dark:focus:bg-white/10 transition-all duration-200"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            New Password
          </label>
          <input
            type="password"
            className="w-full bg-gray-50 dark:bg-white/5 backdrop-blur-sm border border-gray-300 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500/50 focus:bg-white dark:focus:bg-white/10 transition-all duration-200"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Confirm New Password
          </label>
          <input
            type="password"
            className="w-full bg-gray-50 dark:bg-white/5 backdrop-blur-sm border border-gray-300 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500/50 focus:bg-white dark:focus:bg-white/10 transition-all duration-200"
            required
          />
        </div>
        
        <Button
          type="submit"
          disabled={loading}
          className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-medium px-6 py-3"
        >
          {loading ? "Updating..." : "Update Password"}
        </Button>
      </form>
      
      <div className="border-t border-gray-200 dark:border-white/10 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Two-Factor Authentication</h3>
        <div className="bg-gray-50 dark:bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-900 dark:text-white font-medium">Authenticator App</p>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Use an authenticator app to generate codes</p>
            </div>
            <Button variant="ghost" className="text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10">
              Enable
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const PreferencesTab = () => (
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
            onChange={(e) => setPreferences({ ...preferences, theme: e.target.value as 'light' | 'dark' | 'system' })}
            className="w-full bg-gray-50 dark:bg-white/5 backdrop-blur-sm border border-gray-300 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-500/50 focus:bg-white dark:focus:bg-white/10 transition-all duration-200"
          >
            <option value="light" className="bg-white dark:bg-gray-800">Light</option>
            <option value="dark" className="bg-white dark:bg-gray-800">Dark</option>
            <option value="system" className="bg-white dark:bg-gray-800">System</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Currency
          </label>
          <select
            value={preferences.currency}
            onChange={(e) => setPreferences({ ...preferences, currency: e.target.value })}
            className="w-full bg-gray-50 dark:bg-white/5 backdrop-blur-sm border border-gray-300 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-500/50 focus:bg-white dark:focus:bg-white/10 transition-all duration-200"
          >
            <option value="USD" className="bg-white dark:bg-gray-800">USD ($)</option>
            <option value="EUR" className="bg-white dark:bg-gray-800">EUR (€)</option>
            <option value="GBP" className="bg-white dark:bg-gray-800">GBP (£)</option>
            <option value="JPY" className="bg-white dark:bg-gray-800">JPY (¥)</option>
          </select>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
          
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Email Notifications</span>
              <input
                type="checkbox"
                checked={preferences.notifications.email}
                onChange={(e) => setPreferences({
                  ...preferences,
                  notifications: { ...preferences.notifications, email: e.target.checked }
                })}
                className="form-checkbox h-5 w-5 text-blue-500 rounded border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-white/10 focus:ring-blue-500"
              />
            </label>
            
            <label className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Push Notifications</span>
              <input
                type="checkbox"
                checked={preferences.notifications.push}
                onChange={(e) => setPreferences({
                  ...preferences,
                  notifications: { ...preferences.notifications, push: e.target.checked }
                })}
                className="form-checkbox h-5 w-5 text-blue-500 rounded border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-white/10 focus:ring-blue-500"
              />
            </label>
            
            <label className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Marketing Emails</span>
              <input
                type="checkbox"
                checked={preferences.notifications.marketing}
                onChange={(e) => setPreferences({
                  ...preferences,
                  notifications: { ...preferences.notifications, marketing: e.target.checked }
                })}
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

  const AccountTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="bg-red-900/20 backdrop-blur-sm border border-red-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h3>
        <p className="text-gray-300 mb-4">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <Button
          onClick={() => setShowDeleteModal(true)}
          className="bg-red-600 hover:bg-red-700 text-white font-medium px-6 py-3"
        >
          Delete Account
        </Button>
      </div>
    </motion.div>
  );

  // Show loading if no user data is available or profile data is still loading
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
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
          <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your account and preferences</p>
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
              variant={activeTab === tab.id ? 'default' : 'ghost'}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center transition-all duration-200 ${
                activeTab === tab.id 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg' 
                  : 'hover:bg-white/10'
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
            {activeTab === 'profile' && <ProfileTab key="profile" />}
            {activeTab === 'security' && <SecurityTab key="security" />}
            {activeTab === 'preferences' && <PreferencesTab key="preferences" />}
            {activeTab === 'account' && <AccountTab key="account" />}
          </AnimatePresence>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
          <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 rounded-2xl p-8 w-full max-w-md border border-gray-200 dark:border-white/10 shadow-2xl">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-100 mb-4">
                <i className="fas fa-exclamation-triangle text-red-600 text-xl"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Delete Account</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to delete your account? This action cannot be undone.
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
        </Modal>
      )}
    </div>
  );
}

export default SettingsPage;