'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button/button';
import Link from 'next/link';
import { useMemo } from 'react';

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

export default function AboutPage() {
  const principles = useMemo(() => [
    {
      icon: 'fa-shield-alt',
      title: 'Privacy First',
      description: 'Your financial data belongs to you. Self-host for complete control or trust our encrypted cloud.',
      gradient: 'from-emerald-500 to-teal-500'
    },
    {
      icon: 'fa-cubes',
      title: 'Modular Design',
      description: 'Start simple, scale complex. Add features as your wealth grows and your needs evolve.',
      gradient: 'from-blue-500 to-purple-500'
    },
    {
      icon: 'fa-brain',
      title: 'Real Complexity',
      description: 'Built for sophisticated portfolios. Handle multi-currency, cross-border, and alternative assets.',
      gradient: 'from-purple-500 to-pink-500'
    }
  ], []);

  return (
    <div className="relative min-h-screen scroll-smooth lg:scroll-auto" style={{ scrollSnapType: 'y mandatory' }}>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent from-20% via-slate-50/40 to-indigo-100/60 dark:from-transparent dark:from-20% dark:via-slate-800/20 dark:to-indigo-900/30"></div>

      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
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
            About
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 dark:from-blue-400 dark:via-purple-400 dark:to-cyan-400 bg-clip-text text-transparent">
              Profolio
            </span>
          </motion.h1>
          
          <motion.p
            className="text-lg sm:text-xl lg:text-2xl text-gray-700 dark:text-gray-300 max-w-4xl mx-auto mb-8 sm:mb-12 lg:mb-16 leading-relaxed font-medium"
            variants={fadeUp}
          >
            Built by founders, for founders. The financial operating system for modern wealth management that puts privacy and control first.
          </motion.p>

          <motion.div 
            className="flex flex-wrap justify-center items-center gap-6 sm:gap-8 text-sm text-gray-600 dark:text-gray-400"
            variants={fadeIn}
          >
            <div className="flex items-center gap-2">
              <i className="fas fa-users text-blue-500"></i>
              <span>10,000+ users</span>
            </div>
            <div className="flex items-center gap-2">
              <i className="fas fa-code-branch text-green-500"></i>
              <span>Open source</span>
            </div>
            <div className="flex items-center gap-2">
              <i className="fas fa-shield-alt text-purple-500"></i>
              <span>Privacy-first</span>
            </div>
          </motion.div>
        </motion.div>
      </section>

      <section className="relative min-h-screen lg:min-h-0 flex items-center justify-center lg:block overflow-hidden z-10 py-8 sm:py-12 lg:py-20" style={{ scrollSnapAlign: 'start' }}>
        <motion.div
          className="relative z-10 px-6 sm:px-12 max-w-7xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={container}
        >
          <motion.div variants={fadeUp} className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6 sm:mb-8">
              Our Core
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent"> Principles</span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
              Everything we build is guided by these fundamental principles.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 sm:gap-10 lg:gap-12">
            {principles.map((value, index) => (
              <motion.div
                key={index}
                variants={fadeUp}
                className="group"
              >
                <div className="glass-tile p-8 rounded-2xl border border-white/30 dark:border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105 h-full">
                  <div className={`w-16 h-16 bg-gradient-to-br ${value.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <i className={`fas ${value.icon} text-2xl text-white`} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    {value.title}
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {value.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="relative min-h-screen lg:min-h-0 flex items-center justify-center lg:block overflow-hidden z-10 py-8 sm:py-12 lg:py-20" style={{ scrollSnapAlign: 'start' }}>
        <motion.div
          className="relative z-10 px-6 sm:px-12 max-w-6xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={container}
        >
          <motion.div variants={fadeUp} className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6 sm:mb-8">
              Why
              <span className="bg-gradient-to-r from-emerald-600 to-blue-600 dark:from-emerald-400 dark:to-blue-400 bg-clip-text text-transparent"> Profolio</span>?
            </h2>
          </motion.div>

          <motion.div variants={fadeUp} className="relative group">
            <div className="glass-tile p-8 sm:p-12 lg:p-16 rounded-3xl border border-white/30 dark:border-white/20 shadow-2xl">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6">
                    Built from personal necessity
                  </h3>
                  <div className="space-y-6 text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
                    <p>
                      After building and selling multiple companies, our founder found himself managing assets across dozens of platforms — from stock portfolios and crypto wallets to property investments and savings accounts.
                    </p>
                    <p>
                      Existing solutions were either too simplistic for complex portfolios or enterprise-grade monsters that required a finance team to operate. Nothing served the sophisticated individual investor who wanted both power and simplicity.
                    </p>
                    <p>
                      Profolio was born from this frustration — a tool that could handle the complexity of modern wealth while remaining beautifully simple to use.
                    </p>
                  </div>
                </div>
                <div className="relative">
                  <div className="glass-tile p-8 rounded-2xl border border-blue-500/30 dark:border-blue-400/30 shadow-xl">
                    <div className="flex items-start gap-4 mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <i className="fas fa-quote-left text-white" />
                      </div>
                      <div className="text-2xl text-gray-900 dark:text-white font-black leading-tight">
                        &ldquo;I wanted something that could grow with me — from tracking my first investment to managing a complex portfolio worth millions.&rdquo;
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full"></div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">Alex Chen</p>
                        <p className="text-gray-600 dark:text-gray-400">Founder & CEO</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      <section className="relative min-h-screen lg:min-h-0 flex items-center justify-center lg:block overflow-hidden z-10 py-8 sm:py-12 lg:py-20" style={{ scrollSnapAlign: 'start' }}>
        <motion.div
          className="relative z-10 px-6 sm:px-12 max-w-6xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={container}
        >
          <motion.div variants={fadeUp} className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6 sm:mb-8">
              Where We&apos;re
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent"> Heading</span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
              Our vision for the future of personal wealth management.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 sm:gap-10 lg:gap-12">
            <motion.div variants={fadeUp} className="group">
              <div className="glass-tile p-8 rounded-2xl border border-white/30 dark:border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105 h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <i className="fas fa-rocket text-2xl text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Coming Soon
                </h3>
                <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                  <li className="flex items-start gap-3">
                    <i className="fas fa-check-circle text-blue-500 mt-1" />
                    <span>Advanced tax optimization tools</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <i className="fas fa-check-circle text-blue-500 mt-1" />
                    <span>Estate planning integration</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <i className="fas fa-check-circle text-blue-500 mt-1" />
                    <span>AI-powered financial insights</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <i className="fas fa-check-circle text-blue-500 mt-1" />
                    <span>Multi-currency support</span>
                  </li>
                </ul>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="group">
              <div className="glass-tile p-8 rounded-2xl border border-white/30 dark:border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105 h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <i className="fas fa-crystal-ball text-2xl text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Future Vision
                </h3>
                <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                  <li className="flex items-start gap-3">
                    <i className="fas fa-star text-purple-500 mt-1" />
                    <span>Institutional-grade portfolio analysis</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <i className="fas fa-star text-purple-500 mt-1" />
                    <span>Family office collaboration tools</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <i className="fas fa-star text-purple-500 mt-1" />
                    <span>Global regulatory compliance</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <i className="fas fa-star text-purple-500 mt-1" />
                    <span>Integrated trading platform</span>
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

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
              Ready to Build Your
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent"> Financial Future</span>?
            </h2>
            <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-300 mb-10 sm:mb-12 max-w-3xl mx-auto">
              Join thousands who have taken control of their wealth with Profolio. Start your journey today.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button asChild size="lg" className="text-lg px-10 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105">
                <Link href="/auth/signUp">
                  <i className="fas fa-rocket mr-3" />
                  Start Free Trial
                  <i className="fas fa-arrow-right ml-3" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg px-10 py-6 glass-tile border-white/30 dark:border-white/20 hover:bg-white/20 dark:hover:bg-white/10">
                <Link href="/how-it-works">
                  Learn How It Works
                </Link>
              </Button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-500 mt-10">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>
        </motion.div>
      </section>
    </div>
  );
}