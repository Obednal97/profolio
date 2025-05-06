'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth'; 
import { useUser } from '@/lib/user';
import type { User } from '@/types/global';
import { Input } from '@/components/ui/input/input';
import { Button } from '@/components/ui/button/button';
import { AuthLayout } from "@/components/layout/authLayout";

function SignInPage() {
  const router = useRouter();
  const { signInWithCredentials } = useAuth();
  const { data: user } = useUser() as { data: User | null };

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFormValid = formData.email.trim() !== '' && formData.password.trim() !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signInWithCredentials({
        email: formData.email,
        password: formData.password,
        callbackUrl: '/app/dashboard',
        redirect: true,
      });
    } catch (err) {
      console.error('Sign in error:', err);
      setError('Invalid email or password');
      setLoading(false);
      return;
    }
  };

  useEffect(() => {
    if (user?.token) {
      router.push('/app/dashboard');
    }
  }, [user, router]);

  if (user?.token) return null;

  return (
    <AuthLayout>
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-green-500 bg-clip-text text-transparent">
              Welcome to Profolio
            </h1>
            <p className="text-white/60 mt-2">Sign in to access your dashboard</p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl shadow-lg border border-white/20">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
                <p className="text-red-400 flex items-center gap-2">
                  ⚠️ {error}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1">Email Address</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/60 mb-1">Password</label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>

              <div className="text-sm mt-1">
                <p className="text-white/60">
                  Forgot your password?{' '}
                  <a href="/auth/forgotPassword" className="text-green-400 hover:text-green-300 font-medium">
                    Reset it here
                  </a>.
                </p>
              </div>

              <Button
                type="submit"
                disabled={loading || !isFormValid}
                className="w-full bg-green-500 hover:bg-green-600 text-black font-semibold rounded-xl py-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-1">
                    <div className="w-2 h-2 rounded-full animate-pulse bg-black"></div>
                    <div className="w-2 h-2 rounded-full animate-pulse bg-black delay-100"></div>
                    <div className="w-2 h-2 rounded-full animate-pulse bg-black delay-200"></div>
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <p className="text-center mt-6 text-white/60">
              Don’t have an account?{' '}
              <a href="/auth/signUp" className="text-green-400 hover:text-green-300 transition-colors">
                Sign up
              </a>
            </p>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}

export default SignInPage;