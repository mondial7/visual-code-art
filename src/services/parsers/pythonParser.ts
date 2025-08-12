import * as vscode from 'vscode';
import { BaseLanguageParser, ProgrammingLanguage, EnhancedFunctionMetrics } from './baseParser';

/**
 * Python language parser using regex patterns and AST-like analysis
 * Since we can't easily run Python AST in VSCode extension, we use sophisticated regex
 */
export class PythonParser extends BaseLanguageParser {
  getSupportedLanguage(): ProgrammingLanguage {
    return ProgrammingLanguage.PYTHON;
  }
  
  canParse(document: vscode.TextDocument): boolean {
    const extension = this.getFileExtension(document);
    return extension === '.py' || extension === '.pyw' || document.languageId === 'python';
  }
  
  getConfidence(document: vscode.TextDocument): number {
    if (!this.canParse(document)) return 0.0;
    
    const text = document.getText();
    
    // Look for Python-specific patterns to increase confidence
    const pythonPatterns = [
      /^import\s+\w+/m,                    // import statements
      /^from\s+\w+\s+import/m,             // from imports  
      /def\s+\w+\s*\(/,                    // function definitions
      /class\s+\w+.*:/,                    // class definitions
      /@\w+/,                              // decorators
      /if\s+__name__\s*==\s*['"']__main__['"']/,  // main guard
      /print\s*\(/,                        // print function
      /self\./,                            // self references
      /:\s*$/m                             // colon endings (Python blocks)
    ];
    
    let matches = 0;
    for (const pattern of pythonPatterns) {
      if (pattern.test(text)) matches++;
    }
    
    // Higher confidence with more Python-specific patterns
    return Math.min(0.9, 0.6 + (matches * 0.05));
  }
  
  extractEnhancedFunctions(document: vscode.TextDocument): EnhancedFunctionMetrics[] {
    const text = document.getText();
    const lines = text.split('\n');
    const functions: EnhancedFunctionMetrics[] = [];
    
    // Python function patterns
    const patterns = [
      // Function definition: def function_name(params):
      /^(\s*)def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)\s*(?:->\s*[^:]+)?\s*:/,
      
      // Async function: async def function_name(params):
      /^(\s*)async\s+def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)\s*(?:->\s*[^:]+)?\s*:/
    ];
    
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      
      for (const pattern of patterns) {
        const match = pattern.exec(line);
        if (match) {
          const [fullMatch, indentation, functionName, paramsString] = match;
          
          // Skip if it's a control flow statement (shouldn't happen with Python syntax)
          if (this.isPythonKeyword(functionName)) {
            continue;
          }
          
          // Find the end of the function
          const functionInfo = this.findPythonFunctionEnd(lines, lineIndex, indentation.length);
          
          if (functionInfo.endLine > lineIndex) {
            const functionBody = lines.slice(lineIndex, functionInfo.endLine + 1).join('\n');
            const metrics = this.analyzePythonFunction(functionName, functionBody, paramsString);
            
            functions.push({
              ...metrics,
              startLine: lineIndex,
              endLine: functionInfo.endLine,
              size: functionInfo.endLine - lineIndex + 1,
              language: ProgrammingLanguage.PYTHON,
              confidence: 0.9
            });
          }
        }
      }
    }
    
