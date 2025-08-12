import * as vscode from 'vscode';
import { ILanguageParser, ProgrammingLanguage, LanguageDetector } from './baseParser';
import { TypeScriptParser } from './typeScriptParser';
import { PythonParser } from './pythonParser';
import { JavaParser } from './javaParser';
import { RubyParser } from './rubyParser';
import { PhpParser } from './phpParser';
import { HtmlParser } from './htmlParser';
import { CssParser } from './cssParser';
import { DefaultParser } from './defaultParser';

/**
 * Factory for creating and managing language parsers
 * Automatically selects the best parser for a given document
 */
export class ParserFactory {
  private static parsers: ILanguageParser[] = [
    new TypeScriptParser(),     // JavaScript, TypeScript, JSX, TSX
    new PythonParser(),         // Python
    new JavaParser(),           // Java
    new RubyParser(),           // Ruby, Rails
    new PhpParser(),            // PHP
    new HtmlParser(),           // HTML, Vue, Svelte templates
    new CssParser(),            // CSS, SCSS, Sass, Less
    new DefaultParser()         // Always keep default parser last as fallback
  ];
  
  /**
   * Get the best parser for a document based on language detection and confidence
   */
  static getBestParser(document: vscode.TextDocument): ILanguageParser {
    const detectedLanguage = LanguageDetector.detectLanguage(document);
    
    // Find parsers that can handle this document
    const candidates = this.parsers.filter(parser => parser.canParse(document));
    
    if (candidates.length === 0) {
      // Should never happen since DefaultParser can handle anything
      console.warn('[ParserFactory] No parsers available, using default');
      return new DefaultParser();
    }
    
    // If only one candidate, use it
    if (candidates.length === 1) {
      return candidates[0];
    }
    
    // Multiple candidates: choose by confidence and language match
    let bestParser = candidates[0];
    let bestScore = 0;
    
    for (const parser of candidates) {
      const confidence = parser.getConfidence(document);
      const languageMatch = parser.getSupportedLanguage() === detectedLanguage ? 1.0 : 0.5;
      const score = confidence * languageMatch;
      
      if (score > bestScore) {
        bestScore = score;
        bestParser = parser;
      }
    }
    
    console.log(`[ParserFactory] Selected ${bestParser.getSupportedLanguage()} parser for ${document.fileName} (score: ${bestScore.toFixed(2)})`);
    return bestParser;
  }
  
  /**
   * Get a specific parser by language
   */
  static getParserByLanguage(language: ProgrammingLanguage): ILanguageParser | null {
    return this.parsers.find(parser => parser.getSupportedLanguage() === language) || null;
  }
  
  /**
   * Get all available parsers
   */
  static getAllParsers(): ILanguageParser[] {
    return [...this.parsers];
  }
  
  /**
   * Get supported languages
   */
  static getSupportedLanguages(): ProgrammingLanguage[] {
    return this.parsers
      .map(parser => parser.getSupportedLanguage())
      .filter((lang, index, arr) => arr.indexOf(lang) === index); // Remove duplicates
  }
  
  /**
   * Register a new parser
   */
  static registerParser(parser: ILanguageParser): void {
    // Remove existing parser for the same language
    this.parsers = this.parsers.filter(p => p.getSupportedLanguage() !== parser.getSupportedLanguage());
    
    // Add new parser (before default parser)
    const defaultIndex = this.parsers.findIndex(p => p.getSupportedLanguage() === ProgrammingLanguage.UNKNOWN);
    if (defaultIndex !== -1) {
      this.parsers.splice(defaultIndex, 0, parser);
    } else {
      this.parsers.push(parser);
    }
  }
  
  /**
   * Get parser statistics for diagnostics
   */
  static getParserStats(document: vscode.TextDocument): {
    detectedLanguage: ProgrammingLanguage;
    selectedParser: string;
    availableParsers: string[];
    confidence: number;
  } {
    const detectedLanguage = LanguageDetector.detectLanguage(document);
    const selectedParser = this.getBestParser(document);
    const availableParsers = this.parsers
      .filter(p => p.canParse(document))
      .map(p => p.getSupportedLanguage());
    
    return {
      detectedLanguage,
      selectedParser: selectedParser.getSupportedLanguage(),
      availableParsers,
      confidence: selectedParser.getConfidence(document)
    };
  }
}