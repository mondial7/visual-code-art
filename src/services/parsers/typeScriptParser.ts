import * as ts from 'typescript';
import * as vscode from 'vscode';
import { BaseLanguageParser, ProgrammingLanguage, EnhancedFunctionMetrics } from './baseParser';

/**
 * TypeScript/JavaScript parser using the official TypeScript Compiler API
 * Refactored from the original typeScriptAstParser to use the new architecture
 */
export class TypeScriptParser extends BaseLanguageParser {
  getSupportedLanguage(): ProgrammingLanguage {
    return ProgrammingLanguage.TYPESCRIPT; // Can handle both TS and JS
  }
  
  canParse(document: vscode.TextDocument): boolean {
    const extension = this.getFileExtension(document);
    return extension === '.js' || 
           extension === '.jsx' || 
           extension === '.ts' || 
           extension === '.tsx' ||
           extension === '.mjs' ||
           extension === '.cjs' ||
           document.languageId === 'javascript' ||
           document.languageId === 'javascriptreact' ||
           document.languageId === 'typescript' ||
           document.languageId === 'typescriptreact';
  }
  
  getConfidence(document: vscode.TextDocument): number {
    if (!this.canParse(document)) return 0.0;
    
    const text = document.getText();
    const extension = this.getFileExtension(document);
    
    // Higher confidence for TypeScript files
    if (extension === '.ts' || extension === '.tsx') return 0.95;
    
    // Check for TypeScript-specific features in JS files
    const tsPatterns = [
      /:\s*\w+(\[\])?(\s*\|\s*\w+)*\s*[=;,)]/,  // Type annotations
      /interface\s+\w+/,                          // Interface declarations
      /type\s+\w+\s*=/,                          // Type aliases
      /enum\s+\w+/,                              // Enums
      /public|private|protected\s+/,             // Access modifiers
      /readonly\s+/,                             // Readonly modifier
      /<\w+>/,                                   // Generic types
      /implements\s+\w+/                         // Interface implementation
    ];
    
    let tsFeatures = 0;
    for (const pattern of tsPatterns) {
      if (pattern.test(text)) tsFeatures++;
    }
    
