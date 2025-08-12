import * as vscode from 'vscode';
import { CodeFunction } from '../../models/code';

/**
 * Supported programming languages
 */
export enum ProgrammingLanguage {
  JAVASCRIPT = 'javascript',
  TYPESCRIPT = 'typescript',
  PYTHON = 'python',
  JAVA = 'java',
  CSHARP = 'csharp',
  GO = 'go',
  RUST = 'rust',
  CPP = 'cpp',
  C = 'c',
  PHP = 'php',
  RUBY = 'ruby',
  UNKNOWN = 'unknown'
}

/**
 * Enhanced function metrics that all parsers should provide
 */
export interface EnhancedFunctionMetrics {
  name: string;
  startLine: number;
  endLine: number;
  size: number;
  cyclomaticComplexity: number;
  nestingDepth: number;
  parameterCount: number;
  returnStatements: number;
  isAsync: boolean;
  isMethod: boolean;
  isExported: boolean;
  language: ProgrammingLanguage;
  confidence: number; // 0-1, how confident the parser is about the metrics
}

/**
 * Base interface that all language parsers must implement
 */
export interface ILanguageParser {
  /**
   * Get the supported language for this parser
   */
  getSupportedLanguage(): ProgrammingLanguage;
  
  /**
   * Check if this parser can handle the given document
   */
  canParse(document: vscode.TextDocument): boolean;
  
  /**
   * Extract basic function information (for backward compatibility)
   */
  extractFunctions(document: vscode.TextDocument): CodeFunction[];
  
  /**
   * Extract enhanced function metrics with detailed analysis
   */
  extractEnhancedFunctions(document: vscode.TextDocument): EnhancedFunctionMetrics[];
  
  /**
   * Get parser confidence level for this document (0-1)
   * Higher confidence means the parser is more suited for this content
   */
  getConfidence(document: vscode.TextDocument): number;
}

/**
 * Abstract base class providing common functionality for language parsers
 */
export abstract class BaseLanguageParser implements ILanguageParser {
  abstract getSupportedLanguage(): ProgrammingLanguage;
  abstract canParse(document: vscode.TextDocument): boolean;
  abstract extractEnhancedFunctions(document: vscode.TextDocument): EnhancedFunctionMetrics[];
  
  /**
   * Extract basic functions (converts enhanced metrics to CodeFunction format)
   */
  extractFunctions(document: vscode.TextDocument): CodeFunction[] {
    try {
      const enhancedFunctions = this.extractEnhancedFunctions(document);
      return enhancedFunctions.map(func => ({
        name: func.name,
        size: func.size,
        startLine: func.startLine,
        endLine: func.endLine
      }));
    } catch (error) {
      console.warn(`[${this.getSupportedLanguage()}Parser] Failed to extract functions:`, error);
      return [];
    }
  }
  
  /**
   * Default confidence calculation based on file extension
   */
  getConfidence(document: vscode.TextDocument): number {
    return this.canParse(document) ? 0.8 : 0.0;
  }
  
  /**
   * Utility: Get file extension from document
   */
  protected getFileExtension(document: vscode.TextDocument): string {
    const fileName = document.fileName.toLowerCase();
    const lastDot = fileName.lastIndexOf('.');
    return lastDot !== -1 ? fileName.substring(lastDot) : '';
  }
  
  /**
   * Utility: Get line and character position from offset
   */
  protected getPositionFromOffset(document: vscode.TextDocument, offset: number): vscode.Position {
    return document.positionAt(offset);
  }
  
  /**
   * Utility: Calculate basic complexity heuristics
   */
  protected calculateBasicComplexity(text: string): { cyclomatic: number; nesting: number } {
    const lines = text.split('\n');
    let cyclomaticComplexity = 1; // Base complexity
    let maxNesting = 0;
    let currentNesting = 0;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Count decision points (basic heuristic)
      if (/\b(if|elif|else|while|for|switch|case|catch|except|try)\b/.test(trimmed)) {
        cyclomaticComplexity++;
      }
      
      // Count logical operators
      const logicalMatches = trimmed.match(/(\&\&|\|\||and|or)/g);
      if (logicalMatches) {
        cyclomaticComplexity += logicalMatches.length;
      }
      
      // Track nesting (simplified)
      const openBraces = (trimmed.match(/[\{\(\[]/g) || []).length;
      const closeBraces = (trimmed.match(/[\}\)\]]/g) || []).length;
      currentNesting += openBraces - closeBraces;
      maxNesting = Math.max(maxNesting, currentNesting);
    }
    
