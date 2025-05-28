import { useRouter } from 'next/navigation';

// Development bypass flag - set to true to bypass authentication
const BYPASS_AUTH = true;

interface SignInParams {
  email: string;
  password: string;
  callbackUrl?: string;
  redirect?: boolean;
}

export function useAuth() {
  const router = useRouter();

  async function signInWithCredentials({
    email,
    password,
    callbackUrl = '/dashboard',
    redirect = true,
  }: SignInParams) {
    if (BYPASS_AUTH) {
      // Mock sign in for development
      console.log('Dev mode: Mock sign in', { email });
      if (redirect) {
        router.push(callbackUrl);
      }
      return { success: true, user: { email, id: 'dev-user-123' } };
    }

    const res = await fetch('/api/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      throw new Error('Invalid email or password');
    }

    if (redirect) {
      router.push(callbackUrl);
    }

    return res.json();
  }

  return { signInWithCredentials };
}