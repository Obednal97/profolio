'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function BillingSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(10);
  
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/app/billing');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full text-center"
      >
        {/* Success Icon */}
        <div className="mb-6">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
            <i className="fas fa-check text-white text-4xl"></i>
          </div>
        </div>

        {/* Success Message */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Welcome to Premium! 🎉
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Your subscription has been activated successfully. You now have access to all premium features.
        </p>

        {/* Features List */}
        <div className="glass-tile rounded-xl p-6 mb-8 text-left">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            What&apos;s included:
          </h3>
          <ul className="space-y-2">
            {[
              'Unlimited portfolio tracking',
              'Advanced analytics & insights',
              'Priority customer support',
              'API integrations',
              'Mobile app access',
              'Automatic backups',
            ].map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <i className="fas fa-check-circle text-green-500 text-sm"></i>
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Session ID */}
        {sessionId && (
          <p className="text-xs text-gray-500 dark:text-gray-500 mb-6">
            Transaction ID: {sessionId.substring(0, 20)}...
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <Link
            href="/app/billing"
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
          >
            <i className="fas fa-credit-card mr-2"></i>
            Go to Billing Dashboard
          </Link>
          
          <Link
            href="/app/dashboard"
            className="w-full px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
          >
            <i className="fas fa-home mr-2"></i>
            Back to Dashboard
          </Link>
        </div>

        {/* Auto-redirect notice */}
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-6">
          Redirecting to billing dashboard in {countdown} seconds...
        </p>
      </motion.div>
    </div>
  );
}