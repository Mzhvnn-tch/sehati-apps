import argparse
import json
import sys
import os
import cv2
import numpy as np

# Add current directory to path so imports work
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from bio_crypt import BioCrypt
    from biometric_core import Fingerprint, Minutia
except ImportError as e:
    print(json.dumps({"success": False, "error": f"Import Error: {str(e)}"}))
    sys.exit(1)

def load_image(image_path):
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found: {image_path}")
    return cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)

# Mock minutiae extraction (since we might not have a full REAL fingerprint extractor linked yet)
# In production, this would call `biometric_vision.extract_minutiae(img)`
def mock_extract_minutiae(image_path):
    # Deterministic mock based on file hash or content for testing consistency
    # Real implementation should allow this to be swapped with `biometric_vision`
    img = load_image(image_path)
    if img is None:
        raise ValueError("Failed to load image")
        
    # Generate pseudo-random minutiae based on image content
    h, w = img.shape
    seed = np.sum(img)
    np.random.seed(int(seed) % 2**32)
    
    minutiae = []
    for _ in range(20): # 20 minutiae points
        x = np.random.randint(0, w)
        y = np.random.randint(0, h)
        angle = np.random.uniform(0, 2 * np.pi)
        minutiae.append(Minutia(x, y, angle, type='bifurcation'))
        
    return Fingerprint(minutiae)

def main():
    parser = argparse.ArgumentParser(description='BioLock SDK CLI Wrapper')
    parser.add_argument('--action', required=True, choices=['enroll', 'verify'], help='Action to perform')
    parser.add_argument('--image', required=True, help='Path to input image')
    parser.add_argument('--service', default='SehatiApp', help='Service/Context name')
    parser.add_argument('--record', help='JSON string of enrollment record (for verify)')
    parser.add_argument('--secret', help='User secret/seed (hex) for enrollment')

    args = parser.parse_args()

    try:
        # For this PoC, we need a secret to initialize BioCrypt. 
        # In a real app, this might come from a secure enclave or key store.
        # Defaulting to a fixed test seed if not provided (ONLY FOR DEV/DEMO)
        user_seed = args.secret if args.secret else "0102030405060708090a0b0c0d0e0f100102030405060708090a0b0c0d0e0f10"
        
        bio = BioCrypt(user_seed_hex=user_seed)
        
        # Extract features (Using mock for now until vision module is fully confirmed)
        fp = mock_extract_minutiae(args.image)
        
        if args.action == 'enroll':
            # Enroll accepts a LIST of reference fingerprints (usually 3-5)
            # Here we just pass 1 for simplicity
            record = bio.enroll([fp], args.service)
            print(json.dumps({"success": True, "record": record}))
            
        elif args.action == 'verify':
            if not args.record:
                raise ValueError("Record is required for verification")
                
            record_dict = json.loads(args.record)
            key = bio.authenticate(fp, args.service, record_dict)
            
            if key:
                print(json.dumps({"success": True, "key": key}))
            else:
                print(json.dumps({"success": False, "error": "Authentication failed (Bio mismatch)"}))

    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)

if __name__ == '__main__':
    main()
