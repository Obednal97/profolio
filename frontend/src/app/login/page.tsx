'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const [userId, setUserId] = useState('');
  const router = useRouter();

  const handleLogin = () => {
    if (!userId.trim()) return;
    localStorage.setItem('userId', userId);
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-semibold mb-6 text-center">Profolio Login</h1>
        <Input
          type="text"
          placeholder="Enter your user ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="mb-4"
        />
        <Button onClick={handleLogin} className="w-full">
          Continue
        </Button>
      </div>
    </div>
  );
}