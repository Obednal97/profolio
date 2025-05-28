'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button/button';
import Link from 'next/link';

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
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

const VALUES = [
  {
    icon: 'fa-shield-alt',
    title: 'Privacy First',
    description: 'Your financial data stays yours. Self-host or use our encrypted cloud — you maintain complete control.',
  },
  {
    icon: 'fa-puzzle-piece',
    title: 'Modular Design',
    description: 'Built to adapt to your needs. Add features, integrate tools, and customize your experience.',
  },
  {
    icon: 'fa-chart-line',
    title: 'Real Complexity',
    description: 'Designed for real portfolios with crypto, equity, real estate, and international assets.',
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" />
        
        {/* Animated blobs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-3xl opacity-20 dark:opacity-10 animate-blob" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-3xl opacity-20 dark:opacity-10 animate-blob animation-delay-2000" />
        </div>

        {/* Bottom fade gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-50 dark:from-gray-900 to-transparent pointer-events-none" />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerChildren}
          className="relative z-10 px-6 sm:px-12 py-24 max-w-6xl mx-auto"
        >
          <motion.div variants={fadeUp} className="text-center mb-16">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">
              About <span className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">Profolio</span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              A next-generation personal wealth operating system designed for founders, operators, and builders who need more than just spreadsheets.
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-6 sm:px-12">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerChildren}
          className="max-w-6xl mx-auto"
        >
          <motion.h2 
            variants={fadeUp}
            className="text-3xl sm:text-4xl font-bold text-center text-gray-900 dark:text-white mb-16"
          >
            Built on Core Principles
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-8">
            {VALUES.map((value, index) => (
              <motion.div
                key={index}
                variants={fadeUp}
                className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mb-6">
                  <i className={`fas ${value.icon} text-2xl text-white`} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {value.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Story Section */}
      <section className="py-20 px-6 sm:px-12 bg-white dark:bg-gray-800">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerChildren}
          className="max-w-4xl mx-auto"
        >
          <motion.div variants={fadeUp} className="prose prose-lg dark:prose-invert max-w-none">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-8">
              Why We Built Profolio
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
              Most personal finance tools are either too simplistic or too invasive. They force you into rigid categories, 
              harvest your data, or simply can&apos;t handle the complexity of modern wealth — crypto wallets, international 
              assets, startup equity, and tax optimization across jurisdictions.
            </p>
            <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
              Profolio is different. We&apos;re building a modular, self-hosted platform that works the way you do. 
              No subscriptions, no data harvesting, just powerful insights and complete control over your financial life.
            </p>
            
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mt-12 mb-6">
              Privacy as a Right, Not a Feature
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
              We believe you shouldn&apos;t have to trust a third party with your complete financial picture just to get 
              the insights you need. Profolio is designed from the ground up to run on your own server, behind your 
              own firewall, with your data stored locally or encrypted in the cloud.
            </p>

            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mt-12 mb-6">
              Built by Founders, for Founders
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
              I built Profolio because I was frustrated. My financial life didn&apos;t fit in neat boxes: crypto holdings, 
              a limited company, stock options, international assets, and complex tax situations. No existing tool 
              helped me see it all clearly.
            </p>
            <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
              What started as a personal tool has grown into something bigger. Now, we&apos;re opening it up to anyone 
              who feels underserved by the current ecosystem.
            </p>
            
            <div className="bg-gray-100 dark:bg-gray-900 rounded-xl p-6 mt-12">
              <p className="text-gray-700 dark:text-gray-300 italic mb-2">
                &quot;If you&apos;re tired of spreadsheets but wary of giving your data to yet another startup, welcome. 
                I hope Profolio helps you feel more in control of your money, your future, and your freedom.&quot;
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                — Ollie Bednal, Creator of Profolio
              </p>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Roadmap Section */}
      <section className="py-20 px-6 sm:px-12">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerChildren}
          className="max-w-6xl mx-auto"
        >
          <motion.h2 
            variants={fadeUp}
            className="text-3xl sm:text-4xl font-bold text-center text-gray-900 dark:text-white mb-16"
          >
            Where We&apos;re Heading
          </motion.h2>
          
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <motion.div variants={fadeUp} className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                <i className="fas fa-rocket text-blue-500" />
                Coming Soon
              </h3>
              <ul className="space-y-3 text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <i className="fas fa-check text-green-500 mt-1" />
                  <span>Automated asset syncing via APIs</span>
                </li>
                <li className="flex items-start gap-2">
                  <i className="fas fa-check text-green-500 mt-1" />
                  <span>Multi-jurisdictional tax calculations</span>
                </li>
                <li className="flex items-start gap-2">
                  <i className="fas fa-check text-green-500 mt-1" />
                  <span>Price alerts and portfolio triggers</span>
                </li>
                <li className="flex items-start gap-2">
                  <i className="fas fa-check text-green-500 mt-1" />
                  <span>CoinGecko & Yahoo Finance integration</span>
                </li>
              </ul>
            </motion.div>

            <motion.div variants={fadeUp} className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                <i className="fas fa-compass text-purple-500" />
                Future Vision
              </h3>
              <ul className="space-y-3 text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <i className="fas fa-lightbulb text-yellow-500 mt-1" />
                  <span>Collaboration with accountants & advisors</span>
                </li>
                <li className="flex items-start gap-2">
                  <i className="fas fa-lightbulb text-yellow-500 mt-1" />
                  <span>Encrypted cloud backups</span>
                </li>
                <li className="flex items-start gap-2">
                  <i className="fas fa-lightbulb text-yellow-500 mt-1" />
                  <span>Optional managed hosting</span>
                </li>
                <li className="flex items-start gap-2">
                  <i className="fas fa-lightbulb text-yellow-500 mt-1" />
                  <span>Developer API & plugin system</span>
                </li>
              </ul>
            </motion.div>
          </div>

          <motion.div variants={fadeUp} className="text-center">
            <Button asChild size="lg" className="text-lg px-8 py-6">
              <Link href="/auth/signUp">
                Join the Journey
                <i className="fas fa-arrow-right ml-2" />
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </section>
    </main>
  );
}