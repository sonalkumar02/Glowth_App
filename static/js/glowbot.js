function getDynamicProducts({ skinType, pollutionLevel = '', goal = '' }) {
  const products = [];

  if (skinType === 'oily') {
    products.push(
      {
        name: "Niacinamide 10% Serum",
        image: "../assets/product1.png",
        price: 499,
        link: "https://www.amazon.in/dp/oily-niacinamide"
      },
      {
        name: "Oil-Free Gel Moisturizer",
        image: "../assets/product1.png",
        price: 399,
        link: "https://www.amazon.in/dp/oily-moist"
      }
    );
    if (pollutionLevel?.includes("Poor")) {
      products.push({
        name: "Antioxidant Mist",
        image: "../assets/product1.png",
        price: 549,
        link: "https://www.amazon.in/dp/anti-mist"
      });
    }
  }

  if (skinType === 'dry') {
    products.push(
      {
        name: "Ceramide Deep Moist Cream",
        image: "../assets/dry-ceramide.jpg",
        price: 599,
        link: "https://www.amazon.in/dp/dry-ceramide"
      },
      {
        name: "Hydrating Hyaluronic Cleanser",
        image: "../assets/dry-cleanser.jpg",
        price: 429,
        link: "https://www.amazon.in/dp/dry-cleanser"
      }
    );
    if (goal?.toLowerCase().includes("hydration")) {
      products.push({
        name: "Overnight Hydration Mask",
        image: "../assets/hydration-mask.jpg",
        price: 499,
        link: "https://www.amazon.in/dp/hydra-mask"
      });
    }
  }

  if (skinType === 'sensitive') {
    products.push(
      {
        name: "Calming Centella Gel",
        image: "../assets/sensitive-centella.jpg",
        price: 469,
        link: "https://www.amazon.in/dp/sensitive-centella"
      },
      {
        name: "Fragrance-Free Moisturizer",
        image: "../assets/sensitive-moist.jpg",
        price: 399,
        link: "https://www.amazon.in/dp/sensitive-moist"
      }
    );
    if (pollutionLevel?.includes("Poor")) {
      products.push({
        name: "Barrier Repair Serum",
        image: "../assets/barrier-serum.jpg",
        price: 579,
        link: "https://www.amazon.in/dp/barrier-serum"
      });
    }
  }

  if (skinType === 'combination') {
    products.push(
      {
        name: "Balancing Foam Cleanser",
        image: "../assets/combo-cleanser.jpg",
        price: 379,
        link: "https://www.amazon.in/dp/combo-cleanser"
      },
      {
        name: "Light + Rich Dual Moist",
        image: "../assets/combo-moist.jpg",
        price: 449,
        link: "https://www.amazon.in/dp/combo-moist"
      }
    );
    if (goal?.toLowerCase().includes("glow")) {
      products.push({
        name: "Vitamin C Glow Drops",
        image: "../assets/combo-vitc.jpg",
        price: 599,
        link: "https://www.amazon.in/dp/combo-vitc"
      });
    }
  }

  return products;
}


class GlowBot {
  constructor() {
    this.state = 'intro';
    this.user = {
      skinType: '',
      ageGroup: '',
      city: '',
      goal: ''
    };
  }

  async generateResponse(message) {
    const msg = message.toLowerCase();

    // Trigger onboarding if message is "hi"
    if (msg === 'hi' && this.state === 'intro') {
      this.state = 'askSkinType';
      return {
        type: "question",
        text: "Hey there, Glow Seeker! ✨ Ready to unlock your skin’s true potential?\n\nFirst, what’s your skin type?",
        options: ["Oily", "Dry", "Combination", "Sensitive"]
      };
    }

    switch (this.state) {
      case 'askSkinType':
        if (["oily", "dry", "combination", "sensitive"].includes(msg)) {
          this.user.skinType = msg;
          this.state = 'askAgeGroup';
          return {
            type: "question",
            text: "Awesome! What’s your age group?",
            options: ["Teens", "20s", "30s", "40s+"]
          };
        }
        return { type: "text", text: "Please choose a valid skin type." };

      case 'askAgeGroup':
        if (["teens", "20s", "30s", "40s", "40s+"].some(a => msg.includes(a))) {
          this.user.ageGroup = msg;
          this.state = 'askCity';
          return { type: "question", text: "Which city do you live in?" };
        }
        return { type: "text", text: "Pick an age group: Teens, 20s, 30s, 40s+" };

      case 'askCity':
        if (msg.length >= 3) {
          this.user.city = msg;
          this.state = 'askGoal';
          this.user.pollutionLevel = await this.fetchPollution(msg);
          return {
            type: "question",
            text: `Air quality in ${msg} is: ${this.user.pollutionLevel}\n\nWhat’s your skincare goal?`,
            options: ["Clear Acne", "Reduce Wrinkles", "Hydrate Skin", "Even Skin Tone"]
          };
        }
        return { type: "text", text: "Please enter a valid city name." };

      case 'askGoal':
        if (msg.length >= 3) {
          this.user.goal = msg;
          this.state = 'ready';
          return {
            type: "html",
            html: this.recommendProducts()
          };
        }
        return { type: "text", text: "Tell me what you want to improve: acne, glow, hydration, etc." };

      case 'ready':
        return await this.fetchGeminiReply(message);

      default:
        return { type: "text", text: "I’m learning! Ask about routine, tips, or products 💬" };
    }
  }

  recommendProducts() {
    const { skinType, ageGroup, city, goal, pollutionLevel } = this.user;
  
    const selected = getDynamicProducts({
      skinType,
      pollutionLevel,
      goal
    });
  
    const cards = selected.map(p => `
      <div class="product-card">
        <img src="${p.image}" alt="${p.name}" />
        <h3>${p.name}</h3>
        <p>₹${p.price}</p>
        <a href="${p.link}" target="_blank">Buy Now</a>
      </div>
    `).join("");
  
    return `
      <p>You have <strong>${skinType}</strong> skin, you’re in your <strong>${ageGroup}</strong>, living in <strong>${city}</strong>, and want to <strong>${goal}</strong>.</p>
      <p>Here are some products just for you:</p>
      <div class="product-grid">${cards}</div>
    `;
  }
  

  async fetchPollution(city) {
    const apiKey = "1750030828c7204e4c73d2305ed627e1";
    try {
      const geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${apiKey}`);
      const [location] = await geoRes.json();
      if (!location) return "unknown";

      const { lat, lon } = location;
      const airRes = await fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`);
      const airData = await airRes.json();
      const aqi = airData.list[0]?.main?.aqi;

      return aqi === 1 ? "Good 😊" :
             aqi === 2 ? "Fair 😐" :
             aqi === 3 ? "Moderate 😷" :
             aqi === 4 ? "Poor 😩" :
             aqi === 5 ? "Very Poor 😵" :
             "unknown";
    } catch {
      return "unavailable";
    }
  }

  async fetchGeminiReply(message) {
    const geminiApiKey = "AIzaSyAlDILKQMSaVyuiij0T4CX21_x9fdoriPY";
    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + geminiApiKey;

    const body = {
      contents: [{ parts: [{ text: message }] }]
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn’t find a great answer.";
      return { type: "text", text };
    } catch {
      return { type: "text", text: "Oops! Something went wrong while asking Gemini." };
    }
  }
}

const glowBot = new GlowBot();
window.glowBot = glowBot;
