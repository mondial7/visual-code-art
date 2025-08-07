/**
 * Represents the complexity metrics of a code function
 */
export interface ComplexityMetrics {
  // Basic metrics
  lineCount: number;
  cyclomaticComplexity: number;
  nestingDepth: number;
  
  // Derived metrics
  overallComplexity: number; // Normalized 0-1 complexity score
  intensityLevel: 'low' | 'medium' | 'high' | 'extreme';
}

/**
 * Enhanced function data with complexity analysis
 */
export interface AnalyzedFunction {
  name: string;
  startLine: number;
  endLine: number;
  complexity: ComplexityMetrics;
}

/**
 * Visualization parameters derived from complexity analysis
 */
export interface VisualizationParams {
  // Particle behavior
  particleCount: number;
  particleSize: number;
  particleSpeed: number;
  chaosLevel: number; // How erratic the movement should be
  
  // Animation intensity
  animationSpeed: number;
  vibrationIntensity: number;
  morphingRate: number;
  
  // Visual style
  shapeHardness: number; // 0 = soft/rounded, 1 = sharp/angular
  colorIntensity: number;
  trailLength: number;
}

/**
 * Complete visualization data for a function
 */
export interface VisualizationFunction {
  function: AnalyzedFunction;
  params: VisualizationParams;
  // Position and movement state
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  targetPosition: { x: number; y: number };
}