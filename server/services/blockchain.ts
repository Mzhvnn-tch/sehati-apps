import { ethers, Contract, JsonRpcProvider } from 'ethers';

const SEHATI_REGISTRY_ABI = [
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
];

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
  private provider: JsonRpcProvider | null = null;
  private contract: Contract | null = null;
  private chainId: number = 4202;
  private explorerBaseUrl: string = 'https://sepolia-blockscout.lisk.com';

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    const rpcUrl = process.env.LISK_SEPOLIA_RPC || 'https://rpc.sepolia-api.lisk.com';
    const contractAddress = process.env.CONTRACT_ADDRESS;

    try {
      this.provider = new JsonRpcProvider(rpcUrl);

      if (contractAddress) {
        this.contract = new Contract(contractAddress, SEHATI_REGISTRY_ABI, this.provider);
        console.log(`[Blockchain] Contract initialized (READ-ONLY) at: ${contractAddress}`);
      } else {
        console.warn('[Blockchain] CONTRACT_ADDRESS not set - contract interactions disabled');
      }
    } catch (error) {
      console.error('[Blockchain] Initialization error:', error);
    }
  }

  isConfigured(): boolean {
    return this.provider !== null && this.contract !== null;
  }

  // Write methods REMOVED - The frontend now handles transactions directly via user wallet.
  // This service is now strictly for verification and reading state.

  getBlockNumber(): Promise<number> {
    if (!this.provider) throw new Error('Provider not initialized');
    return this.provider.getBlockNumber();
  }

  getExplorerUrl(txHash: string): string {
    return `${this.explorerBaseUrl}/tx/${txHash}`;
  }

  async getPatientRecords(patientAddress: string): Promise<string[]> {
    if (!this.contract) {
      throw new Error('Contract not configured');
    }

    const recordIds = await this.contract.getPatientRecords(patientAddress);
    return recordIds.map((id: unknown) => String(id));
  }

  async getRecord(recordId: string): Promise<{
    ipfsCID: string;
    contentHash: string;
    patient: string;
    doctor: string;
    recordType: string;
    timestamp: number;
  }> {
    if (!this.contract) {
      throw new Error('Contract not configured');
    }

    const record = await this.contract.getRecord(recordId);
    return {
      ipfsCID: record.ipfsCID,
      contentHash: record.contentHash,
      patient: record.patient,
      doctor: record.doctor,
      recordType: record.recordType,
      timestamp: Number(record.timestamp)
    };
  }

  async getAccessGrant(grantId: string): Promise<{
    patient: string;
    doctor: string;
    expiresAt: number;
    isActive: boolean;
  }> {
    if (!this.contract) {
      throw new Error('Contract not configured');
    }

    const grant = await this.contract.getAccessGrant(grantId);
    return {
      patient: grant.patient,
      doctor: grant.doctor,
      expiresAt: Number(grant.expiresAt),
      isActive: grant.isActive
    };
  }

  async verifyAccessToken(patientAddress: string, accessToken: string): Promise<boolean> {
    if (!this.contract) {
      throw new Error('Contract not configured');
    }

    const accessTokenBytes = ethers.keccak256(ethers.toUtf8Bytes(accessToken));
    return this.contract.verifyAccessToken(patientAddress, accessTokenBytes);
  }

  async isPatient(address: string): Promise<boolean> {
    if (!this.contract) {
      return false;
    }

    try {
      return await this.contract.isPatient(address);
    } catch {
      return false;
    }
  }

  async isDoctor(address: string): Promise<boolean> {
    if (!this.contract) {
      return false;
    }

    try {
      return await this.contract.isDoctor(address);
    } catch {
      return false;
    }
  }

  async getRecordCount(): Promise<number> {
    if (!this.contract) {
      return 0;
    }

    try {
      const count = await this.contract.recordCount();
      return Number(count);
    } catch {
      return 0;
    }
  }

  async getGrantCount(): Promise<number> {
    if (!this.contract) {
      return 0;
    }

    try {
      const count = await this.contract.grantCount();
      return Number(count);
    } catch {
      return 0;
    }
  }

  hashData(data: string): string {
    return ethers.keccak256(ethers.toUtf8Bytes(data));
  }

  generateAccessToken(): string {
    return ethers.hexlify(ethers.randomBytes(32));
  }

  getChainInfo(): { chainId: number; name: string; explorerUrl: string } {
    return {
      chainId: this.chainId,
      name: 'Polygon Amoy Testnet',
      explorerUrl: this.explorerBaseUrl
    };
  }



  async getTransactionByHash(txHash: string): Promise<{
    blockNumber: number;
    timestamp: number;
    data: string;
    explorerUrl: string;
  } | null> {
    if (!this.provider) {
      return null;
    }

    try {
      const tx = await this.provider.getTransaction(txHash);
      if (!tx || !tx.blockNumber) {
        return null;
      }

      const block = await this.provider.getBlock(tx.blockNumber);

      let decodedData = '';
      if (tx.data && tx.data !== '0x') {
        try {
          decodedData = ethers.toUtf8String(tx.data);
        } catch {
          decodedData = tx.data;
        }
      }

      return {
        blockNumber: tx.blockNumber,
        timestamp: block?.timestamp || 0,
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
