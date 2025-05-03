'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="bg-background text-foreground min-h-screen px-4 sm:px-12 py-8 space-y-12">
      {/* Header */}
      <header className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Profolio</h1>
        <div className="flex items-center space-x-4">
          <select
            onChange={(e) =>
              document.documentElement.setAttribute('data-theme', e.target.value)
            }
            className="bg-card text-foreground border border-gray-600 rounded px-2 py-1 text-sm"
            defaultValue="system"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
          <Link href="/login" className="bg-neon px-4 py-2 rounded shadow-neon hover:shadow-pinkGlow transition-shadow">
            Login
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="text-center">
        <h2 className="text-4xl font-bold mb-4">Your Wealth, Unified</h2>
        <p className="text-lg max-w-2xl mx-auto text-gray-300">
          Profolio brings together your assets, liabilities, crypto, stocks, and properties into a single clean dashboard.
        </p>
        <div className="mt-8">
          <img
            src="/hero.png"
            alt="Profolio preview"
            className="mx-auto rounded-xl shadow-xl shadow-neon/30"
          />
        </div>
      </section>

      {/* Features */}
      <section className="grid sm:grid-cols-3 gap-6">
        {[
          { title: 'Unified Net Worth', desc: 'See your full financial picture in one place.' },
          { title: 'Live Syncing', desc: 'Auto updates from stocks, crypto, banks, and more.' },
          { title: 'Tax Awareness', desc: 'Plan with tax buffers based on your residency.' },
        ].map(({ title, desc }) => (
          <div
            key={title}
            className="bg-card rounded-xl p-6 text-left hover:scale-105 transition-transform duration-200 shadow hover:shadow-neon"
          >
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <p className="text-sm text-gray-400">{desc}</p>
          </div>
        ))}
      </section>

      {/* About */}
      <section className="max-w-4xl mx-auto text-center">
        <h2 className="text-2xl font-bold mb-2">Why Profolio?</h2>
        <p className="text-gray-300">
          Whether you’re a founder, investor, or just getting a grip on personal finances — Profolio gives you clarity,
          control, and peace of mind by letting you manage everything in one private, powerful place.
        </p>
      </section>

      {/* Footer */}
      <footer className="pt-12 border-t border-gray-700 text-sm text-gray-400 text-center space-y-2">
        <div className="space-x-4">
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="mailto:hello@profolio.app">Contact</Link>
        </div>
        <p>&copy; {new Date().getFullYear()} Profolio. All rights reserved.</p>
      </footer>
    </main>
  );
}