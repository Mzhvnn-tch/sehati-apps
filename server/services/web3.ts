import { isAddress, formatEther, keccak256, toHex, verifyMessage, createPublicClient, http } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import crypto from 'crypto';

interface Web3Config {
  supportedChains: {
    id: number;
    name: string;
    rpcUrl: string;
  }[];
  walletConnectProjectId: string | null;
}

class Web3Service {
  private config: Web3Config;

  constructor() {
    this.config = {
      supportedChains: [
        {
          id: 1,
          name: 'Ethereum Mainnet',
          rpcUrl: 'https://eth.llamarpc.com',
        },
        {
          id: 11155111,
          name: 'Sepolia Testnet',
          rpcUrl: 'https://sepolia.drpc.org',
        },
        {
          id: 137,
          name: 'Polygon Mainnet',
          rpcUrl: 'https://polygon-rpc.com',
        },
      ],
      walletConnectProjectId: process.env.WALLETCONNECT_PROJECT_ID || null,
    };
  }

  getConfig(): Web3Config {
    return this.config;
  }

  async verifySignature(
    walletAddress: string,
    message: string,
    signature: string
  ): Promise<boolean> {
    try {
      const valid = await verifyMessage({ address: walletAddress as `0x${string}`, message, signature: signature as `0x${string}` });
      return valid;
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }

  generateWallet(): { address: string; privateKey: string; mnemonic: string } {
    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);
    return {
      address: account.address,
      privateKey,
      mnemonic: 'test test test test test test test test test test test junk'
    };
  }

  generateNonce(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  generateSignMessage(nonce: string, address: string): string {
    const timestamp = new Date().toISOString();
    return `Welcome to SEHATI Health Identity System!\n\nThis request will not trigger a blockchain transaction or cost any gas fees.\n\nWallet address: ${address}\nNonce: ${nonce}\nTimestamp: ${timestamp}`;
  }

  isValidAddress(address: string): boolean {
    return isAddress(address);
  }

  async getBalance(address: string, chainId: number = 1): Promise<string> {
    try {
      const chain = this.config.supportedChains.find((c) => c.id === chainId);
      if (!chain) {
        throw new Error('Unsupported chain');
      }

      const client = createPublicClient({ transport: http(chain.rpcUrl) });
      const balance = await client.getBalance({ address: address as `0x${string}` });
      return formatEther(balance);
    } catch (error) {
      console.error('Failed to get balance:', error);
      return '0';
    }
  }

  hashData(data: string): string {
    return keccak256(toHex(data));
  }

  generateBlockchainProof(data: {
    patientId: string;
    recordId: string;
    timestamp: string;
    contentHash: string;
  }): {
    proof: string;
    proofHash: string;
    timestamp: string;
  } {
    const proofData = JSON.stringify(data);
    const proofHash = this.hashData(proofData);

    return {
      proof: proofData,
      proofHash,
      timestamp: new Date().toISOString(),
    };
  }
}

export const web3Service = new Web3Service();
