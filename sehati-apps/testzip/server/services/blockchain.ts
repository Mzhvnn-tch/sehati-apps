import { ethers, Contract, Wallet, JsonRpcProvider } from 'ethers';

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
  private relayerWallet: Wallet | null = null;
  private contract: Contract | null = null;
  private chainId: number = 4202;
  private explorerBaseUrl: string = 'https://sepolia-blockscout.lisk.com';

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    const rpcUrl = process.env.LISK_SEPOLIA_RPC || 'https://rpc.sepolia-api.lisk.com';
    const deployerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY;
    const contractAddress = process.env.CONTRACT_ADDRESS;

    try {
      this.provider = new JsonRpcProvider(rpcUrl);
      
      if (deployerPrivateKey) {
        this.relayerWallet = new Wallet(deployerPrivateKey, this.provider);
        console.log(`[Blockchain] Relayer wallet initialized: ${this.relayerWallet.address}`);
      } else {
        console.warn('[Blockchain] DEPLOYER_PRIVATE_KEY not set - meta-transactions disabled');
      }

      if (contractAddress && this.relayerWallet) {
        this.contract = new Contract(contractAddress, SEHATI_REGISTRY_ABI, this.relayerWallet);
        console.log(`[Blockchain] Contract initialized at: ${contractAddress}`);
      } else if (contractAddress) {
        this.contract = new Contract(contractAddress, SEHATI_REGISTRY_ABI, this.provider);
        console.log(`[Blockchain] Contract initialized (read-only) at: ${contractAddress}`);
      } else {
        console.warn('[Blockchain] CONTRACT_ADDRESS not set - contract interactions disabled');
      }
    } catch (error) {
      console.error('[Blockchain] Initialization error:', error);
    }
  }

  isConfigured(): boolean {
    return this.provider !== null && this.relayerWallet !== null && this.contract !== null;
  }

  getRelayerAddress(): string | null {
    return this.relayerWallet?.address || null;
  }

  async getRelayerBalance(): Promise<string> {
    if (!this.provider || !this.relayerWallet) {
      return '0';
    }
    try {
      const balance = await this.provider.getBalance(this.relayerWallet.address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('[Blockchain] Failed to get relayer balance:', error);
      return '0';
    }
  }

  async getBlockNumber(): Promise<number> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }
    return this.provider.getBlockNumber();
  }

  getExplorerUrl(txHash: string): string {
    return `${this.explorerBaseUrl}/tx/${txHash}`;
  }

  getAddressExplorerUrl(address: string): string {
    return `${this.explorerBaseUrl}/address/${address}`;
  }

  private async waitForTransaction(txHash: string): Promise<BlockchainTransaction> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    const receipt = await this.provider.waitForTransaction(txHash, 1, 120000);
    if (!receipt) {
      throw new Error('Transaction receipt not found');
    }

    const block = await this.provider.getBlock(receipt.blockNumber);
    
    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      blockHash: receipt.blockHash,
      timestamp: block?.timestamp || Math.floor(Date.now() / 1000),
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status === 1 ? 'success' : 'failed',
      explorerUrl: this.getExplorerUrl(receipt.hash)
    };
  }

  async registerPatient(patientAddress: string): Promise<BlockchainTransaction> {
    if (!this.contract || !this.relayerWallet) {
      throw new Error('Contract or relayer not configured');
    }

    console.log(`[Blockchain] Registering patient: ${patientAddress}`);
    
    const tx = await this.contract.registerAsPatient();
    return this.waitForTransaction(tx.hash);
  }

  async registerDoctor(doctorAddress: string): Promise<BlockchainTransaction> {
    if (!this.contract || !this.relayerWallet) {
      throw new Error('Contract or relayer not configured');
    }

    console.log(`[Blockchain] Registering doctor: ${doctorAddress}`);
    
    const tx = await this.contract.registerAsDoctor();
    return this.waitForTransaction(tx.hash);
  }

  async createAccessGrant(
    patientAddress: string,
    accessToken: string,
    durationMinutes: number
  ): Promise<{ grantId: string; transaction: BlockchainTransaction }> {
    if (!this.contract || !this.relayerWallet) {
      throw new Error('Contract or relayer not configured');
    }

    console.log(`[Blockchain] Creating access grant for patient: ${patientAddress}`);
    
    const accessTokenBytes = ethers.keccak256(ethers.toUtf8Bytes(accessToken));
    
    const tx = await this.contract.createAccessGrant(accessTokenBytes, durationMinutes);
    const transaction = await this.waitForTransaction(tx.hash);
    
    const receipt = await this.provider!.getTransactionReceipt(tx.hash);
    let grantId = '';
    
    if (receipt && receipt.logs.length > 0) {
      const iface = new ethers.Interface(SEHATI_REGISTRY_ABI);
      for (const log of receipt.logs) {
        try {
          const parsed = iface.parseLog({ topics: log.topics as string[], data: log.data });
          if (parsed && parsed.name === 'AccessGrantCreated') {
            grantId = parsed.args[0];
            break;
          }
        } catch {
          continue;
        }
      }
    }

    return { grantId, transaction };
  }

  async createRecord(
    doctorAddress: string,
    patientAddress: string,
    ipfsCID: string,
    contentHash: string,
    recordType: string,
    accessToken: string
  ): Promise<{ recordId: string; transaction: BlockchainTransaction }> {
    if (!this.contract || !this.relayerWallet) {
      throw new Error('Contract or relayer not configured');
    }

    console.log(`[Blockchain] Creating record for patient: ${patientAddress} by doctor: ${doctorAddress}`);
    
    const contentHashBytes = ethers.keccak256(ethers.toUtf8Bytes(contentHash));
    const accessTokenBytes = ethers.keccak256(ethers.toUtf8Bytes(accessToken));
    
    const tx = await this.contract.createRecord(
      patientAddress,
      ipfsCID,
      contentHashBytes,
      recordType,
      accessTokenBytes
    );
    const transaction = await this.waitForTransaction(tx.hash);
    
    const receipt = await this.provider!.getTransactionReceipt(tx.hash);
    let recordId = '';
    
    if (receipt && receipt.logs.length > 0) {
      const iface = new ethers.Interface(SEHATI_REGISTRY_ABI);
      for (const log of receipt.logs) {
        try {
          const parsed = iface.parseLog({ topics: log.topics as string[], data: log.data });
          if (parsed && parsed.name === 'RecordCreated') {
            recordId = parsed.args[0];
            break;
          }
        } catch {
          continue;
        }
      }
    }

    return { recordId, transaction };
  }

  async revokeAccessGrant(grantId: string): Promise<BlockchainTransaction> {
    if (!this.contract || !this.relayerWallet) {
      throw new Error('Contract or relayer not configured');
    }

    console.log(`[Blockchain] Revoking access grant: ${grantId}`);
    
    const tx = await this.contract.revokeAccessGrant(grantId);
    return this.waitForTransaction(tx.hash);
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

  async submitDataHash(dataHash: string, metadata?: string): Promise<BlockchainTransaction | null> {
    if (!this.provider || !this.relayerWallet) {
      console.warn('[Blockchain] Not configured - skipping on-chain submission');
      return null;
    }

    try {
      console.log(`[Blockchain] Submitting data hash to chain: ${dataHash.substring(0, 20)}...`);
      
      const tx = await this.relayerWallet.sendTransaction({
        to: this.relayerWallet.address,
        value: BigInt(0),
        data: ethers.hexlify(ethers.toUtf8Bytes(JSON.stringify({
          type: 'SEHATI_RECORD',
          hash: dataHash,
          metadata: metadata || '',
          timestamp: new Date().toISOString()
        })))
      });

      console.log(`[Blockchain] Transaction submitted: ${tx.hash}`);
      
      const receipt = await tx.wait(1);
      if (!receipt) {
        throw new Error('Transaction receipt not found');
      }

      const block = await this.provider.getBlock(receipt.blockNumber);
      
      return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        blockHash: receipt.blockHash,
        timestamp: block?.timestamp || Math.floor(Date.now() / 1000),
        gasUsed: receipt.gasUsed.toString(),
        status: receipt.status === 1 ? 'success' : 'failed',
        explorerUrl: this.getExplorerUrl(receipt.hash)
      };
    } catch (error) {
      console.error('[Blockchain] Failed to submit data hash:', error);
      return null;
    }
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
