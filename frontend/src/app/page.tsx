'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Tile } from '@/components/ui/tile/tile';
import { Button } from '@/components/ui/button/button';

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

export default function LandingPage() {
  return (
    <div className="bg-background text-foreground min-h-screen px-4 sm:px-12 py-8 space-y-12">
      {/* Hero Section */}
      <section aria-label="Hero Section" className="text-center">
        <h2 className="text-4xl font-bold mb-4 text-neon">Your Wealth, Unified</h2>
        <p className="text-lg max-w-2xl mx-auto text-gray-300">
          Profolio brings together your assets, liabilities, crypto, stocks, and properties into a single clean dashboard.
        </p>
        <div className="mt-8 flex flex-col items-center space-y-6 sm:flex-row sm:space-y-0 sm:space-x-8 justify-center">
          <Image
            src="/hero.png"
            alt="Profolio preview"
            width={600}
            height={400}
            className="mx-auto rounded-xl shadow-xl shadow-neon/30 w-full sm:max-w-md h-auto"
          />
          <Button asChild>
            <Link href="/login">See It In Action</Link>
          </Button>
        </div>
      </section>

      {/* Testimonials Section */}
      <section
        aria-label="Testimonials"
        className="bg-card rounded-xl p-6 max-w-4xl mx-auto text-center mt-12 space-y-4 shadow hover:shadow-neon transition-shadow"
      >
        <h2 className="text-xl font-semibold text-neon">
          Trusted by founders, creators, and tech-savvy investors
        </h2>
        {TESTIMONIALS.map((quote, i) => (
          <Tile key={i}>
            <p className="text-gray-400 italic">{quote}</p>
          </Tile>
        ))}
      </section>

      {/* Features */}
      <section aria-label="Features" className="grid sm:grid-cols-3 gap-6">
        {FEATURES.map(({ title, desc }) => (
          <Tile
            key={title}
            className="hover:scale-105 transition-transform duration-200 shadow hover:shadow-neon"
          >
            <h3 className="text-xl font-semibold mb-2 text-neon">{title}</h3>
            <p className="text-sm text-gray-400">{desc}</p>
          </Tile>
        ))}
      </section>

      {/* Feature Highlight Section */}
      <section aria-label="Feature Highlights" className="grid sm:grid-cols-3 gap-6 mt-12">
        {FEATURE_HIGHLIGHTS.map(({ title, desc }) => (
          <Tile key={title} className="border border-neon/40 hover:border-neon">
            <h3 className="text-xl font-bold text-neon mb-2">{title}</h3>
            <p className="text-sm text-gray-400">{desc}</p>
          </Tile>
        ))}
      </section>

      {/* About */}
      <section aria-label="About Profolio" className="max-w-4xl mx-auto text-center">
        <h2 className="text-2xl font-bold mb-2 text-neon">Why Profolio?</h2>
        <p className="text-gray-300">
          Whether you’re a founder, investor, or just getting a grip on personal finances — Profolio gives you clarity,
          control, and peace of mind by letting you manage everything in one private, powerful place.
        </p>
      </section>
    </div>
  );
}