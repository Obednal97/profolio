'use client';

import { motion, useAnimationFrame } from 'framer-motion';
import { useState } from 'react';
import { Button } from '@/components/ui/button/button';
import Link from 'next/link';

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: 'easeOut',
    },
  },
};

const staggerChildren = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const getLiveNetWorth = () => {
  const base = 700_000; // Start at 700k
  const ratePerSecond = 0.01; // +0.01 per second
  const now = Math.floor(Date.now() / 1000);
  return base + ratePerSecond * (now - 1700000000);
};

const formatCompactNumber = (num: number) =>
  Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(num);

const STEPS = [
  {
    number: '01',
    title: 'Connect Your Assets',
    description: 'Link bank accounts, crypto wallets, investment portfolios, and real estate. Everything syncs automatically.',
    icon: 'fa-link',
  },
  {
    number: '02',
    title: 'Set Your Parameters',
    description: 'Configure tax rates, set financial goals, and customize alerts. Profolio adapts to your unique situation.',
    icon: 'fa-sliders-h',
  },
  {
    number: '03',
    title: 'Get Real-Time Insights',
    description: 'Watch your net worth update in real-time. Track trends, spot opportunities, and make informed decisions.',
    icon: 'fa-chart-line',
  },
];

const FEATURES = [
  {
    icon: 'fa-brain',
    title: 'Smart Tax Buffers',
    description: 'Set tax buffers per asset type, so you&apos;re never caught off guard by capital gains or income tax.',
  },
  {
    icon: 'fa-bell',
    title: 'Intelligent Alerts',
    description: 'Get notified about price movements, portfolio milestones, and opportunities that matter to you.',
  },
  {
    icon: 'fa-shield-alt',
    title: 'Bank-Level Security',
    description: 'Your data is encrypted end-to-end. Self-host for complete control or use our secure cloud.',
  },
  {
    icon: 'fa-puzzle-piece',
    title: 'Extensible Platform',
    description: 'Built modular from day one. Add custom integrations, scripts, and automations as you grow.',
  },
];

const TESTIMONIALS = [
  {
    quote: 'Finally, something built for founders who understand spreadsheets but want something better.',
    author: 'Michael Chen',
    role: 'Serial Entrepreneur',
  },
  {
    quote: 'Profolio gave me clarity over my crypto, equity, and mortgage in one beautiful interface.',
    author: 'Sarah Williams',
    role: 'Tech Executive',
  },
  {
    quote: 'It feels like Notion and my bank had a very secure, very smart baby.',
    author: 'David Park',
    role: 'Crypto Investor',
  },
];

const FAQS = [
  {
    question: 'Can I host this myself?',
    answer: 'Yes! The core is open source and deployable via Docker. You maintain complete control over your data and infrastructure.',
  },
  {
    question: 'Is my data private?',
    answer: 'Absolutely. Your financial data is encrypted end-to-end. Whether self-hosted or cloud, you control who has access.',
  },
  {
    question: 'What integrations are supported?',
    answer: 'We support major banks via Plaid, crypto wallets, stock brokers, and real estate platforms. More added monthly.',
  },
  {
    question: 'How does pricing work?',
    answer: 'Self-hosted is free forever. Cloud hosting starts at £9.99/month with automated syncing and premium features.',
  },
];

export default function HowItWorksPage() {
  const [liveNetWorth, setLiveNetWorth] = useState(getLiveNetWorth());
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useAnimationFrame(() => {
    setLiveNetWorth(getLiveNetWorth());
  });

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" />
        
        {/* Animated blobs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 right-20 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-3xl opacity-20 dark:opacity-10 animate-blob" />
          <div className="absolute bottom-20 left-20 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-3xl opacity-20 dark:opacity-10 animate-blob animation-delay-2000" />
        </div>

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
              How <span className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">Profolio</span> Works
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              From scattered spreadsheets to complete financial clarity in minutes. 
              See how Profolio transforms your wealth management.
            </p>
          </motion.div>

          {/* Live Demo */}
          <motion.div variants={fadeUp} className="relative group max-w-2xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-xl opacity-20 dark:opacity-30 group-hover:opacity-30 dark:group-hover:opacity-40 transition-opacity" />
            <div className="relative p-8 bg-white dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl">
              <div className="flex items-center justify-center gap-3 mb-4">
                <i className="fas fa-chart-line text-2xl text-blue-600 dark:text-blue-400" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Live Portfolio Demo</h2>
              </div>
              <p className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
                ${formatCompactNumber(liveNetWorth)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="text-green-600 dark:text-green-400">↑ Growing</span> in real-time • Updated every second
              </p>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Steps Section */}
      <section className="py-20 px-6 sm:px-12">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerChildren}
          className="max-w-6xl mx-auto"
        >
          <motion.h2 
            variants={fadeUp}
            className="text-3xl sm:text-4xl font-bold text-center text-gray-900 dark:text-white mb-16"
          >
            Three Simple Steps to Financial Clarity
          </motion.h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((step, index) => (
              <motion.div key={index} variants={fadeUp} className="relative">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all h-full">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                      <i className={`fas ${step.icon} text-2xl text-white`} />
                    </div>
                    <span className="text-4xl font-bold text-gray-200 dark:text-gray-700">{step.number}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>
                {index < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <i className="fas fa-arrow-right text-2xl text-gray-300 dark:text-gray-600" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 sm:px-12 bg-white dark:bg-gray-800">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerChildren}
          className="max-w-6xl mx-auto"
        >
          <motion.h2 
            variants={fadeUp}
            className="text-3xl sm:text-4xl font-bold text-center text-gray-900 dark:text-white mb-4"
          >
            Powerful Features for Modern Wealth
          </motion.h2>
          <motion.p 
            variants={fadeUp}
            className="text-center text-gray-600 dark:text-gray-400 mb-16 max-w-2xl mx-auto"
          >
            Everything you need to track, manage, and grow your wealth — without compromising on privacy or control.
          </motion.p>
          
          <div className="grid md:grid-cols-2 gap-8">
            {FEATURES.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeUp}
                className="flex gap-6 p-6 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <i className={`fas ${feature.icon} text-xl text-white`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6 sm:px-12">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerChildren}
          className="max-w-6xl mx-auto"
        >
          <motion.h2 
            variants={fadeUp}
            className="text-3xl sm:text-4xl font-bold text-center text-gray-900 dark:text-white mb-16"
          >
            Trusted by Founders & Investors
          </motion.h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((testimonial, index) => (
              <motion.div
                key={index}
                variants={fadeUp}
                className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg"
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className="text-4xl text-blue-500 dark:text-blue-400">&ldquo;</div>
                  <p className="text-gray-700 dark:text-gray-300 italic flex-1">
                    {testimonial.quote}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-400" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{testimonial.author}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6 sm:px-12 bg-gray-50 dark:bg-gray-900/50">
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
      <section className="py-20 px-6 sm:px-12">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="p-12 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-600/10 dark:to-purple-600/10 rounded-3xl border border-gray-200 dark:border-white/10">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Ready to Take Control?
            </h2>
            <p className="text-xl text-gray-700 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of founders and investors who&apos;ve found financial clarity with Profolio.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg px-8 py-6">
                <Link href="/auth/signUp">
                  Start Free Trial
                  <i className="fas fa-arrow-right ml-2" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg px-8 py-6">
                <Link href="/pricing">
                  View Pricing
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </section>
    </main>
  );
}