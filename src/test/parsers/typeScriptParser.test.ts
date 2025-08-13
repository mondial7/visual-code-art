import * as assert from 'assert';
import { TypeScriptParser } from '../../services/parsers/typeScriptParser';
import { createMockDocument, TestCodeSamples, ExpectedResults, assertParserResult } from '../testUtils';

suite('TypeScript Parser Test Suite', () => {
  let parser: TypeScriptParser;

  setup(() => {
    parser = new TypeScriptParser();
  });

  test('should identify TypeScript/JavaScript files correctly', () => {
    const tsDoc = createMockDocument('typescript');
    const jsDoc = createMockDocument('typescript');
    jsDoc.languageId = 'javascript';
    
    assert.strictEqual(parser.canParse(tsDoc), true);
    assert.strictEqual(parser.canParse(jsDoc), true);
    assert.strictEqual(parser.getSupportedLanguage(), 'TypeScript');
  });

  test('should extract functions from simple TypeScript code', () => {
    const document = createMockDocument('typescript', 'simple');
    const functions = parser.extractFunctions(document);
    
    assert.strictEqual(functions.length, 4);
    
    // Verify function names and basic properties
    const functionNames = functions.map(f => f.name);
    assert.deepStrictEqual(functionNames, ['greet', 'calculate', 'add', 'multiply']);
    
    // Check specific function details
    const greetFunc = functions.find(f => f.name === 'greet');
    assert.ok(greetFunc, 'greet function should be found');
    assert.strictEqual(greetFunc.startLine, 1, 'greet function should start at line 1');
    
    const multiplyFunc = functions.find(f => f.name === 'multiply');
    assert.ok(multiplyFunc, 'multiply function should be found');
    assert.ok(multiplyFunc.size >= 5, 'multiply function should have reasonable size');
  });

  test('should extract enhanced functions with complexity metrics', () => {
    const document = createMockDocument('typescript', 'complex');
    const enhancedFunctions = parser.extractEnhancedFunctions(document);
    
    assert.ok(enhancedFunctions.length >= 2, 'Should find at least 2 functions in complex sample');
    
    // Find the ItemList component
    const itemListFunc = enhancedFunctions.find(f => f.name === 'ItemList');
    assert.ok(itemListFunc, 'ItemList function should be found');
    assert.ok(itemListFunc.cyclomaticComplexity >= 3, 'ItemList should have reasonable complexity');
    assert.ok(itemListFunc.nestingDepth >= 1, 'ItemList should have nesting');
    
    // Find the handleClick function
    const handleClickFunc = enhancedFunctions.find(f => f.name === 'handleClick');
    assert.ok(handleClickFunc, 'handleClick function should be found');
    assert.ok(handleClickFunc.cyclomaticComplexity >= 2, 'handleClick should have conditional complexity');
  });

  test('should handle React/JSX syntax correctly', () => {
    const document = createMockDocument('typescript', 'complex');
    const functions = parser.extractFunctions(document);
    
    // Should detect React component and hooks
    const itemListFunc = functions.find(f => f.name === 'ItemList');
    assert.ok(itemListFunc, 'Should detect React functional component');
    
    // Verify the parser can handle JSX without crashing
    assert.ok(functions.length > 0, 'Should extract functions from React code');
  });

  test('should provide appropriate confidence scores', () => {
    const tsDocument = createMockDocument('typescript');
    tsDocument.languageId = 'typescript';
    tsDocument.fileName = '/test/file.ts';
    
    const jsDocument = createMockDocument('typescript');
    jsDocument.languageId = 'javascript';
    jsDocument.fileName = '/test/file.js';
    
    const htmlDocument = createMockDocument('html');
    
    assert.ok(parser.getConfidence(tsDocument) >= 0.9, 'Should have high confidence for TypeScript files');
    assert.ok(parser.getConfidence(jsDocument) >= 0.8, 'Should have good confidence for JavaScript files');
    assert.ok(parser.getConfidence(htmlDocument) < 0.5, 'Should have low confidence for HTML files');
  });

  test('should handle edge cases gracefully', () => {
    // Empty file
    const emptyDoc = createMockDocument('typescript');
    emptyDoc.getText = () => '';
    const emptyFunctions = parser.extractFunctions(emptyDoc);
    assert.strictEqual(emptyFunctions.length, 0, 'Should handle empty files');

    // File with no functions
    const noFuncDoc = createMockDocument('typescript');
    noFuncDoc.getText = () => 'const x = 1; let y = 2; var z = 3;';
    const noFunctions = parser.extractFunctions(noFuncDoc);
    assert.strictEqual(noFunctions.length, 0, 'Should handle files with no functions');

    // File with syntax errors (should not crash)
    const invalidDoc = createMockDocument('typescript');
    invalidDoc.getText = () => 'function broken( { return; }';
    assert.doesNotThrow(() => {
      parser.extractFunctions(invalidDoc);
    }, 'Should handle syntax errors gracefully');
  });

  test('should detect TypeScript-specific features', () => {
    const tsCode = `
interface User {
  name: string;
  age: number;
}

function createUser<T extends User>(data: T): T {
  return data;
}

class UserService {
  private users: User[] = [];
  
  public addUser(user: User): void {
    this.users.push(user);
  }
  
  public getUsers(): User[] {
    return this.users.filter(u => u.age >= 18);
  }
}`;

    const document = createMockDocument('typescript');
    document.getText = () => tsCode;
    
    const functions = parser.extractFunctions(document);
    const functionNames = functions.map(f => f.name);
    
    assert.ok(functionNames.includes('createUser'), 'Should detect generic functions');
    assert.ok(functionNames.includes('addUser'), 'Should detect class methods');
    assert.ok(functionNames.includes('getUsers'), 'Should detect methods with complex return types');
  });
});