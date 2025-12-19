# SEHATI - Decentralized Health Identity System

## Overview

SEHATI is a decentralized application (dApp) for managing medical records with patient-controlled access. The system provides self-sovereign health identity where patients own and control their medical data through blockchain-verified transactions and encrypted storage.

The application features two distinct user roles:
- **Patients**: Manage their medical records, control access permissions, and generate QR codes for temporary access grants
- **Doctors**: Scan patient QR codes to access medical records and create new medical records for patients

Medical records are encrypted using AES-256-GCM encryption, with transaction hashes recorded on the Polygon Amoy Testnet for verification and audit purposes.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React with TypeScript using Vite as the build tool
- Wouter for client-side routing
- TanStack Query (React Query) for server state management
- Shadcn UI components built on Radix UI primitives
- Tailwind CSS with custom theming
- Framer Motion for animations

**Design Patterns:**
- Component-based architecture with reusable UI components in `/client/src/components`
- Context API for authentication state (`AuthProvider`)
- Custom hooks for shared logic (e.g., `useIsMobile`, `useToast`)
- Path aliases for clean imports (`@/`, `@shared/`)

### Backend Architecture

**Technology Stack:**
- Express.js server with TypeScript
- Drizzle ORM for database operations
- PostgreSQL database
- Session-based authentication with memory store

**Key Features:**
- RESTful API endpoints in `/server/routes.ts`
- AES-256-GCM encryption for medical record content
- Rate limiting and security middleware
- Wallet signature verification for authentication

### Data Storage

**Database Schema (PostgreSQL with Drizzle):**
- `users`: Stores patient and doctor profiles with wallet addresses
- `medicalRecords`: Encrypted medical data with IPFS and blockchain hashes
- `accessGrants`: Temporary access tokens for QR-based sharing
- `auditLogs`: Activity tracking for compliance

**Encryption Layer:**
- Patient data encrypted before storage using AES-256-GCM
- Encryption keys derived from wallet signatures
- Decryption only possible with proper access grants

### Authentication

- Wallet-based authentication using Ethereum wallet addresses
- Signature verification to prove wallet ownership
- Session management with express-session
- Role-based access control (patient vs doctor)

## External Dependencies

### Blockchain Integration
- **Polygon Amoy Testnet**: Production blockchain for transaction verification
- **Contract Address**: `0x6AF769646090EC43fa25Ee8f933B39fBfb3f67F9`
- **Ethers.js**: Wallet generation, signature verification, and blockchain interactions
- **Explorer**: https://amoy.polygonscan.com for transaction verification

### Storage Services
- **IPFS**: Simulated IPFS hashes for medical record storage (Pinata integration available)
- **PostgreSQL**: Primary database for all application data

### Frontend Libraries
- **@yudiel/react-qr-scanner**: QR code scanning for doctor access
- **react-qr-code**: QR code generation for patient sharing
- **WalletConnect/Web3Modal**: Wallet connection options (ethers-based)

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Express session encryption key
- `POLYGON_RPC_URL`: Polygon Amoy RPC endpoint (optional, has default)
- `RELAYER_PRIVATE_KEY`: Wallet for blockchain transactions
- `PINATA_API_KEY` / `PINATA_SECRET_KEY`: IPFS pinning (optional)