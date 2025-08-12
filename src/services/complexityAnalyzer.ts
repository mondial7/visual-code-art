import * as vscode from 'vscode';
import { CodeFunction } from '../models/code';
import { ComplexityMetrics, AnalyzedFunction, VisualizationParams } from '../models/complexity';
import { TypeScriptAstParser, EnhancedFunctionMetrics } from './typeScriptAstParser';

/**
 * Analyzes code complexity and generates visualization parameters
 */
export class ComplexityAnalyzer {
  private tsParser = new TypeScriptAstParser();
  
  /**
   * Analyze functions and calculate complexity metrics
   * Uses enhanced TypeScript AST analysis for JS/TS files
   */
  public analyzeFunctions(document: vscode.TextDocument, functions: CodeFunction[]): AnalyzedFunction[] {
    // Try to get enhanced metrics for JS/TS files
    if (this.isJavaScriptOrTypeScript(document)) {
      try {
        const enhancedFunctions = this.tsParser.extractEnhancedFunctions(document);
        return this.analyzeEnhancedFunctions(enhancedFunctions);
      } catch (error) {
        console.warn('[ComplexityAnalyzer] Enhanced analysis failed, falling back to basic analysis:', error);
      }
    }
    
    // Fall back to basic analysis for other languages or if enhanced analysis fails
    return this.analyzeBasicFunctions(document, functions);
  }

  /**
   * Analyze functions using enhanced TypeScript AST metrics
   */
  private analyzeEnhancedFunctions(enhancedFunctions: EnhancedFunctionMetrics[]): AnalyzedFunction[] {
    return enhancedFunctions.map(func => {
      const complexity = this.calculateEnhancedComplexity(func);
      return {
        name: func.name,
        size: func.size,
        startLine: func.startLine,
        endLine: func.endLine,
        complexity
      };
    });
  }

  /**
   * Analyze functions using basic line-counting approach (fallback)
   */
  private analyzeBasicFunctions(document: vscode.TextDocument, functions: CodeFunction[]): AnalyzedFunction[] {
    const text = document.getText();
    
    return functions.map(func => {
      const complexity = this.calculateBasicComplexity(text, func);
      return {
        ...func,
        complexity
      };
    });
  }

