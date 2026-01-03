# SEHATI - Decentralized Health Identity System

<p align="center">
  <img src="client/public/logo.png" alt="SEHATI Logo" width="200" />
</p>

<p align="center">
  <strong>Self-Sovereign Health Identity on Blockchain</strong>
</p>

<p align="center">
  <a href="#about">About</a> |
  <a href="#features">Features</a> |
  <a href="#tech-stack">Tech Stack</a> |
  <a href="#quick-start">Quick Start</a> |
  <a href="#how-it-works">How It Works</a> |
  <a href="#api-reference">API Reference</a> |
  <a href="#smart-contract">Smart Contract</a>
</p>

---

## About

SEHATI (Sistem Elektronik Kesehatan Aman dan Terpercaya Indonesia) adalah aplikasi terdesentralisasi (dApp) untuk manajemen rekam medis dengan kontrol akses yang dimiliki sepenuhnya oleh pasien.

**Problem yang dipecahkan:**
- Rekam medis tersebar di berbagai rumah sakit tanpa integrasi
- Pasien tidak memiliki kontrol atas data kesehatan mereka sendiri
- Keamanan data kesehatan yang rentan
- Sulit berbagi rekam medis dengan dokter baru

**Solusi SEHATI:**
- Self-sovereign identity: Pasien memiliki dan mengontrol data medis mereka
- Enkripsi AES-256-GCM untuk keamanan maksimal
- Blockchain integration untuk immutability dan verifikasi
- QR Code sharing untuk akses sementara yang aman

---

## Features

### Untuk Pasien
| Feature | Deskripsi |
|---------|-----------|
| Wallet Authentication | Login menggunakan crypto wallet (MetaMask, dll) |
| Medical Records | Lihat semua rekam medis dalam satu dashboard |
| QR Code Sharing | Generate QR code untuk memberikan akses sementara ke dokter |
| Access Control | Atur durasi akses dan revoke kapan saja |
| Audit Log | Pantau siapa saja yang mengakses data Anda |
| Health Profile | Kelola informasi kesehatan dasar (golongan darah, alergi, dll) |

### Untuk Dokter
| Feature | Deskripsi |
|---------|-----------|
| QR Scanner | Scan QR code pasien untuk akses rekam medis |
| Create Records | Tambahkan rekam medis baru (diagnosis, resep, hasil lab) |
| Patient View | Lihat riwayat kesehatan pasien dengan izin |
| Blockchain Verification | Verifikasi keaslian rekam medis via blockchain |

---

## Tech Stack

### Frontend
```
React 19          - UI Framework
TypeScript        - Type Safety
Vite              - Build Tool
Tailwind CSS v4   - Styling
Shadcn UI         - Component Library
Radix UI          - Accessible Primitives
Framer Motion     - Animations
TanStack Query    - Server State Management
Wouter            - Client Routing
```

### Backend
```
Node.js           - Runtime
Express.js        - Web Framework
TypeScript        - Type Safety
Drizzle ORM       - Database ORM
PostgreSQL        - Database
```

### Blockchain & Security
```
Solidity          - Smart Contracts
Hardhat           - Development Environment
Lisk sepolia      - Testnet Deployment
ethers.js         - Web3 Library
AES-256-GCM       - Encryption
PBKDF2            - Key Derivation
```

---

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL database
- (Optional) Lisk sepolia testnet wallet with ETHEREUM for real blockchain transactions

### 1. Clone & Install

```bash
# Clone the repository
git clone https://github.com/sehati/sehati.git
cd sehati

# Install dependencies
npm install
```

### 2. Environment Setup

Salin file `.env.example` ke `.env` dan sesuaikan nilainya:

```bash
cp .env.example .env
```

Contoh konfigurasi `.env`:

```env
# Database (Required)
DATABASE_URL=postgresql://user:password@host:port/database

# Blockchain (Optional - for real transactions)
DEPLOYER_PRIVATE_KEY=your_lisk_wallet_private_key
CONTRACT_ADDRESS=0x6AF7........

# Session (Auto-generated if not set)
SESSION_SECRET=your_random_session_secret
```

> **Note:** Jika `DEPLOYER_PRIVATE_KEY` dan `CONTRACT_ADDRESS` tidak diset, aplikasi akan berjalan dalam mode simulasi.

### 3. Database Setup

```bash
# Push schema ke database
npm run db:push
```

### 4. Run Development Server

```bash
# Start development server (port 5000)
npm run dev
```

Buka browser dan akses: `http://localhost:5000`

### 5. (Optional) Seed Demo Data

```bash
# Via API
curl -X POST http://localhost:5000/api/seed
```

---

## How It Works

