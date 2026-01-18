import math
from typing import List
from biometric_core import Minutia

class GeometricQuantizer:
    """
    Responsibilities:
    1. Robustly quantize continuous values into discrete buckets.
    2. Extract stable feature vectors from a set of points.
    """
    
    def __init__(self, delta_d: float = 50.0, delta_theta: float = 120.0): # Ultra-relaxed
        self.delta_d = delta_d          # Distance bucket size (pixels)
        self.delta_theta = delta_theta  # Angle bucket size (degrees)

    def quantize_dist(self, val: float, offset: float = 0.0) -> int:
        return int(round((val - offset) / self.delta_d))

    def quantize_angle(self, val: float, offset: float = 0.0) -> int:
        # Normalize to [0, 360)
        val = (val - offset) % 360
        return int(round(val / self.delta_theta)) % int(360 / self.delta_theta)

    def compute_feature_bytes(self, points: List[Minutia], offset_d: float = 0.0, offset_theta: float = 0.0) -> bytes:
        """
        Returns feature vector as a byte array (for ECC).
        Each feature is packed into 1 byte (0-255).
        """
        if not points:
            return b""
        
        # 1. Canonical Sort: Sort by angle relative to centroid to fix order
        # Calculate Centroid
        cx = sum(p.x for p in points) / len(points)
        cy = sum(p.y for p in points) / len(points)
        
        # Sort by angle from centroid (0 to 360)
        # atan2(y, x) returns -pi to pi.
        sorted_points = sorted(points, key=lambda p: math.atan2(p.y - cy, p.x - cx))
        
        byte_list = []
        
        for i in range(len(sorted_points)):
            curr = sorted_points[i]
            # Star Topology: Feature is relation to Centroid, not neighbor
            # This ensures 1 point noise = 1 byte error (vs 2 in chain)
            
            d = curr.distance_to(cx, cy)
            dx = curr.x - cx
            dy = curr.y - cy
            rel_angle = math.degrees(math.atan2(dy, dx))
            
            q_d = self.quantize_dist(d, offset_d) & 0x1F  
            q_a = self.quantize_angle(rel_angle, offset_theta) & 0x07 
            
            packed = (q_d << 3) | q_a
            byte_list.append(packed)
            
        return bytes(byte_list)

    def compute_feature_vector(self, points: List[Minutia], offset_d: float = 0.0, offset_theta: float = 0.0) -> str:
        # Backward compatibility wrapper (though we should migrate away from this string format)
        b = self.compute_feature_bytes(points, offset_d, offset_theta)
        return "-".join(f"{x:02x}" for x in b)
