'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button/button';
import Link from 'next/link';
import { useState, useMemo } from 'react';

const container = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.2,
    },
  },
};

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

  const plans = useMemo(() => [
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
      gradient: 'from-emerald-500 to-teal-500',
      icon: 'fa-code'
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
      gradient: 'from-blue-500 to-purple-500',
      icon: 'fa-cloud'
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
      gradient: 'from-purple-500 to-pink-500',
      icon: 'fa-crown'
    },
  ], []);

  const featuresComparison = useMemo(() => [
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
  ], []);

  const faqs = useMemo(() => [
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
  ], []);

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent from-20% via-slate-50/40 to-indigo-100/60 dark:from-transparent dark:from-20% dark:via-slate-800/20 dark:to-indigo-900/30"></div>

      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div 
          className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-green-400 to-emerald-300 rounded-full opacity-30 dark:opacity-20 filter blur-3xl"
          animate={{
            x: [0, 50, -30, 0],
            y: [0, -30, 50, 0],
            scale: [1, 1.1, 0.9, 1],
          }}
          transition={{
            duration: 24,
            ease: "easeInOut",
            repeat: Infinity,
          }}
        />
        <motion.div 
          className="absolute top-1/4 -left-40 w-96 h-96 bg-gradient-to-tr from-blue-400 to-indigo-300 rounded-full opacity-30 dark:opacity-20 filter blur-3xl"
          animate={{
            x: [0, -40, 30, 0],
            y: [0, 40, -30, 0],
            scale: [1, 0.9, 1.1, 1],
          }}
          transition={{
            duration: 28,
            ease: "easeInOut",
            repeat: Infinity,
            delay: 4,
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
            duration: 30,
            ease: "easeInOut",
            repeat: Infinity,
            delay: 8,
          }}
        />
        <motion.div 
          className="absolute top-3/4 -right-40 w-96 h-96 bg-gradient-to-br from-cyan-400 to-teal-300 rounded-full opacity-25 dark:opacity-18 filter blur-3xl"
          animate={{
            x: [0, 45, -35, 0],
            y: [0, -35, 45, 0],
            scale: [1, 1.05, 0.95, 1],
          }}
          transition={{
            duration: 26,
            ease: "easeInOut",
            repeat: Infinity,
            delay: 6,
          }}
        />
        <motion.div 
          className="absolute bottom-10 left-1/4 w-80 h-80 bg-gradient-to-tr from-emerald-400 to-green-300 rounded-full opacity-25 dark:opacity-18 filter blur-3xl"
          animate={{
            x: [0, -40, 45, 0],
            y: [0, 45, -40, 0],
            scale: [1, 1.15, 0.85, 1],
          }}
          transition={{
            duration: 32,
            ease: "easeInOut",
            repeat: Infinity,
            delay: 12,
          }}
        />
      </div>

      <section className="relative min-h-screen flex items-center justify-center overflow-hidden z-10 pt-20">
        <motion.div
          className="relative z-10 px-6 sm:px-12 max-w-7xl mx-auto text-center"
          initial="hidden"
          animate="visible"
          variants={container}
        >
          <motion.h1 
            className="text-6xl sm:text-7xl lg:text-8xl font-black text-gray-900 dark:text-white mb-8 tracking-tight leading-none"
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
            className="text-xl sm:text-2xl text-gray-700 dark:text-gray-300 max-w-4xl mx-auto mb-16 leading-relaxed font-medium"
            variants={fadeUp}
          >
            Start free with self-hosting. Upgrade to cloud when you need collaboration and convenience.
          </motion.p>

          <motion.div 
            className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-600 dark:text-gray-400"
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

      <section className="relative -mt-32 px-6 sm:px-12 pb-32 z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={container}
          className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8"
        >
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              variants={fadeUp}
              className="group relative"
            >
              {plan.popular && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 rounded-3xl blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-500" />
              )}
              
              <div className={`relative glass-tile rounded-3xl border border-white/30 dark:border-white/20 shadow-2xl overflow-hidden group-hover:scale-105 transition-all duration-300 h-full ${
                plan.popular ? 'border-blue-500/50 dark:border-blue-400/50' : ''
              }`}>
                {plan.badge && (
                  <div className="absolute top-6 right-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg">
                    {plan.badge}
                  </div>
                )}
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-center text-sm font-bold py-3 shadow-lg">
                    <i className="fas fa-star mr-2"></i>
                    Most Popular
                  </div>
                )}
                
                <div className={`p-8 ${plan.popular ? 'pt-16' : 'pt-8'}`}>
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-16 h-16 bg-gradient-to-br ${plan.gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <i className={`fas ${plan.icon} text-2xl text-white`} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {plan.name}
                      </h3>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 dark:text-gray-300 mb-8 text-lg">
                    {plan.description}
                  </p>
                  
                  <div className="mb-8">
                    <span className="text-5xl font-black text-gray-900 dark:text-white">
                      {plan.price}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 ml-3 text-lg">
                      {plan.period}
                    </span>
                  </div>
                  
                  <ul className="space-y-4 mb-10">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0 ${
                          feature.included 
                            ? 'bg-green-500 shadow-lg' 
                            : 'bg-gray-300 dark:bg-gray-600'
                        }`}>
                          <i className={`fas ${
                            feature.included ? 'fa-check text-white text-xs' : 'fa-times text-gray-500 text-xs'
                          }`} />
                        </div>
                        <span className={`text-lg ${
                          feature.included 
                            ? 'text-gray-800 dark:text-gray-200' 
                            : 'text-gray-500 dark:text-gray-500 line-through'
                        }`}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                  
                  <Link
                    href={plan.ctaLink}
                    className={`w-full inline-flex items-center justify-center px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 hover:scale-105 shadow-xl ${
                      plan.popular
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white hover:shadow-blue-500/25'
                        : 'bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 text-white hover:shadow-gray-500/25'
                    }`}
                  >
                    {plan.cta}
                    <i className="fas fa-arrow-right ml-3" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section className="relative py-32 px-6 sm:px-12 z-10">
        <motion.div
          className="max-w-6xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={container}
        >
          <motion.div variants={fadeUp} className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Detailed Feature
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent"> Comparison</span>
            </h2>
            <p className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
              See exactly what&apos;s included in each plan to make the best choice for your needs.
            </p>
          </motion.div>
          
          <motion.div variants={fadeUp} className="glass-tile rounded-2xl border border-white/30 dark:border-white/20 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50">
                    <th className="text-left py-6 px-8 font-bold text-gray-900 dark:text-white text-lg">
                      Features
                    </th>
                    <th className="text-center py-6 px-6 font-bold text-gray-900 dark:text-white">
                      <div className="flex flex-col items-center gap-2">
                        <i className="fas fa-code text-emerald-500 text-xl"></i>
                        <span>Self-Hosted</span>
                      </div>
                    </th>
                    <th className="text-center py-6 px-6 font-bold text-gray-900 dark:text-white">
                      <div className="flex flex-col items-center gap-2">
                        <i className="fas fa-cloud text-blue-500 text-xl"></i>
                        <span>Cloud</span>
                      </div>
                    </th>
                    <th className="text-center py-6 px-6 font-bold text-gray-900 dark:text-white">
                      <div className="flex flex-col items-center gap-2">
                        <i className="fas fa-crown text-purple-500 text-xl"></i>
                        <span>Cloud Annual</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {featuresComparison.map((row, index) => (
                    <tr
                      key={index}
                      className="border-b border-white/10 dark:border-white/5 hover:bg-white/20 dark:hover:bg-white/5 transition-colors"
                    >
                      <td className="py-5 px-8 text-gray-800 dark:text-gray-200 font-medium text-lg">
                        {row.feature}
                      </td>
                      <td className="text-center py-5 px-6">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto ${
                          row.free ? 'bg-green-500 shadow-lg' : 'bg-gray-300 dark:bg-gray-600'
                        }`}>
                          <i className={`fas ${
                            row.free ? 'fa-check text-white' : 'fa-times text-gray-500'
                          } text-sm`} />
                        </div>
                      </td>
                      <td className="text-center py-5 px-6">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto ${
                          row.cloud ? 'bg-green-500 shadow-lg' : 'bg-gray-300 dark:bg-gray-600'
                        }`}>
                          <i className={`fas ${
                            row.cloud ? 'fa-check text-white' : 'fa-times text-gray-500'
                          } text-sm`} />
                        </div>
                      </td>
                      <td className="text-center py-5 px-6">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto ${
                          row.annual ? 'bg-green-500 shadow-lg' : 'bg-gray-300 dark:bg-gray-600'
                        }`}>
                          <i className={`fas ${
                            row.annual ? 'fa-check text-white' : 'fa-times text-gray-500'
                          } text-sm`} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </motion.div>
      </section>

      <section className="relative py-32 px-6 sm:px-12 z-10">
        <motion.div
          className="max-w-4xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={container}
        >
          <motion.div variants={fadeUp} className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Frequently Asked
              <span className="bg-gradient-to-r from-emerald-600 to-blue-600 dark:from-emerald-400 dark:to-blue-400 bg-clip-text text-transparent"> Questions</span>
            </h2>
            <p className="text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
              Everything you need to know about Profolio pricing and plans.
            </p>
          </motion.div>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                variants={fadeUp}
                className="glass-tile rounded-xl border border-white/30 dark:border-white/20 shadow-lg overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-white/20 dark:hover:bg-white/5 transition-colors group"
                >
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {faq.question}
                  </h3>
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                    <i className={`fas fa-chevron-down text-white text-sm transition-transform duration-300 ${openFaq === index ? 'rotate-180' : ''}`} />
                  </div>
                </button>
                {openFaq === index && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="px-8 pb-6"
                  >
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="relative py-32 px-6 sm:px-12 z-10">
        <motion.div
          className="max-w-5xl mx-auto text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <div className="glass-tile p-16 rounded-3xl border border-white/30 dark:border-white/20 shadow-2xl">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Start Your Financial
              <span className="bg-gradient-to-r from-emerald-600 to-blue-600 dark:from-emerald-400 dark:to-blue-400 bg-clip-text text-transparent"> Journey Today</span>
            </h2>
            <p className="text-xl text-gray-700 dark:text-gray-300 mb-10 max-w-3xl mx-auto">
              Join thousands who&apos;ve taken control of their wealth with Profolio. 
              Start free, upgrade when you&apos;re ready.
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
            <p className="text-sm text-gray-600 dark:text-gray-500 mt-8">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>
        </motion.div>
      </section>
    </div>
  );
}