import { exec } from "child_process";
import path from "path";
import fs from "fs";
import { promisify } from "util";

const execAsync = promisify(exec);

// Path to the Python SDK wrapper
const SDK_PATH = path.resolve(process.cwd(), "biometric_sdk", "cli_wrapper.py");
const PYTHON_CMD = "python"; // Assume python is in PATH

export interface BiometricRecord {
    helper_ecc: string;
    helper_grid: any;
    context_hash: string;
    verifier: string;
}

export interface EnrollResult {
    success: boolean;
    record?: BiometricRecord;
    error?: string;
}

export interface VerifyResult {
    success: boolean;
    key?: string;
    error?: string;
}

export const biometricService = {
    /**
     * Enroll a user using a biometric image.
     * @param imagePath Path to the temporary image file uploaded by the user
     * @param userId User's ID or unique identifier for context binding
     */
    async enroll(imagePath: string, userId: string): Promise<EnrollResult> {
        try {
            // Create a unique service context per user to prevent cross-user replay attacks
            // In a real app, this might just be the app name "SehatiApp" if keys are global,
            // but binding to UserID makes the key unique to THIS user account.
            const serviceName = `SehatiApp`;

            const command = `${PYTHON_CMD} "${SDK_PATH}" --action enroll --image "${imagePath}" --service "${serviceName}"`;

            const { stdout, stderr } = await execAsync(command);

            if (stderr && !stderr.startsWith("Import Error")) {
                // Python often prints warnings to stderr, so we don't always fail on it
                console.warn("Biometric SDK Warning:", stderr);
            }

            const result = JSON.parse(stdout.trim());
            return result;

        } catch (error: any) {
            console.error("Biometric Enrollment Failed:", error);
            return { success: false, error: error.message || "Internal Server Error" };
        }
    },

    /**
     * Verify a user and derive their key.
     * @param imagePath Path to the temporary image file
     * @param userId User's ID
     * @param record The stored enrollment record (JSON object)
     */
    async verify(imagePath: string, record: BiometricRecord): Promise<VerifyResult> {
        try {
            const serviceName = `SehatiApp`;
            // Escape the JSON string carefully for command line
            const recordStr = JSON.stringify(record).replace(/"/g, '\\"');

            const command = `${PYTHON_CMD} "${SDK_PATH}" --action verify --image "${imagePath}" --service "${serviceName}" --record "${recordStr}"`;

            const { stdout, stderr } = await execAsync(command);

            const result = JSON.parse(stdout.trim());
            return result;

        } catch (error: any) {
            console.error("Biometric Verification Failed:", error);
            return { success: false, error: error.message || "Internal Server Error" };
        }
    }
};
