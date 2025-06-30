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
        
        input[type="color"] {
          width: 40px;
          height: 24px;
          padding: 0;
          border: 1px solid var(--vscode-input-border);
          border-radius: 2px;
          cursor: pointer;
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
      </style>
    </head>
    <body>
      <div id="controls">
        <div class="control-group">
          <label for="shapeSelect">Shape Style:</label>
          <select id="shapeSelect">
            <option value="squares">Squares</option>
            <option value="circles">Circles</option>
            <option value="triangles">Triangles</option>
          </select>
        </div>
        
        <div class="control-group">
          <label for="colorSelect">Color Theme:</label>
          <select id="colorSelect">
            <option value="rainbow">Rainbow</option>
            <option value="monoBlue">Mono Blue</option>
            <option value="monoGreen">Mono Green</option>
            <option value="monoPurple">Mono Purple</option>
            <option value="custom">Custom</option>
          </select>
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
      </div>
      
      <div id="canvas-container">
        <div id="info"></div>
      </div>
      
      <script src="${p5Uri}"></script>
      <script src="${scriptUri}"></script>
      
      <script>
        // Handle UI interactions
        const vscode = acquireVsCodeApi();
        
        function updateSettings() {
          const settings = {
            style: document.getElementById('shapeSelect').value,
            colorTheme: document.getElementById('colorSelect').value,
            customColorPrimary: document.getElementById('primaryColor').value,
            customColorSecondary: document.getElementById('secondaryColor').value,
            padding: 10,
            animationEnabled: document.getElementById('animationToggle').checked
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
        
        // Listen for settings updates from extension
        window.addEventListener('message', event => {
          const message = event.data;
          if (message.type === 'settingsUpdate') {
            const settings = message.settings;
            document.getElementById('shapeSelect').value = settings.style;
            document.getElementById('colorSelect').value = settings.colorTheme;
            document.getElementById('primaryColor').value = settings.customColorPrimary || '#FF0000';
            document.getElementById('secondaryColor').value = settings.customColorSecondary || '#0000FF';
            document.getElementById('animationToggle').checked = settings.animationEnabled;
            
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
