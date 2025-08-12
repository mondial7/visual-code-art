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
      const themeColors = getThemeColors();
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
          saturation: themeColors.particleBase.saturation + this.config.colorIntensity * 15,
          brightness: themeColors.particleBase.brightness + this.config.colorIntensity * 5,
          alpha: 0.9
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
        const smoothFade = Math.pow(lifeRatio, 0.6);
        particle.color.alpha = Math.max(0.1, smoothFade);
        const pulseFreq = 5e-3 + this.config.chaos * 0.01;
        const basePulse = Math.sin(this.time * pulseFreq + parseFloat(particle.id)) * 0.3;
        const pulseAmt = 1 + basePulse * (0.5 + this.config.chaos * 0.5);
        particle.size = this.config.size * random(0.8, 1.4) * pulseAmt;
      });
    }
    cleanupParticles() {
      this.particles = this.particles.filter((particle) => particle.life > 0);
    }
    renderTrails() {
      if (this.config.trailLength === 0) return;
      this.particles.forEach((particle) => {
        if (particle.trail.length < 2) return;
        strokeWeight(2.5);
        for (let i = 1; i < particle.trail.length; i++) {
          const segment = particle.trail[i];
          const prevSegment = particle.trail[i - 1];
          const alpha = i / particle.trail.length * particle.color.alpha * 0.8;
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
    renderParticles() {
      this.particles.forEach((particle) => {
        const { position, size, color: particleColor } = particle;
        fill(color(
          particleColor.hue,
          particleColor.saturation,
          particleColor.brightness,
          particleColor.alpha * 255
        ));
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
    colorTheme: "rainbow",
    animationEnabled: true,
    particleIntensity: 1,
    themeMode: "auto"
  };
  var currentStyle = "particles";
  var functionVisualizations = [];
  var lastUpdateTime = 0;
  var themeColorPalettes = {
    day: {
      background: { hue: 200, saturation: 15, brightness: 95 },
      // Light blue-gray
      text: { hue: 0, saturation: 0, brightness: 20 },
      // Dark gray
      particleBase: { saturation: 70, brightness: 80 }
      // Vibrant but not too intense
    },
    night: {
      background: { hue: 240, saturation: 8, brightness: 8 },
      // Very dark blue-gray
      text: { hue: 0, saturation: 0, brightness: 85 },
      // Light gray
      particleBase: { saturation: 85, brightness: 95 }
      // Very vibrant and bright
    }
  };
  function getCurrentTheme() {
    if (settings.themeMode === "auto") {
      const currentHour = (/* @__PURE__ */ new Date()).getHours();
      return currentHour >= 6 && currentHour < 18 ? "day" : "night";
    }
    return settings.themeMode;
  }
  function getThemeColors() {
    return themeColorPalettes[getCurrentTheme()];
  }
  function setup() {
    createCanvas(window.innerWidth, window.innerHeight);
    windowResized();
    colorMode("HSB", 360, 100, 100);
    lastUpdateTime = millis();
  }
  function draw() {
    const themeColors = getThemeColors();
    background(
      themeColors.background.hue,
      themeColors.background.saturation,
      themeColors.background.brightness
    );
    if (settings.animationEnabled) {
      updateParticleVisualizations();
      renderParticleVisualizations();
    }
  }
  function windowResized() {
    resizeCanvas(window.innerWidth, window.innerHeight);
    updateFunctionPositions();
  }
  function determineAutoStyle(functions2) {
    if (functions2.length === 0) return "flow";
    const complexityCounts = {
      extreme: 0,
      high: 0,
      medium: 0,
      low: 0
    };
    functions2.forEach((func) => {
      complexityCounts[func.complexity.intensityLevel]++;
    });
    const totalFunctions = functions2.length;
    const extremePercentage = complexityCounts.extreme / totalFunctions;
    const highPercentage = complexityCounts.high / totalFunctions;
    const combinedHighComplexity = extremePercentage + highPercentage;
    if (extremePercentage > 0.3 || combinedHighComplexity > 0.6) {
      return "chaos";
    } else if (combinedHighComplexity > 0.2 || complexityCounts.medium > totalFunctions * 0.4) {
      return "particles";
    } else {
      return "flow";
    }
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
    switch (currentStyle) {
      case "chaos":
        styleMultipliers = { chaos: 3, particles: 60, speed: 5, trails: 25, lifetime: 2e3 };
        break;
      case "flow":
        styleMultipliers = { chaos: 0.3, particles: 35, speed: 2, trails: 30, lifetime: 4e3 };
        break;
      case "particles":
      default:
        styleMultipliers = { chaos: 1, particles: 45, speed: 3, trails: 15, lifetime: 3e3 };
        break;
    }
    return {
      maxParticles: Math.floor(15 + intensity * styleMultipliers.particles * settings.particleIntensity * 2),
      emissionRate: 4 + intensity * 12,
      particleLifetime: 1e3 + intensity * styleMultipliers.lifetime,
      chaos: intensity * styleMultipliers.chaos,
      speed: 1 + intensity * styleMultipliers.speed,
      size: 60 + intensity * 120,
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
    const themeColors = getThemeColors();
    functionVisualizations.forEach((viz) => {
      viz.particles.render();
      fill(color(
        themeColors.text.hue,
        themeColors.text.saturation,
        themeColors.text.brightness
      ));
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
    const previousStyle = currentStyle;
    currentStyle = determineAutoStyle(data);
    console.log(`[Sketch] Auto-selected style: ${currentStyle} (previous: ${previousStyle}) for ${data.length} functions`);
    if (settings.animationEnabled) {
      initializeVisualizations();
    }
    updateStatisticsPanel(data, newFilename);
  }
  function updateStatisticsPanel(data, filename2) {
    const functionCount = data.length;
    let avgComplexity = "0.00";
    let maxComplexity = "None";
    let mostComplexIntensity = "low";
    if (functionCount > 0) {
      const totalComplexity = data.reduce((sum, func) => sum + func.complexity.overallComplexity, 0);
      avgComplexity = (totalComplexity / functionCount).toFixed(2);
      const mostComplex = data.reduce(
        (max, func) => func.complexity.overallComplexity > max.complexity.overallComplexity ? func : max
      );
      maxComplexity = mostComplex.name + " (" + mostComplex.complexity.intensityLevel + ")";
      mostComplexIntensity = mostComplex.complexity.intensityLevel;
    }
    const fileElement = document.getElementById("file-name");
    const countElement = document.getElementById("function-count");
    const avgElement = document.getElementById("avg-complexity");
    const maxElement = document.getElementById("max-complexity");
    if (fileElement) fileElement.textContent = filename2 || "No file selected";
    if (countElement) countElement.textContent = functionCount.toString();
    if (avgElement) avgElement.textContent = avgComplexity;
    if (maxElement) {
      maxElement.textContent = maxComplexity;
      maxElement.className = maxElement.className.replace(/complexity-\w+/g, "");
      if (maxComplexity !== "None") {
        maxElement.classList.add(`complexity-${mostComplexIntensity}`);
      }
    }
    console.log("[Sketch] Statistics updated:", { filename: filename2, functionCount, avgComplexity, maxComplexity, mostComplexIntensity });
  }
  function handleSettingsUpdate(newSettings) {
    settings = newSettings;
    updateSettingsUI();
    functionVisualizations.forEach((viz) => {
      const newConfig = generateParticleConfig(viz.func.complexity);
      viz.particles.updateConfig(newConfig);
    });
    redraw();
  }
  function initializeSettingsUI() {
    const themeSelect = document.getElementById("theme-select");
    const animationCheckbox = document.getElementById("animation-checkbox");
    const intensityRange = document.getElementById("intensity-range");
    const intensityValue = document.getElementById("intensity-value");
    if (themeSelect) {
      themeSelect.addEventListener("change", () => {
        settings.themeMode = themeSelect.value;
        vscode.postMessage({
          type: "settingsChanged",
          settings: { themeMode: settings.themeMode }
        });
        redraw();
      });
    }
    if (animationCheckbox) {
      animationCheckbox.addEventListener("change", () => {
        settings.animationEnabled = animationCheckbox.checked;
        vscode.postMessage({
          type: "settingsChanged",
          settings: { animationEnabled: settings.animationEnabled }
        });
      });
    }
    if (intensityRange && intensityValue) {
      intensityRange.addEventListener("input", () => {
        const value = parseFloat(intensityRange.value);
        settings.particleIntensity = value;
        intensityValue.textContent = value.toFixed(1);
        vscode.postMessage({
          type: "settingsChanged",
          settings: { particleIntensity: settings.particleIntensity }
        });
        handleSettingsUpdate(settings);
      });
    }
  }
  function updateSettingsUI() {
    const themeSelect = document.getElementById("theme-select");
    const animationCheckbox = document.getElementById("animation-checkbox");
    const intensityRange = document.getElementById("intensity-range");
    const intensityValue = document.getElementById("intensity-value");
    if (themeSelect) {
      themeSelect.value = settings.themeMode;
    }
    if (animationCheckbox) {
      animationCheckbox.checked = settings.animationEnabled;
    }
    if (intensityRange && intensityValue) {
      intensityRange.value = settings.particleIntensity.toString();
      intensityValue.textContent = settings.particleIntensity.toFixed(1);
    }
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
  window.addEventListener("DOMContentLoaded", () => {
    initializeSettingsUI();
  });
  window.setup = setup;
  window.draw = draw;
  window.windowResized = windowResized;
})();
//# sourceMappingURL=codeArtSketch.js.map
