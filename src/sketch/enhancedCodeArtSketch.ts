// ===== TYPE DEFINITIONS =====

// VS Code webview API
interface VsCodeApi {
  postMessage(message: any): void;
  getState(): any;
  setState(state: any): void;
}

declare function acquireVsCodeApi(): VsCodeApi;

// p5.js globals
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
declare function line(x1: number, y1: number, x2: number, y2: number): void;
declare function beginShape(): void;
declare function vertex(x: number, y: number): void;
declare function endShape(mode?: string): void;
declare function textAlign(horizAlign: string, vertAlign: string): void;
declare function textSize(size: number): void;
declare function text(str: string, x: number, y: number): void;
declare function map(value: number, start1: number, stop1: number, start2: number, stop2: number): number;
declare function color(r: number | string, g?: number, b?: number, a?: number): any;
declare function redraw(): void;
declare function random(min?: number, max?: number): number;
declare function noise(x: number, y?: number, z?: number): number;
declare function millis(): number;

// Enhanced data structures
interface ComplexityMetrics {
  lineCount: number;
  cyclomaticComplexity: number;
  nestingDepth: number;
  overallComplexity: number;
  intensityLevel: 'low' | 'medium' | 'high' | 'extreme';
}

interface EnhancedFunctionData {
  name: string;
  size: number;
  complexity: ComplexityMetrics;
}

interface VisualizationSettings {
  style: 'particles' | 'chaos' | 'flow' | 'classic';
  colorTheme: 'rainbow' | 'intensity' | 'monoBlue' | 'monoGreen' | 'monoPurple' | 'custom';
  customColorPrimary: string;
  customColorSecondary: string;
  padding: number;
  animationEnabled: boolean;
  particleIntensity: number; // 0-1 multiplier for particle effects
  debugMode: boolean; // Show debug information panel
}

interface ParticleSystemConfig {
  maxParticles: number;
  emissionRate: number;
  particleLifetime: number;
  chaos: number;
  speed: number;
  size: number;
  colorIntensity: number;
  trailLength: number;
}

interface Particle {
  id: string;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  acceleration: { x: number; y: number };
  size: number;
  color: { hue: number; saturation: number; brightness: number; alpha: number };
  life: number;
  maxLife: number;
  trail: { x: number; y: number }[];
  noiseOffset: { x: number; y: number };
}

interface FunctionVisualization {
  func: EnhancedFunctionData;
  particles: ParticleSystem;
  center: { x: number; y: number };
  targetCenter: { x: number; y: number };
  baseHue: number;
}

// Message types
interface UpdateMessage {
  type: 'update';
  data: EnhancedFunctionData[];
  filename: string;
}

interface SettingsMessage {
  type: 'settings';
  settings: VisualizationSettings;
}

type WebviewMessage = UpdateMessage | SettingsMessage;

// ===== PARTICLE SYSTEM =====

class ParticleSystem {
  private particles: Particle[] = [];
  private config: ParticleSystemConfig;
  private center: { x: number; y: number };
  private time: number = 0;
  private lastEmission: number = 0;

  constructor(center: { x: number; y: number }, config: ParticleSystemConfig) {
    this.center = center;
    this.config = config;
  }

  public update(deltaTime: number): void {
    this.time += deltaTime;
    
    this.emitParticles();
    this.updateParticles(deltaTime);
    this.cleanupParticles();
  }

  public render(): void {
    this.renderTrails();
    this.renderParticles();
  }

  private emitParticles(): void {
    const shouldEmit = (this.time - this.lastEmission) > (1000 / this.config.emissionRate);
    
    if (shouldEmit && this.particles.length < this.config.maxParticles) {
      const particle = this.createParticle();
      this.particles.push(particle);
      this.lastEmission = this.time;
    }
  }

  private createParticle(): Particle {
    const angle = random(0, Math.PI * 2);
    const distance = random(0, 30);
    
    return {
      id: `particle_${Date.now()}_${Math.random()}`,
      position: {
        x: this.center.x + Math.cos(angle) * distance,
        y: this.center.y + Math.sin(angle) * distance
      },
      velocity: {
        x: Math.cos(angle) * this.config.speed * random(0.5, 1.5),
        y: Math.sin(angle) * this.config.speed * random(0.5, 1.5)
      },
      acceleration: { x: 0, y: 0 },
      size: this.config.size * random(0.7, 1.3),
      color: {
        hue: random(0, 360),
        saturation: 60 + this.config.colorIntensity * 40,
        brightness: 70 + this.config.colorIntensity * 30,
        alpha: 1
      },
      life: this.config.particleLifetime,
      maxLife: this.config.particleLifetime,
      trail: [],
      noiseOffset: {
        x: random(1000),
        y: random(1000)
      }
    };
  }

