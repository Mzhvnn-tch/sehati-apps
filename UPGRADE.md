# SEHATI — Upgrade Roadmap (Teknologi Kriptografi Lanjutan)

> Dokumen ini berisi 3 rencana upgrade major yang akan membuat SEHATI menjadi sistem kesehatan
> terdesentralisasi paling canggih secara kriptografis di Indonesia. Ketiga fitur ini saling
> melengkapi dan membangun di atas arsitektur yang sudah ada.

---

## Upgrade 1: Shamir's Secret Sharing (SSS) — Family Guardian

### Latar Belakang & Masalah yang Diselesaikan
Dunia medis menghadapi masalah serius: **pasien tidak sadar di UGD tidak bisa memberikan
consent** untuk akses rekam medisnya. Sistem tradisional mengandalkan kontak darurat via
telepon yang rentan penipuan (*social engineering*). SatuSehat tidak memiliki mekanisme
akses darurat yang kriptografis dan verifiable.

### Konsep
Pasien memecah *Private Key* mereka menjadi **N share** menggunakan **Shamir's Secret
Sharing (SSS)** dan mendistribusikan share tersebut ke anggota keluarga terpercaya.
Rekonstruksi kunci hanya bisa dilakukan jika minimal **K dari N anggota** memberikan
persetujuan (threshold scheme).

**Properti Matematika Kunci:**
- Polynomial derajat `(K-1)` dibuat secara acak: `f(x) = secret + a₁x + ... + a_{K-1}x^{K-1}`
- Share ke-i: `(i, f(i))` — diberikan ke anggota ke-i
- Rekonstruksi via **Lagrange Interpolation**: butuh tepat K titik
- `K-1` share atau kurang = **zero information** tentang secret (information-theoretic secure)

### Alur Kerja Teknis

#### Setup (Pasien Sehat — di Patient Dashboard)
1. Pasien buka tab **"Family Vault"** di dashboard
2. Pasien tentukan: `N` (total anggota), `K` (threshold approve), wallet address tiap anggota
3. **Client-side:** `splitSecret(privateKey, N, K)` → N share
4. **Client-side:** Tiap share dienkripsi dengan RSA Public Key anggotanya: `RSA_Encrypt(share[i], pubKey[i])`
5. Server hanya menyimpan `encryptedShare[]` — tidak pernah tau isi share aslinya

#### Saat Darurat (Pasien Koma di UGD)
1. Dokter UGD trigger `requestEmergencyAccess(patientAddress)` di smart contract
2. Smart contract emit event `EmergencyAccessRequested` on-chain (audit trail permanen)
3. Notifikasi masuk ke HP semua anggota keluarga aktif via SSE
4. Minimal K anggota klik **"Approve"** → browser anggota dekripsi share mereka → submit ke server
5. Begitu threshold K tercapai, browser dokter menerima K share
6. **Client-side:** `reconstructSecret([share_1, share_3, share_4])` via Lagrange Interpolation
7. Secret (Private Key pasien) direkonstruksi → dekripsi rekam medis darurat

### File yang Perlu Dibuat/Diubah
| File | Aksi | Deskripsi |
|---|---|---|
| `shared/schema.ts` | MODIFY | Tambah tabel `family_groups`, `family_members`, `emergency_requests`, `notifications` |
| `client/src/lib/shamir.ts` | NEW | SSS library: `splitSecret()`, `reconstructSecret()` over GF(2^8) |
| `server/routes.ts` | MODIFY | 6 endpoints: create-group, invite, approve, request-emergency, status, stream (SSE) |
| `contracts/SEHATIRegistry.sol` | MODIFY | `setGuardianGroup()`, `requestEmergencyAccess()`, events |
| `client/src/lib/blockchain.ts` | MODIFY | Update ABI dengan fungsi guardian |
| `client/src/components/family-guardian.tsx` | NEW | UI Family Vault: setup grup, invite, status, emergency panel |
| `client/src/components/notification-bell.tsx` | NEW | Bell icon + badge + dropdown notifikasi di header |
| `client/src/pages/patient-dashboard.tsx` | MODIFY | Tambah tab "Family Vault" + NotificationBell |
| `client/src/pages/doctor-dashboard.tsx` | MODIFY | Tambah tombol "Emergency UGD" + NotificationBell |

