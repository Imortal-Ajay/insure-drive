import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/ToastProvider';
import { WalletProvider } from '@/contexts/WalletContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Insure Drive — AI-Powered Income Protection for Riders',
  description: 'Parametric insurance for delivery riders in Chennai. Real-time weather triggers automatic ETH payouts via smart contract on Sepolia.',
  keywords: ['parametric insurance', 'web3', 'delivery riders', 'blockchain', 'defi'],
  openGraph: {
    title: 'Insure Drive',
    description: 'Income protection for gig economy riders powered by AI and smart contracts.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen text-slate-100 selection:bg-indigo-500/30`}>
        <WalletProvider>
          <ToastProvider />
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}
