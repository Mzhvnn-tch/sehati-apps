# SEHATI: SYSTEM WORKFLOW AND OPERATIONAL ARCHITECTURE

## 1. INTRODUCTION AND OPERATING PRINCIPLES

SEHATI is designed to revolutionize health information management by returning data sovereignty to the patient while ensuring seamless interoperability for healthcare providers. This document outlines the operational workflows, interaction models, and emergency protocols that govern how SEHATI functions in real-world clinical and emergency environments.

The architecture is built on the principle of Zero-Knowledge Data Management, meaning the central infrastructure routes and stores data but cannot decipher it without cryptographic authorization from the data owner (the patient) or a legitimate emergency quorum.

### 1.1 Paradigm Shift: Traditional vs. SEHATI Operations

| Feature/Domain | Traditional Hospital System | SEHATI System Architecture |
| :--- | :--- | :--- |
| **Data Custody** | Siloed within individual hospital servers | Patient holds the master cryptographic key |
| **Interoperability** | Low; requires manual transfers or APIs | High; single global encrypted state |
| **Emergency Access** | Dependent on hospital working hours / IT | Governed by the 3-Layer Emergency Protocol |
| **Auditability** | Internal logs, vulnerable to tampering | Immutable cryptographic audit trails |
| **Privacy Breach Risk** | Database dump exposes all plaintext records | Database dump exposes undecipherable ciphertext |

---

## 2. SYSTEM COMPONENTS AND ACTOR ROLES

The SEHATI ecosystem functions through the interaction of distinct operational roles, each granted specific permissions and boundaries.

### 2.1 Actor Roles and Capabilities

| Actor Role | Registration Method | Primary Capabilities | Cryptographic Authority |
| :--- | :--- | :--- | :--- |
| **Patient** | Self-registration via Web3 Wallet | View own records, grant temporary access to doctors, manage profile. | Holds primary Private Key. Has absolute read/authorization capability. |
| **Doctor** | Verified by Institutional Administrator | Request patient records, append new diagnoses, create prescriptions. | Holds Professional Key. Can only read data explicitly authorized by the patient. |
| **Pharmacist** | Verified by Institutional Administrator | View prescriptions, mark prescriptions as fulfilled. | Holds Professional Key. Read-only access limited strictly to prescription data types. |
| **System Server** | Automated Infrastructure | Route encrypted payloads, manage session lifecycles, enforce Rate Limits. | Zero cryptographic authority. Cannot decrypt medical payloads. |
| **Health Authority** | Pre-configured Institutional Node | Act as an automated guarantor during extreme medical emergencies. | Holds one SSS shard. Cannot unilaterally decrypt data. |

---

## 3. DATA LIFECYCLE AND CRYPTOGRAPHIC FLOW

To understand how SEHATI works, one must trace the lifecycle of a single medical record from creation to retrieval.

### 3.1 Record Creation Phase (Write Operation)

1. **Initiation:** A verified doctor authenticates into the SEHATI terminal and creates a new diagnosis record for an authorized patient.
2. **Client-Side Processing:** The doctor's frontend application converts the diagnosis text into a structured JSON payload.
3. **Application-Level Encryption:** The payload is encrypted using the AES-256-GCM symmetric algorithm. The encryption key is dynamically derived from the patient's public key or a temporary access grant key.
4. **Transmission:** The encrypted ciphertext, alongside plaintext metadata (e.g., Hospital Name, Record Type, Timestamp), is transmitted to the SEHATI backend over TLS 1.3.
5. **Persistence:** The backend stores the ciphertext in the PostgreSQL database. At this stage, the backend only knows *that* a record was created, not *what* it contains.

### 3.2 Record Retrieval Phase (Read Operation)

1. **Request:** The patient logs into their dashboard and requests to view their medical history.
2. **Data Fetching:** The backend queries the database for records matching the `patientId` and returns the encrypted ciphertext array.
3. **Key Derivation:** The patient's client application prompts the Web3 wallet to sign a deterministic challenge. The signature is hashed via PBKDF2 to reconstruct the master decryption key locally in memory.
4. **Decryption:** The client application uses the derived key to perform AES-256-GCM decryption on each ciphertext payload.
5. **Rendering:** The plaintext data is rendered on the patient's screen. The master key is immediately purged from volatile memory upon session termination.