### Authentication Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Wallet    │────▶│  Generate   │────▶│   Sign      │
│   Connect   │     │   Nonce     │     │  Message    │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                                               ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Access    │◀────│  Create/    │◀────│   Verify    │
│   Granted   │     │  Get User   │     │  Signature  │
└─────────────┘     └─────────────┘     └─────────────┘
```

1. User connects their crypto wallet
2. Server generates a unique nonce
3. User signs the nonce with their private key
4. Server verifies the signature
5. User is authenticated and session is created

### Medical Record Creation

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Doctor    │────▶│  Encrypt    │────▶│   Store     │
│   Input     │     │  AES-256    │     │   in DB     │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                                               ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Verified   │◀────│  Submit to  │◀────│  Generate   │
│  Record     │     │  Blockchain │     │   Hashes    │
└─────────────┘     └─────────────┘     └─────────────┘
```

1. Doctor inputs medical record data
2. Data encrypted using patient's public key (AES-256-GCM)
3. Encrypted data stored in PostgreSQL
4. Content hash submitted to Lisk Sepolia blockchain
5. Transaction hash stored for verification

### QR Code Access Sharing

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Patient   │────▶│  Generate   │────▶│   Create    │
│   Request   │     │   Token     │     │  QR Code    │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                                               ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Access    │◀────│  Validate   │◀────│   Doctor    │
│   Granted   │     │   Token     │     │  Scans QR   │
└─────────────┘     └─────────────┘     └─────────────┘
```

1. Patient generates access token with expiration time
2. QR code created containing the token
3. Doctor scans QR code
4. Server validates token and checks expiration
5. Doctor gets temporary access to patient's records

---

## Project Structure

```
sehati/
├── client/                    # Frontend React Application
│   ├── public/                # Static assets
│   ├── src/
│   │   ├── components/        # React Components
│   │   ├── contexts/          # React Contexts
│   │   ├── hooks/             # Custom Hooks
│   │   ├── lib/               # Utilities
│   │   ├── pages/             # Page Components
│   │   ├── App.tsx            # Root component
│   │   └── main.tsx           # Entry point
│   └── index.html
│
├── server/                    # Backend Express Application
│   ├── middleware/            # Auth & validation
│   ├── services/              # Blockchain & IPFS services
│   ├── routes.ts              # API routes
│   └── storage.ts             # Data access layer
│
├── contracts/                 # Solidity Smart Contracts
│   └── SEHATIRegistry.sol     # Main registry contract
│
├── shared/                    # Shared Code
│   └── schema.ts              # Database schema (Drizzle)
│
├── scripts/                   # Deployment Scripts
│   └── deploy.cjs             # Hardhat deploy script
│
├── artifacts/                 # Compiled Contracts (Gitignored)
├── cache/                     # Build Cache (Gitignored)
│
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript config
└── vite.config.ts             # Vite config
```

---

## API Reference

### Authentication

#### Generate Nonce
```http
POST /api/auth/generate-nonce
Content-Type: application/json

{
  "walletAddress": "0x..."
}

Response:
{
  "nonce": "random-nonce-string",
  "message": "Sign this message to verify your wallet..."
}
```

#### Verify Signature
```http
POST /api/auth/verify-signature
Content-Type: application/json

{
  "walletAddress": "0x...",
  "message": "Sign this message...",
  "signature": "0x..."
}

Response:
{
  "verified": true,
  "user": { ... } | null,
  "exists": true | false
}
```

#### Register/Login
```http
POST /api/auth/wallet
Content-Type: application/json

{
  "walletAddress": "0x...",
  "name": "John Doe",
  "role": "patient" | "doctor",
  "gender": "male" | "female" | "other",
  "age": 30,
  "bloodType": "O+",           // Optional
  "allergies": ["Penicillin"], // Optional
  "hospital": "RS Harapan"     // For doctors only
}

Response:
{
  "user": { ... }
}
```

#### Generate Wallet (Demo)
```http
POST /api/wallet/generate

Response:
{
  "address": "0x...",
  "privateKey": "0x...",
  "mnemonic": "word1 word2...",
  "warning": "Save your keys securely!"
}
```

### Medical Records

#### Get Patient Records
```http
GET /api/records/patient/:patientId
Authorization: Session Cookie

