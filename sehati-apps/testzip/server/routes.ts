import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { type User } from "@shared/schema";
import {
  encrypt,
  decrypt,
  generateEncryptionKey,
  generateToken,
  generateBlockchainHash,
  generateIPFSHash,
} from "./crypto";
import {
  authMiddleware,
  requirePatient,
  requireDoctor,
  walletAuthLimiter,
  strictLimiter,
  validateWalletAddress,
} from "./middleware/security";
import {
  validate,
  userRegistrationSchema,
  userUpdateSchema,
  medicalRecordSchema,
  accessGrantSchema,
  accessValidateSchema,
  decryptRecordSchema,
} from "./middleware/validation";
import { web3Service } from "./services/web3";
import { ipfsService } from "./services/ipfs";
import { blockchainService } from "./services/blockchain";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.post("/api/auth/wallet", 
    walletAuthLimiter,
    validateWalletAddress,
    validate(userRegistrationSchema),
    async (req, res) => {
      try {
        const { walletAddress, name, role, gender, age, bloodType, allergies, hospital } = req.body;

        if (!req.session.verifiedWallet || req.session.verifiedWallet !== walletAddress) {
          return res.status(401).json({ 
            error: "Wallet ownership not verified. Please verify your wallet signature first." 
          });
        }

        let user = await storage.getUserByWallet(walletAddress);

        if (!user) {
          const encryptionKey = generateEncryptionKey();
          
          user = await storage.createUser({
            walletAddress,
            name,
            role,
            gender,
            age,
            bloodType: bloodType || null,
            allergies: allergies || null,
            hospital: hospital || null,
            publicKey: encryptionKey,
          });

          await storage.createAuditLog({
            actorId: user.id,
            targetId: user.id,
            action: "UserCreated",
            entityType: "user",
            metadata: JSON.stringify({ role }),
            transactionHash: generateBlockchainHash(),
          });
        }

        req.session.user = {
          id: user.id,
          walletAddress: user.walletAddress,
          role: user.role,
        };
        req.session.authenticated = true;

        res.json({ user });
      } catch (error: any) {
        console.error("Wallet auth error:", error);
        res.status(500).json({ error: "Authentication failed. Please try again." });
      }
    }
  );

  app.post("/api/auth/verify-signature",
    strictLimiter,
    async (req, res) => {
      try {
        const { walletAddress, message, signature } = req.body;
        
        if (!walletAddress || !message || !signature) {
          return res.status(400).json({ error: "Missing required fields" });
        }

        const isValid = await web3Service.verifySignature(walletAddress, message, signature);
        
        if (!isValid) {
          return res.status(401).json({ error: "Invalid signature" });
        }

        const user = await storage.getUserByWallet(walletAddress);
        
        req.session.verifiedWallet = walletAddress;
        
        if (user) {
          req.session.user = {
            id: user.id,
            walletAddress: user.walletAddress,
            role: user.role,
          };
          req.session.authenticated = true;
        }
        
        res.json({ 
          verified: true, 
          user: user || null,
          exists: !!user 
        });
      } catch (error: any) {
        console.error("Signature verification error:", error);
        res.status(500).json({ error: "Verification failed" });
      }
    }
  );

  app.post("/api/auth/generate-nonce",
    strictLimiter,
    async (req, res) => {
      try {
        const { walletAddress } = req.body;
        
        if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
          return res.status(400).json({ error: "Invalid wallet address" });
        }

        const nonce = web3Service.generateNonce();
        const message = web3Service.generateSignMessage(nonce, walletAddress);
        
        res.json({ nonce, message });
      } catch (error: any) {
        console.error("Nonce generation error:", error);
        res.status(500).json({ error: "Failed to generate nonce" });
      }
    }
  );

  app.post("/api/wallet/generate",
    strictLimiter,
    async (req, res) => {
      try {
        const wallet = web3Service.generateWallet();
        
        res.json({
          address: wallet.address,
          privateKey: wallet.privateKey,
          mnemonic: wallet.mnemonic,
          warning: "IMPORTANT: Save your private key and mnemonic phrase securely. They cannot be recovered if lost.",
        });
      } catch (error: any) {
        console.error("Wallet generation error:", error);
        res.status(500).json({ error: "Failed to generate wallet" });
      }
    }
  );

  app.post("/api/auth/logout",
    async (req, res) => {
      try {
        req.session.destroy((err) => {
          if (err) {
            return res.status(500).json({ error: "Failed to logout" });
          }
          res.json({ success: true, message: "Logged out successfully" });
        });
      } catch (error: any) {
        console.error("Logout error:", error);
        res.status(500).json({ error: "Failed to logout" });
      }
    }
  );

  app.get("/api/auth/session",
    async (req, res) => {
      if (req.session?.authenticated && req.session?.user) {
        const user = await storage.getUserByWallet(req.session.user.walletAddress);
        res.json({ authenticated: true, user });
      } else {
        res.json({ authenticated: false, user: null });
      }
    }
  );

  app.post("/api/auth/sign-message",
    strictLimiter,
    async (req, res) => {
      try {
        const { privateKey, message } = req.body;
        
        if (!privateKey || !message) {
          return res.status(400).json({ error: "Missing privateKey or message" });
        }

        const signature = await web3Service.signMessage(privateKey, message);
        res.json({ signature });
      } catch (error: any) {
        console.error("Sign message error:", error);
        res.status(500).json({ error: "Failed to sign message" });
      }
    }
  );

  app.get("/api/users/:walletAddress", 
    async (req, res) => {
      try {
        const { walletAddress } = req.params;
        
        if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
          return res.status(400).json({ error: "Invalid wallet address format" });
        }
        
        const user = await storage.getUserByWallet(walletAddress);

        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        res.json({ user });
      } catch (error: any) {
        console.error("Get user error:", error);
        res.status(500).json({ error: "Failed to retrieve user" });
      }
    }
  );

  app.patch("/api/users/:userId",
    authMiddleware,
    validate(userUpdateSchema),
    async (req, res) => {
      try {
        const { userId } = req.params;
        const updates = req.body;

        if (req.user?.id !== userId) {
          return res.status(403).json({ error: "You can only update your own profile" });
        }

        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        const updatedUser = await storage.updateUser(userId, updates);

        await storage.createAuditLog({
          actorId: userId,
          targetId: userId,
          action: "ProfileUpdated",
          entityType: "user",
          metadata: JSON.stringify({ fields: Object.keys(updates) }),
          transactionHash: generateBlockchainHash(),
        });

        res.json({ user: updatedUser });
      } catch (error: any) {
        console.error("Update user error:", error);
        res.status(500).json({ error: "Failed to update profile" });
      }
    }
  );

  app.get("/api/records/patient/:patientId",
    authMiddleware,
    async (req, res) => {
      try {
        const { patientId } = req.params;
        
        if (req.user?.id !== patientId && req.user?.role !== 'doctor') {
          return res.status(403).json({ error: "Access denied" });
        }

        const records = await storage.getMedicalRecordsByPatient(patientId);

        res.json({ records });
      } catch (error: any) {
        console.error("Get records error:", error);
        res.status(500).json({ error: "Failed to retrieve records" });
      }
    }
  );

  app.post("/api/records",
    authMiddleware,
    requireDoctor,
    validate(medicalRecordSchema),
    async (req, res) => {
      try {
        const { patientId, doctorId, hospitalName, recordType, title, content } = req.body;

        if (req.user?.id !== doctorId) {
          return res.status(403).json({ error: "Doctor ID mismatch" });
        }

        const patient = await storage.getUser(patientId);
        if (!patient || !patient.publicKey) {
          return res.status(404).json({ error: "Patient not found" });
        }

        const encryptedContent = encrypt(content, patient.publicKey);
        
        let ipfsHash = null;
        let blockchainHash = null;
        
        try {
          ipfsHash = await ipfsService.uploadData({
            recordType,
            title,
            timestamp: new Date().toISOString(),
            contentHash: ipfsService.generateContentHash(content),
          });
        } catch (e) {
          console.warn("IPFS upload failed, using simulated hash:", e);
          ipfsHash = generateIPFSHash();
        }
        
        const contentHash = blockchainService.hashData(content);
        
        if (blockchainService.isConfigured()) {
          try {
            const txResult = await blockchainService.submitDataHash(contentHash, JSON.stringify({
              type: 'medical_record',
              recordType,
              title,
              patientId,
              doctorId,
            }));
            if (txResult) {
              blockchainHash = txResult.txHash;
              console.log(`[Routes] Record stored on-chain: ${txResult.explorerUrl}`);
            } else {
              blockchainHash = generateBlockchainHash();
            }
          } catch (e) {
            console.warn("Blockchain submission failed, using simulated hash:", e);
            blockchainHash = generateBlockchainHash();
          }
        } else {
          blockchainHash = generateBlockchainHash();
        }

        const record = await storage.createMedicalRecord({
          patientId,
          doctorId,
          hospitalName,
          recordType,
          title,
          encryptedContent,
          ipfsHash,
          blockchainHash,
        });

        await storage.createAuditLog({
          actorId: doctorId,
          targetId: record.id,
          action: "RecordAdded",
          entityType: "record",
          metadata: JSON.stringify({
            patientId,
            recordType,
            hospitalName,
            ipfsHash,
          }),
          transactionHash: blockchainHash,
        });

        res.json({ record });
      } catch (error: any) {
        console.error("Create record error:", error);
        res.status(500).json({ error: "Failed to create medical record" });
      }
    }
  );

  app.post("/api/records/:recordId/decrypt",
    authMiddleware,
    validate(decryptRecordSchema),
    async (req, res) => {
      try {
        const { recordId } = req.params;
        const { userId } = req.body;

        if (req.user?.id !== userId) {
          return res.status(403).json({ error: "User ID mismatch" });
        }

        const record = await storage.getMedicalRecord(recordId);
        if (!record) {
          return res.status(404).json({ error: "Record not found" });
        }

        const patient = await storage.getUser(record.patientId);
        if (!patient || !patient.publicKey) {
          return res.status(404).json({ error: "Patient not found" });
        }

        if (req.user?.id !== record.patientId && req.user?.role !== 'doctor') {
          return res.status(403).json({ error: "Access denied" });
        }

        const decryptedContent = decrypt(record.encryptedContent, patient.publicKey);

        await storage.createAuditLog({
          actorId: userId,
          targetId: recordId,
          action: "RecordViewed",
          entityType: "record",
          metadata: JSON.stringify({
            patientId: record.patientId,
            recordType: record.recordType,
          }),
          transactionHash: generateBlockchainHash(),
        });

        res.json({
          ...record,
          decryptedContent,
        });
      } catch (error: any) {
        console.error("Decrypt record error:", error);
        res.status(500).json({ error: "Failed to decrypt record" });
      }
    }
  );

  app.post("/api/access/generate",
    authMiddleware,
    requirePatient,
    validate(accessGrantSchema),
    async (req, res) => {
      try {
        const { patientId, durationMinutes = 60 } = req.body;

        if (req.user?.id !== patientId) {
          return res.status(403).json({ error: "You can only generate access for yourself" });
        }

        const patient = await storage.getUser(patientId);
        if (!patient || !patient.publicKey) {
          return res.status(404).json({ error: "Patient not found" });
        }

        const token = generateToken();
        const encryptionKey = patient.publicKey;

        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + durationMinutes);

        const grant = await storage.createAccessGrant({
          patientId,
          token,
          encryptionKey,
          expiresAt,
          isActive: true,
        });

        await storage.createAuditLog({
          actorId: patientId,
          targetId: grant.id,
          action: "AccessGranted",
          entityType: "access",
          metadata: JSON.stringify({ expiresAt, durationMinutes }),
          transactionHash: generateBlockchainHash(),
        });

        res.json({ grant, qrData: `sehati://access?token=${token}` });
      } catch (error: any) {
        console.error("Generate access error:", error);
        res.status(500).json({ error: "Failed to generate access token" });
      }
    }
  );

  app.post("/api/access/validate",
    authMiddleware,
    validate(accessValidateSchema),
    async (req, res) => {
      try {
        const { token, doctorId } = req.body;

        const grant = await storage.getAccessGrantByToken(token);
        if (!grant) {
          return res.status(401).json({ error: "Invalid or expired access token" });
        }

        const patient = await storage.getUser(grant.patientId);
        if (!patient) {
          return res.status(404).json({ error: "Patient not found" });
        }

        const records = await storage.getMedicalRecordsByPatient(grant.patientId);

        const decryptedRecords = records.map((record) => {
          try {
            const decryptedContent = decrypt(record.encryptedContent, grant.encryptionKey);
            return { ...record, decryptedContent };
          } catch (e) {
            return { ...record, decryptedContent: "[Decryption failed]" };
          }
        });

        if (doctorId) {
          await storage.createAuditLog({
            actorId: doctorId,
            targetId: grant.patientId,
            action: "RecordViewed",
            entityType: "access",
            metadata: JSON.stringify({
              grantId: grant.id,
              recordCount: records.length,
            }),
            transactionHash: generateBlockchainHash(),
          });
        }

        res.json({
          patient: {
            id: patient.id,
            walletAddress: patient.walletAddress,
            name: patient.name,
            role: patient.role,
            bloodType: patient.bloodType,
            allergies: patient.allergies,
            age: patient.age,
            publicKey: patient.publicKey,
            createdAt: patient.createdAt,
          },
          records: decryptedRecords,
          grant,
        });
      } catch (error: any) {
        console.error("Validate access error:", error);
        res.status(500).json({ error: "Failed to validate access token" });
      }
    }
  );

  app.post("/api/access/revoke/:grantId",
    authMiddleware,
    requirePatient,
    async (req, res) => {
      try {
        const { grantId } = req.params;

        const grant = await storage.getAccessGrant(grantId);
        if (!grant) {
          return res.status(404).json({ error: "Access grant not found" });
        }

        if (req.user?.id !== grant.patientId) {
          return res.status(403).json({ error: "You can only revoke your own access grants" });
        }

        await storage.revokeAccessGrant(grantId);

        await storage.createAuditLog({
          actorId: req.user.id,
          targetId: grantId,
          action: "AccessRevoked",
          entityType: "access",
          metadata: JSON.stringify({ grantId }),
          transactionHash: generateBlockchainHash(),
        });

        res.json({ success: true });
      } catch (error: any) {
        console.error("Revoke access error:", error);
        res.status(500).json({ error: "Failed to revoke access" });
      }
    }
  );

  app.get("/api/access/patient/:patientId",
    authMiddleware,
    async (req, res) => {
      try {
        const { patientId } = req.params;
        
        if (req.user?.id !== patientId) {
          return res.status(403).json({ error: "Access denied" });
        }

        const grants = await storage.getActiveAccessGrantsByPatient(patientId);
        res.json({ grants });
      } catch (error: any) {
        console.error("Get access grants error:", error);
        res.status(500).json({ error: "Failed to retrieve access grants" });
      }
    }
  );

  app.get("/api/audit/:userId",
    authMiddleware,
    async (req, res) => {
      try {
        const { userId } = req.params;
        
        if (req.user?.id !== userId) {
          return res.status(403).json({ error: "You can only view your own audit logs" });
        }

        const logs = await storage.getAuditLogsByUser(userId);
        res.json({ logs });
      } catch (error: any) {
        console.error("Get audit logs error:", error);
        res.status(500).json({ error: "Failed to retrieve audit logs" });
      }
    }
  );

  app.get("/api/web3/config", (req, res) => {
    res.json(web3Service.getConfig());
  });

  app.get("/api/ipfs/config", (req, res) => {
    res.json(ipfsService.getConfig());
  });

  app.get("/api/blockchain/status", async (req, res) => {
    try {
      const isConfigured = blockchainService.isConfigured();
      const relayerAddress = blockchainService.getRelayerAddress();
      const chainInfo = blockchainService.getChainInfo();
      
      let blockNumber = null;
      let relayerBalance = null;
      
      if (isConfigured) {
        try {
          blockNumber = await blockchainService.getBlockNumber();
          relayerBalance = await blockchainService.getRelayerBalance();
        } catch (e) {
          console.warn("Failed to get blockchain data:", e);
        }
      }
      
      res.json({
        configured: isConfigured,
        mode: isConfigured ? 'live' : 'simulation',
        chain: chainInfo,
        relayer: relayerAddress ? {
          address: relayerAddress,
          balance: relayerBalance,
          explorerUrl: blockchainService.getAddressExplorerUrl(relayerAddress)
        } : null,
        currentBlock: blockNumber,
        contractAddress: process.env.CONTRACT_ADDRESS || null,
      });
    } catch (error) {
      console.error("Blockchain status error:", error);
      res.status(500).json({ error: "Failed to get blockchain status" });
    }
  });

  app.get("/api/blockchain/verify/:txHash", async (req, res) => {
    try {
      const { txHash } = req.params;
      
      if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
        return res.status(400).json({ error: "Invalid transaction hash format" });
      }
      
      const chainInfo = blockchainService.getChainInfo();
      const explorerUrl = blockchainService.getExplorerUrl(txHash);
      
      const txDetails = await blockchainService.getTransactionByHash(txHash);
      
      if (txDetails) {
        res.json({
          txHash,
          verified: true,
          blockNumber: txDetails.blockNumber,
          timestamp: txDetails.timestamp,
          timestampHuman: new Date(txDetails.timestamp * 1000).toISOString(),
          data: txDetails.data,
          explorerUrl: txDetails.explorerUrl,
          chain: chainInfo,
          message: "Transaction verified on Polygon Amoy Testnet"
        });
      } else {
        res.json({
          txHash,
          verified: false,
          explorerUrl,
          chain: chainInfo,
          message: "Transaction not found or pending. Click the link to check on Polygonscan"
        });
      }
    } catch (error) {
      console.error("Verify transaction error:", error);
      res.status(500).json({ error: "Failed to verify transaction" });
    }
  });

  app.post("/api/seed", strictLimiter, async (req, res) => {
    try {
      const existingPatient = await storage.getUserByWallet("0x71C7656EC7ab88b098defB751B7401B5f6d8976F");
      if (existingPatient) {
        return res.json({
          message: "Seed data already exists",
          patient: existingPatient,
        });
      }

      const patient = await storage.createUser({
        walletAddress: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
        name: "John Doe",
        role: "patient",
        gender: "male",
        age: 34,
        bloodType: "O+",
        allergies: ["Penicillin"],
        hospital: null,
        publicKey: generateEncryptionKey(),
      });

      const doctor = await storage.createUser({
        walletAddress: "0xABCD1234567890abcdef1234567890ABCDEF1234",
        name: "Dr. Stephen Strange",
        role: "doctor",
        gender: "male",
        age: 45,
        bloodType: null,
        allergies: null,
        hospital: "Sanctum Sanctorum Medical Center",
        publicKey: generateEncryptionKey(),
      });

      const record1 = await storage.createMedicalRecord({
        patientId: patient.id,
        doctorId: doctor.id,
        hospitalName: "Metropolitan General Hospital",
        recordType: "lab_result",
        title: "Blood Work Analysis - Lipid Profile",
        encryptedContent: encrypt(
          "Cholesterol levels are within normal range. HDL: 60 mg/dL, LDL: 100 mg/dL. Slight elevation in Triglycerides (160 mg/dL). Recommendation: Reduce sugar intake.",
          patient.publicKey!
        ),
        ipfsHash: generateIPFSHash(),
        blockchainHash: generateBlockchainHash(),
      });

      const record2 = await storage.createMedicalRecord({
        patientId: patient.id,
        doctorId: doctor.id,
        hospitalName: "City Clinic",
        recordType: "diagnosis",
        title: "Acute Gastritis Consultation",
        encryptedContent: encrypt(
          "Patient complained of abdominal pain. Physical exam suggests acute gastritis. Prescribed Omeprazole 20mg daily for 14 days.",
          patient.publicKey!
        ),
        ipfsHash: generateIPFSHash(),
        blockchainHash: generateBlockchainHash(),
      });

      const record3 = await storage.createMedicalRecord({
        patientId: patient.id,
        doctorId: doctor.id,
        hospitalName: "Sanctum Sanctorum",
        recordType: "prescription",
        title: "Antibiotic Course - Amoxicillin",
        encryptedContent: encrypt(
          "Amoxicillin 500mg Capsules. Take one capsule every 8 hours for 7 days. Finish full course.",
          patient.publicKey!
        ),
        ipfsHash: generateIPFSHash(),
        blockchainHash: generateBlockchainHash(),
      });

      await storage.createAuditLog({
        actorId: doctor.id,
        targetId: record1.id,
        action: "RecordAdded",
        entityType: "record",
        metadata: JSON.stringify({
          patientId: patient.id,
          recordType: "lab_result",
        }),
        transactionHash: generateBlockchainHash(),
      });

      res.json({
        message: "Seed data created",
        patient,
        doctor,
        records: [record1, record2, record3],
      });
    } catch (error: any) {
      console.error("Seed error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}
