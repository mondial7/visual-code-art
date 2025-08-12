import * as vscode from 'vscode';
import { BaseLanguageParser, ProgrammingLanguage, EnhancedFunctionMetrics } from './baseParser';

/**
 * HTML parser for analyzing template structure and complexity
 * Analyzes HTML documents, templates, and embedded scripts
 */
export class HtmlParser extends BaseLanguageParser {
  getSupportedLanguage(): ProgrammingLanguage {
    return ProgrammingLanguage.UNKNOWN; // HTML doesn't have traditional functions
  }
  
  canParse(document: vscode.TextDocument): boolean {
    const extension = this.getFileExtension(document);
    return extension === '.html' || 
           extension === '.htm' || 
           extension === '.xhtml' ||
           extension === '.vue' ||
           extension === '.svelte' ||
           document.languageId === 'html';
  }
  
  getConfidence(document: vscode.TextDocument): number {
    if (!this.canParse(document)) return 0.0;
    
    const text = document.getText();
    
    // Look for HTML-specific patterns to increase confidence
    const htmlPatterns = [
      /<!DOCTYPE\s+html/i,                         // HTML5 doctype
      /<html[^>]*>/i,                              // HTML tag
      /<head[^>]*>/i,                              // Head section
      /<body[^>]*>/i,                              // Body section
      /<meta[^>]*>/i,                              // Meta tags
      /<link[^>]*>/i,                              // Link tags
      /<script[^>]*>/i,                            // Script tags
      /<style[^>]*>/i,                             // Style tags
      /<div[^>]*>/i,                               // Div elements
      /<span[^>]*>/i,                              // Span elements
      /<p[^>]*>/i,                                 // Paragraph elements
      /<h[1-6][^>]*>/i,                            // Heading elements
      /<img[^>]*>/i,                               // Image elements
      /<a[^>]*href/i,                              // Anchor elements with href
      /<form[^>]*>/i,                              // Form elements
      /<input[^>]*>/i,                             // Input elements
      /<!--.*-->/,                                 // HTML comments
      /\{\{.*\}\}/,                                // Template syntax (Vue, Handlebars)
      /\{%.*%\}/,                                  // Template syntax (Django, Liquid)
      /<%.*%>/,                                    // Template syntax (ERB, EJS)
      /@\w+/                                       // Vue directives, Angular directives
    ];
    
    let matches = 0;
    for (const pattern of htmlPatterns) {
      if (pattern.test(text)) matches++;
    }
    
    // Higher confidence with more HTML-specific patterns
    return Math.min(0.9, 0.6 + (matches * 0.05));
  }
  
  extractEnhancedFunctions(document: vscode.TextDocument): EnhancedFunctionMetrics[] {
    const text = document.getText();
    const lines = text.split('\n');
    const elements: EnhancedFunctionMetrics[] = [];
    
    // Analyze HTML structure as "functions"
    // We'll treat significant structural elements as analyzable units
    
    // 1. Script blocks (JavaScript/TypeScript in HTML)
    const scriptBlocks = this.extractScriptBlocks(text, lines);
    elements.push(...scriptBlocks);
    
    // 2. Style blocks (CSS in HTML)
    const styleBlocks = this.extractStyleBlocks(text, lines);
    elements.push(...styleBlocks);
    
    // 3. Template structures (Vue, Angular, etc.)
    const templateStructures = this.extractTemplateStructures(text, lines);
    elements.push(...templateStructures);
    
    // 4. Major HTML sections
    const htmlSections = this.extractHtmlSections(text, lines);
    elements.push(...htmlSections);
    
    // If no specific structures found, analyze the whole document
    if (elements.length === 0) {
      const documentMetrics = this.analyzeWholeDocument(text, lines);
      elements.push(documentMetrics);
    }
    
    return elements.sort((a, b) => a.startLine - b.startLine);
  }
  
  private extractScriptBlocks(text: string, lines: string[]): EnhancedFunctionMetrics[] {
    const scriptBlocks: EnhancedFunctionMetrics[] = [];
    const scriptPattern = /<script[^>]*>([\s\S]*?)<\/script>/gi;
    
    let match;
    while ((match = scriptPattern.exec(text)) !== null) {
      const scriptContent = match[1];
      const startPos = match.index;
      const endPos = match.index + match[0].length;
      
      // Find line numbers
      const beforeScript = text.substring(0, startPos);
      const beforeScriptLines = beforeScript.split('\n');
      const startLine = beforeScriptLines.length - 1;
      
      const scriptLines = scriptContent.split('\n');
      const endLine = startLine + scriptLines.length + 1; // +1 for closing tag
      
      // Analyze JavaScript complexity
      const complexity = this.analyzeJavaScriptInHtml(scriptContent);
      
      scriptBlocks.push({
        name: 'Script Block',
        startLine,
        endLine,
        size: endLine - startLine + 1,
        cyclomaticComplexity: complexity.cyclomatic,
        nestingDepth: complexity.nesting,
        parameterCount: 0,
        returnStatements: complexity.returns,
        isAsync: false,
        isMethod: false,
        isExported: false,
        language: ProgrammingLanguage.JAVASCRIPT,
        confidence: 0.7
      });
    }
    
    return scriptBlocks;
  }
  
