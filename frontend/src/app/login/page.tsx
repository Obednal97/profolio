'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEffect } from 'react';

export default function LoginPage() {
  const [userId, setUserId] = useState('');
  const router = useRouter();

  useEffect(() => {
    const mode = localStorage.getItem('theme');
    if (mode === 'light') {
      document.documentElement.classList.remove('dark');
    } else if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      // System preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    localStorage.setItem('theme', value);
    if (value === 'light') {
      document.documentElement.classList.remove('dark');
    } else if (value === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  const handleLogin = () => {
    if (!userId.trim()) return;
    localStorage.setItem('userId', userId);
    router.push('/dashboard');
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white">
      <div className="absolute top-4 right-4">
        <select
          onChange={handleThemeChange}
          defaultValue={localStorage.getItem('theme') || 'system'}
          className="bg-white/10 text-white p-2 rounded border border-white/20"
        >
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>
      <div className="flex items-center justify-center h-full">
        <div className="bg-white/10 backdrop-blur-lg p-8 rounded-xl shadow-lg w-full max-w-sm border border-white/20">
          <h1 className="text-3xl font-bold mb-6 text-center">Welcome to Profolio</h1>
          <Input
            type="text"
            placeholder="Enter your user ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="mb-4 bg-white/10 text-white placeholder-gray-400 border border-white/20 focus:ring-2 focus:ring-green-400"
          />
          <Button
            onClick={handleLogin}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}