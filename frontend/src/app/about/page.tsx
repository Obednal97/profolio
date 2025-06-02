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
  const values = useMemo(() => [
    {
      icon: 'fa-shield-alt',
      title: 'Privacy First',
      description: 'Your financial data stays yours. Self-host or use our encrypted cloud — you maintain complete control.',
      gradient: 'from-emerald-500 to-teal-500'
    },
    {
      icon: 'fa-puzzle-piece',
      title: 'Modular Design',
      description: 'Built to adapt to your needs. Add features, integrate tools, and customize your experience.',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: 'fa-chart-line',
      title: 'Real Complexity',
      description: 'Designed for real portfolios with crypto, equity, real estate, and international assets.',
      gradient: 'from-purple-500 to-pink-500'
    },
  ], []);

  const roadmapItems = useMemo(() => ({
    comingSoon: [
      'Automated asset syncing via APIs',
      'Multi-jurisdictional tax calculations',
      'Price alerts and portfolio triggers',
      'CoinGecko & Yahoo Finance integration'
    ],
    future: [
      'Collaboration with accountants & advisors',
      'Encrypted cloud backups',
      'Optional managed hosting',
      'Developer API & plugin system'
    ]
  }), []);

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent from-20% via-slate-50/40 to-indigo-100/60 dark:from-transparent dark:from-20% dark:via-slate-800/20 dark:to-indigo-900/30"></div>

      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div 
          className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-emerald-400 to-teal-300 rounded-full opacity-30 dark:opacity-20 filter blur-3xl"
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -20, 30, 0],
            scale: [1, 1.1, 0.9, 1],
          }}
          transition={{
            duration: 20,
            ease: "easeInOut",
            repeat: Infinity,
          }}
        />
        <motion.div 
          className="absolute top-1/4 -left-40 w-96 h-96 bg-gradient-to-tr from-blue-400 to-indigo-300 rounded-full opacity-30 dark:opacity-20 filter blur-3xl"
          animate={{
            x: [0, -40, 20, 0],
            y: [0, 20, -40, 0],
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
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-400 to-pink-300 rounded-full opacity-20 dark:opacity-15 filter blur-3xl"
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
          className="absolute top-3/4 -right-40 w-96 h-96 bg-gradient-to-br from-cyan-400 to-blue-300 rounded-full opacity-25 dark:opacity-18 filter blur-3xl"
          animate={{
            x: [0, 50, -30, 0],
            y: [0, -30, 50, 0],
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
          className="absolute bottom-10 left-1/4 w-80 h-80 bg-gradient-to-tr from-indigo-400 to-purple-300 rounded-full opacity-25 dark:opacity-18 filter blur-3xl"
          animate={{
            x: [0, -35, 40, 0],
            y: [0, 40, -35, 0],
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
          <motion.h1 
            className="text-6xl sm:text-7xl lg:text-8xl font-black text-gray-900 dark:text-white mb-8 tracking-tight leading-none"
            variants={fadeUp}
          >
            About
            <br />
            <span className="bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 dark:from-emerald-400 dark:via-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              Profolio
            </span>
          </motion.h1>
          
          <motion.p
            className="text-xl sm:text-2xl text-gray-700 dark:text-gray-300 max-w-4xl mx-auto mb-16 leading-relaxed font-medium"
            variants={fadeUp}
          >
            A next-generation personal wealth operating system designed for founders, operators, and builders who need more than just spreadsheets.
          </motion.p>

          <motion.div 
            className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-600 dark:text-gray-400"
            variants={fadeIn}
          >
            <div className="flex items-center gap-2">
              <i className="fas fa-users text-emerald-500"></i>
              <span>Built by founders</span>
            </div>
            <div className="flex items-center gap-2">
              <i className="fas fa-code-branch text-blue-500"></i>
              <span>Open source</span>
            </div>
            <div className="flex items-center gap-2">
              <i className="fas fa-lock text-purple-500"></i>
              <span>Privacy focused</span>
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
              Built on
              <span className="bg-gradient-to-r from-emerald-600 to-blue-600 dark:from-emerald-400 dark:to-blue-400 bg-clip-text text-transparent"> Core Principles</span>
            </h2>
            <p className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
              Every design decision reflects our commitment to privacy, flexibility, and real-world complexity.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={index}
                variants={fadeUp}
                className="group relative"
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
              Why
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent"> Profolio</span>
            </h2>
            <p className="text-xl text-gray-700 dark:text-gray-300">
              The story behind building a better way to manage wealth.
            </p>
          </motion.div>

          <motion.div variants={fadeUp} className="glass-tile p-12 rounded-3xl border border-white/30 dark:border-white/20 shadow-2xl">
            <div className="space-y-6 text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              <p>
                After years of juggling spreadsheets, disparate financial apps, and endless manual updates, 
                it became clear that existing solutions either lacked the depth needed for complex portfolios 
                or required surrendering complete control of sensitive financial data.
              </p>
              
              <p>
                Profolio was born from the belief that you shouldn&apos;t have to choose between powerful 
                functionality and data ownership. Whether you&apos;re tracking crypto across multiple wallets, 
                managing international real estate, or simply want a unified view of your investments — 
                you deserve tools that respect both your privacy and your intelligence.
              </p>
              
              <p>
                We&apos;re building for those who understand that true wealth management isn&apos;t just about 
                tracking numbers — it&apos;s about maintaining sovereignty over your financial future while 
                having the insights needed to make informed decisions.
              </p>
              
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 rounded-2xl p-8 mt-12 border border-gray-200/50 dark:border-gray-700/50">
                <blockquote className="text-xl text-gray-800 dark:text-gray-200 italic mb-4 text-center">
                  &quot;If you&apos;re tired of spreadsheets but wary of giving your data to yet another startup, welcome. 
                  I hope Profolio helps you feel more in control of your money, your future, and your freedom.&quot;
                </blockquote>
                <cite className="text-gray-600 dark:text-gray-400 text-center block">
                  — Ollie Bednal, Creator of Profolio
                </cite>
              </div>
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
          <motion.div variants={fadeUp} className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Where We&apos;re
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent"> Heading</span>
            </h2>
            <p className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
              Our roadmap focuses on automation, global tax complexity, and enterprise features.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <motion.div variants={fadeUp} className="glass-tile p-8 rounded-2xl border border-white/30 dark:border-white/20 shadow-xl">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <i className="fas fa-rocket text-white text-lg" />
                </div>
                Coming Soon
              </h3>
              <ul className="space-y-4">
                {roadmapItems.comingSoon.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                      <i className="fas fa-check text-white text-xs" />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div variants={fadeUp} className="glass-tile p-8 rounded-2xl border border-white/30 dark:border-white/20 shadow-xl">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <i className="fas fa-compass text-white text-lg" />
                </div>
                Future Vision
              </h3>
              <ul className="space-y-4">
                {roadmapItems.future.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                      <i className="fas fa-lightbulb text-white text-xs" />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          <motion.div variants={fadeUp} className="text-center">
            <div className="glass-tile p-8 rounded-2xl border border-white/30 dark:border-white/20 shadow-xl inline-block">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Ready to Join the Journey?
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-6 max-w-md">
                Be part of building the future of personal wealth management.
              </p>
              <Button asChild size="lg" className="text-lg px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105">
                <Link href="/auth/signUp">
                  <i className="fas fa-rocket mr-2" />
                  Join the Journey
                  <i className="fas fa-arrow-right ml-2" />
                </Link>
              </Button>
            </div>
          </motion.div>
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
              Ready to Build Your
              <span className="bg-gradient-to-r from-emerald-600 to-blue-600 dark:from-emerald-400 dark:to-blue-400 bg-clip-text text-transparent"> Financial Future</span>?
            </h2>
            <p className="text-xl text-gray-700 dark:text-gray-300 mb-10 max-w-3xl mx-auto">
              Join the growing community of users who value both powerful insights and complete privacy.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button asChild size="lg" className="text-lg px-10 py-6 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white shadow-2xl hover:shadow-emerald-500/25 transition-all duration-300 hover:scale-105">
                <Link href="/auth/signUp">
                  Start Free Trial
                  <i className="fas fa-arrow-right ml-3" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg px-10 py-6 glass-tile border-white/30 dark:border-white/20 hover:bg-white/20 dark:hover:bg-white/10">
                <Link href="/how-it-works">
                  Learn More
                </Link>
              </Button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-500 mt-8">
              Self-hosted or cloud • Your data, your choice • Forever free tier
            </p>
          </div>
        </motion.div>
      </section>
    </div>
  );
}