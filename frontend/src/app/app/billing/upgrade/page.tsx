'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
// import { loadStripe } from '@stripe/stripe-js';
import { apiClient } from '@/lib/api-client';
import { logger } from '@/lib/logger';

// Initialize Stripe - commented out as it's not currently used
// const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

export default function UpgradePage() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<'cloud_monthly' | 'cloud_annual'>('cloud_monthly');
  const [loading, setLoading] = useState(false);

  const plans = [
    {
      id: 'cloud_monthly',
      name: 'Cloud Monthly',
      price: '£9.99',
      period: 'per month',
      description: 'Perfect for getting started',
      features: [
        'All premium features',
        'Priority support',
        'API integrations',
        'Multi-user teams',
        'Mobile app access',
        'Automatic backups',
        'Cancel anytime',
      ],
      popular: false,
    },
    {
      id: 'cloud_annual',
      name: 'Cloud Annual',
      price: '£95.90',
      period: 'per year',
      description: 'Best value - save 20%',
      features: [
        'Everything in Monthly',
        '20% annual discount',
        'Extended support',
        'Priority feature requests',
        'Dedicated account manager',
        'Custom integrations',
        'Annual commitment',
      ],
      popular: true,
      savings: 'Save £24 per year',
    },
  ];

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const response = await apiClient.post('/api/billing/checkout', {
        priceId: selectedPlan,
      });

      if (response.data?.url) {
        // Redirect to Stripe Checkout
        window.location.href = response.data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      logger.error('Failed to create checkout session:', error);
      alert('Failed to start checkout. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Start with a 14-day free trial. Cancel anytime.
          </p>
          <div className="flex justify-center items-center gap-6 mt-6 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <i className="fas fa-check-circle text-green-500"></i>
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <i className="fas fa-credit-card text-blue-500"></i>
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <i className="fas fa-undo text-purple-500"></i>
              <span>30-day money back</span>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {plans.map((plan) => (
            <motion.div
              key={plan.id}
              whileHover={{ scale: 1.02 }}
              className={`relative glass-tile rounded-2xl p-6 cursor-pointer transition-all duration-200 ${
                selectedPlan === plan.id
                  ? 'ring-2 ring-blue-500 shadow-xl'
                  : 'hover:shadow-lg'
              }`}
              onClick={() => setSelectedPlan(plan.id as 'cloud_monthly' | 'cloud_annual')}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-bold py-1 px-4 rounded-full">
                    Most Popular
                  </div>
                </div>
              )}

              {/* Radio button */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 ${
                    selectedPlan === plan.id
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300 dark:border-gray-600'
                  } flex items-center justify-center`}>
                    {selectedPlan === plan.id && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {plan.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {plan.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="mb-6">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  {plan.price}
                </span>
                <span className="text-gray-600 dark:text-gray-400 ml-2">
                  {plan.period}
                </span>
                {plan.savings && (
                  <div className="mt-2">
                    <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-sm font-medium px-3 py-1 rounded-full">
                      {plan.savings}
                    </span>
                  </div>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <i className="fas fa-check text-green-500 mt-0.5"></i>
                    <span className="text-gray-700 dark:text-gray-300 text-sm">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => router.push('/app/billing')}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back
          </button>
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50"
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Processing...
              </>
            ) : (
              <>
                <i className="fas fa-rocket mr-2"></i>
                Start Free Trial
              </>
            )}
          </button>
        </div>

        {/* Trust badges */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
            Trusted by thousands of users worldwide
          </p>
          <div className="flex justify-center items-center gap-8">
            <div className="flex items-center gap-2 text-gray-400">
              <i className="fas fa-shield-alt text-2xl"></i>
              <span className="text-sm">Secure Payments</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <i className="fab fa-stripe text-3xl"></i>
              <span className="text-sm">Powered by Stripe</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <i className="fas fa-lock text-2xl"></i>
              <span className="text-sm">SSL Encrypted</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}