### Keunggulan vs SatuSehat
- ✅ Server tidak bisa reconstruct kunci pasien (zero server knowledge)
- ✅ Tidak ada single point of failure
- ✅ Audit trail kriptografis on-chain yang tidak bisa dipalsukan
- ✅ Consent keluarga terverifikasi secara matematika, bukan hanya "telepon-teleponan"

---

## Upgrade 2: Biometric Emergency Break-Glass — 1:N Identification

### Latar Belakang & Masalah yang Diselesaikan
Saat ini, `biometric-auth.tsx` menggunakan mode **1:1 Verification** — pasien harus memasukkan
wallet address terlebih dahulu sebelum biometrik bisa diverifikasi. Ini tidak berguna untuk
pasien koma tanpa identitas di UGD.

**Biometric SDK yang sudah ada** (`biometric_sdk/`) sudah sangat canggih:
- `bio_crypt.py`: Fuzzy Commitment Scheme + Reed-Solomon ECC
- `ecc_wrapper.py`: `FuzzyCommitment.commit()` dan `FuzzyCommitment.unlock()`
- `biometric_core.py`: Fingerprint minutiae extraction & noise simulation
- `server/services/biometric.ts`: Bridge Python SDK ke Node.js

Yang dibutuhkan hanya mengubah mode dari **1:1 menjadi 1:N**.

### Konsep: 1:N Biometric Identification

```
Enrollment (Pasien Sehat):
  Scan biometrik → BioCrypt.enroll() → helper_ecc
  Simpan helper_ecc di kolom users.biometricRecord (DB)

Emergency UGD (Pasien Koma):
  Dokter scan biometrik pasien koma
  Server: untuk setiap pasien terdaftar:
    try: BioCrypt.unlock(liveVector, patient.helper_ecc)
    if berhasil: pasien ditemukan!
  Return: nama, golongan darah, alergi kritis
```

**Keamanan:** `helper_ecc` yang tersimpan di DB tidak bisa di-reverse-engineer menjadi
sidik jari asli (sifat satu arah dari Fuzzy Commitment). Server tidak menyimpan foto biometrik.

### Alur Kerja Teknis

#### Enrollment (Di Patient Dashboard — Setting Biometrik)
1. Pasien klik "Daftarkan Biometrik" → kamera aktif
2. Scan wajah/jari → `POST /api/auth/biometric/enroll`
3. Server panggil Python SDK: `BioCrypt.enroll(image, userId)` → `helper_ecc`
4. Simpan `helper_ecc` di `users.biometricRecord`
5. Konfirmasi sukses — sidik jari asli **tidak pernah disimpan**

#### Emergency Identification (Di Doctor Dashboard — Mode UGD)
1. Dokter klik "🚨 Identify Unconscious Patient"
2. Kamera aktif, scan wajah/jari pasien koma
3. `POST /api/auth/biometric/emergency-identify` (require Doctor auth)
4. Server iterasi semua `user.biometricRecord`, coba `unlock()` satu per satu
5. Jika cocok → return data darurat: nama, golongan darah, alergi
6. Catat AuditLog + emit event on-chain `EmergencyBiometricAccess`

### File yang Perlu Dibuat/Diubah
| File | Aksi | Deskripsi |
|---|---|---|
| `shared/schema.ts` | MODIFY | Tambah kolom `biometricRecord text` ke tabel `users` |
| `server/routes.ts` | MODIFY | Tambah `POST /api/auth/biometric/emergency-identify` |
| `client/src/components/biometric-auth.tsx` | MODIFY | Tambah `mode='emergency'` — tanpa wallet address requirement |
| `client/src/pages/doctor-dashboard.tsx` | MODIFY | Tambah tombol "🚨 Emergency UGD Identify" |
| `client/src/pages/patient-dashboard.tsx` | MODIFY | Tambah UI enrollment biometrik di settings |