  /**
   * Calculate complexity metrics using enhanced AST analysis
   */
  private calculateEnhancedComplexity(func: EnhancedFunctionMetrics): ComplexityMetrics {
    // Use real cyclomatic complexity from AST analysis
    const cyclomaticComplexity = func.cyclomaticComplexity;
    const nestingDepth = func.nestingDepth;
    const parameterComplexity = Math.min(func.parameterCount / 5, 1); // Normalize to 0-1
    const sizeComplexity = Math.min(func.size / 50, 1); // Normalize to 0-1
    
    // Enhanced complexity calculation using multiple factors
    const overallComplexity = Math.min(
      (cyclomaticComplexity * 0.4 + 
       nestingDepth * 0.3 + 
       parameterComplexity * 0.15 + 
       sizeComplexity * 0.15) / 10, // Normalize
      1
    );
    
    // Determine intensity level based on multiple factors
    let intensityLevel: 'low' | 'medium' | 'high' | 'extreme';
    
    if (cyclomaticComplexity >= 15 || nestingDepth >= 6 || func.size >= 100) {
      intensityLevel = 'extreme';
    } else if (cyclomaticComplexity >= 10 || nestingDepth >= 4 || func.size >= 50) {
      intensityLevel = 'high';
    } else if (cyclomaticComplexity >= 5 || nestingDepth >= 3 || func.size >= 20) {
      intensityLevel = 'medium';
    } else {
      intensityLevel = 'low';
    }

    return {
      lineCount: func.size,
      overallComplexity,
      cyclomaticComplexity,
      nestingDepth,
      intensityLevel
    };
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
   * Convert complexity analysis to visualization parameters
   */
  public generateVisualizationParams(analyzedFunction: AnalyzedFunction): VisualizationParams {
    const complexity = analyzedFunction.complexity.overallComplexity;
    
    // Map complexity to particle count (more complex = more particles)
    const particleCount = Math.floor(5 + complexity * 25); // 5-30 particles
    
    // Map complexity to size (more complex = bigger particles)
    const particleSize = 8 + complexity * 32; // 8-40 pixels
    
    // Map complexity to speed (more complex = faster movement)
    const particleSpeed = 0.5 + complexity * 2.5; // 0.5-3.0 speed
    
    // Map complexity to chaos level (more complex = more erratic)
    const chaosLevel = complexity * 0.8; // 0-0.8 chaos
    
    // Animation intensity scales with complexity
    const animationSpeed = 1 + complexity * 3; // 1-4x speed
    const vibrationIntensity = complexity * 5; // 0-5 vibration
    const morphingRate = complexity * 0.3; // 0-0.3 morph rate
    
    // Visual style - higher complexity = harder edges, more intense colors
    const shapeHardness = Math.min(1, complexity * 1.2); // 0-1
    const colorIntensity = 0.6 + complexity * 0.4; // 0.6-1.0
    const trailLength = Math.floor(complexity * 20); // 0-20 frames
    
    return {
      particleCount,
      particleSize,
      particleSpeed,
      chaosLevel,
      animationSpeed,
      vibrationIntensity,
      morphingRate,
      shapeHardness,
      colorIntensity,
      trailLength
    };
  }

  /**
   * Calculate complexity metrics for a function
   */
  private calculateBasicComplexity(text: string, func: CodeFunction): ComplexityMetrics {
    const functionText = this.extractFunctionText(text, func);
    
    const lineCount = func.size;
    const cyclomaticComplexity = this.calculateCyclomaticComplexity(functionText);
    const nestingDepth = this.calculateNestingDepth(functionText);
    
    // Calculate overall complexity as weighted average
    const normalizedLines = Math.min(lineCount / 100, 1); // Cap at 100 lines
    const normalizedCyclomatic = Math.min(cyclomaticComplexity / 20, 1); // Cap at 20
    const normalizedNesting = Math.min(nestingDepth / 8, 1); // Cap at 8 levels
    
    const overallComplexity = (
      normalizedLines * 0.3 +
      normalizedCyclomatic * 0.5 +
      normalizedNesting * 0.2
    );
    
    // Determine intensity level
    let intensityLevel: 'low' | 'medium' | 'high' | 'extreme';
    if (overallComplexity < 0.3) intensityLevel = 'low';
    else if (overallComplexity < 0.6) intensityLevel = 'medium';
    else if (overallComplexity < 0.8) intensityLevel = 'high';
    else intensityLevel = 'extreme';
    
    return {
      lineCount,
      cyclomaticComplexity,
      nestingDepth,
      overallComplexity,
      intensityLevel
    };
  }

  /**
   * Extract function text from document
   */
  private extractFunctionText(text: string, func: CodeFunction): string {
    const lines = text.split('\n');
    return lines.slice(func.startLine, func.endLine + 1).join('\n');
  }

  /**
   * Calculate cyclomatic complexity by counting decision points
   */
  private calculateCyclomaticComplexity(functionText: string): number {
    let complexity = 1; // Base complexity
    
    // Count decision points
    const decisionKeywords = [
      /\bif\b/g,
      /\belse\s+if\b/g,
      /\bwhile\b/g,
      /\bfor\b/g,
      /\bswitch\b/g,
      /\bcase\b/g,
      /\bcatch\b/g,
      /\btry\b/g,
      /\?\s*.*:\s*/g, // ternary operators
      /\&\&/g,
      /\|\|/g
    ];
    
    decisionKeywords.forEach(regex => {
      const matches = functionText.match(regex);
      if (matches) {
        complexity += matches.length;
      }
    });
    
    return complexity;
  }

  /**
   * Calculate maximum nesting depth
   */
  private calculateNestingDepth(functionText: string): number {
    let maxDepth = 0;
    let currentDepth = 0;
    
    // Simple brace counting for nesting
    for (let i = 0; i < functionText.length; i++) {
      const char = functionText[i];
      if (char === '{') {
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
      } else if (char === '}') {
        currentDepth = Math.max(0, currentDepth - 1);
      }
    }
    
    return maxDepth;
  }
}