---

## 4. NORMAL OPERATIONS WORKFLOW

The following sections detail standard operational procedures within clinical settings.

### 4.1 Patient Registration and Initialization

- **Step 1:** The user connects their Web3 wallet (e.g., MetaMask, Trust Wallet) or utilizes a Web3Auth social login integration.
- **Step 2:** The system registers the unique wallet address.
- **Step 3:** The user establishes a secondary recovery mechanism (Biometrics or PIN).
- **Step 4:** The frontend generates an asymmetrical keypair. The public key is stored on the server; the private key is encrypted and stored locally or synced via a secure enclave.

### 4.2 Medical Consultation and Access Granting

When a patient visits a new clinic, the doctor requires access to their historical records.

| Phase | Action Description | Technical Mechanism |
| :--- | :--- | :--- |
| **Request** | Doctor requests access via patient's SEHATI ID. | Server generates a temporary challenge. |
| **Authorization** | Patient scans a QR code generated on the doctor's screen or approves via their mobile app. | Patient's app generates a temporary symmetric key, encrypts it with the doctor's public key, and transmits the Access Grant. |
| **Review** | Doctor views historical records on their terminal. | Doctor's terminal decrypts the temporary key, fetches encrypted records, and decrypts them locally. |
| **Append** | Doctor inputs new diagnosis and lab results. | New data is encrypted using the Access Grant key and appended to the patient's ledger. |
| **Revocation** | Consultation ends; patient leaves. | Access Grant expires automatically based on the Time-To-Live (TTL) configuration, terminating the doctor's access. |

### 4.3 Pharmacy Prescription Fulfillment

- **Step 1:** Patient visits a pharmacy and presents a digital prescription QR code.
- **Step 2:** The pharmacist scans the QR code, which contains a narrow-scoped, read-only decryption token.
- **Step 3:** The system strictly filters the query, returning only records with `recordType: "prescription"`.
- **Step 4:** Pharmacist dispenses the medication and clicks "Mark as Fulfilled".
- **Step 5:** The system updates the `isFulfilled` metadata flag to true and logs the action in the audit trail. The prescription ciphertext cannot be altered.

---

## 5. THE 3-LAYER EMERGENCY PROTOCOL (ZERO-FAILURE ARCHITECTURE)

The core challenge of Zero-Knowledge architecture is emergency access: if a patient is unconscious, they cannot provide their cryptographic signature. SEHATI resolves this via an escalating 3-Layer Emergency Protocol.

### 5.1 Layer 1: Standard Cryptographic Access

**Condition:** Patient is conscious and capable of interaction.
**Workflow:**
1. Patient arrives at the Emergency Department (ED).
2. Triage nurse requests medical history.
3. Patient authenticates via their mobile device using their Web3 wallet or PIN.
4. Access is granted instantly; standard decryption procedures apply.

### 5.2 Layer 2: Biometric Break-Glass Protocol

**Condition:** Patient is incapacitated (unconscious, severe pain), but physiological biometrics (face, fingerprints) remain intact. Device is lost or secured.
**Workflow:**
1. The attending ED physician activates the "Break-Glass" mode on the hospital's SEHATI terminal.
2. The physician scans the patient's fingerprint or face.
3. The system captures the biometric feature vectors.
4. Utilizing a Fuzzy Commitment scheme, the system maps the noisy biometric scan to the original cryptographic seed established during registration.
5. The master key is regenerated purely from mathematics and biology, completely bypassing the need for the physical mobile device.
6. Localized decryption occurs within the hospital terminal, revealing critical allergy and medication history.

### 5.3 Layer 3: Hybrid Shamir's Secret Sharing (Extreme Trauma Protocol)

**Condition:** Patient suffers severe physical trauma rendering biometric identification impossible (e.g., severe burns, facial trauma). Device is destroyed.
**Workflow:**
This layer utilizes Shamir's Secret Sharing (SSS) structured as a Hybrid 2-of-3 threshold mechanism to mathematically reconstruct the master key without patient involvement, while preventing unauthorized unilateral access.

