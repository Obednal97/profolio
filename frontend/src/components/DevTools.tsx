'use client';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export function DevTools() {
  const { forceLogout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="bg-black text-white px-3 py-2 rounded shadow hover:bg-gray-800"
      >
        Dev Tools
      </button>
      {open && (
        <div className="mt-2 bg-white border rounded shadow p-4 text-sm">
          <button
            onClick={forceLogout}
            className="text-red-600 hover:underline"
          >
            Force Logout
          </button>
        </div>
      )}
    </div>
  );
}