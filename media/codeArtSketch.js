"use strict";
(() => {
  // src/sketch/enhancedCodeArtSketch.ts
  var ParticleSystem = class {
    particles = [];
    config;
    center;
    time = 0;
    lastEmission = 0;
    constructor(center, config) {
      this.center = center;
      this.config = config;
    }
    update(deltaTime) {
      this.time += deltaTime;
      this.emitParticles();
      this.updateParticles(deltaTime);
      this.cleanupParticles();
    }
    render() {
      this.renderTrails();
      this.renderParticles();
    }
    emitParticles() {
      const shouldEmit = this.time - this.lastEmission > 1e3 / this.config.emissionRate;
      if (shouldEmit && this.particles.length < this.config.maxParticles) {
        const particle = this.createParticle();
        this.particles.push(particle);
        this.lastEmission = this.time;
      }
    }
    createParticle() {
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
          x: random(1e3),
          y: random(1e3)
        }
      };
    }
    updateParticles(deltaTime) {
      this.particles.forEach((particle) => {
        const chaosForce = this.config.chaos * 2;
        const noiseX = noise(particle.noiseOffset.x + this.time * 1e-3) * 2 - 1;
        const noiseY = noise(particle.noiseOffset.y + this.time * 1e-3) * 2 - 1;
        particle.acceleration.x = noiseX * chaosForce;
        particle.acceleration.y = noiseY * chaosForce;
        const dx = this.center.x - particle.position.x;
        const dy = this.center.y - particle.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 0) {
          const force = (this.config.chaos > 0.5 ? -0.2 : 0.1) / Math.max(distance, 1);
          particle.acceleration.x += dx / distance * force;
          particle.acceleration.y += dy / distance * force;
        }
        particle.velocity.x += particle.acceleration.x * deltaTime * 0.01;
        particle.velocity.y += particle.acceleration.y * deltaTime * 0.01;
        particle.velocity.x *= 0.98;
        particle.velocity.y *= 0.98;
        particle.position.x += particle.velocity.x * deltaTime * 0.01;
        particle.position.y += particle.velocity.y * deltaTime * 0.01;
        if (this.config.trailLength > 0) {
          particle.trail.push({ ...particle.position });
          if (particle.trail.length > this.config.trailLength) {
            particle.trail.shift();
          }
        }
        particle.life -= deltaTime;
        const lifeRatio = particle.life / particle.maxLife;
        particle.color.alpha = Math.max(0, lifeRatio);
        const pulseFreq = 5e-3 + this.config.chaos * 0.01;
        const pulseAmt = 1 + Math.sin(this.time * pulseFreq + parseFloat(particle.id)) * 0.2 * this.config.chaos;
        particle.size = this.config.size * pulseAmt;
      });
    }
    cleanupParticles() {
      this.particles = this.particles.filter((particle) => particle.life > 0);
    }
    renderTrails() {
      if (this.config.trailLength === 0) return;
      this.particles.forEach((particle) => {
        if (particle.trail.length < 2) return;
        strokeWeight(1);
        for (let i = 1; i < particle.trail.length; i++) {
          const segment = particle.trail[i];
          const prevSegment = particle.trail[i - 1];
          const alpha = i / particle.trail.length * particle.color.alpha * 0.3;
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
    renderParticles() {
      this.particles.forEach((particle) => {
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
          ellipseMode("CENTER");
          ellipse(position.x, position.y, size, size);
        }
      });
    }
    drawAngularShape(position, size, intensity) {
      const vertices = Math.floor(3 + intensity * 5);
      const radius = size / 2;
      beginShape();
      for (let i = 0; i < vertices; i++) {
        const angle = i / vertices * Math.PI * 2;
        const variation = 1 + (noise(position.x * 0.01, position.y * 0.01, this.time * 1e-3) - 0.5) * intensity * 0.5;
        const x = position.x + Math.cos(angle) * radius * variation;
        const y = position.y + Math.sin(angle) * radius * variation;
        vertex(x, y);
      }
      endShape("CLOSE");
    }
    setCenter(newCenter) {
      this.center = newCenter;
    }
    updateConfig(newConfig) {
      this.config = { ...this.config, ...newConfig };
    }
    clear() {
      this.particles = [];
    }
  };
  var vscode = acquireVsCodeApi();
  var functions = [];
  var filename = "";
  var settings = {
    style: "particles",
    colorTheme: "intensity",
    customColorPrimary: "#FF0000",
    customColorSecondary: "#0000FF",
    padding: 10,
    animationEnabled: true,
    particleIntensity: 1,
    debugMode: false
  };
  var functionVisualizations = [];
  var lastUpdateTime = 0;
  function setup() {
    createCanvas(window.innerWidth, window.innerHeight);
    windowResized();
    colorMode("HSB", 360, 100, 100);
    lastUpdateTime = millis();
  }
  function draw() {
    background(120, 80, 50);
    console.log("draw() called - functions count:", functions.length);
    const avgComplexity = functions.length > 0 ? functions.reduce((sum, f) => sum + f.complexity.overallComplexity, 0) / functions.length : 0;
    console.log("Average complexity:", avgComplexity);
    if (settings.animationEnabled && (settings.style === "particles" || settings.style === "chaos" || settings.style === "flow")) {
      updateParticleVisualizations();
      renderParticleVisualizations();
    } else {
      drawClassicShapes();
    }
    displayInfo();
  }
  function windowResized() {
    resizeCanvas(window.innerWidth, window.innerHeight);
    updateFunctionPositions();
  }
  function initializeVisualizations() {
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
  function generateParticleConfig(complexity) {
    const intensity = complexity.overallComplexity;
    let styleMultipliers = { chaos: 1, particles: 25, speed: 3, trails: 15, lifetime: 3e3 };
    switch (settings.style) {
      case "chaos":
        styleMultipliers = { chaos: 3, particles: 40, speed: 5, trails: 25, lifetime: 2e3 };
        break;
      case "flow":
        styleMultipliers = { chaos: 0.3, particles: 15, speed: 2, trails: 30, lifetime: 4e3 };
        break;
      case "particles":
      default:
        styleMultipliers = { chaos: 1, particles: 25, speed: 3, trails: 15, lifetime: 3e3 };
        break;
    }
    return {
      maxParticles: Math.floor(5 + intensity * styleMultipliers.particles * settings.particleIntensity),
      emissionRate: 2 + intensity * 8,
      particleLifetime: 1e3 + intensity * styleMultipliers.lifetime,
      chaos: intensity * styleMultipliers.chaos,
      speed: 1 + intensity * styleMultipliers.speed,
      size: 4 + intensity * 16,
      colorIntensity: 0.6 + intensity * 0.4,
      trailLength: Math.floor(intensity * styleMultipliers.trails)
    };
  }
  function updateParticleVisualizations() {
    const currentTime = millis();
    const deltaTime = currentTime - lastUpdateTime;
    lastUpdateTime = currentTime;
    functionVisualizations.forEach((viz) => {
      viz.center.x += (viz.targetCenter.x - viz.center.x) * 0.02;
      viz.center.y += (viz.targetCenter.y - viz.center.y) * 0.02;
      viz.particles.setCenter(viz.center);
      viz.particles.update(deltaTime);
    });
  }
  function renderParticleVisualizations() {
    functionVisualizations.forEach((viz) => {
      viz.particles.render();
      fill(color(0, 0, 80));
      noStroke();
      textAlign("CENTER", "CENTER");
      textSize(12);
      text(
        `${viz.func.name} (${viz.func.complexity.intensityLevel})`,
        viz.center.x,
        viz.center.y + 50
      );
    });
  }
  function drawClassicShapes() {
    if (functions.length === 0) return;
    const numCols = Math.ceil(Math.sqrt(functions.length));
    const numRows = Math.ceil(functions.length / numCols);
    const cellWidth = width / numCols;
    const cellHeight = height / numRows;
    const padding = settings.padding;
    functions.forEach((func, i) => {
      const row = Math.floor(i / numCols);
      const col = i % numCols;
      const x = col * cellWidth + cellWidth / 2;
      const y = row * cellHeight + cellHeight / 2;
      const size = map(func.complexity.overallComplexity, 0, 1, 30, Math.min(cellWidth, cellHeight) - padding * 2);
      const hue = hashString(func.name) % 360;
      drawClassicShape(x, y, size, hue, func);
    });
  }
  function drawClassicShape(x, y, size, hue, func) {
    const complexity = func.complexity.overallComplexity;
    if (settings.colorTheme === "intensity") {
      const saturation = 60 + complexity * 40;
      const brightness = 70 + complexity * 30;
      fill(color(hue, saturation, brightness));
      stroke(color(hue, saturation + 20, brightness - 20));
    } else {
      fill(color(hue, 60, 90));
      stroke(color(hue, 80, 70));
    }
    strokeWeight(1 + complexity * 3);
    ellipseMode("CENTER");
    ellipse(x, y, size, size);
    const intensityColors = {
      "low": color(120, 60, 80),
      "medium": color(60, 80, 80),
      "high": color(30, 90, 80),
      "extreme": color(0, 100, 90)
    };
    fill(intensityColors[func.complexity.intensityLevel]);
    noStroke();
    ellipse(x, y, size * 0.3, size * 0.3);
    fill(color(0, 0, 0));
    textAlign("CENTER", "CENTER");
    textSize(10);
    text(func.name, x, y + size / 2 + 15);
  }
  function updateFunctionPositions() {
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
  function displayInfo() {
    const infoElement = document.getElementById("info");
    if (infoElement) {
      const totalComplexity = functions.reduce((sum, f) => sum + f.complexity.overallComplexity, 0);
      const avgComplexity = functions.length > 0 ? (totalComplexity / functions.length).toFixed(2) : "0.00";
      infoElement.textContent = `File: ${filename || "No file selected"} | Functions: ${functions.length} | Avg Complexity: ${avgComplexity}`;
    }
  }
  function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }
  function handleDataUpdate(data, newFilename) {
    functions = data;
    filename = newFilename;
    if (settings.animationEnabled && (settings.style === "particles" || settings.style === "chaos" || settings.style === "flow")) {
      initializeVisualizations();
    }
  }
  function handleSettingsUpdate(newSettings) {
    const styleChanged = settings.style !== newSettings.style;
    settings = newSettings;
    if (styleChanged && (settings.style === "particles" || settings.style === "chaos" || settings.style === "flow") && functions.length > 0) {
      initializeVisualizations();
    }
    if (settings.style === "particles" || settings.style === "chaos" || settings.style === "flow") {
      functionVisualizations.forEach((viz) => {
        const newConfig = generateParticleConfig(viz.func.complexity);
        viz.particles.updateConfig(newConfig);
      });
    }
    redraw();
  }
  window.addEventListener("message", (event) => {
    const message = event.data;
    switch (message.type) {
      case "update":
        handleDataUpdate(message.data, message.filename);
        break;
      case "settings":
        handleSettingsUpdate(message.settings);
        break;
      default:
        console.warn("Unknown message type:", message);
    }
  });
  window.setup = setup;
  window.draw = draw;
  window.windowResized = windowResized;
})();
//# sourceMappingURL=codeArtSketch.js.map
