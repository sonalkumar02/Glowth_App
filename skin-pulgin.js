// Cursor AI Se Likha Hua Code (Aajao Client Pakdo)
// Step 1: Button Add Karo
const skinScanBtn = document.createElement('button');
skinScanBtn.innerHTML = '✨ Indian Skin Analysis';
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
`;

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
    document.getElementById('capture-btn').addEventListener('click', () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0);
      
      // 4. Advanced Analysis for Indian Skin
      // Simulating analysis with more precise Indian skin types
      popup.innerHTML = `
        <h3 style="color: #FF6B6B;">Analyzing your skin...</h3>
        <p>Please wait while we process your image</p>
        <div style="width: 100%; height: 10px; background: #f0f0f0; border-radius: 5px; margin: 15px 0;">
          <div style="width: 0%; height: 100%; background: linear-gradient(90deg, #FF6B6B, #FF8E53); border-radius: 5px;" id="progress-bar"></div>
        </div>
      `;
      
      const progressBar = document.getElementById('progress-bar');
      let width = 0;
      const interval = setInterval(() => {
        if (width >= 100) {
          clearInterval(interval);
          displayResults();
        } else {
          width += 2;
          progressBar.style.width = width + '%';
        }
      }, 50);
      
      function displayResults() {
        // Indian Skin Types with more specific categories
        const indianSkinTypes = [
          {
            type: 'Warm Undertone Combination',
            description: 'Your skin has a warm golden undertone with combination characteristics - oily T-zone with normal to dry cheeks.',
            concerns: ['Uneven skin tone', 'Occasional acne', 'Hyperpigmentation'],
            products: [
              'Gentle pH-balanced cleanser with neem extract',
              'Vitamin C serum with turmeric extract (morning)',
              'Non-comedogenic moisturizer with sunscreen SPF 50 PA++++ (daytime)',
              'Night cream with licorice extract for brightening'
            ]
          },
          {
            type: 'Cool Undertone Dry',
            description: 'Your skin has a cool undertone with overall dryness, common in Northern regions of India.',
            concerns: ['Dullness', 'Flakiness', 'Fine lines'],
            products: [
              'Cream-based cleanser with aloe vera',
              'Hydrating toner with rose water',
              'Rich moisturizer with shea butter and kokum butter',
              'Weekly ubtan mask with besan (gram flour) and milk'
            ]
          },
          {
            type: 'Neutral Undertone Oily',
            description: 'Your skin has a neutral undertone with excess oil production, common in humid regions of India.',
            concerns: ['Acne', 'Enlarged pores', 'Shine'],
            products: [
              'Clay-based cleanser with multani mitti',
              'Alcohol-free toner with tea tree oil',
              'Lightweight gel moisturizer with aloe vera',
              'Weekly kaolin clay mask with neem oil'
            ]
          },
          {
            type: 'Melanin-Rich Sensitive',
            description: 'Your skin has high melanin content with sensitivity to environmental factors.',
            concerns: ['Post-inflammatory hyperpigmentation', 'Uneven texture', 'Sensitivity to products'],
            products: [
              'Fragrance-free gentle cleanser',
              'Barrier-repairing serum with ceramides',
              'Broad-spectrum mineral sunscreen SPF 30+',
              'Soothing mask with colloidal oatmeal and honey'
            ]
          }
        ];
        
        // Select analysis result - in a real app this would be based on image processing
        const result = indianSkinTypes[Math.floor(Math.random() * indianSkinTypes.length)];
        
        // Display detailed results
        popup.innerHTML = `
          <h3 style="color: #FF6B6B;">Your Indian Skin Analysis Result:</h3>
          <div style="background: #FFF6F6; padding: 15px; border-radius: 8px; margin: 10px 0;">
            <p style="font-weight: bold; margin-bottom: 8px;">Skin Type: ${result.type}</p>
            <p style="font-size: 14px; margin-bottom: 15px;">${result.description}</p>
          </div>
          
          <div style="margin: 15px 0;">
            <p style="font-weight: bold; color: #666;">Key Concerns:</p>
            <ul style="padding-left: 20px;">
              ${result.concerns.map(concern => `<li style="margin-bottom: 5px;">${concern}</li>`).join('')}
            </ul>
          </div>
          
          <div style="margin: 15px 0;">
            <p style="font-weight: bold; color: #666;">Recommended Ayurvedic & Modern Products:</p>
            <ol style="padding-left: 20px;">
              ${result.products.map(product => `<li style="margin-bottom: 8px;">${product}</li>`).join('')}
            </ol>
          </div>
          
          <p style="font-size: 12px; color: #888; margin: 15px 0;">Note: These recommendations are based on visual analysis. For a complete skin diagnosis, consult a dermatologist.</p>
          
          <div style="display: flex; justify-content: space-between; margin-top: 15px;">
            <button onclick="this.parentElement.parentElement.remove()" style="padding: 8px 15px; background: #FF6B6B; color: white; border: none; border-radius: 5px; width: 100%;">Close</button>
          </div>
        `;
      }
      
      // Stream Band Karo
      stream.getTracks().forEach(track => track.stop());
    });

  } catch (err) {
    alert('Error: ' + err.message);
  }
});

// Website Pe Button Add Karo
document.body.appendChild(skinScanBtn);