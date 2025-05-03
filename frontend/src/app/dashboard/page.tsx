import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

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

async function fetchData(userId: string) {
  try {
    const [assetsRes, liabilitiesRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/assets?userId=${userId}`, { cache: 'no-store' }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/liabilities?userId=${userId}`, { cache: 'no-store' }),
    ]);

    const assets = await assetsRes.json();
    const liabilities = await liabilitiesRes.json();

    if (!Array.isArray(assets) || !Array.isArray(liabilities)) {
      console.error('Invalid data shape:', { assets, liabilities });
      return { assets: [], liabilities: [] };
    }

    return { assets, liabilities };
  } catch (error) {
    console.error('Fetch failed:', error);
    return { assets: [], liabilities: [] };
  }
}

export default async function DashboardPage() {
  const userId = cookies().get('userId')?.value;
  if (!userId) {
    redirect('/login');
  }

  const { assets, liabilities } = await fetchData(userId);

  const totalAssets = assets.reduce((acc: number, a: Asset) => acc + (a.valueOverride ?? 0), 0);
  const totalLiabilities = liabilities.reduce((acc: number, l: Liability) => acc + l.balance, 0);
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
          {assets.map((a: Asset) => (
            <li key={a.id} className="p-3 bg-white shadow rounded">
              {a.name} – £{((a.valueOverride ?? 0) / 100).toFixed(2)}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h2 className="text-xl font-semibold mt-8 mb-2">Liabilities</h2>
        <ul className="space-y-2">
          {liabilities.map((l: Liability) => (
            <li key={l.id} className="p-3 bg-white shadow rounded">
              {l.name} – £{(l.balance / 100).toFixed(2)}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}