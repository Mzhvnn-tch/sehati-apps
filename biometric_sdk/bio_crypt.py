import hmac
import hashlib
from typing import List
from collections import Counter
from cryptography.hazmat.primitives import kdf
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives import hashes

from biometric_core import Fingerprint, Minutia
from geometric_quantizer import GeometricQuantizer
from secure_mask import SecureMask

class BioCrypt:
    """
    Main Orchestrator.
    Combines Biometrics + SecureMask + Quantization + HKDF.
    """
    
import hmac
import hashlib
from typing import List, Tuple
from collections import Counter
from cryptography.hazmat.primitives import kdf
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives import hashes

from biometric_core import Fingerprint, Minutia
from geometric_quantizer import GeometricQuantizer
from secure_mask import SecureMask
from ecc_wrapper import FuzzyCommitment

class BioCrypt:
    """
    Main Orchestrator V4 (ECC-Enabled).
    Uses Fuzzy Commitment Scheme with Reed-Solomon.
    """
    
    def __init__(self, user_seed_hex: str):
        self.user_seed = bytes.fromhex(user_seed_hex)
        self.quantizer = GeometricQuantizer()
        self.helper_data_offsets = {'offset_d': 0.0, 'offset_theta': 0.0}
        # ECC Parameter: N=8 (vector len). Secret=4 bytes. Parity=4 bytes.
        self.fcs = FuzzyCommitment(secret_size=4, parity_bytes=4)

    def _get_bio_vector(self, fp: Fingerprint, service_name: str, use_offsets: bool = False) -> bytes:
        mask = SecureMask(self.user_seed, service_name)
        anchors = mask.select_anchors(fp)
        
        off_d = self.helper_data_offsets['offset_d'] if use_offsets else 0.0
        off_t = self.helper_data_offsets['offset_theta'] if use_offsets else 0.0
        
        return self.quantizer.compute_feature_bytes(anchors, off_d, off_t)

    def enroll(self, reference_fps: List[Fingerprint], service_name: str) -> dict:
        """
        Enrollment V4:
        1. Determine optimal Grid Offsets (Adaptive Grid).
        2. Get Stable Biometric Vector B (via Majority Vote or Best Scan).
        3. Generate Random Secret S.
        4. Commit: Helper = RS(S) XOR B.
        Returns: Public Enrollment Record { 'helper_ecc': bytes, 'helper_grid': dict, 'secret_hash': bytes }
        """
        # 1. Consensus / Grid Alignment (Simplified: Use Scan #0 as pivot)
        # Using the majority vote vector from V3 is still good practice to reduce initial error.
        # But to be compliant with the FCS API `commit(vector)`, we need ONE vector.
        
        # 1. Consensus / Grid Alignment (Simplified: Use Scan #0 as pivot)
        # Using the majority vote vector from V3 is still good practice to reduce initial error.
        
        # --- SIMPLIFIED ENROLLMENT FOR POC V4 ---
        # 1. Consensus: We can compute optimal offsets here, but for V4 PoC, 
        # let's trust the Majority Voting to establish the "Golden Vector" first.
        # Ideally, we should iterate offsets and see which one yields the tightest consensus.
        
        # For this demonstration, we use fixed offsets (0,0) as the "Canonical Grid".
        # Why? Because Majority Voting on the Golden Vector ALREADY filters out noise.
        # The adaptive grid is most useful during Authentication (Alignment).
        # But we need to store the grid used for enrollment. 
        # Let's assume (0,0) for enrollment.
        
        mask = SecureMask(self.user_seed, service_name) # Common mask
        
        # Get all raw byte vectors
        vectors = []
        for fp in reference_fps:
            anchors = mask.select_anchors(fp)
            b = self.quantizer.compute_feature_bytes(anchors, 0.0, 0.0)
            vectors.append(b)
            
        # Per-byte majority vote
        stable_bytes = []
        for i in range(8): # Length 8
            col = [v[i] for v in vectors]
            mode = Counter(col).most_common(1)[0][0]
            stable_bytes.append(mode)
        
        golden_vector = bytes(stable_bytes)
        
        # 2. Commit
        secret, ecc_helper = self.fcs.commit(golden_vector)
        
        # 3. Hash the secret
        secret_hash = hashlib.sha256(secret).hexdigest()
        
        return {
            'helper_ecc': ecc_helper.hex(),
            'helper_grid': {'offset_d': 0.0, 'offset_theta': 0.0}, # Fixed for now
            'context_hash': hashlib.sha256(service_name.encode()).hexdigest(), # Binding
            'verifier': secret_hash
        }

    def authenticate(self, live_fp: Fingerprint, service_name: str, enrollment_record: dict) -> str:
        """
        Auth V4:
        1. Get Live Vector B'.
        2. Unlock: S' = Unlock(B', Helper).
        3. Verify Hash(S') == Record.verifier.
        4. If success, Perform KDF(S') -> Final Key.
        """
        # Validate Context Binding
        ctx_hash = hashlib.sha256(service_name.encode()).hexdigest()
        if enrollment_record.get('context_hash') != ctx_hash:
            raise ValueError("Context Mismatch! Replay Attack Detected.")

        # 1. Get Live Vector
        # (Apply stored grid offsets)
        offsets = enrollment_record['helper_grid']
        self.helper_data_offsets = offsets
        live_vector = self._get_bio_vector(live_fp, service_name, use_offsets=True)
        
        # 2. Unlock
        helper_bytes = bytes.fromhex(enrollment_record['helper_ecc'])
        try:
            secret = self.fcs.unlock(live_vector, helper_bytes)
        except Exception:
            return None # Failed correction
            
        # 3. Verify
        secret_hash = hashlib.sha256(secret).hexdigest()
        if secret_hash != enrollment_record['verifier']:
            return None # Hash mismatch (should be caught by RS error usually, but safety net)
            
        # 4. Derive Final Key (HKDF)
        # S is 4 bytes (random). Stretch it.
        hkdf = HKDF(
            algorithm=hashes.SHA256(),
            length=32,
            salt=service_name.encode(),
            info=b"BioCryptV4-ECC",
        )
        return hkdf.derive(secret).hex()

    def _derive_final_key(self, vector_str: str, service_name: str) -> str:
        """
        HKDF(
            IKM = HMAC(UserSeed, GeometricVector),
            Salt = ServiceName,
            Info = "BioCryptV3"
        )
        """
        # 1. Blind the vector with UserSeed immediately so raw bio geometry isn't exposed
        ikm = hmac.new(self.user_seed, vector_str.encode('ascii'), hashlib.sha256).digest()
        
        # 2. HKDF Stretch
        hkdf = HKDF(
            algorithm=hashes.SHA256(),
            length=32,
            salt=service_name.encode('utf-8'),
            info=b"BioCryptV3",
        )
        key = hkdf.derive(ikm)
        return key.hex()
