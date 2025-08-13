import * as assert from 'assert';
import { ComplexityAnalyzer } from '../../services/complexityAnalyzer';
import { createMockDocument } from '../testUtils';

suite('Complexity Analyzer Test Suite', () => {
  let analyzer: ComplexityAnalyzer;

  setup(() => {
    analyzer = new ComplexityAnalyzer();
  });

  test('should analyze complexity distribution correctly', () => {
    const document = createMockDocument('typescript', 'complex');
    const analysis = analyzer.analyzeComplexity(document);
    
    assert.ok(analysis, 'Should return analysis results');
    assert.ok(typeof analysis.averageComplexity === 'number', 'Should calculate average complexity');
    assert.ok(typeof analysis.maxComplexity === 'number', 'Should calculate max complexity');
    assert.ok(typeof analysis.totalFunctions === 'number', 'Should count total functions');
    assert.ok(analysis.distribution, 'Should provide complexity distribution');
    
    // Check distribution properties
    assert.ok(typeof analysis.distribution.low === 'number', 'Should count low complexity functions');
    assert.ok(typeof analysis.distribution.medium === 'number', 'Should count medium complexity functions');
    assert.ok(typeof analysis.distribution.high === 'number', 'Should count high complexity functions');
    assert.ok(typeof analysis.distribution.extreme === 'number', 'Should count extreme complexity functions');
    
    // Distribution should add up to total functions
    const distributionSum = analysis.distribution.low + analysis.distribution.medium + 
                           analysis.distribution.high + analysis.distribution.extreme;
    assert.strictEqual(distributionSum, analysis.totalFunctions, 'Distribution should sum to total functions');
  });

  test('should classify complexity levels correctly', () => {
    // Test different complexity levels
    const testCases = [
      { complexity: 1, expected: 'low' },
      { complexity: 3, expected: 'low' },
      { complexity: 5, expected: 'medium' },
      { complexity: 8, expected: 'medium' },
      { complexity: 12, expected: 'high' },
      { complexity: 15, expected: 'high' },
      { complexity: 25, expected: 'extreme' },
      { complexity: 50, expected: 'extreme' }
    ];

    testCases.forEach(({ complexity, expected }) => {
      const level = analyzer.getComplexityLevel(complexity);
      assert.strictEqual(level, expected, `Complexity ${complexity} should be classified as ${expected}`);
    });
  });

  test('should analyze Python code complexity', () => {
    const document = createMockDocument('python');
    const analysis = analyzer.analyzeComplexity(document);
    
    assert.ok(analysis.totalFunctions >= 4, 'Should find multiple Python functions');
    assert.ok(analysis.averageComplexity > 0, 'Should calculate average complexity');
    assert.ok(analysis.maxComplexity >= 2, 'Should find functions with reasonable complexity');
  });

  test('should analyze Java code complexity', () => {
    const document = createMockDocument('java');
    const analysis = analyzer.analyzeComplexity(document);
    
    assert.ok(analysis.totalFunctions >= 5, 'Should find multiple Java methods');
    assert.ok(analysis.averageComplexity > 0, 'Should calculate average complexity');
    assert.ok(analysis.maxComplexity >= 2, 'Should find methods with reasonable complexity');
  });

  test('should analyze Ruby code complexity', () => {
    const document = createMockDocument('ruby');
    const analysis = analyzer.analyzeComplexity(document);
    
    assert.ok(analysis.totalFunctions >= 6, 'Should find multiple Ruby methods');
    assert.ok(analysis.averageComplexity > 0, 'Should calculate average complexity');
    assert.ok(analysis.maxComplexity >= 2, 'Should find methods with reasonable complexity');
  });

  test('should handle empty files gracefully', () => {
    const emptyDoc = createMockDocument('typescript');
    emptyDoc.getText = () => '';
    
    const analysis = analyzer.analyzeComplexity(emptyDoc);
    
    assert.strictEqual(analysis.totalFunctions, 0, 'Should find no functions in empty file');
    assert.strictEqual(analysis.averageComplexity, 0, 'Should have zero average complexity');
    assert.strictEqual(analysis.maxComplexity, 0, 'Should have zero max complexity');
    assert.strictEqual(analysis.distribution.low, 0, 'Should have no low complexity functions');
    assert.strictEqual(analysis.distribution.medium, 0, 'Should have no medium complexity functions');
    assert.strictEqual(analysis.distribution.high, 0, 'Should have no high complexity functions');
    assert.strictEqual(analysis.distribution.extreme, 0, 'Should have no extreme complexity functions');
  });

  test('should calculate complexity metrics correctly', () => {
    const complexTypeScriptCode = `
function simpleFunction() {
  return "hello";
}

function mediumComplexity(value: number): string {
  if (value > 0) {
    if (value > 100) {
      return "large";
    } else {
      return "small";
    }
  } else {
    return "negative";
  }
}

function highComplexity(data: any[]): any[] {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    if (data[i]) {
      if (typeof data[i] === 'string') {
        if (data[i].length > 0) {
          result.push(data[i].toUpperCase());
        } else {
          result.push('EMPTY');
        }
      } else if (typeof data[i] === 'number') {
        if (data[i] > 0) {
          result.push(data[i] * 2);
        } else {
          result.push(0);
        }
      } else {
        result.push(null);
      }
    }
  }
  return result;
}`;

    const document = createMockDocument('typescript');
    document.getText = () => complexTypeScriptCode;
    
    const analysis = analyzer.analyzeComplexity(document);
    
    assert.strictEqual(analysis.totalFunctions, 3, 'Should find 3 functions');
    assert.ok(analysis.distribution.low >= 1, 'Should have at least 1 low complexity function');
    assert.ok(analysis.distribution.medium >= 1, 'Should have at least 1 medium complexity function');
    assert.ok(analysis.distribution.high >= 1, 'Should have at least 1 high complexity function');
    assert.ok(analysis.maxComplexity >= 8, 'Should detect high complexity in complex function');
  });

  test('should provide overall complexity assessment', () => {
    // Test with mostly simple functions
    const simpleCode = `
function a() { return 1; }
function b() { return 2; }
function c() { return 3; }`;

    const simpleDoc = createMockDocument('typescript');
    simpleDoc.getText = () => simpleCode;
    
    const simpleAnalysis = analyzer.analyzeComplexity(simpleDoc);
    const simpleLevel = analyzer.getOverallComplexityLevel(simpleAnalysis);
    assert.strictEqual(simpleLevel, 'low', 'Should assess overall complexity as low');

    // Test with complex functions
    const complexCode = `
function complex1(x: number): number {
  if (x > 0) {
    if (x > 10) {
      if (x > 100) {
        return x * 3;
      } else {
        return x * 2;
      }
    } else {
      return x + 1;
    }
  } else {
    return 0;
  }
}

function complex2(data: any[]): any {
  for (let item of data) {
    if (item) {
      if (item.type === 'A') {
        if (item.value > 0) {
          return item.value * 2;
        }
      } else if (item.type === 'B') {
        if (item.value < 0) {
          return item.value / 2;
        }
      }
    }
  }
  return null;
}`;

    const complexDoc = createMockDocument('typescript');
    complexDoc.getText = () => complexCode;
    
    const complexAnalysis = analyzer.analyzeComplexity(complexDoc);
    const complexLevel = analyzer.getOverallComplexityLevel(complexAnalysis);
    assert.ok(['medium', 'high', 'extreme'].includes(complexLevel), 'Should assess overall complexity as medium or higher');
  });

  test('should handle different programming languages consistently', () => {
    const languages = ['typescript', 'python', 'java', 'ruby', 'php'] as const;
    
    for (const language of languages) {
      const document = createMockDocument(language);
      const analysis = analyzer.analyzeComplexity(document);
      
      assert.ok(analysis.totalFunctions > 0, `Should find functions in ${language} code`);
      assert.ok(analysis.averageComplexity > 0, `Should calculate complexity for ${language} code`);
      assert.ok(analysis.maxComplexity > 0, `Should find max complexity in ${language} code`);
      
      // Distribution should be valid
      const distributionSum = analysis.distribution.low + analysis.distribution.medium + 
                             analysis.distribution.high + analysis.distribution.extreme;
      assert.strictEqual(distributionSum, analysis.totalFunctions, 
        `Distribution should be valid for ${language} code`);
    }
  });

  test('should provide consistent complexity levels', () => {
    // Test boundary conditions
    assert.strictEqual(analyzer.getComplexityLevel(1), 'low');
    assert.strictEqual(analyzer.getComplexityLevel(4), 'low');
    assert.strictEqual(analyzer.getComplexityLevel(5), 'medium');
    assert.strictEqual(analyzer.getComplexityLevel(10), 'medium');
    assert.strictEqual(analyzer.getComplexityLevel(11), 'high');
    assert.strictEqual(analyzer.getComplexityLevel(20), 'high');
    assert.strictEqual(analyzer.getComplexityLevel(21), 'extreme');
    assert.strictEqual(analyzer.getComplexityLevel(100), 'extreme');
  });

  test('should calculate percentages correctly', () => {
    const mixedCode = `
function simple1() { return 1; }
function simple2() { return 2; }
function simple3() { return 3; }
function simple4() { return 4; }

function medium1(x: number): number {
  if (x > 0) {
    if (x > 10) {
      return x * 2;
    } else {
      return x + 1;
    }
  } else {
    return 0;
  }
}

function medium2(y: number): number {
  if (y < 0) {
    if (y < -10) {
      return y / 2;
    } else {
      return y - 1;
    }
  } else {
    return 1;
  }
}`;

    const document = createMockDocument('typescript');
    document.getText = () => mixedCode;
    
    const analysis = analyzer.analyzeComplexity(document);
    
    // Should have 4 low complexity and 2 medium complexity functions
    assert.strictEqual(analysis.totalFunctions, 6);
    assert.strictEqual(analysis.distribution.low, 4);
    assert.strictEqual(analysis.distribution.medium, 2);
    assert.strictEqual(analysis.distribution.high, 0);
    assert.strictEqual(analysis.distribution.extreme, 0);
    
    // Test percentage calculation
    const lowPercentage = (analysis.distribution.low / analysis.totalFunctions) * 100;
    const mediumPercentage = (analysis.distribution.medium / analysis.totalFunctions) * 100;
    
    assert.strictEqual(Math.round(lowPercentage), 67);
    assert.strictEqual(Math.round(mediumPercentage), 33);
  });
});