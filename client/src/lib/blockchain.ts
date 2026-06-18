import { type WalletClient, getContract as viemGetContract, keccak256, toHex, zeroHash, formatEther, parseAbi } from "viem";
import { useWalletClient } from "wagmi";
import { waitForTransactionReceipt } from '@wagmi/core';
import { config } from "./wagmi";

export function useEthersSigner({ chainId }: { chainId?: number } = {}) {
    const { data: walletClient } = useWalletClient({ chainId });
    return walletClient;
}

export const SEHATI_REGISTRY_ADDRESS = (import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`) || "0x7d8762646954b45d6fBcA7938435cB8F1B57A3f8";

export const SEHATI_REGISTRY_ABI = parseAbi([
    "function registerAsPatient() external",
    "function registerDoctor(address _doctor) external",
    "function registerPharmacist(address _pharmacist) external",
    "function createAccessGrant(bytes32 _accessToken, uint256 _durationMinutes) external returns (bytes32)",
    "function createRecord(address _patient, string calldata _ipfsCID, bytes32 _contentHash, string calldata _recordType, bytes32 _accessToken) external returns (bytes32)",
    "function useAccessGrant(bytes32 _grantId) external",
    "function revokeAccessGrant(bytes32 _grantId) external",
    "function fulfillPrescription(bytes32 _recordId) external",
    "function getPatientRecords(address _patient) external view returns (bytes32[] memory)",
    "function getRecord(bytes32 _recordId) external view returns (string memory ipfsCID, bytes32 contentHash, address patient, address doctor, string memory recordType, uint256 timestamp)",
    "function isPatient(address _user) external view returns (bool)",
    "function isDoctor(address _user) external view returns (bool)",
    "function isPharmacist(address _user) external view returns (bool)",
    "function prescriptionFulfilled(bytes32) external view returns (bool)",
    "event UserRegistered(address indexed user, string role, uint256 timestamp)",
    "event RecordCreated(bytes32 indexed recordId, address indexed patient, address indexed doctor, string ipfsCID, bytes32 contentHash, string recordType, uint256 timestamp)",
    "event AccessGrantCreated(bytes32 indexed grantId, address indexed patient, bytes32 accessToken, uint256 expiresAt, uint256 timestamp)",
    "event PrescriptionFulfilled(bytes32 indexed recordId, address indexed pharmacist, uint256 timestamp)"
]);

export async function getContract(walletClient: WalletClient) {
    return viemGetContract({
        address: SEHATI_REGISTRY_ADDRESS,
        abi: SEHATI_REGISTRY_ABI,
        client: walletClient,
    });
}

export function formatTokenForChain(token: string): `0x${string}` {
    if (!token) return zeroHash;
    if (token.startsWith("0x") && token.length === 66) return token as `0x${string}`;
    if (!token.startsWith("0x") && /^[0-9a-fA-F]{64}$/.test(token)) return `0x${token}` as `0x${string}`;
    return keccak256(toHex(token));
}

export async function createRecordOnChain(
    walletClient: any,
    patientAddress: string,
    ipfsCID: string,
    contentHash: string,
    recordType: string,
    accessToken: string
) {
    const contract = await getContract(walletClient);
    const contentHashBytes = contentHash.startsWith("0x") ? contentHash as `0x${string}` : keccak256(toHex(contentHash));
    const formattedToken = formatTokenForChain(accessToken);

    const hash = await contract.write.createRecord([
        patientAddress as `0x${string}`,
        ipfsCID,
        contentHashBytes,
        recordType,
        formattedToken
    ], { account: walletClient.account, chain: walletClient.chain });

    return { hash, wait: async () => await waitForTransactionReceipt(config, { hash }) } as any;
}

export async function registerDoctorOnChain(walletClient: any, doctorAddress: string) {
    const contract = await getContract(walletClient);
    const hash = await contract.write.registerDoctor([doctorAddress as `0x${string}`], { account: walletClient.account, chain: walletClient.chain });
    return { hash, wait: async () => await waitForTransactionReceipt(config, { hash }) } as any;
}

export async function registerPharmacistOnChain(walletClient: any, pharmacistAddress: string) {
    const contract = await getContract(walletClient);
    const hash = await contract.write.registerPharmacist([pharmacistAddress as `0x${string}`], { account: walletClient.account, chain: walletClient.chain });
    return { hash, wait: async () => await waitForTransactionReceipt(config, { hash }) } as any;
}

export async function registerAsPatientOnChain(walletClient: any) {
    const contract = await getContract(walletClient);
    const hash = await contract.write.registerAsPatient({ account: walletClient.account, chain: walletClient.chain });
    return { hash, wait: async () => await waitForTransactionReceipt(config, { hash }) } as any;
}

export async function createAccessGrantOnChain(walletClient: any, accessToken: string, durationMinutes: number) {
    const contract = await getContract(walletClient);
    const formattedToken = formatTokenForChain(accessToken);
    const hash = await contract.write.createAccessGrant([formattedToken, BigInt(durationMinutes)], { account: walletClient.account, chain: walletClient.chain });
    return { hash, wait: async () => await waitForTransactionReceipt(config, { hash }) } as any;
}

export async function estimateGasForAccessGrant(walletClient: any, accessToken: string, durationMinutes: number) {
    return { gasLimit: "200000", estimatedCost: "0.001" };
}

export async function fulfillPrescriptionOnChain(walletClient: any, recordId: string) {
    const contract = await getContract(walletClient);
    const hash = await contract.write.fulfillPrescription([recordId as `0x${string}`], { account: walletClient.account, chain: walletClient.chain });
    return { hash, wait: async () => await waitForTransactionReceipt(config, { hash }) } as any;
}
