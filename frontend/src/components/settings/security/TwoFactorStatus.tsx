'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import GlassCard from '@/components/cards/GlassCard';
// Using inline alert styling instead of missing UI component
import { Shield, ShieldCheck, ShieldOff, RefreshCw, Key } from 'lucide-react';
import { TwoFactorSetup } from './TwoFactorSetup';
// Date formatting - will install date-fns
// import { format } from 'date-fns';

interface TwoFactorStatusData {
  enabled: boolean;
  verifiedAt: string | null;
  backupCodesRemaining: number;
}

export function TwoFactorStatus() {
  const [showSetup, setShowSetup] = useState(false);
  const [showDisable, setShowDisable] = useState(false);
  const queryClient = useQueryClient();

  // Fetch 2FA status
  const { data: status, isLoading } = useQuery<TwoFactorStatusData>({
    queryKey: ['2fa-status'],
    queryFn: async () => {
      const response = await apiClient.get('/api/auth/2fa/status');
      return response.data;
    },
  });

  // Disable 2FA mutation
  const disableMutation = useMutation({
    mutationFn: async ({ password, code }: { password: string; code: string }) => {
      const response = await apiClient.post('/api/auth/2fa/disable', {
        password,
        code,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['2fa-status'] });
      setShowDisable(false);
    },
  });

  // Regenerate backup codes mutation
  const regenerateMutation = useMutation({
    mutationFn: async ({ password, code }: { password: string; code: string }) => {
      const response = await apiClient.post('/api/auth/2fa/regenerate-backup', {
        password,
        code,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['2fa-status'] });
    },
  });

  if (isLoading) {
    return (
      <Card className="liquid-glass-card">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (showSetup && !status?.enabled) {
    return (
      <TwoFactorSetup
        onComplete={() => {
          setShowSetup(false);
          queryClient.invalidateQueries({ queryKey: ['2fa-status'] });
        }}
      />
    );
  }

  return (
    <Card className="liquid-glass-card" data-testid="2fa-status-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {status?.enabled ? (
            <ShieldCheck className="w-6 h-6 text-green-600" />
          ) : (
            <ShieldOff className="w-6 h-6 text-gray-400" />
          )}
          Two-Factor Authentication
        </CardTitle>
        <CardDescription>
          {status?.enabled
            ? 'Your account is protected with 2FA'
            : 'Add an extra layer of security to your account'}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {status?.enabled ? (
          <>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-green-900">Status</span>
                <span className="text-green-700" data-testid="2fa-status">Enabled</span>
              </div>
              
              {status.verifiedAt && (
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-green-800">Enabled since</span>
                  <span className="text-sm text-green-700">
                    {new Date(status.verifiedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-800">Backup codes remaining</span>
                <span className="text-sm text-green-700">
                  {status.backupCodesRemaining}
                </span>
              </div>
            </div>

            {status.backupCodesRemaining < 3 && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertDescription className="text-yellow-800">
                  You have only {status.backupCodesRemaining} backup codes remaining.
                  Consider regenerating your backup codes.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  // TODO: Implement regenerate backup codes modal
                  console.log('Regenerate backup codes');
                }}
                className="flex-1"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate Backup Codes
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setShowDisable(true)}
                className="flex-1 text-red-600 hover:text-red-700"
              >
                <ShieldOff className="w-4 h-4 mr-2" />
                Disable 2FA
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-2">Benefits of 2FA:</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Protects against password theft</li>
                <li>• Prevents unauthorized access</li>
                <li>• Secures your financial data</li>
                <li>• Industry-standard security</li>
              </ul>
            </div>

            <Button
              onClick={() => setShowSetup(true)}
              className="w-full"
              data-testid="enable-2fa-button"
            >
              <Shield className="w-4 h-4 mr-2" />
              Enable Two-Factor Authentication
            </Button>
          </>
        )}

        {/* Disable 2FA Modal */}
        {showDisable && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="liquid-glass-card p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-semibold mb-4">Disable 2FA</h3>
              <Alert className="mb-4 border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">
                  Warning: Disabling 2FA will make your account less secure.
                </AlertDescription>
              </Alert>
              
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  disableMutation.mutate({
                    password: formData.get('password') as string,
                    code: formData.get('code') as string,
                  });
                }}
              >
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    2FA Code
                  </label>
                  <input
                    type="text"
                    name="code"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    required
                    className="w-full p-2 border rounded-lg font-mono"
                    placeholder="000000"
                  />
                </div>
                
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowDisable(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="danger"
                    className="flex-1"
                    disabled={disableMutation.isPending}
                  >
                    Disable 2FA
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}