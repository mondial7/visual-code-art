import * as vscode from 'vscode';
import { BaseLanguageParser, ProgrammingLanguage, EnhancedFunctionMetrics } from './baseParser';

/**
 * Default fallback parser for unknown or unsupported languages
 * Provides reasonable complexity estimates based on file characteristics
 */
export class DefaultParser extends BaseLanguageParser {
  getSupportedLanguage(): ProgrammingLanguage {
    return ProgrammingLanguage.UNKNOWN;
  }
  
  canParse(document: vscode.TextDocument): boolean {
    // Default parser can handle any document as a fallback
    return true;
  }
  
  getConfidence(document: vscode.TextDocument): number {
    // Always lowest confidence since this is a fallback
    return 0.1;
  }
  
  extractEnhancedFunctions(document: vscode.TextDocument): EnhancedFunctionMetrics[] {
    const text = document.getText();
    const lines = text.split('\n');
    
    // Generate estimate based on file characteristics
    const fileMetrics = this.analyzeFileCharacteristics(text, lines);
    
    // Create a single "function" representing the entire file
    const fileFunction: EnhancedFunctionMetrics = {
      name: `${this.getFileBaseName(document)} (entire file)`,
      startLine: 0,
      endLine: lines.length - 1,
      size: lines.length,
      cyclomaticComplexity: fileMetrics.estimatedComplexity,
      nestingDepth: fileMetrics.estimatedNesting,
      parameterCount: 0,
      returnStatements: 0,
      isAsync: false,
      isMethod: false,
      isExported: false,
      language: ProgrammingLanguage.UNKNOWN,
      confidence: 0.3 // Low confidence for estimates
    };
    
    // Try to find function-like patterns for better analysis
    const detectedFunctions = this.detectGenericFunctions(document, lines);
    
    if (detectedFunctions.length > 0) {
      return detectedFunctions;
    }
    
    // Fallback to file-level analysis
    return [fileFunction];
  }
  
  private analyzeFileCharacteristics(text: string, lines: string[]): {
    estimatedComplexity: number;
    estimatedNesting: number;
    estimatedFunctionCount: number;
  } {
    const totalLines = lines.length;
    const nonEmptyLines = lines.filter(line => line.trim() !== '').length;
    const totalChars = text.length;
    
    // Estimate complexity based on file size and characteristics
    let estimatedComplexity = 1;
    
    // Size-based complexity (larger files tend to be more complex)
    if (totalLines > 500) estimatedComplexity += 8;
    else if (totalLines > 200) estimatedComplexity += 5;
    else if (totalLines > 100) estimatedComplexity += 3;
    else if (totalLines > 50) estimatedComplexity += 2;
    
    // Character density (more dense = potentially more complex)
    const avgCharsPerLine = nonEmptyLines > 0 ? totalChars / nonEmptyLines : 0;
    if (avgCharsPerLine > 80) estimatedComplexity += 2;
    else if (avgCharsPerLine > 50) estimatedComplexity += 1;
    
    // Look for complexity indicators in any language
    const complexityPatterns = [
      /\b(if|else|while|for|switch|case|try|catch|when|match)\b/gi,
      /[{}()[\]]/g,  // Brackets and braces
      /[&|]{2}|and|or/gi,  // Logical operators
      /[<>=!]+/g,  // Comparison operators
    ];
    
    for (const pattern of complexityPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        estimatedComplexity += Math.min(matches.length / 10, 5); // Cap the contribution
      }
    }
    
    // Estimate nesting based on indentation patterns
    let maxIndentation = 0;
    let totalIndentation = 0;
    let indentedLines = 0;
    
    for (const line of lines) {
      if (line.trim() !== '') {
        const indentation = line.length - line.trimStart().length;
        if (indentation > 0) {
          totalIndentation += indentation;
          indentedLines++;
          maxIndentation = Math.max(maxIndentation, indentation);
        }
      }
    }
    
    // Estimate nesting depth (assuming 2-4 spaces per level)
    const estimatedNesting = Math.floor(maxIndentation / 3);
    
    // Estimate function count based on patterns
    const functionPatterns = [
      /\b(function|def|func|fn|method|procedure|sub)\s+\w+/gi,
      /\w+\s*[=:]\s*function/gi,
      /\w+\s*\(/g  // Very broad pattern for function calls
    ];
    
    let estimatedFunctionCount = 0;
    for (const pattern of functionPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        estimatedFunctionCount += matches.length;
      }
    }
    
