/**
 * Example component showing how to interact with the MedicalRecords contract
 */

'use client';

import { useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useMedicalRecordsContract, useContractAddresses } from '@/hooks/useContracts';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function ContractInteraction() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const contract = useMedicalRecordsContract();
  const contractAddresses = useContractAddresses();
  
  const [recordHash, setRecordHash] = useState('');
  const [ipfsHash, setIpfsHash] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStoreRecord = async () => {
    if (!contract || !recordHash || !ipfsHash) {
      alert('Please fill in all fields and connect wallet');
      return;
    }

    try {
      setLoading(true);
      // This would require a signer - you'd need to implement the signer logic
      console.log('Would store record:', { recordHash, ipfsHash });
      alert('Check console for contract interaction details');
    } catch (error) {
      console.error('Error storing record:', error);
      alert('Error storing record. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-4">Aarovia Smart Contract</h1>
        
        {/* Wallet Connection */}
        <div className="mb-6">
          {isConnected ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Connected: {address}
              </p>
              <Button onClick={() => disconnect()}>
                Disconnect Wallet
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Connect your wallet to interact with the contract</p>
              {connectors.map((connector) => (
                <Button
                  key={connector.id}
                  onClick={() => connect({ connector })}
                  className="mr-2"
                >
                  Connect {connector.name}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Contract Information */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Contract Addresses:</h3>
          <div className="space-y-1 text-sm font-mono">
            <div>Aarovia Contract: {contractAddresses.MEDICAL_RECORDS || 'Not set'}</div>
            <div>Counter: {contractAddresses.COUNTER || 'Not set'}</div>
          </div>
        </div>

        {/* Contract Interaction Form */}
        {isConnected && contract && (
          <div className="space-y-4">
            <h3 className="font-semibold">Store Data Record</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Record Hash (bytes32)
                </label>
                <Input
                  value={recordHash}
                  onChange={(e) => setRecordHash(e.target.value)}
                  placeholder="0x..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  IPFS Hash
                </label>
                <Input
                  value={ipfsHash}
                  onChange={(e) => setIpfsHash(e.target.value)}
                  placeholder="Qm..."
                />
              </div>
              
              <Button 
                onClick={handleStoreRecord}
                disabled={loading || !recordHash || !ipfsHash}
                className="w-full"
              >
                {loading ? 'Storing...' : 'Store Record'}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
