/**
 * Contract interaction hooks and utilities
 * Uses the web3 package utilities with frontend configuration
 */

import { useMemo } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { MedicalRecordsContract } from '@repo/web3';
import { CONTRACT_ADDRESSES, NETWORK_CONFIG } from '@/lib/config';

/**
 * Hook to get an initialized MedicalRecords contract instance
 */
export function useMedicalRecordsContract() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  return useMemo(() => {
    if (!NETWORK_CONFIG.RPC_URL || !CONTRACT_ADDRESSES.MEDICAL_RECORDS) {
      return null;
    }

    return new MedicalRecordsContract(
      NETWORK_CONFIG.RPC_URL,
      CONTRACT_ADDRESSES.MEDICAL_RECORDS,
      CONTRACT_ADDRESSES.MEDICAL_RECORDS // Using same address for both access and storage
    );
  }, [publicClient, walletClient, address]);
}

/**
 * Hook to get contract address for display purposes
 */
export function useContractAddresses() {
  return CONTRACT_ADDRESSES;
}
