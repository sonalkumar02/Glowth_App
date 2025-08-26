import numpy as np
from PIL import Image
from skin_report_generator import SkinReportGenerator

def create_sample_image():
    """Create a sample face image for testing."""
    # Create a 400x400 RGB image with a gradient
    img = np.zeros((400, 400, 3), dtype=np.uint8)
    
    # Add a gradient background
    for i in range(400):
        for j in range(400):
            img[i, j] = [
                int(200 + 55 * np.sin(i/50)),  # R
                int(180 + 55 * np.cos(j/50)),  # G
                int(160 + 55 * np.sin((i+j)/50))  # B
            ]
    
    # Save the image
    Image.fromarray(img).save('sample_face.jpg')
    return 'sample_face.jpg'

def main():
    # Create sample image
    image_path = create_sample_image()
    
    # Create sample data
    skin_conditions = {
        'Acne': 15.5,
        'Pores': 35.2,
        'Oiliness': 42.8,
        'Pigmentation': 28.4,
        'Dark Circles': 45.6,
        'Wrinkles': 12.3
    }
    
    # Initialize generator
    generator = SkinReportGenerator()
    
    # Generate report
    generator.generate_report(
        image_path=image_path,
        skin_conditions=skin_conditions,
        pollution_score=75.5,
        overall_score=68.2,
        output_path="skin_analysis_report.png"
    )
    
    print("Report generated successfully!")

if __name__ == "__main__":
    main() 