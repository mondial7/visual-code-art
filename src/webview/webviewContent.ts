import * as vscode from 'vscode';

export class WebviewContentProvider {
  /**
   * Generate HTML content for the webview
   */
  public getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri): string {
    // Create URIs for scripts that need to be loaded in the webview
    const p5Uri = webview.asWebviewUri(
      vscode.Uri.joinPath(extensionUri, 'node_modules', 'p5', 'lib', 'p5.min.js')
    );
    
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(extensionUri, 'media', 'codeArtSketch.js')
    );

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Visual Code Art</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: var(--vscode-font-family);
          font-size: var(--vscode-font-size);
          background: var(--vscode-editor-background);
          color: var(--vscode-foreground);
          display: flex;
          flex-direction: column;
          height: 100vh;
        }
        
        #controls {
          padding: 16px;
          border-bottom: 1px solid var(--vscode-widget-border);
          background: var(--vscode-sideBar-background);
          flex-shrink: 0;
        }
        
        #canvas-container {
          flex: 1;
          position: relative;
          overflow: hidden;
        }
        
        canvas {
          display: block;
          width: 100% !important;
          height: 100% !important;
        }
        
        .control-group {
          margin-bottom: 12px;
        }
        
        .control-group:last-child {
          margin-bottom: 0;
        }
        
        label {
          display: block;
          margin-bottom: 4px;
          font-weight: 500;
          color: var(--vscode-foreground);
        }
        
        select, input[type="checkbox"] {
          width: 100%;
          padding: 4px 8px;
          background: var(--vscode-input-background);
          color: var(--vscode-input-foreground);
          border: 1px solid var(--vscode-input-border);
          border-radius: 2px;
          font-family: var(--vscode-font-family);
          font-size: var(--vscode-font-size);
        }
        
        input[type="checkbox"] {
          width: auto;
          margin-right: 8px;
        }
        
        select:focus, input:focus {
          outline: 1px solid var(--vscode-focusBorder);
          outline-offset: -1px;
        }
        
        .checkbox-container {
          display: flex;
          align-items: center;
        }
        
        .color-inputs {
          display: none;
        }
        
        .color-inputs.visible {
          display: block;
        }
        
        input[type="color"], input[type="range"] {
          width: 40px;
          height: 24px;
          padding: 0;
          border: 1px solid var(--vscode-input-border);
          border-radius: 2px;
          cursor: pointer;
        }
        
        input[type="range"] {
          width: 100%;
          height: 20px;
          background: var(--vscode-input-background);
        }
        
        .color-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }
        
        .color-row label {
          margin: 0;
          flex: 1;
          font-size: calc(var(--vscode-font-size) * 0.9);
        }
        
        #info {
          position: absolute;
          bottom: 8px;
          left: 8px;
          font-size: calc(var(--vscode-font-size) * 0.85);
          opacity: 0.7;
          background: rgba(0, 0, 0, 0.5);
          padding: 4px 8px;
          border-radius: 3px;
          color: white;
        }
        
        #debug-panel {
          padding: 16px;
          background: var(--vscode-sideBar-background);
          color: var(--vscode-foreground);
          font-family: var(--vscode-editor-font-family);
          font-size: calc(var(--vscode-font-size) * 0.9);
          height: 100%;
          overflow-y: auto;
          flex: 1;
        }
        
        #debug-panel h3 {
          margin: 0 0 12px 0;
          font-size: var(--vscode-font-size);
          font-weight: 600;
        }
        
        #debug-content pre {
          background: var(--vscode-editor-background);
          border: 1px solid var(--vscode-input-border);
          border-radius: 3px;
          padding: 8px;
          margin: 8px 0;
          font-family: var(--vscode-editor-font-family);
          font-size: calc(var(--vscode-font-size) * 0.85);
          white-space: pre-wrap;
          word-wrap: break-word;
        }
      </style>
    </head>
    <body>
      <div id="controls">
        <div class="control-group">
          <label for="shapeSelect">Visualization Style:</label>
          <select id="shapeSelect">
            <option value="particles">Particles</option>
            <option value="chaos">Chaos</option>
            <option value="flow">Flow</option>
            <option value="classic">Classic</option>
          </select>
        </div>
        
        <div class="control-group">
          <label for="colorSelect">Color Theme:</label>
          <select id="colorSelect">
            <option value="rainbow">Rainbow</option>
            <option value="intensity">Intensity</option>
            <option value="monoBlue">Mono Blue</option>
            <option value="monoGreen">Mono Green</option>
            <option value="monoPurple">Mono Purple</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        
        <div class="control-group">
          <label for="intensitySlider">Particle Intensity: <span id="intensityValue">100%</span></label>
          <input type="range" id="intensitySlider" min="0" max="100" value="100" step="10">
        </div>
        
        <div id="customColors" class="control-group color-inputs">
          <div class="color-row">
            <label for="primaryColor">Primary:</label>
            <input type="color" id="primaryColor" value="#FF0000">
          </div>
          <div class="color-row">
            <label for="secondaryColor">Secondary:</label>
            <input type="color" id="secondaryColor" value="#0000FF">
          </div>
        </div>
        
        <div class="control-group">
          <div class="checkbox-container">
            <input type="checkbox" id="animationToggle" checked>
            <label for="animationToggle">Enable Animation</label>
          </div>
        </div>
        
        <div class="control-group">
          <div class="checkbox-container">
            <input type="checkbox" id="debugToggle">
            <label for="debugToggle">Show Debug Info</label>
          </div>
        </div>
      </div>
      
      <div id="canvas-container">
        <div id="info"></div>
      </div>
      
      <div id="debug-panel" style="display: none;">
        <h3>Debug Information</h3>
        <div id="debug-content">
          <p>No data received yet...</p>
        </div>
      </div>
      
      <script src="${p5Uri}"></script>
      <script src="${scriptUri}"></script>
      
      <script>
        // Handle UI interactions
        const vscode = acquireVsCodeApi();
        
        function updateSettings() {
          const intensitySlider = document.getElementById('intensitySlider');
          const particleIntensity = intensitySlider ? parseInt(intensitySlider.value) / 100 : 1.0;
          
          const settings = {
            style: document.getElementById('shapeSelect').value,
            colorTheme: document.getElementById('colorSelect').value,
            customColorPrimary: document.getElementById('primaryColor').value,
            customColorSecondary: document.getElementById('secondaryColor').value,
            padding: 10,
            animationEnabled: document.getElementById('animationToggle').checked,
            particleIntensity: particleIntensity,
            debugMode: document.getElementById('debugToggle').checked
          };
          
          // Send settings to extension
          vscode.postMessage({
            type: 'settingsChanged',
            settings: settings
          });
        }
        
        // Set up event listeners
        document.getElementById('shapeSelect').addEventListener('change', updateSettings);
        document.getElementById('colorSelect').addEventListener('change', function() {
          const customColors = document.getElementById('customColors');
          if (this.value === 'custom') {
            customColors.classList.add('visible');
          } else {
            customColors.classList.remove('visible');
          }
          updateSettings();
        });
        document.getElementById('primaryColor').addEventListener('change', updateSettings);
        document.getElementById('secondaryColor').addEventListener('change', updateSettings);
        document.getElementById('animationToggle').addEventListener('change', updateSettings);
        document.getElementById('intensitySlider').addEventListener('input', function() {
          const value = this.value;
          document.getElementById('intensityValue').textContent = value + '%';
          updateSettings();
        });
        document.getElementById('debugToggle').addEventListener('change', function() {
          const debugPanel = document.getElementById('debug-panel');
          const canvasContainer = document.getElementById('canvas-container');
          
          if (this.checked) {
            // Hide canvas and show debug panel
            canvasContainer.style.display = 'none';
            debugPanel.style.display = 'flex';
            
            // Show immediate status while loading
            document.getElementById('debug-content').innerHTML = '<p><strong>🔍 Debug Panel Enabled</strong><br><em>Canvas is hidden while in debug mode.</em><br><br>⏳ Waiting for data from extension...</p>';
            
            // Request fresh data for debug display
            vscode.postMessage({
              type: 'requestDebugData'
            });
          } else {
            // Show canvas and hide debug panel
            canvasContainer.style.display = 'flex';
            debugPanel.style.display = 'none';
          }
          updateSettings();
        });
        
        // Function to update debug display
        function updateDebugDisplay(data, filename, error) {
          const debugContent = document.getElementById('debug-content');
          
          if (error) {
            debugContent.innerHTML = '<p><strong style="color: #ff6b6b;">ERROR</strong><br>File: ' + (filename || 'Unknown') + '<br><strong>Error:</strong> ' + error + '</p>';
            return;
          }
          
          if (!data || data.length === 0) {
            debugContent.innerHTML = 
              '<h4>🔍 Debug Information</h4>' +
              '<p><strong>File:</strong> ' + (filename || 'Unknown') + '</p>' +
              '<p><strong style="color: #ffa500;">⚠️ No functions found in current file.</strong></p>' +
              '<p><strong>This could mean:</strong></p>' +
              '<ul>' +
                '<li>Parser doesn\'t recognize the function syntax</li>' +
                '<li>File contains no functions</li>' +
                '<li>File is not a supported type</li>' +
                '<li>Functions use unsupported patterns</li>' +
              '</ul>' +
              '<p><strong>💡 To help debug:</strong></p>' +
              '<ul>' +
                '<li>Check the Developer Console (F12) for detailed logs</li>' +
                '<li>Look for <code>[CodeArt]</code> messages in VSCode Debug Console</li>' +
                '<li>Try a simple .js file with <code>function test() {}</code></li>' +
              '</ul>';
            return;
          }
          
          let html = '<h4>🔍 Debug Information</h4>';
          html += '<p><strong>File:</strong> ' + (filename || 'Unknown') + '</p>';
          html += '<p><strong>✅ Functions found:</strong> ' + data.length + '</p>';
          html += '<hr>';
          
          data.forEach((func, index) => {
            const complexityColor = func.complexity ? 
              (func.complexity.intensityLevel === 'extreme' ? '#ff6b6b' : 
               func.complexity.intensityLevel === 'high' ? '#ffa500' : 
               func.complexity.intensityLevel === 'medium' ? '#4ecdc4' : '#95e1d3') : '#ccc';
               
            html += '<div style="border-left: 4px solid ' + complexityColor + '; padding-left: 12px; margin-bottom: 16px;">';
            html += '<h5 style="margin: 0 0 8px 0;">' + (index + 1) + '. ' + func.name + '</h5>';
            html += '<p><strong>Lines:</strong> ' + func.size + ' (lines ' + (func.startLine + 1) + '-' + (func.endLine + 1) + ')</p>';
            
            if (func.complexity) {
              html += '<p><strong>Complexity Analysis:</strong></p>';
              html += '<ul>';
              html += '<li><strong>Overall:</strong> ' + func.complexity.overallComplexity.toFixed(3) + '</li>';
              html += '<li><strong>Cyclomatic:</strong> ' + func.complexity.cyclomaticComplexity + '</li>';
              html += '<li><strong>Nesting Depth:</strong> ' + func.complexity.nestingDepth + '</li>';
              html += '<li><strong>Intensity:</strong> <span style="color: ' + complexityColor + '; font-weight: bold;">' + func.complexity.intensityLevel.toUpperCase() + '</span></li>';
              html += '</ul>';
            }
            html += '</div>';
          });
          
          debugContent.innerHTML = html;
        }
        
        // Listen for messages from extension
        window.addEventListener('message', event => {
          const message = event.data;
          if (message.type === 'update') {
            // Update debug display if debug mode is enabled
            if (document.getElementById('debugToggle').checked) {
              updateDebugDisplay(message.data, message.filename, message.error);
            }
          } else if (message.type === 'settings') {
            const settings = message.settings;
            document.getElementById('shapeSelect').value = settings.style;
            document.getElementById('colorSelect').value = settings.colorTheme;
            document.getElementById('primaryColor').value = settings.customColorPrimary || '#FF0000';
            document.getElementById('secondaryColor').value = settings.customColorSecondary || '#0000FF';
            document.getElementById('animationToggle').checked = settings.animationEnabled;
            
            // Update intensity slider
            const intensityValue = Math.round((settings.particleIntensity || 1.0) * 100);
            document.getElementById('intensitySlider').value = intensityValue;
            document.getElementById('intensityValue').textContent = intensityValue + '%';
            
            // Update debug toggle and panel visibility
            document.getElementById('debugToggle').checked = settings.debugMode || false;
            const debugPanel = document.getElementById('debug-panel');
            const canvasContainer = document.getElementById('canvas-container');
            
            if (settings.debugMode) {
              canvasContainer.style.display = 'none';
              debugPanel.style.display = 'flex';
            } else {
              canvasContainer.style.display = 'flex';
              debugPanel.style.display = 'none';
            }
            
            // Show/hide custom colors
            const customColors = document.getElementById('customColors');
            if (settings.colorTheme === 'custom') {
              customColors.classList.add('visible');
            } else {
              customColors.classList.remove('visible');
            }
          }
        });
      </script>
    </body>
    </html>`;
  }
}
