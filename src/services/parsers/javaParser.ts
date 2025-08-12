import * as vscode from 'vscode';
import { BaseLanguageParser, ProgrammingLanguage, EnhancedFunctionMetrics } from './baseParser';

/**
 * Java language parser using regex patterns for method and constructor detection
 * Handles Java-specific features like access modifiers, static methods, and generics
 */
export class JavaParser extends BaseLanguageParser {
  getSupportedLanguage(): ProgrammingLanguage {
    return ProgrammingLanguage.JAVA;
  }
  
  canParse(document: vscode.TextDocument): boolean {
    const extension = this.getFileExtension(document);
    return extension === '.java' || document.languageId === 'java';
  }
  
  getConfidence(document: vscode.TextDocument): number {
    if (!this.canParse(document)) return 0.0;
    
    const text = document.getText();
    
    // Look for Java-specific patterns to increase confidence
    const javaPatterns = [
      /^package\s+[\w.]+\s*;/m,                    // Package declarations
      /^import\s+[\w.*]+\s*;/m,                    // Import statements
      /public\s+class\s+\w+/,                      // Class declarations
      /public\s+interface\s+\w+/,                  // Interface declarations
      /@\w+/,                                      // Annotations
      /public\s+static\s+void\s+main/,             // Main method
      /System\.out\.print/,                        // System.out usage
      /new\s+\w+\s*\(/,                           // Object instantiation
      /extends\s+\w+/,                            // Class inheritance
      /implements\s+\w+/,                         // Interface implementation
      /throws\s+\w+/                              // Exception throwing
    ];
    
    let matches = 0;
    for (const pattern of javaPatterns) {
      if (pattern.test(text)) matches++;
    }
    
    // Higher confidence with more Java-specific patterns
    return Math.min(0.95, 0.7 + (matches * 0.05));
  }
  
  extractEnhancedFunctions(document: vscode.TextDocument): EnhancedFunctionMetrics[] {
    const text = document.getText();
    const lines = text.split('\n');
    const functions: EnhancedFunctionMetrics[] = [];
    
    // Java method patterns
    const patterns = [
      // Method declaration: [modifiers] [static] returnType methodName(params) [throws Exception]
      /^(\s*)((?:public|private|protected|static|final|abstract|synchronized|native)[\s]+)*(\w+(?:<[^>]*>)?(?:\[\])*)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(([^)]*)\)\s*(?:throws\s+[\w\s,.<>]+)?\s*\{/,
      
      // Constructor: [modifiers] ClassName(params) [throws Exception]
      /^(\s*)((?:public|private|protected)[\s]+)*([A-Z][a-zA-Z0-9_$]*)\s*\(([^)]*)\)\s*(?:throws\s+[\w\s,.<>]+)?\s*\{/,
      
      // Generic method: [modifiers] <T> returnType methodName(params)
      /^(\s*)((?:public|private|protected|static|final|abstract)[\s]+)*<[^>]+>\s*(\w+(?:<[^>]*>)?(?:\[\])*)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(([^)]*)\)\s*(?:throws\s+[\w\s,.<>]+)?\s*\{/
    ];
    
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      
      for (const pattern of patterns) {
        const match = pattern.exec(line);
        if (match) {
          const [fullMatch, indentation, modifiers = '', returnTypeOrName, methodName, paramsString] = match;
          
          // Determine if this is a constructor or method
          const isConstructor = this.isConstructorPattern(match);
          const actualMethodName = isConstructor ? returnTypeOrName : methodName;
          const actualParams = isConstructor ? methodName : paramsString;
          
          // Skip if it's a Java keyword
          if (this.isJavaKeyword(actualMethodName)) {
            continue;
          }
          
          // Find the end of the method
          const methodInfo = this.findJavaMethodEnd(lines, lineIndex, indentation.length);
          
          if (methodInfo.endLine > lineIndex) {
            const methodBody = lines.slice(lineIndex, methodInfo.endLine + 1).join('\n');
            const metrics = this.analyzeJavaMethod(
              actualMethodName, 
              methodBody, 
              actualParams, 
              modifiers,
              isConstructor
            );
            
            functions.push({
              ...metrics,
              startLine: lineIndex,
              endLine: methodInfo.endLine,
              size: methodInfo.endLine - lineIndex + 1,
              language: ProgrammingLanguage.JAVA,
              confidence: 0.9
            });
          }
        }
      }
    }
    
    return functions.sort((a, b) => a.startLine - b.startLine);
  }
  
  private isConstructorPattern(match: RegExpExecArray): boolean {
    // In the regex patterns, constructors have className in position 3 and params in position 4
    // Methods have returnType in position 3, methodName in position 4, and params in position 5
    const thirdCapture = match[3];
    const fourthCapture = match[4];
    
    // Constructor pattern: starts with capital letter and fourth capture exists
    return /^[A-Z]/.test(thirdCapture) && fourthCapture !== undefined && match[5] === undefined;
  }
  
  private isJavaKeyword(name: string): boolean {
    const keywords = [
      'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class',
      'const', 'continue', 'default', 'do', 'double', 'else', 'enum', 'extends', 'final',
      'finally', 'float', 'for', 'goto', 'if', 'implements', 'import', 'instanceof', 'int',
      'interface', 'long', 'native', 'new', 'package', 'private', 'protected', 'public',
      'return', 'short', 'static', 'strictfp', 'super', 'switch', 'synchronized', 'this',
      'throw', 'throws', 'transient', 'try', 'void', 'volatile', 'while'
    ];
    return keywords.includes(name.toLowerCase());
  }
  
