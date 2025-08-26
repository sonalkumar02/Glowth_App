import numpy as np
import cv2
from typing import Dict, List, Tuple, Optional
from PIL import Image
import os

class SkinAnalyzer:
    def __init__(self):
        # Load OpenCV face and eye cascade classifiers
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        self.eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye.xml')
    
    def analyze_face(self, image_path: str) -> Dict:
        """Analyze facial skin conditions from an image."""
        # Read and preprocess image
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError(f"Could not read image at {image_path}")
        
        # Convert to grayscale for face detection
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Detect faces
        faces = self.face_cascade.detectMultiScale(gray, 1.3, 5)
        
        if len(faces) == 0:
            raise ValueError("No face detected in the image")
        
        # Get the largest face
        x, y, w, h = max(faces, key=lambda rect: rect[2] * rect[3])
        face_region = image[y:y+h, x:x+w]
        
        # Extract facial regions
        facial_regions = self._extract_facial_regions(face_region)
        
        # Analyze each region
        analysis_results = {
            'overall_score': 0.0,
            'regions': {},
            'conditions': {},
            'age_analysis': {}
        }
        
        # Analyze each facial region
        for region_name, region_image in facial_regions.items():
            region_analysis = self._analyze_region(region_image)
            analysis_results['regions'][region_name] = region_analysis
        
        # Calculate overall scores
        analysis_results['conditions'] = self._aggregate_conditions(analysis_results['regions'])
        analysis_results['overall_score'] = self._calculate_overall_score(analysis_results['conditions'])
        
        # Perform age analysis
        analysis_results['age_analysis'] = self._analyze_age(face_region)
        
        return analysis_results
    
    def _extract_facial_regions(self, face_region: np.ndarray) -> Dict[str, np.ndarray]:
        """Extract different facial regions using relative positions."""
        h, w = face_region.shape[:2]
        
        regions = {
            'forehead': face_region[0:int(h*0.33), :],
            'left_cheek': face_region[int(h*0.33):int(h*0.66), 0:int(w*0.5)],
            'right_cheek': face_region[int(h*0.33):int(h*0.66), int(w*0.5):],
            'nose': face_region[int(h*0.33):int(h*0.66), int(w*0.3):int(w*0.7)],
            'chin': face_region[int(h*0.66):, :]
        }
        
        return regions
    
    def _analyze_region(self, region_image: np.ndarray) -> Dict:
        """Analyze a specific facial region for various skin conditions."""
        analysis = {
            'pores': self._analyze_texture(region_image),
            'wrinkles': self._analyze_wrinkles(region_image),
            'pigmentation': self._analyze_pigmentation(region_image),
            'acne': self._analyze_texture(region_image),
            'texture': self._analyze_texture(region_image),
            'redness': self._analyze_redness(region_image),
            'blackheads': self._analyze_texture(region_image),
            'tone': self._analyze_tone(region_image)
        }
        return analysis
    
    def _analyze_wrinkles(self, image: np.ndarray) -> float:
        """Analyze wrinkle presence and depth in the region."""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 50, 150)
        return min(100, (np.sum(edges > 0) / (edges.shape[0] * edges.shape[1])) * 100)
    
    def _analyze_pigmentation(self, image: np.ndarray) -> float:
        """Analyze pigmentation issues in the region."""
        lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
        l_channel = lab[:,:,0]
        return min(100, np.std(l_channel))
    
    def _analyze_texture(self, image: np.ndarray) -> float:
        """Analyze skin texture unevenness."""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        texture_score = np.std(gray) / 2
        return min(100, texture_score)
    
    def _analyze_redness(self, image: np.ndarray) -> float:
        """Analyze redness/inflammation in the region."""
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        lower_red = np.array([0, 50, 50])
        upper_red = np.array([10, 255, 255])
        mask = cv2.inRange(hsv, lower_red, upper_red)
        return min(100, (np.sum(mask) / (mask.shape[0] * mask.shape[1])) * 100)
    
    def _analyze_tone(self, image: np.ndarray) -> float:
        """Analyze skin tone evenness."""
        lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
        l_channel = lab[:,:,0]
        return min(100, np.std(l_channel) * 2)
    
    def _aggregate_conditions(self, regions: Dict) -> Dict[str, float]:
        """Aggregate condition scores across all regions."""
        conditions = {
            'pores': 0.0,
            'wrinkles': 0.0,
            'pigmentation': 0.0,
            'acne': 0.0,
            'texture': 0.0,
            'redness': 0.0,
            'blackheads': 0.0,
            'tone': 0.0
        }
        
        for region in regions.values():
            for condition, score in region.items():
                conditions[condition] += score
        
        for condition in conditions:
            conditions[condition] /= len(regions)
        
        return conditions
    
    def _calculate_overall_score(self, conditions: Dict[str, float]) -> float:
        """Calculate overall skin health score."""
        weights = {
            'pores': 0.15,
            'wrinkles': 0.15,
            'pigmentation': 0.15,
            'acne': 0.15,
            'texture': 0.1,
            'redness': 0.1,
            'blackheads': 0.1,
            'tone': 0.1
        }
        
        weighted_sum = sum(score * weights[condition] 
                         for condition, score in conditions.items())
        
        return 100 - weighted_sum
    
    def _analyze_age(self, face_region: np.ndarray) -> Dict:
        """Analyze age based on facial features."""
        # Convert to grayscale for eye detection
        gray = cv2.cvtColor(face_region, cv2.COLOR_BGR2GRAY)
        
        # Detect eyes
        eyes = self.eye_cascade.detectMultiScale(gray, 1.3, 5)
        
        # For testing purposes, use a fixed age
        actual_age = 30
        
        # Calculate perceived age based on skin conditions
        aging_factors = self._get_skin_aging_factors(face_region)
        perceived_age = self._calculate_perceived_age(actual_age, aging_factors)
        
        # Analyze eye age if eyes are detected
        if len(eyes) > 0:
            eye_regions = []
            for (ex, ey, ew, eh) in eyes[:2]:  # Take up to 2 eyes
                eye_region = face_region[ey:ey+eh, ex:ex+ew]
                eye_regions.append(eye_region)
            
            eye_age, eye_age_difference = self._analyze_eye_age(eye_regions, actual_age)
        else:
            eye_age = actual_age
            eye_age_difference = 0
        
        return {
            'actual_age': actual_age,
            'perceived_age': perceived_age,
            'age_difference': perceived_age - actual_age,
            'eye_age': eye_age,
            'eye_age_difference': eye_age_difference
        }
    
    def _get_skin_aging_factors(self, face_region: np.ndarray) -> Dict[str, float]:
        """Calculate factors that affect perceived age."""
        return {
            'texture': self._analyze_texture(face_region),
            'wrinkles': self._analyze_wrinkles(face_region),
            'pigmentation': self._analyze_pigmentation(face_region)
        }
    
    def _calculate_perceived_age(self, actual_age: int, aging_factors: Dict[str, float]) -> int:
        """Calculate perceived age based on skin aging factors."""
        age_adjustment = 0
        
        if aging_factors['texture'] > 70:
            age_adjustment += 5
        elif aging_factors['texture'] > 50:
            age_adjustment += 3
        
        if aging_factors['wrinkles'] > 70:
            age_adjustment += 8
        elif aging_factors['wrinkles'] > 50:
            age_adjustment += 5
        
        if aging_factors['pigmentation'] > 70:
            age_adjustment += 4
        elif aging_factors['pigmentation'] > 50:
            age_adjustment += 2
        
        perceived_age = actual_age + age_adjustment
        return max(actual_age - 5, min(perceived_age, actual_age + 15))
    
    def _analyze_eye_age(self, eye_regions: List[np.ndarray], actual_age: int) -> Tuple[int, int]:
        """Analyze eye age based on eye region features."""
        eye_features = {
            'wrinkles': 0.0,
            'dark_circles': 0.0,
            'puffiness': 0.0,
            'fine_lines': 0.0
        }
        
        for eye_region in eye_regions:
            eye_features['wrinkles'] += self._analyze_wrinkles(eye_region)
            eye_features['dark_circles'] += self._analyze_dark_circles(eye_region)
            eye_features['puffiness'] += self._analyze_puffiness(eye_region)
            eye_features['fine_lines'] += self._analyze_fine_lines(eye_region)
        
        for feature in eye_features:
            eye_features[feature] /= len(eye_regions)
        
        age_adjustment = 0
        
        if eye_features['wrinkles'] > 70:
            age_adjustment += 5
        elif eye_features['wrinkles'] > 50:
            age_adjustment += 3
            
        if eye_features['dark_circles'] > 70:
            age_adjustment += 4
        elif eye_features['dark_circles'] > 50:
            age_adjustment += 2
            
        if eye_features['puffiness'] > 70:
            age_adjustment += 3
        elif eye_features['puffiness'] > 50:
            age_adjustment += 1
            
        if eye_features['fine_lines'] > 70:
            age_adjustment += 4
        elif eye_features['fine_lines'] > 50:
            age_adjustment += 2
        
        eye_age = actual_age + age_adjustment
        eye_age = max(actual_age - 5, min(eye_age, actual_age + 15))
        
        return int(eye_age), int(eye_age - actual_age)
    
    def _analyze_dark_circles(self, eye_region: np.ndarray) -> float:
        """Analyze dark circles under the eyes."""
        lab = cv2.cvtColor(eye_region, cv2.COLOR_BGR2LAB)
        l_channel = lab[:,:,0]
        darkness_score = (255 - np.mean(l_channel)) / 2.55
        return min(100, darkness_score)
    
    def _analyze_puffiness(self, eye_region: np.ndarray) -> float:
        """Analyze puffiness around the eyes."""
        gray = cv2.cvtColor(eye_region, cv2.COLOR_BGR2GRAY)
        sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
        sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
        magnitude = np.sqrt(sobelx**2 + sobely**2)
        puffiness_score = (np.sum(magnitude > 50) / (magnitude.shape[0] * magnitude.shape[1])) * 100
        return min(100, puffiness_score)
    
    def _analyze_fine_lines(self, eye_region: np.ndarray) -> float:
        """Analyze fine lines around the eyes."""
        gray = cv2.cvtColor(eye_region, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 50, 150)
        lines_score = (np.sum(edges > 0) / (edges.shape[0] * edges.shape[1])) * 100
        return min(100, lines_score)

# Example usage
if __name__ == "__main__":
    analyzer = SkinAnalyzer()
    results = analyzer.analyze_face("path_to_image.jpg")
    print(results) 