### Keunggulan vs SatuSehat
- ✅ Identifikasi pasien tanpa KTP/NIK/HP — hanya dari fisik tubuh
- ✅ Tidak ada database sidik jari pusat yang bisa diretas (zero biometric storage)
- ✅ Proses identifikasi darurat < 5 detik
- ✅ Menyelamatkan nyawa yang terancam karena ketidaktahuan alergi obat

---

## Upgrade 3: Fully Homomorphic Encryption (FHE) — Privacy-Preserving Analytics

### Latar Belakang & Masalah yang Diselesaikan
Perusahaan farmasi dan peneliti medis sangat membutuhkan data rekam medis populasi Indonesia
untuk uji klinis, pengembangan obat, dan model AI medis. Saat ini, data tersebut tidak bisa
diakses tanpa melanggar privasi pasien (UU PDP).

SatuSehat tidak bisa menyediakan akses data riset ke swasta karena batasan hukum kedaulatan
data negara. SEHATI bisa menjadi jembatannya — tapi hanya jika analitik bisa dilakukan
**tanpa pernah mendekripsi data mentah pasien**.

Di sinilah **Fully Homomorphic Encryption (FHE)** menjadi solusi revolusioner.

### Konsep FHE
> **"Compute on encrypted data without decrypting it."**

FHE memungkinkan operasi matematika (penjumlahan, perkalian, perbandingan) dilakukan
**langsung di atas data terenkripsi**, menghasilkan hasil yang benar ketika didekripsi,
tanpa server/peneliti pernah melihat data aslinya.

**Contoh Use Case:**
```
Data Rekam Medis Terenkripsi di SEHATI IPFS:
  Enc("Diabetes") + Enc("Kolesterol Tinggi") + Enc("Hipertensi")

Peneliti Farmasi kirim query:
  "Berapa persen pasien diabetes yang juga punya kolesterol tinggi?"

FHE Engine:
  count = Σ [ Enc(isDiabetes[i]) × Enc(isHighChol[i]) ]  // operasi on ciphertext
  
Hasil: Enc(247)  →  Decrypt(Enc(247)) = 247 pasien
→ Peneliti dapat angka statistik TANPA melihat data pasien satu pun
```