    return {
      cyclomatic: Math.max(1, cyclomaticComplexity),
      nesting: Math.max(0, maxNesting)
    };
  }
  
  /**
   * Utility: Count parameters in function signature
   */
  protected countParameters(paramString: string): number {
    if (!paramString || paramString.trim() === '') return 0;
    
    // Simple parameter counting (can be overridden for language-specific logic)
    const params = paramString.split(',').filter(p => p.trim() !== '');
    return params.length;
  }
  
  /**
   * Utility: Count return statements in function body
   */
  protected countReturnStatements(functionBody: string): number {
    const returnMatches = functionBody.match(/\breturn\b/g);
    return returnMatches ? returnMatches.length : 0;
  }
}

/**
 * Language detection utility
 */
export class LanguageDetector {
  private static readonly EXTENSION_MAP: Record<string, ProgrammingLanguage> = {
    '.js': ProgrammingLanguage.JAVASCRIPT,
    '.jsx': ProgrammingLanguage.JAVASCRIPT,
    '.mjs': ProgrammingLanguage.JAVASCRIPT,
    '.cjs': ProgrammingLanguage.JAVASCRIPT,
    '.ts': ProgrammingLanguage.TYPESCRIPT,
    '.tsx': ProgrammingLanguage.TYPESCRIPT,
    '.py': ProgrammingLanguage.PYTHON,
    '.pyw': ProgrammingLanguage.PYTHON,
    '.java': ProgrammingLanguage.JAVA,
    '.cs': ProgrammingLanguage.CSHARP,
    '.go': ProgrammingLanguage.GO,
    '.rs': ProgrammingLanguage.RUST,
    '.cpp': ProgrammingLanguage.CPP,
    '.cxx': ProgrammingLanguage.CPP,
    '.cc': ProgrammingLanguage.CPP,
    '.c': ProgrammingLanguage.C,
    '.h': ProgrammingLanguage.C,
    '.php': ProgrammingLanguage.PHP,
    '.rb': ProgrammingLanguage.RUBY
  };
  
  /**
   * Detect programming language from document
   */
  static detectLanguage(document: vscode.TextDocument): ProgrammingLanguage {
    // First try file extension
    const fileName = document.fileName.toLowerCase();
    const lastDot = fileName.lastIndexOf('.');
    
    if (lastDot !== -1) {
      const extension = fileName.substring(lastDot);
      const detected = this.EXTENSION_MAP[extension];
      if (detected) {
        return detected;
      }
    }
    
    // Fallback: try to detect from VSCode language ID
    const languageId = document.languageId.toLowerCase();
    switch (languageId) {
      case 'javascript':
      case 'javascriptreact':
        return ProgrammingLanguage.JAVASCRIPT;
      case 'typescript':
      case 'typescriptreact':
        return ProgrammingLanguage.TYPESCRIPT;
      case 'python':
        return ProgrammingLanguage.PYTHON;
      case 'java':
        return ProgrammingLanguage.JAVA;
      case 'csharp':
        return ProgrammingLanguage.CSHARP;
      case 'go':
        return ProgrammingLanguage.GO;
      case 'rust':
        return ProgrammingLanguage.RUST;
      case 'cpp':
      case 'c':
        return ProgrammingLanguage.CPP;
      case 'php':
        return ProgrammingLanguage.PHP;
      case 'ruby':
        return ProgrammingLanguage.RUBY;
      default:
        return ProgrammingLanguage.UNKNOWN;
    }
  }
  
  /**
   * Get human-readable language name
   */
  static getLanguageName(language: ProgrammingLanguage): string {
    const names: Record<ProgrammingLanguage, string> = {
      [ProgrammingLanguage.JAVASCRIPT]: 'JavaScript',
      [ProgrammingLanguage.TYPESCRIPT]: 'TypeScript', 
      [ProgrammingLanguage.PYTHON]: 'Python',
      [ProgrammingLanguage.JAVA]: 'Java',
      [ProgrammingLanguage.CSHARP]: 'C#',
      [ProgrammingLanguage.GO]: 'Go',
      [ProgrammingLanguage.RUST]: 'Rust',
      [ProgrammingLanguage.CPP]: 'C++',
      [ProgrammingLanguage.C]: 'C',
      [ProgrammingLanguage.PHP]: 'PHP',
      [ProgrammingLanguage.RUBY]: 'Ruby',
      [ProgrammingLanguage.UNKNOWN]: 'Unknown'
    };
    
    return names[language] || 'Unknown';
  }
}