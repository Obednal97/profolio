// Mock API service for development
import { generateHistoricalData } from "./mockData";
import type { Asset, Expense, Property, User } from "@/types/global";
import { logger } from "./logger";

// Only use mock API when no backend is available or explicitly enabled for development
const USE_MOCK_API = (() => {
  // Force enable mock API if explicitly set
  if (process.env.NEXT_PUBLIC_USE_MOCK_API === "true") {
    return true;
  }

  // Force disable mock API if explicitly set
  if (process.env.NEXT_PUBLIC_USE_MOCK_API === "false") {
    return false;
  }

  // Auto-detect: Use mock API only if no backend URL is configured
  return !process.env.NEXT_PUBLIC_API_URL && !process.env.BACKEND_URL;
})();

// Debug logging to help troubleshoot API mode
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  logger.info("🔧 Mock API Configuration:", {
    USE_MOCK_API,
    NEXT_PUBLIC_USE_MOCK_API: process.env.NEXT_PUBLIC_USE_MOCK_API,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    BACKEND_URL: process.env.BACKEND_URL,
    mode: USE_MOCK_API ? "MOCK (localStorage)" : "REAL BACKEND",
  });
}

// Simulate API delay - reduced from 300ms to 50ms for better performance
const API_DELAY = 50;

// User-specific data storage using localStorage
const getUserAssets = (userId: string): Asset[] => {
  if (typeof window === "undefined") return [];
  const key = `user-${userId}-assets`;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const setUserAssets = (userId: string, assets: Asset[]): void => {
  if (typeof window === "undefined") return;
  const key = `user-${userId}-assets`;
  localStorage.setItem(key, JSON.stringify(assets));
};

const getUserExpenses = (userId: string): Expense[] => {
  if (typeof window === "undefined") return [];
  const key = `user-${userId}-expenses`;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const setUserExpenses = (userId: string, expenses: Expense[]): void => {
  if (typeof window === "undefined") return;
  const key = `user-${userId}-expenses`;
  localStorage.setItem(key, JSON.stringify(expenses));
};

const getUserProperties = (userId: string): Property[] => {
  if (typeof window === "undefined") return [];
  const key = `user-${userId}-properties`;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const setUserProperties = (userId: string, properties: Property[]): void => {
  if (typeof window === "undefined") return;
  const key = `user-${userId}-properties`;
  localStorage.setItem(key, JSON.stringify(properties));
};

const getUserProfile = (userId: string): User | null => {
  if (typeof window === "undefined") return null;
  const key = `user-profile-${userId}`;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
};

const setUserProfile = (userId: string, profile: User): void => {
  if (typeof window === "undefined") return;
  const key = `user-profile-${userId}`;
  localStorage.setItem(key, JSON.stringify(profile));
};

// Mock API handlers with user-specific data
export const mockApi = {
  assets: {
    async read(userId: string) {
      await new Promise((resolve) => setTimeout(resolve, API_DELAY));
      const userAssets = getUserAssets(userId);
      return { assets: userAssets, error: null };
    },

    async create(userId: string, asset: Omit<Asset, "id">) {
      await new Promise((resolve) => setTimeout(resolve, API_DELAY));
      const userAssets = getUserAssets(userId);
      const newAsset = { ...asset, id: Date.now().toString(), userId };
      userAssets.push(newAsset);
      setUserAssets(userId, userAssets);
      return { asset: newAsset, error: null };
    },

    async update(userId: string, id: string, asset: Partial<Asset>) {
      await new Promise((resolve) => setTimeout(resolve, API_DELAY));
      const userAssets = getUserAssets(userId);
      const index = userAssets.findIndex(
        (a: Asset) => a.id === id && a.userId === userId
      );
      if (index !== -1) {
        userAssets[index] = { ...userAssets[index], ...asset };
        setUserAssets(userId, userAssets);
        return { asset: userAssets[index], error: null };
      }
      return { asset: null, error: "Asset not found" };
    },

    async delete(userId: string, id: string) {
      await new Promise((resolve) => setTimeout(resolve, API_DELAY));
      const userAssets = getUserAssets(userId);
      const index = userAssets.findIndex(
        (a: Asset) => a.id === id && a.userId === userId
      );
      if (index !== -1) {
        userAssets.splice(index, 1);
        setUserAssets(userId, userAssets);
        return { success: true, error: null };
      }
      return { success: false, error: "Asset not found" };
    },

    async getHistory(userId: string, days: number = 30) {
      await new Promise((resolve) => setTimeout(resolve, API_DELAY));

      // Get current user assets to base historical data on
      const userAssets = getUserAssets(userId);

      // Generate historical data based on current assets
      const history = generateHistoricalData(days, userAssets);
      return { history, error: null };
    },
  },

  expenses: {
    async read(userId: string, days?: number) {
      await new Promise((resolve) => setTimeout(resolve, API_DELAY));
      let userExpenses = getUserExpenses(userId);

      // Filter by date range if specified
      if (days) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        userExpenses = userExpenses.filter(
          (expense: Expense) => new Date(expense.date) >= cutoffDate
        );
      }

      return { expenses: userExpenses, error: null };
    },

    async create(userId: string, expense: Omit<Expense, "id">) {
      await new Promise((resolve) => setTimeout(resolve, API_DELAY));
      const userExpenses = getUserExpenses(userId);
      const newExpense = { ...expense, id: Date.now().toString(), userId };
      userExpenses.push(newExpense);
      setUserExpenses(userId, userExpenses);
      return { expense: newExpense, error: null };
    },

    async update(userId: string, id: string, expense: Partial<Expense>) {
      await new Promise((resolve) => setTimeout(resolve, API_DELAY));
      const userExpenses = getUserExpenses(userId);
      const index = userExpenses.findIndex(
        (e: Expense) => e.id === id && e.userId === userId
      );
      if (index !== -1) {
        userExpenses[index] = { ...userExpenses[index], ...expense };
        setUserExpenses(userId, userExpenses);
        return { expense: userExpenses[index], error: null };
      }
      return { expense: null, error: "Expense not found" };
    },

    async delete(userId: string, id: string) {
      await new Promise((resolve) => setTimeout(resolve, API_DELAY));
      const userExpenses = getUserExpenses(userId);
      const index = userExpenses.findIndex(
        (e: Expense) => e.id === id && e.userId === userId
      );
      if (index !== -1) {
        userExpenses.splice(index, 1);
        setUserExpenses(userId, userExpenses);
        return { success: true, error: null };
      }
      return { success: false, error: "Expense not found" };
    },
  },

  properties: {
    async read(userId: string) {
      await new Promise((resolve) => setTimeout(resolve, API_DELAY));
      const userProperties = getUserProperties(userId);
      return { properties: userProperties, error: null };
    },

    async create(userId: string, property: Omit<Property, "id">) {
      await new Promise((resolve) => setTimeout(resolve, API_DELAY));
      const userProperties = getUserProperties(userId);
      const newProperty = { ...property, id: Date.now().toString(), userId };
      userProperties.push(newProperty);
      setUserProperties(userId, userProperties);
      return { property: newProperty, error: null };
    },

    async update(userId: string, id: string, property: Partial<Property>) {
      await new Promise((resolve) => setTimeout(resolve, API_DELAY));
      const userProperties = getUserProperties(userId);
      const index = userProperties.findIndex(
        (p: Property) => p.id === id && p.userId === userId
      );
      if (index !== -1) {
        userProperties[index] = { ...userProperties[index], ...property };
        setUserProperties(userId, userProperties);
        return { property: userProperties[index], error: null };
      }
      return { property: null, error: "Property not found" };
    },

    async delete(userId: string, id: string) {
      await new Promise((resolve) => setTimeout(resolve, API_DELAY));
      const userProperties = getUserProperties(userId);
      const index = userProperties.findIndex(
        (p: Property) => p.id === id && p.userId === userId
      );
      if (index !== -1) {
        userProperties.splice(index, 1);
        setUserProperties(userId, userProperties);
        return { success: true, error: null };
      }
      return { success: false, error: "Property not found" };
    },
  },

  user: {
    async getProfile(userId: string) {
      await new Promise((resolve) => setTimeout(resolve, API_DELAY));
      const profile = getUserProfile(userId);
      return { user: profile, error: null };
    },

    async updateProfile(userId: string, profileData: Partial<User>) {
      await new Promise((resolve) => setTimeout(resolve, API_DELAY));

      // Get existing profile or create new one
      const existingProfile: Partial<User> = getUserProfile(userId) || {};
      const updatedProfile: User = {
        id: userId,
        email: profileData.email || existingProfile.email || null,
        ...existingProfile,
        ...profileData,
      };

      // Save updated profile
      setUserProfile(userId, updatedProfile);

      return { user: updatedProfile, error: null };
    },
  },
};

// Wrapper function to intercept API calls and use mock data when enabled
export async function apiCall(url: string, options: RequestInit) {
  if (!USE_MOCK_API) {
    // Transform mock API format to real API format
    try {
      const body = options.body ? JSON.parse(options.body as string) : {};
      const method = body.method || "READ";

      // For real API calls, the proxy routes handle authentication automatically via httpOnly cookies
      // No need to detect or include tokens - the browser automatically sends cookies
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      let fetchOptions: RequestInit;
      let finalUrl = url;

      // Transform mock API calls to REST API calls
      switch (method) {
        case "READ":
          fetchOptions = {
            method: "GET",
            headers,
            // No body for GET requests
          };
          break;

        case "CREATE":
          // Remove mock API fields and send actual data
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { method: _m, userId: _u, ...createData } = body;
          fetchOptions = {
            method: "POST",
            headers,
            body: JSON.stringify(createData),
          };
          break;

        case "UPDATE":
          // Use PATCH method and include ID in URL
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { method: _method, userId: _userId, id, ...updateData } = body;
          if (!id) {
            throw new Error("UPDATE operation requires an ID");
          }
          finalUrl = `${url}/${id}`;
          fetchOptions = {
            method: "PATCH",
            headers,
            body: JSON.stringify(updateData),
          };
          break;

        case "DELETE":
          // Use DELETE method with ID in URL
          const deleteId = body.id;
          if (!deleteId) {
            throw new Error("DELETE operation requires an ID");
          }
          finalUrl = `${url}/${deleteId}`;
          fetchOptions = {
            method: "DELETE",
            headers,
            // No body for DELETE requests
          };
          break;

        default:
          // For other methods, use original format
          fetchOptions = {
            ...options,
            headers: {
              ...((options.headers as Record<string, string>) || {}),
              ...headers,
            },
          };
      }

      return fetch(finalUrl, fetchOptions);
    } catch (error) {
      console.error("API call transformation error:", error);
      // Fallback to original call
      return fetch(url, options);
    }
  }

  // Parse the request to determine which mock handler to use
  const body = options.body ? JSON.parse(options.body as string) : {};
  const method = body.method || "READ";
  const userId = body.userId;

  // Validate userId is provided
  if (!userId) {
    return { json: async () => ({ error: "User ID is required" }) };
  }

  // Route to appropriate mock handler
  if (url.includes("/api/assets")) {
    switch (method) {
      case "READ":
        return { json: async () => mockApi.assets.read(userId) };
      case "CREATE":
        return { json: async () => mockApi.assets.create(userId, body) };
      case "UPDATE":
        return {
          json: async () => mockApi.assets.update(userId, body.id, body),
        };
      case "DELETE":
        return { json: async () => mockApi.assets.delete(userId, body.id) };
      case "GET_HISTORY":
        return {
          json: async () => mockApi.assets.getHistory(userId, body.days),
        };
      default:
        return { json: async () => ({ error: "Unknown method" }) };
    }
  }

  if (url.includes("/api/expenses")) {
    switch (method) {
      case "READ":
        return { json: async () => mockApi.expenses.read(userId, body.days) };
      case "CREATE":
        return { json: async () => mockApi.expenses.create(userId, body) };
      case "UPDATE":
        return {
          json: async () => mockApi.expenses.update(userId, body.id, body),
        };
      case "DELETE":
        return { json: async () => mockApi.expenses.delete(userId, body.id) };
      default:
        return { json: async () => ({ error: "Unknown method" }) };
    }
  }

  if (url.includes("/api/properties")) {
    switch (method) {
      case "READ":
        return { json: async () => mockApi.properties.read(userId) };
      case "CREATE":
        return { json: async () => mockApi.properties.create(userId, body) };
      case "UPDATE":
        return {
          json: async () => mockApi.properties.update(userId, body.id, body),
        };
      case "DELETE":
        return { json: async () => mockApi.properties.delete(userId, body.id) };
      default:
        return { json: async () => ({ error: "Unknown method" }) };
    }
  }

  if (url.includes("/api/user")) {
    switch (method) {
      case "GET_PROFILE_FROM_STORAGE":
        return { json: async () => mockApi.user.getProfile(userId) };
      case "UPDATE_PROFILE":
        return {
          json: async () =>
            mockApi.user.updateProfile(userId, body.profileData),
        };
      default:
        return { json: async () => ({ error: "Unknown method" }) };
    }
  }

  // Default fallback
  return { json: async () => ({ error: "API endpoint not found" }) };
}
