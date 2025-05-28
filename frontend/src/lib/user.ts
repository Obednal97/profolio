// src/lib/user.ts
import { useState, useEffect } from 'react';
import type { User } from '@/types/global';

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const { apiCall } = await import('./mockApi');
        const response = await apiCall('/api/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ method: 'GET_PROFILE' }),
        });
        
        const data = await response.json();
        if (data.user) {
          setUser(data.user);
        }
      } catch (error) {
        console.error('Failed to load user:', error);
        // Fallback to basic user data
        setUser({
          id: "demo-user-id",
          name: "Demo User",
          email: "demo@example.com",
        });
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  return {
    data: user,
    loading,
  };
}