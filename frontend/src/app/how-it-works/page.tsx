'use client';

import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button/button';
import Link from 'next/link';

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

export default function HowItWorksPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const steps = useMemo(() => [
    {
      number: '01',
      title: 'Connect Your Assets',
      description: 'Link bank accounts, crypto wallets, investment portfolios, and real estate. Everything syncs automatically.',
      icon: 'fa-link',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      number: '02',
      title: 'Set Your Parameters',
      description: 'Configure tax rates, set financial goals, and customize alerts. Profolio adapts to your unique situation.',
      icon: 'fa-sliders-h',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      number: '03',
      title: 'Get Real-Time Insights',
      description: 'Watch your net worth update in real-time. Track trends, spot opportunities, and make informed decisions.',
      icon: 'fa-chart-line',
      gradient: 'from-emerald-500 to-teal-500'
    },
  ], []);

  const features = useMemo(() => [
    {
      icon: 'fa-brain',
      title: 'Smart Tax Buffers',
      description: 'Set tax buffers per asset type, so you&apos;re never caught off guard by capital gains or income tax.',
      gradient: 'from-indigo-500 to-purple-500'
    },
    {
      icon: 'fa-bell',
      title: 'Intelligent Alerts',
      description: 'Get notified about price movements, portfolio milestones, and opportunities that matter to you.',
      gradient: 'from-amber-500 to-orange-500'
    },
    {
      icon: 'fa-shield-alt',
      title: 'Bank-Level Security',
      description: 'Your data is encrypted end-to-end. Self-host for complete control or use our secure cloud.',
      gradient: 'from-emerald-500 to-green-500'
    },
    {
      icon: 'fa-puzzle-piece',
      title: 'Extensible Platform',
      description: 'Built modular from day one. Add custom integrations, scripts, and automations as you grow.',
      gradient: 'from-blue-500 to-cyan-500'
    },
  ], []);

  const testimonials = useMemo(() => [
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
  ], []);

  const faqs = useMemo(() => [
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
  ], []);

  return (
    <div className="relative min-h-screen">
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
          className="absolute top-1/4 -left-40 w-96 h-96 bg-gradient-to-tr from-cyan-400 to-blue-300 rounded-full opacity-30 dark:opacity-20 filter blur-3xl"
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
          className="absolute top-3/4 -right-40 w-96 h-96 bg-gradient-to-br from-emerald-400 to-teal-300 rounded-full opacity-25 dark:opacity-18 filter blur-3xl"
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
            How
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 dark:from-blue-400 dark:via-purple-400 dark:to-cyan-400 bg-clip-text text-transparent">
              Profolio
            </span>
            <br />
            Works
          </motion.h1>
          
          <motion.p
            className="text-xl sm:text-2xl text-gray-700 dark:text-gray-300 max-w-4xl mx-auto mb-16 leading-relaxed font-medium"
            variants={fadeUp}
          >
            From scattered spreadsheets to complete financial clarity in minutes. 
            See how Profolio transforms your wealth management.
          </motion.p>

          {/* Trust indicators */}
          <motion.div 
            className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-600 dark:text-gray-400"
            variants={fadeIn}
          >
            <div className="flex items-center gap-2">
              <i className="fas fa-rocket text-blue-500"></i>
              <span>Setup in minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <i className="fas fa-sync text-purple-500"></i>
              <span>Real-time syncing</span>
            </div>
            <div className="flex items-center gap-2">
              <i className="fas fa-shield-alt text-emerald-500"></i>
              <span>Bank-grade security</span>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* How It Works Steps */}
      <section className="relative py-32 px-6 sm:px-12 z-10">
        <motion.div
          className="max-w-7xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={container}
        >
          <motion.div variants={fadeUp} className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Three Simple
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent"> Steps</span>
            </h2>
            <p className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
              Get up and running with Profolio in minutes. Start simple, scale as your needs grow.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div key={index} variants={fadeUp} className="group relative">
                <div className="glass-tile p-8 rounded-2xl border border-white/30 dark:border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105 h-full">
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-16 h-16 bg-gradient-to-br ${step.gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <i className={`fas ${step.icon} text-2xl text-white`} />
                    </div>
                    <span className="text-5xl font-black bg-gradient-to-br from-gray-200 to-gray-400 dark:from-gray-600 dark:to-gray-800 bg-clip-text text-transparent">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    {step.title}
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {step.description}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:flex absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                      <i className="fas fa-arrow-right text-white text-sm" />
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
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
              Powerful Features for
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent"> Modern Wealth</span>
            </h2>
            <p className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
              Everything you need to track, manage, and grow your wealth — without compromising on privacy or control.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeUp}
                className="group"
              >
                <div className="glass-tile p-6 rounded-2xl border border-white/30 dark:border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105 h-full">
                  <div className={`w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <i className={`fas ${feature.icon} text-lg text-white`} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Testimonials */}
      <section className="relative py-32 px-6 sm:px-12">
        <motion.div
          className="max-w-6xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={container}
        >
          <motion.div variants={fadeUp} className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Trusted by
              <span className="bg-gradient-to-r from-emerald-600 to-blue-600 dark:from-emerald-400 dark:to-blue-400 bg-clip-text text-transparent"> Founders & Investors</span>
            </h2>
            <p className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
              Join thousands who&apos;ve transformed their financial management with Profolio.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                variants={fadeUp}
                className="group"
              >
                <div className="glass-tile p-8 rounded-2xl border border-white/30 dark:border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105 h-full">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="text-4xl bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent font-bold">&ldquo;</div>
                    <p className="text-gray-800 dark:text-gray-200 italic flex-1 text-lg leading-relaxed">
                      {testimonial.quote}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 shadow-lg" />
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">{testimonial.author}</p>
                      <p className="text-gray-600 dark:text-gray-400">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* FAQ Section */}
      <section className="relative py-32 px-6 sm:px-12 z-10">
        <motion.div
          className="max-w-4xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={container}
        >
          <motion.div variants={fadeUp} className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Frequently Asked
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent"> Questions</span>
            </h2>
            <p className="text-xl text-gray-700 dark:text-gray-300">
              Get answers to common questions about Profolio.
            </p>
          </motion.div>

          <motion.div variants={fadeUp} className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="glass-tile rounded-2xl border border-white/30 dark:border-white/20 shadow-lg overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-white/10 dark:hover:bg-white/5 transition-colors duration-200"
                >
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    {faq.question}
                  </span>
                  <i className={`fas fa-chevron-${openFaq === index ? 'up' : 'down'} text-gray-500 dark:text-gray-400 transition-transform duration-200`} />
                </button>
                {openFaq === index && (
                  <div className="px-8 pb-6">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Final CTA */}
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
              Ready to Take Control of Your
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent"> Wealth</span>?
            </h2>
            <p className="text-xl text-gray-700 dark:text-gray-300 mb-10 max-w-3xl mx-auto">
              Join thousands who have transformed how they manage their financial lives with Profolio.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button asChild size="lg" className="text-lg px-10 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105">
                <Link href="/auth/signUp">
                  Start Free Trial
                  <i className="fas fa-arrow-right ml-3" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg px-10 py-6 glass-tile border-white/30 dark:border-white/20 hover:bg-white/20 dark:hover:bg-white/10">
                <Link href="/pricing">
                  View Pricing
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