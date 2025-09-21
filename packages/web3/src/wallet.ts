import { ethers } from 'ethers';

/**
 * Verify that a message was signed by the given address
 */
export async function verifySignature(
  address: string,
  message: string,
  signature: string
): Promise<boolean> {
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === address.toLowerCase();
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}

/**
 * Get wallet balance for an address
 */
export async function getWalletBalance(
  address: string,
  rpcUrl?: string
): Promise<string> {
  try {
    const provider = rpcUrl 
      ? new ethers.JsonRpcProvider(rpcUrl)
      : ethers.getDefaultProvider();
    
    const balance = await provider.getBalance(address);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error('Failed to get wallet balance:', error);
    return '0';
  }
}

/**
 * Estimate gas for a transaction
 */
export async function estimateGas(
  to: string,
  data: string,
  value: string = '0',
  rpcUrl?: string
): Promise<{ gasLimit: string; gasPrice: string; estimatedCost: string }> {
  try {
    const provider = rpcUrl 
      ? new ethers.JsonRpcProvider(rpcUrl)
      : ethers.getDefaultProvider();

    const gasPrice = await provider.getFeeData();
    const gasLimit = await provider.estimateGas({
      to,
      data,
      value: ethers.parseEther(value),
    });

    const estimatedCost = ethers.formatEther(
      gasLimit * (gasPrice.gasPrice || 0n)
    );

    return {
      gasLimit: gasLimit.toString(),
      gasPrice: ethers.formatUnits(gasPrice.gasPrice || 0n, 'gwei') + ' gwei',
      estimatedCost: estimatedCost + ' ETH'
    };
  } catch (error) {
    console.error('Gas estimation failed:', error);
    return {
      gasLimit: '21000',
      gasPrice: '20 gwei',
      estimatedCost: '0.00042 ETH'
    };
  }
}

/**
 * Generate a random private key and address
 */
export function generateWallet(): { address: string; privateKey: string } {
  const wallet = ethers.Wallet.createRandom();
  return {
    address: wallet.address,
    privateKey: wallet.privateKey
  };
}

/**
 * Create a wallet from private key
 */
export function createWalletFromPrivateKey(privateKey: string): ethers.Wallet {
  return new ethers.Wallet(privateKey);
}

/**
 * Get transaction receipt
 */
export async function getTransactionReceipt(
  txHash: string,
  rpcUrl?: string
): Promise<ethers.TransactionReceipt | null> {
  try {
    const provider = rpcUrl 
      ? new ethers.JsonRpcProvider(rpcUrl)
      : ethers.getDefaultProvider();
    
    return await provider.getTransactionReceipt(txHash);
  } catch (error) {
    console.error('Failed to get transaction receipt:', error);
    return null;
  }
}

/**
 * Format address for display (truncate middle)
 */
export function formatAddress(address: string, chars: number = 4): string {
  if (address.length < chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Validate Ethereum address
 */
export function isValidAddress(address: string): boolean {
  return ethers.isAddress(address);
}
