import * as vscode from 'vscode';
import { BaseLanguageParser, ProgrammingLanguage, EnhancedFunctionMetrics } from './baseParser';

/**
 * Ruby language parser using regex patterns for method and block detection
 * Handles Ruby-specific features like blocks, metaprogramming, and flexible syntax
 */
export class RubyParser extends BaseLanguageParser {
  getSupportedLanguage(): ProgrammingLanguage {
    return ProgrammingLanguage.RUBY;
  }
  
  canParse(document: vscode.TextDocument): boolean {
    const extension = this.getFileExtension(document);
    return extension === '.rb' || 
           extension === '.rake' || 
           extension === '.gemspec' ||
           document.languageId === 'ruby';
  }
  
  getConfidence(document: vscode.TextDocument): number {
    if (!this.canParse(document)) return 0.0;
    
    const text = document.getText();
    
    // Look for Ruby-specific patterns to increase confidence
    const rubyPatterns = [
      /^require\s+['"][^'"]+['"]/m,               // Require statements
      /^require_relative\s+['"][^'"]+['"]/m,     // Require relative
      /^class\s+\w+/m,                           // Class definitions
      /^module\s+\w+/m,                          // Module definitions
      /def\s+\w+/,                               // Method definitions
      /\.each\s*\{/,                             // Block iterators
      /end\s*$/m,                                // End statements
      /@\w+/,                                    // Instance variables
      /@@\w+/,                                   // Class variables
      /\$\w+/,                                   // Global variables
      /=>\s*\w+/,                                // Hash rocket syntax
      /\w+:\s*\w+/,                              // Symbol hash syntax
      /puts\s+/,                                 // puts statements
      /attr_reader|attr_writer|attr_accessor/,   // Attribute accessors
      /include\s+\w+/,                           // Module inclusion
      /extend\s+\w+/                             // Module extension
    ];
    
    let matches = 0;
    for (const pattern of rubyPatterns) {
      if (pattern.test(text)) matches++;
    }
    
    // Higher confidence with more Ruby-specific patterns
    return Math.min(0.95, 0.7 + (matches * 0.05));
  }
  
  extractEnhancedFunctions(document: vscode.TextDocument): EnhancedFunctionMetrics[] {
    const text = document.getText();
    const lines = text.split('\n');
    const functions: EnhancedFunctionMetrics[] = [];
    
    // Ruby method patterns
    const patterns = [
      // Method definition: def method_name(params)
      /^(\s*)def\s+([a-zA-Z_][a-zA-Z0-9_?!]*)\s*(?:\(([^)]*)\))?\s*$/,
      
      // Class method: def self.method_name(params)
      /^(\s*)def\s+self\.([a-zA-Z_][a-zA-Z0-9_?!]*)\s*(?:\(([^)]*)\))?\s*$/,
      
      // Class method alternative: def ClassName.method_name(params)
      /^(\s*)def\s+([A-Z][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_?!]*)\s*(?:\(([^)]*)\))?\s*$/,
      
