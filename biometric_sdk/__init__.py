from .bio_crypt import BioCrypt
from .biometric_vision import RealFingerprintExtractor
from .biometric_core import Fingerprint
import os

class BioLock:
    """
    BioLock SDK Interface.
    Simple wrapper for integrating Biometric Cryptography into apps.
    """
    
    def __init__(self, user_secret_seed: str):
        """
        Initialize with a 32-byte hex string (User's Master Secret).
        Store this securely on the device (Keystore/Keychain).
        """
        self.engine = BioCrypt(user_secret_seed)
        self.vision = RealFingerprintExtractor()
        
    def enroll_from_image(self, image_path: str, service_name: str) -> dict:
        """
        Generates a biometric lock for a specific service using an image.
        Returns: Public Enrollment Record (Dict) -> Save this JSON database!
        """
        # 1. Extract
        minutiae = self.vision.extract(image_path)
        if len(minutiae) < 8:
            raise ValueError(f"Image quality too low. Found {len(minutiae)} features, need 8.")
            
        # 2. Wrap in internal object
        fp = Fingerprint(seed=None, num_minutiae=0)
        fp.minutiae = minutiae
        
        # 3. Operations
        # For robustness, we assume single-shot enrollment for now
        # In prod, pass list of 3-5 images: [fp1, fp2, ...]
        return self.engine.enroll([fp], service_name)

    def unlock_from_image(self, image_path: str, service_name: str, enrollment_record: dict) -> str:
        """
        Attempts to unlock using a fresh image.
        Returns: 
           - Hex Key String (if success)
           - None (if moved/spoofed/wrong finger)
        """
        # 1. Extract
        minutiae = self.vision.extract(image_path)
        if len(minutiae) < 8:
            # Optionally return None or raise
            return None
            
        fp = Fingerprint(seed=None, num_minutiae=0)
        fp.minutiae = minutiae
        
        # 2. Authenticate
        return self.engine.authenticate(fp, service_name, enrollment_record)
