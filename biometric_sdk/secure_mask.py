import hmac
import hashlib
import struct
import math
from typing import List, Tuple
from biometric_core import Fingerprint, Minutia

class SecureMask:
    """
    Responsibilities:
    1. Deterministically generate 4 Search Sectors based on Service Name + User Seed.
    2. Select the most stable minutiae within those sectors.
    """
    
    def __init__(self, user_seed: bytes, service_name: str):
        self.user_seed = user_seed
        self.service_name = service_name.encode('utf-8')
        # PRF: HMAC-SHA256(Key=Seed, Msg=Service)
        self.mask_seed = hmac.new(self.user_seed, self.service_name, hashlib.sha256).digest()
        self.sectors = self._derive_sectors()

    def _derive_sectors(self) -> List[Tuple[float, float, float, float]]:
        """
        Derives 4 defining rectangles/wedges for search.
        For PoC, we keep it simple: 4 Quadrants with randomized centers.
        Returns: List of (center_x, center_y, radius, weight)
        """
        # We process the 32-byte hash in 4 chunks of 8 bytes
        sectors = []
        for i in range(4):
            chunk = self.mask_seed[i*8 : (i+1)*8]
            # Convert hash chunk to floats
            val1, val2 = struct.unpack('>If', chunk) # Just using parts of it
            
            # Deterministic pseudo-randomness from the hash
            # Normalize to 500x500 canvas
            cx = (val1 % 400) + 50
            cy = int(val2) % 400 + 50
            
            # Define a sector center
            sectors.append( (float(cx), float(cy)) )
        return sectors

    def select_anchors(self, fp: Fingerprint) -> List[Minutia]:
        """
        Selects 2 anchors per sector (Total 8).
        Criteria: Closest to the deterministic sector center.
        """
        selected_anchors = []
        
        for (cx, cy) in self.sectors:
            # Find all candidates
            candidates = fp.minutiae
            
            # Sort by distance to sector center
            candidates.sort(key=lambda m: m.distance_to(cx, cy))
            
            # Pick top 2 unique candidates (Octo-Point System)
            # This provides 8 points total -> 8 features -> 8 bytes for ECC
            if len(candidates) >= 2:
                selected_anchors.extend(candidates[:2])
            else:
                # Fallback (should rare happen in decent fp)
                selected_anchors.extend(candidates)
                
        return selected_anchors
