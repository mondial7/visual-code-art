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
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource}; script-src ${webview.cspSource} 'unsafe-inline'; style-src ${webview.cspSource} 'unsafe-inline';">
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
        
        #canvas-container {
          flex: 1;
          position: relative;
          overflow: hidden;
        }
        
        #stats-panel {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(0, 0, 0, 0.85);
          color: white;
          padding: 12px 20px;
          font-size: calc(var(--vscode-font-size) * 0.85);
          border-top: 1px solid rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(6px);
          z-index: 100;
          box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.3);
        }
        
        .stats-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin: 4px 0;
          align-items: center;
        }
        
        .stats-row:first-child {
          margin-bottom: 8px;
        }
        
        .stat-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0; /* Allows text truncation */
        }
        
        .stat-label {
          font-weight: 500;
          opacity: 0.7;
          font-size: calc(var(--vscode-font-size) * 0.75);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: rgba(255, 255, 255, 0.6);
        }
        
        .stat-value {
          font-weight: bold;
          color: #ffffff;
          font-size: calc(var(--vscode-font-size) * 0.9);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .complexity-high {
          color: #ff6b6b;
        }
        
        .complexity-medium {
          color: #ffd93d;
        }
        
        .complexity-low {
          color: #6bcf7f;
        }
        
        .complexity-extreme {
          color: #ff4757;
          font-weight: 900;
        }
        
        canvas {
          display: block;
          width: 100% !important;
          height: 100% !important;
        }
        
      </style>
    </head>
    <body>
      <div id="canvas-container"></div>
      
      <div id="stats-panel">
        <div class="stats-row">
          <div class="stat-item">
            <span class="stat-label">File:</span>
            <span class="stat-value" id="file-name">No file selected</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Functions:</span>
            <span class="stat-value" id="function-count">0</span>
          </div>
        </div>
        <div class="stats-row">
          <div class="stat-item">
            <span class="stat-label">Avg Complexity:</span>
            <span class="stat-value" id="avg-complexity">0.00</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Most Complex:</span>
            <span class="stat-value" id="max-complexity">None</span>
          </div>
        </div>
      </div>
      
      
      <script src="${p5Uri}"></script>
      <script src="${scriptUri}"></script>
      
    </body>
    </html>`;
  }
}