  private updateParticles(deltaTime: number): void {
    this.particles.forEach(particle => {
      // Apply chaos through noise-based acceleration
      const chaosForce = this.config.chaos * 2;
      
      const noiseX = noise(particle.noiseOffset.x + this.time * 0.001) * 2 - 1;
      const noiseY = noise(particle.noiseOffset.y + this.time * 0.001) * 2 - 1;
      
      particle.acceleration.x = noiseX * chaosForce;
      particle.acceleration.y = noiseY * chaosForce;
      
      // Add attraction/repulsion to center based on chaos level
      const dx = this.center.x - particle.position.x;
      const dy = this.center.y - particle.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0) {
        const force = (this.config.chaos > 0.5 ? -0.2 : 0.1) / Math.max(distance, 1);
        particle.acceleration.x += (dx / distance) * force;
        particle.acceleration.y += (dy / distance) * force;
      }
      
      // Update velocity and position
      particle.velocity.x += particle.acceleration.x * deltaTime * 0.01;
      particle.velocity.y += particle.acceleration.y * deltaTime * 0.01;
      
      particle.velocity.x *= 0.98;
      particle.velocity.y *= 0.98;
      
      particle.position.x += particle.velocity.x * deltaTime * 0.01;
      particle.position.y += particle.velocity.y * deltaTime * 0.01;
      
      // Update trail
      if (this.config.trailLength > 0) {
        particle.trail.push({ ...particle.position });
        if (particle.trail.length > this.config.trailLength) {
          particle.trail.shift();
        }
      }
      
      // Update life
      particle.life -= deltaTime;
      
      // Fade alpha based on life
      const lifeRatio = particle.life / particle.maxLife;
      particle.color.alpha = Math.max(0, lifeRatio);
      
      // Size pulsation based on chaos
      const pulseFreq = 0.005 + this.config.chaos * 0.01;
      const pulseAmt = 1 + Math.sin(this.time * pulseFreq + parseFloat(particle.id)) * 0.2 * this.config.chaos;
      particle.size = this.config.size * pulseAmt;
    });
  }

  private cleanupParticles(): void {
    this.particles = this.particles.filter(particle => particle.life > 0);
  }

  private renderTrails(): void {
    if (this.config.trailLength === 0) return;
    
    this.particles.forEach(particle => {
      if (particle.trail.length < 2) return;
      
      strokeWeight(1);
      
      for (let i = 1; i < particle.trail.length; i++) {
        const segment = particle.trail[i];
        const prevSegment = particle.trail[i - 1];
        const alpha = (i / particle.trail.length) * particle.color.alpha * 0.3;
        
        stroke(color(
          particle.color.hue,
          particle.color.saturation * 0.8,
          particle.color.brightness * 0.8,
          alpha * 255
        ));
        
        line(prevSegment.x, prevSegment.y, segment.x, segment.y);
      }
    });
  }

  private renderParticles(): void {
    this.particles.forEach(particle => {
      const { position, size, color: particleColor } = particle;
      
      fill(color(
        particleColor.hue,
        particleColor.saturation,
        particleColor.brightness,
        particleColor.alpha * 255
      ));
      
      if (this.config.chaos > 0.3) {
        stroke(color(
          particleColor.hue,
          particleColor.saturation + 20,
          particleColor.brightness - 20,
          particleColor.alpha * 0.8 * 255
        ));
        strokeWeight(1 + this.config.chaos * 2);
      } else {
        noStroke();
      }
      
      if (this.config.chaos > 0.7) {
        this.drawAngularShape(position, size, this.config.chaos);
      } else {
        ellipseMode('CENTER');
        ellipse(position.x, position.y, size, size);
      }
    });
  }

  private drawAngularShape(position: { x: number; y: number }, size: number, intensity: number): void {
    const vertices = Math.floor(3 + intensity * 5);
    const radius = size / 2;
    
    beginShape();
    for (let i = 0; i < vertices; i++) {
      const angle = (i / vertices) * Math.PI * 2;
      const variation = 1 + (noise(position.x * 0.01, position.y * 0.01, this.time * 0.001) - 0.5) * intensity * 0.5;
      const x = position.x + Math.cos(angle) * radius * variation;
      const y = position.y + Math.sin(angle) * radius * variation;
      vertex(x, y);
    }
    endShape('CLOSE');
  }

  public setCenter(newCenter: { x: number; y: number }): void {
    this.center = newCenter;
  }

  public updateConfig(newConfig: Partial<ParticleSystemConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public clear(): void {
    this.particles = [];
  }
}

