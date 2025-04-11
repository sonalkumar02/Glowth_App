// Cursor AI Se Likha Hua Code (Aajao Client Pakdo)
// Step 1: Button Add Karo
const skinScanBtn = document.createElement('button');
skinScanBtn.innerHTML = '✨ FREE Skin Analysis';
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

// Step 2: Camera Access + Basic AI Logic
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
      <h3 style="color: #FF6B6B;">Scanning Your Skin...</h3>
      <video id="live-cam" width="100%" autoplay></video>
      <button id="capture-btn" style="margin-top: 10px; padding: 10px; background: #FF6B6B; color: white; border: none; border-radius: 5px;">Capture</button>
    `;
    document.body.appendChild(popup);
    document.getElementById('live-cam').srcObject = stream;

    // 3. Capture Button
    document.getElementById('capture-btn').addEventListener('click', () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      
      // 4. Mock AI Response (Pehle ChatGPT API se replace karna)
      const skinTypes = ['Oily', 'Dry', 'Combination', 'Normal'];
      const randomSkinType = skinTypes[Math.floor(Math.random() * skinTypes.length)];
      
      popup.innerHTML = `
        <h3 style="color: #FF6B6B;">Your Skin Analysis Result:</h3>
        <p><strong>Skin Type:</strong> ${randomSkinType}</p>
        <p><strong>Recommended Products:</strong></p>
        <ol>
          <li>Cleanser for ${randomSkinType} skin</li>
          <li>Moisturizer with SPF 30</li>
          <li>Night serum with Vitamin C</li>
        </ol>
        <button onclick="this.parentElement.remove()" style="padding: 8px 15px; background: #FF6B6B; color: white; border: none; border-radius: 5px;">Close</button>
      `;
      
      // Stream Band Karo
      stream.getTracks().forEach(track => track.stop());
    });

  } catch (err) {
    alert('Error: ' + err.message);
  }
});

// Website Pe Button Add Karo
document.body.appendChild(skinScanBtn);