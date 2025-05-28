'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Tile } from '@/components/ui/tile/tile';
import { Button } from '@/components/ui/button/button';
import { motion, useAnimationFrame } from 'framer-motion';
import { useState } from 'react';

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 1, ease: 'easeOut' } },
};

const container = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const TESTIMONIALS = [
  {
    quote: '"Finally a dashboard that actually pulls everything into one place."',
    author: 'Sarah Chen',
    role: 'Startup Founder',
  },
  {
    quote: '"Feels like Notion met my bank account and had a baby."',
    author: 'Alex Rivera',
    role: 'Angel Investor',
  },
];

const FEATURES = [
  { 
    title: 'Unified Net Worth', 
    desc: 'See your full financial picture in one place.',
    icon: 'fa-chart-line'
  },
  { 
    title: 'Live Syncing', 
    desc: 'Auto updates from stocks, crypto, banks, and more.',
    icon: 'fa-sync'
  },
  { 
    title: 'Tax Awareness', 
    desc: 'Plan with tax buffers based on your residency.',
    icon: 'fa-calculator'
  },
];

const FEATURE_HIGHLIGHTS = [
  { 
    title: 'Private by Default', 
    desc: 'Self-host or go cloud. Your data, your rules.',
    icon: 'fa-lock'
  },
  { 
    title: 'Powerful Automations', 
    desc: 'Price alerts, tax calculations, custom scripts.',
    icon: 'fa-robot'
  },
  { 
    title: 'Optimized for Founders', 
    desc: 'Equity, options, trusts — all accounted for.',
    icon: 'fa-rocket'
  },
];

const getLiveNetWorth = () => {
  const base = 700_000; // Start at 700k
  const ratePerSecond = 0.01; // +0.01 per second
  const now = Math.floor(Date.now() / 1000);
  return base + ratePerSecond * (now - 1700000000);
};

const formatCompactNumber = (num: number) =>
  Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(num);

