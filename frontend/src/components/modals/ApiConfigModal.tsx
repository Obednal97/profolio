"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button/button';
import { BaseModal } from './modal';

interface ApiProvider {
  id: string;
  name: string;
  description: string;
  website: string;
  signupUrl: string;
  docs: string;
  rateLimit: string;
  supports: string[];
}

interface ApiKey {
  id: string;
  provider: string;
  keyName: string;
  isActive: boolean;
  lastUsed?: Date;
  rateLimitHit?: Date;
  createdAt: Date;
}

interface ApiConfigModalProps {
  onClose: () => void;
}

export default function ApiConfigModal({ onClose }: ApiConfigModalProps) {
  const [providers, setProviders] = useState<ApiProvider[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [apiKeyValue, setApiKeyValue] = useState('');
  const [keyName, setKeyName] = useState('');
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'existing' | 'add'>('existing');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load provider information
      const providersResponse = await fetch('/api/api-keys/providers/info');
      const providersData = await providersResponse.json();
      setProviders(providersData.providers || []);

      // Load existing API keys
      const keysResponse = await fetch('/api/api-keys');
      const keysData = await keysResponse.json();
      setApiKeys(keysData || []);
    } catch (error) {
      console.error('Failed to load API configuration data:', error);
      setProviders([]);
      setApiKeys([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTestApiKey = async () => {
    if (!selectedProvider || !apiKeyValue) return;

    setIsTestingKey(true);
    setTestResult(null);

    try {
      const response = await fetch(`/api/api-keys/test/${selectedProvider}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKeyValue }),
      });

      const result = await response.json();
      setTestResult({
        success: result.isValid,
        message: result.isValid ? 'API key is valid and working!' : 'API key is invalid or not working.',
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Failed to test API key. Please try again.',
      });
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleSaveApiKey = async () => {
    if (!selectedProvider || !apiKeyValue || !keyName) return;

    try {
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider,
          keyName,
          apiKey: apiKeyValue,
        }),
      });

      if (response.ok) {
        setApiKeyValue('');
        setKeyName('');
        setSelectedProvider('');
        setTestResult(null);
        setActiveTab('existing');
        await loadData();
      }
    } catch (error) {
      console.error('Failed to save API key:', error);
    }
  };

  const handleDeleteApiKey = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) return;

    try {
      const response = await fetch(`/api/api-keys/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadData();
      }
    } catch (error) {
      console.error('Failed to delete API key:', error);
    }
  };

  const toggleApiKeyStatus = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/api-keys/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (response.ok) {
        await loadData();
      }
    } catch (error) {
      console.error('Failed to update API key status:', error);
    }
  };

  const getProviderById = (id: string) => providers.find(p => p.id === id);

  if (loading) {
    return (
      <BaseModal onClose={onClose} title="API Configuration">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </BaseModal>
    );
  }

  return (
    <BaseModal onClose={onClose} title="API Configuration" size="large">
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('existing')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'existing'
                ? 'bg-white text-gray-900 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Existing Keys ({apiKeys.length})
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'add'
                ? 'bg-white text-gray-900 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Add New Key
          </button>
        </div>

        {/* Existing Keys Tab */}
        {activeTab === 'existing' && (
          <div className="space-y-4">
            {apiKeys.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <i className="fas fa-key text-4xl mb-4 text-gray-300"></i>
                <p>No API keys configured yet.</p>
                <p className="text-sm">Add your first API key to start tracking real-time prices.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {apiKeys.map((key) => {
                  const provider = getProviderById(key.provider);
                  return (
                    <div key={key.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${key.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                          <div>
                            <h4 className="font-medium">{key.keyName}</h4>
                            <p className="text-sm text-gray-600">{provider?.name || key.provider}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => toggleApiKeyStatus(key.id, key.isActive)}
                            className={`px-3 py-1 rounded text-xs font-medium ${
                              key.isActive
                                ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                : 'bg-green-100 text-green-800 hover:bg-green-200'
                            }`}
                          >
                            {key.isActive ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            onClick={() => handleDeleteApiKey(key.id)}
                            className="px-3 py-1 rounded text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-500 flex items-center space-x-4">
                        <span>Created: {new Date(key.createdAt).toLocaleDateString()}</span>
                        {key.lastUsed && (
                          <span>Last used: {new Date(key.lastUsed).toLocaleDateString()}</span>
                        )}
                        {key.rateLimitHit && (
                          <span className="text-red-600">
                            Rate limit hit: {new Date(key.rateLimitHit).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {provider && (
                        <div className="text-sm text-gray-600">
                          <p><strong>Supports:</strong> {provider.supports.join(', ')}</p>
                          <p><strong>Rate Limit:</strong> {provider.rateLimit}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Add New Key Tab */}
        {activeTab === 'add' && (
          <div className="space-y-6">
            {/* Provider Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select API Provider
              </label>
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Choose a provider...</option>
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name} - {provider.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Provider Information */}
            {selectedProvider && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                {(() => {
                  const provider = getProviderById(selectedProvider);
                  if (!provider) return null;

                  return (
                    <div className="space-y-3">
                      <h4 className="font-medium text-blue-900">{provider.name}</h4>
                      <p className="text-sm text-blue-800">{provider.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong>Supports:</strong> {provider.supports.join(', ')}
                        </div>
                        <div>
                          <strong>Rate Limit:</strong> {provider.rateLimit}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-2">
                        <a
                          href={provider.signupUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                        >
                          <i className="fas fa-key mr-1"></i>
                          Get API Key
                        </a>
                        <a
                          href={provider.docs}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
                        >
                          <i className="fas fa-book mr-1"></i>
                          Documentation
                        </a>
                        <a
                          href={provider.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                        >
                          <i className="fas fa-external-link-alt mr-1"></i>
                          Website
                        </a>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* API Key Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Key Name (for your reference)
              </label>
              <input
                type="text"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="e.g., My Alpha Vantage Key"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key
              </label>
              <input
                type="password"
                value={apiKeyValue}
                onChange={(e) => setApiKeyValue(e.target.value)}
                placeholder="Enter your API key here..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Test Result */}
            {testResult && (
              <div className={`p-3 rounded-lg ${
                testResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                <div className="flex items-center">
                  <i className={`fas ${testResult.success ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-2`}></i>
                  {testResult.message}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button
                onClick={handleTestApiKey}
                disabled={!selectedProvider || !apiKeyValue || isTestingKey}
                variant="outline"
              >
                {isTestingKey ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Testing...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check mr-2"></i>
                    Test Key
                  </>
                )}
              </Button>

              <Button
                onClick={handleSaveApiKey}
                disabled={!selectedProvider || !apiKeyValue || !keyName}
                variant="primary"
              >
                <i className="fas fa-save mr-2"></i>
                Save API Key
              </Button>
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">
            <i className="fas fa-info-circle text-blue-500 mr-2"></i>
            Security Information
          </h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• API keys are encrypted and stored securely on our servers</li>
            <li>• Keys are never transmitted to or stored in your browser</li>
            <li>• We only use your keys to fetch price data for your assets</li>
            <li>• You can disable or delete keys at any time</li>
            <li>• Free APIs have rate limits - we'll automatically handle these</li>
          </ul>
        </div>
      </div>
    </BaseModal>
  );
} 