| SSS Shard Allocation | Entity Type | Role in Emergency Scenario |
| :--- | :--- | :--- |
| **Shard 1 (Alpha)** | Central Health Authority Server | Automated guarantor. Evaluates the legitimacy of the physician's request based on SIP verification and GPS fencing. |
| **Shard 2 (Beta)** | Cryptographically Verified Physician | Provides professional authorization. The physician must sign the request using their institutional private key. |
| **Shard 3 (Gamma)** | Designated Next of Kin | Human guardian. Receives SMS/Push notification to approve the emergency override. |

**Execution Sequence:**
1. Physician invokes the "Extreme Emergency Override".
2. Physician inputs Shard 2 (Beta) by cryptographically signing the request.
3. The Central Health Authority evaluates the signature. If the physician is verified and located within a recognized trauma center, it automatically releases Shard 1 (Alpha) to prevent fatal delays.
4. Simultaneously, an alert is sent to the Next of Kin (holding Shard 3).
5. With Shard 1 and Shard 2 present, the mathematical threshold (2 out of 3) is immediately satisfied.
6. The system reconstructs the master key via polynomial interpolation.
7. Decryption is achieved, saving the patient's life despite total physical and device incapacitation.
8. An immutable, high-priority audit log is permanently inscribed on the blockchain network detailing this override event.

---

## 6. AUDIT AND COMPLIANCE OPERATIONS

Medical systems require rigorous oversight to comply with regulations such as HIPAA and local data protection laws (PDP). SEHATI enforces this through comprehensive, unalterable logging.

### 6.1 Event Logging Mechanism

Every state-altering action or sensitive data access triggers an asynchronous write operation to the `audit_logs` table.

| Trigger Event | Logged Information | Example Scenario |
| :--- | :--- | :--- |
| **Record Creation** | Actor ID, Patient ID, Timestamp, Record Type | Dr. A adds a lab result for Patient B. |
| **Access Grant** | Patient ID, Target Doctor ID, TTL, IP Address | Patient B allows Dr. C to view history for 24 hours. |
| **Data Retrieval** | Viewer ID, Target Patient ID, Endpoint, Status | Dr. C views the medical history of Patient B. |
| **Emergency Override** | Physician ID, Override Layer (1/2/3), Location | Dr. D triggers Layer 3 SSS override for Patient E. |

### 6.2 Blockchain Verification (Simulated/On-Chain)

To prevent internal database tampering (e.g., a rogue database administrator deleting an unauthorized access log), critical events calculate a SHA-256 hash of the audit payload and emit an event to a smart contract. This provides mathematical proof that the audit trail has not been retroactively altered.

---

## 7. SECURITY AND ACCESS GOVERNANCE

The SEHATI operational workflow is protected by defense-in-depth security measures at the network and application boundaries.

### 7.1 Session Management Workflow

- **Authentication State:** Managed via `express-session` operating entirely on the backend.
- **Token Delivery:** Session tokens are delivered via `Set-Cookie` headers.
- **Security Flags:**
  - `HttpOnly`: Prevents client-side scripts from reading the token, neutralizing Cross-Site Scripting (XSS) extraction.
  - `SameSite: strict`: Instructs the browser to never append the cookie to cross-origin requests, completely mitigating Cross-Site Request Forgery (CSRF).
  - `Secure`: Ensures the token is only transmitted over encrypted HTTPS channels.

### 7.2 Endpoint Governance Workflow

Access to specific API endpoints is governed by Role-Based Access Control (RBAC) middleware executed sequentially:
1. **Authentication Check:** Validates session existence.
2. **Role Verification:** Extracts user role from the session payload.
3. **Verification Gate:** For medical professionals, the system checks the `isVerified` flag. Unverified accounts cannot access patient data endpoints.
4. **Execution:** The business logic controller is invoked.

### 7.3 Threat Mitigation Execution

If the system detects anomalous operational behavior (e.g., brute force attempts on an access grant token):
- The **Rate Limiter** increments the strike count for the originating IP.
- Upon exceeding the threshold, the **IP Blocker** silently drops the connection, returning generic `429 Too Many Requests` responses to exhaust attacker resources without revealing system internals.
- Input vectors are automatically sanitized to strip `<script>` and `onEvent` handlers before data routing.

---
*END OF OPERATIONAL ARCHITECTURE DOCUMENT*
