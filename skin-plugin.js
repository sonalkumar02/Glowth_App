// Cursor AI Se Likha Hua Code (Aajao Client Pakdo)
// Step 1: Button Add Karo
document.addEventListener('DOMContentLoaded', function() {
    const skinScanBtn = document.createElement('button');
    skinScanBtn.innerHTML = '✨ Indian Skin Analysis';
    skinScanBtn.id = 'skin-scan-btn-main';
    skinScanBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 24px;
        background: linear-gradient(90deg, #FF6B6B, #FF8E53);
        color: white;
        border: none;
        border-radius: 50px;
        font-weight: bold;
        cursor: pointer;
        box-shadow: 0 4px 15px rgba(255,107,107,0.3);
        z-index: 9999;
        display: block !important;
    `;
    

    // Append the button to the document body
    document.body.appendChild(skinScanBtn);
});

// Load MobileNet model
let model = null;
let modelLoaded = false;
// API key for air quality data
const airQualityApiKey = "1750030828c7204e4c73d2305ed627e1"; // Replace with your actual API key from OpenWeatherMap

// Glow Coin system
const GLOW_COIN_KEY = 'glowCoinBalance';
const LAST_SCAN_KEY = 'lastScanDate';

// Goals System
const GOALS_STORAGE_KEY = 'skinGoals';
const GOALS_RESET_TIME = '00:00:00'; // Reset at midnight

// Goal types and their requirements
const GOALS = {
    scan: { max: 10, current: 0, completed: false },
    hydration: { max: 10, current: 0, completed: false },
    pollution: { max: 1, current: 0, completed: false }
};

// Sound effects
const celebrationSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3');
const waterSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2004/2004-preview.mp3');

// Function to get current Glow Coin balance
function getGlowCoins() {
  return parseInt(localStorage.getItem(GLOW_COIN_KEY) || '0');
}

// Function to add Glow Coins
function addGlowCoins(amount) {
  const currentCoins = getGlowCoins();
  localStorage.setItem(GLOW_COIN_KEY, currentCoins + amount);
  updateGlowCoinDisplay();
}

// Function to check if user can earn a coin today
function canEarnCoinToday() {
  const lastScan = localStorage.getItem(LAST_SCAN_KEY);
  if (!lastScan) return true;
  
  const today = new Date().toDateString();
  return today !== lastScan;
}

// Function to mark that user earned a coin today
function markCoinEarnedToday() {
  const today = new Date().toDateString();
  localStorage.setItem(LAST_SCAN_KEY, today);
}

// Function to update the Glow Coin display in the UI
function updateGlowCoinDisplay() {
  const glowScoreElement = document.querySelector('.glow-score');
  if (glowScoreElement) {
    glowScoreElement.textContent = `Glow Coin: ${getGlowCoins()}`;
    
    // Add animation effect
    glowScoreElement.classList.add('coin-earned');
    setTimeout(() => {
      glowScoreElement.classList.remove('coin-earned');
    }, 1500);
  }
}

// Image caching and similarity detection
let imageCache = new Map();
const SIMILARITY_THRESHOLD = 0.95; // 95% similarity threshold

// Function to calculate image hash
function calculateImageHash(canvas) {
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // Create a simplified version of the image for comparison
  const simplified = new Uint8Array(64); // 8x8 grid
  const blockSize = Math.floor(data.length / 4 / 64);
  
  for (let i = 0; i < 64; i++) {
    let sum = 0;
    for (let j = 0; j < blockSize; j++) {
      const idx = (i * blockSize + j) * 4;
      sum += (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
    }
    simplified[i] = Math.floor(sum / blockSize);
  }
  
  return simplified;
}

// Function to calculate similarity between two hashes
function calculateSimilarity(hash1, hash2) {
  let similarPixels = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (Math.abs(hash1[i] - hash2[i]) < 10) { // Allow small variations
      similarPixels++;
    }
  }
  return similarPixels / hash1.length;
}

// Function to find similar image in cache
function findSimilarImageInCache(canvas) {
  const currentHash = calculateImageHash(canvas);
  
  for (const [hash, data] of imageCache.entries()) {
    const similarity = calculateSimilarity(hash, currentHash);
    if (similarity >= SIMILARITY_THRESHOLD) {
      return data;
    }
  }
  
  return null;
}

async function loadModel() {
  try {
    // Check if mobilenet is defined
    if (typeof mobilenet === 'undefined') {
      console.error('MobileNet is not defined. Make sure the library is loaded correctly.');
      return;
    }
    
    // Load the model
    model = await mobilenet.load();
    modelLoaded = true;
    console.log('Model loaded successfully');
  } catch (error) {
    console.error('Error loading model:', error);
  }
}

// Load model when page is fully loaded
window.addEventListener('load', loadModel);

// Pollution data fetching function
async function fetchPollutionData(lat, lon) {
  try {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${airQualityApiKey}`);
    if (!response.ok) {
      throw new Error('Failed to fetch air pollution data');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching pollution data:', error);
    return null;
  }
}

// Get user location
async function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        }),
        error => {
          console.error('Error getting location:', error);
          reject(error);
        }
      );
    } else {
      reject(new Error('Geolocation is not supported by this browser.'));
    }
  });
}

// Get pollution-specific product recommendations
function getPollutionProducts(aqiLevel) {
  const products = {
    good: [
      {
        name: 'Basic antioxidant serum with Vitamin E',
        link: 'https://www.mamaearth.in/product/mamaearth-vitamin-c-face-serum-with-vitamin-c-and-turmeric'
      },
      {
        name: 'Gentle foam cleanser',
        link: 'https://www.mamaearth.in/product/mamaearth-ubtan-face-wash-with-turmeric-saffron-for-tan-removal'
      }
    ],
    moderate: [
      {
        name: 'Pollution defense serum with niacinamide',
        link: 'https://www.mamaearth.in/product/mamaearth-skin-plump-face-serum'
      },
      {
        name: 'Charcoal deep cleansing face wash',
        link: 'https://www.mamaearth.in/product/mamaearth-charcoal-face-wash-with-activated-charcoal-and-coffee'
      }
    ],
    unhealthy: [
      {
        name: 'Intense pollution shield serum with Vitamins C, E & Ferulic Acid',
        link: 'https://www.mamaearth.in/product/mamaearth-vitamin-c-face-serum-with-vitamin-c-and-turmeric'
      },
      {
        name: 'Double cleansing oil + foam cleanser combo',
        link: 'https://www.mamaearth.in/product/mamaearth-ubtan-face-wash-with-turmeric-saffron-for-tan-removal'
      },
      {
        name: 'Weekly detox face mask with activated charcoal',
        link: 'https://www.mamaearth.in/product/mamaearth-charcoal-face-mask-with-activated-charcoal-and-coffee'
      }
    ],
    severe: [
      {
        name: 'Advanced anti-pollution face serum with ceramides',
        link: 'https://www.mamaearth.in/product/mamaearth-skin-plump-face-serum'
      },
      {
        name: 'Triple action deep cleansing routine pack',
        link: 'https://www.mamaearth.in/product/mamaearth-charcoal-face-wash-with-activated-charcoal-and-coffee'
      },
      {
        name: 'Overnight pollution repair sleep mask',
        link: 'https://www.mamaearth.in/product/mamaearth-vitamin-c-face-cream-with-vitamin-c-and-turmeric'
      },
      {
        name: 'SPF 50 PA++++ broad spectrum sunscreen with pollution shield',
        link: 'https://www.mamaearth.in/product/mamaearth-safe-sunscreen'
      }
    ]
  };
  
  return products[aqiLevel];
}

// Interpret AQI value
function interpretAQI(aqi) {
  if (aqi === 1) return { level: 'good', description: 'Good air quality with minimal pollution impact on skin.' };
  if (aqi === 2) return { level: 'moderate', description: 'Moderate pollution levels that may cause minimal irritation to sensitive skin.' };
  if (aqi === 3 || aqi === 4) return { level: 'unhealthy', description: 'Unhealthy pollution levels that can cause oxidative stress, dehydration, and accelerated aging.' };
  return { level: 'severe', description: 'Severe pollution that significantly damages skin barrier, causes inflammation, and accelerates aging.' };
}

