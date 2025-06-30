// ===== TYPE DEFINITIONS =====

// VS Code webview API
interface VsCodeApi {
  postMessage(message: any): void;
  getState(): any;
  setState(state: any): void;
}

declare function acquireVsCodeApi(): VsCodeApi;

// p5.js globals (subset used in this sketch)
declare let width: number;
declare let height: number;
declare function createCanvas(w: number, h: number): void;
declare function resizeCanvas(w: number, h: number): void;
declare function background(r: number, g?: number, b?: number, a?: number): void;
declare function colorMode(mode: string, max1: number, max2: number, max3: number): void;
declare function fill(color: any): void;
declare function stroke(color: any): void;
declare function strokeWeight(weight: number): void;
declare function noStroke(): void;
declare function ellipseMode(mode: string): void;
declare function ellipse(x: number, y: number, w: number, h?: number): void;
declare function rectMode(mode: string): void;
declare function rect(x: number, y: number, w: number, h: number): void;
declare function triangle(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): void;
declare function textAlign(horizAlign: string, vertAlign: string): void;
declare function textSize(size: number): void;
declare function text(str: string, x: number, y: number): void;
declare function map(value: number, start1: number, stop1: number, start2: number, stop2: number): number;
declare function color(r: number | string, g?: number, b?: number, a?: number): any;
declare function lerpColor(c1: any, c2: any, amt: number): any;
declare function redraw(): void;
declare function random(min?: number, max?: number): number;
declare function noise(x: number, y?: number, z?: number): number;
declare function millis(): number;

// Message types
interface UpdateMessage {
  type: 'update';
  data: FunctionData[];
  filename: string;
}

interface SettingsMessage {
  type: 'settings';
  settings: VisualizationSettings;
}

type WebviewMessage = UpdateMessage | SettingsMessage;

// Data structures
interface FunctionData {
  name: string;
  size: number;
}

interface VisualizationSettings {
  style: 'squares' | 'circles' | 'triangles';
  colorTheme: 'rainbow' | 'monoBlue' | 'monoGreen' | 'monoPurple' | 'custom';
  customColorPrimary: string;
  customColorSecondary: string;
  padding: number;
  animationEnabled: boolean;
}

// Animation data structure
interface AnimatedShape {
  func: FunctionData;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  size: number;
  hue: number;
  noiseOffsetX: number;
  noiseOffsetY: number;
  speed: number;
}

// ===== GLOBAL STATE =====

// Initialize connection with extension
const vscode: VsCodeApi = acquireVsCodeApi();

// Application state
let functions: FunctionData[] = [];
let filename: string = '';
let settings: VisualizationSettings = {
  style: 'squares',
  colorTheme: 'rainbow',
  customColorPrimary: '#FF0000',
  customColorSecondary: '#0000FF',
  padding: 10,
  animationEnabled: true
};

// Animation state
let animatedShapes: AnimatedShape[] = [];
let lastUpdateTime: number = 0;
const ANIMATION_SPEED = 0.02;
const WANDER_RADIUS = 50;

// ===== P5.JS SKETCH FUNCTIONS =====

function setup(): void {
  createCanvas(window.innerWidth, window.innerHeight);
  windowResized();
  colorMode('HSB', 360, 100, 100);
  lastUpdateTime = millis();
}

function draw(): void {
  background(10, 10, 10);
  
  if (settings.animationEnabled) {
    updateAnimations();
    drawAnimatedShapes();
  } else {
    drawStaticShapes();
  }
  
  displayInfo();
}

function windowResized(): void {
  resizeCanvas(window.innerWidth, window.innerHeight);
  // Reinitialize shapes for new canvas size
  if (functions.length > 0) {
    initializeAnimatedShapes();
  }
}

// ===== ANIMATION SYSTEM =====

function initializeAnimatedShapes(): void {
  if (functions.length === 0) {
    animatedShapes = [];
    return;
  }

  const maxSize = Math.max(...functions.map(f => f.size));
  
  animatedShapes = functions.map((func, i) => {
    const size = map(func.size, 1, maxSize, 20, 80);
    const hue = hashString(func.name) % 360;
    
    // Start at random positions
    const x = random(size, width - size);
    const y = random(size, height - size);
    
    return {
      func,
      x,
      y,
      targetX: x,
      targetY: y,
      size,
      hue,
      noiseOffsetX: random(1000),
      noiseOffsetY: random(1000),
      speed: random(0.5, 2.0)
    };
  });
}

function updateAnimations(): void {
  const currentTime = millis();
  const deltaTime = currentTime - lastUpdateTime;
  lastUpdateTime = currentTime;
  
  animatedShapes.forEach((shape, i) => {
    // Use Perlin noise for smooth wandering movement
    const noiseScale = 0.005;
    const time = currentTime * 0.001;
    
    // Generate target positions using noise
    const noiseX = noise(shape.noiseOffsetX + time * shape.speed) * 2 - 1;
    const noiseY = noise(shape.noiseOffsetY + time * shape.speed) * 2 - 1;
    
    shape.targetX = width/2 + noiseX * WANDER_RADIUS * 3;
    shape.targetY = height/2 + noiseY * WANDER_RADIUS * 3;
    
    // Constrain to canvas bounds
    shape.targetX = Math.max(shape.size, Math.min(width - shape.size, shape.targetX));
    shape.targetY = Math.max(shape.size, Math.min(height - shape.size, shape.targetY));
    
    // Smoothly move towards target
    const lerpAmount = ANIMATION_SPEED * shape.speed;
    shape.x += (shape.targetX - shape.x) * lerpAmount;
    shape.y += (shape.targetY - shape.y) * lerpAmount;
  });
}

