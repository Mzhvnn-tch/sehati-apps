# SEHATI - Decentralized Health Identity System

## Overview

SEHATI is a decentralized application (dApp) for managing medical records with patient-controlled access. The system provides self-sovereign health identity where patients own and control their medical data through wallet-based authentication. Medical records are encrypted using AES-256-GCM, with simulated blockchain and IPFS integration for data integrity and distributed storage.

## Recent Changes

- **December 19, 2025**: Switched blockchain from Polygon Amoy to Lisk Sepolia Testnet:
  - Updated hardhat config for Lisk Sepolia (Chain ID: 4202)
  - Updated blockchain service to use Lisk Sepolia RPC: https://sepolia.lisk.com
  - Ready for contract deployment on Lisk Sepolia
  - Use command: `npx hardhat run scripts/deploy.cjs --network liskSepolia`
  - Get test funds from: https://sepolia-faucet.lisk.com
  - View transactions on: https://sepolia-blockscout.lisk.com

- **December 18, 2025**: Enabled REAL blockchain integration with Polygon Amoy Testnet:
  - Deployed SEHATIRegistry smart contract to Amoy Testnet
  - Medical records now submit real transaction hashes to blockchain
  - Added `/api/blockchain/status` endpoint for checking blockchain configuration
  - Added `/api/blockchain/verify/:txHash` endpoint for verifying transactions on-chain

- **December 18, 2025**: Fixed JSON parsing error "Failed to execute 'json' on 'Response': Unexpected end of JSON input" by improving the API client error handling in `client/src/lib/api.ts`. Now properly handles:
  - 204 No Content responses
  - Empty response bodies
  - Non-JSON content types
  - Invalid JSON gracefully without throwing errors

The application features two distinct user roles:
- **Patients**: Manage their medical records, control access permissions, and generate QR codes for temporary access grants
- **Doctors**: Scan patient QR codes to access medical records and create new medical records for patients

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React with TypeScript using Vite as the build tool
- Wouter for client-side routing
- TanStack Query (React Query) for server state management
- Shadcn UI components built on Radix UI primitives
- Tailwind CSS v4 with custom theming
- Framer Motion for animations

**Design Patterns:**
- Component-based architecture with reusable UI components in `/client/src/components`
- Context API for authentication state (`AuthProvider`)
- Custom hooks for shared logic (e.g., `useIsMobile`, `useToast`)
- Path aliases for clean imports (`@/`, `@shared/`, `@assets/`)

**Key Features:**
- Wallet-based authentication (simulated, no actual blockchain integration)
- QR code generation and scanning for temporary access
- Real-time medical record encryption/decryption in the UI
- Responsive design with mobile-first approach

### Backend Architecture

**Technology Stack:**
- Node.js with Express.js
- TypeScript throughout
- Drizzle ORM for database operations
- PostgreSQL as the primary database

**API Design:**
- RESTful API endpoints under `/api`
- Session-based state management (wallet addresses stored in localStorage on client)
- JSON request/response format
- Encryption handled server-side before database storage

**Data Flow:**
1. User connects wallet → Creates/retrieves user record
2. Medical records created with encrypted content (AES-256-GCM)
3. Access grants generate time-limited tokens for QR sharing
4. All actions logged to audit trail for compliance

**Security Approach:**
- All medical data encrypted at rest using AES-256-GCM with salt, IV, and authentication tags
- PBKDF2 key derivation from passwords
- Each user has a unique public key for encryption operations
- Access tokens are cryptographically random (32 bytes)
- Audit logging for all data access and modifications

### Database Schema

**Core Tables:**

1. **users**: Stores patient and doctor identities
   - Wallet address as unique identifier
   - Role-based access (patient/doctor)
   - Patient health metadata (blood type, allergies, age)
   - Public key for encryption operations

2. **medical_records**: Encrypted medical data storage
   - Patient and doctor foreign keys
   - Record type categorization (lab_result, diagnosis, prescription)
   - Encrypted content (AES-256-GCM)
   - Simulated IPFS and blockchain hashes for decentralized architecture demonstration

3. **access_grants**: Temporary access control
   - Token-based access (for QR codes)
   - Time-limited permissions (expires_at timestamp)
   - Revocation support
   - Links patient to accessing doctor

4. **audit_logs**: Compliance and tracking
   - All user actions logged
   - Timestamped event trail
   - Action types: RecordAdded, AccessGranted, AccessRevoked, RecordViewed

**Database Technology:**
- PostgreSQL with UUID primary keys
- Drizzle ORM for type-safe queries
- Migration support via Drizzle Kit

### External Dependencies

**UI Framework & Components:**
- Radix UI primitives for accessible components (dialogs, dropdowns, tooltips, etc.)
- Shadcn UI component system (New York style variant)
- Tailwind CSS v4 with custom design tokens
- Lucide React for iconography

**Form & Validation:**
- React Hook Form with Zod resolvers
- Drizzle-Zod for schema validation
- Type-safe form handling throughout

**Development Tools:**
- Vite for fast development and optimized builds
- ESBuild for server bundling (production)
- TSX for TypeScript execution in development
- Replit-specific plugins (cartographer, dev banner, runtime error overlay)

**Third-Party Services:**
- IPFS: File hashes generated but not actually stored on IPFS
- Blockchain: **REAL** Lisk Sepolia Testnet integration (not simulated)
- Web3 Wallets: Wallet addresses generated randomly, no actual MetaMask/Web3Auth integration

**Database:**
- PostgreSQL via `pg` driver
- Connection pooling for performance
- Drizzle ORM for query building and migrations

**Security & Crypto:**
- Node.js native `crypto` module for encryption
- AES-256-GCM encryption algorithm
- PBKDF2 for key derivation (100,000 iterations)

**Date & Time:**
- `date-fns` for date formatting and manipulation

**QR Code:**
- `react-qr-code` for generating QR codes in the UI

**Notes:**
- The application simulates blockchain and IPFS features without actual implementation
- Wallet authentication is mocked - actual Web3 wallet integration would be needed for production
- The encryption is real and functional, but private keys are managed server-side rather than in a true decentralized manner