// Step 2: Camera Access + Advanced Indian Skin Analysis Logic
skinScanBtn.addEventListener('click', async () => {
  try {
    // 1. Camera On
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    const video = document.createElement('video');
    video.srcObject = stream;
    video.play();
    
    // 2. Popup Show Kare
    const popup = document.createElement('div');
    popup.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 80%;
      max-width: 500px;
      background: white;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 0 20px rgba(0,0,0,0.2);
      z-index: 10000;
    `;
    popup.innerHTML = `
      <h3 style="color: #FF6B6B;">Scanning Your Indian Skin Type...</h3>
      <p style="font-size: 14px; color: #666;">Please ensure good lighting for accurate analysis</p>
      <video id="live-cam" width="100%" autoplay></video>
      <button id="capture-btn" style="margin-top: 10px; padding: 10px; background: #FF6B6B; color: white; border: none; border-radius: 5px; width: 100%;">Capture Image</button>
    `;
    document.body.appendChild(popup);
    document.getElementById('live-cam').srcObject = stream;

    // 3. Capture Button
    document.getElementById('capture-btn').addEventListener('click', async () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0);
      
      // 4. Advanced Analysis for Indian Skin
      popup.innerHTML = `
        <h3 style="color: #FF6B6B;">Analyzing your skin and environment...</h3>
        <p>Please wait while we process your image and location data</p>
        <div style="width: 100%; height: 10px; background: #f0f0f0; border-radius: 5px; margin: 15px 0;">
          <div style="width: 0%; height: 100%; background: linear-gradient(90deg, #FF6B6B, #FF8E53); border-radius: 5px;" id="progress-bar"></div>
        </div>
      `;
      
      // Get user location for pollution data
      let pollutionData = null;
      try {
        const location = await getUserLocation();
        pollutionData = await fetchPollutionData(location.lat, location.lon);
      } catch (error) {
        console.error('Error getting pollution data:', error);
      }
      
      const progressBar = document.getElementById('progress-bar');
      let width = 0;
      const interval = setInterval(() => {
        if (width >= 100) {
          clearInterval(interval);
          // Check if model is loaded before analyzing
          if (modelLoaded && model) {
            analyzeImage(canvas, pollutionData);
          } else {
            // Fallback if model isn't loaded
            analyzeImageWithoutModel(canvas, pollutionData);
          }
        } else {
          width += 2;
          progressBar.style.width = width + '%';
        }
      }, 50);
      
      // Stream Band Karo
      stream.getTracks().forEach(track => track.stop());
    });

  } catch (err) {
    alert('Error: ' + err.message);
  }
});

async function analyzeImage(canvas, pollutionData) {
  try {
    if (!modelLoaded) {
      alert('Model is still loading. Please wait a moment and try again.');
      return;
    }

    // Check cache for similar image
    const cachedResult = findSimilarImageInCache(canvas);
    if (cachedResult) {
      console.log('Using cached result for similar image');
      displayResults(cachedResult, pollutionData, canvas);
      return;
    }

    // Convert canvas to tensor
    const tensor = tf.browser.fromPixels(canvas)
      .resizeNearestNeighbor([224, 224])
      .toFloat()
      .expandDims();

    // Get predictions from model
    const predictions = await model.predict(tensor).data();
    
    // Process predictions
    const results = {
      acne: predictions[0],
      wrinkles: predictions[1],
      darkSpots: predictions[2],
      redness: predictions[3],
      oiliness: predictions[4]
    };

    // Store result in cache
    const imageHash = calculateImageHash(canvas);
    imageCache.set(imageHash, results);

    // Enhanced image analysis for Indian skin
    const skinType = getDetailedIndianSkinTypeInfo(results);
    
    // Display results with pollution data and enhanced Indian skin analysis
    displayResults(skinType, pollutionData, canvas);
    
    // Clean up tensor
    tensor.dispose();
  } catch (error) {
    console.error('Error analyzing image:', error);
    // Fallback to color-only analysis
    analyzeImageWithoutModel(canvas, pollutionData);
  }
}

// Fallback method if TensorFlow model fails
function analyzeImageWithoutModel(canvas, pollutionData) {
  try {
    // Get image data for color analysis
    const imageData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
    const { averageBrightness, averageRed, averageGreen, averageBlue } = analyzeImageColors(imageData);
    
    // No predictions from model, just use color analysis
    const skinType = determineSkinTypeByColor(averageBrightness, averageRed, averageGreen, averageBlue);
    
    // Display results with pollution data
    displayResults(skinType, pollutionData, canvas);
  } catch (error) {
    console.error('Fallback analysis failed:', error);
    displayError();
  }
}

function analyzeImageColors(imageData) {
  let totalBrightness = 0;
  let totalRed = 0;
  let totalGreen = 0;
  let totalBlue = 0;
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    totalRed += r;
    totalGreen += g;
    totalBlue += b;
    totalBrightness += (r + g + b) / 3;
  }
  
  const pixelCount = data.length / 4;
  return {
    averageBrightness: totalBrightness / pixelCount,
    averageRed: totalRed / pixelCount,
    averageGreen: totalGreen / pixelCount,
    averageBlue: totalBlue / pixelCount
  };
}

function determineSkinType(predictions, brightness, red, green, blue) {
  // Use both model predictions and color analysis
  const skinTypeByColor = determineSkinTypeByColor(brightness, red, green, blue);
  
  // In a real application, we would combine predictions with color analysis
  // For now, just use the color analysis results
  return skinTypeByColor;
}

function determineSkinTypeByColor(brightness, red, green, blue) {
  // Create more comprehensive Indian skin type categories with detailed characteristics
  const indianSkinTypes = [
    // Northern Indian (Lighter)
    {
      type: 'North Indian Fair',
      description: 'Your skin has a light golden undertone common in Northern regions with lower melanin content.',
      concerns: ['Tanning', 'Occasional acne', 'Photosensitivity in summer'],
      products: [
        {
          name: 'Light antioxidant moisturizer with SPF 30+',
          link: 'https://www.mamaearth.in/product/mamaearth-vitamin-c-face-cream-with-vitamin-c-and-turmeric'
        },
        {
          name: 'Vitamin C serum for brightening and protection',
          link: 'https://www.mamaearth.in/product/mamaearth-vitamin-c-face-serum-with-vitamin-c-and-turmeric'
        },
        {
          name: 'Clay-based cleanser for acne control',
          link: 'https://www.mamaearth.in/product/mamaearth-tea-tree-face-wash-with-neem-for-acne-and-pimples'
        }
      ]
    },
    // Central Indian (Medium)
    {
      type: 'Central Indian Wheatish',
      description: 'Your skin has the classic "wheatish" golden undertone common in Central India with balanced melanin.',
      concerns: ['Uneven skin tone', 'Seasonal sensitivity', 'Hyperpigmentation'],
      products: [
        {
          name: 'Ubtan-based daily cleanser with turmeric',
          link: 'https://www.mamaearth.in/product/mamaearth-ubtan-face-wash-with-turmeric-saffron-for-tan-removal'
        },
        {
          name: 'Niacinamide serum for reducing pigmentation',
          link: 'https://www.mamaearth.in/product/mamaearth-skin-plump-face-serum'
        },
        {
          name: 'Broad spectrum SPF 50 with PA+++ protection',
          link: 'https://www.mamaearth.in/product/mamaearth-safe-sunscreen'
        },
        {
          name: 'Weekly kumkumadi mask for brightening',
          link: 'https://www.mamaearth.in/product/mamaearth-ubtan-face-mask-with-turmeric-saffron-for-tan-removal'
        }
      ]
    },
    // South Indian (Medium-Dark)
    {
      type: 'South Indian Bronze',
      description: 'Your skin has a rich bronze tone common in Southern regions with higher melanin production.',
      concerns: ['Post-inflammatory hyperpigmentation', 'Moisture retention', 'UV resilience'],
      products: [
        {
          name: 'Gentle non-stripping oil cleanser',
          link: 'https://www.mamaearth.in/product/mamaearth-charcoal-face-wash-with-activated-charcoal-and-coffee'
        },
        {
          name: 'Alpha arbutin serum for preventing pigmentation',
          link: 'https://www.mamaearth.in/product/mamaearth-skin-plump-face-serum'
        },
        {
          name: 'Lightweight gel moisturizer with ceramides',
          link: 'https://www.mamaearth.in/product/mamaearth-aloe-vera-face-cream-with-aloe-vera-and-vitamin-e'
        },
        {
          name: 'Chemical exfoliant with AHAs (low percentage)',
          link: 'https://www.mamaearth.in/product/mamaearth-vitamin-c-face-scrub-with-vitamin-c-and-turmeric'
        }
      ]
    },
    // Deep South Indian (Darker)
    {
      type: 'Deep South Indian',
      description: 'Your skin has a rich deep tone with high melanin content, native to southernmost regions of India.',
      concerns: ['Keloid formation', 'Scarring', 'Maintaining skin radiance'],
      products: [
        {
          name: 'Oil-balancing cleanser with neem extract',
          link: 'https://www.mamaearth.in/product/mamaearth-tea-tree-face-wash-with-tea-tree-and-neem-for-acne-and-pimples'
        },
        {
          name: 'Tranexamic acid serum for hyperpigmentation',
          link: 'https://www.mamaearth.in/product/mamaearth-skin-plump-face-serum'
        },
        {
          name: 'Physical sunscreen with zinc oxide',
          link: 'https://www.mamaearth.in/product/mamaearth-safe-sunscreen'
        },
        {
          name: 'Gentle exfoliating mask with fruit enzymes',
          link: 'https://www.mamaearth.in/product/mamaearth-vitamin-c-face-scrub-with-vitamin-c-and-turmeric'
        }
      ]
    }
  ];

  // Determine skin type based on enhanced color analysis and regional variations
  let skinTypeIndex = 0;
  
  // More precise analysis of color ratios including melanin estimation
  const redToGreenRatio = red / green;
  const blueToRedRatio = blue / red;
  const estimatedMelanin = 1 - (brightness / 255); // Estimated melanin content based on brightness
  
  // Create a more accurate algorithm for Indian skin types based on color data
  if (estimatedMelanin < 0.40 && redToGreenRatio > 1.05) {
    skinTypeIndex = 0; // North Indian Fair
  } else if (estimatedMelanin >= 0.40 && estimatedMelanin < 0.55 && redToGreenRatio > 1.02) {
    skinTypeIndex = 1; // Central Indian Wheatish
  } else if (estimatedMelanin >= 0.55 && estimatedMelanin < 0.70) {
    skinTypeIndex = 2; // South Indian Bronze
  } else {
    skinTypeIndex = 3; // Deep South Indian
  }
  
  return indianSkinTypes[skinTypeIndex];
}

// Add gender-specific analysis to enhance accuracy
function adjustForGender(skinType, gender) {
  if (!gender) return skinType; // If gender not provided, return original

  let adjustedSkinType = {...skinType};
  
  if (gender === 'male') {
    // Males typically have thicker skin, higher sebum production
    adjustedSkinType.description += ' Male Indian skin tends to be thicker with higher oil production.';
    adjustedSkinType.concerns.push('Excess sebum production');
    adjustedSkinType.products = adjustedSkinType.products.filter(p => !p.name.includes('makeup'));
    
    // Add male-specific product
    adjustedSkinType.products.push({
      name: 'Oil-control mattifying moisturizer',
      link: 'https://www.mamaearth.in/product/mamaearth-oil-free-face-moisturizer-with-apple-cider-vinegar'
    });
  } else if (gender === 'female') {
    // Females typically have more hormonal variations affecting skin
    adjustedSkinType.description += ' Female Indian skin may experience more hormonal fluctuations affecting tone.';
    adjustedSkinType.concerns.push('Hormonal pigmentation');
    
    // Add female-specific product
    adjustedSkinType.products.push({
      name: 'Vitamin K cream for under-eye circles',
      link: 'https://www.mamaearth.in/product/mamaearth-bye-bye-dark-circles-eye-cream'
    });
  }
  
  return adjustedSkinType;
}

// Enhanced regional adaptation for pollution impact specific to Indian regions
function getIndianRegionalPollutionImpact(aqi, skinType) {
  const impacts = {
    'North Indian Fair': {
      1: "Minimal impact on your fair skin in low pollution areas. Standard protection is adequate.",
      2: "Medium impact in urban centers like Delhi NCR. Use antioxidant serums daily.",
      3: "High impact with significant oxidative stress in major cities. Use purifying masks twice weekly.",
      4: "Extreme impact with barrier damage risk. Double cleansing essential in industrial zones."
    },
    'Central Indian Wheatish': {
      1: "Low impact in rural areas. Basic protection sufficient.",
      2: "Moderate impact in cities like Mumbai and Pune. Use vitamin C and niacinamide combination.",
      3: "High impact in industrial zones. Consider micellar water pre-cleanse.",
      4: "Severe impact in heavy traffic zones. Implement pollution-specific night treatments."
    },
    'South Indian Bronze': {
      1: "Minimal impact in coastal regions with good air circulation.",
      2: "Moderate impact in tech hubs like Bangalore and Hyderabad. Focus on evening detox routines.",
      3: "High impact in urban centers. Use weekly detoxifying masks.",
      4: "Severe impact requiring comprehensive protection and cleansing protocols."
    },
    'Deep South Indian': {
      1: "Low impact with natural melanin providing some protection.",
      2: "Moderate impact requiring additional hydration in humid, polluted environments.",
      3: "High impact leading to dullness and uneven tone. Use brightening ingredients.",
      4: "Severe impact with risk of persistent PIH. Implementation of chelating agents in skincare recommended."
    }
  };
  
  return impacts[skinType][aqi] || "Significant impact on your Indian skin requiring tailored pollution defense.";
}

// Enhanced UV sensitivity assessment for Indian skin
function getIndianUVSensitivity(skinType) {
  const uvSensitivity = {
    'North Indian Fair': "Moderate UV sensitivity. Requires SPF 30-50 and reapplication every 2 hours in direct sun.",
    'Central Indian Wheatish': "Medium UV sensitivity. SPF 30+ recommended with 3-hour reapplication window.",
    'South Indian Bronze': "Lower UV sensitivity but not immune. SPF 30 required with focus on anti-pigmentation.",
    'Deep South Indian': "Natural UV protection present but still requires SPF 15-30 to prevent hyperpigmentation."
  };
  
  return uvSensitivity[skinType] || "Requires appropriate UV protection based on your specific Indian skin type.";
}

// Calculate overall skin health score
function calculateSkinScore(skinType, concerns, pollutionData) {
  // Base score starts at 100
  let score = 100;
  
  // Deduct points based on concerns
  const concernDeductions = {
    'Acne': 15,
    'Enlarged pores': 10,
    'Shine': 8,
    'Hyperpigmentation': 12,
    'Dark circles': 10,
    'Fine lines': 8,
    'Uneven texture': 10,
    'Sensitivity to products': 12
  };
  
  concerns.forEach(concern => {
    if (concernDeductions[concern]) {
      score -= concernDeductions[concern];
    }
  });
  
  // Adjust for pollution impact
  if (pollutionData && pollutionData.list && pollutionData.list.length > 0) {
    const aqi = pollutionData.list[0].main.aqi;
    if (aqi >= 3) score -= 10; // High pollution reduces score
  }
  
  // Ensure score stays within 0-100 range
  return Math.max(0, Math.min(100, score));
}

// Get color for score indicator
function getScoreColor(score) {
  if (score <= 40) return '#FF6B6B'; // Red
  if (score <= 70) return '#FFA500'; // Orange
  return '#4CAF50'; // Green
}

// Calculate detailed skin condition percentages
function calculateSkinConditionPercentages(imageData) {
  const pixels = imageData.data;
  let totalPixels = pixels.length / 4;
  let totalR = 0, totalG = 0, totalB = 0, totalBrightness = 0;

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const brightness = (r + g + b) / 3;

    totalR += r;
    totalG += g;
    totalB += b;
    totalBrightness += brightness;
  }

  const avgR = totalR / totalPixels;
  const avgG = totalG / totalPixels;
  const avgB = totalB / totalPixels;
  const avgBrightness = totalBrightness / totalPixels;

  // Normalize values between 0–100% based on image data
  return {
    acne: Math.min(100, Math.max(0, Math.round((avgR - avgG) * 0.8))),         // Red tint dominance
    pores: Math.min(100, Math.max(0, Math.round((100 - avgBrightness) * 0.4))), // Darkness = deeper pores
    oiliness: Math.min(100, Math.max(0, Math.round((avgG - avgB) * 0.6))),     // Green tint = oil zone
    pigmentation: Math.min(100, Math.max(0, Math.round((avgB - avgG) * 0.7))), // Bluish = pigmentation
    darkCircles: Math.min(100, Math.max(0, Math.round((255 - avgBrightness) * 0.25))), // Lower brightness = under-eye dark
    wrinkles: Math.min(100, Math.max(0, Math.round((255 - avgR) * 0.15)))      // Less red = aging
  };
}

// Get product recommendations based on skin analysis
function getProductRecommendations(skinType, concerns, score) {
  const recommendations = {
    'North Indian Fair': {
      highScore: [
        { name: 'Gentle antioxidant serum', ingredients: ['Vitamin C', 'Vitamin E'] },
        { name: 'Light moisturizer with SPF', ingredients: ['Hyaluronic Acid', 'SPF 30+'] }
      ],
      mediumScore: [
        { name: 'Brightening serum', ingredients: ['Niacinamide', 'Alpha Arbutin'] },
        { name: 'Hydrating toner', ingredients: ['Hyaluronic Acid', 'Glycerin'] }
      ],
      lowScore: [
        { name: 'Repair serum', ingredients: ['Ceramides', 'Peptides'] },
        { name: 'Barrier cream', ingredients: ['Shea Butter', 'Ceramides'] }
      ]
    },
    'Central Indian Wheatish': {
      highScore: [
        { name: 'Balancing serum', ingredients: ['Niacinamide', 'Zinc'] },
        { name: 'Light gel moisturizer', ingredients: ['Aloe Vera', 'Hyaluronic Acid'] }
      ],
      mediumScore: [
        { name: 'Oil-control serum', ingredients: ['Niacinamide', 'Tea Tree'] },
        { name: 'Clay mask', ingredients: ['Kaolin Clay', 'Charcoal'] }
      ],
      lowScore: [
        { name: 'Repair cream', ingredients: ['Ceramides', 'Niacinamide'] },
        { name: 'Detox mask', ingredients: ['Charcoal', 'Clay'] }
      ]
    },
    'South Indian Bronze': {
      highScore: [
        { name: 'Brightening serum', ingredients: ['Vitamin C', 'Alpha Arbutin'] },
        { name: 'Hydrating gel', ingredients: ['Hyaluronic Acid', 'Aloe Vera'] }
      ],
      mediumScore: [
        { name: 'Pigmentation serum', ingredients: ['Tranexamic Acid', 'Niacinamide'] },
        { name: 'Exfoliating toner', ingredients: ['Lactic Acid', 'Glycolic Acid'] }
      ],
      lowScore: [
        { name: 'Repair serum', ingredients: ['Ceramides', 'Peptides'] },
        { name: 'Barrier cream', ingredients: ['Shea Butter', 'Ceramides'] }
      ]
    },
    'Deep South Indian': {
      highScore: [
        { name: 'Brightening serum', ingredients: ['Vitamin C', 'Alpha Arbutin'] },
        { name: 'Hydrating cream', ingredients: ['Hyaluronic Acid', 'Ceramides'] }
      ],
      mediumScore: [
        { name: 'Pigmentation serum', ingredients: ['Tranexamic Acid', 'Kojic Acid'] },
        { name: 'Exfoliating serum', ingredients: ['Lactic Acid', 'Glycolic Acid'] }
      ],
      lowScore: [
        { name: 'Repair cream', ingredients: ['Ceramides', 'Peptides'] },
        { name: 'Barrier serum', ingredients: ['Ceramides', 'Niacinamide'] }
      ]
    }
  };
  
  const scoreCategory = score <= 40 ? 'lowScore' : (score <= 70 ? 'mediumScore' : 'highScore');
  return recommendations[skinType][scoreCategory];
}

// Function to update product carousel with recommended products
function updateProductCarousel(products) {
  function getDescriptionByProductName(name) {
    const lower = name.toLowerCase();
    // Sunscreen-related terms
    if (/(sunscreen|spf\s?\d+|uv\s?protect|sun\s?shield|sunblock)/.test(lower)) {
      return "Protects from harmful UV rays. Ideal for Indian summers.";
    }

    // Vitamin C
    if (/(vitamin\s?c|brighten|glow serum|radiance)/.test(lower)) {
      return "Fights pigmentation, brightens skin and evens tone.";
    }

    // Serum
    if (/(serum|repair|booster|active complex)/.test(lower)) {
      return "Concentrated ingredients for targeted skin repair.";
    }

    // Moisturizer
    if (/(moisturizer|hydrating cream|gel cream|deep hydration|soft cream)/.test(lower)) {
      return "Locks in moisture and prevents dryness.";
    }

    // Cleanser
    if (/(cleanser|face wash|foam|micellar|purifying wash)/.test(lower)) {
      return "Removes dirt, oil, and pollution from skin.";
    }

    return "Great for your skin type. Contains natural ingredients.";
  }

  function getSkinTypeByProductName(name) {
    const lower = name.toLowerCase();
     // Oily skin indicators
    if (/(niacinamide|gel|oil[-\s]?free|matte|anti-acne|clarifying)/.test(lower)) {
      return "Oily";
    }

    // Dry skin indicators
    if (/(ceramide|hydration|moisture|deep cream|intense repair|dry skin|butter|shea)/.test(lower)) {
      return "Dry";
    }

    // Combination skin indicators
    if (/(vitamin c|glow|balancing|multi-action|dual|brighten)/.test(lower)) {
      return "Combination";
    }

    // Sensitive skin indicators
    if (/(centella|calming|soothing|fragrance[-\s]?free|gentle|minimalist|barrier repair)/.test(lower)) {
      return "Sensitive";
    }

    return "All Skin Types";
  }

  const productCarousel = document.getElementById('product-carousel');
  if (!productCarousel) return;

  productCarousel.innerHTML = ''; // Clear existing

  products.forEach((product, index) => {
    const name = product.name || "Product Name";
    const desc = product.description || getDescriptionByProductName(name);
    const skinType = product.skinType || getSkinTypeByProductName(name);
    const price = product.price || '499';
    const link = product.link || '#';
    const image = product.image || '../assets/product1.jpg';

    // Badge
    let badge = '';
    if (index === 0) {
      badge = '<span class="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-semibold animate-pulse mb-1 inline-block">🌟 Best Seller</span>';
    } else if (index === 1) {
      badge = '<span class="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold animate-pulse mb-1 inline-block">🔥 Hot Pick</span>';
    } else {
      badge = '<span class="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full font-semibold animate-bounce mb-1 inline-block">💖 Fan Favorite</span>';
    }

    // Emoji based on skin type
    const skinTypeEmojiMap = {
      "Oily": { emoji: "💧", bg: "bg-blue-100 text-blue-800" },
      "Dry": { emoji: "🌵", bg: "bg-yellow-100 text-yellow-800" },
      "Combination": { emoji: "🌿", bg: "bg-green-100 text-green-800" },
      "Sensitive": { emoji: "🪶", bg: "bg-pink-100 text-pink-800" },
      "All Skin Types": { emoji: "✨", bg: "bg-gray-100 text-gray-800" }
    };
    
    const skinTypeLabel = product.skinType || getSkinTypeByProductName(name) || "All Skin Types";
    const { emoji, bg } = skinTypeEmojiMap[skinTypeLabel] || skinTypeEmojiMap["All Skin Types"];
    
    const skinTypeBadge = `
      <span class="inline-flex items-center text-[11px] font-medium ${bg} px-2 py-0.5 rounded-full mt-2 w-fit shadow-sm">
        ${emoji} ${skinTypeLabel}
      </span>
    `;
    


    const productCard = document.createElement('div');
    productCard.className = 'flex-shrink-0 w-[600px] w-full h-72 flex items-center gap-6 p-4 bg-white dark:bg-gray-800 rounded-xl';

    productCard.innerHTML = `
      <img src="${image}" alt="${name}" class="w-72 h-64" />

      <div class="w-full h-full flex flex-col justify-between">
        ${badge}
        <div>
          <h4 class="text-xl font-bold text-pink-700 text-left">${name}</h4>
          <p class="text-sm text-gray-600 dark:text-gray-300 mt-1 text-left">
            ${desc}
          </p>
          ${skinTypeBadge}
        </div>
        <div class="border-t border-gray-300 my-3"></div>
        <div class="flex items-center justify-between">
          <div class="flex flex-col">
            <span class="text-pink-600 font-semibold text-base">₹${price}</span>
          </div>
          <a href="${link}" target="_blank" class="bg-pink-600 text-white text-sm px-3 py-3 rounded-md hover:bg-pink-700 shadow hover:scale-105 transition-all duration-200 ease-in-out">
            🛒 Buy Now
          </a>
        </div>
      </div>
    `;

    productCarousel.appendChild(productCard);
  });
}


// Modify displayResults function to update product carousel
function displayResults(result, pollutionData, canvas) {
  const popup = document.querySelector('div[style*="position: fixed; top: 50%;"]');
  if (!popup) return;
  
  // Award Glow Coin on each successful scan and update daily streak
  try {
    if (window.gamification) {
      window.gamification.addGlowCoin(1);
      window.gamification.updateStreak();
      window.gamification.markFirstScan(); // Mark first scan achievement
    } else {
      // Fallback to local storage if gamification not loaded
      addGlowCoins(1);
      markCoinEarnedToday();
    }
  } catch (_) {}
  
  // Get image data from canvas
  const imageData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
  
  // Calculate scores and percentages with the correct image data
  const skinScore = calculateSkinScore(result.type, result.concerns, pollutionData);
  const scoreColor = getScoreColor(skinScore);
  const skinCondition = calculateSkinConditionPercentages(imageData);
  const productRecommendations = getProductRecommendations(result.type, result.concerns, skinScore);
  
  // Update product carousel with recommended products
  const recommendedProducts = result.products.map(product => ({
    name: product.name,
    description: getProductDescription(product.name),
    skinType: result.type,
    price: getProductPrice(product.name),
    link: product.link,
    image: getProductImage(product.name)
  }));

  updateProductCarousel(recommendedProducts);
  
  // Make popup scrollable and better sized for all screens
  popup.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 90%;
    max-width: 550px;
    max-height: 85vh;
    overflow-y: auto;
    background: white;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 0 20px rgba(0,0,0,0.2);
    z-index: 10000;
  `;
  
  // Create Glow Coin earned message
  const glowCoinMessage = `
    <div style="background: linear-gradient(135deg, #FFD700, #FFA500); padding: 15px; border-radius: 8px; margin: 15px 0; text-align: center; animation: pulse 1.5s infinite;">
      <p style="font-weight: bold; color: white; margin: 0; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">
        <span style="font-size: 18px;">🪙</span> Congratulations! You earned 1 Glow Coin!
      </p>
    </div>
  `;
  
  let pollutionHtml = '';
  let pollutionProducts = [];
  
  // Process pollution data with Indian regional context if available
  if (pollutionData && pollutionData.list && pollutionData.list.length > 0) {
    const aqi = pollutionData.list[0].main.aqi;
    const aqiInfo = interpretAQI(aqi);
    pollutionProducts = getPollutionProducts(aqiInfo.level);
    
    // Add pollutant components data with Indian context
    const components = pollutionData.list[0].components;
    const pm25 = components.pm2_5 || 0;
    const pm10 = components.pm10 || 0;
    const no2 = components.no2 || 0;
    
    // Get Indian-specific pollution impact
    const indianPollutionImpact = getIndianRegionalPollutionImpact(aqi, result.type);
    
    // Create more detailed pollution analysis for Indian skin
    pollutionHtml = `
      <div style="background: #F0F8FF; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <p style="font-weight: bold; color: #555; margin-bottom: 12px;">Air Pollution Analysis for Indian Skin:</p>
        <p style="margin-bottom: 8px;"><b>Air Quality Index (AQI):</b> ${aqi} - <span style="color: ${getAQIColor(aqi)}; font-weight: bold;">${aqiInfo.level.toUpperCase()}</span></p>
        <p style="font-size: 14px; margin-bottom: 12px;">${aqiInfo.description}</p>
        
        <div style="margin-top: 10px; border-top: 1px solid #e0e0e0; padding-top: 10px;">
          <p style="font-weight: bold; margin-bottom: 8px; font-size: 14px;">Pollutant Impact on Indian Skin:</p>
          <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 5px;">
            <div style="background: #f5f5f5; padding: 8px; border-radius: 5px; flex: 1; min-width: 120px;">
              <p style="margin: 0; font-size: 12px;">PM2.5: <b>${pm25} μg/m³</b></p>
              <p style="margin: 0; font-size: 10px; color: #666;">${getPM25Impact(pm25)}</p>
            </div>
            <div style="background: #f5f5f5; padding: 8px; border-radius: 5px; flex: 1; min-width: 120px;">
              <p style="margin: 0; font-size: 12px;">PM10: <b>${pm10} μg/m³</b></p>
              <p style="margin: 0; font-size: 10px; color: #666;">${getPM10Impact(pm10)}</p>
            </div>
            <div style="background: #f5f5f5; padding: 8px; border-radius: 5px; flex: 1; min-width: 120px;">
              <p style="margin: 0; font-size: 12px;">NO₂: <b>${no2} μg/m³</b></p>
              <p style="margin: 0; font-size: 10px; color: #666;">${getNO2Impact(no2)}</p>
            </div>
          </div>
        </div>
        
        <p style="font-size: 12px; margin-top: 10px; color: #666;">Impact on your Indian skin type: ${indianPollutionImpact}</p>
        <p style="font-size: 12px; margin-top: 5px; color: #666;">UV Sensitivity: ${result.uvSensitivity || 'Moderate'}</p>
      </div>
      
      <div style="margin: 15px 0;">
        <p style="font-weight: bold; color: #666; margin-bottom: 10px;">Indian Pollution-Defense Products:</p>
        <ol style="padding-left: 20px; margin: 0;">
          ${pollutionProducts.map(product => `
            <li style="margin-bottom: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="flex: 1;">${product.name}</span>
                <a href="${product.link}" target="_blank" style="display: inline-block; margin-left: 8px; padding: 4px 8px; background: #5D9CEC; color: white; text-decoration: none; border-radius: 4px; font-size: 12px; white-space: nowrap;">Buy Now</a>
              </div>
            </li>
          `).join('')}
        </ol>
      </div>
    `;
  } else {
    pollutionHtml = `
      <div style="background: #FFF6F6; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <p style="color: #888; margin: 0;">Unable to retrieve pollution data for your location. Please ensure location access is enabled for optimal Indian skin analysis.</p>
      </div>
    `;
  }
  
  // Create a more detailed skin analysis section for Indian skin
  const skinConcernsDetails = getSkinConcernsDetails(result.type, result.concerns);
  
  // Create Indian-specific skincare recommendations
  const ayurvedicRecommendations = getAyurvedicRecommendations(result.type);
  
  // Add new score display section
  const scoreHtml = `
    <div style="margin: 15px 0; background: #f8f9fa; padding: 15px; border-radius: 8px;">
      <h3 style="color: #333; margin-bottom: 15px;">Your Skin Health Score</h3>
      
      <div style="width: 100%; height: 20px; background: #eee; border-radius: 10px; margin-bottom: 10px;">
        <div style="width: ${skinScore}%; height: 100%; background: ${scoreColor}; border-radius: 10px; transition: width 1s ease-in-out;"></div>
      </div>
      
      <p style="text-align: center; font-size: 24px; font-weight: bold; color: ${scoreColor}; margin: 10px 0;">${skinScore}%</p>
      
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 15px;">
        <div style="background: #fff; padding: 10px; border-radius: 5px;">
          <p style="margin: 0; font-size: 12px;">Acne Presence</p>
          <p style="margin: 5px 0 0 0; font-size: 16px; font-weight: bold;">${skinCondition.acne}%</p>
        </div>
        <div style="background: #fff; padding: 10px; border-radius: 5px;">
          <p style="margin: 0; font-size: 12px;">Pore Visibility</p>
          <p style="margin: 5px 0 0 0; font-size: 16px; font-weight: bold;">${skinCondition.pores}%</p>
        </div>
        <div style="background: #fff; padding: 10px; border-radius: 5px;">
          <p style="margin: 0; font-size: 12px;">Oiliness Level</p>
          <p style="margin: 5px 0 0 0; font-size: 16px; font-weight: bold;">${skinCondition.oiliness}%</p>
        </div>
        <div style="background: #fff; padding: 10px; border-radius: 5px;">
          <p style="margin: 0; font-size: 12px;">Pigmentation</p>
          <p style="margin: 5px 0 0 0; font-size: 16px; font-weight: bold;">${skinCondition.pigmentation}%</p>
        </div>
        <div style="background: #fff; padding: 10px; border-radius: 5px;">
          <p style="margin: 0; font-size: 12px;">Dark Circles</p>
          <p style="margin: 5px 0 0 0; font-size: 16px; font-weight: bold;">${skinCondition.darkCircles}%</p>
        </div>
        <div style="background: #fff; padding: 10px; border-radius: 5px;">
          <p style="margin: 0; font-size: 12px;">Wrinkles</p>
          <p style="margin: 5px 0 0 0; font-size: 16px; font-weight: bold;">${skinCondition.wrinkles}%</p>
        </div>
      </div>
    </div>
    
    <div style="margin: 15px 0; background: #f0f8ff; padding: 15px; border-radius: 8px;">
      <h3 style="color: #333; margin-bottom: 15px;">Recommended Products for Your Score</h3>
      <div style="display: grid; gap: 10px;">
        ${productRecommendations.map(product => `
          <div style="background: #fff; padding: 10px; border-radius: 5px;">
            <p style="margin: 0; font-weight: bold;">${product.name}</p>
            <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">Key Ingredients: ${product.ingredients.join(', ')}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  
  // Get captured image as data URL to display it
  const capturedImageDataUrl = canvas.toDataURL('image/jpeg');
  
  // Create HTML for the captured image at the top of the results
  const capturedImageHtml = `
    <div style="margin: 0 0 15px 0; text-align: center;">
      <h3 style="color: #FF6B6B; margin-top: 0; margin-bottom: 10px;">Your Photo</h3>
      <div style="border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.1); background: #f5f5f5; display: inline-block; max-width: 100%;">
        <img src="${capturedImageDataUrl}" alt="Your skin analysis photo" style="max-width: 100%; height: auto; display: block;">
      </div>
    </div>
  `;
  
  popup.innerHTML = `
    <h3 style="color: #FF6B6B; margin-top: 0;">Your Indian Skin Analysis Result:</h3>
    
    ${capturedImageHtml}
    
    ${glowCoinMessage}
    
    <div style="background: #FFF6F6; padding: 15px; border-radius: 8px; margin: 10px 0;">
      <p style="font-weight: bold; margin-bottom: 8px;">Skin Type: ${result.type}</p>
      <p style="font-size: 14px; margin-bottom: 5px;">${result.description}</p>
      <p style="font-size: 13px; margin-top: 10px;">${getDetailedIndianSkinTypeInfo(result.type)}</p>
    </div>
    
    <div style="margin: 15px 0;">
      <p style="font-weight: bold; color: #666; margin-bottom: 8px;">Key Concerns for Your Indian Skin:</p>
      <ul style="padding-left: 20px; margin: 0;">
        ${result.concerns.map((concern, index) => `
          <li style="margin-bottom: 10px;">
            <span style="font-weight: bold;">${concern}</span>
            <p style="margin: 5px 0 0 0; font-size: 13px; color: #555;">${skinConcernsDetails[index]}</p>
          </li>
        `).join('')}
      </ul>
    </div>
    
    ${pollutionHtml}
    
    <div style="margin: 15px 0;">
      <p style="font-weight: bold; color: #666; margin-bottom: 10px;">Recommended Products for Your Indian Skin:</p>
      <ol style="padding-left: 20px; margin: 0;">
        ${result.products.map(product => `
          <li style="margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="flex: 1;">${product.name}</span>
              <a href="${product.link}" target="_blank" style="display: inline-block; margin-left: 8px; padding: 4px 8px; background: #FF6B6B; color: white; text-decoration: none; border-radius: 4px; font-size: 12px; white-space: nowrap;">Buy Now</a>
            </div>
          </li>
        `).join('')}
      </ol>
    </div>
    
    <div style="margin: 15px 0; background: #f9f2e8; padding: 15px; border-radius: 8px;">
      <p style="font-weight: bold; color: #a87d3d; margin-bottom: 10px;">Ayurvedic Recommendations:</p>
      <p style="font-size: 13px; color: #6d5b3e; margin-bottom: 10px;">${ayurvedicRecommendations.dosha}</p>
      <ul style="padding-left: 20px; margin: 0;">
        ${ayurvedicRecommendations.remedies.map(remedy => `
          <li style="margin-bottom: 8px; font-size: 13px; color: #6d5b3e;">${remedy}</li>
        `).join('')}
      </ul>
    </div>
    
    <p style="font-size: 12px; color: #888; margin: 15px 0;">Note: These recommendations are tailored for Indian skin based on detailed analysis of color, undertone, and regional variations. For a complete skin diagnosis, consult a dermatologist.</p>
    
    ${scoreHtml}
    
    <div style="display: flex; justify-content: space-between; margin-top: 15px;">
      <button onclick="this.parentElement.parentElement.remove()" style="padding: 8px 15px; background: #FF6B6B; color: white; border: none; border-radius: 5px; width: 100%;">Close</button>
    </div>
  `;
  if (result && result.products) {
    updateProductCarousel(result.products);
  }
  try { renderFaceMapOverlay(canvas); } catch (_) {}
  
}

// New function for detailed Indian skin type information
function getDetailedIndianSkinTypeInfo(skinType) {
  const details = {
    'North Indian Fair': "Your skin type is common in Northern regions like Kashmir, Punjab, and Himachal Pradesh. It has relatively less melanin than other Indian skin types, but more than Caucasian skin. It's prone to tanning and seasonal changes, with good elasticity but can be sensitive to harsh treatments.",
    
    'Central Indian Wheatish': "This quintessential 'wheatish' skin tone is predominant in Central India, from Gujarat to West Bengal. It has balanced melanin production giving it natural sun protection while retaining sensitivity to environmental changes. Your skin likely has medium thickness with good oil production.",
    
    'South Indian Bronze': "Native to Southern states like Tamil Nadu, Karnataka and Kerala, this skin type has higher melanin content providing excellent natural protection against UV damage. It's less prone to wrinkling but more susceptible to hyperpigmentation when inflamed.",
    
    'Deep South Indian': "This richly melanated skin type from deep South India has excellent natural UV protection and ages more slowly than lighter skin types. It has thicker dermis and epidermis layers with strong barrier function, but can be prone to keloid formation and post-inflammatory hyperpigmentation."
  };
  
  return details[skinType] || "Your Indian skin has unique characteristics based on regional genetics and environmental factors.";
}

// New function for Ayurvedic recommendations based on skin type
function getAyurvedicRecommendations(skinType) {
  const recommendations = {
    'North Indian Fair': {
      dosha: "Your skin profile suggests Vata-Pitta dominance according to Ayurveda.",
      remedies: [
        "Use warm oil massage (abhyanga) with sesame or almond oil to balance Vata properties.",
        "Include cooling herbs like sandalwood and rose in your skincare to balance Pitta.",
        "Avoid harsh, drying ingredients that can disturb your skin's natural balance."
      ]
    },
    'Central Indian Wheatish': {
      dosha: "Your skin profile indicates primarily Pitta constitution according to Ayurveda.",
      remedies: [
        "Use cooling herbs like chandana (sandalwood), manjistha, and neem in your skincare.",
        "Apply aloe vera gel regularly to maintain skin temperature balance.",
        "Include saffron and turmeric in your diet and skincare for natural glow."
      ]
    },
    'South Indian Bronze': {
      dosha: "Your skin shows Pitta-Kapha dominance in Ayurvedic terms.",
      remedies: [
        "Use triphala and neem based cleansers to balance excess oil production.",
        "Apply kumkumadi tailam at night to address pigmentation concerns.",
        "Include brahmi and gotu kola in your routine for their anti-inflammatory benefits."
      ]
    },
    'Deep South Indian': {
      dosha: "Your skin displays strong Kapha characteristics according to Ayurveda.",
      remedies: [
        "Use udvartana (herbal powder massage) regularly to stimulate circulation.",
        "Apply ubtan masks with gram flour and turmeric to maintain even tone.",
        "Include detoxifying herbs like neem and tulsi in your skincare routine."
      ]
    }
  };
  
  return recommendations[skinType] || {
    dosha: "Your Indian skin has unique Ayurvedic properties.",
    remedies: [
      "Consult with an Ayurvedic practitioner for personalized recommendations.",
      "Consider natural ingredients like turmeric, neem, and sandalwood which benefit most Indian skin types."
    ]
  };
}

// Helper functions for more detailed analysis

// Get color for AQI level
function getAQIColor(aqi) {
  if (aqi === 1) return '#4CAF50'; // Good - Green
  if (aqi === 2) return '#FFC107'; // Moderate - Yellow
  if (aqi === 3) return '#FF9800'; // Unhealthy for Sensitive - Orange
  if (aqi === 4) return '#F44336'; // Unhealthy - Red
  return '#9C27B0'; // Very Unhealthy/Hazardous - Purple
}

// PM2.5 impact description
function getPM25Impact(value) {
  if (value < 12) return "Low impact on skin";
  if (value < 35) return "Medium impact, causes free radical damage";
  return "High impact, accelerates aging and inflammation";
}

// PM10 impact description
function getPM10Impact(value) {
  if (value < 54) return "Low impact on skin pores";
  if (value < 154) return "Medium impact, may clog pores";
  return "High impact, causes significant clogging and irritation";
}

// NO2 impact description
function getNO2Impact(value) {
  if (value < 53) return "Low oxidative stress impact";
  if (value < 100) return "Medium oxidative damage potential";
  return "High inflammatory response trigger";
}

// Get detailed skin type information
function getDetailedSkinTypeInfo(skinType) {
  const details = {
    'Warm Undertone Combination': "Your skin has golden or yellow undertones with a dual nature: oily in the T-zone (forehead, nose, chin) and normal to dry on the cheeks. This is common in many Indian skin types, especially from Western and Central regions. Your skin may be more prone to hyperpigmentation when inflamed.",
    'Cool Undertone Dry': "Your skin has pink or bluish undertones with overall dryness and potential for flakiness. This is less common in Indian skin but seen more in Northern regions. Your skin typically needs more intensive hydration and may show fine lines earlier if not properly moisturized.",
    'Neutral Undertone Oily': "Your skin has a balanced undertone with excess sebum production across most areas. This is common in humid regions of India and during monsoon seasons. Your primary concerns are likely shine control and keeping pores clear of congestion.",
    'Melanin-Rich Sensitive': "Your skin has high melanin content which provides natural UV protection but makes it more prone to hyperpigmentation. Your skin barrier may be more reactive to environmental triggers and product ingredients, making a simplified routine essential."
  };
  
  return details[skinType] || "";
}

// Get detailed concerns descriptions
function getSkinConcernsDetails(skinType, concerns) {
  const detailsMap = {
    'Uneven skin tone': "Areas of hyperpigmentation likely caused by sun exposure, inflammation, or hormonal factors. Indian skin's high melanin content makes it more prone to this concern.",
    'Occasional acne': "Inflammatory breakouts that may lead to post-inflammatory hyperpigmentation, which can persist longer in Indian skin tones.",
    'Hyperpigmentation': "Darkened patches due to excess melanin production triggered by UV exposure, inflammation, or hormonal changes - particularly persistent in Indian skin.",
    'Dullness': "Lack of radiance and glow due to accumulated dead skin cells, dehydration, or environmental damage.",
    'Flakiness': "Visible shedding of skin cells due to dryness, disrupted barrier function, or environmental factors.",
    'Fine lines': "Early signs of aging appearing as subtle creases, typically around the eyes and mouth, often exacerbated by dryness.",
    'Acne': "Persistent inflammatory breakouts caused by excess oil, bacteria, and clogged pores.",
    'Enlarged pores': "Visibly dilated follicle openings, usually on the nose and central face, due to genetic factors, excess oil, and age.",
    'Shine': "Excess surface oil giving a reflective appearance, particularly in the T-zone.",
    'Post-inflammatory hyperpigmentation': "Dark marks left after inflammation or injury to the skin, particularly persistent in higher Fitzpatrick skin types common in India.",
    'Uneven texture': "Irregular skin surface with rough patches, bumps, or inconsistent smoothness.",
    'Sensitivity to products': "Reactive skin that shows irritation, redness, or discomfort when using certain skincare products or ingredients."
  };
  
  return concerns.map(concern => detailsMap[concern] || "");
}

function displayError() {
  const popup = document.querySelector('div[style*="position: fixed; top: 50%;"]');
  if (!popup) return;
  
  popup.innerHTML = `
    <h3 style="color: #FF6B6B;">Analysis Error</h3>
    <p>We encountered an error while analyzing your skin. Please try again with better lighting conditions.</p>
    <button onclick="this.parentElement.remove()" style="padding: 8px 15px; background: #FF6B6B; color: white; border: none; border-radius: 5px; width: 100%; margin-top: 15px;">Close</button>
  `;
}

// Initialize Glow Coin display when page loads
document.addEventListener('DOMContentLoaded', function() {
  updateGlowCoinDisplay();
});

// Initialize goals
function initializeGoals() {
    const savedGoals = localStorage.getItem(GOALS_STORAGE_KEY);
    const lastReset = localStorage.getItem('lastGoalsReset');
    const now = new Date();
    const today = now.toDateString();

    if (!savedGoals || lastReset !== today) {
        // Reset goals at midnight
        localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(GOALS));
        localStorage.setItem('lastGoalsReset', today);
        updateGoalsDisplay();
    } else {
        const goals = JSON.parse(savedGoals);
        updateGoalsDisplay(goals);
    }

    // Set up midnight reset check
    checkMidnightReset();
}

// Check if it's time to reset goals
function checkMidnightReset() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const timeUntilMidnight = tomorrow - now;
    
    setTimeout(() => {
        initializeGoals();
        checkMidnightReset();
    }, timeUntilMidnight);
}

