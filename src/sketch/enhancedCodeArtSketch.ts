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
  colorTheme: 'rainbow';
  animationEnabled: boolean;
  particleIntensity: number; // 0-1 multiplier for particle effects
}

type AutoVisualizationStyle = 'particles' | 'chaos' | 'flow';

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
      size: this.config.size * random(0.8, 1.4),
      color: {
        hue: random(0, 360),
        saturation: 85 + this.config.colorIntensity * 15,
        brightness: 95 + this.config.colorIntensity * 5,
        alpha: 0.9
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
      
      // Improved alpha fading - slower fade for better visibility
      const lifeRatio = particle.life / particle.maxLife;
      // Use smooth curve instead of linear fade
      const smoothFade = Math.pow(lifeRatio, 0.6);
      particle.color.alpha = Math.max(0.1, smoothFade);
      
      // Enhanced size pulsation for better visibility
      const pulseFreq = 0.005 + this.config.chaos * 0.01;
      const basePulse = Math.sin(this.time * pulseFreq + parseFloat(particle.id)) * 0.3;
      const pulseAmt = 1 + basePulse * (0.5 + this.config.chaos * 0.5);
      particle.size = this.config.size * random(0.8, 1.4) * pulseAmt;
    });
  }

  private cleanupParticles(): void {
    this.particles = this.particles.filter(particle => particle.life > 0);
  }

  private renderTrails(): void {
    if (this.config.trailLength === 0) return;
    
    this.particles.forEach(particle => {
      if (particle.trail.length < 2) return;
      
      strokeWeight(2.5);
      
      for (let i = 1; i < particle.trail.length; i++) {
        const segment = particle.trail[i];
        const prevSegment = particle.trail[i - 1];
        const alpha = (i / particle.trail.length) * particle.color.alpha * 0.8;
        
        stroke(color(
          particle.color.hue,
          particle.color.saturation * 0.9,
          particle.color.brightness * 0.9,
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
      
      // Always add stroke for better visibility
      stroke(color(
        particleColor.hue,
        Math.min(100, particleColor.saturation + 30),
        Math.max(20, particleColor.brightness - 30),
        particleColor.alpha * 0.9 * 255
      ));
      strokeWeight(this.config.chaos > 0.3 ? 3 + this.config.chaos * 4 : 2.5);
      
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
  colorTheme: 'rainbow',
  animationEnabled: true,
  particleIntensity: 1.0
};

let currentStyle: AutoVisualizationStyle = 'particles';
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
  // Dark background for better visibility
  background(0, 0, 8); // Very dark gray, almost black
  
  if (settings.animationEnabled) {
    updateParticleVisualizations();
    renderParticleVisualizations();
  }
}

function windowResized(): void {
  resizeCanvas(window.innerWidth, window.innerHeight);
  updateFunctionPositions();
}

// ===== AUTOMATIC STYLE SELECTION =====

function determineAutoStyle(functions: EnhancedFunctionData[]): AutoVisualizationStyle {
  if (functions.length === 0) return 'flow';
  
  // Calculate complexity distribution
  const complexityCounts = {
    extreme: 0,
    high: 0,
    medium: 0,
    low: 0
  };
  
  functions.forEach(func => {
    complexityCounts[func.complexity.intensityLevel]++;
  });
  
  const totalFunctions = functions.length;
  const extremePercentage = complexityCounts.extreme / totalFunctions;
  const highPercentage = complexityCounts.high / totalFunctions;
  const combinedHighComplexity = extremePercentage + highPercentage;
  
  // Style selection based on complexity distribution
  if (extremePercentage > 0.3 || combinedHighComplexity > 0.6) {
    // High concentration of extreme complexity or lots of high/extreme complexity
    return 'chaos';
  } else if (combinedHighComplexity > 0.2 || complexityCounts.medium > totalFunctions * 0.4) {
    // Moderate complexity present
    return 'particles';
  } else {
    // Mostly low complexity functions
    return 'flow';
  }
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
  
  // Adjust particle behavior based on current auto-selected style
  let styleMultipliers = { chaos: 1, particles: 25, speed: 3, trails: 15, lifetime: 3000 };
  
  switch (currentStyle) {
    case 'chaos':
      styleMultipliers = { chaos: 3, particles: 60, speed: 5, trails: 25, lifetime: 2000 };
      break;
    case 'flow':
      styleMultipliers = { chaos: 0.3, particles: 35, speed: 2, trails: 30, lifetime: 4000 };
      break;
    case 'particles':
    default:
      styleMultipliers = { chaos: 1, particles: 45, speed: 3, trails: 15, lifetime: 3000 };
      break;
  }
  
  return {
    maxParticles: Math.floor(15 + intensity * styleMultipliers.particles * settings.particleIntensity * 2),
    emissionRate: 4 + intensity * 12,
    particleLifetime: 1000 + intensity * styleMultipliers.lifetime,
    chaos: intensity * styleMultipliers.chaos,
    speed: 1 + intensity * styleMultipliers.speed,
    size: 60 + intensity * 120,
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
  
  // Automatically determine the visualization style based on complexity
  const previousStyle = currentStyle;
  currentStyle = determineAutoStyle(data);
  
  console.log(`[Sketch] Auto-selected style: ${currentStyle} (previous: ${previousStyle}) for ${data.length} functions`);
  
  if (settings.animationEnabled) {
    initializeVisualizations();
  }
  
  // Update statistics panel
  updateStatisticsPanel(data, newFilename);
}

function updateStatisticsPanel(data: EnhancedFunctionData[], filename: string): void {
  const functionCount = data.length;
  let avgComplexity = '0.00';
  let maxComplexity = 'None';
  let mostComplexIntensity = 'low';
  
  if (functionCount > 0) {
    const totalComplexity = data.reduce((sum, func) => sum + func.complexity.overallComplexity, 0);
    avgComplexity = (totalComplexity / functionCount).toFixed(2);
    
    const mostComplex = data.reduce((max, func) => 
      func.complexity.overallComplexity > max.complexity.overallComplexity ? func : max
    );
    maxComplexity = mostComplex.name + ' (' + mostComplex.complexity.intensityLevel + ')';
    mostComplexIntensity = mostComplex.complexity.intensityLevel;
  }
  
  // Update DOM elements with improved styling
  const fileElement = document.getElementById('file-name');
  const countElement = document.getElementById('function-count');
  const avgElement = document.getElementById('avg-complexity');
  const maxElement = document.getElementById('max-complexity');
  
  if (fileElement) fileElement.textContent = filename || 'No file selected';
  if (countElement) countElement.textContent = functionCount.toString();
  if (avgElement) avgElement.textContent = avgComplexity;
  
  if (maxElement) {
    maxElement.textContent = maxComplexity;
    // Remove existing complexity classes
    maxElement.className = maxElement.className.replace(/complexity-\w+/g, '');
    // Add appropriate complexity class for color coding
    if (maxComplexity !== 'None') {
      maxElement.classList.add(`complexity-${mostComplexIntensity}`);
    }
  }
  
  console.log('[Sketch] Statistics updated:', {filename, functionCount, avgComplexity, maxComplexity, mostComplexIntensity});
}

function handleSettingsUpdate(newSettings: VisualizationSettings): void {
  settings = newSettings;
  
  // Update particle configs if intensity changed
  functionVisualizations.forEach(viz => {
    const newConfig = generateParticleConfig(viz.func.complexity);
    viz.particles.updateConfig(newConfig);
  });
  
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