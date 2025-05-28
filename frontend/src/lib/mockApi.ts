// Mock API service for development
import { mockAssets, mockExpenses, mockProperties, generateHistoricalData } from './mockData';
import type { Asset, Expense, Property } from '@/types/global';

// Enable mock API by setting this to true
const USE_MOCK_API = true;

// Simulate API delay
const API_DELAY = 300;

// Mock API handlers
export const mockApi = {
  assets: {
    async read() {
      await new Promise(resolve => setTimeout(resolve, API_DELAY));
      return { assets: mockAssets, error: null };
    },
    
    async create(asset: Asset) {
      await new Promise(resolve => setTimeout(resolve, API_DELAY));
      const newAsset = { ...asset, id: Date.now().toString() };
      mockAssets.push(newAsset);
      return { asset: newAsset, error: null };
    },
    
    async update(id: string, asset: Asset) {
      await new Promise(resolve => setTimeout(resolve, API_DELAY));
      const index = mockAssets.findIndex(a => a.id === id);
      if (index !== -1) {
        mockAssets[index] = { ...mockAssets[index], ...asset };
        return { asset: mockAssets[index], error: null };
      }
      return { asset: null, error: 'Asset not found' };
    },
    
    async delete(id: string) {
      await new Promise(resolve => setTimeout(resolve, API_DELAY));
      const index = mockAssets.findIndex(a => a.id === id);
      if (index !== -1) {
        mockAssets.splice(index, 1);
        return { success: true, error: null };
      }
      return { success: false, error: 'Asset not found' };
    },
    
    async getHistory(days: number | null) {
      await new Promise(resolve => setTimeout(resolve, API_DELAY));
      const history = generateHistoricalData(days || 30);
      return { history, error: null };
    }
  },
  
  expenses: {
    async read() {
      await new Promise(resolve => setTimeout(resolve, API_DELAY));
      return { expenses: mockExpenses, error: null };
    },
    
    async create(expense: Expense) {
      await new Promise(resolve => setTimeout(resolve, API_DELAY));
      const newExpense = { ...expense, id: Date.now().toString() };
      mockExpenses.push(newExpense);
      return { expense: newExpense, error: null };
    },
    
    async update(id: string, expense: Expense) {
      await new Promise(resolve => setTimeout(resolve, API_DELAY));
      const index = mockExpenses.findIndex(e => e.id === id);
      if (index !== -1) {
        mockExpenses[index] = { ...mockExpenses[index], ...expense };
        return { expense: mockExpenses[index], error: null };
      }
      return { expense: null, error: 'Expense not found' };
    },
    
    async delete(id: string) {
      await new Promise(resolve => setTimeout(resolve, API_DELAY));
      const index = mockExpenses.findIndex(e => e.id === id);
      if (index !== -1) {
        mockExpenses.splice(index, 1);
        return { success: true, error: null };
      }
      return { success: false, error: 'Expense not found' };
    }
  },
  
  properties: {
    async read() {
      await new Promise(resolve => setTimeout(resolve, API_DELAY));
      return { properties: mockProperties, error: null };
    },
    
    async create(property: Property) {
      await new Promise(resolve => setTimeout(resolve, API_DELAY));
      const newProperty = { ...property, id: Date.now().toString() };
      mockProperties.push(newProperty);
      return { property: newProperty, error: null };
    },
    
    async update(id: string, property: Property) {
      await new Promise(resolve => setTimeout(resolve, API_DELAY));
      const index = mockProperties.findIndex(p => p.id === id);
      if (index !== -1) {
        mockProperties[index] = { ...mockProperties[index], ...property };
        return { property: mockProperties[index], error: null };
      }
      return { property: null, error: 'Property not found' };
    },
    
    async delete(id: string) {
      await new Promise(resolve => setTimeout(resolve, API_DELAY));
      const index = mockProperties.findIndex(p => p.id === id);
      if (index !== -1) {
        mockProperties.splice(index, 1);
        return { success: true, error: null };
      }
      return { success: false, error: 'Property not found' };
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
  
  // Route to appropriate mock handler
  if (url.includes('/api/assets')) {
    switch (method) {
      case 'READ':
        return { json: async () => mockApi.assets.read() };
      case 'CREATE':
        return { json: async () => mockApi.assets.create(body) };
      case 'UPDATE':
        return { json: async () => mockApi.assets.update(body.id, body) };
      case 'DELETE':
        return { json: async () => mockApi.assets.delete(body.id) };
      case 'GET_HISTORY':
        return { json: async () => mockApi.assets.getHistory(body.days) };
      default:
        return { json: async () => ({ error: 'Unknown method' }) };
    }
  }
  
  if (url.includes('/api/expenses')) {
    switch (method) {
      case 'READ':
        return { json: async () => mockApi.expenses.read() };
      case 'CREATE':
        return { json: async () => mockApi.expenses.create(body) };
      case 'UPDATE':
        return { json: async () => mockApi.expenses.update(body.id, body) };
      case 'DELETE':
        return { json: async () => mockApi.expenses.delete(body.id) };
      default:
        return { json: async () => ({ error: 'Unknown method' }) };
    }
  }
  
  if (url.includes('/api/properties')) {
    switch (method) {
      case 'READ':
        return { json: async () => mockApi.properties.read() };
      case 'CREATE':
        return { json: async () => mockApi.properties.create(body) };
      case 'UPDATE':
        return { json: async () => mockApi.properties.update(body.id, body) };
      case 'DELETE':
        return { json: async () => mockApi.properties.delete(body.id) };
      default:
        return { json: async () => ({ error: 'Unknown method' }) };
    }
  }
  
  // Fallback to real API
  return fetch(url, options);
} 