// ===== GLOBAL STATE =====

const vscode: VsCodeApi = acquireVsCodeApi();

let functions: EnhancedFunctionData[] = [];
let filename: string = '';
let settings: VisualizationSettings = {
  style: 'particles',
  colorTheme: 'intensity',
  customColorPrimary: '#FF0000',
  customColorSecondary: '#0000FF',
  padding: 10,
  animationEnabled: true,
  particleIntensity: 1.0,
  debugMode: false
};

let functionVisualizations: FunctionVisualization[] = [];
let lastUpdateTime: number = 0;

// ===== P5.JS SKETCH FUNCTIONS =====

function setup(): void {
  createCanvas(window.innerWidth, window.innerHeight);
  windowResized();
  colorMode('HSB', 360, 100, 100);
  lastUpdateTime = millis();
}

function draw(): void {
  // TEMPORARY: Bright green background to confirm new code is loading
  background(120, 80, 50); // Bright green for debugging
  console.log('draw() called - functions count:', functions.length);
  
  // Dynamic background based on overall complexity
  const avgComplexity = functions.length > 0 
    ? functions.reduce((sum, f) => sum + f.complexity.overallComplexity, 0) / functions.length
    : 0;
  
  console.log('Average complexity:', avgComplexity);
  
  if (settings.animationEnabled && (settings.style === 'particles' || settings.style === 'chaos' || settings.style === 'flow')) {
    updateParticleVisualizations();
    renderParticleVisualizations();
  } else {
    drawClassicShapes();
  }
  
  displayInfo();
}

function windowResized(): void {
  resizeCanvas(window.innerWidth, window.innerHeight);
  updateFunctionPositions();
}

// ===== VISUALIZATION SYSTEM =====

function initializeVisualizations(): void {
  functionVisualizations = [];
  
  if (functions.length === 0) return;
  
  const numCols = Math.ceil(Math.sqrt(functions.length));
  const numRows = Math.ceil(functions.length / numCols);
  const cellWidth = width / numCols;
  const cellHeight = height / numRows;
  
  functions.forEach((func, i) => {
    const row = Math.floor(i / numCols);
    const col = i % numCols;
    const centerX = col * cellWidth + cellWidth / 2;
    const centerY = row * cellHeight + cellHeight / 2;
    
    const config = generateParticleConfig(func.complexity);
    const particles = new ParticleSystem({ x: centerX, y: centerY }, config);
    
    functionVisualizations.push({
      func,
      particles,
      center: { x: centerX, y: centerY },
      targetCenter: { x: centerX, y: centerY },
      baseHue: hashString(func.name) % 360
    });
  });
}

function generateParticleConfig(complexity: ComplexityMetrics): ParticleSystemConfig {
  const intensity = complexity.overallComplexity;
  
  // Adjust particle behavior based on style
  let styleMultipliers = { chaos: 1, particles: 25, speed: 3, trails: 15, lifetime: 3000 };
  
  switch (settings.style) {
    case 'chaos':
      styleMultipliers = { chaos: 3, particles: 40, speed: 5, trails: 25, lifetime: 2000 };
      break;
    case 'flow':
      styleMultipliers = { chaos: 0.3, particles: 15, speed: 2, trails: 30, lifetime: 4000 };
      break;
    case 'particles':
    default:
      styleMultipliers = { chaos: 1, particles: 25, speed: 3, trails: 15, lifetime: 3000 };
      break;
  }
  
  return {
    maxParticles: Math.floor(5 + intensity * styleMultipliers.particles * settings.particleIntensity),
    emissionRate: 2 + intensity * 8,
    particleLifetime: 1000 + intensity * styleMultipliers.lifetime,
    chaos: intensity * styleMultipliers.chaos,
    speed: 1 + intensity * styleMultipliers.speed,
    size: 4 + intensity * 16,
    colorIntensity: 0.6 + intensity * 0.4,
    trailLength: Math.floor(intensity * styleMultipliers.trails)
  };
}

function updateParticleVisualizations(): void {
  const currentTime = millis();
  const deltaTime = currentTime - lastUpdateTime;
  lastUpdateTime = currentTime;
  
  functionVisualizations.forEach(viz => {
    // Smooth center movement
    viz.center.x += (viz.targetCenter.x - viz.center.x) * 0.02;
    viz.center.y += (viz.targetCenter.y - viz.center.y) * 0.02;
    
    viz.particles.setCenter(viz.center);
    viz.particles.update(deltaTime);
  });
}