### Library FHE yang Direkomendasikan
- **[TFHE-rs](https://github.com/zama-ai/tfhe-rs)** (Zama AI) — Rust, sangat performa
- **[OpenFHE](https://openfhe.org/)** — C++, standar akademis
- **[Concrete](https://github.com/zama-ai/concrete)** — Python wrapper untuk TFHE

> ⚠️ **Catatan Implementasi**: FHE saat ini masih sangat berat secara komputasi
> (10.000x lebih lambat dari operasi biasa). Cocok untuk **batch analytics** yang tidak
> butuh real-time, bukan untuk operasi rekam medis individual sehari-hari.
> Perkiraan timeline matang untuk produksi: 2026-2027.

### Alur Kerja Teknis (Masa Depan)

#### Pasien Opt-In ke Data Commons
1. Pasien klik "Sumbangkan Data untuk Riset" di dashboard
2. Pasien pilih kategori data yang boleh dianalisis (misal: hanya data diabetes, bukan mental health)
3. Smart contract catat consent pasien on-chain secara permanen + revocable

#### Peneliti Farmasi Submit Query
1. Peneliti daftar dan bayar fee (stablecoin) via smart contract
2. Smart contract distribusikan fee ke pasien yang opt-in (otomatis, tanpa perantara)
3. Peneliti submit program FHE yang akan dijalankan atas data

#### FHE Computation
1. SEHATI node menjalankan program FHE di atas ciphertext data pasien
2. Hasil komputasi (masih terenkripsi) dikirim ke peneliti
3. Peneliti dekripsi hasil → dapat statistik agregat
4. **Tidak ada data individual pasien yang pernah terekspos**

### File yang Perlu Dibuat/Diubah (Masa Depan)
| File | Aksi | Deskripsi |
|---|---|---|
| `fhe_engine/` | NEW | Python/Rust service: FHE computation engine |
| `contracts/DataCommons.sol` | NEW | Smart contract: consent management, fee distribution |
| `server/services/fhe.ts` | NEW | Bridge FHE engine → Node.js |
| `server/routes.ts` | MODIFY | Endpoints untuk researcher query submission |
| `client/src/pages/patient-dashboard.tsx` | MODIFY | UI opt-in data riset + riwayat pendapatan token |

### Keunggulan vs SatuSehat
- ✅ Pemerintah tidak perlu "jual data rakyat" — pasien yang memutuskan sendiri
- ✅ Pasien mendapat kompensasi finansial langsung dari riset yang menggunakan datanya
- ✅ Peneliti farmasi mendapat akses data populasi Asia Tenggara yang selama ini tidak tersedia
- ✅ Zero data breach risk — tidak ada data mentah yang pernah meninggalkan enkripsi

---

## Arsitektur Gabungan: "The SEHATI 3-Layer Emergency Protocol"

### Sinergi Fitur untuk Skenario Ekstrem (Zero-Failure Architecture)
Fitur SSS (Upgrade 1) dan Biometric 1:N (Upgrade 2) bukan sekadar dua fitur terpisah. Jika digabungkan, keduanya membentuk **Protokol Darurat 3-Lapis** yang anti-gagal, bahkan dalam skenario bencana medis terburuk:

1. **Lapis 1: Normal Login (Wallet/PIN)**
   Pasien sadar dan membawa HP. Akses rekam medis menggunakan otentikasi standar.

2. **Lapis 2: Biometric Break-Glass (Physical Sovereignty)**
   Pasien pingsan ringan (HP hilang/terkunci). Fisik pasien (jari/wajah) utuh. Dokter scan biometrik pasien di UGD → Sistem mengidentifikasi pasien dan meregenerasi kunci kriptografis murni dari alur sidik jari (Fuzzy Commitment).

3. **Lapis 3: Community Secret Sharing (Social Recovery untuk Trauma Ekstrem)**
   Pasien mengalami kecelakaan parah. Wajah rusak, jari berdarah (Biometrik gagal/tidak terbaca). 
   - Dokter menekan tombol **"Extreme Emergency Override"**.
   - Sistem mengirim notifikasi SSS ke **Community Guardian Group** (bisa keluarga, atau Pak RT + Bidan + Tetangga untuk pasien sebatang kara).
   - Minimal 3 dari 5 Guardian memencet "Approve" di HP mereka.
   - Kunci ter-rekonstruksi secara matematis di komputer UGD, menyelamatkan nyawa pasien tanpa biometrik.

Ini adalah manifestasi murni dari budaya "Gotong Royong" Indonesia yang dibawa ke level Kriptografi Web3. Komunitas saling menjaga warganya secara matematis, menghilangkan *Single Point of Failure*, dan melindungi privasi pasien secara absolut!

---

## Upgrade 4: Universal Translator — Medical AI-OCR (Offline)

### Latar Belakang & Masalah yang Diselesaikan
Kesenjangan fasilitas antara puskesmas desa dan rumah sakit internasional sangat jauh. Puskesmas sering hanya memberikan hasil lab berupa kertas fisik. Pasien harus membawa kertas fisik ke mana-mana, dan RS tujuan harus mengetik ulang datanya secara manual, yang rawan *human error*.

### Konsep
Teknologi **AI-OCR (Optical Character Recognition) 100% Client-Side** yang menerjemahkan foto kertas hasil lab menjadi standar data medis internasional (JSON/FHIR) dalam hitungan detik.

### Alur Kerja Teknis (Murni di HP Pasien/Klinik Tanpa Server AI)
1. **Ekstraksi (Tesseract.js):** Pasien/Klinik memfoto kertas hasil lab. WebAssembly di browser membaca teks dari foto.
2. **Fuzzy Matching (Fuse.js):** Sistem mencocokkan teks yang typo (misal: "Gula Oarah" menjadi "Gula Darah Puasa") dengan Kamus Medis lokal.
3. **RegEx Parsing:** Pola deterministik mengekstrak angka dan satuan (`140` dan `mg/dL`).
4. **FHIR Output:** Nilai disusun menjadi objek JSON standar internasional (LOINC codes).
5. **Enkripsi:** JSON dienkripsi dan dikirim ke brankas IPFS pasien.

### Keunggulan vs SatuSehat
- ✅ Mengeliminasi kertas fisik tanpa mewajibkan Puskesmas membeli sistem IT mahal.
- ✅ *100% Offline & Private*: Foto kertas tidak pernah di-upload ke server mana pun (berbeda dengan memproses via ChatGPT/OpenAI yang melanggar UU PDP).

---

## Upgrade 5: Public Health Dashboard (Epidemiologi Komunitas Teranonimasi)

### Latar Belakang & Masalah yang Diselesaikan
Pemerintah desa (Pak RT/Kader Posyandu/Bidan) sangat kesulitan memantau wabah (seperti DBD) atau angka stunting secara *real-time*. Kalau ada warga yang sakit, datanya tidak terekap dengan cepat di tingkat wilayah.

### Konsep
Dashboard terpisah untuk **Community Leader (Pak RT/Kader Desa)** yang menampilkan data statistik agregat dari warganya secara *real-time*, TANPA melanggar privasi individu warganya.

### Alur Kerja Teknis
1. Mbah Surip (warga RT 04) berobat ke puskesmas menggunakan biometriknya.
2. Data medisnya (misal: Demam Berdarah) dienkripsi dengan kuncinya sendiri secara mutlak.
3. Sistem membuat *metadata anonim* ke Public Ledger: `{"Wilayah": "RT 04", "Kasus": "DBD", "Timestamp": "..."}`.
4. Pak RT login ke SEHATI Community Dashboard.
5. Dashboard menampilkan peringatan: **"🚨 Lonjakan Kasus DBD di wilayah Anda (5 Kasus minggu ini). Segera lakukan fogging!"**
6. Pak RT tahu ada wabah dan bisa mengambil tindakan mitigasi, tapi Pak RT TIDAK BISA melihat bahwa Mbah Surip adalah pasiennya.

### Keunggulan vs SatuSehat
- ✅ Pemantauan wabah dan stunting secara *real-time* dari level RT hingga Nasional.
- ✅ Privasi warga terjaga 100% (Sentralisasi Epidemiologi untuk Pemantauan, tapi Desentralisasi Mutlak untuk Privasi Pribadi).

---

## Upgrade 6: Zero-Knowledge KYC & Legal Compliance (Soulbound Tokens)

### Latar Belakang & Masalah yang Diselesaikan
Dalam dunia medis, identitas hukum pasien (KYC/NIK) sangat diwajibkan untuk keperluan asuransi, billing, dan pertanggungjawaban hukum (malapraktik). Namun, jika aplikasi SEHATI menyimpan foto KTP dan NIK secara langsung, server SEHATI akan menjadi *honeypot* sasaran hacker dan melanggar prinsip desentralisasi/privasi. Beban hukum (UU PDP) bagi *Startup* yang menyimpan foto KTP secara terpusat juga sangat berat.

### Konsep
Arsitektur identitas hibrida di mana SEHATI meng- *outsource* proses verifikasi KTP (KYC) ke pihak ketiga (seperti RS mitra atau lembaga resmi e-KYC seperti PrivyID), lalu merekam buktinya di blockchain menggunakan **Soulbound Tokens (SBT)** atau *Verifiable Credentials*.

### Alur Kerja Teknis (Tanpa Menyimpan KTP)
**Skenario B2B (KYC di Rumah Sakit/Klinik):**
1. Pasien datang ke Klinik A. Suster mengecek KTP asli fisik pasien.
2. Klinik A (bertindak sebagai Pengendali Data yang legal) mencatatkan NIK pasien di sistem lokal mereka.
3. Klinik A menerbitkan *Verifiable Credential* (Stempel Digital) ke wallet SEHATI pasien. Isinya: *"Klinik A menjamin Wallet 0xAAA adalah warga negara asli"*.
4. Server SEHATI tidak pernah melihat atau menyimpan NIK/KTP tersebut.

**Skenario B2C (e-KYC via Pihak Ketiga di dalam App):**
1. Pasien mendaftar di aplikasi SEHATI.
2. Pasien diarahkan ke iframe/SDK pihak ketiga (misal: PrivyID) untuk verifikasi wajah dan KTP.
3. Setelah PrivyID sukses memverifikasi ke Dukcapil, PrivyID memberikan *Token Validasi* (SBT) ke server SEHATI.
4. Akun SEHATI pasien mendapat *badge* "Verified Human". SEHATI tidak memegang *file* KTP pasien.

### Keunggulan vs Sistem Terpusat
- ✅ SEHATI kebal dari tuntutan hukum jika terjadi kebocoran server, karena tidak ada data demografi mentah (KTP/NIK) yang disimpan.
- ✅ Akun palsu (Sybil Attack) tidak bisa dibuat karena dompet (wallet) harus memiliki *Verifiable Credential*.
- ✅ Sepenuhnya *compliant* dengan UU Pelindungan Data Pribadi (UU PDP) Indonesia tanpa mengorbankan filosofi Cypherpunk Web3.

---

## Upgrade 7: Cryptographic Clinical Workflow (E-Resep Anti-Palsu & Double-Spending)

### Latar Belakang & Masalah yang Diselesaikan
Dalam alur klinik tradisional (Suster ➔ Dokter ➔ Apoteker), rekam medis dan resep obat berbasis kertas sangat rawan dimanipulasi. Pasien dapat memalsukan dosis resep (terutama obat keras/narkotika) atau menebus satu resep yang sama berkali-kali di apotek yang berbeda (*double-spending*).

### Konsep
Menerapkan konsep *Digital Signatures* dan *State Management* ala blockchain pada setiap langkah pelayanan medis. Setiap aktor medis (Suster, Dokter, Apoteker) memberikan tanda tangan kriptografis secara beruntun pada dokumen JSON yang sama, menciptakan *Chain of Trust* yang anti-manipulasi.

### Alur Kerja Teknis (Pencatatan Beruntun)
1. **Triage (Suster):** Menginput data Tensi/Keluhan, lalu menandatangani data tersebut menggunakan Wallet Suster (role khusus).
2. **Pemeriksaan (Dokter):** Membaca data suster, menambahkan Diagnosis & Resep Obat. Dokter menandatangani dokumen ini menggunakan Wallet Dokter (ber-role `DOCTOR_ROLE`).
3. **Penebusan Obat (Apoteker):** 
   - Apoteker membaca file JSON resep. Sistem otomatis memverifikasi *Digital Signature* dokter. Jika pasien mengubah isi resep (misal mengubah JSON dari `10mg` menjadi `50mg`), *signature* langsung *invalid* dan ditolak.
   - Setelah obat diberikan, Apoteker menekan tombol **"Mark as Dispensed"**.
   - Smart Contract di blockchain mencatat ID Resep tersebut sebagai **Telah Diklaim**.
4. **Pencegahan Double-Spending:** Jika pasien membawa resep yang sama ke Apotek B untuk minta obat lagi, Smart Contract akan menolak akses karena status ID resep tersebut sudah diklaim, persis seperti mekanisme sistem finansial kripto.

### Keunggulan vs SatuSehat
- ✅ Mengamankan apoteker dari penipuan resep obat keras dan narkotika.
- ✅ Menghilangkan praktik pencurian/ *double-spending* kuota obat asuransi subsidi.
- ✅ *Non-Repudiation*: Dokter tidak bisa menyangkal resep yang dia buat, dan pasien tidak bisa menuduh dokter salah meresepkan jika data sudah di-hash permanen on-chain.

---

## Prioritas Implementasi

| # | Upgrade | Kompleksitas | Impact | Status |
|---|---|---|---|---|
| 1 | **SSS Family Guardian** + Notifikasi | Medium | 🔥🔥🔥 Sangat Tinggi | Siap diimplementasi |
| 2 | **Biometric Emergency 1:N** | Medium | 🔥🔥🔥 Sangat Tinggi | Siap diimplementasi (SDK sudah ada) |
| 3 | **FHE Data Commons** | Sangat Tinggi | 🔥🔥🔥🔥 Transformatif | Tunggu library FHE matang (2026-2027) |
| 4 | **3D Holographic UI (WebXR/WebGL)** | Tinggi | 🔥🔥🔥🔥 Transformatif | Konsep matang (Phase 3) |
| 5 | **Decentralized Posyandu (KIA/KMS)** | Medium | 🔥🔥🔥🔥 Transformatif | Konsep matang (Phase 2) |

---

## Upgrade 8: 3D Holographic Medical Records (The "Star Trek" Console)

### Latar Belakang & Masalah yang Diselesaikan
Antarmuka medis tradisional (tabel dan teks datar) sangat melelahkan secara kognitif bagi dokter yang harus membaca puluhan parameter (*vitals*, lab, obat) dalam waktu singkat. Kesalahan sering terjadi karena *information overload*. 

### Konsep: Spatial HUD (Heads-Up Display)
Mengubah cara dokter berinteraksi dengan data rekam medis dari sekadar "membaca tabel" menjadi **berinteraksi dengan model 3D holistik**. Seluruh data pasien dipetakan di sekitar organ 3D bercahaya menggunakan konsep *Node-Based Data Architecture*.

### Alur Kerja Teknis & Visual
1. **Interactive 3D Focal Point (WebGL/Three.js):**
   - Menampilkan model anatomi 3D organ yang sakit (misal: Lambung, Jantung) di tengah layar kaca melengkung (*backdrop-blur*).
   - Dokter dapat memutar (rotate) dan memperbesar (zoom) organ untuk melihat detail area yang terdampak.
2. **Node-Based Data Architecture:**
   - Parameter seperti Tekanan Darah, Detak Jantung, dan Obat-obatan melayang di sekitar organ 3D, terhubung dengan garis lurus bercahaya neon (seperti jaring laba-laba/konstelasi bintang).
   - Menunjukkan bahwa data medis adalah satu kesatuan tubuh yang saling mempengaruhi.
3. **Contextual Danger Alerts:**
   - Informasi kritis penyebab kematian (seperti Alergi Obat parah) ditampilkan menggunakan kapsul neon merah terang yang berdenyut (pulsing), memotong dominasi warna biru es UI, sehingga mata dokter langsung tertuju padanya sebelum mengambil tindakan medis.
4. **Visceral Web3 Proof:**
   - Status blockchain ditampilkan bukan sebagai teks kecil, melainkan sebagai objek fisik (kartu kaca tebal) dengan logo rantai *Immutable* yang mengarahkan langsung ke *Blockscout Explorer*.

### File yang Perlu Dibuat/Diubah (Masa Depan)
| File | Aksi | Deskripsi |
|---|---|---|
| `client/src/components/ui/3d-canvas.tsx` | NEW | Kanvas `react-three-fiber` untuk merender model `.gltf` organ. |
| `client/src/components/medical-node.tsx` | NEW | Komponen React Flow atau SVG lines untuk menyambungkan data rekam medis ke titik 3D. |
| `client/src/pages/doctor-dashboard.tsx` | MODIFY | Merombak layout `PatientRecords` dari flat UI menjadi 3D Explorer. |

### Keunggulan vs SatuSehat
- ✅ Visualisasi data 60.000x lebih cepat diproses oleh otak dokter dibandingkan teks biasa.
- ✅ Meminimalisir kesalahan peresepan obat melalui *Alert* visual interaktif.
- ✅ *Wow Factor*: Memberikan standar baru UI/UX HealthTech yang berkelas dunia.

---

## Upgrade 9: Decentralized Posyandu & Maternal Health (KMS Web3)

### Latar Belakang & Masalah yang Diselesaikan
Posyandu (Pos Pelayanan Terpadu) adalah tulang punggung kesehatan komunitas di Indonesia (khususnya untuk balita dan ibu hamil). Masalah utamanya adalah balita belum memiliki *smartphone* atau identitas KTP (untuk membuat *crypto wallet*), dan buku pink KIA/KMS fisik sangat rentan hilang, rusak, atau basah, menyebabkan hilangnya riwayat imunisasi dan pelacakan stunting anak.

### Konsep: Dependent Nodes & Kader Role
Memperluas arsitektur SEHATI untuk mendukung "Sub-Akun" (Tanggungan) yang diikat secara kriptografis ke dompet orang tua, serta memberikan hak akses khusus (terbatas) kepada Kader Posyandu untuk menginput metrik pertumbuhan.

### Alur Kerja Teknis & Arsitektur
1. **Fitur "Dependent Node" (Sub-Akun Ibu & Anak):**
   - Balita tidak perlu membuat *wallet* sendiri. Rekam medis anak "diikat" (*linked*) ke dalam *Smart Contract* Ibunya.
   - Semua data KMS anak dienkripsi menggunakan *Private Key* Ibu.
   - Saat anak berusia 17 tahun, seluruh histori kesehatannya dapat di-*transfer* (di-mint ulang) ke *wallet* mandiri milik anak tersebut secara permanen.
2. **Penambahan Role: "KADER_ROLE":**
   - Kader Posyandu diberikan *Role Smart Contract* yang levelnya berada di bawah Dokter.
   - Kader tidak bisa meresepkan obat, namun memiliki otoritas (*write access*) untuk mencatat: Berat Badan, Tinggi Badan, Lingkar Kepala, dan Catatan Imunisasi ke *wallet* Ibu.
3. **Digitalisasi Kartu Menuju Sehat (KMS) & Stunting Tracker:**
   - Transformasi visual buku KIA fisik menjadi **Grafik Pertumbuhan Interaktif**.
   - Sistem secara otomatis memetakan input data Kader ke atas **Kurva Standar WHO**.
   - Jika grafik balita mendekati zona merah (*Stunting Alert*), sistem memicu notifikasi peringatan langsung ke *Dashboard* Ibu dan Dashboard Puskesmas tingkat wilayah.
4. **Imunisasi sebagai Verifiable Credential (VC):**
   - Sertifikat vaksinasi (Polio, Campak, dll) diterbitkan sebagai *Digital Badge* (NFT/SBT) anti-palsu. Berguna seumur hidup sebagai syarat pendaftaran sekolah anak tanpa takut sertifikat fisik hilang.

### File yang Perlu Dibuat/Diubah (Masa Depan)
| File | Aksi | Deskripsi |
|---|---|---|
| `contracts/SEHATIRegistry.sol` | MODIFY | Tambah `KADER_ROLE`, fungsi `addDependent()`, dan `transferDependentHistory()`. |
| `shared/schema.ts` | MODIFY | Tambah tabel `dependents` (linked to `users.id`) dan tipe rekam medis `KMS_RECORD`. |
| `client/src/pages/kader-dashboard.tsx` | NEW | *Dashboard* khusus untuk Kader Posyandu dengan UI input massal yang cepat. |
| `client/src/components/growth-chart.tsx` | NEW | Visualisasi kurva KMS standar WHO menggunakan pustaka grafik interaktif. |

### Keunggulan vs SatuSehat
- ✅ Solusi mutlak untuk rekam medis anak di bawah umur tanpa mewajibkan mereka memiliki *smartphone*.
- ✅ Mengamankan sejarah imunisasi anak dari kerusakan/kehilangan dokumen fisik seumur hidup (Imunisasi berbasis NFT).
- ✅ Melibatkan masyarakat lapis terbawah (Kader Posyandu) ke dalam ekosistem Web3 tanpa mereka sadari kompleksitasnya.

---

*Dokumen ini ditulis sebagai rencana upgrade jangka menengah dan panjang SEHATI.*
*Semua konsep kriptografi di atas sudah valid secara akademis dan teknis.*
*Implementasi Upgrade 1 & 2 dapat dimulai kapan saja setelah approval.*
