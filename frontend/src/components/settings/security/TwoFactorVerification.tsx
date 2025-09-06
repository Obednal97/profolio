'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, KeyRound } from 'lucide-react';

interface TwoFactorVerificationProps {
  verificationToken: string;
  onSuccess: (data: any) => void;
  onCancel?: () => void;
}

export function TwoFactorVerification({
  verificationToken,
  onSuccess,
  onCancel,
}: TwoFactorVerificationProps) {
  const [code, setCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verifyMutation = useMutation({
    mutationFn: async () => {
      const endpoint = useBackupCode
        ? '/api/auth/2fa/backup'
        : '/api/auth/2fa/complete';
      
      const response = await apiClient.post(endpoint, {
        verificationToken,
        code: useBackupCode ? code : code.replace(/\s/g, ''),
      });
      
      return response.data;
    },
    onSuccess: (data) => {
      if (data.token) {
        // Store token
        localStorage.setItem('token', data.token);
      }
      onSuccess(data);
    },
    onError: (error: any) => {
      setError(error.response?.data?.error || 'Invalid code. Please try again.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const minLength = useBackupCode ? 9 : 6; // XXXX-XXXX format for backup codes
    if (code.length >= minLength) {
      verifyMutation.mutate();
    }
  };

  const handleCodeChange = (value: string) => {
    if (useBackupCode) {
      // Format backup code as XXXX-XXXX
      const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (cleaned.length <= 8) {
        const formatted = cleaned.length > 4
          ? `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`
          : cleaned;
        setCode(formatted);
      }
    } else {
      // Only allow digits for TOTP codes
      const cleaned = value.replace(/\D/g, '').slice(0, 6);
      setCode(cleaned);
    }
  };

  return (
    <div className="liquid-glass-card p-6 max-w-md mx-auto">
      <div className="flex items-center mb-4">
        <Shield className="w-8 h-8 text-blue-600 mr-3" />
        <h2 className="text-2xl font-semibold">Two-Factor Authentication</h2>
      </div>

      <p className="text-gray-600 mb-6">
        {useBackupCode
          ? 'Enter one of your backup codes to sign in.'
          : 'Enter the 6-digit code from your authenticator app.'}
      </p>

      {error && (
        <Alert className="mb-4 border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="code" className="block text-sm font-medium mb-2">
            {useBackupCode ? 'Backup Code' : 'Verification Code'}
          </label>
          <input
            id="code"
            type="text"
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            placeholder={useBackupCode ? 'XXXX-XXXX' : '000000'}
            className="w-full text-2xl font-mono text-center p-3 border-2 rounded-lg"
            maxLength={useBackupCode ? 9 : 6}
            data-testid="2fa-code-input"
            autoFocus
            required
          />
        </div>

        <Button
          type="submit"
          className="w-full mb-3"
          disabled={
            (useBackupCode ? code.length < 9 : code.length < 6) ||
            verifyMutation.isPending
          }
          data-testid="2fa-verify-button"
        >
          {verifyMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Verifying...
            </>
          ) : (
            'Verify'
          )}
        </Button>

        <button
          type="button"
          onClick={() => {
            setUseBackupCode(!useBackupCode);
            setCode('');
            setError(null);
          }}
          className="w-full text-sm text-blue-600 hover:text-blue-700 mb-3"
          data-testid="2fa-toggle-backup"
        >
          <KeyRound className="w-4 h-4 inline mr-1" />
          {useBackupCode ? 'Use authenticator app' : 'Use backup code'}
        </button>

        {onCancel && (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
      </form>
    </div>
  );
}