  private extractStyleBlocks(text: string, lines: string[]): EnhancedFunctionMetrics[] {
    const styleBlocks: EnhancedFunctionMetrics[] = [];
    const stylePattern = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    
    let match;
    while ((match = stylePattern.exec(text)) !== null) {
      const styleContent = match[1];
      const startPos = match.index;
      
      // Find line numbers
      const beforeStyle = text.substring(0, startPos);
      const beforeStyleLines = beforeStyle.split('\n');
      const startLine = beforeStyleLines.length - 1;
      
      const styleLines = styleContent.split('\n');
      const endLine = startLine + styleLines.length + 1;
      
      // Analyze CSS complexity
      const complexity = this.analyzeCssInHtml(styleContent);
      
      styleBlocks.push({
        name: 'Style Block',
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
        confidence: 0.6
      });
    }
    
    return styleBlocks;
  }
  
  private extractTemplateStructures(text: string, lines: string[]): EnhancedFunctionMetrics[] {
    const templates: EnhancedFunctionMetrics[] = [];
    
    // Vue.js template analysis
    if (text.includes('<template>')) {
      const templatePattern = /<template[^>]*>([\s\S]*?)<\/template>/gi;
      let match;
      while ((match = templatePattern.exec(text)) !== null) {
        const templateContent = match[1];
        const complexity = this.analyzeTemplateComplexity(templateContent);
        
        const startPos = match.index;
        const beforeTemplate = text.substring(0, startPos);
        const startLine = beforeTemplate.split('\n').length - 1;
        const endLine = startLine + templateContent.split('\n').length + 1;
        
        templates.push({
          name: 'Vue Template',
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
          confidence: 0.8
        });
      }
    }
    
    return templates;
  }
  
  private extractHtmlSections(text: string, lines: string[]): EnhancedFunctionMetrics[] {
    const sections: EnhancedFunctionMetrics[] = [];
    
    // Major sections: head, body, main, nav, header, footer, section, article
    const sectionPatterns = [
      { tag: 'head', name: 'Head Section' },
      { tag: 'body', name: 'Body Section' },
      { tag: 'main', name: 'Main Content' },
      { tag: 'nav', name: 'Navigation' },
      { tag: 'header', name: 'Header' },
      { tag: 'footer', name: 'Footer' },
      { tag: 'aside', name: 'Sidebar' }
    ];
    
    for (const { tag, name } of sectionPatterns) {
      const pattern = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
      let match;
      
      while ((match = pattern.exec(text)) !== null) {
        const sectionContent = match[1];
        const startPos = match.index;
        
        const beforeSection = text.substring(0, startPos);
        const startLine = beforeSection.split('\n').length - 1;
        const endLine = startLine + sectionContent.split('\n').length + 1;
        
        const complexity = this.analyzeHtmlSectionComplexity(sectionContent);
        
        sections.push({
          name,
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
          confidence: 0.6
        });
      }
    }
    
    return sections;
  }
  
  private analyzeWholeDocument(text: string, lines: string[]): EnhancedFunctionMetrics {
    const complexity = this.analyzeHtmlDocumentComplexity(text);
    
    return {
      name: 'HTML Document',
      startLine: 0,
      endLine: lines.length - 1,
      size: lines.length,
      cyclomaticComplexity: complexity.cyclomatic,
      nestingDepth: complexity.nesting,
      parameterCount: 0,
      returnStatements: 0,
      isAsync: false,
      isMethod: false,
      isExported: false,
      language: ProgrammingLanguage.UNKNOWN,
      confidence: 0.5
    };
  }
  
  private analyzeJavaScriptInHtml(scriptContent: string): { cyclomatic: number; nesting: number; returns: number } {
    // Basic JavaScript analysis within HTML
    const lines = scriptContent.split('\n');
    let cyclomatic = 1;
    let nesting = 0;
    let maxNesting = 0;
    let returns = 0;
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed === '' || trimmed.startsWith('//')) continue;
      