// Update goal progress
function updateGoalProgress(goalType, amount = 1) {
    const goals = JSON.parse(localStorage.getItem(GOALS_STORAGE_KEY));
    
    if (!goals[goalType].completed) {
        goals[goalType].current += amount;
        
        if (goals[goalType].current >= goals[goalType].max) {
            goals[goalType].completed = true;
            celebrateGoalCompletion(goalType);
        }
        
        localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals));
        updateGoalsDisplay(goals);
    }
}

// Update goals display
function updateGoalsDisplay(goals = JSON.parse(localStorage.getItem(GOALS_STORAGE_KEY))) {
    Object.entries(goals).forEach(([goalType, goal]) => {
        const goalElement = document.querySelector(`[data-goal="${goalType}"]`);
        if (!goalElement) return;

        const progressBar = goalElement.querySelector('.progress-bar-fill');
        const progressText = goalElement.querySelector('.goal-progress');
        const chest = goalElement.querySelector('.goal-chest');
        
        const progress = (goal.current / goal.max) * 100;
        progressBar.style.width = `${progress}%`;
        
        if (goalType === 'pollution') {
            progressText.textContent = goal.completed ? 'Completed today!' : 'Not completed today';
        } else {
            progressText.textContent = `${goal.current}/${goal.max} ${goalType === 'scan' ? 'scans' : 'glasses'} today`;
        }
        
        if (goal.completed) {
            chest.classList.remove('closed');
            chest.classList.add('open');
        } else {
            chest.classList.add('closed');
            chest.classList.remove('open');
        }
    });
}

