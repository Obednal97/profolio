'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Asset = {
  id: string;
  name: string;
  valueOverride?: number;
  quantity: number;
  currency: string;
};

type Liability = {
  id: string;
  name: string;
  balance: number;
};

export default function DashboardPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const router = useRouter();

  useEffect(() => {
    const uid = localStorage.getItem('userId');
    if (!uid) {
      router.push('/login');
      return;
    }
    setUserId(uid);

    fetch(`/api/assets?userId=${uid}`)
      .then(res => res.json())
      .then(setAssets)
      .catch(() => setAssets([]));

    fetch(`/api/liabilities?userId=${uid}`)
      .then(res => res.json())
      .then(setLiabilities)
      .catch(() => setLiabilities([]));
  }, [router]);

  const totalAssets = assets.reduce((acc, a) => acc + (a.valueOverride ?? 0), 0);
  const totalLiabilities = liabilities.reduce((acc, l) => acc + l.balance, 0);
  const netWorth = totalAssets - totalLiabilities;

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-green-100 p-4 rounded shadow">Assets: £{(totalAssets / 100).toFixed(2)}</div>
        <div className="bg-red-100 p-4 rounded shadow">Liabilities: £{(totalLiabilities / 100).toFixed(2)}</div>
        <div className="bg-blue-100 p-4 rounded shadow">Net Worth: £{(netWorth / 100).toFixed(2)}</div>
      </div>
      <div>
        <h2 className="text-xl font-semibold mt-8 mb-2">Assets</h2>
        <ul className="space-y-2">
          {assets.map((a) => (
            <li key={a.id} className="p-3 bg-white shadow rounded">
              {a.name} – £{((a.valueOverride ?? 0) / 100).toFixed(2)}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h2 className="text-xl font-semibold mt-8 mb-2">Liabilities</h2>
        <ul className="space-y-2">
          {liabilities.map((l) => (
            <li key={l.id} className="p-3 bg-white shadow rounded">
              {l.name} – £{(l.balance / 100).toFixed(2)}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}