      // Private/protected/public methods
      /^(\s*)(?:private|protected|public)\s+def\s+([a-zA-Z_][a-zA-Z0-9_?!]*)\s*(?:\(([^)]*)\))?\s*$/
    ];
    
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      
      for (const pattern of patterns) {
        const match = pattern.exec(line);
        if (match) {
          const [fullMatch, indentation, methodName, paramsString = ''] = match;
          
          // Skip if it's a Ruby keyword
          if (this.isRubyKeyword(methodName)) {
            continue;
          }
          
          // Find the end of the method
          const methodInfo = this.findRubyMethodEnd(lines, lineIndex, indentation.length);
          
          if (methodInfo.endLine > lineIndex) {
            const methodBody = lines.slice(lineIndex, methodInfo.endLine + 1).join('\n');
            const metrics = this.analyzeRubyMethod(methodName, methodBody, paramsString);
            
            functions.push({
              ...metrics,
              startLine: lineIndex,
              endLine: methodInfo.endLine,
              size: methodInfo.endLine - lineIndex + 1,
              language: ProgrammingLanguage.RUBY,
              confidence: 0.9
            });
          }
        }
      }
    }
    
    return functions.sort((a, b) => a.startLine - b.startLine);
  }
  
  private isRubyKeyword(name: string): boolean {
    const keywords = [
      'alias', 'and', 'begin', 'break', 'case', 'class', 'def', 'defined', 'do', 'else',
      'elsif', 'end', 'ensure', 'false', 'for', 'if', 'in', 'module', 'next', 'nil',
      'not', 'or', 'redo', 'rescue', 'retry', 'return', 'self', 'super', 'then', 'true',
      'undef', 'unless', 'until', 'when', 'while', 'yield', '__FILE__', '__LINE__'
    ];
    
    // Remove class/self prefix for keyword checking
    const cleanName = name.replace(/^.*\./, '').replace(/^self\./, '');
    return keywords.includes(cleanName.toLowerCase());
  }
  
  private findRubyMethodEnd(lines: string[], startLine: number, baseIndentation: number): { endLine: number } {
    let endLine = startLine;
    let indentationStack: number[] = [baseIndentation];
    
    // Ruby uses 'end' keyword for block termination
    for (let i = startLine + 1; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      // Skip empty lines and comments
      if (trimmed === '' || trimmed.startsWith('#')) {
        continue;
      }
      
      const currentIndentation = line.length - line.trimStart().length;
      
      // Check for block-starting keywords that need 'end'
      if (/^\s*(if|unless|while|until|for|begin|case|class|module|def)\b/.test(line)) {
        indentationStack.push(currentIndentation);
      }
      
      // Check for 'end' keyword
      if (/^\s*end\s*$/.test(line)) {
        indentationStack.pop();
        
        // If we've closed all blocks, we've found the method end
        if (indentationStack.length === 0) {
          return { endLine: i };
        }
      }
      
      // Alternative: if indentation returns to base level or less (for methods without explicit end)
      if (currentIndentation <= baseIndentation && trimmed !== '' && i > startLine + 1) {
        // Check if this line starts a new method or class
        if (/^\s*(def|class|module)\b/.test(line)) {
          return { endLine: i - 1 };
        }
      }
      
      endLine = i;
      
      // Safety limit
      if (i - startLine > 300) break;
    }
    
    return { endLine };
  }
  
  private analyzeRubyMethod(
    name: string, 
    methodBody: string, 
    paramsString: string
  ): Omit<EnhancedFunctionMetrics, 'startLine' | 'endLine' | 'size' | 'language' | 'confidence'> {
    // Analyze parameters
    const parameterCount = this.countRubyParameters(paramsString);
    
    // Calculate complexity
    const complexity = this.calculateRubyComplexity(methodBody);
    
    // Count return statements (Ruby methods return last expression, explicit returns are less common)
    const returnStatements = this.countRubyReturns(methodBody);
    
    // Determine method characteristics
    const isAsync = false; // Ruby doesn't have async/await like JS
    const isClassMethod = name.includes('.') || name.startsWith('self.');
    const isMethod = true;
    const isExported = !name.startsWith('_'); // Ruby convention: _ prefix for private
    
    // Enhanced naming for special methods
    let enhancedName = name;
    if (isClassMethod) {
      enhancedName = `${name} (class method)`;
    } else if (name.endsWith('?')) {
      enhancedName = `${name} (predicate)`;
    } else if (name.endsWith('!')) {
      enhancedName = `${name} (mutating)`;
    }
    
    return {
      name: enhancedName,
      cyclomaticComplexity: complexity.cyclomatic,
      nestingDepth: complexity.nesting,
      parameterCount,
      returnStatements,
      isAsync,
      isMethod,
      isExported
    };
  }
  
  private countRubyParameters(paramsString: string): number {
    if (!paramsString || paramsString.trim() === '') return 0;
    
    // Ruby parameter types: regular, default, splat (*), double splat (**), block (&)
    const params = paramsString.split(',')
      .map(p => p.trim())
      .filter(p => {
        if (p === '') return false;
        // Count all parameter types except empty strings
        return true;
      });
    
    return params.length;
  }
  
  private calculateRubyComplexity(methodBody: string): { cyclomatic: number; nesting: number } {
    const lines = methodBody.split('\n');
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
      
      // Track nesting based on Ruby block structure
      if (/^\s*(if|unless|while|until|for|begin|case|class|module|def)\b/.test(line)) {
        currentNesting++;
        maxNesting = Math.max(maxNesting, currentNesting);
      }
      
      if (/^\s*end\s*$/.test(line)) {
        currentNesting = Math.max(0, currentNesting - 1);
      }
      
      // Count decision points
      if (/^\s*(if|unless|elsif|while|until|for|case|when|rescue)\b/.test(line)) {
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
      
      // Count block iterators (Ruby-specific complexity)
      const blockMatches = trimmed.match(/\.(each|map|select|reject|find|collect|detect|times|upto|downto)\s*[\{|do]/g);
      if (blockMatches) {
        cyclomaticComplexity += blockMatches.length;
      }
      
      // Count regex matches (common in Ruby)
      const regexMatches = trimmed.match(/=~|match\(/g);
      if (regexMatches) {
        cyclomaticComplexity += regexMatches.length;
      }
      
      // Count exception handling
      if (/^\s*(raise|rescue|ensure)\b/.test(line)) {
        cyclomaticComplexity++;
      }
      
      // Count metaprogramming complexity
      const metaMatches = trimmed.match(/\.(define_method|send|eval|instance_eval|class_eval|const_get|const_set)/g);
      if (metaMatches) {
        cyclomaticComplexity += metaMatches.length * 2; // Metaprogramming is more complex
      }
      
      // Count Ruby-specific constructs
      if (/\b(yield|super|retry|redo|next|break)\b/.test(trimmed)) {
        cyclomaticComplexity++;
      }
    }
    
    return {
      cyclomatic: Math.max(1, cyclomaticComplexity),
      nesting: maxNesting
    };
  }
  
  private countRubyReturns(methodBody: string): number {
    // Ruby methods implicitly return the last expression, but also count explicit returns
    const lines = methodBody.split('\n');
    let returnCount = 0;
    let inComment = false;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip comments
      if (trimmed.startsWith('#')) continue;
      
      // Count explicit return statements
      if (/^\s*return\b/.test(line)) {
        returnCount++;
      }
      
      // Ruby methods also have implicit returns, but we'll count explicit ones
      // and major exit points like next, break in blocks
      if (/^\s*(next|break)\b/.test(line)) {
        returnCount++;
      }
    }
    
    // If no explicit returns found, assume implicit return (last expression)
    return Math.max(1, returnCount);
  }
}