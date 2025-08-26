// Ingredient Clash Engine
class IngredientClashEngine {
    constructor() {
        this.ingredientDatabase = {
            'Vitamin C': {
                incompatible: ['Niacinamide', 'Retinol', 'Benzoyl Peroxide'],
                warning: 'May cause irritation when combined with these ingredients'
            },
            'Retinol': {
                incompatible: ['Vitamin C', 'Benzoyl Peroxide', 'AHAs', 'BHAs'],
                warning: 'Can cause excessive dryness and irritation'
            },
            'Niacinamide': {
                incompatible: ['Vitamin C'],
                warning: 'May reduce effectiveness of Vitamin C'
            },
            'Benzoyl Peroxide': {
                incompatible: ['Vitamin C', 'Retinol'],
                warning: 'Can cause severe irritation and dryness'
            },
            'AHAs': {
                incompatible: ['Retinol', 'BHAs'],
                warning: 'May cause excessive exfoliation'
            },
            'BHAs': {
                incompatible: ['Retinol', 'AHAs'],
                warning: 'May cause excessive exfoliation'
            }
        };
    }

    async checkCompatibility(products) {
        const ingredients = await this.extractIngredients(products);
        const clashes = this.findClashes(ingredients);
        return this.generateReport(clashes);
    }

    async extractIngredients(products) {
        // In a real implementation, this would query a product database
        // For now, we'll use a mock implementation
        const mockIngredients = {
            'Product 1': ['Vitamin C', 'Hyaluronic Acid'],
            'Product 2': ['Niacinamide', 'Peptides'],
            'Product 3': ['Retinol', 'Ceramides']
        };

        return products.map(product => mockIngredients[product] || []);
    }

    findClashes(ingredientsList) {
        const clashes = [];
        const allIngredients = ingredientsList.flat();

        for (let i = 0; i < allIngredients.length; i++) {
            const ingredient = allIngredients[i];
            const ingredientData = this.ingredientDatabase[ingredient];

            if (!ingredientData) continue;

            for (let j = i + 1; j < allIngredients.length; j++) {
                const otherIngredient = allIngredients[j];
                if (ingredientData.incompatible.includes(otherIngredient)) {
                    clashes.push({
                        ingredient1: ingredient,
                        ingredient2: otherIngredient,
                        warning: ingredientData.warning
                    });
                }
            }
        }

        return clashes;
    }

    generateReport(clashes) {
        if (clashes.length === 0) {
            return {
                status: 'safe',
                message: 'No ingredient clashes detected. These products are safe to use together.',
                clashes: []
            };
        }

        return {
            status: 'warning',
            message: 'Potential ingredient clashes detected:',
            clashes: clashes.map(clash => ({
                ingredients: `${clash.ingredient1} + ${clash.ingredient2}`,
                warning: clash.warning
            }))
        };
    }
}

// Initialize the engine
const clashEngine = new IngredientClashEngine();

// Event listeners for the ingredient clash UI
document.addEventListener('DOMContentLoaded', () => {
    const checkButton = document.querySelector('button:contains("Check Compatibility")');
    if (checkButton) {
        checkButton.addEventListener('click', async () => {
            const productSelects = document.querySelectorAll('select');
            const selectedProducts = Array.from(productSelects)
                .map(select => select.value)
                .filter(value => value !== 'Select Product');

            if (selectedProducts.length < 2) {
                alert('Please select at least 2 products to check compatibility');
                return;
            }

            const result = await clashEngine.checkCompatibility(selectedProducts);
            displayCompatibilityResult(result);
        });
    }
});

function displayCompatibilityResult(result) {
    const resultContainer = document.createElement('div');
    resultContainer.className = 'compatibility-result mt-4 p-4 rounded-xl';
    resultContainer.style.backgroundColor = result.status === 'safe' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)';

    const statusIcon = result.status === 'safe' ? '✅' : '⚠️';
    resultContainer.innerHTML = `
        <div class="flex items-center space-x-2 mb-2">
            <span class="text-2xl">${statusIcon}</span>
            <span class="text-white font-bold">${result.message}</span>
        </div>
        ${result.clashes.map(clash => `
            <div class="mt-2 p-2 bg-white/10 rounded-lg">
                <div class="font-bold text-white">${clash.ingredients}</div>
                <div class="text-white/80">${clash.warning}</div>
            </div>
        `).join('')}
    `;

    const existingResult = document.querySelector('.compatibility-result');
    if (existingResult) {
        existingResult.remove();
    }

    document.querySelector('.bento-card:contains("Ingredient Clash Engine")').appendChild(resultContainer);
}

// Export for use in other modules
export default clashEngine; 