    return functions.sort((a, b) => a.startLine - b.startLine);
  }
  
  private isPythonKeyword(name: string): boolean {
    const keywords = [
      'and', 'as', 'assert', 'break', 'class', 'continue', 'def', 'del', 'elif', 'else',
      'except', 'exec', 'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is',
      'lambda', 'not', 'or', 'pass', 'print', 'raise', 'return', 'try', 'while', 'with', 'yield'
    ];
    return keywords.includes(name.toLowerCase());
  }
  
  private findPythonFunctionEnd(lines: string[], startLine: number, baseIndentation: number): { endLine: number } {
    let endLine = startLine;
    
    // Python uses indentation for blocks
    for (let i = startLine + 1; i < lines.length; i++) {
      const line = lines[i];
      
      // Empty lines and comments don't affect block structure
      if (line.trim() === '' || line.trim().startsWith('#')) {
        continue;
      }
      
      // Calculate current line indentation
      const currentIndentation = line.length - line.trimStart().length;
      
      // If we hit a line with same or less indentation than the function def, we're done
      if (currentIndentation <= baseIndentation && line.trim() !== '') {
        break;
      }
      
      endLine = i;
    }
    
    return { endLine };
  }
  
  private analyzePythonFunction(name: string, functionBody: string, paramsString: string): Omit<EnhancedFunctionMetrics, 'startLine' | 'endLine' | 'size' | 'language' | 'confidence'> {
    // Analyze parameters
    const parameterCount = this.countPythonParameters(paramsString);
    
    // Calculate complexity
    const complexity = this.calculatePythonComplexity(functionBody);
    
    // Count return statements
    const returnStatements = this.countPythonReturns(functionBody);
    
    // Check if async
    const isAsync = /async\s+def/.test(functionBody);
    
    // Check if it's a method (has 'self' or 'cls' as first parameter)
    const isMethod = this.isPythonMethod(paramsString);
    
    // Check if it's exported (Python doesn't have explicit exports, but check for __all__)
    const isExported = !name.startsWith('_') || name.startsWith('__') && name.endsWith('__');
    
    return {
      name,
      cyclomaticComplexity: complexity.cyclomatic,
      nestingDepth: complexity.nesting,
      parameterCount,
      returnStatements,
      isAsync,
      isMethod,
      isExported
    };
  }
  
  private countPythonParameters(paramsString: string): number {
    if (!paramsString || paramsString.trim() === '') return 0;
    
    // Remove default values and type hints for counting
    const cleanParams = paramsString
      .replace(/:\s*[^,=]+/g, '') // Remove type hints
      .replace(/=\s*[^,]+/g, ''); // Remove default values
    
    const params = cleanParams.split(',')
      .map(p => p.trim())
      .filter(p => p !== '' && p !== 'self' && p !== 'cls' && !p.startsWith('*'));
    
    return params.length;
  }
  
  private calculatePythonComplexity(functionBody: string): { cyclomatic: number; nesting: number } {
    const lines = functionBody.split('\n');
    let cyclomaticComplexity = 1; // Base complexity
    let maxNesting = 0;
    let currentNesting = 0;
    let baseIndentation = -1;
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed === '' || trimmed.startsWith('#')) continue;
      
      const indentation = line.length - line.trimStart().length;
      
      // Set base indentation from first non-empty line
      if (baseIndentation === -1) {
        baseIndentation = indentation;
      }
      
      // Calculate nesting based on indentation relative to function start
      currentNesting = Math.max(0, Math.floor((indentation - baseIndentation) / 4));
      maxNesting = Math.max(maxNesting, currentNesting);
      
      // Count decision points
      if (/^\s*(if|elif|while|for|try|except|with|match|case)\b/.test(line)) {
        cyclomaticComplexity++;
      }
      
      // Count logical operators
      const logicalMatches = trimmed.match(/\b(and|or)\b/g);
      if (logicalMatches) {
        cyclomaticComplexity += logicalMatches.length;
      }
      
      // Count comprehensions (list, dict, set comprehensions)
      const comprehensionMatches = trimmed.match(/\[(.*?for.*?in.*?)\]|\{(.*?for.*?in.*?)\}/g);
      if (comprehensionMatches) {
        cyclomaticComplexity += comprehensionMatches.length;
      }
      
      // Count conditional expressions (ternary)
      const ternaryMatches = trimmed.match(/\bif\b.*?\belse\b/g);
      if (ternaryMatches) {
        cyclomaticComplexity += ternaryMatches.length;
      }
      
      // Count lambda functions
      const lambdaMatches = trimmed.match(/\blambda\b/g);
      if (lambdaMatches) {
        cyclomaticComplexity += lambdaMatches.length;
      }
    }
    
    return {
      cyclomatic: Math.max(1, cyclomaticComplexity),
      nesting: maxNesting
    };
  }
  
  private countPythonReturns(functionBody: string): number {
    // Count return statements, but not returns inside nested functions or classes
    const lines = functionBody.split('\n');
    let returnCount = 0;
    let baseIndentation = -1;
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed === '' || trimmed.startsWith('#')) continue;
      
      const indentation = line.length - line.trimStart().length;
      
      // Set base indentation from first non-empty line (function body start)
      if (baseIndentation === -1) {
        baseIndentation = indentation;
      }
      
      // Only count returns at the function level (not in nested functions)
      if (indentation <= baseIndentation + 4 && /^\s*return\b/.test(line)) {
        returnCount++;
      }
    }
    
    return returnCount;
  }
  
  private isPythonMethod(paramsString: string): boolean {
    if (!paramsString) return false;
    
    const params = paramsString.split(',').map(p => p.trim());
    const firstParam = params[0];
    
    // Method if first parameter is 'self' or 'cls'
    return firstParam === 'self' || firstParam === 'cls' || firstParam.startsWith('self:') || firstParam.startsWith('cls:');
  }
}