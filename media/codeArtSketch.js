"use strict";
(() => {
  // src/sketch/codeArtSketch.ts
  var vscode = acquireVsCodeApi();
  var functions = [];
  var filename = "";
  var settings = {
    style: "squares",
    colorTheme: "rainbow",
    customColorPrimary: "#FF0000",
    customColorSecondary: "#0000FF",
    padding: 10,
    animationEnabled: true
  };
  var animatedShapes = [];
  var lastUpdateTime = 0;
  var ANIMATION_SPEED = 0.02;
  var WANDER_RADIUS = 50;
  function setup() {
    createCanvas(window.innerWidth, window.innerHeight);
    windowResized();
    colorMode("HSB", 360, 100, 100);
    lastUpdateTime = millis();
  }
  function draw() {
    background(10, 10, 10);
    if (settings.animationEnabled) {
      updateAnimations();
      drawAnimatedShapes();
    } else {
      drawStaticShapes();
    }
    displayInfo();
  }
  function windowResized() {
    resizeCanvas(window.innerWidth, window.innerHeight);
    if (functions.length > 0) {
      initializeAnimatedShapes();
    }
  }
  function initializeAnimatedShapes() {
    if (functions.length === 0) {
      animatedShapes = [];
      return;
    }
    const maxSize = Math.max(...functions.map((f) => f.size));
    animatedShapes = functions.map((func, i) => {
      const size = map(func.size, 1, maxSize, 20, 80);
      const hue = hashString(func.name) % 360;
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
        noiseOffsetX: random(1e3),
        noiseOffsetY: random(1e3),
        speed: random(0.5, 2)
      };
    });
  }
  function updateAnimations() {
    const currentTime = millis();
    const deltaTime = currentTime - lastUpdateTime;
    lastUpdateTime = currentTime;
    animatedShapes.forEach((shape, i) => {
      const noiseScale = 5e-3;
      const time = currentTime * 1e-3;
      const noiseX = noise(shape.noiseOffsetX + time * shape.speed) * 2 - 1;
      const noiseY = noise(shape.noiseOffsetY + time * shape.speed) * 2 - 1;
      shape.targetX = width / 2 + noiseX * WANDER_RADIUS * 3;
      shape.targetY = height / 2 + noiseY * WANDER_RADIUS * 3;
      shape.targetX = Math.max(shape.size, Math.min(width - shape.size, shape.targetX));
      shape.targetY = Math.max(shape.size, Math.min(height - shape.size, shape.targetY));
      const lerpAmount = ANIMATION_SPEED * shape.speed;
      shape.x += (shape.targetX - shape.x) * lerpAmount;
      shape.y += (shape.targetY - shape.y) * lerpAmount;
    });
  }
  function drawAnimatedShapes() {
    animatedShapes.forEach((shape) => {
      drawShape(shape.x, shape.y, shape.size, shape.hue, shape.func);
    });
  }
  function drawStaticShapes() {
    if (functions.length === 0) {
      return;
    }
    const maxSize = Math.max(...functions.map((f) => f.size));
    const numFunctions = functions.length;
    const numCols = Math.ceil(Math.sqrt(numFunctions));
    const numRows = Math.ceil(numFunctions / numCols);
    const cellWidth = width / numCols;
    const cellHeight = height / numRows;
    const padding = settings.padding;
    functions.forEach((func, i) => {
      const row = Math.floor(i / numCols);
      const col = i % numCols;
      const x = col * cellWidth + cellWidth / 2;
      const y = row * cellHeight + cellHeight / 2;
      const size = map(func.size, 1, maxSize, 20, Math.min(cellWidth, cellHeight) - padding * 2);
      const hue = hashString(func.name) % 360;
      drawShape(x, y, size, hue, func);
    });
  }
  function drawShape(x, y, size, hue, func) {
    const { fillColor, strokeColor } = getShapeColors(hue, func.size);
    fill(fillColor);
    stroke(strokeColor);
    strokeWeight(2);
    switch (settings.style) {
      case "circles":
        ellipseMode("CENTER");
        ellipse(x, y, size, size);
        break;
      case "triangles":
        const halfSize = size / 2;
        triangle(
          x,
          y - halfSize,
          // top
          x - halfSize,
          y + halfSize,
          // bottom left
          x + halfSize,
          y + halfSize
          // bottom right
        );
        break;
      case "squares":
      default:
        rectMode("CENTER");
        rect(x, y, size, size);
    }
    fill(color(0, 0, 0));
    noStroke();
    textAlign("CENTER", "CENTER");
    textSize(10);
    text(func.name, x, y + size / 2 + 15);
  }
  function getShapeColors(hue, functionSize) {
    const maxSize = Math.max(...functions.map((f) => f.size));
    switch (settings.colorTheme) {
      case "monoBlue":
        return {
          fillColor: color(210, map(functionSize, 1, maxSize, 30, 90), 80),
          strokeColor: color(210, 80, 60)
        };
      case "monoGreen":
        return {
          fillColor: color(120, map(functionSize, 1, maxSize, 30, 90), 80),
          strokeColor: color(120, 80, 60)
        };
      case "monoPurple":
        return {
          fillColor: color(270, map(functionSize, 1, maxSize, 30, 90), 80),
          strokeColor: color(270, 80, 60)
        };
      case "custom":
        const c1 = color(settings.customColorPrimary);
        const c2 = color(settings.customColorSecondary);
        const amt = map(functionSize, 1, maxSize, 0, 1);
        return {
          fillColor: lerpColor(c1, c2, amt),
          strokeColor: lerpColor(c2, c1, amt)
        };
      case "rainbow":
      default:
        return {
          fillColor: color(hue, 60, 90),
          strokeColor: color(hue, 80, 70)
        };
    }
  }
  function displayInfo() {
    const infoElement = document.getElementById("info");
    if (infoElement) {
      const animationStatus = settings.animationEnabled ? "Animated" : "Static";
      infoElement.textContent = `File: ${filename || "No file selected"} | Functions: ${functions.length} | Mode: ${animationStatus}`;
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
    const hadFunctions = functions.length > 0;
    functions = data;
    filename = newFilename;
    if (settings.animationEnabled) {
      initializeAnimatedShapes();
      if (hadFunctions) {
        background(255, 255, 255, 100);
        setTimeout(() => background(220, 10, 20), 200);
      }
    }
  }
  function handleSettingsUpdate(newSettings) {
    const wasAnimated = settings.animationEnabled;
    settings = newSettings;
    if (settings.animationEnabled !== wasAnimated) {
      if (settings.animationEnabled && functions.length > 0) {
        initializeAnimatedShapes();
      }
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
