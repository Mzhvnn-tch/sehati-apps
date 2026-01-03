export async function generateKeyPair(): Promise<{
    publicKey: CryptoKey;
    privateKey: CryptoKey;
    publicKeyStr: string;
    privateKeyStr: string;
}> {
    const keyPair = await window.crypto.subtle.generateKey(
        {
            name: "RSA-OAEP",
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256",
        },
        true,
        ["encrypt", "decrypt"]
    );

    const publicKeyStr = await exportKey(keyPair.publicKey);
    const privateKeyStr = await exportKey(keyPair.privateKey);

    return {
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey,
        publicKeyStr,
        privateKeyStr,
    };
}

export async function exportKey(key: CryptoKey): Promise<string> {
    const exported = await window.crypto.subtle.exportKey(
        key.type === "public" ? "spki" : "pkcs8",
        key
    );
    const exportedAsBase64 = arrayBufferToBase64(exported);
    return exportedAsBase64;
}

export async function importKey(
    pem: string,
    type: "public" | "private"
): Promise<CryptoKey> {
    const binaryDerString = window.atob(pem);
    const binaryDer = str2ab(binaryDerString);

    return await window.crypto.subtle.importKey(
        type === "public" ? "spki" : "pkcs8",
        binaryDer,
        {
            name: "RSA-OAEP",
            hash: "SHA-256",
        },
        true,
        [type === "public" ? "encrypt" : "decrypt"]
    );
}

// Hybrid Encryption: AES-GCM for data, RSA-OAEP for the AES key.
export async function encryptData(
    data: string,
    publicKey: CryptoKey
): Promise<string> {
    // 1. Generate a random AES key
    const aesKey = await window.crypto.subtle.generateKey(
        {
            name: "AES-GCM",
            length: 256,
        },
        true,
        ["encrypt", "decrypt"]
    );

    // 2. Encrypt the data with the AES key
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encodedData = new TextEncoder().encode(data);
    const encryptedContent = await window.crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv,
        },
        aesKey,
        encodedData
    );

    // 3. Encrypt the AES key with the RSA Public Key
    const rawAesKey = await window.crypto.subtle.exportKey("raw", aesKey);
    const encryptedKey = await window.crypto.subtle.encrypt(
        {
            name: "RSA-OAEP",
        },
        publicKey,
        rawAesKey
    );

    // 4. Return as JSON
    const payload = {
        iv: arrayBufferToBase64(iv.buffer),
        key: arrayBufferToBase64(encryptedKey),
        data: arrayBufferToBase64(encryptedContent),
    };

    return JSON.stringify(payload);
}

export async function decryptData(
    encryptedDataStr: string,
    privateKey: CryptoKey
): Promise<string> {
    try {
        // 1. Parse payload
        let payload;
        try {
            payload = JSON.parse(encryptedDataStr);
        } catch (e) {
            console.warn("Encryption format not JSON, attempting legacy AES or raw RSA");
            return "[Encrypted Record]";
        }

        if (!payload.iv || !payload.key || !payload.data) {
            throw new Error("Invalid encrypted payload format");
        }

        // 2. Decrypt the AES Key with RSA Private Key
        const encryptedKey = base64ToArrayBuffer(payload.key);
        const rawAesKey = await window.crypto.subtle.decrypt(
            {
                name: "RSA-OAEP",
            },
            privateKey,
            encryptedKey
        );

        // 3. Import the AES Key
        const aesKey = await window.crypto.subtle.importKey(
            "raw",
            rawAesKey,
            {
                name: "AES-GCM",
                length: 256,
            },
            false,
            ["decrypt"]
        );

        // 4. Decrypt the Data with AES Key
        const iv = base64ToArrayBuffer(payload.iv);
        const encryptedContent = base64ToArrayBuffer(payload.data);
        const decryptedContent = await window.crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: iv,
            },
            aesKey,
            encryptedContent
        );

        return new TextDecoder().decode(decryptedContent);
    } catch (e) {
        console.error("Decryption failed:", e);
        return "[Decryption Failed]";
    }
}

// Helpers
function arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

function str2ab(str: string): ArrayBuffer {
    const buf = new ArrayBuffer(str.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}
