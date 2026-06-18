import { createPublicClient, createWalletClient, getContract, http, keccak256, toHex, parseAbi, parseEther, formatEther, getAddress } from 'viem';
import { sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import crypto from 'crypto';

const SEHATI_REGISTRY_ABI = parseAbi([
  "function registerAsPatient() external",
  "function registerAsDoctor() external",
  "function createAccessGrant(bytes32 _accessToken, uint256 _durationMinutes) external returns (bytes32)",
  "function createRecord(address _patient, string calldata _ipfsCID, bytes32 _contentHash, string calldata _recordType, bytes32 _accessToken) external returns (bytes32)",
  "function useAccessGrant(bytes32 _grantId) external",
  "function revokeAccessGrant(bytes32 _grantId) external",
  "function getPatientRecords(address _patient) external view returns (bytes32[] memory)",
  "function getRecord(bytes32 _recordId) external view returns (string memory ipfsCID, bytes32 contentHash, address patient, address doctor, string memory recordType, uint256 timestamp)",
  "function getPatientAccessGrants(address _patient) external view returns (bytes32[] memory)",
  "function getAccessGrant(bytes32 _grantId) external view returns (address patient, address doctor, uint256 expiresAt, bool isActive)",
  "function verifyAccessToken(address _patient, bytes32 _accessToken) external view returns (bool)",
  "function isPatient(address _user) external view returns (bool)",
  "function isDoctor(address _user) external view returns (bool)",
  "function recordCount() external view returns (uint256)",
  "function grantCount() external view returns (uint256)",
  "event UserRegistered(address indexed user, string role, uint256 timestamp)",
  "event RecordCreated(bytes32 indexed recordId, address indexed patient, address indexed doctor, string ipfsCID, bytes32 contentHash, string recordType, uint256 timestamp)",
  "event AccessGrantCreated(bytes32 indexed grantId, address indexed patient, bytes32 accessToken, uint256 expiresAt, uint256 timestamp)",
  "event AccessGrantUsed(bytes32 indexed grantId, address indexed doctor, uint256 timestamp)",
  "event AccessGrantRevoked(bytes32 indexed grantId, address indexed patient, uint256 timestamp)"
]);

export interface BlockchainTransaction {
  txHash: string;
  blockNumber: number;
  blockHash: string;
  timestamp: number;
  gasUsed: string;
  status: 'success' | 'failed';
  explorerUrl: string;
}

export interface MetaTransactionRequest {
  userAddress: string;
  functionName: string;
  functionParams: unknown[];
  userSignature?: string;
}

class BlockchainService {
  private publicClient: any = null;
  private contract: any = null;
  private chainId: number = 11155111;
  private explorerBaseUrl: string = 'https://sepolia.etherscan.io';

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    const rpcUrl = process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
    const contractAddress = process.env.CONTRACT_ADDRESS;

    try {
      this.publicClient = createPublicClient({
        chain: sepolia,
        transport: http(rpcUrl)
      });

      if (contractAddress) {
        this.contract = getContract({
          address: contractAddress as `0x${string}`,
          abi: SEHATI_REGISTRY_ABI,
          client: this.publicClient
        });
        console.log(`[Blockchain] Contract initialized (READ-ONLY) at: ${contractAddress}`);
      } else {
        console.warn('[Blockchain] CONTRACT_ADDRESS not set - contract interactions disabled');
      }
    } catch (error) {
      console.error('[Blockchain] Initialization error:', error);
    }
  }

  isConfigured(): boolean {
    return this.publicClient !== null && this.contract !== null;
  }

  async getBlockNumber(): Promise<number> {
    if (!this.publicClient) throw new Error('Provider not initialized');
    return Number(await this.publicClient.getBlockNumber());
  }

  getExplorerUrl(txHash: string): string {
    return `${this.explorerBaseUrl}/tx/${txHash}`;
  }

  async getPatientRecords(patientAddress: string): Promise<string[]> {
    if (!this.contract) throw new Error('Contract not configured');
    const recordIds = await this.contract.read.getPatientRecords([patientAddress as `0x${string}`]);
    return (recordIds as string[]).map(id => String(id));
  }

  async getRecord(recordId: string): Promise<{
    ipfsCID: string;
    contentHash: string;
    patient: string;
    doctor: string;
    recordType: string;
    timestamp: number;
  }> {
    if (!this.contract) throw new Error('Contract not configured');
    const record: any = await this.contract.read.getRecord([recordId as `0x${string}`]);
    return {
      ipfsCID: record[0],
      contentHash: record[1],
      patient: record[2],
      doctor: record[3],
      recordType: record[4],
      timestamp: Number(record[5])
    };
  }

  async getAccessGrant(grantId: string): Promise<{
    patient: string;
    doctor: string;
    expiresAt: number;
    isActive: boolean;
  }> {
    if (!this.contract) throw new Error('Contract not configured');
    const grant: any = await this.contract.read.getAccessGrant([grantId as `0x${string}`]);
    return {
      patient: grant[0],
      doctor: grant[1],
      expiresAt: Number(grant[2]),
      isActive: grant[3]
    };
  }

  async verifyAccessToken(patientAddress: string, accessToken: string): Promise<boolean> {
    if (!this.contract) throw new Error('Contract not configured');
    const accessTokenBytes = keccak256(toHex(accessToken));
    return await this.contract.read.verifyAccessToken([patientAddress as `0x${string}`, accessTokenBytes]);
  }

  async isPatient(address: string): Promise<boolean> {
    if (!this.contract) return false;
    try { return await this.contract.read.isPatient([address as `0x${string}`]); } catch { return false; }
  }

  async isDoctor(address: string): Promise<boolean> {
    if (!this.contract) return false;
    try { return await this.contract.read.isDoctor([address as `0x${string}`]); } catch { return false; }
  }

  async getRecordCount(): Promise<number> {
    if (!this.contract) return 0;
    try { return Number(await this.contract.read.recordCount()); } catch { return 0; }
  }

  async getGrantCount(): Promise<number> {
    if (!this.contract) return 0;
    try { return Number(await this.contract.read.grantCount()); } catch { return 0; }
  }

  hashData(data: string): string {
    return keccak256(toHex(data));
  }

  generateAccessToken(): string {
    return toHex(crypto.randomBytes(32));
  }

  getChainInfo(): { chainId: number; name: string; explorerUrl: string } {
    return {
      chainId: this.chainId,
      name: 'Ethereum Sepolia Testnet',
      explorerUrl: this.explorerBaseUrl
    };
  }

  async fundWallet(targetAddress: string, amountEth: string = "0.005"): Promise<boolean> {
    const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY;
    if (!adminPrivateKey || !this.publicClient) {
      console.warn('[Blockchain] Faucet disabled: No ADMIN_PRIVATE_KEY or provider');
      return false;
    }

    try {
      const checksumAddress = getAddress(targetAddress.toLowerCase());
      const account = privateKeyToAccount((adminPrivateKey.startsWith('0x') ? adminPrivateKey : `0x${adminPrivateKey}`) as `0x${string}`);
      const walletClient = createWalletClient({ account, chain: sepolia, transport: http(process.env.SEPOLIA_RPC_URL) });
      
      const balance = await this.publicClient.getBalance({ address: checksumAddress as `0x${string}` });
      const minBalance = parseEther("0.001");
      
      if (balance > minBalance) {
        console.log(`[Blockchain] Wallet ${checksumAddress} already has sufficient funds (${formatEther(balance)} ETH). Skipping faucet.`);
        return true;
      }

      console.log(`[Blockchain] Funding wallet ${checksumAddress} with ${amountEth} ETH...`);
      const hash = await walletClient.sendTransaction({
        to: checksumAddress as `0x${string}`,
        value: parseEther(amountEth)
      });
      
      await this.publicClient.waitForTransactionReceipt({ hash });
      console.log(`[Blockchain] Successfully funded wallet ${checksumAddress}. TX: ${hash}`);
      return true;
    } catch (error) {
      console.error(`[Blockchain] Failed to fund wallet ${targetAddress}:`, error);
      return false;
    }
  }

  async getTransactionByHash(txHash: string): Promise<{
    blockNumber: number;
    timestamp: number;
    data: string;
    explorerUrl: string;
  } | null> {
    if (!this.publicClient) return null;

    try {
      const tx = await this.publicClient.getTransaction({ hash: txHash as `0x${string}` });
      if (!tx || !tx.blockNumber) return null;

      const block = await this.publicClient.getBlock({ blockNumber: tx.blockNumber });

      let decodedData = '';
      if (tx.input && tx.input !== '0x') {
        decodedData = tx.input;
      }

      return {
        blockNumber: Number(tx.blockNumber),
        timestamp: Number(block?.timestamp || 0),
        data: decodedData,
        explorerUrl: this.getExplorerUrl(txHash)
      };
    } catch (error) {
      console.error('[Blockchain] Failed to get transaction:', error);
      return null;
    }
  }
}

export const blockchainService = new BlockchainService();