Response:
{
  "records": [
    {
      "id": "uuid",
      "patientId": "uuid",
      "doctorId": "uuid",
      "hospitalName": "RS Harapan",
      "recordType": "diagnosis" | "prescription" | "lab_result",
      "title": "Check-up Results",
      "encryptedContent": "encrypted...",
      "ipfsHash": "Qm...",
      "blockchainHash": "0x...",
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ]
}
```

#### Create Medical Record (Doctor Only)
```http
POST /api/records
Content-Type: application/json
Authorization: Session Cookie

{
  "patientId": "uuid",
  "doctorId": "uuid",
  "hospitalName": "RS Harapan",
  "recordType": "diagnosis",
  "title": "Annual Check-up",
  "content": "Patient is healthy..."
}

Response:
{
  "record": { ... }
}
```

#### Decrypt Record
```http
POST /api/records/:recordId/decrypt
Content-Type: application/json
Authorization: Session Cookie

{
  "userId": "uuid"
}

Response:
{
  "id": "uuid",
  "decryptedContent": "Patient is healthy...",
  ...
}
```

### Access Control

#### Generate Access Token (Patient Only)
```http
POST /api/access/generate
Content-Type: application/json
Authorization: Session Cookie

{
  "patientId": "uuid",
  "durationMinutes": 60
}

Response:
{
  "grant": { ... },
  "qrData": "sehati://access?token=abc123..."
}
```

#### Validate Access Token (Doctor)
```http
POST /api/access/validate
Content-Type: application/json
Authorization: Session Cookie

{
  "token": "abc123...",
  "doctorId": "uuid"
}

Response:
{
  "patient": { ... },
  "records": [{ decryptedContent: "..." }],
  "grant": { ... }
}
```

#### Revoke Access
```http
POST /api/access/revoke/:grantId
Authorization: Session Cookie

Response:
{
  "success": true
}
```

### Blockchain

#### Check Status
```http
GET /api/blockchain/status

Response:
{
  "configured": true,
  "mode": "live" | "simulation",
  "chain": {
    "name": "Lisk Sepolia Testnet",
    "chainId": 4202
  },
  "relayer": {
    "address": "0x...",
    "balance": "0.5"
  },
  "currentBlock": 12345678,
  "contractAddress": "0x..."
}
```

#### Verify Transaction
```http
GET /api/blockchain/verify/:txHash

Response:
{
  "txHash": "0x...",
  "verified": true,
  "blockNumber": 12345678,
  "timestamp": 1699999999,
  "explorerUrl": "https://sepolia-blockscout.lisk.com/tx/0x..."
}
```

---

## Smart Contract

### Contract Info
- **Network:** Lisk Sepolia Testnet
- **Chain ID:** 4202
- **Explorer:** [Lisk Sepolia Blockscout](https://sepolia-blockscout.lisk.com)
- **Faucet:** [Lisk Sepolia Faucet](https://sepolia-faucet.lisk.com)

### Key Functions

```solidity
// Register as patient
function registerAsPatient() external;

// Register as doctor  
function registerAsDoctor() external;

// Create medical record (doctors only)
function createRecord(
    address _patient,
    string calldata _ipfsCID,
    bytes32 _contentHash,
    string calldata _recordType,
    bytes32 _accessToken
) external returns (bytes32);

// Create access grant (patients only)
function createAccessGrant(
    bytes32 _accessToken,
    uint256 _expiresAt
) external returns (bytes32);

// Verify access
function verifyAccess(
    address _patient,
    bytes32 _accessToken
) external view returns (bool);
```

### Deploy Your Own Contract

```bash
# Compile contracts
npx hardhat compile

# Deploy to Lisk Sepolia testnet
npx hardhat run scripts/deploy.cjs --network liskSepolia
```

---

## Security

### Encryption
- **Algorithm:** AES-256-GCM (Authenticated Encryption)
- **Key Derivation:** PBKDF2 with 100,000 iterations
- **Salt & IV:** Unique per encryption operation
- **Authentication Tag:** Prevents tampering

### Access Control
- Session-based authentication
- Role-based authorization (Patient/Doctor)
- Time-limited access tokens
- Revocable permissions

### Rate Limiting
- Wallet auth: 5 requests per minute
- Strict endpoints: 10 requests per 15 minutes
- General API: 100 requests per minute

---

## Development

### Available Scripts

```bash
# Development
npm run dev           # Start dev server (backend + frontend)
npm run dev:client    # Start frontend only

# Build
npm run build         # Build for production

# Database
npm run db:push       # Push schema changes

# Type Check
npm run check         # Run TypeScript checks

# Production
npm run start         # Start production server
```

### Testing

```bash
# Run tests
npm run test
```

### Adding New Features

1. **Database Schema:** Edit `shared/schema.ts`
2. **API Routes:** Edit `server/routes.ts`
3. **Frontend Pages:** Add to `client/src/pages/`
4. **Components:** Add to `client/src/components/`

---

## Deployment

### Docker (Coming Soon)

```bash
docker build -t sehati .
docker run -p 5000:5000 sehati
```

---

## Roadmap

- [x] Wallet-based authentication
- [x] Medical record encryption (AES-256-GCM)
- [x] QR code access sharing
- [x] Audit logging
- [x] Lisk sepolia testnet integration
- [ ] IPFS actual storage (currently simulated)
- [ ] MetaMask direct integration
- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] Export medical records to PDF

---

## Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Contact

- **Email:** support@sehati.id
- **Website:** https://sehati.id
- **GitHub Issues:** [Report Bug](https://github.com/sehati/sehati/issues)

---

<p align="center">
  Built with ❤️ for Indonesian Healthcare
</p>
