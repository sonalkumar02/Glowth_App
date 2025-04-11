# Skin Analysis Tool

A simple web-based tool that provides mock skin analysis using your device camera.

## Features

- Interactive button that appears on any webpage
- Camera access to capture skin images
- Mock AI skin type detection (randomly selects from Oily, Dry, Combination, Normal)
- Product recommendations based on detected skin type

## How to Run

### Method 1: Direct Browser Opening

1. Ensure both `index.html` and `skin-pulgin.js` files are in the same directory
2. Double-click on `index.html` to open in your default browser
   
   OR

3. From the command line:
   ```
   start index.html       # Windows
   open index.html        # macOS
   xdg-open index.html    # Linux
   ```

### Method 2: Using a Local Server (recommended for development)

1. If you have Node.js installed:
   ```
   npm install -g http-server
   http-server
   ```
2. Visit http://localhost:8080 in your browser

## Usage

1. Click the "✨ FREE Skin Analysis" button in the bottom-right corner
2. Allow camera access when prompted
3. Position your face in the camera view
4. Click the "Capture" button
5. View your skin analysis results
6. Click "Close" to dismiss the popup

## Notes

- This is a client-side application with mock AI functionality
- No data is sent to any server
- For demonstration purposes only 