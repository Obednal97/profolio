'use client';

import React from 'react';

interface AuthLoadingStateProps {
  type: 'signing-in' | 'signing-out' | 'loading';
  message?: string;
}

export function AuthLoadingState({ type, message }: AuthLoadingStateProps) {
  const getContent = () => {
    switch (type) {
      case 'signing-in':
        return {
          icon: 'fa-sign-in-alt',
          title: 'Signing You In',
          subtitle: 'Please wait while we authenticate your account...',
          color: 'text-green-500 dark:text-green-400',
          bgColor: 'from-green-50 via-blue-50 to-purple-50 dark:from-green-900/20 dark:via-blue-900/20 dark:to-purple-900/20'
        };
      case 'signing-out':
        return {
          icon: 'fa-sign-out-alt',
          title: 'Signing You Out',
          subtitle: 'Clearing your session and securing your data...',
          color: 'text-orange-500 dark:text-orange-400',
          bgColor: 'from-orange-50 via-red-50 to-pink-50 dark:from-orange-900/20 dark:via-red-900/20 dark:to-pink-900/20'
        };
      default:
        return {
          icon: 'fa-spinner',
          title: 'Loading',
          subtitle: message || 'Please wait...',
          color: 'text-blue-500 dark:text-blue-400',
          bgColor: 'from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900'
        };
    }
  };

  const content = getContent();

  return (
    <div className={`min-h-screen bg-gradient-to-br ${content.bgColor} flex items-center justify-center p-4`}>
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-3xl opacity-20 dark:opacity-10 animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-3xl opacity-20 dark:opacity-10 animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-40 left-40 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-3xl opacity-20 dark:opacity-10 animate-pulse" style={{ animationDelay: '4s' }} />
      </div>
      
      <div className="relative z-10 text-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20 dark:border-gray-700/50 max-w-md w-full">
        <div className="text-6xl mb-6">
          <i className={`fas ${content.icon} ${content.color} ${type === 'loading' ? 'animate-spin' : ''}`}></i>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          {content.title}
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {content.subtitle}
        </p>
        <div className="flex items-center justify-center space-x-1">
          <div className={`h-2 w-2 bg-current ${content.color} rounded-full animate-bounce`}></div>
          <div className={`h-2 w-2 bg-current ${content.color} rounded-full animate-bounce`} style={{ animationDelay: '0.1s' }}></div>
          <div className={`h-2 w-2 bg-current ${content.color} rounded-full animate-bounce`} style={{ animationDelay: '0.2s' }}></div>
        </div>
        
        {/* Additional context for sign out */}
        {type === 'signing-out' && (
          <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
            <i className="fas fa-shield-alt mr-2"></i>
            Your data remains secure
          </div>
        )}
        
        {/* Additional context for sign in */}
        {type === 'signing-in' && (
          <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
            <i className="fas fa-key mr-2"></i>
            Verifying your credentials
          </div>
        )}
      </div>
    </div>
  );
} 