function drawAnimatedShapes(): void {
  animatedShapes.forEach(shape => {
    drawShape(shape.x, shape.y, shape.size, shape.hue, shape.func);
  });
}

function drawStaticShapes(): void {
  if (functions.length === 0) {
    return;
  }
  
  const maxSize = Math.max(...functions.map(f => f.size));
  const numFunctions = functions.length;
  const numCols = Math.ceil(Math.sqrt(numFunctions));
  const numRows = Math.ceil(numFunctions / numCols);
  const cellWidth = width / numCols;
  const cellHeight = height / numRows;
  const padding = settings.padding;
  
  functions.forEach((func, i) => {
    const row = Math.floor(i / numCols);
    const col = i % numCols;
    const x = col * cellWidth + cellWidth/2;
    const y = row * cellHeight + cellHeight/2;
    const size = map(func.size, 1, maxSize, 20, Math.min(cellWidth, cellHeight) - padding * 2);
    const hue = hashString(func.name) % 360;
    
    drawShape(x, y, size, hue, func);
  });
}

// ===== RENDERING UTILITIES =====

function drawShape(x: number, y: number, size: number, hue: number, func: FunctionData): void {
  const { fillColor, strokeColor } = getShapeColors(hue, func.size);
  
  // Apply colors
  fill(fillColor);
  stroke(strokeColor);
  strokeWeight(2);
  
  // Draw the shape based on the style setting
  switch(settings.style) {
    case 'circles':
      ellipseMode('CENTER');
      ellipse(x, y, size, size);
      break;
    case 'triangles':
      const halfSize = size/2;
      triangle(
        x, y - halfSize, // top
        x - halfSize, y + halfSize, // bottom left
        x + halfSize, y + halfSize  // bottom right
      );
      break;
    case 'squares':
    default:
      rectMode('CENTER');
      rect(x, y, size, size);
  }
    
  // Add text label
  fill(color(0, 0, 0));
  noStroke();
  textAlign('CENTER', 'CENTER');
  textSize(10);
  text(func.name, x, y + size/2 + 15);
}

function getShapeColors(hue: number, functionSize: number): { fillColor: any, strokeColor: any } {
  const maxSize = Math.max(...functions.map(f => f.size));
  
  switch(settings.colorTheme) {
    case 'monoBlue':
      return {
        fillColor: color(210, map(functionSize, 1, maxSize, 30, 90), 80),
        strokeColor: color(210, 80, 60)
      };
    case 'monoGreen':
      return {
        fillColor: color(120, map(functionSize, 1, maxSize, 30, 90), 80),
        strokeColor: color(120, 80, 60)
      };
    case 'monoPurple':
      return {
        fillColor: color(270, map(functionSize, 1, maxSize, 30, 90), 80),
        strokeColor: color(270, 80, 60)
      };
    case 'custom':
      const c1 = color(settings.customColorPrimary);
      const c2 = color(settings.customColorSecondary);
      const amt = map(functionSize, 1, maxSize, 0, 1);
      return {
        fillColor: lerpColor(c1, c2, amt),
        strokeColor: lerpColor(c2, c1, amt)
      };
    case 'rainbow':
    default:
      return {
        fillColor: color(hue, 60, 90),
        strokeColor: color(hue, 80, 70)
      };
  }
}

// ===== UTILITY FUNCTIONS =====

function displayInfo(): void {
  const infoElement = document.getElementById('info');
  if (infoElement) {
    const animationStatus = settings.animationEnabled ? 'Animated' : 'Static';
    infoElement.textContent = 
      `File: ${filename || 'No file selected'} | Functions: ${functions.length} | Mode: ${animationStatus}`;
  }
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// ===== MESSAGE HANDLING =====

function handleDataUpdate(data: FunctionData[], newFilename: string): void {
  const hadFunctions = functions.length > 0;
  functions = data;
  filename = newFilename;
  
  // Initialize or reinitialize animated shapes
  if (settings.animationEnabled) {
    initializeAnimatedShapes();
    
    // Flash effect for updates
    if (hadFunctions) {
      background(255, 255, 255, 100);
      setTimeout(() => background(220, 10, 20), 200);
    }
  }
}

function handleSettingsUpdate(newSettings: VisualizationSettings): void {
  const wasAnimated = settings.animationEnabled;
  settings = newSettings;
  
  // If animation state changed, reinitialize shapes
  if (settings.animationEnabled !== wasAnimated) {
    if (settings.animationEnabled && functions.length > 0) {
      initializeAnimatedShapes();
    }
  }
  
  redraw();
}

// Listen for messages from the extension
window.addEventListener('message', (event: MessageEvent) => {
  const message = event.data as WebviewMessage;
  
  switch (message.type) {
    case 'update':
      handleDataUpdate(message.data, message.filename);
      break;
    case 'settings':
      handleSettingsUpdate(message.settings);
      break;
    default:
      console.warn('Unknown message type:', message);
  }
});

// ===== P5.JS GLOBAL EXPORTS =====

// Export functions for p5.js global mode
(window as any).setup = setup;
(window as any).draw = draw;
(window as any).windowResized = windowResized;