      // Count braces for nesting
      const openBraces = (line.match(/\{/g) || []).length;
      const closeBraces = (line.match(/\}/g) || []).length;
      nesting += openBraces - closeBraces;
      maxNesting = Math.max(maxNesting, nesting);
      
      // Count decision points
      if (/^\s*(if|while|for|switch|catch|case)\b/.test(line)) {
        cyclomatic++;
      }
      
      // Count returns
      if (/\breturn\b/.test(trimmed)) {
        returns++;
      }
      
      // Count logical operators
      const logicalMatches = trimmed.match(/(\&\&|\|\|)/g);
      if (logicalMatches) {
        cyclomatic += logicalMatches.length;
      }
    }
    
    return { cyclomatic: Math.max(1, cyclomatic), nesting: maxNesting, returns };
  }
  
  private analyzeCssInHtml(styleContent: string): { cyclomatic: number; nesting: number } {
    // Basic CSS analysis
    const selectors = (styleContent.match(/[^{}]+\{/g) || []).length;
    const mediaQueries = (styleContent.match(/@media[^{]+\{/g) || []).length;
    const keyframes = (styleContent.match(/@keyframes[^{]+\{/g) || []).length;
    
    // CSS complexity is based on number of rules and nested structures
    const cyclomatic = Math.max(1, selectors + mediaQueries * 2 + keyframes);
    const nesting = Math.max(0, mediaQueries + keyframes);
    
    return { cyclomatic, nesting };
  }
  
  private analyzeTemplateComplexity(templateContent: string): { cyclomatic: number; nesting: number } {
    let cyclomatic = 1;
    let nesting = 0;
    
    // Count template directives that add complexity
    const vueDirectives = (templateContent.match(/v-(if|for|show|model|on|bind)/g) || []).length;
    const templateExpressions = (templateContent.match(/\{\{[^}]+\}\}/g) || []).length;
    const conditionalAttributes = (templateContent.match(/:\w+="[^"]*\?[^"]*:[^"]*"/g) || []).length;
    
    cyclomatic += vueDirectives + Math.floor(templateExpressions / 3) + conditionalAttributes;
    nesting = Math.floor(vueDirectives / 2); // Estimate nesting from directives
    
    return { cyclomatic: Math.max(1, cyclomatic), nesting };
  }
  
  private analyzeHtmlSectionComplexity(sectionContent: string): { cyclomatic: number; nesting: number } {
    // Count interactive elements and form complexity
    const forms = (sectionContent.match(/<form[^>]*>/gi) || []).length;
    const inputs = (sectionContent.match(/<input[^>]*>/gi) || []).length;
    const buttons = (sectionContent.match(/<button[^>]*>/gi) || []).length;
    const selects = (sectionContent.match(/<select[^>]*>/gi) || []).length;
    const links = (sectionContent.match(/<a[^>]*href/gi) || []).length;
    
    // Count nesting depth
    const maxNesting = this.calculateHtmlNesting(sectionContent);
    
    const cyclomatic = Math.max(1, forms * 2 + inputs + buttons + selects + Math.floor(links / 3));
    
    return { cyclomatic, nesting: maxNesting };
  }
  
  private analyzeHtmlDocumentComplexity(text: string): { cyclomatic: number; nesting: number } {
    const totalElements = (text.match(/<\w+[^>]*>/g) || []).length;
    const scripts = (text.match(/<script[^>]*>/gi) || []).length;
    const styles = (text.match(/<style[^>]*>/gi) || []).length;
    const forms = (text.match(/<form[^>]*>/gi) || []).length;
    const interactiveElements = (text.match(/<(input|button|select|textarea)[^>]*>/gi) || []).length;
    
    const maxNesting = this.calculateHtmlNesting(text);
    
    const cyclomatic = Math.max(1, 
      Math.floor(totalElements / 10) + 
      scripts * 3 + 
      styles * 2 + 
      forms * 3 + 
      interactiveElements
    );
    
    return { cyclomatic, nesting: maxNesting };
  }
  
  private calculateHtmlNesting(html: string): number {
    const lines = html.split('\n');
    let maxNesting = 0;
    let currentNesting = 0;
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed === '') continue;
      
      // Count opening tags (excluding self-closing)
      const openTags = (trimmed.match(/<\w+(?![^>]*\/>)[^>]*>/g) || []).length;
      // Count closing tags
      const closeTags = (trimmed.match(/<\/\w+>/g) || []).length;
      
      currentNesting += openTags - closeTags;
      maxNesting = Math.max(maxNesting, currentNesting);
    }
    
    return maxNesting;
  }
}