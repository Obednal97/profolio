'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button/button';
import Link from 'next/link';
import { useState } from 'react';

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: 'easeOut' },
  },
};

const staggerChildren = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15 },
  },
};

const PLANS = [
  {
    name: 'Self-Hosted',
    price: '£0',
    period: 'forever',
    description: 'Full control on your infrastructure',
    features: [
      { text: 'Source available on GitHub', included: true },
      { text: 'Full feature access', included: true },
      { text: 'Local or cloud self-hosting', included: true },
      { text: 'Community support', included: true },
      { text: 'Cloud sync & collaboration', included: false },
      { text: 'Automated updates', included: false },
    ],
    cta: 'Get Started',
    ctaLink: 'https://github.com/profolio/profolio#installation',
    popular: false,
  },
  {
    name: 'Cloud',
    price: '£9.99',
    period: 'per user/month',
    description: 'Fully managed with premium features',
    features: [
      { text: 'Everything in Self-Hosted', included: true },
      { text: 'Fully managed hosting', included: true },
      { text: 'Multi-user collaboration', included: true },
      { text: 'Automated backups', included: true },
      { text: 'Priority email support', included: true },
      { text: 'Custom alerts & webhooks', included: true },
    ],
    cta: 'Start Free Trial',
    ctaLink: '/auth/signUp',
    popular: true,
  },
  {
    name: 'Cloud Annual',
    price: '£95.90',
    period: 'per user/year',
    description: 'Best value with annual discount',
    features: [
      { text: 'Everything in Cloud', included: true },
      { text: '20% annual discount', included: true },
      { text: 'Priority support', included: true },
      { text: 'Early access to features', included: true },
      { text: 'Custom integrations', included: true },
      { text: 'Dedicated account manager', included: true },
    ],
    cta: 'Start Free Trial',
    ctaLink: '/auth/signUp',
    popular: false,
    badge: '20% OFF',
  },
];

const FEATURES_COMPARISON = [
  { feature: 'Net Worth Dashboard', free: true, cloud: true, annual: true },
  { feature: 'Asset & Liability Tracking', free: true, cloud: true, annual: true },
  { feature: 'Tax Buffer Calculations', free: true, cloud: true, annual: true },
  { feature: 'Manual Data Entry', free: true, cloud: true, annual: true },
  { feature: 'Self-Hosted Deployment', free: true, cloud: false, annual: false },
  { feature: 'Cloud Hosting', free: false, cloud: true, annual: true },
  { feature: 'Automated Syncing', free: false, cloud: true, annual: true },
  { feature: 'Multi-User Access', free: false, cloud: true, annual: true },
  { feature: 'Email Alerts', free: false, cloud: true, annual: true },
  { feature: 'API Access', free: false, cloud: true, annual: true },
  { feature: 'Priority Support', free: false, cloud: false, annual: true },
];

