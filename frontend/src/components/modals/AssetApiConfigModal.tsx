import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { EnhancedGlassCard } from "@/components/ui/enhanced-glass/EnhancedGlassCard";
import { BaseModal } from "./modal";
import { FinancialCalculator } from "@/lib/financial";
import { useAuth } from "@/lib/unifiedAuth";
import { logger } from "@/lib/logger";

interface AssetApiConfigModalProps {
  onClose: () => void;
  onApiKeysUpdated?: () => void;
}

// Simple demo session token generation (local function)
function generateDemoSessionToken(): string {
  return `demo-${crypto
    .getRandomValues(new Uint8Array(16))
    .join("")}-${Date.now()}`;
}

// Secure demo session management
let demoSessionCache: { token: string; userId: string; email: string } | null =
  null;

async function getDemoSessionToken(): Promise<string | null> {
  if (!demoSessionCache) {
    try {
      demoSessionCache = {
        token: generateDemoSessionToken(),
        userId: "demo-user-id",
        email: "demo@profolio.com",
      };
    } catch (error) {
      console.error("Failed to create demo session:", error);
      return null;
    }
  }
  return demoSessionCache.token;
}

// Secure error message sanitization for production
function getPublicErrorMessage(error: {
  status?: number;
  details?: string;
  error?: string;
}): string {
  if (process.env.NODE_ENV === "development") {
    return error.details || error.error || "Unknown error";
  }

  // Production: Generic user-friendly messages
  if (
    error.status === 429 ||
    error.details?.includes("429") ||
    error.details?.includes("Too Many Requests")
  ) {
    return "Rate limit exceeded. Please wait a few minutes.";
  }
  if (
    error.status === 401 ||
    error.details?.includes("401") ||
    error.details?.includes("Unauthorized")
  ) {
    return "Invalid API credentials. Please check your API key.";
  }
  if (
    error.status === 403 ||
    error.details?.includes("403") ||
    error.details?.includes("Forbidden")
  ) {
    return "Access denied. Please verify your API permissions.";
  }
  return "Service temporarily unavailable. Please try again later.";
}

