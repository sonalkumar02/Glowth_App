// GlowPro page functionality
document.addEventListener('DOMContentLoaded', function() {
    const glowProButton = document.querySelector('[data-page="glowpro"]');
    const glowProPage = document.getElementById('glowpro-page');

    // Function to show GlowPro page
    function showGlowProPage() {
        // Hide all other pages
        document.querySelectorAll('.page-content').forEach(page => {
            page.style.display = 'none';
        });
        
        // Show GlowPro page
        if (glowProPage) {
            glowProPage.style.display = 'block';
        }
        
        // Update active state in sidebar
        document.querySelectorAll('.sidebar-icon').forEach(item => {
            item.classList.remove('active-icon');
        });
        if (glowProButton) {
            glowProButton.classList.add('active-icon');
        }
    }

    // Add click event listener to GlowPro button
    if (glowProButton) {
        glowProButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            showGlowProPage();
        });
    }

    // Handle subscription button clicks
    const subscriptionButtons = document.querySelectorAll('.bento-card button');
    subscriptionButtons.forEach(button => {
        button.addEventListener('click', function() {
            const plan = this.closest('.bento-card').querySelector('h3').textContent;
            const price = this.closest('.bento-card').querySelector('.text-3xl').textContent;
            
            // Show subscription modal
            showSubscriptionModal(plan, price);
        });
    });

    // Function to show subscription modal
    function showSubscriptionModal(plan, price) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4 transform transition-all">
                <h3 class="text-2xl font-bold text-gray-800 mb-4">Subscribe to ${plan}</h3>
                <p class="text-gray-600 mb-6">You're about to subscribe to the ${plan} plan for ${price}</p>
                
                <div class="space-y-4">
                    <div class="flex items-center">
                        <input type="checkbox" id="terms" class="mr-2">
                        <label for="terms" class="text-sm text-gray-600">I agree to the terms and conditions</label>
                    </div>
                    
                    <div class="flex items-center">
                        <input type="checkbox" id="auto-renew" class="mr-2">
                        <label for="auto-renew" class="text-sm text-gray-600">Enable auto-renewal</label>
                    </div>
                </div>
                
                <div class="mt-8 flex space-x-4">
                    <button class="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors" onclick="this.closest('.fixed').remove()">
                        Cancel
                    </button>
                    <button class="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white py-2 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-600 transition-colors" onclick="handleSubscription('${plan}', '${price}')">
                        Subscribe Now
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // Function to handle subscription
    window.handleSubscription = function(plan, price) {
        const terms = document.getElementById('terms');
        const autoRenew = document.getElementById('auto-renew');
        
        if (!terms.checked) {
            alert('Please agree to the terms and conditions');
            return;
        }
        
        // Here you would typically integrate with a payment gateway
        console.log(`Subscribing to ${plan} for ${price}`);
        
        // Show success message
        const modal = document.querySelector('.fixed');
        if (modal) {
            modal.innerHTML = `
                <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4 transform transition-all">
                    <div class="text-center">
                        <div class="text-5xl mb-4">🎉</div>
                        <h3 class="text-2xl font-bold text-gray-800 mb-2">Subscription Successful!</h3>
                        <p class="text-gray-600 mb-6">Welcome to the ${plan} plan!</p>
                        <button class="bg-gradient-to-r from-pink-500 to-purple-500 text-white py-2 px-6 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-600 transition-colors" onclick="this.closest('.fixed').remove()">
                            Get Started
                        </button>
                    </div>
                </div>
            `;
        }
    };
}); 