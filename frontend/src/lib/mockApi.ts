// Mock API service for development
import { generateHistoricalData } from './mockData';
import type { Asset, Expense, Property, User } from '@/types/global';

// Enable mock API by setting this to true
const USE_MOCK_API = true;

// Simulate API delay
const API_DELAY = 300;

// User-specific data storage using localStorage
const getUserAssets = (userId: string): Asset[] => {
  if (typeof window === 'undefined') return [];
  const key = `user-${userId}-assets`;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const setUserAssets = (userId: string, assets: Asset[]): void => {
  if (typeof window === 'undefined') return;
  const key = `user-${userId}-assets`;
  localStorage.setItem(key, JSON.stringify(assets));
};

const getUserExpenses = (userId: string): Expense[] => {
  if (typeof window === 'undefined') return [];
  const key = `user-${userId}-expenses`;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const setUserExpenses = (userId: string, expenses: Expense[]): void => {
  if (typeof window === 'undefined') return;
  const key = `user-${userId}-expenses`;
  localStorage.setItem(key, JSON.stringify(expenses));
};

const getUserProperties = (userId: string): Property[] => {
  if (typeof window === 'undefined') return [];
  const key = `user-${userId}-properties`;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const setUserProperties = (userId: string, properties: Property[]): void => {
  if (typeof window === 'undefined') return;
  const key = `user-${userId}-properties`;
  localStorage.setItem(key, JSON.stringify(properties));
};

const getUserProfile = (userId: string): User | null => {
  if (typeof window === 'undefined') return null;
  const key = `user-profile-${userId}`;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
};

const setUserProfile = (userId: string, profile: User): void => {
  if (typeof window === 'undefined') return;
  const key = `user-profile-${userId}`;
  localStorage.setItem(key, JSON.stringify(profile));
};

// Mock API handlers with user-specific data
export const mockApi = {
  assets: {
    async read(userId: string) {
      await new Promise(resolve => setTimeout(resolve, API_DELAY));
      const userAssets = getUserAssets(userId);
      return { assets: userAssets, error: null };
    },
    
    async create(userId: string, asset: Omit<Asset, 'id'>) {
      await new Promise(resolve => setTimeout(resolve, API_DELAY));
      const userAssets = getUserAssets(userId);
      const newAsset = { ...asset, id: Date.now().toString(), userId };
      userAssets.push(newAsset);
      setUserAssets(userId, userAssets);
      return { asset: newAsset, error: null };
    },
    
    async update(userId: string, id: string, asset: Partial<Asset>) {
      await new Promise(resolve => setTimeout(resolve, API_DELAY));
      const userAssets = getUserAssets(userId);
      const index = userAssets.findIndex((a: Asset) => a.id === id && a.userId === userId);
      if (index !== -1) {
        userAssets[index] = { ...userAssets[index], ...asset };
        setUserAssets(userId, userAssets);
        return { asset: userAssets[index], error: null };
      }
      return { asset: null, error: 'Asset not found' };
    },
    
    async delete(userId: string, id: string) {
      await new Promise(resolve => setTimeout(resolve, API_DELAY));
      const userAssets = getUserAssets(userId);
      const index = userAssets.findIndex((a: Asset) => a.id === id && a.userId === userId);
      if (index !== -1) {
        userAssets.splice(index, 1);
        setUserAssets(userId, userAssets);
        return { success: true, error: null };
      }
      return { success: false, error: 'Asset not found' };
    },

    async getHistory(userId: string, days: number = 30) {
      await new Promise(resolve => setTimeout(resolve, API_DELAY));
      
      // Generate historical data
      const history = generateHistoricalData(days);
      return { history, error: null };
    }
  },
  
  expenses: {
    async read(userId: string, days?: number) {
      await new Promise(resolve => setTimeout(resolve, API_DELAY));
      let userExpenses = getUserExpenses(userId);
      
      // Filter by date range if specified
      if (days) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        userExpenses = userExpenses.filter((expense: Expense) => 
          new Date(expense.date) >= cutoffDate
        );
      }
      
      return { expenses: userExpenses, error: null };
    },
    
    async create(userId: string, expense: Omit<Expense, 'id'>) {
      await new Promise(resolve => setTimeout(resolve, API_DELAY));
      const userExpenses = getUserExpenses(userId);
      const newExpense = { ...expense, id: Date.now().toString(), userId };
      userExpenses.push(newExpense);
      setUserExpenses(userId, userExpenses);
      return { expense: newExpense, error: null };
    },
    
    async update(userId: string, id: string, expense: Partial<Expense>) {
      await new Promise(resolve => setTimeout(resolve, API_DELAY));
      const userExpenses = getUserExpenses(userId);
      const index = userExpenses.findIndex((e: Expense) => e.id === id && e.userId === userId);
      if (index !== -1) {
        userExpenses[index] = { ...userExpenses[index], ...expense };
        setUserExpenses(userId, userExpenses);
        return { expense: userExpenses[index], error: null };
      }
      return { expense: null, error: 'Expense not found' };
    },
    
    async delete(userId: string, id: string) {
      await new Promise(resolve => setTimeout(resolve, API_DELAY));
      const userExpenses = getUserExpenses(userId);
      const index = userExpenses.findIndex((e: Expense) => e.id === id && e.userId === userId);
      if (index !== -1) {
        userExpenses.splice(index, 1);
        setUserExpenses(userId, userExpenses);
        return { success: true, error: null };
      }
      return { success: false, error: 'Expense not found' };
    }
  },
  
  properties: {
    async read(userId: string) {
      await new Promise(resolve => setTimeout(resolve, API_DELAY));
      const userProperties = getUserProperties(userId);
      return { properties: userProperties, error: null };
    },
    
    async create(userId: string, property: Omit<Property, 'id'>) {
      await new Promise(resolve => setTimeout(resolve, API_DELAY));
      const userProperties = getUserProperties(userId);
      const newProperty = { ...property, id: Date.now().toString(), userId };
      userProperties.push(newProperty);
      setUserProperties(userId, userProperties);
      return { property: newProperty, error: null };
    },
    
    async update(userId: string, id: string, property: Partial<Property>) {
      await new Promise(resolve => setTimeout(resolve, API_DELAY));
      const userProperties = getUserProperties(userId);
      const index = userProperties.findIndex((p: Property) => p.id === id && p.userId === userId);
      if (index !== -1) {
        userProperties[index] = { ...userProperties[index], ...property };
        setUserProperties(userId, userProperties);
        return { property: userProperties[index], error: null };
      }
      return { property: null, error: 'Property not found' };
    },
    
    async delete(userId: string, id: string) {
      await new Promise(resolve => setTimeout(resolve, API_DELAY));
      const userProperties = getUserProperties(userId);
      const index = userProperties.findIndex((p: Property) => p.id === id && p.userId === userId);
      if (index !== -1) {
        userProperties.splice(index, 1);
        setUserProperties(userId, userProperties);
        return { success: true, error: null };
      }
      return { success: false, error: 'Property not found' };
    }
  },

  user: {
    async getProfile(userId: string) {
      await new Promise(resolve => setTimeout(resolve, API_DELAY));
      const profile = getUserProfile(userId);
      return { user: profile, error: null };
    },
    
    async updateProfile(userId: string, profileData: Partial<User>) {
      await new Promise(resolve => setTimeout(resolve, API_DELAY));
      
      // Get existing profile or create new one
      const existingProfile: Partial<User> = getUserProfile(userId) || {};
      const updatedProfile: User = { 
        id: userId,
        email: profileData.email || existingProfile.email || null,
        ...existingProfile, 
        ...profileData
      };
      
      // Save updated profile
      setUserProfile(userId, updatedProfile);
      
      return { user: updatedProfile, error: null };
    }
  }
};

// Wrapper function to intercept API calls and use mock data when enabled
export async function apiCall(url: string, options: RequestInit) {
  if (!USE_MOCK_API) {
    return fetch(url, options);
  }
  
  // Parse the request to determine which mock handler to use
  const body = options.body ? JSON.parse(options.body as string) : {};
  const method = body.method || 'READ';
  const userId = body.userId;

  // Validate userId is provided
  if (!userId) {
    return { json: async () => ({ error: 'User ID is required' }) };
  }
  
  // Route to appropriate mock handler
  if (url.includes('/api/assets')) {
    switch (method) {
      case 'READ':
        return { json: async () => mockApi.assets.read(userId) };
      case 'CREATE':
        return { json: async () => mockApi.assets.create(userId, body) };
      case 'UPDATE':
        return { json: async () => mockApi.assets.update(userId, body.id, body) };
      case 'DELETE':
        return { json: async () => mockApi.assets.delete(userId, body.id) };
      case 'GET_HISTORY':
        return { json: async () => mockApi.assets.getHistory(userId, body.days) };
      default:
        return { json: async () => ({ error: 'Unknown method' }) };
    }
  }
  
  if (url.includes('/api/expenses')) {
    switch (method) {
      case 'READ':
        return { json: async () => mockApi.expenses.read(userId, body.days) };
      case 'CREATE':
        return { json: async () => mockApi.expenses.create(userId, body) };
      case 'UPDATE':
        return { json: async () => mockApi.expenses.update(userId, body.id, body) };
      case 'DELETE':
        return { json: async () => mockApi.expenses.delete(userId, body.id) };
      default:
        return { json: async () => ({ error: 'Unknown method' }) };
    }
  }
  
  if (url.includes('/api/properties')) {
    switch (method) {
      case 'READ':
        return { json: async () => mockApi.properties.read(userId) };
      case 'CREATE':
        return { json: async () => mockApi.properties.create(userId, body) };
      case 'UPDATE':
        return { json: async () => mockApi.properties.update(userId, body.id, body) };
      case 'DELETE':
        return { json: async () => mockApi.properties.delete(userId, body.id) };
      default:
        return { json: async () => ({ error: 'Unknown method' }) };
    }
  }

  if (url.includes('/api/user')) {
    switch (method) {
      case 'GET_PROFILE_FROM_STORAGE':
        return { json: async () => mockApi.user.getProfile(userId) };
      case 'UPDATE_PROFILE':
        return { json: async () => mockApi.user.updateProfile(userId, body.profileData) };
      default:
        return { json: async () => ({ error: 'Unknown method' }) };
    }
  }
  
  // Default fallback
  return { json: async () => ({ error: 'API endpoint not found' }) };
} 