const FAQS = [
  {
    question: 'What is included in the Self-Hosted tier?',
    answer: 'The Self-Hosted tier includes access to the full Profolio codebase via GitHub. You get all core features including net worth tracking, asset management, and tax calculations. You can install and run it on your own infrastructure with complete control over your data.',
  },
  {
    question: 'Can I switch between plans?',
    answer: 'Yes! You can start with self-hosted and upgrade to cloud anytime. Your data migrates seamlessly. You can also switch between monthly and annual billing, or downgrade if needed.',
  },
  {
    question: 'How secure is the cloud version?',
    answer: 'Very secure. We use bank-level encryption for all data in transit and at rest. Your financial data is isolated in encrypted environments with strict access controls. We never sell or share your data, and you can export it anytime.',
  },
  {
    question: 'Do you offer refunds?',
    answer: 'Yes. We offer a 30-day money-back guarantee for all paid plans. If you&apos;re not satisfied, contact us for a full refund. For annual plans, we also offer pro-rated refunds after 30 days.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards, debit cards, and bank transfers for annual plans. Payments are processed securely through Stripe.',
  },
];

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        
        {/* Multi-layer fade for smooth transition */}
        <div className="absolute bottom-0 left-0 right-0 h-64 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-t from-gray-50 via-gray-50/95 via-gray-50/80 via-gray-50/60 via-gray-50/40 via-gray-50/20 via-gray-50/10 to-transparent dark:from-gray-900 dark:via-gray-900/95 dark:via-gray-900/80 dark:via-gray-900/60 dark:via-gray-900/40 dark:via-gray-900/20 dark:via-gray-900/10 dark:to-transparent" />
        </div>
        
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerChildren}
          className="relative z-10 px-6 sm:px-12 py-24 max-w-6xl mx-auto"
        >
          <motion.div variants={fadeUp} className="text-center mb-16">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">
              Simple, Transparent <span className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">Pricing</span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Start free with self-hosting. Upgrade to cloud when you need collaboration and convenience.
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* Pricing Cards */}
      <section className="px-6 sm:px-12 -mt-8 pb-20 bg-gray-50 dark:bg-gray-900">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerChildren}
          className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8"
        >
          {PLANS.map((plan, index) => (
            <motion.div
              key={index}
              variants={fadeUp}
              className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden ${
                plan.popular ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''
              }`}
            >
              {plan.badge && (
                <div className="absolute top-4 right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  {plan.badge}
                </div>
              )}
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-center text-sm font-medium py-2">
                  Most Popular
                </div>
              )}
              <div className={`p-8 ${plan.popular ? 'pt-12' : ''}`}>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {plan.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {plan.description}
                </p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    {plan.price}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 ml-2">
                    {plan.period}
                  </span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <i
                        className={`fas ${
                          feature.included ? 'fa-check text-green-500' : 'fa-times text-gray-400'
                        } mt-0.5`}
                      />
                      <span className={feature.included ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  size="lg"
                  className={`w-full ${
                    plan.popular
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                      : 'bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white'
                  }`}
                >
                  <Link href={plan.ctaLink} className="flex items-center justify-center">
                    {plan.cta}
                    <i className="fas fa-arrow-right ml-2" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Feature Comparison */}
      <section className="py-20 px-6 sm:px-12 bg-white dark:bg-gray-800">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerChildren}
          className="max-w-5xl mx-auto"
        >
          <motion.h2 
            variants={fadeUp}
            className="text-3xl sm:text-4xl font-bold text-center text-gray-900 dark:text-white mb-16"
          >
            Detailed Feature Comparison
          </motion.h2>
          
          <motion.div variants={fadeUp} className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-4 px-4 font-medium text-gray-900 dark:text-white">
                    Features
                  </th>
                  <th className="text-center py-4 px-4 font-medium text-gray-900 dark:text-white">
                    Self-Hosted
                  </th>
                  <th className="text-center py-4 px-4 font-medium text-gray-900 dark:text-white">
                    Cloud
                  </th>
                  <th className="text-center py-4 px-4 font-medium text-gray-900 dark:text-white">
                    Cloud Annual
                  </th>
                </tr>
              </thead>
              <tbody>
                {FEATURES_COMPARISON.map((row, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-100 dark:border-gray-700/50"
                  >
                    <td className="py-4 px-4 text-gray-700 dark:text-gray-300">
                      {row.feature}
                    </td>
                    <td className="text-center py-4 px-4">
                      {row.free ? (
                        <i className="fas fa-check text-green-500 text-lg" />
                      ) : (
                        <i className="fas fa-times text-gray-400 text-lg" />
                      )}
                    </td>
                    <td className="text-center py-4 px-4">
                      {row.cloud ? (
                        <i className="fas fa-check text-green-500 text-lg" />
                      ) : (
                        <i className="fas fa-times text-gray-400 text-lg" />
                      )}
                    </td>
                    <td className="text-center py-4 px-4">
                      {row.annual ? (
                        <i className="fas fa-check text-green-500 text-lg" />
                      ) : (
                        <i className="fas fa-times text-gray-400 text-lg" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </motion.div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6 sm:px-12">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerChildren}
          className="max-w-3xl mx-auto"
        >
          <motion.h2 
            variants={fadeUp}
            className="text-3xl sm:text-4xl font-bold text-center text-gray-900 dark:text-white mb-16"
          >
            Frequently Asked Questions
          </motion.h2>
          
          <div className="space-y-4">
            {FAQS.map((faq, index) => (
              <motion.div
                key={index}
                variants={fadeUp}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {faq.question}
                  </h3>
                  <i className={`fas fa-chevron-down text-gray-500 transition-transform ${openFaq === index ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 sm:px-12 bg-gray-50 dark:bg-gray-900/50">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="p-12 bg-white dark:bg-gray-800 rounded-3xl shadow-xl">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Start Your Financial Journey Today
            </h2>
            <p className="text-xl text-gray-700 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands who&apos;ve taken control of their wealth with Profolio. 
              Start free, upgrade when you&apos;re ready.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" variant="outline" className="text-lg px-8 py-6">
                <Link href="https://github.com/profolio/profolio">
                  <i className="fab fa-github mr-2" />
                  View on GitHub
                </Link>
              </Button>
              <Button asChild size="lg" className="text-lg px-8 py-6">
                <Link href="/auth/signUp">
                  Start Free Trial
                  <i className="fas fa-arrow-right ml-2" />
                </Link>
              </Button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-500 mt-6">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>
        </motion.div>
      </section>
    </main>
  );
}