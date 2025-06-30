import * as assert from 'assert';
import * as vscode from 'vscode';
import { CodeParser } from '../services/codeParser';

// Mock implementation of vscode.TextDocument
class MockTextDocument implements vscode.TextDocument {
  private _content: string;
  uri: vscode.Uri = vscode.Uri.parse('file:///mock-document.ts');
  fileName: string = '/mock-document.ts';
  isUntitled: boolean = false;
  languageId: string = 'typescript';
  version: number = 1;
  isDirty: boolean = false;
  isClosed: boolean = false;
  eol: vscode.EndOfLine = vscode.EndOfLine.LF;
  lineCount: number = 0;
  // Add encoding - using 'as any' to handle potential type differences across vscode API versions
  encoding: any = 'utf8';

  constructor(content: string) {
    this._content = content;
    this.lineCount = content.split('\n').length;
  }

  getText(): string {
    return this._content;
  }

  // Calculate position from character offset
  positionAt(offset: number): vscode.Position {
    const text = this._content.substring(0, offset);
    const lines = text.split('\n');
    const line = lines.length - 1;
    const character = lines[line].length;
    return new vscode.Position(line, character);
  }

  // These methods are part of the interface but not needed for our tests
  getWordRangeAtPosition(): vscode.Range { throw new Error('Not implemented'); }
  lineAt(): vscode.TextLine { throw new Error('Not implemented'); }
  offsetAt(): number { throw new Error('Not implemented'); }
  save(): Thenable<boolean> { throw new Error('Not implemented'); }
  validateRange(): vscode.Range { throw new Error('Not implemented'); }
  validatePosition(): vscode.Position { throw new Error('Not implemented'); }
}

suite('CodeParser Test Suite', () => {
  test('extractFunctions should identify different function styles', () => {
    const codeParser = new CodeParser();
    
    // Table of test cases with code samples and expected function data
    const testCases = [
      {
        description: 'Standard function declaration',
        code: 'function add(a, b) {\n  return a + b;\n}',
        expected: [
          { name: 'add', size: 3, startLine: 0, endLine: 2 }
        ]
      },
      {
        description: 'Function expression with variable',
        code: 'const multiply = function(a, b) {\n  return a * b;\n};',
        expected: [
          { name: 'multiply', size: 3, startLine: 0, endLine: 2 }
        ]
      },
      {
        description: 'Object method shorthand',
        code: 'const math = {\n  subtract(a, b) {\n    return a - b;\n  }\n};',
        expected: [
          { name: 'subtract', size: 3, startLine: 1, endLine: 3 }
        ]
      },
      {
        description: 'Object method with function expression',
        code: 'const calculator = {\n  divide: function(a, b) {\n    return a / b;\n  }\n};',
        expected: [
          { name: 'divide', size: 3, startLine: 1, endLine: 3 }
        ]
      },
      {
        description: 'Multiple functions',
        code: 'function first() {\n  console.log("first");\n}\n\nfunction second() {\n  console.log("second");\n}',
        expected: [
          { name: 'first', size: 3, startLine: 0, endLine: 2 },
          { name: 'second', size: 3, startLine: 4, endLine: 6 }
        ]
      },
      {
        description: 'Nested functions',
        code: 'function outer() {\n  function inner() {\n    return "nested";\n  }\n  return inner();\n}',
        expected: [
          { name: 'outer', size: 6, startLine: 0, endLine: 5 },
          { name: 'inner', size: 3, startLine: 1, endLine: 3 }
        ]
      },
      {
        description: 'Function with complex body',
        code: 'function complex() {\n  if (true) {\n    console.log("true");\n  } else {\n    console.log("false");\n  }\n  return { a: 1, b: 2 };\n}',
        expected: [
          { name: 'complex', size: 8, startLine: 0, endLine: 7 }
        ]
      }
    ];
    
    // Run all test cases
    testCases.forEach(testCase => {
      const document = new MockTextDocument(testCase.code);
      const functions = codeParser.extractFunctions(document);
      
      assert.strictEqual(
        functions.length, 
        testCase.expected.length, 
        `${testCase.description}: Expected ${testCase.expected.length} functions, but found ${functions.length}`
      );
      
      // Check each function matches expectations
      for (let i = 0; i < testCase.expected.length; i++) {
        const expected = testCase.expected[i];
        const actual = functions[i];
        
        assert.strictEqual(actual.name, expected.name, 
          `${testCase.description}: Function name mismatch for function ${i}`);
        
        assert.strictEqual(actual.size, expected.size, 
          `${testCase.description}: Function size mismatch for ${actual.name}`);
        
        assert.strictEqual(actual.startLine, expected.startLine, 
          `${testCase.description}: Start line mismatch for ${actual.name}`);
        
        assert.strictEqual(actual.endLine, expected.endLine, 
          `${testCase.description}: End line mismatch for ${actual.name}`);
      }
    });
  });

  test('extractFunctions should handle edge cases', () => {
    const codeParser = new CodeParser();
    
    // Table of edge cases
    const testCases = [
      {
        description: 'Empty document',
        code: '',
        expected: []
      },
      {
        description: 'No functions, only variables',
        code: 'const a = 1;\nlet b = 2;\nvar c = 3;',
        expected: []
      },
      {
        description: 'Arrow functions (not matched by current regex)',
        code: 'const arrow = () => {\n  return "arrow";\n};',
        expected: []  // Current implementation doesn't detect arrow functions
      },
      {
        description: 'Function with comments and string literals containing braces',
        code: 'function withComments() {\n  // { This is a comment }\n  return "{ not a real brace }";\n}',
        expected: [
          { name: 'withComments', size: 4, startLine: 0, endLine: 3 }
        ]
      }
    ];
    
    // Run all test cases
    testCases.forEach(testCase => {
      const document = new MockTextDocument(testCase.code);
      const functions = codeParser.extractFunctions(document);
      
      assert.strictEqual(
        functions.length, 
        testCase.expected.length, 
        `${testCase.description}: Expected ${testCase.expected.length} functions, but found ${functions.length}`
      );
      
      // Check each function matches expectations if any are expected
      for (let i = 0; i < testCase.expected.length; i++) {
        const expected = testCase.expected[i];
        const actual = functions[i];
        
        assert.strictEqual(actual.name, expected.name);
        assert.strictEqual(actual.size, expected.size);
        assert.strictEqual(actual.startLine, expected.startLine);
        assert.strictEqual(actual.endLine, expected.endLine);
      }
    });
  });
});