    // Base confidence for JS, higher with TS features
    return Math.min(0.9, 0.7 + (tsFeatures * 0.05));
  }
  
  extractEnhancedFunctions(document: vscode.TextDocument): EnhancedFunctionMetrics[] {
    const sourceCode = document.getText();
    const fileName = document.fileName;
    const scriptKind = this.getScriptKind(fileName);
    
    // Create a TypeScript source file
    const sourceFile = ts.createSourceFile(
      fileName,
      sourceCode,
      ts.ScriptTarget.Latest,
      true,
      scriptKind
    );
    
    const functions: EnhancedFunctionMetrics[] = [];
    
    // Traverse the AST to find function declarations
    const visit = (node: ts.Node) => {
      if (this.isFunctionLike(node)) {
        const functionInfo = this.analyzeFunctionNode(node, sourceFile);
        if (functionInfo) {
          functions.push(functionInfo);
        }
      }
      
      ts.forEachChild(node, visit);
    };
    
    visit(sourceFile);
    
    return functions.sort((a, b) => a.startLine - b.startLine);
  }
  
  private getScriptKind(fileName: string): ts.ScriptKind {
    if (fileName.endsWith('.tsx')) return ts.ScriptKind.TSX;
    if (fileName.endsWith('.ts')) return ts.ScriptKind.TS;
    if (fileName.endsWith('.jsx')) return ts.ScriptKind.JSX;
    return ts.ScriptKind.JS;
  }
  
  private isFunctionLike(node: ts.Node): boolean {
    return ts.isFunctionDeclaration(node) ||
           ts.isFunctionExpression(node) ||
           ts.isArrowFunction(node) ||
           ts.isMethodDeclaration(node) ||
           ts.isConstructorDeclaration(node) ||
           ts.isGetAccessorDeclaration(node) ||
           ts.isSetAccessorDeclaration(node);
  }
  
  private analyzeFunctionNode(node: ts.Node, sourceFile: ts.SourceFile): EnhancedFunctionMetrics | null {
    // Get function name
    const name = this.getFunctionName(node);
    if (!name) return null;
    
    // Get position information
    const start = sourceFile.getLineAndCharacterOfPosition(node.getStart());
    const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
    const size = end.line - start.line + 1;
    
    // Analyze function complexity
    const complexity = this.calculateCyclomaticComplexity(node);
    const nestingDepth = this.calculateNestingDepth(node);
    const parameterCount = this.getParameterCount(node);
    const returnStatements = this.countReturnStatementsInNode(node);
    
    // Determine function characteristics
    const isAsync = this.isAsyncFunction(node);
    const isMethod = ts.isMethodDeclaration(node) || ts.isConstructorDeclaration(node);
    const isExported = this.isExportedFunction(node);
    
    // Determine language based on file extension
    const fileName = sourceFile.fileName.toLowerCase();
    const language = fileName.endsWith('.ts') || fileName.endsWith('.tsx') 
      ? ProgrammingLanguage.TYPESCRIPT 
      : ProgrammingLanguage.JAVASCRIPT;
    
    return {
      name,
      startLine: start.line,
      endLine: end.line,
      size,
      cyclomaticComplexity: complexity,
      nestingDepth,
      parameterCount,
      returnStatements,
      isAsync,
      isMethod,
      isExported,
      language,
      confidence: 0.95 // High confidence with AST parsing
    };
  }
  
  private getFunctionName(node: ts.Node): string | null {
    if (ts.isFunctionDeclaration(node) && node.name) {
      return node.name.text;
    }
    
    if (ts.isMethodDeclaration(node) && node.name && ts.isIdentifier(node.name)) {
      return node.name.text;
    }
    
    if (ts.isConstructorDeclaration(node)) {
      return 'constructor';
    }
    
    if (ts.isGetAccessorDeclaration(node) && node.name && ts.isIdentifier(node.name)) {
      return `get ${node.name.text}`;
    }
    
    if (ts.isSetAccessorDeclaration(node) && node.name && ts.isIdentifier(node.name)) {
      return `set ${node.name.text}`;
    }
    
    // For function expressions and arrow functions, try to get name from parent
    const parent = node.parent;
    if (ts.isVariableDeclaration(parent) && parent.name && ts.isIdentifier(parent.name)) {
      return parent.name.text;
    }
    
    if (ts.isPropertyAssignment(parent) && parent.name && ts.isIdentifier(parent.name)) {
      return parent.name.text;
    }
    
    // Return anonymous if no name found
    return ts.isArrowFunction(node) ? 'anonymous_arrow' : 'anonymous_function';
  }
  
  private calculateCyclomaticComplexity(node: ts.Node): number {
    let complexity = 1; // Base complexity
    
    const visit = (child: ts.Node) => {
      // Decision points that increase complexity
      if (ts.isIfStatement(child) ||
          ts.isConditionalExpression(child) ||
          ts.isWhileStatement(child) ||
          ts.isDoStatement(child) ||
          ts.isForStatement(child) ||
          ts.isForInStatement(child) ||
          ts.isForOfStatement(child) ||
          ts.isSwitchStatement(child) ||
          ts.isCatchClause(child)) {
        complexity++;
      }
      
      // Logical operators
      if (ts.isBinaryExpression(child)) {
        if (child.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ||
            child.operatorToken.kind === ts.SyntaxKind.BarBarToken) {
          complexity++;
        }
      }
      
      // Case clauses
      if (ts.isCaseClause(child)) {
        complexity++;
      }
      
      ts.forEachChild(child, visit);
    };
    
    ts.forEachChild(node, visit);
    return complexity;
  }
  
  private calculateNestingDepth(node: ts.Node, currentDepth: number = 0): number {
    let maxDepth = currentDepth;
    
    const visit = (child: ts.Node, depth: number) => {
      let newDepth = depth;
      
      // Increase depth for nesting constructs
      if (ts.isBlock(child) ||
          ts.isIfStatement(child) ||
          ts.isWhileStatement(child) ||
          ts.isDoStatement(child) ||
          ts.isForStatement(child) ||
          ts.isForInStatement(child) ||
          ts.isForOfStatement(child) ||
          ts.isSwitchStatement(child) ||
          ts.isTryStatement(child) ||
          ts.isCatchClause(child)) {
        newDepth++;
        maxDepth = Math.max(maxDepth, newDepth);
      }
      
      ts.forEachChild(child, (grandChild) => visit(grandChild, newDepth));
    };
    
    ts.forEachChild(node, (child) => visit(child, currentDepth));
    return maxDepth;
  }
  
  private getParameterCount(node: ts.Node): number {
    if (ts.isFunctionDeclaration(node) ||
        ts.isFunctionExpression(node) ||
        ts.isArrowFunction(node) ||
        ts.isMethodDeclaration(node) ||
        ts.isConstructorDeclaration(node)) {
      return node.parameters.length;
    }
    return 0;
  }
  
  private countReturnStatementsInNode(node: ts.Node): number {
    let count = 0;
    
    const visit = (child: ts.Node) => {
      if (ts.isReturnStatement(child)) {
        count++;
      }
      ts.forEachChild(child, visit);
    };
    
    ts.forEachChild(node, visit);
    return count;
  }
  
  private isAsyncFunction(node: ts.Node): boolean {
    if (ts.isFunctionDeclaration(node) ||
        ts.isFunctionExpression(node) ||
        ts.isArrowFunction(node) ||
        ts.isMethodDeclaration(node)) {
      return node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword) ?? false;
    }
    return false;
  }
  
  private isExportedFunction(node: ts.Node): boolean {
    if (ts.isFunctionDeclaration(node)) {
      return node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword) ?? false;
    }
    
    // Check if parent is an export assignment
    const parent = node.parent;
    if (ts.isVariableDeclaration(parent) && parent.parent && ts.isVariableDeclarationList(parent.parent)) {
      const variableStatement = parent.parent.parent;
      if (ts.isVariableStatement(variableStatement)) {
        return variableStatement.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword) ?? false;
      }
    }
    
    return false;
  }
}