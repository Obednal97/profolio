'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button/button';
import Link from 'next/link';
import { useState, useMemo, useRef } from 'react';

const fadeUp = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

const container = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 1,
      ease: 'easeOut',
    },
  },
};

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activePlan, setActivePlan] = useState(1); // Default to Cloud (most popular)
  const carouselRef = useRef<HTMLDivElement>(null);

  const plans = useMemo(() => [
    {
      name: 'Self-Hosted',
      price: '£0',
      period: 'forever',
      description: 'Full control on your infrastructure',
      icon: 'fa-code',
      gradient: 'from-emerald-500 to-teal-500',
      features: [
        'Unlimited assets & portfolios',
        'Real-time market data',
        'Advanced analytics & charts',
        'Tax calculations',
        'Data export & backup',
        'Community support',
        'Docker deployment',
        'Self-hosted security',
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
      icon: 'fa-cloud',
      gradient: 'from-blue-500 to-purple-500',
      features: [
        'Everything in Self-Hosted',
        'Automatic backups',
        'API integrations',
        'Multi-user collaboration',
        'Advanced tax features',
        'Priority support',
        'Mobile app',
        'SSO integration',
        'Custom integrations',
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
      icon: 'fa-crown',
      gradient: 'from-purple-500 to-pink-500',
      features: [
        'Everything in Cloud',
        '20% annual discount',
        'Extended trial period',
        'Dedicated account manager',
        'Custom feature requests',
        'On-premise consulting',
      ],
      cta: 'Start Free Trial',
      ctaLink: '/auth/signUp',
      popular: false,
      badge: '20% OFF',
    },
  ], []);

  const featureComparison = useMemo(() => [
    { feature: 'Unlimited Assets', selfHosted: true, cloud: true, annual: true },
    { feature: 'Real-time Data', selfHosted: true, cloud: true, annual: true },
    { feature: 'Advanced Analytics', selfHosted: true, cloud: true, annual: true },
    { feature: 'Tax Calculations', selfHosted: true, cloud: true, annual: true },
    { feature: 'Automatic Backups', selfHosted: false, cloud: true, annual: true },
    { feature: 'API Integrations', selfHosted: false, cloud: true, annual: true },
    { feature: 'Multi-user Teams', selfHosted: false, cloud: true, annual: true },
    { feature: 'Mobile App', selfHosted: false, cloud: true, annual: true },
    { feature: 'Priority Support', selfHosted: false, cloud: true, annual: true },
    { feature: 'SSO Integration', selfHosted: false, cloud: true, annual: true },
    { feature: 'Dedicated Manager', selfHosted: false, cloud: false, annual: true },
    { feature: 'Custom Features', selfHosted: false, cloud: false, annual: true },
  ], []);

  const faqs = useMemo(() => [
    {
      question: "What's the difference between self-hosted and cloud?",
      answer: 'Self-hosted gives you complete control - deploy on your own servers with full data ownership. Cloud is our managed service with automatic updates, backups, and premium features.',
    },
    {
      question: 'Can I migrate from self-hosted to cloud later?',
      answer: 'Yes! We provide migration tools to seamlessly move your data from self-hosted to our cloud platform. Your historical data and settings are preserved.',
    },
    {
      question: 'Do you offer refunds?',
      answer: "Absolutely. We offer a 30-day money-back guarantee for all cloud plans. If you're not satisfied, we'll refund your payment in full.",
    },
    {
      question: 'How does the free trial work?',
      answer: 'Start with a 14-day free trial of our cloud plan - no credit card required. You get full access to all features during the trial period.',
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, PayPal, and bank transfers for annual plans. All payments are processed securely through Stripe.',
    },
  ], []);

  const scrollToCard = (index: number) => {
    if (carouselRef.current) {
      const cardWidth = carouselRef.current.clientWidth * 0.75;
      const scrollPosition = index * cardWidth - (carouselRef.current.clientWidth - cardWidth) / 2;
      carouselRef.current.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
      setActivePlan(index);
    }
  };

  return (
    <div className="relative min-h-screen scroll-smooth lg:scroll-auto" style={{ scrollSnapType: 'y mandatory' }}>
      {/* Simple background - transparent at top, gradient starts below header */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent from-20% via-slate-50/40 to-indigo-100/60 dark:from-transparent dark:from-20% dark:via-slate-800/20 dark:to-indigo-900/30"></div>

      {/* Full-page animated background - covers entire page behind header and footer */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Primary gradient orbs - positioned across entire page height */}
        <motion.div 
          className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400 to-purple-300 rounded-full opacity-30 dark:opacity-20 filter blur-3xl"
          animate={{
            x: [0, 40, -20, 0],
            y: [0, -20, 40, 0],
            scale: [1, 1.1, 0.9, 1],
          }}
          transition={{
            duration: 22,
            ease: "easeInOut",
            repeat: Infinity,
          }}
        />
        <motion.div 
          className="absolute top-1/4 -left-40 w-96 h-96 bg-gradient-to-tr from-emerald-400 to-blue-300 rounded-full opacity-30 dark:opacity-20 filter blur-3xl"
          animate={{
            x: [0, -30, 40, 0],
            y: [0, 40, -30, 0],
            scale: [1, 0.9, 1.1, 1],
          }}
          transition={{
            duration: 26,
            ease: "easeInOut",
            repeat: Infinity,
            delay: 3,
          }}
        />
        <motion.div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-400 to-pink-300 rounded-full opacity-20 dark:opacity-15 filter blur-3xl"
          animate={{
            x: [0, 30, -30, 0],
            y: [0, -30, 30, 0],
            scale: [1, 1.2, 0.8, 1],
          }}
          transition={{
            duration: 28,
            ease: "easeInOut",
            repeat: Infinity,
            delay: 6,
          }}
        />
        <motion.div 
          className="absolute top-3/4 -right-40 w-96 h-96 bg-gradient-to-br from-cyan-400 to-teal-300 rounded-full opacity-25 dark:opacity-18 filter blur-3xl"
          animate={{
            x: [0, 55, -35, 0],
            y: [0, -35, 55, 0],
            scale: [1, 1.05, 0.95, 1],
          }}
          transition={{
            duration: 30,
            ease: "easeInOut",
            repeat: Infinity,
            delay: 8,
          }}
        />
        <motion.div 
          className="absolute bottom-10 left-1/4 w-80 h-80 bg-gradient-to-tr from-indigo-400 to-blue-300 rounded-full opacity-25 dark:opacity-18 filter blur-3xl"
          animate={{
            x: [0, -25, 50, 0],
            y: [0, 50, -25, 0],
            scale: [1, 1.15, 0.85, 1],
          }}
          transition={{
            duration: 34,
            ease: "easeInOut",
            repeat: Infinity,
            delay: 10,
          }}
        />
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen lg:min-h-0 flex items-center justify-center lg:block overflow-hidden z-10 py-8 sm:py-12 lg:py-20" style={{ scrollSnapAlign: 'start' }}>
        <motion.div
          className="relative z-10 px-6 sm:px-12 max-w-7xl mx-auto text-center"
          initial="hidden"
          animate="visible"
          variants={container}
        >
          <motion.h1 
            className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black text-gray-900 dark:text-white mb-4 sm:mb-6 lg:mb-8 tracking-tight leading-none"
            variants={fadeUp}
          >
            Simple,
            <br />
            <span className="bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 dark:from-emerald-400 dark:via-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              Transparent
            </span>
            <br />
            Pricing
          </motion.h1>
          
          <motion.p
            className="text-lg sm:text-xl lg:text-2xl text-gray-700 dark:text-gray-300 max-w-4xl mx-auto mb-8 sm:mb-12 lg:mb-16 leading-relaxed font-medium"
            variants={fadeUp}
          >
            Start free with self-hosting. Upgrade to cloud when you need collaboration and convenience.
          </motion.p>

          {/* Trust indicators */}
          <motion.div 
            className="flex flex-wrap justify-center items-center gap-6 sm:gap-8 text-sm text-gray-600 dark:text-gray-400"
            variants={fadeIn}
          >
            <div className="flex items-center gap-2">
              <i className="fas fa-code text-emerald-500"></i>
              <span>Open source</span>
            </div>
            <div className="flex items-center gap-2">
              <i className="fas fa-credit-card text-blue-500"></i>
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <i className="fas fa-undo text-purple-500"></i>
              <span>30-day money back</span>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Pricing Carousel Section */}
      <section className="relative min-h-screen lg:min-h-0 flex items-center justify-center lg:block overflow-hidden z-10 py-8 sm:py-12 lg:py-20" style={{ scrollSnapAlign: 'start' }}>
        <motion.div
          className="relative z-10 w-full"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={container}
        >
          <motion.div variants={fadeUp} className="text-center mb-12 sm:mb-16 px-6 sm:px-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6 sm:mb-8">
              Choose Your
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent"> Plan</span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
              Self-host for free or upgrade to cloud for premium features and convenience.
            </p>
          </motion.div>

          {/* Horizontal Carousel */}
          <motion.div variants={fadeUp} className="relative">
            {/* Navigation dots */}
            <div className="flex justify-center gap-3 mb-8">
              {plans.map((_, index) => (
                <button
                  key={index}
                  onClick={() => scrollToCard(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    activePlan === index 
                      ? 'bg-blue-500 scale-125' 
                      : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                  }`}
                />
              ))}
            </div>

            {/* Scrollable container - increased bottom padding for glow */}
            <div 
              ref={carouselRef}
              className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide pt-12 pb-16 px-6 sm:px-12"
              style={{ 
                scrollSnapType: 'x mandatory',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
              onScroll={(e) => {
                const scrollLeft = e.currentTarget.scrollLeft;
                const cardWidth = e.currentTarget.clientWidth * 0.75;
                const newIndex = Math.round(scrollLeft / cardWidth);
                if (newIndex !== activePlan && newIndex >= 0 && newIndex < plans.length) {
                  setActivePlan(newIndex);
                }
              }}
            >
              {plans.map((plan, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 w-[75vw] sm:w-[60vw] lg:w-[40vw] max-w-sm mx-auto"
                  style={{ scrollSnapAlign: 'center' }}
                >
                  <div className="relative group h-full">
                    {/* Container for card and badges to scale together */}
                    <div className={`relative transition-all duration-500 ${
                      activePlan === index ? 'scale-105' : 'hover:scale-[1.02]'
                    }`}>
                      {/* Popular banner - now scales with card */}
                      {plan.popular && (
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-20">
                          <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-center text-sm font-bold py-2 px-6 rounded-full shadow-xl">
                            <i className="fas fa-star mr-2"></i>
                            Most Popular
                          </div>
                        </div>
                      )}
                      
                      {/* Badge for discount - now scales with card */}
                      {plan.badge && (
                        <div className="absolute top-4 right-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg z-20">
                          {plan.badge}
                        </div>
                      )}
                      
                      {/* Main card with proper rounded ring */}
                      <div className={`glass-tile rounded-3xl border overflow-hidden h-full flex flex-col transition-all duration-500 ${
                        plan.popular 
                          ? 'border-blue-500/50 dark:border-blue-400/50' 
                          : 'border-white/30 dark:border-white/20'
                      } ${
                        activePlan === index
                          ? 'shadow-2xl shadow-blue-500/30 dark:shadow-blue-400/20 ring-2 ring-blue-500/50 dark:ring-blue-400/30 ring-offset-0'
                          : 'shadow-lg hover:shadow-xl'
                      }`}
                      style={{
                        // Ensure ring matches border radius
                        ...(activePlan === index && {
                          borderRadius: '1.5rem', // rounded-3xl = 1.5rem
                          '--tw-ring-offset-width': '0px'
                        })
                      }}>
                        
                        {/* Active card glow effect */}
                        {activePlan === index && (
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 rounded-3xl pointer-events-none" />
                        )}
                        
                        {/* Card content with consistent spacing */}
                        <div className="p-6 sm:p-8 flex-1 flex flex-col relative z-10">
                          <div className="flex items-center gap-4 mb-6">
                            <div className={`w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br ${plan.gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                              <i className={`fas ${plan.icon} text-xl sm:text-2xl text-white`} />
                            </div>
                            <div>
                              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                                {plan.name}
                              </h3>
                            </div>
                          </div>
                          
                          <p className="text-gray-700 dark:text-gray-300 mb-6 text-base sm:text-lg">
                            {plan.description}
                          </p>
                          
                          <div className="mb-6">
                            <span className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white">
                              {plan.price}
                            </span>
                            <span className="text-gray-600 dark:text-gray-400 ml-2 text-base sm:text-lg">
                              {plan.period}
                            </span>
                          </div>

                          <ul className="space-y-3 mb-6 flex-1">
                            {plan.features.map((feature, featureIndex) => (
                              <li key={featureIndex} className="flex items-start gap-3">
                                <div className="w-4 h-4 sm:w-5 sm:h-5 bg-green-500 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                                  <i className="fas fa-check text-white text-xs" />
                                </div>
                                <span className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm">{feature}</span>
                              </li>
                            ))}
                          </ul>
                          
                          <Link
                            href={plan.ctaLink}
                            className={`w-full inline-flex items-center justify-center px-6 py-3 sm:px-8 sm:py-4 rounded-xl font-bold text-base sm:text-lg transition-all duration-300 hover:scale-105 ${
                              plan.popular 
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
                                : 'bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 text-white shadow-md hover:shadow-lg'
                            }`}
                          >
                            {plan.cta}
                            <i className="fas fa-arrow-right ml-2 sm:ml-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation arrows for larger screens */}
            <div className="hidden lg:block">
              <button
                onClick={() => scrollToCard(Math.max(0, activePlan - 1))}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-full flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-white/30 dark:hover:bg-white/20 transition-all duration-300 shadow-lg"
                disabled={activePlan === 0}
              >
                <i className="fas fa-chevron-left" />
              </button>
              <button
                onClick={() => scrollToCard(Math.min(plans.length - 1, activePlan + 1))}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-full flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-white/30 dark:hover:bg-white/20 transition-all duration-300 shadow-lg"
                disabled={activePlan === plans.length - 1}
              >
                <i className="fas fa-chevron-right" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Feature Comparison Section - reduced top padding */}
      <section className="relative min-h-screen lg:min-h-0 flex items-center justify-center lg:block overflow-hidden z-10 py-4 sm:py-8 lg:py-20" style={{ scrollSnapAlign: 'start' }}>
        <motion.div
          className="relative z-10 px-6 sm:px-12 max-w-6xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={container}
        >
          <motion.div variants={fadeUp} className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6 sm:mb-8">
              Feature
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent"> Comparison</span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
              See exactly what&apos;s included in each plan to make the right choice for your needs.
            </p>
          </motion.div>

          <motion.div variants={fadeUp} className="relative group">
            <div className="glass-tile rounded-3xl border border-white/30 dark:border-white/20 shadow-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200/50 dark:border-gray-700/50 bg-white/20 dark:bg-white/5">
                      <th className="text-left p-4 sm:p-6 text-sm sm:text-lg font-bold text-gray-900 dark:text-white">Features</th>
                      <th className="text-center p-4 sm:p-6 text-sm sm:text-lg font-bold text-gray-900 dark:text-white">Self-Hosted</th>
                      <th className="text-center p-4 sm:p-6 text-sm sm:text-lg font-bold text-gray-900 dark:text-white">Cloud</th>
                      <th className="text-center p-4 sm:p-6 text-sm sm:text-lg font-bold text-gray-900 dark:text-white">Annual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {featureComparison.map((item, index) => (
                      <tr key={index} className="border-b border-gray-100/50 dark:border-gray-800/50 last:border-0 hover:bg-white/10 dark:hover:bg-white/5 transition-colors duration-200">
                        <td className="p-4 sm:p-6 text-gray-700 dark:text-gray-300 font-medium text-sm sm:text-base">{item.feature}</td>
                        <td className="p-4 sm:p-6 text-center">
                          {item.selfHosted ? (
                            <i className="fas fa-check text-green-500 text-lg sm:text-xl" />
                          ) : (
                            <i className="fas fa-times text-gray-400 text-lg sm:text-xl" />
                          )}
                        </td>
                        <td className="p-4 sm:p-6 text-center">
                          {item.cloud ? (
                            <i className="fas fa-check text-green-500 text-lg sm:text-xl" />
                          ) : (
                            <i className="fas fa-times text-gray-400 text-lg sm:text-xl" />
                          )}
                        </td>
                        <td className="p-4 sm:p-6 text-center">
                          {item.annual ? (
                            <i className="fas fa-check text-green-500 text-lg sm:text-xl" />
                          ) : (
                            <i className="fas fa-times text-gray-400 text-lg sm:text-xl" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* FAQ Section */}
      <section className="relative min-h-screen lg:min-h-0 flex items-center justify-center lg:block overflow-hidden z-10 py-8 sm:py-12 lg:py-20" style={{ scrollSnapAlign: 'start' }}>
        <motion.div
          className="relative z-10 px-6 sm:px-12 max-w-4xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={container}
        >
          <motion.div variants={fadeUp} className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6 sm:mb-8">
              Pricing
              <span className="bg-gradient-to-r from-emerald-600 to-blue-600 dark:from-emerald-400 dark:to-blue-400 bg-clip-text text-transparent"> FAQ</span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-300">
              Common questions about our pricing and plans.
            </p>
          </motion.div>

          <motion.div variants={fadeUp} className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="glass-tile rounded-2xl border border-white/30 dark:border-white/20 shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 sm:px-8 py-6 text-left flex items-center justify-between hover:bg-white/10 dark:hover:bg-white/5 transition-colors duration-200"
                >
                  <span className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white pr-4">
                    {faq.question}
                  </span>
                  <motion.i 
                    className={`fas fa-chevron-down text-gray-500 dark:text-gray-400 flex-shrink-0`}
                    animate={{ rotate: openFaq === index ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  />
                </button>
                <motion.div
                  initial={false}
                  animate={{
                    height: openFaq === index ? "auto" : 0,
                    opacity: openFaq === index ? 1 : 0
                  }}
                  transition={{
                    height: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
                    opacity: { duration: 0.3, ease: "easeInOut" }
                  }}
                  className="overflow-hidden"
                >
                  <div className="px-6 sm:px-8 pb-6">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
                      {faq.answer}
                    </p>
                  </div>
                </motion.div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Final CTA Section */}
      <section className="relative min-h-screen lg:min-h-0 flex items-center justify-center lg:block overflow-hidden z-10 py-8 sm:py-12 lg:py-20" style={{ scrollSnapAlign: 'start' }}>
        <motion.div
          className="relative z-10 px-6 sm:px-12 max-w-5xl mx-auto text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <div className="glass-tile p-12 sm:p-16 lg:p-20 rounded-3xl border border-white/30 dark:border-white/20 shadow-2xl">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6 sm:mb-8">
              Start Your Financial
              <span className="bg-gradient-to-r from-emerald-600 to-blue-600 dark:from-emerald-400 dark:to-blue-400 bg-clip-text text-transparent"> Journey Today</span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-300 mb-10 sm:mb-12 max-w-3xl mx-auto">
              Join thousands who have taken control of their wealth with Profolio. Start free, upgrade when you&apos;re ready.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button asChild size="lg" variant="outline" className="text-lg px-10 py-6 glass-tile border-white/30 dark:border-white/20 hover:bg-white/20 dark:hover:bg-white/10">
                <Link href="https://github.com/profolio/profolio">
                  <i className="fab fa-github mr-3" />
                  View on GitHub
                  <i className="fas fa-external-link-alt ml-3" />
                </Link>
              </Button>
              <Button asChild size="lg" className="text-lg px-10 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105">
                <Link href="/auth/signUp">
                  <i className="fas fa-rocket mr-3" />
                  Start Free Trial
                  <i className="fas fa-arrow-right ml-3" />
                </Link>
              </Button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-500 mt-10">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>
        </motion.div>
      </section>

      {/* Custom CSS for hiding scrollbar */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}