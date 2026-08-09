import React, { useState, useEffect } from "react";
import { RadixButton as Button } from '@/components/ui/button';
import { 
  EnhancedGlassModal, 
  EnhancedGlassModalContent,
  EnhancedGlassModalHeader,
  EnhancedGlassModalBody
} from "@/components/ui/enhanced-glass/EnhancedGlassModal";

interface GooglePlacesApiKeyModalProps {
  onClose: () => void;
  onApiKeyUpdated?: () => void;
}

export function GooglePlacesApiKeyModal({
  onClose,
  onApiKeyUpdated,
}: GooglePlacesApiKeyModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);

  // Load existing API key on mount
  useEffect(() => {
    const storedKey = localStorage.getItem("google_places_api_key");
    if (storedKey) {
      setApiKey(storedKey);
    }
  }, []);

  // Handle API key save
  const handleSaveKey = () => {
    if (!apiKey.trim()) {
      alert("Please enter an API key");
      return;
    }

    // Store the API key
    localStorage.setItem("google_places_api_key", apiKey.trim());

    // Notify parent component
    if (onApiKeyUpdated) {
      onApiKeyUpdated();
    }

    // Close modal
    onClose();
  };

  // Handle API key removal
  const handleRemoveKey = () => {
    if (
      confirm(
        "Are you sure you want to remove your Google Places API key? Address search will fall back to OpenStreetMap."
      )
    ) {
      localStorage.removeItem("google_places_api_key");
      setApiKey("");

      if (onApiKeyUpdated) {
        onApiKeyUpdated();
      }
    }
  };

  // Check if we have a stored key
  const hasStoredKey = localStorage.getItem("google_places_api_key");

  return (
    <EnhancedGlassModal isOpen={true} onClose={onClose} size="lg">
      <EnhancedGlassModalContent>
        <EnhancedGlassModalHeader 
          title="Google Places API Key" 
          onClose={onClose}
        />

        <EnhancedGlassModalBody>
        {/* Info Section */}
        <div className="bg-blue-500/10 backdrop-blur-sm border border-blue-500/20 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center">
            <i className="fas fa-info-circle mr-2"></i>
            Enhanced Address Search
          </h4>
          <p className="text-sm text-blue-700 dark:text-blue-400 mb-3">
            Adding a Google Places API key provides more accurate address
            suggestions and auto-completion. Without it, the app uses
            OpenStreetMap (which still works, just less accurate).
          </p>
          <div className="flex items-center justify-between text-xs">
            <span className="text-blue-600 dark:text-blue-400">
              ✅ 1,000 FREE searches per month
            </span>
            <a
              href="https://console.cloud.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Get API Key →
            </a>
          </div>
        </div>

        {/* API Key Input */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Google Places API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 pr-12 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200"
                placeholder="AIzaSyC_your_api_key_here..."
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <i
                  className={`fas ${showApiKey ? "fa-eye-slash" : "fa-eye"}`}
                ></i>
              </button>
            </div>
          </div>

          {/* Info about validation */}
          <div className="bg-green-500/10 backdrop-blur-sm border border-green-500/20 rounded-lg p-3">
            <p className="text-sm text-green-700 dark:text-green-300 flex items-start">
              <i className="fas fa-info-circle mr-2 mt-0.5 flex-shrink-0"></i>
              <span>
                Your API key will be validated automatically when you use
                address search. If there are any issues, the app will fall back
                to OpenStreetMap.
              </span>
            </p>
          </div>

          {/* Setup Instructions */}
          <div className="bg-white/5 dark:bg-black/10 backdrop-blur-sm rounded-lg p-4">
            <h5 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
              <i className="fas fa-list-ol mr-2 text-gray-500"></i>
              Quick Setup Guide
            </h5>
            <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-4">
              <li className="list-decimal">
                Visit{" "}
                <a
                  href="https://console.cloud.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Google Cloud Console
                </a>
              </li>
              <li className="list-decimal">
                Create a project and enable <strong>Places API</strong>
              </li>
              <li className="list-decimal">
                Create an <strong>API Key</strong> and restrict it to Places
                APIs
              </li>
              <li className="list-decimal">
                Add domain restrictions:{" "}
                <code className="bg-white/10 dark:bg-black/20 px-1 rounded">
                  localhost:3000/*
                </code>
              </li>
              <li className="list-decimal">Paste the key above and save it</li>
            </ol>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            onClick={handleSaveKey}
            disabled={!apiKey.trim()}
            className="flex-1 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white flex items-center justify-center"
          >
            <i className="fas fa-save mr-2"></i>
            Save & Use
          </Button>

          {hasStoredKey && (
            <Button
              type="button"
              onClick={handleRemoveKey}
              variant="ghost"
              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <i className="fas fa-trash mr-2"></i>
              Remove
            </Button>
          )}
        </div>

        {/* Current Status */}
        {hasStoredKey && (
          <div className="mt-4 p-3 bg-green-500/10 backdrop-blur-sm border border-green-500/20 rounded-lg">
            <p className="text-sm text-green-700 dark:text-green-300 flex items-center">
              <i className="fas fa-check-circle mr-2"></i>
              Google Places API is currently active for enhanced address search
            </p>
          </div>
        )}
        </EnhancedGlassModalBody>
      </EnhancedGlassModalContent>
    </EnhancedGlassModal>
  );
}
