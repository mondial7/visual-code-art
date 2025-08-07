import * as vscode from 'vscode';
import { CodeFunction } from '../models/code';
import { ComplexityMetrics, AnalyzedFunction, VisualizationParams } from '../models/complexity';

/**
 * Analyzes code complexity and generates visualization parameters
 */
export class ComplexityAnalyzer {
  
  /**
   * Analyze functions and calculate complexity metrics
   */
  public analyzeFunctions(document: vscode.TextDocument, functions: CodeFunction[]): AnalyzedFunction[] {
    const text = document.getText();
    
    return functions.map(func => {
      const complexity = this.calculateComplexity(text, func);
      return {
        ...func,
        complexity
      };
    });
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
  private calculateComplexity(text: string, func: CodeFunction): ComplexityMetrics {
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