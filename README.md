# SEHATI - Self-Sovereign Health Records

> **Show HN: Exploring patient-owned medical records using cryptographic proofs (Indonesia-focused prototype)**

---

## The Story

Last month, my friend's grandmother was rushed to a Jakarta ER after collapsing. The doctors needed to know:
- Her blood type
- Current medications  
- Drug allergies
- Pre-existing conditions

**They had NONE of this.** Her records were locked in 3 different hospitals across the city. Paper charts. Incompatible systems. No way to access.

The doctors had to guess. They ran duplicate tests ($800 wasted). Treatment delayed 45 minutes. She survived, but **millions of Indonesians aren't this lucky.**

**This shouldn't happen in 2026.**

---

## The Problem (Why Now?)

Indonesia has **275 million people**, **9,000+ hospitals**, and **ZERO interoperability**.

**What this means:**
- 🔴 **$2.1 billion/year** wasted on duplicate medical tests
- 🔴 **30% of medical errors** caused by incomplete patient history  
- 🔴 **67% of hospitals** experienced data breaches in 2023
- 🔴 Your medical record is worth **$250-$1,000** on the black market (vs $5 for a credit card)

**The kicker:** You don't own your medical data. The hospital does. You can't access it without permission, can't transfer it easily, and can't verify if it's been tampered with.

---

## Why Existing Solutions Fail

| Solution | Problem |
|----------|---------|
| **EHR Systems** (Epic, Cerner) | Proprietary, $15M-$100M cost, zero interoperability |
| **Cloud Health** (Google/Apple) | Corporate ownership, shut down anytime (Google Health 2020), manual entry |
| **Gov Systems** | Centralized honeypot, bureaucratic, not portable internationally |

**They all miss the point:** Patient should OWN the data, not hospitals/companies/governments.

---

## Our Approach (Prototype)

This project explores whether **self-sovereign identity concepts** can work for healthcare without exposing sensitive data on-chain.

**Key Assumptions We're Testing:**
- Hospitals will NOT run blockchain nodes
- Doctors will NOT manage private keys directly
- Patients will NOT tolerate typical crypto UX

**Design Decisions:**
- Blockchain used **strictly for verification & audit**, not data storage
- All medical data stays **encrypted off-chain** (PostgreSQL)
- Only cryptographic hashes go on-chain (immutable proof)
- QR codes as abstraction layer (hides crypto complexity)

**How it currently works:**
```
1. Patient authenticates with MetaMask (wallet = identity)
2. Doctor creates record → encrypted with patient's public key (AES-256)
3. Content hash submitted to Lisk L2 (permanent proof, ~$0.001 cost)
4. Patient shares QR code → doctor scans → temporary access granted
5. Patient revokes access → blockchain update (instant)
```

**What This Prototype Does NOT Solve:**
- ❌ Doctor credential verification (currently trust-based)
- ❌ Key recovery if patient loses private key (social recovery not implemented)
- ❌ Regulatory compliance (Indonesian health data law unclear)
- ❌ Scaling (1 TX per record = expensive at scale)
- ❌ Interoperability with existing hospital systems

---

## Current Status

**Early prototype built to test assumptions:**
- ✅ Working demo on Lisk Sepolia testnet
- ✅ Patient & doctor portals with wallet auth
- ✅ AES-256-GCM encryption for medical data
- ✅ QR code access tokens (time-limited, revocable)
- ✅ Blockchain verification (hash-based, not data storage)
- ✅ Audit logging
- ✅ Health analytics dashboard

**Tech:** React 19, TypeScript, PostgreSQL, Solidity, Lisk L2

**Try it:** `git clone` → `npm install` → `npm run dev` → Open MetaMask

**Known Limitations:**
- Only tested with <10 users
- No HIPAA/GDPR legal review
- Key recovery not implemented
- Doctor verification is manual
- Mainnet deployment requires audit

---

## What We're Looking For

**Not looking for:**
- ❌ Investment (too early, pre-product)
- ❌ Users (still testing security assumptions)

**Actually need:**
1. **Feedback:** Privacy/security holes we missed? Over-engineered?
2. **Healthcare Reality Check:** Are doctors too busy for even QR codes?
3. **Regulatory Guidance:** Indonesian health data law experts
4. **Crypto Skeptics:** Tell us why this won't work
5. **Pilot Partners:** One small clinic willing to test (3 months, free)

---

## The Vision (Open Questions)

**If this prototype proves viable:**
- Could become Indonesia's decentralized health identity layer
- Eventually work across borders (medical tourism use case)
- Enable patient-controlled research data sharing

**Sustainability model still open:**
- Grant funding for early development
- Potential B2B SaaS for hospitals (privacy-as-a-service)
- Or stay non-profit infrastructure (like IPFS)

**We genuinely don't know which path makes sense yet.**

---

## Questions We're Wrestling With

1. **Regulation:** Indonesian health data law is vague. Go permissionless or wait for clarity?
2. **Adoption:** Doctors are busy. How do we make this 10x better than their current flow?
3. **Key Recovery:** If patient loses private key, they lose ALL records. Social recovery? Backup to trusted friends?
4. **Proof of Authenticity:** How do we verify doctor credentials on-chain without doxxing them?
5. **Scaling:** One TX per record is expensive. Batch proofs? Roll-up design?

**If you have thoughts on any of these, I'd love to hear them.**

---

## 🧪 Demo & Testing

This project uses a **shared demo admin wallet** on Lisk Sepolia testnet to allow full end-to-end testing of the doctor approval workflow.

👉 **[Get Demo Admin Credentials in TECHNICAL.md](./TECHNICAL.md#demo-admin-wallet-credentials)**

---

## Technical Deep Dive

Want to see the architecture, threat model, encryption details, and implementation?

👉 **[Read the full technical documentation](./TECHNICAL.md)** (15 min read)

**Quick links:**
- 📊 [System Architecture Diagram](./TECHNICAL.md#architecture)
- 🔐 [Security & Encryption Details](./TECHNICAL.md#security--privacy)
- 🏥 [Real-World Use Cases](./TECHNICAL.md#use-cases--user-stories)
- 🛣️ [Development Roadmap](./ROADMAP.md)
- 📖 [API Documentation](./TECHNICAL.md#quick-start)

---

## Get Involved

**Try it:**
```bash
git clone https://github.com/yourusername/sehati
cd sehati && npm install && npm run dev
```

**Talk to us:**
- 📧 Email: sehatihealth.app@gmail.com
- 🐦 Twitter: [@sehati_id](https://twitter.com/sehati_id)  
- 💬 Telegram: [t.me/sehati_community](https://t.me/sehati_community)

**Contribute:**
- Healthcare domain expert? Help us navigate regulation
- Blockchain dev? Review our smart contracts
- Designer? Make the UX even better
- Investor in healthtech? Let's chat (but >6 months out)

---

## Why You Should Care

**If you're in healthcare:** This could save your patients' lives and save your hospital millions.

**If you're in crypto:** This is an attempt at real-world blockchain utility, but healthcare is hard and we might be wrong about the approach.

**If you're in Indonesia:** Our families deserve ownership of their medical data. This is a step toward that.

**If you're on HN:** This combines hard technical problems (encryption, blockchain, healthcare) with massive real-world impact. That's rare.

---

<p align="center">
  <strong>We're building the future of healthcare, one block at a time.</strong><br/>
  <em>Made in Indonesia 🇮🇩 for the world 🌍</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Stage-Prototype-orange?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Looking_For-Feedback-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Open_to-Collaboration-green?style=for-the-badge" />
</p>
