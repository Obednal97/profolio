

'use client';

import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
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

export default function HowItWorksPage() {
  return (
    <motion.main
      initial="hidden"
      animate="visible"
      variants={staggerChildren}
      className="relative w-full flex flex-col items-center justify-center px-6 sm:px-12 py-24 gap-24 text-white"
    >
      {/* Hero */}
      <motion.section variants={fadeUp} className="w-full max-w-6xl text-center flex flex-col gap-6">
        <h1 className="text-6xl sm:text-8xl font-bold tracking-tight drop-shadow-md">
          How It Works
        </h1>
        <p className="text-xl sm:text-2xl text-gray-400 max-w-3xl mx-auto drop-shadow-sm">
          Profolio helps you gain complete clarity over your finances — from crypto to real estate, stocks to liabilities — all in one private, self-hosted dashboard.
        </p>
      </motion.section>

      {/* Section: Unified Dashboard */}
      <motion.section variants={fadeUp} className="w-full max-w-5xl flex flex-col gap-4">
        <h2 className="text-4xl font-semibold text-neon">Everything in One Place</h2>
        <p className="text-gray-300 text-lg">
          Connect your assets and liabilities with ease. Whether it&apos;s a savings account, investment portfolio, startup equity, mortgage, or your crypto wallet — Profolio keeps it all in sync and up-to-date, so you always know your real net worth.
        </p>
      </motion.section>

      {/* Section: Save Time */}
      <motion.section variants={fadeUp} className="w-full max-w-5xl flex flex-col gap-4">
        <h2 className="text-4xl font-semibold text-neon">Save Time, Every Day</h2>
        <p className="text-gray-300 text-lg">
          No more bouncing between apps, spreadsheets, and logins. Profolio pulls in the data automatically and lets you override anything manually — giving you instant insight without the manual overhead.
        </p>
        <p className="text-gray-300 text-lg">
          Set up once, then let it run. Check in weekly or whenever big decisions come up. It&apos;s your wealth, streamlined.
        </p>
      </motion.section>

      {/* Section: Intelligent Awareness */}
      <motion.section variants={fadeUp} className="w-full max-w-5xl flex flex-col gap-4">
        <h2 className="text-4xl font-semibold text-neon">Smarter Awareness</h2>
        <p className="text-gray-300 text-lg">
          Track your net worth growth, set tax buffers per asset type, and receive alerts when you hit key thresholds or when markets move. Profolio acts like a financial co-pilot — quietly monitoring and surfacing what matters most.
        </p>
      </motion.section>

      {/* Section: Built for Founders & Builders */}
      <motion.section variants={fadeUp} className="w-full max-w-5xl flex flex-col gap-4">
        <h2 className="text-4xl font-semibold text-neon">Made for Power Users</h2>
        <p className="text-gray-300 text-lg">
          Profolio is modular, extensible, and self-hosted. It respects your privacy and adapts to your use case — whether you&apos;re a solo founder, a remote team, or a crypto-native wealth builder.
        </p>
        <p className="text-gray-300 text-lg">
          You can deploy it via LXC or Docker, customize integrations, and shape the roadmap alongside the open-source community.
        </p>
      </motion.section>

      {/* Section: Your Financial HQ */}
      <motion.section variants={fadeUp} className="w-full max-w-5xl flex flex-col gap-4">
        <h2 className="text-4xl font-semibold text-neon">Your Personal Finance HQ</h2>
        <p className="text-gray-300 text-lg">
          Profolio gives you the control and clarity to make smarter decisions, reduce financial stress, and build long-term security. It&apos;s not just about tracking — it&apos;s about empowering you to grow.
        </p>
      </motion.section>
    </motion.main>
  );
}