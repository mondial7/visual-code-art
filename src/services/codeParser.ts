import * as vscode from 'vscode';
import { CodeFunction } from '../models/code';
import { TypeScriptAstParser } from './typeScriptAstParser';

export class CodeParser {
  private tsParser = new TypeScriptAstParser();

  /**
   * Extract functions and their metrics from a text document
   * Uses enhanced TypeScript AST parser for JS/TS files, falls back to regex for other languages
   */
  public extractFunctions(document: vscode.TextDocument): CodeFunction[] {
    // Use TypeScript AST parser for JavaScript/TypeScript files
    if (this.isJavaScriptOrTypeScript(document)) {
      try {
        return this.tsParser.extractFunctions(document);
      } catch (error) {
        console.warn('[CodeParser] TypeScript AST parsing failed, falling back to regex:', error);
        // Fall back to regex parsing if AST parsing fails
        return this.extractFunctionsWithRegex(document);
      }
    }
    
    // Use regex parsing for other file types
    return this.extractFunctionsWithRegex(document);
  }

  /**
   * Check if the document is JavaScript or TypeScript
   */
  private isJavaScriptOrTypeScript(document: vscode.TextDocument): boolean {
    const fileName = document.fileName.toLowerCase();
    return fileName.endsWith('.js') || 
           fileName.endsWith('.jsx') || 
           fileName.endsWith('.ts') || 
           fileName.endsWith('.tsx') ||
           fileName.endsWith('.mjs') ||
           fileName.endsWith('.cjs');
  }

  /**
   * Original regex-based function extraction (fallback and for non-JS/TS files)
   */
  private extractFunctionsWithRegex(document: vscode.TextDocument): CodeFunction[] {
    const text = document.getText();
    const functions: CodeFunction[] = [];
    
    // Multiple patterns for different function declaration styles
    const patterns = [
      // Traditional function declaration: function name() {}
      /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\([^)]*\)\s*\{/g,
      
      // Const/let/var with arrow function: const name = () => {}
      /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>\s*\{/g,
      
      // Const/let/var with function expression: const name = function() {}
      /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:async\s+)?function\s*\([^)]*\)\s*\{/g,
      
      // Object method: name() {} or name: function() {}
      /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:\s*(?:async\s+)?function\s*\([^)]*\)\s*\{/g,
      
      // Object shorthand method: name() {}
      /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\([^)]*\)\s*\{/g,
      
      // Class method: methodName() {}
      /(?:public|private|protected|static)?\s*(?:async\s+)?([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\([^)]*\)\s*\{/g,
      
      // Export function: export function name() {}
      /export\s+function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\([^)]*\)\s*\{/g,
      
      // Export const arrow: export const name = () => {}
      /export\s+const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>\s*\{/g
    ];
    
    // Apply each pattern
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const name = match[1];
        
        // Skip if it's a control flow statement
        if (this.isControlFlowStatement(name)) {
          continue;
        }
        
        // Skip if it's already found
        if (functions.some(f => f.name === name)) {
          continue;
        }
        
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
    }
    
    return functions.sort((a, b) => a.startLine - b.startLine);
  }
  
  /**
   * Check if a name is a control flow statement that should be ignored
   */
  private isControlFlowStatement(name: string): boolean {
    const controlFlowKeywords = [
      'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'try', 'catch', 
      'finally', 'return', 'break', 'continue', 'throw', 'with', 'typeof',
      'instanceof', 'in', 'delete', 'void', 'new', 'this', 'super'
    ];
    return controlFlowKeywords.includes(name.toLowerCase());
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