// Celebrate goal completion
function celebrateGoalCompletion(goalType) {
    const goalElement = document.querySelector(`[data-goal="${goalType}"]`);
    if (!goalElement) return;

    // Play celebration sound
    if (!document.querySelector('.sound-toggle.muted')) {
        celebrationSound.play();
    }

    // Add celebration animation
    goalElement.classList.add('celebrating');
    setTimeout(() => goalElement.classList.remove('celebrating'), 500);

    // Create confetti effect
    createConfetti();
}

// Create confetti effect
function createConfetti() {
    const colors = ['#FF6B6B', '#FF8E53', '#FFD700', '#4CAF50', '#2196F3'];
    
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animation = `confetti-fall ${Math.random() * 3 + 2}s linear`;
        
        document.body.appendChild(confetti);
        
        setTimeout(() => confetti.remove(), 5000);
    }
}

// Handle water glass click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('goal-emoji') && e.target.textContent === '🥤') {
        if (!document.querySelector('.sound-toggle.muted')) {
            waterSound.play();
        }
        updateGoalProgress('hydration');
    }
});

// Add sound toggle button
const soundToggle = document.createElement('button');
soundToggle.className = 'sound-toggle';
soundToggle.innerHTML = '🔊';
document.body.appendChild(soundToggle);

