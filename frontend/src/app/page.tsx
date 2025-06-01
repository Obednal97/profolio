'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button/button';
import { motion, useAnimationFrame } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthModeSync } from '@/lib/authConfig';

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
};

const container = {
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

export default function LandingPage() {
  const [liveNetWorth, setLiveNetWorth] = useState(getLiveNetWorth());
  const router = useRouter();

  useAnimationFrame(() => {
    setLiveNetWorth(getLiveNetWorth());
  });

  useEffect(() => {
    const authMode = getAuthModeSync();
    if (authMode === 'local') {
      router.push('/auth/signIn');
    }
  }, [router]);

  return (
    <div className="text-foreground min-h-screen">
      {/* Hero Section */}
      <section
        aria-label="Hero"
        className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
      >
        {/* Animated gradient orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-3xl opacity-30 dark:opacity-20 animate-blob" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-3xl opacity-30 dark:opacity-20 animate-blob animation-delay-2000" />
          <div className="absolute top-40 left-40 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-3xl opacity-30 dark:opacity-20 animate-blob animation-delay-4000" />
        </div>

        <motion.div
          className="z-20 relative px-6 sm:px-12 max-w-6xl mx-auto text-center"
          initial="hidden"
          animate="visible"
          variants={container}
        >
          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm mb-8"
            variants={fadeUp}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-sm text-gray-700 dark:text-gray-300">Trusted by 10,000+ investors</span>
          </motion.div>

          <motion.h1 
            className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight"
            variants={fadeUp}
          >
            Your Wealth,
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent"> Unified</span>
          </motion.h1>
          
          <motion.p
            className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-12 leading-relaxed"
            variants={fadeUp}
          >
            The modern dashboard for tracking your entire financial portfolio. 
            Assets, liabilities, crypto, stocks, and properties — all in one beautiful interface.
          </motion.p>

          <motion.div className="flex flex-col sm:flex-row gap-4 justify-center" variants={fadeUp}>
            <Button asChild size="lg" className="text-lg px-8 py-6 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200">
              <Link href="/auth/signUp">
                Start Free Trial
                <i className="fas fa-arrow-right ml-2" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg px-8 py-6 border-gray-300 dark:border-gray-600">
              <Link href="/app/assetManager">
                Try Asset Manager
                <i className="fas fa-play-circle ml-2" />
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Live Net Worth Section */}
      <div className="bg-gray-50 dark:bg-gray-900">
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
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-xl opacity-20 dark:opacity-30 group-hover:opacity-30 dark:group-hover:opacity-40 transition-opacity" />
            <div className="relative p-8 bg-white dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl">
              <div className="flex items-center justify-center gap-3 mb-4">
                <i className="fas fa-chart-line text-2xl text-blue-600 dark:text-blue-400" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Live Portfolio Value</h2>
              </div>
              <p className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
                ${formatCompactNumber(liveNetWorth)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="text-green-600 dark:text-green-400">↑ 12.5%</span> this month • Updated in real-time
              </p>
            </div>
          </motion.div>
        </motion.section>
      </div>
    </div>
  );
}