// Initialize connection with extension
const vscode = acquireVsCodeApi();

// Store state
let functions = [];
let filename = '';
let settings = {
  style: 'squares',
  colorTheme: 'rainbow',
  customColorPrimary: '#FF0000',
  customColorSecondary: '#0000FF',
  padding: 10,
  animationEnabled: true
};

// p5.js sketch
function setup() {
  createCanvas(window.innerWidth, window.innerHeight);
  windowResized();
  colorMode(HSB, 360, 100, 100);
}

function draw() {
  background(220, 10, 20);
  drawFunctions();
  displayInfo();
}

function windowResized() {
  resizeCanvas(window.innerWidth, window.innerHeight);
}

function drawFunctions() {
  if (functions.length === 0) { return; }
  
  // Find max function size for normalization
  const maxSize = Math.max(...functions.map(f => f.size));
  
  // Calculate grid dimensions based on number of functions
  const numFunctions = functions.length;
  const numCols = Math.ceil(Math.sqrt(numFunctions));
  const numRows = Math.ceil(numFunctions / numCols);
  
  // Calculate cell size
  const cellWidth = width / numCols;
  const cellHeight = height / numRows;
  const padding = settings.padding;
  
  // Draw shapes for each function
  functions.forEach((func, i) => {
    const row = Math.floor(i / numCols);
    const col = i % numCols;
    
    const x = col * cellWidth + padding;
    const y = row * cellHeight + padding;
    const size = map(func.size, 1, maxSize, 20, Math.min(cellWidth, cellHeight) - padding * 2);
    
    const hue = hashString(func.name) % 360;
    
    // Apply colors based on settings
    let fillColor, strokeColor;
    switch(settings.colorTheme) {
      case 'monoBlue':
        fillColor = color(210, map(func.size, 1, maxSize, 30, 90), 80);
        strokeColor = color(210, 80, 60);
        break;
      case 'monoGreen':
        fillColor = color(120, map(func.size, 1, maxSize, 30, 90), 80);
        strokeColor = color(120, 80, 60);
        break;
      case 'monoPurple':
        fillColor = color(270, map(func.size, 1, maxSize, 30, 90), 80);
        strokeColor = color(270, 80, 60);
        break;
      case 'custom':
        // Use custom colors with interpolation based on function size
        let c1 = color(settings.customColorPrimary);
        let c2 = color(settings.customColorSecondary);
        let amt = map(func.size, 1, maxSize, 0, 1);
        fillColor = lerpColor(c1, c2, amt);
        strokeColor = lerpColor(c2, c1, amt);
        break;
      case 'rainbow':
      default:
        fillColor = color(hue, 60, 90);
        strokeColor = color(hue, 80, 70);
    }
      
    // Apply styles based on settings
    fill(fillColor);
    stroke(strokeColor);
    strokeWeight(2);
    
    // Draw the shape based on the style setting
    switch(settings.style) {
      case 'circles':
        ellipseMode(CENTER);
        ellipse(x + cellWidth/2, y + cellHeight/2, size, size);
        break;
      case 'triangles':
        const halfSize = size/2;
        triangle(
          x + cellWidth/2, y + cellHeight/2 - halfSize, // top
          x + cellWidth/2 - halfSize, y + cellHeight/2 + halfSize, // bottom left
          x + cellWidth/2 + halfSize, y + cellHeight/2 + halfSize  // bottom right
        );
        break;
      case 'squares':
      default:
        rectMode(CENTER);
        rect(x + cellWidth/2, y + cellHeight/2, size, size);
    }
      
    // Add text label
    fill(0, 0, 0);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(10);
    text(func.name, x + cellWidth/2, y + cellHeight/2 + size/2 + 10);
  });
}

function displayInfo() {
  document.getElementById('info').textContent = 
    `File: ${filename || 'No file selected'} | Functions: ${functions.length}`;
}

// Simple string hash function
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Listen for messages from the extension
window.addEventListener('message', event => {
  const message = event.data;
  
  if (message.type === 'update') {
    const oldFunctions = functions;
    functions = message.data;
    filename = message.filename;
    
    // Apply animation if enabled
    if (settings.animationEnabled && oldFunctions.length > 0) {
      // We could add animation effects here in the future
      // For now just a simple flash effect
      background(255, 255, 255, 100);
      setTimeout(() => background(220, 10, 20), 200);
    }
  } else if (message.type === 'settings') {
    settings = message.settings;
    // Redraw with new settings
    redraw();
  }
});