soundToggle.addEventListener('click', () => {
    soundToggle.classList.toggle('muted');
    soundToggle.innerHTML = soundToggle.classList.contains('muted') ? '🔇' : '🔊';
});

// Initialize goals when the page loads
document.addEventListener('DOMContentLoaded', initializeGoals);

// Update scan goal when face is scanned
const originalDisplayResults = displayResults;
displayResults = function(result, pollutionData, canvas) {
    originalDisplayResults(result, pollutionData, canvas);
    updateGoalProgress('scan');
    if (pollutionData) updateGoalProgress('pollution');
    try { renderFaceMapOverlay(canvas); } catch(_) {}
};

try { if (typeof renderSkinScan === 'function') { renderSkinScan(document.getElementById('main-content')); } } catch(_) {}

// Helper function to get product description
function getProductDescription(productName) {
  const descriptions = {
    'Light antioxidant moisturizer with SPF 30+': 'Perfect for daily use with broad spectrum protection.',
    'Vitamin C serum for brightening and protection': 'Fights free radicals and brightens skin tone.',
    'Clay-based cleanser for acne control': 'Deep cleansing formula for acne-prone skin.',
    'Ubtan-based daily cleanser with turmeric': 'Traditional Indian ingredients for natural glow.',
    'Niacinamide serum for reducing pigmentation': 'Targets dark spots and evens skin tone.',
    'Broad spectrum SPF 50 with PA+++ protection': 'Maximum protection against UV rays.',
    'Weekly kumkumadi mask for brightening': 'Traditional Ayurvedic formula for radiant skin.',
    'Gentle non-stripping oil cleanser': 'Removes makeup and impurities without stripping.',
    'Alpha arbutin serum for preventing pigmentation': 'Advanced formula for even skin tone.',
    'Lightweight gel moisturizer with ceramides': 'Hydrates without feeling heavy.',
    'Chemical exfoliant with AHAs': 'Gentle exfoliation for smooth skin.',
    'Oil-balancing cleanser with neem extract': 'Natural antibacterial properties.',
    'Tranexamic acid serum for hyperpigmentation': 'Clinical strength formula for dark spots.',
    'Physical sunscreen with zinc oxide': 'Mineral-based protection for sensitive skin.',
    'Gentle exfoliating mask with fruit enzymes': 'Natural exfoliation for glowing skin.'
  };
  return descriptions[productName] || 'Great for your skin type. Contains natural ingredients.';
}

