'use client';

import { motion } from 'framer-motion';
import { Table, type Column } from '@/components/tables/tables';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

const staggerChildren = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15 },
  },
};

const faqs = [
  {
    q: 'What is included in the Free tier?',
    a: 'The Free tier includes access to the full self-hosted Profolio codebase. You can install and run it on your own infrastructure via GitHub.'
  },
  {
    q: 'Can I upgrade later?',
    a: 'Yes. You can start self-hosted and upgrade to the cloud version anytime. All your data stays with you.'
  },
  {
    q: 'Is the cloud version secure?',
    a: 'Yes. It is hosted in encrypted environments with user-controlled permissions and end-to-end data isolation.'
  },
  {
    q: 'Can I cancel my subscription?',
    a: 'Yes, you can cancel monthly or annually at any time. You keep access until your billing period ends.'
  }
];

const comparisonData = [
  { feature: 'Self-hosted', free: '✅', monthly: '❌', annual: '❌' },
  { feature: 'Cloud-hosted', free: '❌', monthly: '✅', annual: '✅' },
  { feature: 'Multiple users / collaboration', free: '❌', monthly: '✅', annual: '✅' },
  { feature: 'Auto-updates', free: '❌', monthly: '✅', annual: '✅' },
  { feature: 'Manual override fields', free: '✅', monthly: '✅', annual: '✅' },
  { feature: 'Tax buffer tracking', free: '✅', monthly: '✅', annual: '✅' },
  { feature: 'Email alerts', free: '❌', monthly: '✅', annual: '✅' },
  { feature: 'Custom alerts', free: '❌', monthly: '✅', annual: '✅' }
];

const columns: Column<{ feature: string; free: string; monthly: string; annual: string }>[] = [
  { header: 'Feature', accessor: 'feature' },
  { header: 'Free', accessor: 'free', align: 'center' },
  { header: 'Monthly', accessor: 'monthly', align: 'center' },
  { header: 'Annual', accessor: 'annual', align: 'center' },
];

export default function PricingPage() {
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
          Pricing
        </h1>
        <p className="text-xl sm:text-2xl text-gray-400 max-w-3xl mx-auto drop-shadow-sm">
          Start free. Upgrade when you need more collaboration or convenience.
        </p>
      </motion.section>

      {/* Plans */}
      <motion.section variants={fadeUp} className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full">
        {/* Free Plan */}
        <div className="bg-muted/10 p-6 rounded-xl border border-muted/30">
          <h2 className="text-2xl font-semibold">Free</h2>
          <p className="text-gray-400 text-sm mb-4">Self-hosted • 1 user</p>
          <p className="text-4xl font-bold mb-4">£0</p>
          <ul className="text-gray-300 text-sm space-y-2">
            <li>✅ Source available on GitHub</li>
            <li>✅ Full feature access</li>
            <li>✅ Local or cloud self-hosting</li>
            <li>❌ No cloud sync or collaboration</li>
            <li>❌ No support or updates</li>
          </ul>
        </div>

        {/* Monthly Plan */}
        <div className="bg-muted/10 p-6 rounded-xl border border-neon shadow-neon ring-2 ring-neon">
          <h2 className="text-2xl font-semibold">Cloud – Monthly</h2>
          <p className="text-gray-400 text-sm mb-4">Cloud-hosted • £9.99/user/mo</p>
          <p className="text-4xl font-bold mb-4">£9.99</p>
          <ul className="text-gray-300 text-sm space-y-2">
            <li>✅ Fully managed hosting</li>
            <li>✅ Collaboration features</li>
            <li>✅ Auto-updates & support</li>
            <li>✅ Email alerts & backups</li>
            <li>✅ API access</li>
          </ul>
        </div>

        {/* Annual Plan */}
        <div className="relative bg-muted/10 p-6 rounded-xl border border-muted/30">
          <div className="absolute top-0 right-0 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-tr-xl rounded-bl-xl shadow-lg z-10">
            20% OFF
          </div>
          <h2 className="text-2xl font-semibold">Cloud – Annual</h2>
          <p className="text-gray-400 text-sm mb-4">Cloud-hosted • £95.90/user/yr</p>
          <p className="text-4xl font-bold mb-4">£95.90</p>
          <ul className="text-gray-300 text-sm space-y-2">
            <li>✅ All Monthly Plan features</li>
            <li>✅ Priority support</li>
            <li>✅ Annual billing discount</li>
          </ul>
        </div>
      </motion.section>

      {/* Feature Comparison */}
      <motion.section variants={fadeUp} className="max-w-6xl w-full">
        <h2 className="text-3xl font-semibold text-center mb-6">Compare All Features</h2>
        <Table
          columns={columns}
          data={comparisonData}
          rowKey={(row) => row.feature}
          className="border border-muted/30 rounded-xl"
        />
      </motion.section>

      {/* Key Features */}
      <motion.section variants={fadeUp} className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        {[
          ['Net Worth Dashboard', 'Track your full financial picture in real-time.'],
          ['Automated Price Syncing', 'Pull in values for crypto, stocks, and more.'],
          ['Tax-aware Forecasting', 'Get insights into how much you actually own.'],
          ['Custom Alerts', 'Set thresholds for price, deadlines, and net worth.'],
          ['Private by Default', 'Self-host or choose end-to-end encrypted cloud.'],
          ['Manual Overrides', 'Take control when automation needs context.']
        ].map(([title, desc], i) => (
          <div key={i} className="bg-muted/5 p-6 rounded-xl border border-muted/20">
            <h3 className="text-xl font-semibold">{title}</h3>
            <p className="text-gray-400 text-sm">{desc}</p>
          </div>
        ))}
      </motion.section>

      {/* FAQ */}
      <motion.section variants={fadeUp} className="max-w-4xl w-full mt-12 space-y-6">
        <h2 className="text-3xl font-semibold text-center">Frequently Asked Questions</h2>
        {faqs.map(({ q, a }, i) => (
          <div key={i} className="border-t border-muted/20 pt-4">
            <details>
              <summary className="cursor-pointer text-neon text-lg font-medium">{q}</summary>
              <p className="text-gray-400 mt-2 text-sm">{a}</p>
            </details>
          </div>
        ))}
      </motion.section>
    </motion.main>
  );
}