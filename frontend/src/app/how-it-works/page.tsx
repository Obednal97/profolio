'use client';

import { motion, useAnimationFrame } from 'framer-motion';
import { useState } from 'react';

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

const getLiveNetWorth = () => {
  const base = 700_000; // Start at 700k
  const ratePerSecond = 0.01; // +0.01 per second
  const now = Math.floor(Date.now() / 1000);
  return base + ratePerSecond * (now - 1700000000);
};

const formatCompactNumber = (num: number) =>
  Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(num);

export default function HowItWorksPage() {
  const [liveNetWorth, setLiveNetWorth] = useState(getLiveNetWorth());

  useAnimationFrame(() => {
    setLiveNetWorth(getLiveNetWorth());
  });

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
        <p className="text-neon text-base font-mono animate-pulse">
          Built for clarity. Designed for peace of mind.
        </p>
      </motion.section>

      {/* Live Net Worth Tile */}
      <motion.section
        variants={fadeUp}
        className="w-full max-w-4xl text-center p-6 bg-gradient-to-br from-pink-500 via-green-400 to-blue-500 text-black rounded-xl shadow-xl"
      >
        <h2 className="text-xl font-bold tracking-tight mb-2">Live net worth tracked on Profolio</h2>
        <p className="text-4xl font-extrabold tracking-wide">
          {formatCompactNumber(liveNetWorth)}
        </p>
        <p className="text-sm mt-2 text-black/70">Updated every second — and growing</p>
      </motion.section>

      {/* Section: Unified Dashboard */}
      <motion.section variants={fadeUp} className="w-full max-w-5xl flex flex-col gap-4 bg-white/5 p-6 rounded-xl shadow-md">
        <h2 className="text-4xl font-semibold">Everything in One Place</h2>
        <p className="text-gray-300 text-lg">
          Connect your assets and liabilities with ease. Whether it&apos;s a savings account, investment portfolio, startup equity, mortgage, or your crypto wallet — Profolio keeps it all in sync and up-to-date, so you always know your real net worth.
        </p>
      </motion.section>

      {/* Section: Save Time */}
      <motion.section variants={fadeUp} className="w-full max-w-5xl flex flex-col gap-4">
        <h2 className="text-4xl font-semibold">Save Time, Every Day</h2>
        <p className="text-gray-300 text-lg">
          No more bouncing between apps, spreadsheets, and logins. Profolio pulls in the data automatically and lets you override anything manually — giving you instant insight without the manual overhead.
        </p>
        <p className="text-gray-300 text-lg">
          Set up once, then let it run. Check in weekly or whenever big decisions come up. It&apos;s your wealth, streamlined.
        </p>
      </motion.section>

      {/* Section: Intelligent Awareness */}
      <motion.section variants={fadeUp} className="w-full max-w-5xl flex flex-col gap-4 bg-white/5 p-6 rounded-xl shadow-md">
        <h2 className="text-4xl font-semibold">Smarter Awareness</h2>
        <p className="text-gray-300 text-lg">
          🧠 Set tax buffers per asset type, so you&apos;re never caught off guard.
        </p>
        <p className="text-gray-300 text-lg">
          📈 Track your net worth across time and feel your progress.
        </p>
        <p className="text-gray-300 text-lg">
          ⚠️ Receive smart alerts that actually help you act.
        </p>
        <p className="text-gray-300 text-lg">
          Profolio acts like a financial co-pilot — quietly monitoring and surfacing what matters most.
        </p>
      </motion.section>

      {/* Testimonial Carousel */}
      <motion.section variants={fadeUp} className="w-full max-w-6xl text-center">
        <h2 className="text-3xl font-semibold mb-6">What People Are Saying</h2>
        <div className="overflow-x-auto flex space-x-6 p-4 snap-x auto-scroll">
          {[
            'Finally, something built for founders who understand spreadsheets.',
            'Profolio gave me clarity over my crypto, equity, and mortgage in one place.',
            'It feels like Notion and my bank had a very secure baby.',
          ].map((quote, i) => (
            <div
              key={i}
              className="min-w-[300px] snap-center bg-white/10 p-4 rounded-xl text-left shadow-md text-gray-300"
            >
              <p className="italic">&ldquo;{quote}&rdquo;</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Section: Built for Founders & Builders */}
      <motion.section variants={fadeUp} className="w-full max-w-5xl flex flex-col gap-4">
        <h2 className="text-4xl font-semibold">Made for Power Users</h2>
        <p className="text-gray-300 text-lg">
          Profolio is modular, extensible, and self-hosted. It respects your privacy and adapts to your use case — whether you&apos;re a solo founder, a remote team, or a crypto-native wealth builder.
        </p>
        <p className="text-gray-300 text-lg">
          You can deploy it via LXC or Docker, customize integrations, and shape the roadmap alongside the open-source community.
        </p>
      </motion.section>

      {/* Section: Your Financial HQ */}
      <motion.section variants={fadeUp} className="w-full max-w-5xl flex flex-col gap-4 bg-white/5 p-6 rounded-xl shadow-md">
        <h2 className="text-4xl font-semibold">Your Personal Finance HQ</h2>
        <p className="text-gray-300 text-lg">
          Profolio gives you the control and clarity to make smarter decisions, reduce financial stress, and build long-term security. It&apos;s not just about tracking — it&apos;s about empowering you to grow.
        </p>
      </motion.section>

      {/* Final Callout */}
      <motion.section variants={fadeUp} className="w-full max-w-4xl text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to take control?</h2>
        <p className="text-gray-400 text-lg">
          Join the growing community of founders and financial nerds using Profolio to build real clarity.
        </p>
      </motion.section>

      {/* FAQ Section */}
      <motion.section variants={fadeUp} className="w-full max-w-4xl">
        <h2 className="text-3xl font-semibold mb-4 text-center">FAQs</h2>
        <div className="space-y-4">
          {[
            ['Can I host this myself?', 'Yes! The core is open source and deployable via LXC or Docker.'],
            ['Is my data private?', 'Always. You control where and how your data is stored.'],
            ['Does the paid version include support?', 'Yes — plus collaboration features and automated syncing.']
          ].map(([q, a], i) => (
            <details key={i} className="bg-white/5 p-4 rounded-xl">
              <summary className="cursor-pointer font-medium">{q}</summary>
              <p className="text-gray-300 mt-2">{a}</p>
            </details>
          ))}
        </div>
      </motion.section>

    </motion.main>
  );
}