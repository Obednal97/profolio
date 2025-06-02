'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, useAnimationFrame } from 'framer-motion';
import { Button } from '@/components/ui/button/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getAuthModeSync } from '@/lib/authConfig';

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

// Live net worth simulation
const getLiveNetWorth = () => {
  const base = 750_000;
  const ratePerSecond = 0.012;
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

  const features = useMemo(() => [
    {
      icon: "fa-chart-pie",
      title: "Unified Dashboard",
      description: "See your entire financial picture at a glance with real-time updates and beautiful visualizations.",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: "fa-shield-alt",
      title: "Bank-Level Security",
      description: "Your data is encrypted end-to-end. Self-host for complete control or use our secure cloud.",
      gradient: "from-emerald-500 to-teal-500"
    },
    {
      icon: "fa-mobile-alt",
      title: "Everywhere Access",
      description: "Native-quality experience on desktop, tablet, and mobile. Your wealth, accessible anywhere.",
      gradient: "from-purple-500 to-pink-500"
    }
  ], []);

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent from-20% via-slate-50/40 to-indigo-100/60 dark:from-transparent dark:from-20% dark:via-slate-800/20 dark:to-indigo-900/30"></div>

      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div 
          className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400 to-cyan-300 rounded-full opacity-30 dark:opacity-20 filter blur-3xl"
          animate={{
            x: [0, 50, -30, 0],
            y: [0, -30, 50, 0],
            scale: [1, 1.1, 0.9, 1],
          }}
          transition={{
            duration: 20,
            ease: "easeInOut",
            repeat: Infinity,
          }}
        />
        <motion.div 
          className="absolute top-1/4 -left-40 w-96 h-96 bg-gradient-to-tr from-purple-400 to-pink-300 rounded-full opacity-30 dark:opacity-20 filter blur-3xl"
          animate={{
            x: [0, -50, 30, 0],
            y: [0, 30, -50, 0],
            scale: [1, 0.9, 1.1, 1],
          }}
          transition={{
            duration: 25,
            ease: "easeInOut",
            repeat: Infinity,
            delay: 2,
          }}
        />
        <motion.div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-indigo-400 to-blue-300 rounded-full opacity-20 dark:opacity-15 filter blur-3xl"
          animate={{
            x: [0, 40, -40, 0],
            y: [0, -40, 40, 0],
            scale: [1, 1.2, 0.8, 1],
          }}
          transition={{
            duration: 30,
            ease: "easeInOut",
            repeat: Infinity,
            delay: 4,
          }}
        />
        <motion.div 
          className="absolute top-3/4 -right-40 w-96 h-96 bg-gradient-to-br from-emerald-400 to-teal-300 rounded-full opacity-25 dark:opacity-18 filter blur-3xl"
          animate={{
            x: [0, 60, -40, 0],
            y: [0, -40, 60, 0],
            scale: [1, 1.05, 0.95, 1],
          }}
          transition={{
            duration: 28,
            ease: "easeInOut",
            repeat: Infinity,
            delay: 6,
          }}
        />
        <motion.div 
          className="absolute bottom-10 left-1/4 w-80 h-80 bg-gradient-to-tr from-pink-400 to-purple-300 rounded-full opacity-25 dark:opacity-18 filter blur-3xl"
          animate={{
            x: [0, -30, 45, 0],
            y: [0, 45, -30, 0],
            scale: [1, 1.15, 0.85, 1],
          }}
          transition={{
            duration: 32,
            ease: "easeInOut",
            repeat: Infinity,
            delay: 8,
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
          <motion.div 
            className="inline-flex items-center gap-3 px-6 py-3 rounded-full glass-tile mb-8 shadow-xl"
            variants={fadeUp}
          >
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </div>
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
              Trusted by 10,000+ investors worldwide
            </span>
          </motion.div>

          <motion.h1 
            className="text-6xl sm:text-7xl lg:text-8xl font-black text-gray-900 dark:text-white mb-8 tracking-tight leading-none"
            variants={fadeUp}
          >
            Your Wealth,
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
              Unified
            </span>
          </motion.h1>
          
          <motion.p
            className="text-xl sm:text-2xl text-gray-700 dark:text-gray-300 max-w-4xl mx-auto mb-12 leading-relaxed font-medium"
            variants={fadeUp}
          >
            The modern financial operating system for tracking your entire portfolio. 
            <br className="hidden sm:block" />
            Assets, crypto, stocks, and properties — all in one beautiful interface.
          </motion.p>

          <motion.div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16" variants={fadeUp}>
            <Button asChild size="lg" className="text-lg px-10 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105 border-0">
              <Link href="/auth/signUp">
                <i className="fas fa-rocket mr-3" />
                Start Free Trial
                <i className="fas fa-arrow-right ml-3" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg px-10 py-6 glass-tile border-white/30 dark:border-white/20 hover:bg-white/20 dark:hover:bg-white/10 backdrop-blur-xl shadow-xl hover:scale-105 transition-all duration-300">
              <Link href="/app/assetManager">
                <i className="fas fa-play-circle mr-3" />
                Try Demo
              </Link>
            </Button>
          </motion.div>

          <motion.div 
            className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-600 dark:text-gray-400"
            variants={fadeIn}
          >
            <div className="flex items-center gap-2">
              <i className="fas fa-shield-alt text-emerald-500"></i>
              <span>Bank-level security</span>
            </div>
            <div className="flex items-center gap-2">
              <i className="fas fa-download text-blue-500"></i>
              <span>Self-hosted option</span>
            </div>
            <div className="flex items-center gap-2">
              <i className="fas fa-clock text-purple-500"></i>
              <span>Real-time updates</span>
            </div>
          </motion.div>
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
          <motion.div variants={fadeUp} className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Watch Your Wealth
              <span className="bg-gradient-to-r from-emerald-600 to-blue-600 dark:from-emerald-400 dark:to-blue-400 bg-clip-text text-transparent"> Grow</span>
            </h2>
            <p className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
              Experience real-time portfolio tracking that updates as markets move.
            </p>
          </motion.div>

          <motion.div 
            className="relative group max-w-4xl mx-auto"
            variants={fadeUp}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 rounded-3xl blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-500" />
            
            <div className="relative glass-tile p-12 rounded-3xl border border-white/30 dark:border-white/20 shadow-2xl">
              <div className="flex items-center justify-center gap-4 mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-xl">
                  <i className="fas fa-chart-line text-3xl text-white" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white">Live Portfolio Value</h3>
              </div>
              
              <div className="text-center">
                <p className="text-6xl sm:text-7xl font-black text-gray-900 dark:text-white mb-4 font-mono">
                  ${formatCompactNumber(liveNetWorth)}
                </p>
                <div className="flex items-center justify-center gap-4 text-lg">
                  <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <i className="fas fa-arrow-up" />
                    +12.5%
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">this month</span>
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  <span className="text-gray-600 dark:text-gray-400">Live</span>
                </div>
              </div>
              
              <div className="mt-8 flex justify-center gap-2">
                {[...Array(7)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-2 bg-gradient-to-t from-blue-500 to-purple-500 rounded-full"
                    animate={{
                      height: [20, 40, 25, 35, 30][i % 5] + Math.sin(Date.now() / 1000 + i) * 5,
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.1,
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

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
              Everything You Need,
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent"> Beautifully Simple</span>
            </h2>
            <p className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
              Powerful features designed for modern wealth management, without the complexity.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeUp}
                className="group relative"
              >
                <div className="glass-tile p-8 rounded-2xl border border-white/30 dark:border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105 h-full">
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <i className={`fas ${feature.icon} text-2xl text-white`} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
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
              Ready to Transform Your
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent"> Financial Future?</span>
            </h2>
            <p className="text-xl text-gray-700 dark:text-gray-300 mb-10 max-w-3xl mx-auto">
              Join thousands who&apos;ve taken control of their wealth with Profolio. 
              Start free, upgrade when you&apos;re ready.
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