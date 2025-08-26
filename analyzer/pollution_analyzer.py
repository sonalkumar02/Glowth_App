import requests
from typing import Dict, Union, Tuple
import math
from datetime import datetime

class PollutionAnalyzer:
    def __init__(self, api_key: str):
        self.api_key = "1750030828c7204e4c73d2305ed627e1"
        self.base_url = "http://api.openweathermap.org/data/2.5"
        
    def get_weather_data(self, lat: float, lon: float) -> Dict:
        """Fetch both air pollution and weather data."""
        try:
            # Get air pollution data
            pollution_response = requests.get(
                f"{self.base_url}/air_pollution?lat={lat}&lon={lon}&appid={self.api_key}"
            )
            pollution_response.raise_for_status()
            pollution_data = pollution_response.json()
            
            # Get weather data
            weather_response = requests.get(
                f"{self.base_url}/weather?lat={lat}&lon={lon}&appid={self.api_key}"
            )
            weather_response.raise_for_status()
            weather_data = weather_response.json()
            
            return {
                'pollution': pollution_data,
                'weather': weather_data
            }
        except requests.RequestException as e:
            print(f"Error fetching data: {e}")
            return None

    def calculate_pollution_score(
        self, 
        data: Dict, 
        skin_tone: str
    ) -> Tuple[int, Dict[str, float]]:
        """Calculate enhanced pollution impact score based on multiple factors."""
        if not data or 'pollution' not in data or 'weather' not in data:
            return 0, {}
            
        components = data['pollution']['list'][0]['components']
        weather = data['weather']['main']
        
        # Enhanced weights for different pollutants
        weights = {
            'pm2_5': 0.25,  # Fine particles
            'pm10': 0.15,   # Coarse particles
            'no2': 0.15,    # Nitrogen dioxide
            'so2': 0.15,    # Sulfur dioxide
            'o3': 0.15,     # Ozone
            'co': 0.15      # Carbon monoxide
        }
        
        # Enhanced skin tone sensitivity factors with seasonal adjustments
        base_sensitivity = {
            'Light': 1.3,
            'Medium': 1.0,
            'Dark': 0.7
        }
        
        # Get current month for seasonal adjustment
        current_month = datetime.now().month
        seasonal_factor = self._get_seasonal_factor(current_month)
        
        # Calculate individual pollutant scores (0-100)
        scores = {}
        scores['pm2_5'] = min(100, (components['pm2_5'] / 25) * 100)  # WHO guideline: 25 μg/m³
        scores['pm10'] = min(100, (components['pm10'] / 50) * 100)    # WHO guideline: 50 μg/m³
        scores['no2'] = min(100, (components['no2'] / 200) * 100)     # WHO guideline: 200 μg/m³
        scores['so2'] = min(100, (components['so2'] / 20) * 100)      # WHO guideline: 20 μg/m³
        scores['o3'] = min(100, (components['o3'] / 100) * 100)       # WHO guideline: 100 μg/m³
        scores['co'] = min(100, (components['co'] / 4000) * 100)      # WHO guideline: 4000 μg/m³
        
        # Calculate environmental factors
        humidity_factor = self._calculate_humidity_factor(weather.get('humidity', 50))
        temperature_factor = self._calculate_temperature_factor(weather.get('temp', 20))
        
        # Calculate weighted score with environmental factors
        weighted_score = sum(
            scores[pollutant] * weights[pollutant] 
            for pollutant in weights
        )
        
        # Apply all factors
        final_score = (
            weighted_score * 
            base_sensitivity.get(skin_tone, 1.0) * 
            seasonal_factor * 
            humidity_factor * 
            temperature_factor
        )
        
        return min(100, int(final_score)), scores

    def _get_seasonal_factor(self, month: int) -> float:
        """Calculate seasonal impact factor."""
        # Higher impact in summer (UV exposure) and winter (dry air)
        if month in [12, 1, 2]:  # Winter
            return 1.2
        elif month in [6, 7, 8]:  # Summer
            return 1.3
        elif month in [3, 4, 5]:  # Spring
            return 1.1
        else:  # Fall
            return 1.0

    def _calculate_humidity_factor(self, humidity: float) -> float:
        """Calculate humidity impact factor."""
        if humidity < 30:  # Very dry
            return 1.3
        elif humidity < 50:  # Dry
            return 1.2
        elif humidity > 80:  # Very humid
            return 1.2
        else:  # Ideal humidity
            return 1.0

    def _calculate_temperature_factor(self, temp: float) -> float:
        """Calculate temperature impact factor."""
        if temp < 5:  # Very cold
            return 1.3
        elif temp < 15:  # Cold
            return 1.2
        elif temp > 30:  # Hot
            return 1.2
        else:  # Ideal temperature
            return 1.0

    def get_risk_messages(self, scores: Dict[str, float]) -> Dict[str, str]:
        """Generate detailed risk messages based on pollutant scores."""
        messages = {
            'pm2_5': '',
            'pm10': '',
            'no2': '',
            'so2': '',
            'o3': '',
            'co': ''
        }
        
        # PM2.5 risk messages
        if scores['pm2_5'] > 80:
            messages['pm2_5'] = "Critical risk of premature aging, dullness, and inflammation"
        elif scores['pm2_5'] > 60:
            messages['pm2_5'] = "High risk of skin dullness, fine lines, and barrier damage"
        elif scores['pm2_5'] > 40:
            messages['pm2_5'] = "Moderate risk of skin dullness and early aging signs"
        else:
            messages['pm2_5'] = "Low risk of PM2.5-related skin issues"
            
        # PM10 risk messages
        if scores['pm10'] > 80:
            messages['pm10'] = "Critical risk of clogged pores and acne breakouts"
        elif scores['pm10'] > 60:
            messages['pm10'] = "High risk of skin irritation and pore congestion"
        elif scores['pm10'] > 40:
            messages['pm10'] = "Moderate risk of skin congestion"
        else:
            messages['pm10'] = "Low risk of PM10-related issues"
            
        # NO2 risk messages
        if scores['no2'] > 80:
            messages['no2'] = "Critical risk of sensitivity, pigmentation, and barrier damage"
        elif scores['no2'] > 60:
            messages['no2'] = "High risk of skin sensitivity and uneven tone"
        elif scores['no2'] > 40:
            messages['no2'] = "Moderate risk of sensitivity"
        else:
            messages['no2'] = "Low risk of NO2-related issues"
            
        # SO2 risk messages
        if scores['so2'] > 80:
            messages['so2'] = "Critical risk of irritation and inflammation"
        elif scores['so2'] > 60:
            messages['so2'] = "High risk of skin irritation"
        elif scores['so2'] > 40:
            messages['so2'] = "Moderate risk of sensitivity"
        else:
            messages['so2'] = "Low risk of SO2-related issues"
            
        # Ozone risk messages
        if scores['o3'] > 80:
            messages['o3'] = "Critical risk of oxidative stress and premature aging"
        elif scores['o3'] > 60:
            messages['o3'] = "High risk of free radical damage and collagen breakdown"
        elif scores['o3'] > 40:
            messages['o3'] = "Moderate risk of oxidative stress"
        else:
            messages['o3'] = "Low risk of ozone damage"
            
        # CO risk messages
        if scores['co'] > 80:
            messages['co'] = "Critical risk of skin dullness and poor oxygenation"
        elif scores['co'] > 60:
            messages['co'] = "High risk of skin dullness"
        elif scores['co'] > 40:
            messages['co'] = "Moderate risk of skin dullness"
        else:
            messages['co'] = "Low risk of CO-related issues"
            
        return messages

    def get_recommendations(
        self, 
        score: int, 
        skin_tone: str,
        skin_conditions: Dict[str, float],
        age: int
    ) -> Dict[str, list]:
        """Get enhanced skincare recommendations based on multiple factors."""
        recommendations = {
            'ingredients': [],
            'product_types': [],
            'lifestyle_tips': []
        }
        
        # Base recommendations for all pollution levels
        recommendations['ingredients'].extend([
            'Vitamin C',
            'Niacinamide',
            'Antioxidants',
            'Ceramides'
        ])
        
        # Age-specific ingredients
        if age < 25:
            recommendations['ingredients'].extend([
                'Hyaluronic Acid',
                'Salicylic Acid',
                'Tea Tree Oil'
            ])
        elif age < 35:
            recommendations['ingredients'].extend([
                'Retinol',
                'Peptides',
                'Vitamin E'
            ])
        elif age < 45:
            recommendations['ingredients'].extend([
                'Retinol',
                'Peptides',
                'Coenzyme Q10',
                'Hyaluronic Acid'
            ])
        else:
            recommendations['ingredients'].extend([
                'Retinol',
                'Peptides',
                'Coenzyme Q10',
                'Growth Factors'
            ])
        
        # Additional recommendations based on pollution score
        if score > 70:
            recommendations['ingredients'].extend([
                'Ferulic Acid',
                'Resveratrol',
                'Coenzyme Q10',
                'Peptides',
                'Hyaluronic Acid'
            ])
            recommendations['product_types'].extend([
                'Barrier creams',
                'Heavy-duty moisturizers',
                'Double cleansing routine',
                'Antioxidant serums',
                'Sunscreen (SPF 50+)'
            ])
            recommendations['lifestyle_tips'].extend([
                'Use air purifier indoors',
                'Wear protective clothing',
                'Avoid outdoor activities during peak pollution hours',
                'Stay hydrated'
            ])
        elif score > 40:
            recommendations['ingredients'].extend([
                'Vitamin C',
                'Niacinamide',
                'Antioxidants'
            ])
            recommendations['product_types'].extend([
                'Light moisturizers',
                'Gentle cleansers',
                'Antioxidant serums',
                'Sunscreen (SPF 30+)'
            ])
            recommendations['lifestyle_tips'].extend([
                'Stay hydrated',
                'Use antioxidant-rich skincare',
                'Wear sunscreen daily'
            ])
        
        # Age-specific product types
        if age < 25:
            recommendations['product_types'].extend([
                'Oil-free moisturizers',
                'Acne treatments',
                'Lightweight serums'
            ])
        elif age < 35:
            recommendations['product_types'].extend([
                'Anti-aging serums',
                'Eye creams',
                'Hydrating masks'
            ])
        elif age < 45:
            recommendations['product_types'].extend([
                'Anti-aging creams',
                'Firming serums',
                'Rich moisturizers'
            ])
        else:
            recommendations['product_types'].extend([
                'Rich anti-aging creams',
                'Firming treatments',
                'Intensive eye creams'
            ])
        
        # Age-specific lifestyle tips
        if age < 25:
            recommendations['lifestyle_tips'].extend([
                'Establish a consistent skincare routine',
                'Use non-comedogenic products',
                'Start using sunscreen daily'
            ])
        elif age < 35:
            recommendations['lifestyle_tips'].extend([
                'Incorporate anti-aging products',
                'Use eye cream regularly',
                'Maintain a healthy diet'
            ])
        elif age < 45:
            recommendations['lifestyle_tips'].extend([
                'Focus on collagen production',
                'Use targeted treatments',
                'Consider professional treatments'
            ])
        else:
            recommendations['lifestyle_tips'].extend([
                'Use intensive anti-aging products',
                'Consider professional treatments',
                'Maintain a healthy lifestyle'
            ])
        
        return recommendations

