import random
import math
from typing import List, Tuple
from dataclasses import dataclass

@dataclass
class Minutia:
    """Represents a single biometric feature point (star in the constellation)."""
    id: int  # Stable ID to track "Anchor Switching" in simulations (not used in real crypto)
    x: float
    y: float
    angle: float  # Orientation in degrees [0, 360)
    type: str     # 'ridge_ending' or 'bifurcation'

    def distance_to(self, x: float, y: float) -> float:
        return math.sqrt((self.x - x)**2 + (self.y - y)**2)

class Fingerprint:
    """Simulates a user's fingerprint containing a set of minutiae."""
    
    def __init__(self, seed: int = None, num_minutiae: int = 40):
        # Using a seed ensures we can recreate the "Same User" perfectly
        self.rng = random.Random(seed)
        self.minutiae: List[Minutia] = []
        
        # Biometric Space: 500x500 normalized units
        for i in range(num_minutiae):
            m = Minutia(
                id=i,
                x=self.rng.uniform(0, 500),
                y=self.rng.uniform(0, 500),
                angle=self.rng.uniform(0, 360),
                type=self.rng.choice(['ridge_ending', 'bifurcation'])
            )
            self.minutiae.append(m)

    def scan(self, noise_level: float = 0.0) -> 'Fingerprint':
        """
        Simulates scanning the fingerprint.
        noise_level: Magnitude of jitter (positional shift) in pixels.
        """
        scanned_fp = Fingerprint(seed=None, num_minutiae=0)
        
        for m in self.minutiae:
            # Add Gaussian noise
            noise_x = random.gauss(0, noise_level)
            noise_y = random.gauss(0, noise_level)
            noise_angle = random.gauss(0, noise_level * 2) # Angle is more volatile
            
            # Simulate occasional dropout/missing point (98% capture rate)
            if random.random() > 0.02: 
                new_m = Minutia(
                    id=m.id,
                    x=m.x + noise_x,
                    y=m.y + noise_y,
                    angle=(m.angle + noise_angle) % 360,
                    type=m.type
                )
                scanned_fp.minutiae.append(new_m)
                
        return scanned_fp

    def __repr__(self):
        return f"<Fingerprint with {len(self.minutiae)} minutiae>"
