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
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 8px 16px;
          font-size: calc(var(--vscode-font-size) * 0.9);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(4px);
          z-index: 100;
        }
        
        .stats-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 2px 0;
        }
        
        .stat-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .stat-label {
          font-weight: 500;
          opacity: 0.8;
        }
        
        .stat-value {
          font-weight: bold;
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
