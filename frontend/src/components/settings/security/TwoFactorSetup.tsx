'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, Copy, Download, CheckCircle } from 'lucide-react';
import Image from 'next/image';

type SetupStep = 'password' | 'qr' | 'verify' | 'backup' | 'complete';

interface SetupResponse {
  qrCode: string;
  secret: string;
  backupCodes: string[];
}

export function TwoFactorSetup({ onComplete }: { onComplete?: () => void }) {
  const [step, setStep] = useState<SetupStep>('password');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [setupData, setSetupData] = useState<SetupResponse | null>(null);
  const [backupCodesSaved, setBackupCodesSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Setup mutation
  const setupMutation = useMutation({
    mutationFn: async (password: string) => {
      const response = await apiClient.post('/api/auth/2fa/setup', { password });
      return response.data;
    },
    onSuccess: (data: SetupResponse) => {
      setSetupData(data);
      setStep('qr');
      setError(null);
    },
    onError: (error: any) => {
      setError(error.response?.data?.error || 'Failed to setup 2FA');
    },
  });

  // Verify mutation
  const verifyMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiClient.post('/api/auth/2fa/verify', { code });
      return response.data;
    },
    onSuccess: () => {
      setStep('backup');
      setError(null);
    },
    onError: (error: any) => {
      setError(error.response?.data?.error || 'Invalid verification code');
    },
  });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password) {
      setupMutation.mutate(password);
    }
  };

  const handleVerificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode.length === 6) {
      verifyMutation.mutate(verificationCode);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadBackupCodes = () => {
    if (!setupData?.backupCodes) return;
    
    const content = `Profolio Backup Codes
Generated: ${new Date().toISOString()}

IMPORTANT: Store these codes in a secure place.
Each code can only be used once.

${setupData.backupCodes.join('\n')}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'profolio-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleComplete = () => {
    setStep('complete');
    setTimeout(() => {
      onComplete?.();
    }, 2000);
  };

  return (
    <div className="liquid-glass-card p-6 max-w-2xl mx-auto">
      {/* Progress indicator */}
      <div className="flex justify-between mb-8">
        {['password', 'qr', 'verify', 'backup'].map((s, index) => (
          <div
            key={s}
            className={`flex-1 h-2 mx-1 rounded-full transition-colors ${
              ['password', 'qr', 'verify', 'backup', 'complete'].indexOf(step) >= index
                ? 'bg-blue-600'
                : 'bg-gray-300'
            }`}
          />
        ))}
      </div>

      {error && (
        <Alert className="mb-4 border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Step 1: Password Verification */}
      {step === 'password' && (
        <div>
          <div className="flex items-center mb-4">
            <Shield className="w-8 h-8 text-blue-600 mr-3" />
            <h2 className="text-2xl font-semibold">Set Up Two-Factor Authentication</h2>
          </div>
          <p className="text-gray-600 mb-6">
            Add an extra layer of security to your account by enabling two-factor authentication.
          </p>
          <form onSubmit={handlePasswordSubmit}>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Verify your password to continue
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="mb-4"
              data-testid="2fa-password-input"
              required
            />
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onComplete?.()}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!password || setupMutation.isPending}
                data-testid="2fa-continue-button"
              >
                {setupMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Continue'
                )}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Step 2: QR Code Display */}
      {step === 'qr' && setupData && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Scan QR Code</h2>
          <p className="text-gray-600 mb-6">
            Scan this QR code with your authenticator app (Google Authenticator, Authy, 1Password, etc.)
          </p>
          
          <div className="flex flex-col items-center mb-6">
            <div className="p-4 bg-white rounded-lg shadow-lg" data-testid="2fa-qr-code">
              <img
                src={setupData.qrCode}
                alt="2FA QR Code"
                className="w-64 h-64"
              />
            </div>
            
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Can't scan? Enter this code manually:</p>
              <div className="flex items-center gap-2">
                <code 
                  className="text-xs font-mono bg-white px-2 py-1 rounded"
                  data-testid="2fa-manual-secret"
                  data-secret={setupData.secret}
                >
                  {setupData.secret}
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(setupData.secret)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setStep('password')}
            >
              Back
            </Button>
            <Button
              onClick={() => setStep('verify')}
              data-testid="2fa-next-button"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Verification */}
      {step === 'verify' && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Verify Setup</h2>
          <p className="text-gray-600 mb-6">
            Enter the 6-digit code from your authenticator app to verify the setup.
          </p>
          
          <form onSubmit={handleVerificationSubmit}>
            <div className="flex justify-center mb-6">
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setVerificationCode(value);
                }}
                placeholder="000000"
                className="text-3xl font-mono text-center w-48 p-3 border-2 rounded-lg"
                maxLength={6}
                pattern="[0-9]{6}"
                data-testid="2fa-code-input"
                required
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('qr')}
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={verificationCode.length !== 6 || verifyMutation.isPending}
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
            </div>
          </form>
        </div>
      )}

      {/* Step 4: Backup Codes */}
      {step === 'backup' && setupData && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Save Your Backup Codes</h2>
          <Alert className="mb-4 border-yellow-200 bg-yellow-50">
            <AlertDescription className="text-yellow-800">
              ⚠️ Save these codes in a secure place. You'll need them if you lose access to your authenticator app.
            </AlertDescription>
          </Alert>
          
          <div className="grid grid-cols-2 gap-2 p-4 bg-gray-50 rounded-lg mb-4" data-testid="2fa-backup-codes">
            {setupData.backupCodes.map((code, index) => (
              <code key={index} className="font-mono text-sm">
                {code}
              </code>
            ))}
          </div>
          
          <div className="flex gap-3 mb-4">
            <Button
              variant="outline"
              onClick={() => copyToClipboard(setupData.backupCodes.join('\n'))}
              className="flex-1"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy All
            </Button>
            <Button
              variant="outline"
              onClick={downloadBackupCodes}
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
          
          <label className="flex items-center mb-4">
            <input
              type="checkbox"
              checked={backupCodesSaved}
              onChange={(e) => setBackupCodesSaved(e.target.checked)}
              className="mr-2"
              data-testid="2fa-backup-codes-saved"
            />
            <span className="text-sm">I have saved my backup codes in a secure place</span>
          </label>
          
          <div className="flex justify-end">
            <Button
              onClick={handleComplete}
              disabled={!backupCodesSaved}
              data-testid="2fa-complete-button"
            >
              Complete Setup
            </Button>
          </div>
        </div>
      )}

      {/* Step 5: Complete */}
      {step === 'complete' && (
        <div className="text-center py-8">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">2FA Enabled Successfully!</h2>
          <p className="text-gray-600">
            Your account is now protected with two-factor authentication.
          </p>
        </div>
      )}
    </div>
  );
}