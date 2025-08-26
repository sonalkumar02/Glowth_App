// Skin Twin Chat System
class SkinTwinChat {
    constructor() {
        this.currentTwin = null;
        this.chatHistory = [];
        this.initializeChat();
    }

    async initializeChat() {
        await this.loadUserProfile();
        this.setupEventListeners();
        this.updateUI();
    }

    async loadUserProfile() {
        // In a real implementation, this would load from Supabase
        this.userProfile = {
            skinType: 'combination',
            concerns: ['acne', 'dryness'],
            age: 25,
            location: 'Mumbai',
            routine: {
                morning: ['cleanser', 'vitamin c', 'moisturizer', 'sunscreen'],
                evening: ['cleanser', 'retinol', 'moisturizer']
            }
        };
    }

    setupEventListeners() {
        const findTwinButton = document.querySelector('button:contains("Find Twin")');
        if (findTwinButton) {
            findTwinButton.addEventListener('click', () => this.findSkinTwin());
        }
    }

    async findSkinTwin() {
        // In a real implementation, this would query a database of users
        const potentialTwins = await this.findPotentialTwins();
        this.currentTwin = this.selectBestMatch(potentialTwins);
        this.updateUI();
        this.initializeChat();
    }

    async findPotentialTwins() {
        // Mock implementation - in reality, this would query Supabase
        return [
            {
                id: 1,
                name: 'Sarah',
                skinType: 'combination',
                concerns: ['acne', 'dryness'],
                age: 26,
                location: 'Delhi',
                matchScore: 0.85
            },
            {
                id: 2,
                name: 'Priya',
                skinType: 'combination',
                concerns: ['acne'],
                age: 24,
                location: 'Bangalore',
                matchScore: 0.75
            }
        ];
    }

    selectBestMatch(potentialTwins) {
        return potentialTwins.reduce((best, current) => 
            current.matchScore > best.matchScore ? current : best
        );
    }

    calculateMatchScore(twin) {
        let score = 0;
        const weights = {
            skinType: 0.4,
            concerns: 0.3,
            age: 0.2,
            location: 0.1
        };

        // Compare skin type
        if (twin.skinType === this.userProfile.skinType) {
            score += weights.skinType;
        }

        // Compare concerns
        const commonConcerns = twin.concerns.filter(c => 
            this.userProfile.concerns.includes(c)
        ).length;
        score += (commonConcerns / Math.max(twin.concerns.length, this.userProfile.concerns.length)) * weights.concerns;

        // Compare age (closer age = higher score)
        const ageDiff = Math.abs(twin.age - this.userProfile.age);
        score += (1 - ageDiff / 20) * weights.age;

        // Compare location (same location = higher score)
        if (twin.location === this.userProfile.location) {
            score += weights.location;
        }

        return score;
    }

    async sendMessage(message) {
        if (!this.currentTwin) return;

        const chatMessage = {
            sender: 'user',
            content: message,
            timestamp: new Date().toISOString()
        };

        this.chatHistory.push(chatMessage);
        await this.saveMessage(chatMessage);
        this.updateUI();

        // Simulate twin's response
        setTimeout(() => this.receiveMessage(), 1000);
    }

    async receiveMessage() {
        const response = this.generateResponse();
        const chatMessage = {
            sender: 'twin',
            content: response,
            timestamp: new Date().toISOString()
        };

        this.chatHistory.push(chatMessage);
        await this.saveMessage(chatMessage);
        this.updateUI();
    }

    generateResponse() {
        const responses = [
            "That's interesting! I've been using a similar routine.",
            "Have you tried adding a hydrating serum? It helped me a lot.",
            "I noticed my skin improved when I started using SPF regularly.",
            "What's your current moisturizer? I'm looking for recommendations."
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    async saveMessage(message) {
        // In a real implementation, this would save to Supabase
        console.log('Saving message:', message);
    }

    updateUI() {
        const container = document.querySelector('.bento-card:contains("Skin Twin Chat")');
        if (!container) return;

        if (this.currentTwin) {
            container.querySelector('.bg-white\\/10').innerHTML = `
                <div class="space-y-4">
                    <div class="flex items-center space-x-2">
                        <div class="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center text-white">
                            ${this.currentTwin.name[0]}
                        </div>
                        <div>
                            <p class="text-white font-bold">${this.currentTwin.name}</p>
                            <p class="text-white/60 text-sm">${this.currentTwin.matchScore * 100}% match</p>
                        </div>
                    </div>
                    <div class="chat-messages space-y-2 max-h-40 overflow-y-auto">
                        ${this.chatHistory.map(msg => `
                            <div class="p-2 rounded-lg ${msg.sender === 'user' ? 'bg-pink-500/20 ml-4' : 'bg-white/10 mr-4'}">
                                <p class="text-white/90">${msg.content}</p>
                                <p class="text-white/40 text-xs">${new Date(msg.timestamp).toLocaleTimeString()}</p>
                            </div>
                        `).join('')}
                    </div>
                    <div class="flex space-x-2">
                        <input type="text" class="flex-1 bg-white/10 text-white rounded-lg px-3 py-2" placeholder="Type a message...">
                        <button class="bg-pink-500 text-white rounded-lg px-4 py-2">Send</button>
                    </div>
                </div>
            `;
        } else {
            container.querySelector('.bg-white\\/10').innerHTML = `
                <p class="text-white/80">Find your skin twin and track progress together!</p>
                <button class="mt-2 bg-pink-500 text-white rounded-lg px-4 py-2">Find Twin</button>
            `;
        }
    }
}

// Initialize Skin Twin Chat
const skinTwinChat = new SkinTwinChat();

// Export for use in other modules
export default skinTwinChat; 