// Helper function to get product price
function getProductPrice(productName) {
  const prices = {
    'Light antioxidant moisturizer with SPF 30+': '599',
    'Vitamin C serum for brightening and protection': '799',
    'Clay-based cleanser for acne control': '449',
    'Ubtan-based daily cleanser with turmeric': '399',
    'Niacinamide serum for reducing pigmentation': '699',
    'Broad spectrum SPF 50 with PA+++ protection': '499',
    'Weekly kumkumadi mask for brightening': '549',
    'Gentle non-stripping oil cleanser': '449',
    'Alpha arbutin serum for preventing pigmentation': '899',
    'Lightweight gel moisturizer with ceramides': '499',
    'Chemical exfoliant with AHAs': '599',
    'Oil-balancing cleanser with neem extract': '399',
    'Tranexamic acid serum for hyperpigmentation': '999',
    'Physical sunscreen with zinc oxide': '549',
    'Gentle exfoliating mask with fruit enzymes': '499'
  };
  return prices[productName] || '499';
}

// Helper function to get product image
function getProductImage(productName) {
  const images = {
    'Light antioxidant moisturizer with SPF 30+': '../assets/product1.jpg',
    'Vitamin C serum for brightening and protection': '../assets/de-tan.png',
    'Clay-based cleanser for acne control': '../assets/product1.jpg',
    'Ubtan-based daily cleanser with turmeric': '../assets/de-tan.png',
    'Niacinamide serum for reducing pigmentation': '../assets/product1.jpg',
    'Broad spectrum SPF 50 with PA+++ protection': '../assets/de-tan.png',
    'Weekly kumkumadi mask for brightening': '../assets/product1.jpg',
    'Gentle non-stripping oil cleanser': '../assets/de-tan.png',
    'Alpha arbutin serum for preventing pigmentation': '../assets/product1.jpg',
    'Lightweight gel moisturizer with ceramides': '../assets/de-tan.png',
    'Chemical exfoliant with AHAs': '../assets/product1.jpg',
    'Oil-balancing cleanser with neem extract': '../assets/de-tan.png',
    'Tranexamic acid serum for hyperpigmentation': '../assets/product1.jpg',
    'Physical sunscreen with zinc oxide': '../assets/de-tan.png',
    'Gentle exfoliating mask with fruit enzymes': '../assets/product1.jpg'
  };
  return images[productName] || '../assets/product1.jpg';
}


