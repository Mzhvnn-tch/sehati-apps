import { ethers } from "ethers";
import { type WalletClient } from "viem";
import { useWalletClient } from "wagmi";
import React from "react";

export function walletClientToSigner(walletClient: WalletClient) {
    if (!walletClient) {
        console.warn("⚠️ walletClientToSigner called with null client");
        return undefined;
    }
    try {
        const { account, chain, transport } = walletClient;
        if (!chain) {
            console.warn("⚠️ walletClient has no chain defined");
            return undefined;
        }
        if (!account) {
            console.warn("⚠️ walletClient has no account defined");
            return undefined;
        }
        // DEBUG LOG
        console.log("🔑 Creating Signer for Chain:", chain.id);

        const network = {
            chainId: chain.id,
            name: chain.name,
            ensAddress: chain.contracts?.ensRegistry?.address,
        };
        const provider = new ethers.BrowserProvider(transport as any, network);
        const address = typeof account === 'string' ? account : account.address;
        const signer = new ethers.JsonRpcSigner(provider, address);
        return signer;
    } catch (error) {
        console.error("❌ Failed to create ethers signer:", error);
        return undefined;
    }
}

export function useEthersSigner({ chainId }: { chainId?: number } = {}) {
    const { data: walletClient } = useWalletClient({ chainId });
    const [fallbackSigner, setFallbackSigner] = React.useState<ethers.JsonRpcSigner | undefined>(undefined);

    React.useEffect(() => {
        const initFallback = async () => {
            // [SAFEGUARD] Only try fallback if explicitly needed and safe
            // Removing the auto-init to prevent "Failed to connect to MetaMask" loops during load
            // if (!walletClient && typeof window !== 'undefined' && (window as any).ethereum) {
            //     try {
            //         const provider = new ethers.BrowserProvider((window as any).ethereum);
            //         const signer = await provider.getSigner();
            //         console.log("⚠️ Using Fallback Signer (window.ethereum)");
            //         setFallbackSigner(signer);
            //     } catch (e) {
            //         console.error("Fallback signer init failed", e);
            //     }
            // }
        };
        initFallback();
    }, [walletClient]);

    // DEBUG LOG
    React.useEffect(() => {
        console.log("🎣 useEthersSigner Hook:", { chainId, hasWalletClient: !!walletClient, hasFallback: !!fallbackSigner });
    }, [walletClient, chainId, fallbackSigner]);

    return React.useMemo(
        () => {
            if (walletClient) return walletClientToSigner(walletClient);
            return fallbackSigner;
        },
        [walletClient, fallbackSigner]
    );
}

export const SEHATI_REGISTRY_ADDRESS = (import.meta.env.VITE_CONTRACT_ADDRESS as string) || "0x7d8762646954b45d6fBcA7938435cB8F1B57A3f8"; // Ethereum Sepolia Testnet
export const SEHATI_REGISTRY_ABI = [
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
];

export async function getContract(signer: ethers.Signer) {
    return new ethers.Contract(SEHATI_REGISTRY_ADDRESS, SEHATI_REGISTRY_ABI, signer);
}

export function formatTokenForChain(token: string): string {
    if (!token) return ethers.ZeroHash;

    // If it's already a hex string of the right length (64 chars + 0x)
    if (token.startsWith("0x") && token.length === 66) {
        return token;
    }

    // If it's a hex string without 0x
    if (!token.startsWith("0x") && /^[0-9a-fA-F]{64}$/.test(token)) {
        return "0x" + token;
    }

    // Otherwise, hash it to ensure bytes32 compatibility
    // This handles JWTs, UUIDs, or short strings safely
    return ethers.keccak256(ethers.toUtf8Bytes(token));
}

export async function createRecordOnChain(
    signer: ethers.Signer,
    patientAddress: string,
    ipfsCID: string,
    contentHash: string, // Valid hex string (0x...)
    recordType: string,
    accessToken: string
) {
    const contract = await getContract(signer);

    // Convert strings to bytes32 where necessary
    const contentHashBytes = contentHash.startsWith("0x") ? contentHash : ethers.keccak256(ethers.toUtf8Bytes(contentHash));
    const formattedToken = formatTokenForChain(accessToken);

    const signerAddr = await signer.getAddress();
    console.log("SENDING FROM SIGNER:", signerAddr);
    console.log("patientAddress:", patientAddress);
    console.log("ipfsCID:", ipfsCID);
    console.log("contentHashBytes:", contentHashBytes);
    console.log("recordType:", recordType);
    console.log("formattedToken:", formattedToken);
    
    // Use raw transaction to completely bypass ethers.Contract error coalescing bugs!
    const data = contract.interface.encodeFunctionData("createRecord", [
        patientAddress,
        ipfsCID,
        contentHashBytes,
        recordType,
        formattedToken
    ]);

    const to = await contract.getAddress();
    
    console.log("Raw TX Data:", data);
    console.log("Sending Raw Transaction via Signer to:", to);

    // EXTREME BYPASS: Use BrowserProvider.send directly to bypass Ethers formatters!
    const browserProvider = signer.provider as ethers.BrowserProvider;
    const txHash = await browserProvider.send("eth_sendTransaction", [{
        from: signerAddr,
        to: to,
        data: data,
        gas: "0x7a120", // 500000 in hex
        value: "0x0", // Explicitly passed as "0x0" string
        chainId: "0xaa36a7" // 11155111 in hex
    }]);

    console.log("Raw TX Hash:", txHash);
    
    // We must return a transaction response object that Wagmi/App expects
    return {
        hash: txHash,
        wait: async () => {
            return await signer.provider?.waitForTransaction(txHash);
        }
    } as any;
}

export async function registerDoctorOnChain(signer: ethers.Signer, doctorAddress: string) {
    const contract = await getContract(signer);
    const tx = await contract.registerDoctor(doctorAddress);
    return tx;
}

export async function registerPharmacistOnChain(signer: ethers.Signer, pharmacistAddress: string) {
    const contract = await getContract(signer);
    const tx = await contract.registerPharmacist(pharmacistAddress);
    return tx;
}

export async function registerAsPatientOnChain(signer: ethers.Signer) {
    const contract = await getContract(signer);
    const tx = await contract.registerAsPatient();
    return tx;
}

export async function createAccessGrantOnChain(signer: ethers.Signer, accessToken: string, durationMinutes: number) {
    const contract = await getContract(signer);
    const formattedToken = formatTokenForChain(accessToken);

    const tx = await contract.createAccessGrant(formattedToken, durationMinutes);
    return tx;
}

export async function estimateGasForAccessGrant(signer: ethers.Signer, accessToken: string, durationMinutes: number) {
    const contract = await getContract(signer);
    const formattedToken = formatTokenForChain(accessToken);

    try {
        const gasEstimate = await contract.createAccessGrant.estimateGas(formattedToken, durationMinutes);
        const feeData = await signer.provider?.getFeeData();

        if (!feeData?.gasPrice) return null;

        const cost = gasEstimate * feeData.gasPrice;
        return {
            gasLimit: gasEstimate.toString(),
            estimatedCost: ethers.formatEther(cost)
        };
    } catch (e) {
        console.warn("Gas estimation failed:", e);
        return null;
    }
}
