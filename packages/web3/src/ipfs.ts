/**
 * IPFS utilities for medical records
 * This will be implemented when client-side encryption is added
 */

export interface IPFSUploadResult {
  cid: string;
  url: string;
}

// Placeholder functions - to be implemented with Web3.Storage or similar
export async function uploadToIPFS(data: Uint8Array): Promise<IPFSUploadResult> {
  throw new Error('IPFS upload not yet implemented');
}

export async function retrieveFromIPFS(cid: string): Promise<Uint8Array> {
  throw new Error('IPFS retrieval not yet implemented');
}
