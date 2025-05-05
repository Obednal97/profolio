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

export default function AboutPage() {
  return (
    <motion.main
      initial="hidden"
      animate="visible"
      variants={staggerChildren}
      className="relative w-full flex flex-col items-center justify-center px-6 sm:px-12 py-24 gap-24 text-white"
    >
      {/* Hero Section */}
      <motion.section
        variants={fadeUp}
        className="w-full max-w-6xl text-center flex flex-col items-center gap-6"
      >
        <h1 className="text-6xl sm:text-8xl font-bold tracking-tight drop-shadow-md">
          About Profolio
        </h1>
        <p className="text-xl sm:text-2xl text-gray-400 max-w-3xl drop-shadow-sm">
          Profolio is a next-generation personal wealth operating system — designed for founders, operators, and builders who need more than just spreadsheets or budgeting apps. It&apos;s purpose-built to help you manage complex assets, navigate taxes, and maintain clarity across your entire financial life.
        </p>
      </motion.section>

      {/* Our Vision */}
      <motion.section
        variants={fadeUp}
        className="w-full max-w-5xl text-left flex flex-col gap-4"
      >
        <h2 className="text-4xl font-semibold text-neon">Our Vision</h2>
        <p className="text-gray-300 text-lg">
          Most personal finance tools are either too simplistic or too invasive. Profolio is different. We&apos;re building a modular, self-hosted platform that works the way you do — spanning crypto, real estate, equity, and liabilities — with tax awareness and future planning baked in.
        </p>
        <p className="text-gray-300 text-lg">
          Our goal is to give you full autonomy over your wealth — no subscriptions, no data harvesting, just powerful insights and clarity.
        </p>
      </motion.section>

      {/* Philosophy */}
      <motion.section
        variants={fadeUp}
        className="w-full max-w-5xl text-left flex flex-col gap-4"
      >
        <h2 className="text-4xl font-semibold text-neon">Why Self-Hosted?</h2>
        <p className="text-gray-300 text-lg">
          We believe privacy is a right — not a premium feature. Profolio is designed from the ground up to run on your own server, behind your own firewall, with your data stored locally or encrypted in the cloud.
        </p>
        <p className="text-gray-300 text-lg">
          You shouldn&apos;t have to trust a third party with your full financial life just to get the insights you need.
        </p>
      </motion.section>

      {/* Roadmap */}
      <motion.section
        variants={fadeUp}
        className="w-full max-w-5xl text-left flex flex-col gap-4"
      >
        <h2 className="text-4xl font-semibold text-neon">Where We&apos;re Going</h2>
        <p className="text-gray-300 text-lg">
          Profolio&apos;s roadmap includes support for automated asset syncing, multi-jurisdictional tax logic, alert triggers for price and net worth changes, and integrations with external tools like CoinGecko, Yahoo Finance, and Plaid.
        </p>
        <p className="text-gray-300 text-lg">
          Longer term, we&apos;ll support collaboration with accountants or partners, encrypted backups, and optional cloud hosting — while staying extensible for developers and tinkerers.
        </p>
      </motion.section>

      {/* Personal Note */}
      <motion.section
        variants={fadeUp}
        className="w-full max-w-5xl text-left flex flex-col gap-4"
      >
        <h2 className="text-4xl font-semibold text-neon">A Note from the Founder</h2>
        <p className="text-gray-300 text-lg">
          I built Profolio because I was frustrated. Every solution I tried felt like a “make-do” workaround — not something built for real complexity. My own financial life didn&apos;t fit in neat boxes: I had crypto, a limited company, stock options, liabilities, and a desire to optimize for the future. No app out there really helped me see it all clearly.
        </p>
        <p className="text-gray-300 text-lg">
          Profolio started as a tool for me — a founder trying to gain clarity and confidence. But the more I shared it, the more others wanted it too. Now, I&apos;m opening it up to anyone who feels underserved by the current ecosystem.
        </p>
        <p className="text-gray-300 text-lg">
          If that&apos;s you — welcome. I hope Profolio helps you feel more in control of your money, your future, and your freedom.
        </p>
        <p className="text-gray-500 text-sm italic">
          — Ollie Bednal, Creator of Profolio
        </p>
      </motion.section>
    </motion.main>
  );
}