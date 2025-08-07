// ===== PARTICLE SYSTEM TYPES =====

interface Particle {
  id: string;
  position: Vector2D;
  velocity: Vector2D;
  acceleration: Vector2D;
  size: number;
  color: HSBColor;
  life: number;
  maxLife: number;
  trail: Vector2D[];
  noiseOffset: Vector2D;
}

interface Vector2D {
  x: number;
  y: number;
}

interface HSBColor {
  hue: number;
  saturation: number;
  brightness: number;
  alpha: number;
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

// ===== PARTICLE SYSTEM CLASS =====

export class ParticleSystem {
  private particles: Particle[] = [];
  private config: ParticleSystemConfig;
  private center: Vector2D;
  private time: number = 0;
  private lastEmission: number = 0;

  constructor(center: Vector2D, config: ParticleSystemConfig) {
    this.center = center;
    this.config = config;
  }

  public update(deltaTime: number): void {
    this.time += deltaTime;
    
    // Emit new particles
    this.emitParticles();
    
    // Update existing particles
    this.updateParticles(deltaTime);
    
    // Remove dead particles
    this.cleanupParticles();
  }

  public render(): void {
    // Render trails first (behind particles)
    this.renderTrails();
    
    // Render particles
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
    const distance = random(0, 20);
    
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
      const noiseScale = 0.01;
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
        const force = (this.config.chaos > 0.5 ? -0.1 : 0.05) / distance;
        particle.acceleration.x += (dx / distance) * force;
        particle.acceleration.y += (dy / distance) * force;
      }
      
      // Update velocity and position
      particle.velocity.x += particle.acceleration.x * deltaTime * 0.01;
      particle.velocity.y += particle.acceleration.y * deltaTime * 0.01;
      
      // Apply velocity damping
      particle.velocity.x *= 0.98;
      particle.velocity.y *= 0.98;
      
      // Update position
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
      const pulseAmt = 1 + Math.sin(this.time * pulseFreq + particle.id.length) * 0.2 * this.config.chaos;
      particle.size = this.config.size * pulseAmt * random(0.9, 1.1);
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
          alpha
        ));
        
        line(prevSegment.x, prevSegment.y, segment.x, segment.y);
      }
    });
  }

  private renderParticles(): void {
    this.particles.forEach(particle => {
      const { position, size, color: particleColor } = particle;
      
      // Set fill color
      fill(color(
        particleColor.hue,
        particleColor.saturation,
        particleColor.brightness,
        particleColor.alpha
      ));
      
      // Set stroke based on chaos level
      if (this.config.chaos > 0.3) {
        stroke(color(
          particleColor.hue,
          particleColor.saturation + 20,
          particleColor.brightness - 20,
          particleColor.alpha * 0.8
        ));
        strokeWeight(1 + this.config.chaos * 2);
      } else {
        noStroke();
      }
      
      // Draw particle with shape based on chaos/hardness
      if (this.config.chaos > 0.7) {
        // High chaos = angular shapes
        this.drawAngularShape(position, size, this.config.chaos);
      } else if (this.config.chaos > 0.3) {
        // Medium chaos = irregular circles
        this.drawIrregularCircle(position, size, this.config.chaos);
      } else {
        // Low chaos = smooth circles
        ellipseMode('CENTER');
        ellipse(position.x, position.y, size, size);
      }
    });
  }

  private drawAngularShape(position: Vector2D, size: number, intensity: number): void {
    const vertices = Math.floor(3 + intensity * 5); // 3-8 vertices
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

  private drawIrregularCircle(position: Vector2D, size: number, chaos: number): void {
    const segments = 16;
    const radius = size / 2;
    
    beginShape();
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const variation = 1 + (noise(
        position.x * 0.01 + Math.cos(angle),
        position.y * 0.01 + Math.sin(angle),
        this.time * 0.002
      ) - 0.5) * chaos * 0.3;
      
      const x = position.x + Math.cos(angle) * radius * variation;
      const y = position.y + Math.sin(angle) * radius * variation;
      vertex(x, y);
    }
    endShape('CLOSE');
  }

  // Public API for external control
  public setCenter(newCenter: Vector2D): void {
    this.center = newCenter;
  }

  public updateConfig(newConfig: Partial<ParticleSystemConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public getParticleCount(): number {
    return this.particles.length;
  }

  public clear(): void {
    this.particles = [];
  }
}

// ===== P5.JS COMPATIBILITY LAYER =====

// These functions will be available from p5.js context
declare function random(min?: number, max?: number): number;
declare function noise(x: number, y?: number, z?: number): number;
declare function color(r: number | string, g?: number, b?: number, a?: number): any;
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