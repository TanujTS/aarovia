'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function LoginPage() {
  const [address, setAddress] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAddress(accounts[0]);
        }
      } catch (error) {
        console.error('Error checking connection:', error);
      }
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      setError('MetaMask is not installed. Please install MetaMask to continue.');
      return;
    }

    setIsConnecting(true);
    setError('');

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const userAddress = accounts[0];
      setAddress(userAddress);

      // Check and switch to Polygon Mumbai testnet
      const polygonMumbaiChainId = '0x13881'; // 80001 in hex
      
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: polygonMumbaiChainId }],
        });
      } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: polygonMumbaiChainId,
                  chainName: 'Polygon Mumbai Testnet',
                  nativeCurrency: {
                    name: 'MATIC',
                    symbol: 'MATIC',
                    decimals: 18,
                  },
                  rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
                  blockExplorerUrls: ['https://mumbai.polygonscan.com/'],
                },
              ],
            });
          } catch (addError) {
            console.error('Error adding chain:', addError);
            setError('Failed to add Polygon Mumbai network to MetaMask');
            return;
          }
        } else {
          console.error('Error switching chain:', switchError);
          setError('Failed to switch to Polygon Mumbai network');
          return;
        }
      }

      // Get authentication challenge
      const challengeResponse = await fetch('/api/auth/challenge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address: userAddress }),
      });

      if (!challengeResponse.ok) {
        throw new Error('Failed to get authentication challenge');
      }

      const { message } = await challengeResponse.json();

      // Sign the challenge message
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, userAddress],
      });

      // Verify signature with backend
      const verifyResponse = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: userAddress,
          signature,
          message,
        }),
      });

      if (!verifyResponse.ok) {
        throw new Error('Authentication failed');
      }

      const { token } = await verifyResponse.json();

      // Store the JWT token
      localStorage.setItem('authToken', token);
      localStorage.setItem('walletAddress', userAddress);

      // Redirect to dashboard
      router.push('/dashboard');
      
    } catch (error: any) {
      console.error('Connection error:', error);
      setError(error.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAddress('');
    localStorage.removeItem('authToken');
    localStorage.removeItem('walletAddress');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Access Medical Records DApp
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Connect your wallet to access your decentralized medical records
          </p>
        </div>
        
        <div className="mt-8 space-y-6">
          {!address ? (
            <div>
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConnecting ? 'Connecting...' : 'Connect MetaMask Wallet'}
              </button>
              
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  Don't have MetaMask?{' '}
                  <a
                    href="https://metamask.io/download/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    Download here
                  </a>
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Connected wallet:
              </p>
              <p className="text-sm font-mono bg-gray-100 p-2 rounded">
                {address}
              </p>
              <button
                onClick={disconnectWallet}
                className="mt-4 text-sm text-red-600 hover:text-red-500"
              >
                Disconnect
              </button>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
