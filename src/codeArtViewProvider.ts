import * as vscode from 'vscode';
import * as path from 'path';
import { CodeParser } from './services/codeParser';
import { SettingsService } from './services/settingsService';
import { WebviewContentProvider } from './webview/webviewContent';
import { FileData } from './models/code';

export class CodeArtViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'visual-code-art.canvasView';
  private _view?: vscode.WebviewView;
  private readonly _codeParser: CodeParser;
  private readonly _settingsService: SettingsService;
  private readonly _webviewContent: WebviewContentProvider;

  constructor(
    private readonly _extensionUri: vscode.Uri,
  ) {
    // Initialize services
    this._codeParser = new CodeParser();
    this._settingsService = new SettingsService();
    this._webviewContent = new WebviewContentProvider();
    // Listen for configuration changes
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('visualCodeArt')) {
        // If we have an active view, update it with the new settings
        if (this._view) {
          this._updateSettings();
        }
      }
    });
  }

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

    webviewView.webview.html = this._webviewContent.getWebviewContent(webviewView.webview, this._extensionUri);

    // Set up event listeners for file changes
    this._setupFileChangeListener(webviewView);
    
    // Set up message handling from webview
    this._setupMessageHandling(webviewView);
    
    // Send initial settings to the webview
    this._updateSettings();
    
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

  private _setupMessageHandling(webviewView: vscode.WebviewView) {
    // Listen for messages from the webview
    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.type) {
        case 'settingsChanged':
          try {
            // Update settings in workspace configuration
            await this._settingsService.updateSettings(message.settings);
            
            // Send updated settings back to webview to confirm
            this._updateSettings();
            
            // Show success message
            vscode.window.showInformationMessage('Visual Code Art settings updated!');
          } catch (error) {
            vscode.window.showErrorMessage(`Failed to update settings: ${error}`);
          }
          break;
        default:
          console.warn('Unknown message type from webview:', message.type);
      }
    });
  }

  private _processActiveFile(document: vscode.TextDocument, webviewView: vscode.WebviewView) {
    // Extract functions and their sizes
    const functions = this._codeParser.extractFunctions(document);
    
    // Send data to webview
    webviewView.webview.postMessage({
      type: 'update',
      data: functions,
      filename: path.basename(document.fileName)
    });
  }
  
  private _updateSettings() {
    if (!this._view) {
      return;
    }
    
    // Get settings from service
    const settings = this._settingsService.getSettings();
    
    // Send settings to the webview
    this._view.webview.postMessage({
      type: 'settings',
      settings: settings
    });
  }
}