function renderParticleVisualizations(): void {
  functionVisualizations.forEach(viz => {
    viz.particles.render();
    
    // Draw function label
    fill(color(0, 0, 80));
    noStroke();
    textAlign('CENTER', 'CENTER');
    textSize(12);
    text(
      `${viz.func.name} (${viz.func.complexity.intensityLevel})`,
      viz.center.x,
      viz.center.y + 50
    );
  });
}

function drawClassicShapes(): void {
  if (functions.length === 0) return;
  
  const numCols = Math.ceil(Math.sqrt(functions.length));
  const numRows = Math.ceil(functions.length / numCols);
  const cellWidth = width / numCols;
  const cellHeight = height / numRows;
  const padding = settings.padding;
  
  functions.forEach((func, i) => {
    const row = Math.floor(i / numCols);
    const col = i % numCols;
    const x = col * cellWidth + cellWidth/2;
    const y = row * cellHeight + cellHeight/2;
    const size = map(func.complexity.overallComplexity, 0, 1, 30, Math.min(cellWidth, cellHeight) - padding * 2);
    const hue = hashString(func.name) % 360;
    
    drawClassicShape(x, y, size, hue, func);
  });
}

function drawClassicShape(x: number, y: number, size: number, hue: number, func: EnhancedFunctionData): void {
  const complexity = func.complexity.overallComplexity;
  
  if (settings.colorTheme === 'intensity') {
    const saturation = 60 + complexity * 40;
    const brightness = 70 + complexity * 30;
    fill(color(hue, saturation, brightness));
    stroke(color(hue, saturation + 20, brightness - 20));
  } else {
    fill(color(hue, 60, 90));
    stroke(color(hue, 80, 70));
  }
  
  strokeWeight(1 + complexity * 3);
  
  ellipseMode('CENTER');
  ellipse(x, y, size, size);
  
  // Add intensity indicator
  const intensityColors = {
    'low': color(120, 60, 80),
    'medium': color(60, 80, 80),
    'high': color(30, 90, 80),
    'extreme': color(0, 100, 90)
  };
  
  fill(intensityColors[func.complexity.intensityLevel]);
  noStroke();
  ellipse(x, y, size * 0.3, size * 0.3);
  
  // Function name
  fill(color(0, 0, 0));
  textAlign('CENTER', 'CENTER');
  textSize(10);
  text(func.name, x, y + size/2 + 15);
}

function updateFunctionPositions(): void {
  if (functionVisualizations.length === 0) return;
  
  const numCols = Math.ceil(Math.sqrt(functionVisualizations.length));
  const cellWidth = width / numCols;
  const cellHeight = height / Math.ceil(functionVisualizations.length / numCols);
  
  functionVisualizations.forEach((viz, i) => {
    const row = Math.floor(i / numCols);
    const col = i % numCols;
    viz.targetCenter.x = col * cellWidth + cellWidth / 2;
    viz.targetCenter.y = row * cellHeight + cellHeight / 2;
  });
}

// ===== UTILITY FUNCTIONS =====

function displayInfo(): void {
  const infoElement = document.getElementById('info');
  if (infoElement) {
    const totalComplexity = functions.reduce((sum, f) => sum + f.complexity.overallComplexity, 0);
    const avgComplexity = functions.length > 0 ? (totalComplexity / functions.length).toFixed(2) : '0.00';
    
    infoElement.textContent = 
      `File: ${filename || 'No file selected'} | Functions: ${functions.length} | Avg Complexity: ${avgComplexity}`;
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

function handleDataUpdate(data: EnhancedFunctionData[], newFilename: string): void {
  functions = data;
  filename = newFilename;
  
  if (settings.animationEnabled && (settings.style === 'particles' || settings.style === 'chaos' || settings.style === 'flow')) {
    initializeVisualizations();
  }
}

function handleSettingsUpdate(newSettings: VisualizationSettings): void {
  const styleChanged = settings.style !== newSettings.style;
  settings = newSettings;
  
  if (styleChanged && (settings.style === 'particles' || settings.style === 'chaos' || settings.style === 'flow') && functions.length > 0) {
    initializeVisualizations();
  }
  
  // Update particle configs if intensity changed for any particle-based style
  if (settings.style === 'particles' || settings.style === 'chaos' || settings.style === 'flow') {
    functionVisualizations.forEach(viz => {
      const newConfig = generateParticleConfig(viz.func.complexity);
      viz.particles.updateConfig(newConfig);
    });
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

(window as any).setup = setup;
(window as any).draw = draw;
(window as any).windowResized = windowResized;