// Smart Skin Forecast System
class SmartSkinForecast {
    constructor() {
        this.forecastWindow = 7; // days
        this.weatherAPIKey = ''; // Add your weather API key here
        this.initializeForecast();
    }

    async initializeForecast() {
        this.userData = await this.loadUserData();
        this.weatherData = await this.fetchWeatherData();
        this.updateForecast();
    }

    async loadUserData() {
        // In a real implementation, this would load from Supabase
        return {
            skinType: 'combination',
            currentConditions: ['mild acne', 'dryness'],
            routine: {
                moisturizer: 3, // times per week
                cleanser: 7,
                sunscreen: 5
            },
            stressLevel: 3, // 1-5 scale
            sleepHours: 7
        };
    }

    async fetchWeatherData() {
        // In a real implementation, this would call a weather API
        return {
            temperature: 25,
            humidity: 60,
            uvIndex: 7,
            forecast: Array(7).fill().map((_, i) => ({
                day: i + 1,
                temperature: 25 + Math.random() * 5,
                humidity: 60 + Math.random() * 10,
                uvIndex: 5 + Math.random() * 5
            }))
        };
    }

    updateForecast() {
        const forecast = this.generateForecast();
        this.displayForecast(forecast);
    }

    generateForecast() {
        const forecast = [];
        const { routine, currentConditions, stressLevel, sleepHours } = this.userData;

        for (let i = 0; i < this.forecastWindow; i++) {
            const dayForecast = {
                day: i + 1,
                conditions: this.predictConditions(i),
                recommendations: this.generateRecommendations(i)
            };
            forecast.push(dayForecast);
        }

        return forecast;
    }

    predictConditions(dayOffset) {
        const conditions = [];
        const { routine, currentConditions } = this.userData;
        const weather = this.weatherData.forecast[dayOffset];

        // Predict acne based on routine and weather
        if (routine.moisturizer < 4 && weather.humidity < 50) {
            conditions.push({
                type: 'acne',
                severity: 'moderate',
                probability: 0.7,
                reason: 'Low humidity and insufficient moisturizer use'
            });
        }

        // Predict dryness based on weather
        if (weather.humidity < 40) {
            conditions.push({
                type: 'dryness',
                severity: 'mild',
                probability: 0.6,
                reason: 'Low humidity conditions'
            });
        }

        // Predict UV damage risk
        if (weather.uvIndex > 6 && this.userData.routine.sunscreen < 5) {
            conditions.push({
                type: 'uv_damage',
                severity: 'high',
                probability: 0.8,
                reason: 'High UV index and inconsistent sunscreen use'
            });
        }

        return conditions;
    }

    generateRecommendations(dayOffset) {
        const recommendations = [];
        const conditions = this.predictConditions(dayOffset);

        conditions.forEach(condition => {
            switch (condition.type) {
                case 'acne':
                    recommendations.push({
                        action: 'Increase moisturizer use',
                        urgency: 'high',
                        impact: 'Prevent acne flare-up'
                    });
                    break;
                case 'dryness':
                    recommendations.push({
                        action: 'Apply hydrating serum',
                        urgency: 'medium',
                        impact: 'Maintain skin barrier'
                    });
                    break;
                case 'uv_damage':
                    recommendations.push({
                        action: 'Apply SPF 50+ sunscreen',
                        urgency: 'high',
                        impact: 'Prevent UV damage'
                    });
                    break;
            }
        });

        return recommendations;
    }

    displayForecast(forecast) {
        const forecastContainer = document.querySelector('.bento-card:contains("Smart Skin Forecast") .bg-white\\/10');
        if (!forecastContainer) return;

        const mostUrgentForecast = forecast.find(day => 
            day.conditions.some(condition => condition.probability > 0.6)
        );

        if (mostUrgentForecast) {
            const urgentCondition = mostUrgentForecast.conditions.find(c => c.probability > 0.6);
            const recommendation = mostUrgentForecast.recommendations[0];

            forecastContainer.innerHTML = `
                <div class="space-y-2">
                    <p class="text-white/80">
                        ⚠️ ${urgentCondition.type.replace('_', ' ')} likely to worsen in ${mostUrgentForecast.day} days
                    </p>
                    <p class="text-white/80">
                        ${recommendation.action} to ${recommendation.impact.toLowerCase()}
                    </p>
                </div>
            `;
        } else {
            forecastContainer.innerHTML = `
                <p class="text-white/80">
                    Your skin is expected to remain stable for the next 7 days. Keep up your current routine!
                </p>
            `;
        }
    }
}

// Initialize the forecast system
const skinForecast = new SmartSkinForecast();

// Export for use in other modules
export default skinForecast; 