// ✅ Glow Coin Add Logic for AM/PM Plans
function completeTask(planId) {
  const tasks = document.querySelectorAll(`#${planId} .task`);
  let allDone = true;

  tasks.forEach(task => {
    task.classList.add('done');
    if (!task.classList.contains('done')) {
      allDone = false;
    }
  });

  localStorage.setItem(`${planId}-completed`, 'true');

  // 🪙 Add 1 Glow Coin on AM or PM complete
  const coinDisplay = document.querySelector('.glow-coin-count');
  if (coinDisplay) {
    const current = parseInt(coinDisplay.textContent || '0');
    coinDisplay.textContent = current + 1;
  }

  // ✅ If both AM & PM done, increase scan XP goal by 1
  const amDone = localStorage.getItem('am-tasks-completed') === 'true';
  const pmDone = localStorage.getItem('pm-tasks-completed') === 'true';

  if (amDone && pmDone) {
    const scanBar = document.querySelector('[data-goal="scan"] .progress-bar-fill');
    const scanLabel = document.querySelector('[data-goal="scan"] .goal-progress');

    if (scanBar && scanLabel) {
      let currentXP = parseInt(scanLabel.textContent.split('/')[0]);
      if (currentXP < 10) {
        currentXP += 1;
        const percentage = (currentXP / 10) * 100;
        scanBar.style.width = `${percentage}%`;
        scanLabel.textContent = `${currentXP}/10`;
      }
    }
  }
}

// === Face Region Overlay Generation ===
const FACE_API_MODELS_PATH = '../assets/models'; // Place models here for accurate detection
const FACE_API_MODELS_CDN = 'https://justadudewhohacks.github.io/face-api.js/models';

