import * as assert from 'assert';
import { JavaParser } from '../../services/parsers/javaParser';
import { createMockDocument, TestCodeSamples } from '../testUtils';

suite('Java Parser Test Suite', () => {
  let parser: JavaParser;

  setup(() => {
    parser = new JavaParser();
  });

  test('should identify Java files correctly', () => {
    const javaDoc = createMockDocument('java');
    const tsDoc = createMockDocument('typescript');
    
    assert.strictEqual(parser.canParse(javaDoc), true);
    assert.strictEqual(parser.canParse(tsDoc), false);
    assert.strictEqual(parser.getSupportedLanguage(), 'Java');
  });

  test('should extract functions from Java code', () => {
    const document = createMockDocument('java');
    const functions = parser.extractFunctions(document);
    
    assert.ok(functions.length >= 5, 'Should find at least 5 methods in Java sample');
    
    // Verify function names
    const functionNames = functions.map(f => f.name);
    assert.ok(functionNames.includes('Calculator (constructor)'), 'Should find default constructor');
    assert.ok(functionNames.includes('add'), 'Should find add method');
    assert.ok(functionNames.includes('multiply (static)'), 'Should find static method');
    assert.ok(functionNames.includes('processNumbers'), 'Should find method with streams');
    assert.ok(functionNames.includes('isValid (private)'), 'Should find private method');
  });

  test('should extract enhanced functions with complexity metrics', () => {
    const document = createMockDocument('java');
    const enhancedFunctions = parser.extractEnhancedFunctions(document);
    
    assert.ok(enhancedFunctions.length >= 5, 'Should find multiple methods with metrics');
    
    // Find the processNumbers method
    const processFunc = enhancedFunctions.find(f => f.name === 'processNumbers');
    assert.ok(processFunc, 'processNumbers method should be found');
    assert.ok(processFunc.cyclomaticComplexity >= 3, 'Stream operations should have reasonable complexity');
    
    // Find the isValid method
    const validFunc = enhancedFunctions.find(f => f.name.includes('isValid'));
    assert.ok(validFunc, 'isValid method should be found');
    assert.ok(validFunc.cyclomaticComplexity >= 1, 'isValid should have complexity from logical operations');
  });

  test('should handle Java-specific syntax correctly', () => {
    const javaCode = `
package com.example.advanced;

import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

public class AdvancedJavaFeatures {
    private static final Logger LOGGER = LoggerFactory.getLogger(AdvancedJavaFeatures.class);
    
    public AdvancedJavaFeatures() {
        // Default constructor
    }
    
    public AdvancedJavaFeatures(String config) {
        // Parameterized constructor
        this.config = config;
    }
    
    public <T extends Comparable<T>> List<T> sortGeneric(List<T> items) {
        return items.stream()
            .filter(Objects::nonNull)
            .sorted()
            .collect(Collectors.toList());
    }
    
    public static void staticUtilityMethod() {
        System.out.println("Utility method");
    }
    
    protected synchronized void threadSafeMethod() {
        // Thread-safe operation
        if (condition) {
            doSomething();
        }
    }
    
    private CompletableFuture<String> asyncMethod() {
        return CompletableFuture.supplyAsync(() -> {
            try {
                Thread.sleep(1000);
                return "Result";
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            }
        });
    }
    
    public void methodWithLambdas() {
        List<String> items = Arrays.asList("a", "b", "c");
        items.forEach(item -> {
            if (item != null) {
                System.out.println(item.toUpperCase());
            }
        });
    }
    
    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        AdvancedJavaFeatures that = (AdvancedJavaFeatures) obj;
        return Objects.equals(config, that.config);
    }
}`;

    const document = createMockDocument('java');
    document.getText = () => javaCode;
    
    const functions = parser.extractFunctions(document);
    const functionNames = functions.map(f => f.name);
    
    assert.ok(functionNames.some(name => name.includes('constructor')), 'Should detect constructors');
    assert.ok(functionNames.includes('sortGeneric'), 'Should detect generic methods');
    assert.ok(functionNames.includes('staticUtilityMethod (static)'), 'Should detect static methods');
    assert.ok(functionNames.includes('threadSafeMethod (protected)'), 'Should detect protected methods');
    assert.ok(functionNames.includes('asyncMethod (private)'), 'Should detect private methods');
    assert.ok(functionNames.includes('methodWithLambdas'), 'Should detect methods with lambdas');
    assert.ok(functionNames.includes('equals'), 'Should detect overridden methods');
  });

  test('should provide appropriate confidence scores', () => {
    const javaDocument = createMockDocument('java');
    javaDocument.languageId = 'java';
    javaDocument.fileName = '/test/file.java';
    
    const tsDocument = createMockDocument('typescript');
    
    assert.ok(parser.getConfidence(javaDocument) >= 0.9, 'Should have high confidence for Java files');
    assert.ok(parser.getConfidence(tsDocument) < 0.3, 'Should have low confidence for TypeScript files');
  });

  test('should distinguish between methods and constructors', () => {
    const javaCode = `
public class TestClass {
    public TestClass() {
        // Default constructor
    }
    
    public TestClass(String param) {
        // Parameterized constructor
    }
    
    public void regularMethod() {
        // Regular method
    }
    
    public static void staticMethod() {
        // Static method
    }
}`;

    const document = createMockDocument('java');
    document.getText = () => javaCode;
    
    const functions = parser.extractFunctions(document);
    const constructors = functions.filter(f => f.name.includes('constructor'));
    const methods = functions.filter(f => !f.name.includes('constructor'));
    
    assert.strictEqual(constructors.length, 2, 'Should find 2 constructors');
    assert.ok(methods.length >= 2, 'Should find regular and static methods');
    
    // Verify constructor naming
    assert.ok(constructors.some(c => c.name === 'TestClass (constructor)'), 'Should identify default constructor');
    assert.ok(constructors.some(c => c.name === 'TestClass (constructor)'), 'Should identify parameterized constructor');
  });

  test('should handle complex method signatures', () => {
    const complexCode = `
public class ComplexSignatures {
    public <T, R> CompletableFuture<List<R>> processAsync(
        List<T> input,
        Function<T, R> transformer,
        Predicate<R> filter
    ) throws ProcessingException {
        return CompletableFuture.supplyAsync(() -> {
            return input.stream()
                .map(transformer)
                .filter(filter)
                .collect(Collectors.toList());
        });
    }
    
    protected final synchronized void complexMethod(
        Map<String, ? extends Serializable> params,
        Consumer<String> callback
    ) {
        for (Map.Entry<String, ? extends Serializable> entry : params.entrySet()) {
            if (entry.getValue() != null) {
                callback.accept(entry.getKey());
            }
        }
    }
}`;

    const document = createMockDocument('java');
    document.getText = () => complexCode;
    
    const functions = parser.extractFunctions(document);
    
    assert.ok(functions.length >= 2, 'Should find complex methods');
    assert.ok(functions.some(f => f.name === 'processAsync'), 'Should detect generic async method');
    assert.ok(functions.some(f => f.name === 'complexMethod (protected)'), 'Should detect complex protected method');
  });

  test('should handle edge cases gracefully', () => {
    // Empty file
    const emptyDoc = createMockDocument('java');
    emptyDoc.getText = () => '';
    const emptyFunctions = parser.extractFunctions(emptyDoc);
    assert.strictEqual(emptyFunctions.length, 0, 'Should handle empty files');

    // File with no methods
    const noMethodDoc = createMockDocument('java');
    noMethodDoc.getText = () => 'public class Empty { private int x = 1; }';
    const noMethods = parser.extractFunctions(noMethodDoc);
    assert.strictEqual(noMethods.length, 0, 'Should handle files with no methods');

    // File with incomplete method (should not crash)
    const incompleteDoc = createMockDocument('java');
    incompleteDoc.getText = () => 'public class Broken { public void incomplete(';
    assert.doesNotThrow(() => {
      parser.extractFunctions(incompleteDoc);
    }, 'Should handle incomplete syntax gracefully');
  });
});