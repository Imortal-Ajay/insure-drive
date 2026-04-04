'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';
import { WalletConnect } from '@/components/WalletConnect';

export default function HomePage() {
  const router = useRouter();
  const { isConnected, isInitialized, isConnecting, connect, error } = useWallet();

  // Redirect to dashboard once wallet is confirmed connected
  useEffect(() => {
    if (isConnected) {
      router.replace('/dashboard');
    }
  }, [isConnected, router]);

  // Show nothing while we're silently checking for an existing session
  if (!isInitialized && !isConnecting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <WalletConnect
      onConnect={connect}
      isConnecting={isConnecting}
      error={error}
    />
  );
}
