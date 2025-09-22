/**
 * Web3 providers configuration with RainbowKit and Wagmi
 */

'use client';

import { ReactNode } from 'react';
import { WagmiConfig, createConfig, configureChains } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { RainbowKitProvider, getDefaultWallets } from '@rainbow-me/rainbowkit';
import { WALLETCONNECT_PROJECT_ID, validateConfig } from '@/lib/config';

import '@rainbow-me/rainbowkit/styles.css';

// Validate configuration on startup
if (typeof window !== 'undefined') {
  try {
    validateConfig();
  } catch (error) {
    console.warn('Configuration validation failed:', error);
  }
}

// Configure chains and providers
const { chains, publicClient } = configureChains(
  [sepolia],
  [publicProvider()]
);

// Configure wallets
const { connectors } = getDefaultWallets({
  appName: 'Aarovia',
  projectId: WALLETCONNECT_PROJECT_ID,
  chains,
});

// Create wagmi config
const config = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
});

interface Web3ProvidersProps {
  children: ReactNode;
}

export function Web3Providers({ children }: Web3ProvidersProps) {
  return (
    <WagmiConfig config={config}>
      <RainbowKitProvider chains={chains}>
        {children}
      </RainbowKitProvider>
    </WagmiConfig>
  );
}
