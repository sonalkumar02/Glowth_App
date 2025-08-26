// GlowShield page functionality
document.addEventListener('DOMContentLoaded', function() {
    const glowShieldButton = document.querySelector('[data-page="glowshield"]');
    const mainContent = document.getElementById('main-content');
    const glowShieldPage = document.getElementById('glowshield-page');

    // Function to fetch weather and pollution data
    async function fetchEnvironmentalData() {
        try {
            // Get user's location
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });

            // Fetch weather data (using OpenWeatherMap API)
            const weatherResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${position.coords.latitude}&lon=${position.coords.longitude}&appid=1750030828c7204e4c73d2305ed627e1&units=metric`);
            const weatherData = await weatherResponse.json();

            // Fetch air quality data (using OpenAQ API)
            const aqResponse = await fetch(`https://api.openaq.org/v2/latest?coordinates=${position.coords.latitude},${position.coords.longitude}`);
            const aqData = await aqResponse.json();

            return {
                weather: weatherData,
                airQuality: aqData
            };
        } catch (error) {
            console.error('Error fetching environmental data:', error);
            return null;
        }
    }

    // Function to update UV and AQI displays
    function updateEnvironmentalDisplay(data) {
        if (!data) return;

        const uvIndex = calculateUVIndex(data.weather);
        const aqi = data.airQuality.results[0]?.measurements[0]?.value || 0;

        // Update UV Index display
        const uvDisplay = document.querySelector('.uv-index-value');
        const uvRisk = document.querySelector('.uv-risk-level');
        const uvProgress = document.querySelector('.uv-progress-bar');
        if (uvDisplay && uvRisk && uvProgress) {
            uvDisplay.textContent = uvIndex;
            uvRisk.textContent = getUVRiskLevel(uvIndex);
            uvProgress.style.width = `${(uvIndex / 11) * 100}%`;
        }

        // Update AQI display
        const aqiDisplay = document.querySelector('.aqi-value');
        const aqiRisk = document.querySelector('.aqi-risk-level');
        const aqiProgress = document.querySelector('.aqi-progress-bar');
        if (aqiDisplay && aqiRisk && aqiProgress) {
            aqiDisplay.textContent = Math.round(aqi);
            aqiRisk.textContent = getAQIRiskLevel(aqi);
            aqiProgress.style.width = `${(aqi / 500) * 100}%`;
        }
    }

    // Function to calculate UV index based on weather data
    function calculateUVIndex(weatherData) {
        // This is a simplified calculation. In reality, you'd want to use a proper UV index API
        const hour = new Date().getHours();
        const isDaytime = hour > 6 && hour < 18;
        const baseUV = weatherData.main.temp / 10; // Simplified calculation
        return isDaytime ? Math.min(Math.round(baseUV * 1.5), 11) : 0;
    }

    // Function to get UV risk level
    function getUVRiskLevel(uvIndex) {
        if (uvIndex <= 2) return 'Low Risk';
        if (uvIndex <= 5) return 'Moderate Risk';
        if (uvIndex <= 7) return 'High Risk';
        if (uvIndex <= 10) return 'Very High Risk';
        return 'Extreme Risk';
    }

    // Function to get AQI risk level
    function getAQIRiskLevel(aqi) {
        if (aqi <= 50) return 'Good';
        if (aqi <= 100) return 'Moderate';
        if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
        if (aqi <= 200) return 'Unhealthy';
        if (aqi <= 300) return 'Very Unhealthy';
        return 'Hazardous';
    }

    // Function to get personalized product recommendations
    function getProductRecommendations(skinData) {
        // This would typically come from your skin analysis data
        const skinType = skinData?.skinType || 'combination';
        const concerns = skinData?.concerns || [];
        
        // Product database (in reality, this would come from your backend)
        const products = {
            'dry': [
                {
                    name: 'Hydrating Ceramide Serum',
                    image: 'https://example.com/ceramide-serum.jpg',
                    description: 'Rich in ceramides and hyaluronic acid for intense hydration',
                    skinType: 'Dry',
                    price: 29.99,
                    buyLink: 'https://example.com/buy-ceramide-serum'
                },
                // Add more products...
            ],
            'oily': [
                {
                    name: 'Oil-Control Niacinamide Serum',
                    image: 'https://example.com/niacinamide-serum.jpg',
                    description: 'Controls oil production and minimizes pores',
                    skinType: 'Oily',
                    price: 24.99,
                    buyLink: 'https://example.com/buy-niacinamide-serum'
                },
                // Add more products...
            ],
            // Add more skin types...
        };

        return products[skinType] || products['combination'];
    }

    // Function to update product recommendations
    function updateProductRecommendations(skinData) {
        const products = getProductRecommendations(skinData);
        const productContainer = document.querySelector('.product-recommendations');
        if (!productContainer) return;

        productContainer.innerHTML = products.map(product => `
            <div class="product-card transform hover:scale-105 transition-all duration-300">
                <div class="relative overflow-hidden rounded-t-lg">
                    <img src="${product.image}" alt="${product.name}" class="w-full h-48 object-cover">
                    <div class="absolute top-0 right-0 bg-gradient-to-l from-pink-500 to-purple-500 text-white px-3 py-1 rounded-bl-lg">
                        ${product.skinType}
                    </div>
                </div>
                <div class="p-4 bg-white">
                    <h4 class="font-bold text-lg mb-2">${product.name}</h4>
                    <p class="text-gray-600 text-sm mb-3">${product.description}</p>
                    <div class="flex justify-between items-center">
                        <span class="text-xl font-bold text-purple-600">$${product.price}</span>
                        <a href="${product.buyLink}" class="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all duration-300">
                            Buy Now
                        </a>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Function to show GlowShield page
    async function showGlowShieldPage() {
        // Hide all other pages
        document.querySelectorAll('.page-content').forEach(page => {
            page.style.display = 'none';
        });
        
        // Show GlowShield page
        if (glowShieldPage) {
            glowShieldPage.style.display = 'block';
            
            // Fetch and update environmental data
            const envData = await fetchEnvironmentalData();
            updateEnvironmentalDisplay(envData);

            // Get skin analysis data from your existing system
            const skinData = window.lastSkinAnalysis || {}; // This should be set when skin analysis is done
            updateProductRecommendations(skinData);
        }
        
        // Update active state in sidebar
        document.querySelectorAll('.sidebar-icon').forEach(item => {
            item.classList.remove('active-icon');
        });
        if (glowShieldButton) {
            glowShieldButton.classList.add('active-icon');
        }
    }

    // Add click event listener to GlowShield button
    if (glowShieldButton) {
        glowShieldButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            showGlowShieldPage();
        });
    }

    // Listen for skin analysis updates
    window.addEventListener('skinAnalysisComplete', function(e) {
        window.lastSkinAnalysis = e.detail;
        if (glowShieldPage.style.display === 'block') {
            updateProductRecommendations(e.detail);
        }
    });
}); 