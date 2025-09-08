import matplotlib.pyplot as plt
import numpy as np
from PIL import Image
import io
from typing import Dict, List, Tuple, Union
import matplotlib.gridspec as gridspec
from datetime import datetime
import os
import matplotlib.pyplot as plt
import seaborn as sns  # <-- import seaborn

sns.set_theme()  # <-- set seaborn style globally

class SkinReportGenerator:
    def __init__(self):
        # Set style for better visualizations
        self.colors = {
            'primary': '#2E86C1',    # Blue
            'secondary': '#27AE60',  # Green
            'warning': '#E67E22',    # Orange
            'danger': '#E74C3C',     # Red
            'light': '#ECF0F1',      # Light Gray
            'dark': '#2C3E50'        # Dark Gray
        }
        
    def generate_charts(
        self,
        skin_conditions: Dict[str, float],
        pollution_score: float,
        overall_score: float
    ) -> Tuple[plt.Figure, List[plt.Axes]]:
        """Generate all charts for the skin report."""
        # Create figure with custom size and layout
        fig = plt.figure(figsize=(15, 10))
        gs = gridspec.GridSpec(2, 2, height_ratios=[1, 1.5])
        
        # 1. Overall Score Donut Chart
        ax1 = fig.add_subplot(gs[0, 0])
        self._create_donut_chart(ax1, overall_score, "Overall Skin Score")
        
        # 2. Pollution Impact Bar
        ax2 = fig.add_subplot(gs[0, 1])
        self._create_pollution_bar(ax2, pollution_score)
        
        # 3. Skin Conditions Bar Chart
        ax3 = fig.add_subplot(gs[1, :])
        self._create_conditions_bars(ax3, skin_conditions)
        
        plt.tight_layout()
        return fig, [ax1, ax2, ax3]
    
    def _create_donut_chart(self, ax: plt.Axes, score: float, title: str):
        """Create a donut chart for the overall skin score."""
        # Calculate the remaining percentage
        remaining = 100 - score
        
        # Create the donut chart
        wedges, texts, autotexts = ax.pie(
            [score, remaining],
            labels=['Score', 'Remaining'],
            colors=[self.colors['primary'], self.colors['light']],
            autopct='%1.1f%%',
            startangle=90,
            wedgeprops={'width': 0.5}
        )
        
        # Customize the appearance
        plt.setp(autotexts, size=12, weight="bold", color="white")
        plt.setp(texts, size=10)
        ax.set_title(title, pad=20, size=14, weight="bold")
        
        # Add score text in the center
        ax.text(0, 0, f"{score:.1f}", 
                horizontalalignment='center',
                verticalalignment='center',
                fontsize=20,
                weight="bold")
    
    def _create_pollution_bar(self, ax: plt.Axes, score: float):
        """Create a horizontal bar chart for pollution impact."""
        # Create the bar
        bars = ax.barh(['Pollution Impact'], [score], 
                      color=self._get_pollution_color(score))
        
        # Customize the appearance
        ax.set_xlim(0, 100)
        ax.set_xticks([0, 25, 50, 75, 100])
        ax.set_xticklabels(['Low', 'Moderate', 'High', 'Very High', 'Critical'])
        ax.set_title("Pollution Impact Score", pad=20, size=14, weight="bold")
        
        # Add value label
        ax.text(score + 2, 0, f"{score:.1f}%", 
                verticalalignment='center',
                fontsize=12,
                weight="bold")
    
    def _create_conditions_bars(self, ax: plt.Axes, conditions: Dict[str, float]):
        """Create a bar chart for skin conditions."""
        # Prepare data
        conditions_list = list(conditions.keys())
        values = list(conditions.values())
        
        # Create bars
        bars = ax.bar(conditions_list, values, 
                     color=[self._get_condition_color(v) for v in values])
        
        # Customize the appearance
        ax.set_ylim(0, 100)
        ax.set_ylabel('Percentage')
        ax.set_title("Skin Conditions Analysis", pad=20, size=14, weight="bold")
        
        # Rotate x-axis labels for better readability
        plt.setp(ax.get_xticklabels(), rotation=45, ha='right')
        
        # Add value labels on top of bars
        for bar in bars:
            height = bar.get_height()
            ax.text(bar.get_x() + bar.get_width()/2., height,
                   f'{height:.1f}%',
                   ha='center', va='bottom')
    
    def _get_pollution_color(self, score: float) -> str:
        """Get color based on pollution score."""
        if score < 25:
            return self.colors['secondary']
        elif score < 50:
            return self.colors['primary']
        elif score < 75:
            return self.colors['warning']
        else:
            return self.colors['danger']
    
    def _get_condition_color(self, value: float) -> str:
        """Get color based on condition value."""
        if value < 25:
            return self.colors['secondary']
        elif value < 50:
            return self.colors['primary']
        elif value < 75:
            return self.colors['warning']
        else:
            return self.colors['danger']
    
    def generate_report(
        self,
        image_path: str,
        skin_analysis: Dict,
        pollution_data: Dict,
        pollution_score: int,
        recommendations: Dict[str, list]
    ) -> str:
        """Generate a comprehensive skin analysis report."""
        # Create figure with subplots
        fig = plt.figure(figsize=(15, 20))
        gs = gridspec.GridSpec(4, 2, figure=fig)
        
        # Add face image
        ax1 = fig.add_subplot(gs[0, 0])
        img = plt.imread(image_path)
        ax1.imshow(img)
        ax1.axis('off')
        ax1.set_title('Facial Analysis', fontsize=12, pad=10)
        
        # Add age analysis
        ax2 = fig.add_subplot(gs[0, 1])
        age_text = (
            f"Actual Age: {skin_analysis['age_analysis']['actual_age']} years\n"
            f"Perceived Age: {skin_analysis['age_analysis']['perceived_age']} years\n"
            f"Age Difference: {skin_analysis['age_analysis']['age_difference']} years\n"
            f"Eye Age: {skin_analysis['age_analysis']['eye_age']} years\n"
            f"Eye Age Difference: {skin_analysis['age_analysis']['eye_age_difference']} years"
        )
        ax2.text(0.5, 0.5, age_text, 
                ha='center', va='center', 
                fontsize=12, 
                bbox=dict(facecolor='white', alpha=0.8))
        ax2.axis('off')
        ax2.set_title('Age Analysis', fontsize=12, pad=10)
        
        # Add skin conditions bar chart
        ax3 = fig.add_subplot(gs[1, :])
        conditions = list(skin_analysis['conditions'].keys())
        scores = list(skin_analysis['conditions'].values())
        ax3.bar(conditions, scores, color='skyblue')
        ax3.set_title('Skin Conditions Analysis', fontsize=12, pad=10)
        ax3.set_ylim(0, 100)
        plt.xticks(rotation=45, ha='right')
        
        # Add pollution impact
        ax4 = fig.add_subplot(gs[2, 0])
        pollution_text = (
            f"Pollution Score: {pollution_score}/100\n"
            f"PM2.5: {pollution_data['pm2_5']} μg/m³\n"
            f"O3: {pollution_data['o3']} μg/m³\n"
            f"NO2: {pollution_data['no2']} μg/m³"
        )
        ax4.text(0.5, 0.5, pollution_text,
                ha='center', va='center',
                fontsize=12,
                bbox=dict(facecolor='white', alpha=0.8))
        ax4.axis('off')
        ax4.set_title('Environmental Impact', fontsize=12, pad=10)
        
        # Add recommendations
        ax5 = fig.add_subplot(gs[2, 1])
        rec_text = (
            "Recommended Ingredients:\n" + 
            "\n".join(f"• {ing}" for ing in recommendations['ingredients'][:5]) +
            "\n\nRecommended Products:\n" +
            "\n".join(f"• {prod}" for prod in recommendations['product_types'][:5]) +
            "\n\nLifestyle Tips:\n" +
            "\n".join(f"• {tip}" for tip in recommendations['lifestyle_tips'][:5])
        )
        ax5.text(0.5, 0.5, rec_text,
                ha='center', va='center',
                fontsize=10,
                bbox=dict(facecolor='white', alpha=0.8))
        ax5.axis('off')
        ax5.set_title('Personalized Recommendations', fontsize=12, pad=10)
        
        # Add timestamp
        ax6 = fig.add_subplot(gs[3, :])
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        ax6.text(0.5, 0.5, f"Report generated on: {timestamp}",
                ha='center', va='center',
                fontsize=10)
        ax6.axis('off')
        
        # Adjust layout and save
        plt.tight_layout()
        report_filename = f"skin_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
        report_path = os.path.join(self.report_dir, report_filename)
        plt.savefig(report_path, dpi=300, bbox_inches='tight')
        plt.close()
        
        return report_filename
    
    def _add_face_image(self, ax: plt.Axes, image_path: str):
        """Add the face image to the report."""
        try:
            img = Image.open(image_path)
            ax.imshow(img)
            ax.axis('off')
            ax.set_title("Face Analysis", pad=20, size=14, weight="bold")
        except Exception as e:
            print(f"Error loading image: {e}")
            ax.text(0.5, 0.5, "Image not available",
                   horizontalalignment='center',
                   verticalalignment='center',
                   transform=ax.transAxes)

# Example usage
if __name__ == "__main__":
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
    
    # Generate report with sample data
    generator.generate_report(
        image_path="path_to_face_image.jpg",  # Replace with actual image path
        skin_analysis={
            'age_analysis': {
                'actual_age': 30,
                'perceived_age': 28,
                'age_difference': 2,
                'eye_age': 25,
                'eye_age_difference': 3
            },
            'conditions': skin_conditions
        },
        pollution_data={
            'pm2_5': 50,
            'o3': 30,
            'no2': 20
        },
        pollution_score=75,
        recommendations={
            'ingredients': ['Retinol', 'Hyaluronic Acid', 'Vitamin C'],
            'product_types': ['Moisturizer', 'Serum', 'Face Mask'],
            'lifestyle_tips': ['Drink plenty of water', 'Use sunscreen', 'Avoid smoking']
        }
    ) 