export function AssetApiConfigModal({
  onClose,
  onApiKeysUpdated,
}: AssetApiConfigModalProps) {
  const { token } = useAuth();
  const [apiKeys, setApiKeys] = useState({
    alphaVantage: "",
    coinGecko: "",
    polygon: "",
    trading212: "",
  });
  const [isTestingConnection, setIsTestingConnection] = useState<string | null>(
    null
  );
  const [connectionStatus, setConnectionStatus] = useState<
    Record<string, "success" | "error" | null>
  >({});

  // Use refs to track abort controllers and prevent race conditions
  const abortControllerRef = useRef<AbortController | null>(null);
  const testingControllerRef = useRef<AbortController | null>(null);

  // Check if user is in demo mode
  const isDemoMode =
    typeof window !== "undefined" &&
    localStorage.getItem("demo-mode") === "true";

  // Cleanup function to cancel ongoing requests
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (testingControllerRef.current) {
      testingControllerRef.current.abort();
      testingControllerRef.current = null;
    }
  }, []);

  // Load existing API keys with proper cleanup
  const loadApiKeys = useCallback(async () => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      if (isDemoMode) {
        // For demo mode, load from sessionStorage (secure for demo keys)
        const demoApiKeys = sessionStorage.getItem("demo-api-keys");
        if (demoApiKeys && !controller.signal.aborted) {
          const parsedKeys = JSON.parse(demoApiKeys);
          setApiKeys((prev) => ({ ...prev, ...parsedKeys }));
        }
        return;
      }

      // For real users, load from secure server storage
      const authToken =
        token || (isDemoMode ? await getDemoSessionToken() : null);
      if (!authToken) {
        logger.auth("No auth token available, skipping API key load");
        return;
      }

      const response = await fetch("/api/user/api-keys", {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      if (controller.signal.aborted) return;

      if (response.ok) {
        const data = await response.json();
        if (!controller.signal.aborted) {
          setApiKeys((prev) => ({ ...prev, ...data.apiKeys }));
        }
      } else {
        console.log("API keys not found, starting with empty keys");
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        // Request was aborted, this is expected
        return;
      }
      console.error("Error loading API keys:", error);
    }
  }, [isDemoMode, token]);

  // Load API keys on mount
  useEffect(() => {
    loadApiKeys();
    return cleanup;
  }, [loadApiKeys, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const testApiConnection = useCallback(
    async (provider: string, apiKey: string) => {
      if (!apiKey.trim()) return;

      // Cancel any ongoing test request
      if (testingControllerRef.current) {
        testingControllerRef.current.abort();
      }

      // Create new AbortController for this test
      const controller = new AbortController();
      testingControllerRef.current = controller;

      setIsTestingConnection(provider);
      setConnectionStatus((prev) => ({ ...prev, [provider]: null }));

      try {
        let isValid = false;
        const authToken =
          token || (isDemoMode ? await getDemoSessionToken() : null);

        switch (provider) {
          case "trading212":
            // Test Trading 212 API connection
            const response = await fetch("/api/trading212/test", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
              },
              body: JSON.stringify({ apiKey }),
              signal: controller.signal,
            });

            if (controller.signal.aborted) return;

            if (response.ok) {
              isValid = true;
            } else {
              const errorData = await response.json();

              // Use sanitized error messages for production
              const publicMessage = getPublicErrorMessage(errorData);

              // Handle specific Trading 212 errors with user-friendly messages
              if (
                errorData.details?.includes("429") ||
                errorData.details?.includes("Too Many Requests")
              ) {
                alert(
                  "⏱️ Trading 212 Rate Limit Exceeded\n\nYou've made too many API requests recently. Please wait a few minutes before testing again.\n\nTip: Trading 212 has strict rate limits to protect their servers."
                );
                setConnectionStatus((prev) => ({
                  ...prev,
                  [provider]: "error",
                }));
                return;
              } else if (
                errorData.details?.includes("401") ||
                errorData.details?.includes("Unauthorized")
              ) {
                alert(
                  "🔑 Invalid Trading 212 API Key\n\nPlease check that:\n• Your API key is correct\n• Your Trading 212 account has API access enabled\n• You're using the live Trading 212 API key (not demo/paper trading)"
                );
                setConnectionStatus((prev) => ({
                  ...prev,
                  [provider]: "error",
                }));
                return;
              } else if (
                errorData.details?.includes("403") ||
                errorData.details?.includes("Forbidden")
              ) {
                alert(
                  "🚫 Trading 212 API Access Denied\n\nYour API key doesn't have the required permissions. Please check your Trading 212 API settings."
                );
                setConnectionStatus((prev) => ({
                  ...prev,
                  [provider]: "error",
                }));
                return;
              } else {
                alert(
                  `❌ Trading 212 Connection Failed\n\n${publicMessage}\n\nPlease try again in a few minutes.`
                );
                setConnectionStatus((prev) => ({
                  ...prev,
                  [provider]: "error",
                }));
                return;
              }
            }
            break;

          case "alphaVantage":
            // Test Alpha Vantage API
            const avResponse = await fetch(
              `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=${apiKey}`,
              {
                signal: controller.signal,
              }
            );

            if (controller.signal.aborted) return;

            const avData = await avResponse.json();
            isValid = !avData["Error Message"] && !avData["Note"];
            break;

          case "coinGecko":
            // Test CoinGecko API (if they have a test endpoint)
            isValid = true; // CoinGecko often works without API key for basic requests
            break;

          case "polygon":
            // Test Polygon API
            const polygonResponse = await fetch(
              `https://api.polygon.io/v2/aggs/ticker/AAPL/prev?apikey=${apiKey}`,
              {
                signal: controller.signal,
              }
            );

            if (controller.signal.aborted) return;

            isValid = polygonResponse.ok;
            break;
        }

        if (!controller.signal.aborted) {
          setConnectionStatus((prev) => ({
            ...prev,
            [provider]: isValid ? "success" : "error",
          }));
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          // Request was aborted, this is expected
          return;
        }

        console.error(`Error testing ${provider} API:`, error);

        // Handle network errors
        if (error instanceof Error && error.message.includes("fetch")) {
          alert(
            `🌐 Network Error\n\nCouldn't connect to ${provider} API. Please check your internet connection and try again.`
          );
        } else {
          alert(
            `❌ ${provider} Test Failed\n\n${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }

        if (!controller.signal.aborted) {
          setConnectionStatus((prev) => ({ ...prev, [provider]: "error" }));
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsTestingConnection(null);
        }
      }
    },
    [token, isDemoMode]
  );

  const syncTrading212Data = useCallback(async () => {
    if (!apiKeys.trading212.trim()) {
      alert("Please enter your Trading 212 API key first");
      return;
    }

    // Cancel any ongoing test request
    if (testingControllerRef.current) {
      testingControllerRef.current.abort();
    }

    // Create new AbortController for this sync
    const controller = new AbortController();
    testingControllerRef.current = controller;

    try {
      setIsTestingConnection("trading212-sync");
      const authToken =
        token || (isDemoMode ? await getDemoSessionToken() : null);

      // Fetch Trading 212 portfolio data
      const response = await fetch("/api/trading212/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ apiKey: apiKeys.trading212 }),
        signal: controller.signal,
      });

      if (controller.signal.aborted) return;

      if (!response.ok) {
        const errorData = await response.json();

        // Use sanitized error messages for production
        const publicMessage = getPublicErrorMessage(errorData);

        // Handle specific Trading 212 errors with user-friendly messages
        if (
          errorData.details?.includes("429") ||
          errorData.details?.includes("Too Many Requests")
        ) {
          alert(
            "⏱️ Trading 212 Rate Limit Exceeded\n\nYou've made too many API requests recently. Trading 212 has strict rate limits.\n\nPlease wait 5-10 minutes before trying to sync again.\n\nTip: Once synced successfully, your portfolio data will be cached and you won't need to sync frequently."
          );
          return;
        } else if (
          errorData.details?.includes("401") ||
          errorData.details?.includes("Unauthorized")
        ) {
          alert(
            '🔑 Invalid Trading 212 API Key\n\nPlease check that:\n• Your API key is correct\n• Your Trading 212 account has API access enabled\n• You\'re using the live Trading 212 API key (not demo/paper trading)\n\nYou can test your API key first using the "Test" button.'
          );
          return;
        } else if (
          errorData.details?.includes("403") ||
          errorData.details?.includes("Forbidden")
        ) {
          alert(
            "🚫 Trading 212 API Access Denied\n\nYour API key doesn't have the required permissions for portfolio access.\n\nPlease check your Trading 212 API settings and ensure you have the necessary permissions."
          );
          return;
        } else {
          throw new Error(publicMessage);
        }
      }

      const data = await response.json();

      if (controller.signal.aborted) return;

      // Notify parent component to refresh assets
      if (onApiKeysUpdated) {
        onApiKeysUpdated();
      }

      // Show detailed success message
      const message = `✅ Successfully synced ${
        data.assetsCount
      } assets from Trading 212!
      
📊 Portfolio Summary:
• Total Value: ${FinancialCalculator.formatCurrency(data.totalValue)}
• Total P&L: ${
        data.totalPnL >= 0 ? "+" : ""
      }${FinancialCalculator.formatCurrency(
        data.totalPnL
      )} (${data.totalPnLPercentage.toFixed(2)}%)
• Cash Balance: ${FinancialCalculator.formatCurrency(data.cashBalance)}
• Positions: ${data.positionsCount}

🏆 Top Holdings:
${data.topHoldings
  .slice(0, 3)
  .map(
    (holding: { name: string; value: number; percentage: number }) =>
      `• ${holding.name}: ${FinancialCalculator.formatCurrency(
        holding.value
      )} (${holding.percentage.toFixed(1)}%)`
  )
  .join("\n")}

🕒 Synced at: ${new Date(data.syncedAt).toLocaleString()}

${
  isDemoMode
    ? "\n💡 Demo Mode: Your data is stored locally and will be cleared when you log out."
    : ""
}`;

      alert(message);
      onClose();
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        // Request was aborted, this is expected
        return;
      }

      console.error("Error syncing Trading 212 data:", error);

      // Handle network errors
      if (error instanceof Error && error.message.includes("fetch")) {
        alert(
          "🌐 Network Error\n\nCouldn't connect to Trading 212. Please check your internet connection and try again."
        );
      } else {
        alert(
          `❌ Trading 212 Sync Failed\n\n${
            error instanceof Error ? error.message : "Unknown error"
          }\n\nIf you\'re seeing rate limit errors, please wait a few minutes before trying again.`
        );
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsTestingConnection(null);
      }
    }
  }, [apiKeys.trading212, token, isDemoMode, onApiKeysUpdated, onClose]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Cancel any ongoing requests
      cleanup();

      try {
        if (isDemoMode) {
          // For demo mode, store in sessionStorage only (secure for demo keys)
          sessionStorage.setItem("demo-api-keys", JSON.stringify(apiKeys));
          alert(
            `Demo Mode: API keys saved locally in your browser session only!\n\nProviders stored: ${Object.keys(
              apiKeys
            )
              .filter((key) => apiKeys[key as keyof typeof apiKeys].trim())
              .join(
                ", "
              )}\n\nNote: These keys are only stored in your browser and will be cleared when you log out.`
          );
          onClose();
          return;
        }

        // For real users, save to secure server storage
        const authToken =
          token || (isDemoMode ? await getDemoSessionToken() : null);
        if (!authToken) {
          alert(
            "Authentication token not available. Please try logging in again."
          );
          return;
        }

        const response = await fetch("/api/user/api-keys", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ apiKeys }),
        });

        if (response.ok) {
          const data = await response.json();
          alert(
            `API keys saved securely! Providers stored: ${data.providersStored.join(
              ", "
            )}`
          );
          onClose();
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to save API keys");
        }
      } catch (error) {
        console.error("Error saving API keys:", error);
        alert(
          `Failed to save API keys: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
    [apiKeys, isDemoMode, token, onClose, cleanup]
  );

  const apiProviders = [
    {
      key: "alphaVantage",
      label: "Alpha Vantage API Key",
      description: "For stock market data",
      docsUrl: "https://www.alphavantage.co/documentation/",
      placeholder: "Enter your Alpha Vantage API key",
      icon: "fas fa-chart-line",
      color: "blue",
    },
    {
      key: "coinGecko",
      label: "CoinGecko API Key",
      description: "For cryptocurrency data",
      docsUrl: "https://www.coingecko.com/en/api/documentation",
      placeholder: "Enter your CoinGecko API key",
      icon: "fab fa-bitcoin",
      color: "orange",
    },
    {
      key: "polygon",
      label: "Polygon API Key",
      description: "For real-time market data",
      docsUrl: "https://polygon.io/docs",
      placeholder: "Enter your Polygon API key",
      icon: "fas fa-chart-bar",
      color: "purple",
    },
    {
      key: "trading212",
      label: "Trading 212 API Key",
      description: "For Trading 212 portfolio sync",
      docsUrl: "https://t212public-api-docs.redoc.ly/",
      placeholder: "Enter your Trading 212 API key",
      icon: "fas fa-building",
      color: "green",
    },
  ];

  return (
    <BaseModal isOpen={true} onClose={onClose}>
      <EnhancedGlassCard
        variant="prominent"
        padding="lg"
        hoverable={false}
        enableLensing={false}
        animate={false}
        className="w-full max-w-3xl max-h-[calc(100vh-8rem)] overflow-y-auto relative z-50"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent flex items-center">
              <i className="fas fa-cog mr-2 text-blue-500"></i>
              Asset API Configuration
            </h3>
            {isDemoMode && (
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                <i className="fas fa-info-circle mr-1"></i>
                Demo Mode: Keys stored locally in browser only
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <i className="fas fa-times text-lg"></i>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 p-6">
          {/* Info Section */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center">
              <i className="fas fa-info-circle mr-2"></i>
              Enhanced Asset Data
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              Connect your financial data providers to automatically sync
              portfolio data, get real-time prices, and access advanced market
              information.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
            id="api-keys-form"
          >
            {apiProviders.map((provider) => (
              <div
                key={provider.key}
                className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    <i
                      className={`${provider.icon} mr-2 text-${provider.color}-500`}
                    ></i>
                    {provider.label}
                  </label>
                  <a
                    href={provider.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-600 text-sm flex items-center gap-1 transition-colors"
                  >
                    <i className="fas fa-external-link-alt text-xs"></i>
                    View Docs
                  </a>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="password"
                      value={apiKeys[provider.key as keyof typeof apiKeys]}
                      onChange={(e) =>
                        setApiKeys({
                          ...apiKeys,
                          [provider.key]: e.target.value,
                        })
                      }
                      className="w-full bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg px-3 py-2 pr-10 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-all duration-200"
                      placeholder={provider.placeholder}
                    />
                    {connectionStatus[provider.key] && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {connectionStatus[provider.key] === "success" ? (
                          <i className="fas fa-check-circle text-green-500"></i>
                        ) : (
                          <i className="fas fa-times-circle text-red-500"></i>
                        )}
                      </div>
                    )}
                  </div>

                  <Button
                    type="button"
                    onClick={() =>
                      testApiConnection(
                        provider.key,
                        apiKeys[provider.key as keyof typeof apiKeys]
                      )
                    }
                    disabled={
                      isTestingConnection === provider.key ||
                      !apiKeys[provider.key as keyof typeof apiKeys].trim()
                    }
                    variant="outline"
                    className="px-4 py-2"
                  >
                    {isTestingConnection === provider.key ? (
                      <i className="fas fa-spinner fa-spin"></i>
                    ) : (
                      "Test"
                    )}
                  </Button>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {provider.description}
                </p>

                {provider.key === "trading212" && apiKeys.trading212 && (
                  <Button
                    type="button"
                    onClick={syncTrading212Data}
                    disabled={isTestingConnection === "trading212-sync"}
                    className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    {isTestingConnection === "trading212-sync" ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        Syncing Portfolio...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-sync-alt"></i>
                        Sync Trading 212 Portfolio
                      </>
                    )}
                  </Button>
                )}
              </div>
            ))}
          </form>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <Button type="button" onClick={onClose} variant="ghost">
            Cancel
          </Button>
          <Button
            type="submit"
            form="api-keys-form"
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            {isDemoMode ? "Save Keys Locally" : "Save API Keys"}
          </Button>
        </div>
      </EnhancedGlassCard>
    </BaseModal>
  );
}
