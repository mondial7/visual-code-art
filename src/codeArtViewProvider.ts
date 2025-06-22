import * as vscode from 'vscode';
import * as path from 'path';

export class CodeArtViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'visual-code-art.canvasView';
  private _view?: vscode.WebviewView;

  constructor(
    private readonly _extensionUri: vscode.Uri,
  ) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };

    webviewView.webview.html = this._getWebviewContent(webviewView.webview);

    // Set up event listeners for file changes
    this._setupFileChangeListener(webviewView);
    
    // Process initial active editor if present
    if (vscode.window.activeTextEditor) {
      this._processActiveFile(vscode.window.activeTextEditor.document, webviewView);
    }
  }

  private _setupFileChangeListener(webviewView: vscode.WebviewView) {
    // Listen to text document changes
    vscode.workspace.onDidChangeTextDocument(e => {
      if (vscode.window.activeTextEditor && 
          e.document === vscode.window.activeTextEditor.document) {
        this._processActiveFile(e.document, webviewView);
      }
    });

    // Listen to active editor changes
    vscode.window.onDidChangeActiveTextEditor(editor => {
      if (editor) {
        this._processActiveFile(editor.document, webviewView);
      }
    });
  }

  private _processActiveFile(document: vscode.TextDocument, webviewView: vscode.WebviewView) {
    // Extract functions and their sizes
    const functions = this._extractFunctions(document);
    
    // Send data to webview
    webviewView.webview.postMessage({
      type: 'update',
      data: functions,
      filename: path.basename(document.fileName)
    });
  }

  private _extractFunctions(document: vscode.TextDocument): Array<{name: string, size: number}> {
    const text = document.getText();
    const functions: Array<{name: string, size: number}> = [];
    
    // This is a very simple implementation that uses regex to find functions
    // It will need to be improved for different languages and more complex patterns
    // We're starting with a simple regex for JavaScript/TypeScript functions
    const functionRegex = /function\s+(\w+)\s*\([^)]*\)\s*{|\b(\w+)\s*=\s*function\s*\([^)]*\)\s*{|(\w+)\s*\([^)]*\)\s*{|(\w+)\s*:\s*function\s*\([^)]*\)\s*{/g;
    
    let match;
    while ((match = functionRegex.exec(text)) !== null) {
      // Find the function name from the match groups
      const name = match[1] || match[2] || match[3] || match[4] || 'anonymous';
      
      // Crude estimation of function size by finding closing brace
      // This is simplified and will need improvement for nested functions
      const startPos = match.index;
      let openBraces = 1;
      let endPos = startPos;
      
      for (let i = text.indexOf('{', startPos) + 1; i < text.length && openBraces > 0; i++) {
        if (text[i] === '{') openBraces++;
        if (text[i] === '}') openBraces--;
        if (openBraces === 0) {
          endPos = i;
          break;
        }
      }
      
      // Calculate lines by counting newlines
      const functionText = text.substring(startPos, endPos);
      const lines = functionText.split('\n').length;
      
      functions.push({ name, size: lines });
    }
    
    return functions;
  }

  private _getWebviewContent(webview: vscode.Webview): string {
    // Create URIs for scripts that need to be loaded in the webview
    const p5Uri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'node_modules', 'p5', 'lib', 'p5.min.js')
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
          overflow: hidden;
        }
        canvas {
          display: block;
        }
        #info {
          position: absolute;
          top: 10px;
          left: 10px;
          color: var(--vscode-foreground);
          font-family: var(--vscode-font-family);
          font-size: var(--vscode-font-size);
        }
      </style>
    </head>
    <body>
      <div id="info"></div>
      <script src="${p5Uri}"></script>
      <script>
        // Initialize connection with extension
        const vscode = acquireVsCodeApi();
        
        // Store state
        let functions = [];
        let filename = '';
        
        // p5.js sketch
        function setup() {
          createCanvas(window.innerWidth, window.innerHeight);
          windowResized();
          colorMode(HSB, 360, 100, 100);
        }
        
        function draw() {
          background(220, 10, 20);
          drawFunctions();
          displayInfo();
        }
        
        function windowResized() {
          resizeCanvas(window.innerWidth, window.innerHeight);
        }
        
        function drawFunctions() {
          if (functions.length === 0) return;
          
          // Find max function size for normalization
          const maxSize = Math.max(...functions.map(f => f.size));
          
          // Calculate grid dimensions based on number of functions
          const numFunctions = functions.length;
          const numCols = Math.ceil(Math.sqrt(numFunctions));
          const numRows = Math.ceil(numFunctions / numCols);
          
          // Calculate cell size
          const cellWidth = width / numCols;
          const cellHeight = height / numRows;
          const padding = 10;
          
          // Draw squares for each function
          functions.forEach((func, i) => {
            const row = Math.floor(i / numCols);
            const col = i % numCols;
            
            const x = col * cellWidth + padding;
            const y = row * cellHeight + padding;
            const size = map(func.size, 1, maxSize, 20, Math.min(cellWidth, cellHeight) - padding * 2);
            
            // Generate a consistent hue based on function name
            const hue = hashString(func.name) % 360;
            
            // Draw the square
            fill(hue, 60, 90);
            stroke(hue, 80, 70);
            strokeWeight(2);
            rectMode(CENTER);
            rect(x + cellWidth/2, y + cellHeight/2, size, size);
            
            // Add text label
            fill(0, 0, 0);
            noStroke();
            textAlign(CENTER, CENTER);
            textSize(10);
            text(func.name, x + cellWidth/2, y + cellHeight/2 + size/2 + 10);
          });
        }
        
        function displayInfo() {
          document.getElementById('info').textContent = 
            \`File: \${filename || 'No file selected'} | Functions: \${functions.length}\`;
        }
        
        // Simple string hash function
        function hashString(str) {
          let hash = 0;
          for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
          }
          return Math.abs(hash);
        }
        
        // Listen for messages from the extension
        window.addEventListener('message', event => {
          const message = event.data;
          
          if (message.type === 'update') {
            functions = message.data;
            filename = message.filename;
          }
        });
      </script>
    </body>
    </html>`;
  }
}