def get_pollution_impact(
    city_or_coords: Union[str, Tuple[float, float]],
    skin_tone: str,
    api_key: str
) -> Dict:
    """
    Main function to get enhanced pollution impact analysis.
    
    Args:
        city_or_coords: Either city name (str) or tuple of (latitude, longitude)
        skin_tone: 'Light', 'Medium', or 'Dark'
        api_key: OpenWeatherMap API key
        
    Returns:
        Dictionary containing:
        - pollution_score: int (0-100)
        - risk_messages: dict of risk messages
        - recommendations: dict of ingredients, product types, and lifestyle tips
    """
    analyzer = PollutionAnalyzer(api_key)
    
    # Get coordinates if city name is provided
    if isinstance(city_or_coords, str):
        # TODO: Implement geocoding to get coordinates from city name
        raise NotImplementedError("City name to coordinates conversion not implemented")
    
    lat, lon = city_or_coords
    
    # Get weather and pollution data
    data = analyzer.get_weather_data(lat, lon)
    
    # Calculate pollution score
    score, component_scores = analyzer.calculate_pollution_score(data, skin_tone)
    
    # Get risk messages
    risk_messages = analyzer.get_risk_messages(component_scores)
    
    # Get recommendations
    recommendations = analyzer.get_recommendations(score, skin_tone, component_scores, 30)
    
    return {
        'pollution_score': score,
        'risk_messages': risk_messages,
        'recommendations': recommendations
    }

# Example usage:
if __name__ == "__main__":
    API_KEY = "1750030828c7204e4c73d2305ed627e1"  # OpenWeatherMap API key
    
    # Example with coordinates
    result = get_pollution_impact(
        city_or_coords=(28.6139, 77.2090),  # Delhi coordinates
        skin_tone="Medium",
        api_key=API_KEY
    )
    
    print("Pollution Score:", result['pollution_score'])
    print("\nRisk Messages:")
    for pollutant, message in result['risk_messages'].items():
        print(f"{pollutant}: {message}")
    print("\nRecommendations:")
    print("Ingredients:", result['recommendations']['ingredients'])
    print("Product Types:", result['recommendations']['product_types'])
    print("Lifestyle Tips:", result['recommendations']['lifestyle_tips']) 