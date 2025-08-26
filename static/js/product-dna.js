// Product DNA System
class ProductDNA {
    constructor() {
        this.userProfile = null;
        this.topProducts = [];
        this.initializeProductDNA();
    }

    async initializeProductDNA() {
        await this.loadUserProfile();
        await this.loadTopProducts();
        this.updateUI();
    }

    async loadUserProfile() {
        // In a real implementation, this would load from Supabase
        this.userProfile = {
            skinType: 'combination',
            concerns: ['acne', 'dryness'],
            age: 25,
            location: 'Mumbai',
            climate: 'tropical',
            currentProducts: [
                { name: 'Vitamin C Serum', brand: 'Brand A', rating: 4.5 },
                { name: 'Hyaluronic Acid', brand: 'Brand B', rating: 4.2 }
            ]
        };
    }

    async loadTopProducts() {
        // In a real implementation, this would query a database of successful users
        this.topProducts = [
            {
                name: 'Vitamin C Serum',
                brand: 'Brand A',
                glowGain: 40,
                users: 150,
                skinTypes: ['combination', 'dry'],
                concerns: ['acne', 'dullness'],
                price: '₹1,999',
                rating: 4.8
            },
            {
                name: 'Niacinamide Serum',
                brand: 'Brand C',
                glowGain: 35,
                users: 120,
                skinTypes: ['oily', 'combination'],
                concerns: ['acne', 'oiliness'],
                price: '₹1,499',
                rating: 4.6
            },
            {
                name: 'Hyaluronic Acid',
                brand: 'Brand B',
                glowGain: 30,
                users: 200,
                skinTypes: ['dry', 'combination'],
                concerns: ['dryness', 'fine lines'],
                price: '₹1,299',
                rating: 4.7
            }
        ];
    }

    findMatchingProducts() {
        return this.topProducts.filter(product => {
            const skinTypeMatch = product.skinTypes.includes(this.userProfile.skinType);
            const concernMatch = product.concerns.some(concern => 
                this.userProfile.concerns.includes(concern)
            );
            return skinTypeMatch && concernMatch;
        }).sort((a, b) => b.glowGain - a.glowGain);
    }

    calculateProductScore(product) {
        let score = 0;
        const weights = {
            glowGain: 0.4,
            userCount: 0.3,
            rating: 0.3
        };

        // Normalize glow gain (assuming max is 100)
        score += (product.glowGain / 100) * weights.glowGain;

        // Normalize user count (assuming max is 1000)
        score += (product.users / 1000) * weights.userCount;

        // Normalize rating (max is 5)
        score += (product.rating / 5) * weights.rating;

        return score;
    }

    getProductInsights(product) {
        const insights = [];
        
        if (product.glowGain > 30) {
            insights.push(`High glow gain of ${product.glowGain}%`);
        }
        
        if (product.users > 100) {
            insights.push(`Popular among ${product.users} users`);
        }
        
        if (product.rating > 4.5) {
            insights.push(`Highly rated (${product.rating}/5)`);
        }

        return insights;
    }

    updateUI() {
        const container = document.querySelector('.bento-card:contains("Product DNA")');
        if (!container) return;

        const matchingProducts = this.findMatchingProducts();
        const productList = container.querySelector('.bg-white\\/10');
        
        if (matchingProducts.length > 0) {
            productList.innerHTML = `
                <div class="space-y-4">
                    <p class="text-white/80">Top products for your skin type:</p>
                    ${matchingProducts.slice(0, 3).map(product => `
                        <div class="p-3 bg-white/5 rounded-lg">
                            <div class="flex justify-between items-start">
                                <div>
                                    <h4 class="text-white font-bold">${product.name}</h4>
                                    <p class="text-white/60 text-sm">${product.brand}</p>
                                </div>
                                <div class="text-green-400 font-bold">+${product.glowGain}% glow</div>
                            </div>
                            <div class="mt-2 flex flex-wrap gap-2">
                                ${this.getProductInsights(product).map(insight => `
                                    <span class="text-xs bg-white/10 text-white/80 px-2 py-1 rounded-full">
                                        ${insight}
                                    </span>
                                `).join('')}
                            </div>
                            <div class="mt-2 flex justify-between items-center">
                                <span class="text-white/60">${product.price}</span>
                                <button class="bg-pink-500 text-white text-sm px-3 py-1 rounded-full">
                                    Learn More
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            productList.innerHTML = `
                <p class="text-white/80">Keep using the app to get personalized product recommendations!</p>
            `;
        }
    }

    async trackProductUsage(productId) {
        // In a real implementation, this would save to Supabase
        console.log('Tracking product usage:', productId);
    }

    async submitProductReview(productId, review) {
        // In a real implementation, this would save to Supabase
        console.log('Submitting product review:', { productId, review });
    }
}

// Initialize Product DNA
const productDNA = new ProductDNA();

// Export for use in other modules
export default productDNA; 