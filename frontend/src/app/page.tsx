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

const container = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const TESTIMONIALS = [
  '“Finally a dashboard that actually pulls everything into one place.”',
  '“Feels like Notion met my bank account and had a baby.”',
];

const FEATURES = [
  { title: 'Unified Net Worth', desc: 'See your full financial picture in one place.' },
  { title: 'Live Syncing', desc: 'Auto updates from stocks, crypto, banks, and more.' },
  { title: 'Tax Awareness', desc: 'Plan with tax buffers based on your residency.' },
];

const FEATURE_HIGHLIGHTS = [
  { title: 'Private by Default', desc: 'Self-host or go cloud. Your data, your rules.' },
  { title: 'Powerful Automations', desc: 'Price alerts, tax calculations, custom scripts.' },
  { title: 'Optimized for Founders', desc: 'Equity, options, trusts — all accounted for.' },
];

const getLiveNetWorth = () => {
  const base = 7_500_000;
  const ratePerSecond = 1.33;
  const now = Math.floor(Date.now() / 1000);
  return base + Math.floor(ratePerSecond * (now - 1700000000));
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
        className="relative h-screen w-full flex items-center justify-center text-center overflow-hidden"
      >
        <Image
          src="/hero.png"
          alt="Hero background"
          fill
          className="object-cover opacity-20 blur-sm"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-background/60 z-10" />
        <motion.div
          className="z-20 relative px-6 sm:px-12 max-w-4xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <motion.h1 
            className="text-7xl sm:text-8xl font-extrabold text-white mb-4 tracking-tight drop-shadow-md"
            variants={fadeUp}
          >
            Profolio
          </motion.h1>
          <motion.h1 
            className="text-5xl sm:text-6xl font-extrabold text-neon mb-6 tracking-tight drop-shadow-md"
            variants={fadeUp}
          >
            Your Wealth, Unified
          </motion.h1>
          <motion.p
            className="text-lg sm:text-xl text-gray-300 max-w-xl mx-auto mb-8"
            variants={fadeUp}
          >
            Profolio brings together your assets, liabilities, crypto, stocks, and properties into a single clean dashboard.
          </motion.p>
          <motion.div variants={fadeUp}>
            <Button asChild size="lg">
              <Link href="/auth/signUp">See It In Action</Link>
            </Button>
          </motion.div>
        </motion.div>
      </section>

      <motion.section
        variants={fadeUp}
        className="w-full max-w-4xl mx-auto text-center my-12 px-6"
      >
        <div className="p-6 bg-gradient-to-br from-pink-500 via-green-400 to-blue-500 text-black rounded-xl shadow-xl">
          <h2 className="text-xl font-bold tracking-tight mb-2">Live net worth tracked on Profolio</h2>
          <p className="text-4xl font-extrabold tracking-wide">
            {formatCompactNumber(liveNetWorth)}
          </p>
          <p className="text-sm mt-2 text-black/70">Updated every second — and growing</p>
        </div>
      </motion.section>

      {/* Testimonials Section */}
      <motion.section
        className="py-20 px-6 sm:px-12 max-w-5xl mx-auto text-center space-y-8"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={container}
      >
        <motion.h2 className="text-2xl font-semibold text-neon" variants={fadeUp}>
          Trusted by founders, creators, and tech-savvy investors
        </motion.h2>
        <div className="grid sm:grid-cols-2 gap-6">
          {TESTIMONIALS.map((quote, i) => (
            <motion.div key={i} variants={fadeUp}>
              <Tile className="shadow hover:shadow-neon transition-shadow bg-muted/5">
                <p className="text-gray-400 italic">{quote}</p>
              </Tile>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        className="py-20 bg-muted/5 px-6 sm:px-12"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={container}
      >
        <div className="max-w-6xl mx-auto text-center space-y-12">
          <motion.h2 className="text-3xl font-bold text-neon mb-6" variants={fadeUp}>
            Everything in One Place
          </motion.h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {FEATURES.map(({ title, desc }) => (
              <motion.div key={title} variants={fadeUp}>
                <Tile className="hover:scale-105 transition-transform duration-300 shadow hover:shadow-neon bg-background/70">
                  <h3 className="text-xl font-semibold mb-2 text-neon">{title}</h3>
                  <p className="text-sm text-gray-400">{desc}</p>
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
          className="text-3xl font-bold text-center text-neon mb-12"
          variants={fadeUp}
        >
          Built for Power Users
        </motion.h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {FEATURE_HIGHLIGHTS.map(({ title, desc }) => (
            <motion.div key={title} variants={fadeUp}>
              <Tile className="hover:scale-105 transition-transform duration-300 shadow hover:shadow-neon bg-background/70">
                <h3 className="text-xl font-bold text-neon mb-2">{title}</h3>
                <p className="text-sm text-gray-400">{desc}</p>
              </Tile>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* About Section */}
      <motion.section
        className="py-20 px-6 sm:px-12 max-w-3xl mx-auto text-center space-y-4"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={container}
      >
        <motion.h2 className="text-2xl font-bold text-neon" variants={fadeUp}>
          Why Profolio?
        </motion.h2>
        <motion.p className="text-gray-300" variants={fadeUp}>
          Whether you’re a founder, investor, or just getting a grip on personal finances —
          Profolio gives you clarity, control, and peace of mind by letting you manage everything in one private, powerful place.
        </motion.p>
      </motion.section>
    </div>
  );
}