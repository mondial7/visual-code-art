import * as vscode from 'vscode';
import { BaseLanguageParser, ProgrammingLanguage, EnhancedFunctionMetrics } from './baseParser';

/**
 * PHP language parser supporting modern PHP features and frameworks
 * Handles object-oriented PHP, procedural functions, and framework patterns
 */
export class PhpParser extends BaseLanguageParser {
  getSupportedLanguage(): ProgrammingLanguage {
    return ProgrammingLanguage.PHP;
  }
  
  canParse(document: vscode.TextDocument): boolean {
    const extension = this.getFileExtension(document);
    return extension === '.php' || 
           extension === '.phtml' || 
           extension === '.inc' ||
           document.languageId === 'php';
  }
  
  getConfidence(document: vscode.TextDocument): number {
    if (!this.canParse(document)) return 0.0;
    
    const text = document.getText();
    
    // Look for PHP-specific patterns to increase confidence
    const phpPatterns = [
      /^<\?php/m,                                  // PHP opening tag
      /\$\w+/,                                     // PHP variables
      /^namespace\s+[\w\\]+\s*;/m,                 // Namespace declarations
      /^use\s+[\w\\]+\s*;/m,                       // Use statements
      /class\s+\w+/,                               // Class declarations
      /interface\s+\w+/,                           // Interface declarations
      /trait\s+\w+/,                               // Trait declarations
      /function\s+\w+\s*\(/,                       // Function declarations
      /public\s+function/,                         // Public methods
      /private\s+function/,                        // Private methods
      /protected\s+function/,                      // Protected methods
      /->\w+/,                                     // Object method calls
      /::\w+/,                                     // Static method calls
      /echo\s+/,                                   // Echo statements
      /print\s+/,                                  // Print statements
      /\$this->/,                                  // Object context
      /parent::/,                                  // Parent class calls
      /self::/                                     // Self references
    ];
    
    let matches = 0;
    for (const pattern of phpPatterns) {
      if (pattern.test(text)) matches++;
    }
    
    // Higher confidence with more PHP-specific patterns
    return Math.min(0.95, 0.7 + (matches * 0.05));
  }
  
  extractEnhancedFunctions(document: vscode.TextDocument): EnhancedFunctionMetrics[] {
    const text = document.getText();
    const lines = text.split('\n');
    const functions: EnhancedFunctionMetrics[] = [];
    
    // PHP function patterns
    const patterns = [
      // Class method: [visibility] [static] function methodName(params)
      /^(\s*)(public|private|protected)?\s*(static)?\s*function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)\s*(?::\s*[\w\\|?]+)?\s*\{/,
      
      // Global function: function functionName(params)
      /^(\s*)function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)\s*(?::\s*[\w\\|?]+)?\s*\{/,
      
      // Anonymous function: $var = function(params) use (vars)
      /^(\s*)\$\w+\s*=\s*function\s*\(([^)]*)\)\s*(?:use\s*\([^)]*\))?\s*\{/,
      
      // Arrow function: $var = fn(params) => expression
      /^(\s*)\$\w+\s*=\s*fn\s*\(([^)]*)\)\s*=>/,
      
      // Magic methods: public function __methodName(params)
      /^(\s*)(public|private|protected)?\s*function\s+(__(construct|destruct|get|set|isset|unset|call|callStatic|toString|invoke|clone|sleep|wakeup|serialize|unserialize|debugInfo))\s*\(([^)]*)\)\s*\{/
    ];
    
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      
      for (const pattern of patterns) {
        const match = pattern.exec(line);
        if (match) {
          let methodName: string;
          let paramsString: string;
          let visibility: string = '';
          let isStatic: boolean = false;
          let isMagicMethod: boolean = false;
          let isAnonymous: boolean = false;
          
          // Parse different pattern types
          if (match[4] && match[5] !== undefined) {
            // Class method pattern
            visibility = match[2] || 'public';
            isStatic = !!match[3];
            methodName = match[4];
            paramsString = match[5];
          } else if (match[2] && match[3] !== undefined && !match[4]) {
            // Global function pattern
            methodName = match[2];
            paramsString = match[3];
          } else if (match[6]) {
            // Magic method pattern
            visibility = match[2] || 'public';
            methodName = match[3];
            paramsString = match[6];
            isMagicMethod = true;
          } else {
            // Anonymous function or arrow function
            methodName = 'anonymous_function';
            paramsString = match[2] || '';
            isAnonymous = true;
          }
          
          // Skip if it's a PHP keyword
          if (this.isPhpKeyword(methodName)) {
            continue;
          }
          
          // Find the end of the function
          const functionInfo = this.findPhpFunctionEnd(lines, lineIndex, match[1].length);
          
          if (functionInfo.endLine > lineIndex) {
            const functionBody = lines.slice(lineIndex, functionInfo.endLine + 1).join('\n');
            const metrics = this.analyzePhpFunction(
              methodName, 
              functionBody, 
              paramsString, 
              visibility,
              isStatic,
              isMagicMethod,
              isAnonymous
            );
            
            functions.push({
              ...metrics,
              startLine: lineIndex,
              endLine: functionInfo.endLine,
              size: functionInfo.endLine - lineIndex + 1,
              language: ProgrammingLanguage.PHP,
              confidence: 0.9
            });
          }
        }
      }
    }
    
    return functions.sort((a, b) => a.startLine - b.startLine);
  }
  
  private isPhpKeyword(name: string): boolean {
    const keywords = [
      'abstract', 'and', 'array', 'as', 'break', 'callable', 'case', 'catch', 'class',
      'clone', 'const', 'continue', 'declare', 'default', 'die', 'do', 'echo', 'else',
      'elseif', 'empty', 'enddeclare', 'endfor', 'endforeach', 'endif', 'endswitch',
      'endwhile', 'eval', 'exit', 'extends', 'final', 'finally', 'for', 'foreach',
      'function', 'global', 'goto', 'if', 'implements', 'include', 'include_once',
      'instanceof', 'insteadof', 'interface', 'isset', 'list', 'namespace', 'new',
      'or', 'print', 'private', 'protected', 'public', 'require', 'require_once',
      'return', 'static', 'switch', 'throw', 'trait', 'try', 'unset', 'use', 'var',
      'while', 'xor', 'yield', 'from'
    ];
    return keywords.includes(name.toLowerCase());
  }
  
  private findPhpFunctionEnd(lines: string[], startLine: number, baseIndentation: number): { endLine: number } {
    let endLine = startLine;
    let braceCount = 0;
    let foundOpenBrace = false;
    
    for (let i = startLine; i < lines.length; i++) {
      const line = lines[i];
      
      // Count braces
      for (const char of line) {
        if (char === '{') {
          braceCount++;
          foundOpenBrace = true;
        } else if (char === '}') {
          braceCount--;
          
          // Function ends when braces are balanced
          if (foundOpenBrace && braceCount === 0) {
            return { endLine: i };
          }
        }
      }
      
      endLine = i;
      
      // Safety limit for very long functions
      if (i - startLine > 400) break;
    }
    
    return { endLine };
  }
  
  private analyzePhpFunction(
    name: string,
    functionBody: string,
    paramsString: string,
    visibility: string,
    isStatic: boolean,
    isMagicMethod: boolean,
    isAnonymous: boolean
  ): Omit<EnhancedFunctionMetrics, 'startLine' | 'endLine' | 'size' | 'language' | 'confidence'> {
    // Analyze parameters
    const parameterCount = this.countPhpParameters(paramsString);
    
    // Calculate complexity
    const complexity = this.calculatePhpComplexity(functionBody);
    
    // Count return statements
    const returnStatements = this.countPhpReturns(functionBody);
    
    // Determine function characteristics
    const isAsync = false; // PHP doesn't have native async/await
    const isMethod = visibility !== '' || !isAnonymous;
    const isPublic = visibility === 'public' || visibility === '';
    
    // Enhanced naming for special functions
    let enhancedName = name;
    if (isMagicMethod) {
      enhancedName = `${name} (magic method)`;
    } else if (isStatic) {
      enhancedName = `${name} (static)`;
    } else if (isAnonymous) {
      enhancedName = `${name} (anonymous)`;
    } else if (visibility && visibility !== 'public') {
      enhancedName = `${name} (${visibility})`;
    }
    
    return {
      name: enhancedName,
      cyclomaticComplexity: complexity.cyclomatic,
      nestingDepth: complexity.nesting,
      parameterCount,
      returnStatements,
      isAsync,
      isMethod,
      isExported: isPublic
    };
  }
  
  private countPhpParameters(paramsString: string): number {
    if (!paramsString || paramsString.trim() === '') return 0;
    
    // Remove type hints and default values for counting
    const cleanParams = paramsString
      .replace(/\s*:\s*[\w\\|?]+/g, '') // Remove type hints
      .replace(/\s*=\s*[^,]+/g, ''); // Remove default values
    
    const params = cleanParams.split(',')
      .map(p => p.trim())
      .filter(p => {
        // Must start with $ for PHP variables
        return p !== '' && p.startsWith('$');
      });
    
    return params.length;
  }
  
  private calculatePhpComplexity(functionBody: string): { cyclomatic: number; nesting: number } {
    const lines = functionBody.split('\n');
    let cyclomaticComplexity = 1; // Base complexity
    let maxNesting = 0;
    let currentNesting = 0;
    let inString = false;
    let stringDelimiter = '';
    
    for (const line of lines) {
      let processedLine = line;
      
      // Handle string literals (basic implementation)
      for (let i = 0; i < processedLine.length; i++) {
        const char = processedLine[i];
        if (!inString && (char === '"' || char === "'")) {
          inString = true;
          stringDelimiter = char;
        } else if (inString && char === stringDelimiter && processedLine[i-1] !== '\\') {
          inString = false;
          stringDelimiter = '';
        }
      }
      
      // Skip if we're in a string
      if (inString) continue;
      
      const trimmed = processedLine.trim();
      if (trimmed === '' || trimmed.startsWith('//') || trimmed.startsWith('#')) continue;
      
      // Count braces for nesting
      const openBraces = (processedLine.match(/\{/g) || []).length;
      const closeBraces = (processedLine.match(/\}/g) || []).length;
      currentNesting += openBraces - closeBraces;
      maxNesting = Math.max(maxNesting, currentNesting);
      
      // Count decision points
      if (/^\s*(if|elseif|while|for|foreach|switch|case|catch|try)\b/.test(processedLine)) {
        cyclomaticComplexity++;
      }
      
      // Count logical operators
      const logicalMatches = trimmed.match(/(\&\&|\|\||and|or)/g);
      if (logicalMatches) {
        cyclomaticComplexity += logicalMatches.length;
      }
      
      // Count ternary operators
      const ternaryMatches = trimmed.match(/\?.*:/g);
      if (ternaryMatches) {
        cyclomaticComplexity += ternaryMatches.length;
      }
      
      // Count null coalescing operators (PHP 7+)
      const nullCoalescingMatches = trimmed.match(/\?\?/g);
      if (nullCoalescingMatches) {
        cyclomaticComplexity += nullCoalescingMatches.length;
      }
      
      // Count exception handling
      if (/^\s*(throw|catch|finally)\b/.test(processedLine)) {
        cyclomaticComplexity++;
      }
      
      // Count array functions and iterators
      const arrayMatches = trimmed.match(/\.(array_map|array_filter|array_reduce|array_walk|usort|uasort|uksort)/g);
      if (arrayMatches) {
        cyclomaticComplexity += arrayMatches.length;
      }
      
      // Count database query complexity (common in PHP)
      const dbMatches = trimmed.match(/\.(query|prepare|execute|fetch|fetchAll)/g);
      if (dbMatches) {
        cyclomaticComplexity += dbMatches.length;
      }
      
      // Count regex complexity
      const regexMatches = trimmed.match(/(preg_match|preg_replace|preg_split|preg_grep)/g);
      if (regexMatches) {
        cyclomaticComplexity += regexMatches.length;
      }
      
      // Count include/require complexity
      if (/(include|require|include_once|require_once)\b/.test(trimmed)) {
        cyclomaticComplexity++;
      }
    }
    
    return {
      cyclomatic: Math.max(1, cyclomaticComplexity),
      nesting: Math.max(0, maxNesting)
    };
  }
  
  private countPhpReturns(functionBody: string): number {
    const lines = functionBody.split('\n');
    let returnCount = 0;
    let inMultiLineComment = false;
    
    for (const line of lines) {
      let processedLine = line;
      
      // Handle multi-line comments
      if (inMultiLineComment) {
        const endComment = processedLine.indexOf('*/');
        if (endComment !== -1) {
          inMultiLineComment = false;
          processedLine = processedLine.substring(endComment + 2);
        } else {
          continue;
        }
      }
      
      // Remove single-line comments
      const singleLineComment = Math.min(
        processedLine.indexOf('//') !== -1 ? processedLine.indexOf('//') : Infinity,
        processedLine.indexOf('#') !== -1 ? processedLine.indexOf('#') : Infinity
      );
      if (singleLineComment !== Infinity) {
        processedLine = processedLine.substring(0, singleLineComment);
      }
      
      // Check for start of multi-line comment
      const startComment = processedLine.indexOf('/*');
      if (startComment !== -1) {
        const endComment = processedLine.indexOf('*/', startComment + 2);
        if (endComment !== -1) {
          processedLine = processedLine.substring(0, startComment) + processedLine.substring(endComment + 2);
        } else {
          inMultiLineComment = true;
          processedLine = processedLine.substring(0, startComment);
        }
      }
      
      // Count return statements
      const returnMatches = processedLine.match(/\breturn\b/g);
      if (returnMatches) {
        returnCount += returnMatches.length;
      }
      
      // Count yield statements (generators)
      const yieldMatches = processedLine.match(/\byield\b/g);
      if (yieldMatches) {
        returnCount += yieldMatches.length;
      }
    }
    
    return returnCount;
  }
}