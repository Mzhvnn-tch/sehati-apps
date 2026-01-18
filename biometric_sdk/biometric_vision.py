import cv2
import numpy as np
from skimage.morphology import skeletonize
from skimage import img_as_bool
import math
from biometric_core import Minutia

class RealFingerprintExtractor:
    """
    Extracts Minutiae from a real fingerprint image.
    Pipeline: Gray -> Contrast -> Binary -> Skeleton -> Minutiae.
    """
    
    def __init__(self, normalized_size=(500, 500)):
        self.target_size = normalized_size

    def extract(self, image_path: str) -> list[Minutia]:
        # 1. Load Image
        img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
        if img is None:
            raise FileNotFoundError(f"Cannot load image: {image_path}")
            
        # 2. Preprocess (CLAHE + Gaussian)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        img = clahe.apply(img)
        img = cv2.GaussianBlur(img, (5, 5), 0)
        
        # 3. Binarize (Adaptive Threshold)
        # Inverted because we want ridges as white
        bin_img = cv2.adaptiveThreshold(img, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                        cv2.THRESH_BINARY_INV, 11, 2)
                                        
        # 4. Skeletonize
        # Scikit-image implies True (white) = Ridge
        bool_img = img_as_bool(bin_img)
        skeleton = skeletonize(bool_img)
        skeleton_uint8 = skeleton.astype(np.uint8) * 1 # 0 or 1
        
        # 5. Minutiae Extraction (Crossing Number)
        # CN = 0.5 * sum(|P_i - P_{i+1}|)
        # Enpoints: CN=1, Bifurcations: CN=3
        
        minutiae = []
        rows, cols = skeleton_uint8.shape
        
        # Define 8-neighbor offsets
        neighbors = [(-1, -1), (-1, 0), (-1, 1),
                     (0, 1), (1, 1), (1, 0),
                     (1, -1), (0, -1)]
                     
        # Use simple kernel convolution approach for speed if possible, but loop is safer for logic
        # Optimize loop by skipping borders
        
        count = 0
        for r in range(1, rows - 1):
            for c in range(1, cols - 1):
                if skeleton_uint8[r, c] == 1:
                    # Check neighborhood
                    # Get values P2..P9 (in order)
                    values = [int(skeleton_uint8[r+dy, c+dx]) for dy, dx in neighbors]
                    
                    # Calculate Crossing Number
                    crossings = 0
                    for i in range(8):
                        crossings += abs(values[i] - values[(i+1)%8])
                    cn = crossings // 2
                    
                    m_type = None
                    if cn == 1:
                        m_type = 'ridge_ending'
                    elif cn == 3:
                        m_type = 'bifurcation'
                        
                    if m_type:
                        # Normalize coordinates to 500x500 target
                        norm_x = (c / cols) * self.target_size[0]
                        norm_y = (r / rows) * self.target_size[1]
                        
                        # Calculate Angle (Basic: Gradient of neighbors) -> To be robust, requires direction map
                        # For PoC, use 0.0 or random if direction not implemented yet
                        # Let's try to get tangent from neighbors for Endings
                        angle = 0.0 
                        if cn == 1:
                            # Find the one neighbor
                            for i, (dy, dx) in enumerate(neighbors):
                                if values[i] == 1:
                                    angle = math.degrees(math.atan2(dy, dx))
                                    break
                                    
                        m = Minutia(
                            id=count,
                            x=norm_x,
                            y=norm_y,
                            angle=angle,
                            type=m_type
                        )
                        minutiae.append(m)
                        count += 1
                        
        # Filter spurious minutiae (too close to each other)
        # Simple Euclidean filter
        final_minutiae = self._filter_minutiae(minutiae)
        return final_minutiae

    def _filter_minutiae(self, minutiae: list[Minutia], threshold=10.0) -> list[Minutia]:
        # Sort by quality (or just position) 
        # Remove those too close to borders
        # Remove clusters
        valid = []
        for m in minutiae:
            # Border check (normalized 500x500)
            if m.x < 20 or m.x > 480 or m.y < 20 or m.y > 480:
                continue
                
            is_good = True
            for existing in valid:
                dist = math.sqrt((m.x - existing.x)**2 + (m.y - existing.y)**2)
                if dist < threshold:
                    is_good = False
                    break
            if is_good:
                valid.append(m)
        return valid
