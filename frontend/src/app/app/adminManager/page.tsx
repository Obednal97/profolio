"use client";

import { useAuth } from "@/lib/unifiedAuth";
import React from "react";

function AdminManager() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Admin Manager
          </h1>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <i className="fas fa-tools text-blue-600 dark:text-blue-400 text-2xl"></i>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100">
                  Feature Coming Soon
                </h3>
                <p className="text-blue-700 dark:text-blue-300 mt-1">
                  Admin management features are currently under development.
                  This section will include user management, group
                  administration, permissions, and invitation management
                  capabilities.
                </p>
                {user && (
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                    Logged in as: {user.name || user.email}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminManager;
