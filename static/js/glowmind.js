// GlowMind Stress Tracking System
class GlowMind {
    constructor() {
        this.moodHistory = [];
        this.stressHistory = [];
        this.skinConditionHistory = [];
        this.initializeGlowMind();
    }

    async initializeGlowMind() {
        await this.loadHistory();
        this.setupEventListeners();
        this.updateUI();
    }

    async loadHistory() {
        // In a real implementation, this would load from Supabase
        this.moodHistory = [
            { date: '2024-03-01', mood: 4, stress: 2 },
            { date: '2024-03-02', mood: 3, stress: 3 },
            { date: '2024-03-03', mood: 5, stress: 1 }
        ];

        this.skinConditionHistory = [
            { date: '2024-03-01', conditions: ['mild acne'] },
            { date: '2024-03-02', conditions: ['moderate acne'] },
            { date: '2024-03-03', conditions: ['mild acne'] }
        ];
    }

    setupEventListeners() {
        const moodButtons = document.querySelectorAll('.glowmind-mood-button');
        moodButtons.forEach(button => {
            button.addEventListener('click', () => this.logMood(button.dataset.mood));
        });
    }

    async logMood(moodLevel) {
        const today = new Date().toISOString().split('T')[0];
        const moodEntry = {
            date: today,
            mood: parseInt(moodLevel),
            stress: this.calculateStressLevel(moodLevel)
        };

        this.moodHistory.push(moodEntry);
        await this.saveMoodEntry(moodEntry);
        this.updateUI();
        this.analyzeCorrelations();
    }

    calculateStressLevel(moodLevel) {
        // Simple inverse relationship between mood and stress
        return 6 - moodLevel;
    }

    async saveMoodEntry(entry) {
        // In a real implementation, this would save to Supabase
        console.log('Saving mood entry:', entry);
    }

    analyzeCorrelations() {
        const correlations = this.findCorrelations();
        this.displayCorrelations(correlations);
    }

    findCorrelations() {
        const correlations = [];
        const recentMoodHistory = this.moodHistory.slice(-7);
        const recentSkinHistory = this.skinConditionHistory.slice(-7);

        // Analyze stress to acne correlation
        const stressAcneCorrelation = this.calculateCorrelation(
            recentMoodHistory.map(entry => entry.stress),
            recentSkinHistory.map(entry => entry.conditions.includes('acne') ? 1 : 0)
        );

        if (Math.abs(stressAcneCorrelation) > 0.5) {
            correlations.push({
                type: 'stress_acne',
                correlation: stressAcneCorrelation,
                message: `When stress ${stressAcneCorrelation > 0 ? 'increases' : 'decreases'}, acne tends to ${stressAcneCorrelation > 0 ? 'worsen' : 'improve'}`
            });
        }

        return correlations;
    }

    calculateCorrelation(x, y) {
        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
        const sumX2 = x.reduce((a, b) => a + b * b, 0);
        const sumY2 = y.reduce((a, b) => a + b * b, 0);

        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

        return denominator === 0 ? 0 : numerator / denominator;
    }

    displayCorrelations(correlations) {
        const container = document.querySelector('.bento-card:contains("GlowMind") .bg-white\\/10');
        if (!container) return;

        if (correlations.length > 0) {
            container.innerHTML = `
                <div class="space-y-4">
                    <p class="text-white/80">Recent insights:</p>
                    ${correlations.map(corr => `
                        <div class="p-3 bg-white/5 rounded-lg">
                            <p class="text-white/90">${corr.message}</p>
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            container.innerHTML = `
                <p class="text-white/80">Keep logging your mood to discover patterns!</p>
            `;
        }
    }

    updateUI() {
        const container = document.querySelector('.bento-card:contains("GlowMind")');
        if (!container) return;

        const moodButtons = container.querySelectorAll('button');
        moodButtons.forEach(button => {
            button.classList.remove('ring-2', 'ring-pink-500');
            if (button.dataset.mood === this.getLatestMood()) {
                button.classList.add('ring-2', 'ring-pink-500');
            }
        });
    }

    getLatestMood() {
        if (this.moodHistory.length === 0) return null;
        return this.moodHistory[this.moodHistory.length - 1].mood.toString();
    }

    async startMeditation() {
        // In a real implementation, this would integrate with a meditation app
        console.log('Starting meditation session...');
    }
}

// Initialize GlowMind
const glowMind = new GlowMind();

// Export for use in other modules
export default glowMind; 