export default function LandingPage() {
  const [liveNetWorth, setLiveNetWorth] = useState(getLiveNetWorth());

  useAnimationFrame(() => {
    setLiveNetWorth(getLiveNetWorth());
  });

  return (
    <div className="text-foreground bg-background min-h-screen">
      {/* Hero Section */}
      <section
        aria-label="Hero"
        className="relative min-h-screen w-full flex items-center justify-center overflow-hidden"
      >
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
        
        {/* Animated gradient orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
          <div className="absolute top-40 left-40 w-80 h-80 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
        </div>

        <motion.div
          className="z-20 relative px-6 sm:px-12 max-w-6xl mx-auto text-center"
          initial="hidden"
          animate="visible"
          variants={container}
        >
          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8"
            variants={fadeUp}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-sm text-gray-300">Trusted by 10,000+ investors</span>
          </motion.div>

          <motion.h1 
            className="text-6xl sm:text-7xl lg:text-8xl font-bold text-white mb-6 tracking-tight"
            variants={fadeUp}
          >
            Your Wealth,
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"> Unified</span>
          </motion.h1>
          
          <motion.p
            className="text-xl sm:text-2xl text-gray-300 max-w-3xl mx-auto mb-12 leading-relaxed"
            variants={fadeUp}
          >
            The modern dashboard for tracking your entire financial portfolio. 
            Assets, liabilities, crypto, stocks, and properties — all in one beautiful interface.
          </motion.p>

          <motion.div className="flex flex-col sm:flex-row gap-4 justify-center" variants={fadeUp}>
            <Button asChild size="lg" className="text-lg px-8 py-6">
              <Link href="/auth/signUp">
                Start Free Trial
                <i className="fas fa-arrow-right ml-2" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg px-8 py-6">
              <Link href="/how-it-works">
                See How It Works
                <i className="fas fa-play-circle ml-2" />
              </Link>
            </Button>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-bounce" />
          </div>
        </motion.div>
      </section>

      {/* Live Net Worth Section */}
      <motion.section
        className="w-full max-w-5xl mx-auto text-center py-20 px-6"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={container}
      >
        <motion.div 
          className="relative group"
          variants={fadeUp}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-xl opacity-30 group-hover:opacity-40 transition-opacity" />
          <div className="relative p-8 bg-gray-900/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
            <div className="flex items-center justify-center gap-3 mb-4">
              <i className="fas fa-chart-line text-2xl text-blue-400" />
              <h2 className="text-2xl font-bold text-white">Live Portfolio Value</h2>
            </div>
            <p className="text-5xl font-bold text-white mb-2">
              ${formatCompactNumber(liveNetWorth)}
            </p>
            <p className="text-sm text-gray-400">
              <span className="text-green-400">↑ 12.5%</span> this month • Updated in real-time
            </p>
          </div>
        </motion.div>
      </motion.section>

      {/* Testimonials Section */}
      <motion.section
        className="py-20 px-6 sm:px-12 max-w-6xl mx-auto"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={container}
      >
        <motion.h2 className="text-3xl font-bold text-center text-white mb-4" variants={fadeUp}>
          Loved by Founders & Investors
        </motion.h2>
        <motion.p className="text-center text-gray-400 mb-12 max-w-2xl mx-auto" variants={fadeUp}>
          Join thousands who've simplified their wealth management
        </motion.p>
        <div className="grid md:grid-cols-2 gap-8">
          {TESTIMONIALS.map((testimonial, i) => (
            <motion.div key={i} variants={fadeUp}>
              <Tile className="p-8 bg-gray-900/50 backdrop-blur-sm border-gray-800 hover:border-gray-700 transition-all">
                <div className="flex items-start gap-4 mb-4">
                  <div className="text-4xl text-gray-600">"</div>
                  <p className="text-lg text-gray-300 italic flex-1">{testimonial.quote}</p>
                </div>
                <div className="flex items-center gap-3 ml-12">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400" />
                  <div>
                    <p className="font-semibold text-white">{testimonial.author}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </Tile>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        className="py-20 bg-gray-900/50 px-6 sm:px-12"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={container}
      >
        <div className="max-w-6xl mx-auto">
          <motion.h2 className="text-3xl font-bold text-center text-white mb-4" variants={fadeUp}>
            Everything You Need
          </motion.h2>
          <motion.p className="text-center text-gray-400 mb-12 max-w-2xl mx-auto" variants={fadeUp}>
            A complete financial dashboard designed for the modern investor
          </motion.p>
          <div className="grid md:grid-cols-3 gap-8">
            {FEATURES.map(({ title, desc, icon }) => (
              <motion.div key={title} variants={fadeUp}>
                <Tile className="p-8 h-full bg-gray-800/50 backdrop-blur-sm border-gray-700 hover:border-blue-500/50 transition-all group">
                  <div className="w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:bg-blue-500/20 transition-colors">
                    <i className={`fas ${icon} text-2xl text-blue-400`} />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-white">{title}</h3>
                  <p className="text-gray-400 leading-relaxed">{desc}</p>
                </Tile>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Feature Highlights */}
      <motion.section
        className="py-20 px-6 sm:px-12 max-w-6xl mx-auto"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={container}
      >
        <motion.h2
          className="text-3xl font-bold text-center text-white mb-12"
          variants={fadeUp}
        >
          Built for Power Users
        </motion.h2>
        <div className="grid md:grid-cols-3 gap-8">
          {FEATURE_HIGHLIGHTS.map(({ title, desc, icon }) => (
            <motion.div key={title} variants={fadeUp}>
              <div className="text-center group cursor-pointer">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/10 to-blue-500/10 flex items-center justify-center mx-auto mb-6 group-hover:from-purple-500/20 group-hover:to-blue-500/20 transition-all">
                  <i className={`fas ${icon} text-3xl text-purple-400`} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
                <p className="text-gray-400 leading-relaxed">{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        className="py-20 px-6 sm:px-12"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={container}
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.div 
            className="p-12 bg-gradient-to-br from-blue-600/10 to-purple-600/10 rounded-3xl border border-white/10 backdrop-blur-sm"
            variants={fadeUp}
          >
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Take Control?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of investors who've simplified their wealth tracking with Profolio.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg px-8 py-6">
                <Link href="/auth/signUp">
                  Get Started Free
                  <i className="fas fa-arrow-right ml-2" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="text-lg px-8 py-6">
                <Link href="/pricing">
                  View Pricing
                </Link>
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-6">
              No credit card required • 14-day free trial
            </p>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
}