  private findJavaMethodEnd(lines: string[], startLine: number, baseIndentation: number): { endLine: number } {
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
          
          // Method ends when braces are balanced
          if (foundOpenBrace && braceCount === 0) {
            return { endLine: i };
          }
        }
      }
      
      endLine = i;
      
      // Safety limit for very long methods
      if (i - startLine > 500) break;
    }
    
    return { endLine };
  }
  
  private analyzeJavaMethod(
    name: string, 
    methodBody: string, 
    paramsString: string, 
    modifiers: string,
    isConstructor: boolean
  ): Omit<EnhancedFunctionMetrics, 'startLine' | 'endLine' | 'size' | 'language' | 'confidence'> {
    // Analyze parameters
    const parameterCount = this.countJavaParameters(paramsString);
    
    // Calculate complexity
    const complexity = this.calculateJavaComplexity(methodBody);
    
    // Count return statements (constructors don't have returns)
    const returnStatements = isConstructor ? 0 : this.countJavaReturns(methodBody);
    
    // Determine method characteristics
    const isAsync = false; // Java doesn't have async/await like JS/C#
    const isMethod = !isConstructor;
    const isStatic = /\bstatic\b/.test(modifiers);
    const isPublic = /\bpublic\b/.test(modifiers);
    const isAbstract = /\babstract\b/.test(modifiers);
    
    // Enhanced naming for constructors and special methods
    let enhancedName = name;
    if (isConstructor) {
      enhancedName = `${name} (constructor)`;
    } else if (isStatic) {
      enhancedName = `${name} (static)`;
    } else if (isAbstract) {
      enhancedName = `${name} (abstract)`;
    }
    
    return {
      name: enhancedName,
      cyclomaticComplexity: complexity.cyclomatic,
      nestingDepth: complexity.nesting,
      parameterCount,
      returnStatements,
      isAsync,
      isMethod,
      isExported: isPublic // In Java, public methods are "exported"
    };
  }
  
  private countJavaParameters(paramsString: string): number {
    if (!paramsString || paramsString.trim() === '') return 0;
    
    // Remove generics and array brackets for cleaner parsing
    const cleanParams = paramsString
      .replace(/<[^>]*>/g, '') // Remove generic type parameters
      .replace(/\[\]/g, ''); // Remove array brackets
    
    // Split by comma and count actual parameters
    const params = cleanParams.split(',')
      .map(p => p.trim())
      .filter(p => {
        // Filter out empty strings and final modifiers
        if (p === '' || p === 'final') return false;
        // Must contain a type and parameter name
        const parts = p.trim().split(/\s+/);
        return parts.length >= 2;
      });
    
    return params.length;
  }
  
  private calculateJavaComplexity(methodBody: string): { cyclomatic: number; nesting: number } {
    const lines = methodBody.split('\n');
    let cyclomaticComplexity = 1; // Base complexity
    let maxNesting = 0;
    let currentNesting = 0;
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed === '' || trimmed.startsWith('//') || trimmed.startsWith('/*')) continue;
      
      // Count braces for nesting
      const openBraces = (line.match(/\{/g) || []).length;
      const closeBraces = (line.match(/\}/g) || []).length;
      currentNesting += openBraces - closeBraces;
      maxNesting = Math.max(maxNesting, currentNesting);
      
      // Count decision points
      if (/^\s*(if|while|for|do|switch|catch)\b/.test(line)) {
        cyclomaticComplexity++;
      }
      
      // Count case statements
      if (/^\s*case\b/.test(line)) {
        cyclomaticComplexity++;
      }
      
      // Count logical operators
      const logicalMatches = trimmed.match(/(\&\&|\|\|)/g);
      if (logicalMatches) {
        cyclomaticComplexity += logicalMatches.length;
      }
      
      // Count ternary operators
      const ternaryMatches = trimmed.match(/\?.*:/g);
      if (ternaryMatches) {
        cyclomaticComplexity += ternaryMatches.length;
      }
      
      // Count lambda expressions
      const lambdaMatches = trimmed.match(/->/g);
      if (lambdaMatches) {
        cyclomaticComplexity += lambdaMatches.length;
      }
      
      // Count exception handling complexity
      if (/^\s*(throw|throws)\b/.test(line)) {
        cyclomaticComplexity++;
      }
      
      // Count stream operations (method chaining complexity)
      const streamMatches = trimmed.match(/\.(filter|map|reduce|collect|forEach|anyMatch|allMatch)\s*\(/g);
      if (streamMatches) {
        cyclomaticComplexity += streamMatches.length;
      }
    }
    
    return {
      cyclomatic: Math.max(1, cyclomaticComplexity),
      nesting: Math.max(0, maxNesting)
    };
  }
  
  private countJavaReturns(methodBody: string): number {
    // Count return statements, excluding those in comments or strings
    const lines = methodBody.split('\n');
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
          continue; // Skip entire line if in comment
        }
      }
      
      // Remove single-line comments
      const singleLineComment = processedLine.indexOf('//');
      if (singleLineComment !== -1) {
        processedLine = processedLine.substring(0, singleLineComment);
      }
      
      // Check for start of multi-line comment
      const startComment = processedLine.indexOf('/*');
      if (startComment !== -1) {
        const endComment = processedLine.indexOf('*/', startComment + 2);
        if (endComment !== -1) {
          // Complete comment on same line
          processedLine = processedLine.substring(0, startComment) + processedLine.substring(endComment + 2);
        } else {
          // Multi-line comment starts
          inMultiLineComment = true;
          processedLine = processedLine.substring(0, startComment);
        }
      }
      
      // Count return statements in the processed line
      const returnMatches = processedLine.match(/\breturn\b/g);
      if (returnMatches) {
        returnCount += returnMatches.length;
      }
    }
    
    return returnCount;
  }
}