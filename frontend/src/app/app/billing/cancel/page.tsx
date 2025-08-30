'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function BillingCancelPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full text-center"
      >
        {/* Cancel Icon */}
        <div className="mb-6">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
            <i className="fas fa-pause text-white text-4xl"></i>
          </div>
        </div>

        {/* Cancel Message */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Checkout Cancelled
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          No worries! Your checkout was cancelled and you haven't been charged. You can always upgrade later when you're ready.
        </p>

        {/* Benefits reminder */}
        <div className="glass-tile rounded-xl p-6 mb-8 text-left">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            What you're missing:
          </h3>
          <ul className="space-y-2">
            {[
              '14-day free trial - no payment today',
              'Cancel anytime during trial',
              '30-day money-back guarantee',
              'Unlock all premium features',
              'Priority support',
            ].map((benefit, index) => (
              <li key={index} className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <i className="fas fa-info-circle text-blue-500 text-sm"></i>
                <span className="text-sm">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <Link
            href="/app/billing/upgrade"
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
          >
            <i className="fas fa-rocket mr-2"></i>
            Try Again
          </Link>
          
          <Link
            href="/app/dashboard"
            className="w-full px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
          >
            <i className="fas fa-home mr-2"></i>
            Back to Dashboard
          </Link>
        </div>

        {/* Support link */}
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-6">
          Having issues? <Link href="/app/settings" className="text-blue-500 hover:underline">Contact support</Link>
        </p>
      </motion.div>
    </div>
  );
}