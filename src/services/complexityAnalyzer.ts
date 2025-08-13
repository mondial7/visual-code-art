import * as vscode from 'vscode';
import { CodeFunction } from '../models/code';
import { ComplexityMetrics, AnalyzedFunction, VisualizationParams } from '../models/complexity';
import { ParserFactory } from './parsers/parserFactory';
import { EnhancedFunctionMetrics } from './parsers/baseParser';

/**
 * Analyzes code complexity and generates visualization parameters
 * Uses the new multi-language parser architecture
 */
export class ComplexityAnalyzer {
  /**
   * Analyze functions and calculate complexity metrics
   * Uses enhanced analysis from appropriate language parser
   */
  public analyzeFunctions(document: vscode.TextDocument, functions: CodeFunction[]): AnalyzedFunction[] {
    try {
      // Get enhanced metrics using the best parser for this document
      const parser = ParserFactory.getBestParser(document);
      const enhancedFunctions = parser.extractEnhancedFunctions(document);
      
      if (enhancedFunctions.length > 0) {
        console.log(`[ComplexityAnalyzer] Using enhanced analysis from ${parser.getSupportedLanguage()} parser`);
        return this.analyzeEnhancedFunctions(enhancedFunctions);
      }
    } catch (error) {
      console.warn('[ComplexityAnalyzer] Enhanced analysis failed, falling back to basic analysis:', error);
    }
    
    // Fall back to basic analysis if enhanced analysis fails or returns no results
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

  /**
   * Analyze complexity of a document and return distribution statistics
   */
  public analyzeComplexity(document: vscode.TextDocument): {
    totalFunctions: number;
    averageComplexity: number;
    maxComplexity: number;
    distribution: {
      low: number;
      medium: number;
      high: number;
      extreme: number;
    };
  } {
    try {
      const parser = ParserFactory.getBestParser(document);
      const enhancedFunctions = parser.extractEnhancedFunctions(document);
      
      if (enhancedFunctions.length === 0) {
        return {
          totalFunctions: 0,
          averageComplexity: 0,
          maxComplexity: 0,
          distribution: { low: 0, medium: 0, high: 0, extreme: 0 }
        };
      }

      const complexities = enhancedFunctions.map(f => f.cyclomaticComplexity);
      const totalFunctions = enhancedFunctions.length;
      const averageComplexity = complexities.reduce((sum, c) => sum + c, 0) / totalFunctions;
      const maxComplexity = Math.max(...complexities);

      // Count distribution
      const distribution = {
        low: 0,
        medium: 0,
        high: 0,
        extreme: 0
      };

      enhancedFunctions.forEach(func => {
        const level = this.getComplexityLevel(func.cyclomaticComplexity);
        distribution[level]++;
      });

      return {
        totalFunctions,
        averageComplexity,
        maxComplexity,
        distribution
      };
    } catch (error) {
      console.warn('[ComplexityAnalyzer] Failed to analyze complexity:', error);
      return {
        totalFunctions: 0,
        averageComplexity: 0,
        maxComplexity: 0,
        distribution: { low: 0, medium: 0, high: 0, extreme: 0 }
      };
    }
  }

  /**
   * Get complexity level for a given cyclomatic complexity value
   */
  public getComplexityLevel(complexity: number): 'low' | 'medium' | 'high' | 'extreme' {
    if (complexity <= 4) return 'low';
    if (complexity <= 10) return 'medium';
    if (complexity <= 20) return 'high';
    return 'extreme';
  }

  /**
   * Get overall complexity level for a document based on distribution
   */
  public getOverallComplexityLevel(analysis: {
    totalFunctions: number;
    averageComplexity: number;
    maxComplexity: number;
    distribution: {
      low: number;
      medium: number;
      high: number;
      extreme: number;
    };
  }): 'low' | 'medium' | 'high' | 'extreme' {
    if (analysis.totalFunctions === 0) return 'low';

    const { distribution, totalFunctions, averageComplexity } = analysis;
    
    // If more than 20% are extreme complexity
    if (distribution.extreme / totalFunctions > 0.2) return 'extreme';
    
    // If more than 30% are high complexity or above
    if ((distribution.high + distribution.extreme) / totalFunctions > 0.3) return 'high';
    
    // If average complexity is high
    if (averageComplexity > 8) return 'high';
    if (averageComplexity > 5) return 'medium';
    
    // If majority are medium or above
    if ((distribution.medium + distribution.high + distribution.extreme) / totalFunctions > 0.6) return 'medium';
    
    return 'low';
  }
}