async function renderFaceMapOverlay(sourceCanvas, attempt = 0) {
  let faceMap = document.getElementById('face-map-container');
  if (!faceMap) {
    // Try to navigate to GlowShield so container is present
    const glowBtn = document.getElementById('icon-glowshield');
    if (glowBtn) glowBtn.click();
    if (attempt < 5) {
      return setTimeout(() => renderFaceMapOverlay(sourceCanvas, attempt + 1), 300);
    }
  }
  if (!faceMap || !sourceCanvas) return;

  // Working canvas normalized to square for consistent crops
  const base = 512;
  const work = document.createElement('canvas');
  work.width = base; work.height = base;
  const ctx = work.getContext('2d');
  ctx.drawImage(sourceCanvas, 0, 0, base, base);

  // Try accurate landmark-based regions; fallback to heuristic
  let regions;
  if (window.faceapi) {
    try {
      regions = await computeRegionsWithFaceApi(work, base);
    } catch (_) {
      regions = null;
    }
  }
  if (!regions) {
    // Heuristic approx face bounds
    const faceX = base * 0.18, faceY = base * 0.10, faceW = base * 0.64, faceH = base * 0.80;
    regions = {
      eyes: { x: faceX + faceW*0.10, y: faceY + faceH*0.35, w: faceW*0.80, h: faceH*0.20, label: 'Eyes' },
      forehead: { x: faceX + faceW*0.10, y: faceY + faceH*0.06, w: faceW*0.80, h: faceH*0.20, label: 'Forehead' },
      chin: { x: faceX + faceW*0.20, y: faceY + faceH*0.72, w: faceW*0.60, h: faceH*0.16, label: 'Chin' }
    };
  }

  // Analyze each region and produce a zoomed frame with overlays and stats
  const frames = [];
  for (const [key, r] of Object.entries(regions)) {
    const crop = document.createElement('canvas');
    const outW = 360, outH = 360; // zoom frames
    crop.width = outW; crop.height = outH;
    const cctx = crop.getContext('2d');
    cctx.drawImage(work, r.x, r.y, r.w, r.h, 0, 0, outW, outH);

    // Analyze on original scale for scores
    const imgData = ctx.getImageData(r.x|0, r.y|0, r.w|0, r.h|0);
    const stats = analyzeRegion(imgData);

    // Draw overlay lines on zoomed crop
    drawZoomOverlay(cctx, outW, outH, key, stats);

    // Add label + score footer
    cctx.fillStyle = 'rgba(0,0,0,0.5)';
    cctx.fillRect(0, outH - 36, outW, 36);
    cctx.fillStyle = '#fff';
    cctx.font = 'bold 14px Segoe UI, Arial';
    if (key === 'eyes') {
      cctx.fillText(`${r.label}: Dark Circles ${stats.darkCirclesScore}%`, 10, outH - 14);
    } else {
      cctx.fillText(`${r.label}: Wrinkles ${stats.wrinkleScore}%`, 10, outH - 14);
    }

    frames.push({ key, canvas: crop, stats });
  }

  // Render 3 frames in a responsive grid with per-frame stats
  faceMap.innerHTML = '';
  const grid = document.createElement('div');
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = 'repeat(3, minmax(0, 1fr))';
  grid.style.gap = '8px';

  frames.forEach(({ key, canvas, stats }) => {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg shadow-sm overflow-hidden';
    const img = document.createElement('img');
    img.src = canvas.toDataURL('image/png');
    img.alt = `${key} zoom`;
    img.style.width = '100%';
    img.style.display = 'block';

    const statBar = document.createElement('div');
    statBar.style.padding = '6px 8px';
    statBar.style.display = 'flex';
    statBar.style.alignItems = 'center';
    statBar.style.justifyContent = 'space-between';
    const label = key === 'eyes' ? 'Dark Circles' : 'Wrinkles';
    const val = key === 'eyes' ? stats.darkCirclesScore : stats.wrinkleScore;
    const color = colorForScore(val);
    statBar.innerHTML = `<span style="font-weight:600">${label}</span><span style="color:${color}; font-weight:700">${val}%</span>`;

    card.appendChild(img);
    card.appendChild(statBar);
    grid.appendChild(card);
  });

  faceMap.appendChild(grid);
}

async function ensureFaceApiModelsLoaded() {
  if (!window.faceapi) throw new Error('face-api.js not loaded');
  const promises = [];
  if (!window.__faceApiModelsLoaded) {
    try {
      promises.push(faceapi.nets.tinyFaceDetector.loadFromUri(FACE_API_MODELS_PATH));
      promises.push(faceapi.nets.faceLandmark68Net.loadFromUri(FACE_API_MODELS_PATH));
      await Promise.all(promises);
      window.__faceApiModelsLoaded = true;
    } catch (e) {
      // Fallback to CDN models
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(FACE_API_MODELS_CDN),
        faceapi.nets.faceLandmark68Net.loadFromUri(FACE_API_MODELS_CDN)
      ]);
      window.__faceApiModelsLoaded = true;
    }
  }
}

async function computeRegionsWithFaceApi(workCanvas, base) {
  await ensureFaceApiModelsLoaded();
  const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 });
  const det = await faceapi.detectSingleFace(workCanvas, options).withFaceLandmarks();
  if (!det) throw new Error('No face detected');

  const lm = det.landmarks;
  const toRect = (pts, pad = 0) => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    pts.forEach(p => { minX = Math.min(minX, p.x); minY = Math.min(minY, p.y); maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y); });
    const w = (maxX - minX), h = (maxY - minY);
    return { x: Math.max(0, minX - pad), y: Math.max(0, minY - pad), w: Math.min(base, w + pad*2), h: Math.min(base, h + pad*2) };
  };

  const leftEye = lm.getLeftEye();
  const rightEye = lm.getRightEye();
  const eyesPts = leftEye.concat(rightEye);
  let eyesRect = toRect(eyesPts, 20);
  // Expand eyes rect horizontally a bit
  eyesRect.x = Math.max(0, eyesRect.x - 20);
  eyesRect.w = Math.min(base - eyesRect.x, eyesRect.w + 40);

  const leftBrow = lm.getLeftEyeBrow();
  const rightBrow = lm.getRightEyeBrow();
  const browsPts = leftBrow.concat(rightBrow);
  const browsRect = toRect(browsPts, 10);
  // Forehead region: above eyebrows
  const foreheadHeight = Math.min( Math.max(40, browsRect.h * 1.2), base*0.25 );
  const forehead = {
    x: Math.max(0, browsRect.x - 20),
    y: Math.max(0, browsRect.y - foreheadHeight - 10),
    w: Math.min(base - Math.max(0, browsRect.x - 20), browsRect.w + 40),
    h: foreheadHeight
  };

  const jaw = lm.getJawOutline();
  // Chin region: lower third of jaw box
  const jawRect = toRect(jaw, 10);
  const chinHeight = Math.max(40, Math.round(jawRect.h * 0.35));
  const chin = {
    x: Math.max(0, jawRect.x + Math.round(jawRect.w * 0.2)),
    y: Math.min(base - chinHeight, jawRect.y + Math.round(jawRect.h * 0.65)),
    w: Math.round(jawRect.w * 0.6),
    h: chinHeight
  };

  return {
    eyes: { ...eyesRect, label: 'Eyes' },
    forehead: { ...forehead, label: 'Forehead' },
    chin: { ...chin, label: 'Chin' }
  };
}

function analyzeRegion(imageData) {
  const { data, width, height } = imageData;
  let total = 0, darkSum = 0;
  let gradSum = 0;
  // simple luminance + gradient magnitude proxy
  for (let y = 1; y < height-1; y++) {
    for (let x = 1; x < width-1; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx], g = data[idx+1], b = data[idx+2];
      const lum = 0.299*r + 0.587*g + 0.114*b;
      total++;
      if (lum < 90) darkSum += (90 - lum); // darker-than-threshold counts as dark circle proxy

      // Sobel-like quick gradient magnitude approximation
      const idxL = idx - 4, idxR = idx + 4, idxT = idx - width*4, idxB = idx + width*4;
      const lumL = 0.299*data[idxL]+0.587*data[idxL+1]+0.114*data[idxL+2];
      const lumR = 0.299*data[idxR]+0.587*data[idxR+1]+0.114*data[idxR+2];
      const lumT = 0.299*data[idxT]+0.587*data[idxT+1]+0.114*data[idxT+2];
      const lumB = 0.299*data[idxB]+0.587*data[idxB+1]+0.114*data[idxB+2];
      const gx = lumR - lumL, gy = lumB - lumT;
      gradSum += Math.sqrt(gx*gx + gy*gy);
    }
  }
  const darkScore = Math.min(100, Math.max(0, Math.round((darkSum/(total||1)) * 0.8)));
  const wrinkleScore = Math.min(100, Math.max(0, Math.round(gradSum/(total||1) * 0.2)));
  return { darkCirclesScore: darkScore, wrinkleScore };
}

function drawRegionBox(ctx, r, score, label) {
  const color = colorForScore(score);
  ctx.save();
  ctx.lineWidth = 3;
  ctx.strokeStyle = color;
  ctx.setLineDash([6,4]);
  ctx.strokeRect(r.x, r.y, r.w, r.h);
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.12;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.globalAlpha = 1;
  // label
  ctx.font = 'bold 12px Segoe UI, Arial';
  ctx.fillStyle = color;
  const text = `${label} (${score}%)`;
  ctx.fillText(text, r.x + 6, r.y - 6 < 10 ? r.y + 14 : r.y - 6);
  ctx.restore();
}

function colorForScore(score) {
  if (score >= 66) return '#EF4444'; // red
  if (score >= 33) return '#F59E0B'; // amber
  return '#10B981'; // green
}


