import axios from "axios";

const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;
const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const PINATA_SECRET_API_KEY = import.meta.env.VITE_PINATA_SECRET_API_KEY;

export const uploadToIPFS = async (data: any): Promise<string> => {
    if (!PINATA_JWT && (!PINATA_API_KEY || !PINATA_SECRET_API_KEY)) {
        throw new Error("Pinata credentials missing. Please check your .env file.");
    }

    try {
        const formData = new FormData();

        // Ensure data is converted to a Blob/File
        let blob: Blob;
        if (typeof data === "string") {
            blob = new Blob([data], { type: "text/plain" });
        } else {
            blob = new Blob([JSON.stringify(data)], { type: "application/json" });
        }

        // Append file with a generic name (Pinata handles deduplication by content hash)
        formData.append("file", blob, `record-${Date.now()}.json`);

        // Optional: Add metadata
        const metadata = JSON.stringify({
            name: `SEHATI Medical Record ${Date.now()}`,
        });
        formData.append("pinataMetadata", metadata);

        // Optional: Add options
        const options = JSON.stringify({
            cidVersion: 1,
        });
        formData.append("pinataOptions", options);

        // CONFIG: Prioritize API Keys because JWT is failing with 403
        const headers: Record<string, string> = {};
        if (PINATA_API_KEY && PINATA_SECRET_API_KEY) {
            console.log("Using Pinata API Keys for auth");
            headers["pinata_api_key"] = PINATA_API_KEY;
            headers["pinata_secret_api_key"] = PINATA_SECRET_API_KEY;
        } else {
            console.log("Using Pinata JWT for auth");
            headers["Authorization"] = `Bearer ${PINATA_JWT}`;
        }

        const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
            headers,
        });

        return res.data.IpfsHash;
    } catch (error: any) {
        console.error("Error uploading to IPFS:", error);
        throw new Error(`IPFS Upload failed: ${error.message || error}`);
    }
};
