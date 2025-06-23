import * as vscode from 'vscode';
import { CodeFunction } from '../models/code';

export class CodeParser {
  /**
   * Extract functions and their metrics from a text document
   */
  public extractFunctions(document: vscode.TextDocument): CodeFunction[] {
    const text = document.getText();
    const functions: CodeFunction[] = [];
    
    // Function regex pattern - matches various function declaration styles
    const functionRegex = /function\s+(\w+)\s*\([^)]*\)\s*{|\b(\w+)\s*=\s*function\s*\([^)]*\)\s*{|(\w+)\s*\([^)]*\)\s*{|(\w+)\s*:\s*function\s*\([^)]*\)\s*{/g;
    
    let match;
    while ((match = functionRegex.exec(text)) !== null) {
      // Find the function name from the match groups
      const name = match[1] || match[2] || match[3] || match[4] || 'anonymous';
      
      // Get position info
      const startPos = match.index;
      const startLine = document.positionAt(startPos).line;
      
      // Find the end of the function by matching braces
      const functionInfo = this.findFunctionEnd(text, startPos);
      const endLine = document.positionAt(functionInfo.endPos).line;
      
      // Calculate lines
      const lines = endLine - startLine + 1;
      
      functions.push({ 
        name, 
        size: lines,
        startLine,
        endLine
      });
    }
    
    return functions;
  }
  
  /**
   * Find the endpoint of a function by matching braces
   */
  private findFunctionEnd(text: string, startPos: number): { endPos: number } {
    let openBraces = 1;
    let endPos = startPos;
    
    const openBracePos = text.indexOf('{', startPos);
    if (openBracePos === -1) {
      return { endPos };
    }
    
    for (let i = openBracePos + 1; i < text.length && openBraces > 0; i++) {
      if (text[i] === '{') { openBraces++; }
      if (text[i] === '}') { openBraces--; }
      if (openBraces === 0) {
        endPos = i;
        break;
      }
    }
    
    return { endPos };
  }
}
