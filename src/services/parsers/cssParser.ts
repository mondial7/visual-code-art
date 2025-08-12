import * as vscode from 'vscode';
import { BaseLanguageParser, ProgrammingLanguage, EnhancedFunctionMetrics } from './baseParser';

/**
 * CSS parser for analyzing stylesheet complexity and structure
 * Analyzes CSS rules, selectors, and modern CSS features
 */
export class CssParser extends BaseLanguageParser {
  getSupportedLanguage(): ProgrammingLanguage {
    return ProgrammingLanguage.UNKNOWN; // CSS doesn't have traditional functions
  }
  
  canParse(document: vscode.TextDocument): boolean {
    const extension = this.getFileExtension(document);
    return extension === '.css' || 
           extension === '.scss' || 
           extension === '.sass' ||
           extension === '.less' ||
           document.languageId === 'css' ||
           document.languageId === 'scss' ||
           document.languageId === 'sass' ||
           document.languageId === 'less';
  }
  
  getConfidence(document: vscode.TextDocument): number {
    if (!this.canParse(document)) return 0.0;
    
    const text = document.getText();
    const extension = this.getFileExtension(document);
    
    // Higher confidence for CSS preprocessors
    if (extension === '.scss' || extension === '.sass' || extension === '.less') {
      return 0.95;
    }
    
    // Look for CSS-specific patterns to increase confidence
    const cssPatterns = [
      /\{[^}]*\}/,                                 // CSS rule blocks
      /[^{}]+\s*\{/,                               // Selectors
      /@media\s*\([^)]*\)/,                        // Media queries
      /@import\s+/,                                // Import statements
      /@keyframes\s+\w+/,                          // Keyframe animations
      /:\s*[^;]+;/,                                // Property declarations
      /color\s*:/,                                 // Color properties
      /margin\s*:/,                                // Layout properties
      /padding\s*:/,                               // Padding properties
      /font-\w+\s*:/,                              // Font properties
      /background\s*:/,                            // Background properties
      /border\s*:/,                                // Border properties
      /display\s*:/,                               // Display properties
      /position\s*:/,                              // Position properties
      /transform\s*:/,                             // Transform properties
      /transition\s*:/,                            // Transition properties
      /#[a-fA-F0-9]{3,6}\b/,                       // Hex colors
      /rgba?\([^)]*\)/,                            // RGB/RGBA colors
      /hsla?\([^)]*\)/,                            // HSL/HSLA colors
      /var\(--[\w-]+\)/,                           // CSS custom properties
      /calc\([^)]*\)/,                             // CSS calc function
      /grid-/,                                     // CSS Grid properties
      /flex-/                                      // Flexbox properties
    ];
    
    let matches = 0;
    for (const pattern of cssPatterns) {
      if (pattern.test(text)) matches++;
    }
    
    // Higher confidence with more CSS-specific patterns
    return Math.min(0.9, 0.6 + (matches * 0.03));
  }
  
  extractEnhancedFunctions(document: vscode.TextDocument): EnhancedFunctionMetrics[] {
    const text = document.getText();
    const lines = text.split('\n');
    const cssBlocks: EnhancedFunctionMetrics[] = [];
    
    // Analyze different types of CSS structures as "functions"
    
    // 1. CSS Rules (selectors with declarations)
    const cssRules = this.extractCssRules(text, lines);
    cssBlocks.push(...cssRules);
    
    // 2. Media queries
    const mediaQueries = this.extractMediaQueries(text, lines);
    cssBlocks.push(...mediaQueries);
    
    // 3. Keyframe animations
    const keyframes = this.extractKeyframes(text, lines);
    cssBlocks.push(...keyframes);
    
    // 4. CSS custom properties (CSS variables)
    const customProperties = this.extractCustomProperties(text, lines);
    cssBlocks.push(...customProperties);
    
    // 5. SCSS/Sass specific structures
    if (this.isPreprocessor(document)) {
      const preprocessorBlocks = this.extractPreprocessorBlocks(text, lines);
      cssBlocks.push(...preprocessorBlocks);
    }
    
    // If no specific structures found, analyze the whole stylesheet
    if (cssBlocks.length === 0) {
      const stylesheetMetrics = this.analyzeWholeStylesheet(text, lines);
      cssBlocks.push(stylesheetMetrics);
    }
    
    return cssBlocks.sort((a, b) => a.startLine - b.startLine);
  }
  
  private isPreprocessor(document: vscode.TextDocument): boolean {
    const extension = this.getFileExtension(document);
    return extension === '.scss' || extension === '.sass' || extension === '.less';
  }
  
  private extractCssRules(text: string, lines: string[]): EnhancedFunctionMetrics[] {
    const rules: EnhancedFunctionMetrics[] = [];
    const rulePattern = /([^{}]+)\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g;
    
    let match;
    while ((match = rulePattern.exec(text)) !== null) {
      const selector = match[1].trim();
      const declarations = match[2].trim();
      
      // Skip empty rules or at-rules that should be handled separately
      if (!selector || selector.startsWith('@') || declarations === '') {
        continue;
      }
      
      const startPos = match.index;
      const beforeRule = text.substring(0, startPos);
      const startLine = beforeRule.split('\n').length - 1;
      const endLine = startLine + match[0].split('\n').length - 1;
      
      const complexity = this.analyzeCssRuleComplexity(selector, declarations);
      const selectorName = this.getSelectorDisplayName(selector);
      
      rules.push({
        name: selectorName,
        startLine,
        endLine,
        size: endLine - startLine + 1,
        cyclomaticComplexity: complexity.cyclomatic,
        nestingDepth: complexity.nesting,
        parameterCount: complexity.properties,
        returnStatements: 0,
        isAsync: false,
        isMethod: false,
        isExported: false,
        language: ProgrammingLanguage.UNKNOWN,
        confidence: 0.8
      });
    }
    
    return rules;
  }
  
  private extractMediaQueries(text: string, lines: string[]): EnhancedFunctionMetrics[] {
    const mediaQueries: EnhancedFunctionMetrics[] = [];
    const mediaPattern = /@media\s*([^{]+)\s*\{([\s\S]*?)\}/g;
    
    let match;
    while ((match = mediaPattern.exec(text)) !== null) {
      const condition = match[1].trim();
      const content = match[2].trim();
      
      const startPos = match.index;
      const beforeMedia = text.substring(0, startPos);
      const startLine = beforeMedia.split('\n').length - 1;
      const endLine = startLine + match[0].split('\n').length - 1;
      
      const complexity = this.analyzeMediaQueryComplexity(condition, content);
      
      mediaQueries.push({
        name: `Media Query: ${condition}`,
        startLine,
        endLine,
        size: endLine - startLine + 1,
        cyclomaticComplexity: complexity.cyclomatic,
        nestingDepth: complexity.nesting,
        parameterCount: 0,
        returnStatements: 0,
        isAsync: false,
        isMethod: false,
        isExported: false,
        language: ProgrammingLanguage.UNKNOWN,
        confidence: 0.9
      });
    }
    
    return mediaQueries;
  }
  
  private extractKeyframes(text: string, lines: string[]): EnhancedFunctionMetrics[] {
    const keyframes: EnhancedFunctionMetrics[] = [];
    const keyframePattern = /@keyframes\s+([^{]+)\s*\{([\s\S]*?)\}/g;
    
    let match;
    while ((match = keyframePattern.exec(text)) !== null) {
      const animationName = match[1].trim();
      const content = match[2].trim();
      
      const startPos = match.index;
      const beforeKeyframes = text.substring(0, startPos);
      const startLine = beforeKeyframes.split('\n').length - 1;
      const endLine = startLine + match[0].split('\n').length - 1;
      
      const complexity = this.analyzeKeyframeComplexity(content);
      
      keyframes.push({
        name: `Animation: ${animationName}`,
        startLine,
        endLine,
        size: endLine - startLine + 1,
        cyclomaticComplexity: complexity.cyclomatic,
        nestingDepth: complexity.nesting,
        parameterCount: 0,
        returnStatements: 0,
        isAsync: false,
        isMethod: false,
        isExported: false,
        language: ProgrammingLanguage.UNKNOWN,
        confidence: 0.9
      });
    }
    
    return keyframes;
  }
  
  private extractCustomProperties(text: string, lines: string[]): EnhancedFunctionMetrics[] {
    const customProps: EnhancedFunctionMetrics[] = [];
    
    // Find :root blocks with CSS custom properties
    const rootPattern = /:root\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g;
    
    let match;
    while ((match = rootPattern.exec(text)) !== null) {
      const declarations = match[1].trim();
      const customPropCount = (declarations.match(/--[\w-]+\s*:/g) || []).length;
      
      if (customPropCount > 0) {
        const startPos = match.index;
        const beforeRoot = text.substring(0, startPos);
        const startLine = beforeRoot.split('\n').length - 1;
        const endLine = startLine + match[0].split('\n').length - 1;
        
        customProps.push({
          name: `CSS Variables (${customPropCount} variables)`,
          startLine,
          endLine,
          size: endLine - startLine + 1,
          cyclomaticComplexity: Math.max(1, Math.floor(customPropCount / 3)),
          nestingDepth: 0,
          parameterCount: customPropCount,
          returnStatements: 0,
          isAsync: false,
          isMethod: false,
          isExported: true, // CSS variables are "exported" for use
          language: ProgrammingLanguage.UNKNOWN,
          confidence: 0.9
        });
      }
    }
    
    return customProps;
  }
  
  private extractPreprocessorBlocks(text: string, lines: string[]): EnhancedFunctionMetrics[] {
    const blocks: EnhancedFunctionMetrics[] = [];
    
    // SCSS mixins
    const mixinPattern = /@mixin\s+([^{(]+)(?:\([^)]*\))?\s*\{([\s\S]*?)\}/g;
    let match;
    
    while ((match = mixinPattern.exec(text)) !== null) {
      const mixinName = match[1].trim();
      const content = match[2].trim();
      
      const startPos = match.index;
      const beforeMixin = text.substring(0, startPos);
      const startLine = beforeMixin.split('\n').length - 1;
      const endLine = startLine + match[0].split('\n').length - 1;
      
      const complexity = this.analyzeMixinComplexity(content);
      
      blocks.push({
        name: `Mixin: ${mixinName}`,
        startLine,
        endLine,
        size: endLine - startLine + 1,
        cyclomaticComplexity: complexity.cyclomatic,
        nestingDepth: complexity.nesting,
        parameterCount: 0,
        returnStatements: 0,
        isAsync: false,
        isMethod: true,
        isExported: true,
        language: ProgrammingLanguage.UNKNOWN,
        confidence: 0.95
      });
    }
    
    // SCSS functions
    const functionPattern = /@function\s+([^{(]+)(?:\([^)]*\))?\s*\{([\s\S]*?)\}/g;
    
    while ((match = functionPattern.exec(text)) !== null) {
      const functionName = match[1].trim();
      const content = match[2].trim();
      
      const startPos = match.index;
      const beforeFunction = text.substring(0, startPos);
      const startLine = beforeFunction.split('\n').length - 1;
      const endLine = startLine + match[0].split('\n').length - 1;
      
      const complexity = this.analyzeScssFunctionComplexity(content);
      
      blocks.push({
        name: `SCSS Function: ${functionName}`,
        startLine,
        endLine,
        size: endLine - startLine + 1,
        cyclomaticComplexity: complexity.cyclomatic,
        nestingDepth: complexity.nesting,
        parameterCount: 0,
        returnStatements: complexity.returns,
        isAsync: false,
        isMethod: true,
        isExported: true,
        language: ProgrammingLanguage.UNKNOWN,
        confidence: 0.95
      });
    }
    
    return blocks;
  }
  
  private analyzeWholeStylesheet(text: string, lines: string[]): EnhancedFunctionMetrics {
    const rules = (text.match(/[^{}]+\{[^{}]*\}/g) || []).length;
    const mediaQueries = (text.match(/@media[^{]+\{[\s\S]*?\}/g) || []).length;
    const keyframes = (text.match(/@keyframes[^{]+\{[\s\S]*?\}/g) || []).length;
    const imports = (text.match(/@import[^;]+;/g) || []).length;
    const customProperties = (text.match(/--[\w-]+\s*:/g) || []).length;
    
    const complexity = Math.max(1, 
      rules + 
      mediaQueries * 2 + 
      keyframes * 2 + 
      imports + 
      Math.floor(customProperties / 3)
    );
    
    const nesting = this.calculateCssNesting(text);
    
    return {
      name: 'CSS Stylesheet',
      startLine: 0,
      endLine: lines.length - 1,
      size: lines.length,
      cyclomaticComplexity: complexity,
      nestingDepth: nesting,
      parameterCount: 0,
      returnStatements: 0,
      isAsync: false,
      isMethod: false,
      isExported: false,
      language: ProgrammingLanguage.UNKNOWN,
      confidence: 0.6
    };
  }
  
  private getSelectorDisplayName(selector: string): string {
    // Clean up selector for display
    const cleanSelector = selector.replace(/\s+/g, ' ').trim();
    
    if (cleanSelector.length > 40) {
      return cleanSelector.substring(0, 37) + '...';
    }
    
    return `CSS Rule: ${cleanSelector}`;
  }
  
  private analyzeCssRuleComplexity(selector: string, declarations: string): {
    cyclomatic: number;
    nesting: number;
    properties: number;
  } {
    // Selector complexity
    const selectorParts = selector.split(',').length; // Multiple selectors
    const descendantCombinators = (selector.match(/\s+/g) || []).length;
    const childCombinators = (selector.match(/>/g) || []).length;
    const pseudoClasses = (selector.match(/:[a-zA-Z-]+/g) || []).length;
    const pseudoElements = (selector.match(/::[a-zA-Z-]+/g) || []).length;
    
    // Declaration complexity
    const propertyCount = (declarations.match(/[^:;]+:[^;]+;/g) || []).length;
    const calcFunctions = (declarations.match(/calc\([^)]*\)/g) || []).length;
    const varFunctions = (declarations.match(/var\([^)]*\)/g) || []).length;
    const gradients = (declarations.match(/(linear-gradient|radial-gradient|conic-gradient)\([^)]*\)/g) || []).length;
    const transforms = (declarations.match(/transform\s*:[^;]+/g) || []).length;
    const animations = (declarations.match(/animation\s*:[^;]+/g) || []).length;
    
    const cyclomatic = Math.max(1, 
      selectorParts + 
      descendantCombinators + 
      childCombinators + 
      pseudoClasses + 
      pseudoElements +
      calcFunctions * 2 +
      varFunctions +
      gradients * 2 +
      transforms +
      animations * 2
    );
    
    const nesting = descendantCombinators + childCombinators;
    
    return {
      cyclomatic,
      nesting,
      properties: propertyCount
    };
  }
  
  private analyzeMediaQueryComplexity(condition: string, content: string): {
    cyclomatic: number;
    nesting: number;
  } {
    // Media query condition complexity
    const conditions = condition.split(/\s+and\s+|\s+or\s+/i).length;
    
    // Content complexity
    const rules = (content.match(/[^{}]+\{[^{}]*\}/g) || []).length;
    const nestedStructures = (content.match(/\{[^{}]*\{[^{}]*\}[^{}]*\}/g) || []).length;
    
    const cyclomatic = Math.max(1, conditions * 2 + rules + nestedStructures);
    const nesting = Math.max(1, nestedStructures + 1); // +1 for the media query itself
    
    return { cyclomatic, nesting };
  }
  
  private analyzeKeyframeComplexity(content: string): { cyclomatic: number; nesting: number } {
    const keyframeSteps = (content.match(/(?:from|to|\d+%)\s*\{[^}]*\}/g) || []).length;
    const totalProperties = (content.match(/[^:;]+:[^;]+;/g) || []).length;
    const transforms = (content.match(/transform\s*:[^;]+/g) || []).length;
    
    const cyclomatic = Math.max(1, keyframeSteps + Math.floor(totalProperties / 3) + transforms);
    const nesting = Math.min(keyframeSteps, 5); // Cap nesting estimate
    
    return { cyclomatic, nesting };
  }
  
  private analyzeMixinComplexity(content: string): { cyclomatic: number; nesting: number } {
    const conditionals = (content.match(/@if|@else|@while|@for|@each/g) || []).length;
    const includes = (content.match(/@include/g) || []).length;
    const variables = (content.match(/\$[\w-]+/g) || []).length;
    
    const cyclomatic = Math.max(1, conditionals * 2 + includes + Math.floor(variables / 5));
    const nesting = this.calculateCssNesting(content);
    
    return { cyclomatic, nesting };
  }
  
  private analyzeScssFunctionComplexity(content: string): {
    cyclomatic: number;
    nesting: number;
    returns: number;
  } {
    const conditionals = (content.match(/@if|@else|@while|@for|@each/g) || []).length;
    const returns = (content.match(/@return/g) || []).length;
    const variables = (content.match(/\$[\w-]+/g) || []).length;
    
    const cyclomatic = Math.max(1, conditionals * 2 + Math.floor(variables / 3));
    const nesting = conditionals;
    
    return { cyclomatic, nesting, returns: Math.max(1, returns) };
  }
  
  private calculateCssNesting(css: string): number {
    const lines = css.split('\n');
    let maxNesting = 0;
    let currentNesting = 0;
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed === '') continue;
      
      const openBraces = (line.match(/\{/g) || []).length;
      const closeBraces = (line.match(/\}/g) || []).length;
      
      currentNesting += openBraces - closeBraces;
      maxNesting = Math.max(maxNesting, currentNesting);
    }
    
    return Math.max(0, maxNesting);
  }
}