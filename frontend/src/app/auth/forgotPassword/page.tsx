'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useAuth';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { data: user } = useUser();

  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (user?.token) {
      router.push('/app/dashboard');
    }
  }, [user, router]);

  if (user?.token) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // simulate email submission
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white/5 backdrop-blur rounded-lg p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-white mb-4">Forgot your password?</h1>
        <p className="text-sm text-white/70 mb-6">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>
        {submitted ? (
          <p className="text-green-400 text-sm">If this email exists, a reset link has been sent.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 rounded bg-white/10 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <button
              type="submit"
              className="w-full py-2 bg-green-500 hover:bg-green-400 text-white font-semibold rounded"
            >
              Send reset link
            </button>
          </form>
        )}
      </div>
    </div>
  );
}