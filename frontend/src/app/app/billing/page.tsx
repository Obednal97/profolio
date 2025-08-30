'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
// import { loadStripe } from '@stripe/stripe-js';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/unifiedAuth';
import { logger } from '@/lib/logger';

// Initialize Stripe - commented out as it's not currently used
// const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface Subscription {
  id?: string;
  status: string;
  tier: string;
  currentPeriodEnd: string;
  trialEnd?: string;
  cancelAtPeriodEnd?: boolean;
}

export default function BillingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch subscription details
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        console.log('Fetching subscription for user:', user);
        const response = await apiClient.get('/api/billing/subscription');
        console.log('Subscription response:', response);
        if (response.data) {
          setSubscription(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch subscription:', error);
        logger.error('Failed to fetch subscription:', error);
        // Still set loading to false on error
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchSubscription();
    } else {
      // If no user, stop loading
      setLoading(false);
    }
  }, [user]);

  // Handle manage subscription (Stripe Customer Portal)
  const handleManageSubscription = async () => {
    setActionLoading(true);
    try {
      const response = await apiClient.post('/api/billing/portal');
      if (response.data?.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      logger.error('Failed to open customer portal:', error);
      alert('Failed to open customer portal. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle upgrade/start subscription
  const handleUpgrade = () => {
    router.push('/app/billing/upgrade');
  };

  // Handle cancel subscription
  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will retain access until the end of your billing period.')) {
      return;
    }

    setActionLoading(true);
    try {
      await apiClient.delete('/api/billing/subscription');
      // Refresh subscription data
      const response = await apiClient.get('/api/billing/subscription');
      setSubscription(response.data);
      alert('Your subscription has been scheduled for cancellation.');
    } catch (error) {
      logger.error('Failed to cancel subscription:', error);
      alert('Failed to cancel subscription. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'trialing':
        return 'bg-blue-500';
      case 'past_due':
        return 'bg-red-500';
      case 'canceled':
      case 'canceling':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Get plan display name
  const getPlanName = (tier: string) => {
    switch (tier) {
      case 'cloud_monthly':
        return 'Cloud Monthly';
      case 'cloud_annual':
        return 'Cloud Annual';
      default:
        return 'Free';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-gray-400 mb-4"></i>
          <p className="text-gray-600 dark:text-gray-400">Loading billing information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Billing & Subscription
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your subscription and billing information
          </p>
        </div>

        {/* Current Plan Card */}
        <div className="glass-tile rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Current Plan
              </h2>
              {subscription ? (
                <>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {getPlanName(subscription.tier)}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-white text-sm font-medium ${getStatusColor(subscription.status)}`}>
                      {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                    </span>
                  </div>
                  {subscription.cancelAtPeriodEnd && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-3">
                      <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                        <i className="fas fa-exclamation-triangle mr-2"></i>
                        Your subscription will end on {formatDate(subscription.currentPeriodEnd)}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    Free Plan
                  </span>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">
                    You&apos;re currently on the free plan. Upgrade to unlock premium features.
                  </p>
                </div>
              )}
            </div>
            <div className="text-right">
              {subscription?.tier === 'cloud_monthly' && (
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  £9.99<span className="text-sm font-normal text-gray-600 dark:text-gray-400">/month</span>
                </p>
              )}
              {subscription?.tier === 'cloud_annual' && (
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  £95.90<span className="text-sm font-normal text-gray-600 dark:text-gray-400">/year</span>
                </p>
              )}
            </div>
          </div>

          {/* Subscription Details */}
          {subscription && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {subscription.trialEnd && new Date(subscription.trialEnd) > new Date() && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Trial Ends</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatDate(subscription.trialEnd)}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {subscription.cancelAtPeriodEnd ? 'Access Until' : 'Next Billing Date'}
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatDate(subscription.currentPeriodEnd)}
                  </p>
                </div>
                {subscription.status === 'past_due' && (
                  <div className="col-span-2">
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                      <p className="text-red-800 dark:text-red-200 text-sm">
                        <i className="fas fa-exclamation-circle mr-2"></i>
                        Your payment is past due. Please update your payment method to continue service.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mt-6">
            {subscription ? (
              <>
                <button
                  onClick={handleManageSubscription}
                  disabled={actionLoading}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50"
                >
                  {actionLoading ? (
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                  ) : (
                    <i className="fas fa-cog mr-2"></i>
                  )}
                  Manage Subscription
                </button>
                {subscription.tier === 'cloud_monthly' && !subscription.cancelAtPeriodEnd && (
                  <button
                    onClick={handleUpgrade}
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-200"
                  >
                    <i className="fas fa-arrow-up mr-2"></i>
                    Upgrade to Annual
                  </button>
                )}
                {!subscription.cancelAtPeriodEnd && (
                  <button
                    onClick={handleCancelSubscription}
                    disabled={actionLoading}
                    className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 disabled:opacity-50"
                  >
                    <i className="fas fa-times mr-2"></i>
                    Cancel Subscription
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={handleUpgrade}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
              >
                <i className="fas fa-rocket mr-2"></i>
                Start Free Trial
              </button>
            )}
          </div>
        </div>

        {/* Features Card */}
        <div className="glass-tile rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Premium Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: 'Unlimited Assets', included: true },
              { name: 'Real-time Market Data', included: true },
              { name: 'Advanced Analytics', included: true },
              { name: 'Tax Calculations', included: true },
              { name: 'API Integrations', included: !!subscription },
              { name: 'Priority Support', included: !!subscription },
              { name: 'Multi-user Teams', included: !!subscription },
              { name: 'Mobile App Access', included: !!subscription },
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <i className={`fas ${feature.included ? 'fa-check-circle text-green-500' : 'fa-times-circle text-gray-400'}`}></i>
                <span className={feature.included ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-500'}>
                  {feature.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Method Card */}
        {subscription && (
          <div className="glass-tile rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Payment Method
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Manage your payment methods and billing information through the Stripe Customer Portal.
            </p>
            <button
              onClick={handleManageSubscription}
              disabled={actionLoading}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 disabled:opacity-50"
            >
              <i className="fas fa-credit-card mr-2"></i>
              Update Payment Method
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}