    return {
      estimatedComplexity: Math.max(1, Math.floor(estimatedComplexity)),
      estimatedNesting: Math.max(0, estimatedNesting),
      estimatedFunctionCount: Math.max(1, Math.floor(estimatedFunctionCount / 3)) // Conservative estimate
    };
  }
  
  private detectGenericFunctions(document: vscode.TextDocument, lines: string[]): EnhancedFunctionMetrics[] {
    const functions: EnhancedFunctionMetrics[] = [];
    
    // Generic function patterns that might work across languages
    const patterns = [
      // function name() / func name() / def name()
      /^(\s*)(function|func|def|fn|method|procedure|sub)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/,
      
      // name = function / name = () =>
      /^(\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*[=:]\s*(function|\([^)]*\)\s*=>)/,
      
      // Method-like patterns: public/private name()
      /^(\s*)(public|private|protected|static)?\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/,
    ];
    
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      
      for (const pattern of patterns) {
        const match = pattern.exec(line);
        if (match) {
          const indentation = match[1] ? match[1].length : 0;
          const functionName = match[3] || match[2];
          
          if (functionName && !this.isLikelyKeyword(functionName)) {
            // Find end of function (simple heuristic)
            const endInfo = this.findGenericFunctionEnd(lines, lineIndex, indentation);
            
            if (endInfo.endLine > lineIndex) {
              const functionBody = lines.slice(lineIndex, endInfo.endLine + 1).join('\n');
              const complexity = this.calculateBasicComplexity(functionBody);
              
              functions.push({
                name: functionName,
                startLine: lineIndex,
                endLine: endInfo.endLine,
                size: endInfo.endLine - lineIndex + 1,
                cyclomaticComplexity: complexity.cyclomatic,
                nestingDepth: complexity.nesting,
                parameterCount: this.estimateParameterCount(line),
                returnStatements: this.countReturnStatements(functionBody),
                isAsync: /\basync\b/i.test(line),
                isMethod: /\b(class|this|self)\b/i.test(functionBody),
                isExported: /\b(export|public)\b/i.test(line),
                language: ProgrammingLanguage.UNKNOWN,
                confidence: 0.5 // Medium confidence for detected patterns
              });
            }
          }
        }
      }
    }
    
    return functions.sort((a, b) => a.startLine - b.startLine);
  }
  
  private findGenericFunctionEnd(lines: string[], startLine: number, baseIndentation: number): { endLine: number } {
    let endLine = startLine;
    let openBraces = 0;
    let inFunction = false;
    
    for (let i = startLine; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      if (trimmed === '') continue;
      
      // Count braces for brace-based languages
      const openCount = (line.match(/[{(\[]/g) || []).length;
      const closeCount = (line.match(/[})\]]/g) || []).length;
      
      if (i === startLine) {
        openBraces = openCount - closeCount;
        inFunction = openBraces > 0;
      } else {
        openBraces += openCount - closeCount;
      }
      
      // For indentation-based languages
      const currentIndentation = line.length - line.trimStart().length;
      
      if (inFunction) {
        // End when braces are balanced
        if (openBraces <= 0) {
          endLine = i;
          break;
        }
      } else {
        // For indentation-based, end when we return to base level
        if (currentIndentation <= baseIndentation && trimmed !== '' && i > startLine) {
          endLine = i - 1;
          break;
        }
      }
      
      endLine = i;
      
      // Reasonable limit for function size
      if (i - startLine > 200) break;
    }
    
    return { endLine };
  }
  
  private isLikelyKeyword(name: string): boolean {
    const commonKeywords = [
      'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'try', 'catch', 'finally',
      'return', 'break', 'continue', 'throw', 'new', 'this', 'super', 'class', 'extends',
      'import', 'export', 'from', 'var', 'let', 'const', 'true', 'false', 'null', 'undefined'
    ];
    return commonKeywords.includes(name.toLowerCase());
  }
  
  private estimateParameterCount(functionLine: string): number {
    const parenMatch = functionLine.match(/\(([^)]*)\)/);
    if (!parenMatch) return 0;
    
    const paramString = parenMatch[1];
    if (!paramString || paramString.trim() === '') return 0;
    
    // Simple comma counting with some filtering
    const params = paramString.split(',').filter(p => {
      const trimmed = p.trim();
      return trimmed !== '' && !trimmed.startsWith('//') && !trimmed.startsWith('/*');
    });
    
    return params.length;
  }
  
  private getFileBaseName(document: vscode.TextDocument): string {
    const fileName = document.fileName;
    const lastSlash = Math.max(fileName.lastIndexOf('/'), fileName.lastIndexOf('\\'));
    const baseName = lastSlash !== -1 ? fileName.substring(lastSlash + 1) : fileName;
    const lastDot = baseName.lastIndexOf('.');
    return lastDot !== -1 ? baseName.substring(0, lastDot) : baseName;
  }
}