import { useRouter } from 'next/navigation';

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