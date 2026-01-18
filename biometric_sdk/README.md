# BioLock SDK

A portable, context-aware biometric cryptography library.  
Implements **Octo-Point V4** architecture with **ECC (Reed-Solomon)**.

## Installation

1. Copy this `biometric_sdk` folder to your project root.
2. Install dependencies:
   ```bash
   pip install -r biometric_sdk/requirements.txt
   ```

## Quick Start

```python
from biometric_sdk import BioLock
import json

# 1. Initialize (Use a secure master seed from your KeyStore/KMS)
# WARNING: Do NOT hardcode this in production code. 
user_seed = "0102030405060708090a0b0c0d0e0f10" # 32 chars hex
bio = BioLock(user_secret_seed=user_seed)

# 2. Enrollment (Registration)
try:
    # Generates a Public Enrollment Record
    # 'BankOfAntigravity' is the Context. Keys are bound to this string.
    record = bio.enroll_from_image("thumb_scan.jpg", "BankOfAntigravity")
    
    # Save 'record' to your User Database (It is public/safe)
    print("Enrollment Record:", json.dumps(record, indent=2))
    # Database.save(user_id, record)
    
except Exception as e:
    print(f"Enrollment Failed: {e}")

# 3. Authentication (Login)
# Load record from DB...
try:
    key = bio.unlock_from_image("thumb_verify.jpg", "BankOfAntigravity", record)
    
    if key:
        print("Login Success!")
        print("Derived Key:", key)
        # Use 'key' to decrypt user data or sign tokens
    else:
        print("Login Failed: Fingerprint mismatch or spoof detection.")
except Exception as e:
    print(f"Error: {e}")
```

## Security Notes
*   **Cancelability**: To revoke keys, generate a new `user_seed` and re-enroll.
*   **Context**: You cannot use a "Bank" record to unlock "Home" service.
*   **Privacy**: The `record` does NOT contain the fingerprint image or the key.
