import type { User, MedicalRecord, AccessGrant, AuditLog } from "@shared/schema";

async function apiCall<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options?.headers as Record<string, string>) || {}),
  };

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const error = await response.json();
        throw new Error(error.error || error.message || "API request failed");
      } else {
        throw new Error(`API request failed: ${response.statusText}`);
      }
    } catch (e: any) {
      throw new Error(e.message || `API request failed with status ${response.status}`);
    }
  }

  if (response.status === 204) {
    return {} as T;
  }

  const contentLength = response.headers.get('content-length');
  if (contentLength === '0') {
    return {} as T;
  }

  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return {} as T;
  }

  try {
    const text = await response.text();
    if (!text || text.trim() === '') {
      return {} as T;
    }
    return JSON.parse(text) as T;
  } catch (e) {
    console.error('JSON parse error:', e);
    return {} as T;
  }
}

export async function checkSession(): Promise<{
  authenticated: boolean;
  user: User | null;
}> {
  return apiCall("/auth/session");
}

export async function logout(): Promise<{ success: boolean }> {
  return apiCall("/auth/logout", { method: "POST" });
}

export async function generateWallet(): Promise<{
  address: string;
  privateKey: string;
  mnemonic: string;
  warning: string;
}> {
  return apiCall("/wallet/generate", { method: "POST" });
}

export async function generateNonce(walletAddress: string): Promise<{
  nonce: string;
  message: string;
}> {
  return apiCall("/auth/generate-nonce", {
    method: "POST",
    body: JSON.stringify({ walletAddress }),
  });
}

export async function verifySignature(
  walletAddress: string,
  message: string,
  signature: string
): Promise<{
  verified: boolean;
  user: User | null;
  exists: boolean;
}> {
  return apiCall("/auth/verify-signature", {
    method: "POST",
    body: JSON.stringify({ walletAddress, message, signature }),
  });
}

export async function signMessage(
  privateKey: string,
  message: string
): Promise<{ signature: string }> {
  return apiCall("/auth/sign-message", {
    method: "POST",
    body: JSON.stringify({ privateKey, message }),
  });
}

export async function connectWallet(data: {
  walletAddress: string;
  name: string;
  role: "patient" | "doctor";
  gender: "male" | "female" | "other";
  age: number;
  bloodType?: string | null;
  allergies?: string[] | null;
  hospital?: string | null;
}): Promise<{ user: User }> {
  return apiCall("/auth/wallet", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getUserByWallet(
  walletAddress: string
): Promise<{ user: User }> {
  return apiCall(`/users/${walletAddress}`);
}

export async function updateUserProfile(
  userId: string,
  updates: {
    name?: string;
    bloodType?: string | null;
    allergies?: string[] | null;
    age?: number | null;
  }
): Promise<{ user: User }> {
  return apiCall(`/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export async function getPatientRecords(
  patientId: string
): Promise<{ records: MedicalRecord[] }> {
  return apiCall(`/records/patient/${patientId}`);
}

export async function createMedicalRecord(data: {
  patientId: string;
  doctorId: string;
  hospitalName: string;
  recordType: string;
  title: string;
  content: string;
}): Promise<{ record: MedicalRecord }> {
  return apiCall("/records", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function decryptRecord(
  recordId: string,
  userId: string
): Promise<MedicalRecord & { decryptedContent: string }> {
  return apiCall(`/records/${recordId}/decrypt`, {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
}

export async function generateQRAccess(
  patientId: string,
  durationMinutes: number = 60
): Promise<{ grant: AccessGrant; qrData: string }> {
  return apiCall("/access/generate", {
    method: "POST",
    body: JSON.stringify({ patientId, durationMinutes }),
  });
}

export async function validateQRToken(
  token: string,
  doctorId?: string
): Promise<{
  patient: User;
  records: (MedicalRecord & { decryptedContent: string })[];
  grant: AccessGrant;
}> {
  return apiCall("/access/validate", {
    method: "POST",
    body: JSON.stringify({ token, doctorId }),
  });
}

export async function revokeAccess(
  grantId: string,
  userId: string
): Promise<{ success: boolean }> {
  return apiCall(`/access/revoke/${grantId}`, {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
}

export async function getActiveGrants(
  patientId: string
): Promise<{ grants: AccessGrant[] }> {
  return apiCall(`/access/patient/${patientId}`);
}

export async function getAuditLogs(
  userId: string
): Promise<{ logs: AuditLog[] }> {
  return apiCall(`/audit/${userId}`);
}

export async function getWeb3Config(): Promise<{
  supportedChains: { id: number; name: string; rpcUrl: string }[];
  walletConnectProjectId: string | null;
}> {
  return apiCall("/web3/config");
}

export async function getIPFSConfig(): Promise<{
  gateway: string;
  isConfigured: boolean;
}> {
  return apiCall("/ipfs/config");
}

export async function seedDatabase(): Promise<any> {
  return apiCall("/seed", { method: "POST" });
}
