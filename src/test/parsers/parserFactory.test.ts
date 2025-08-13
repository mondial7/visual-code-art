import * as assert from 'assert';
import { ParserFactory } from '../../services/parsers/parserFactory';
import { ProgrammingLanguage } from '../../services/parsers/baseParser';
import { createMockDocument } from '../testUtils';

suite('Parser Factory Test Suite', () => {
  test('should return appropriate parser for each supported language', () => {
    // TypeScript/JavaScript
    const tsDoc = createMockDocument('typescript');
    const tsParser = ParserFactory.getBestParser(tsDoc);
    assert.strictEqual(tsParser.getSupportedLanguage(), 'TypeScript');

    // Python
    const pyDoc = createMockDocument('python');
    const pyParser = ParserFactory.getBestParser(pyDoc);
    assert.strictEqual(pyParser.getSupportedLanguage(), 'Python');

    // Java
    const javaDoc = createMockDocument('java');
    const javaParser = ParserFactory.getBestParser(javaDoc);
    assert.strictEqual(javaParser.getSupportedLanguage(), 'Java');

    // Ruby
    const rubyDoc = createMockDocument('ruby');
    const rubyParser = ParserFactory.getBestParser(rubyDoc);
    assert.strictEqual(rubyParser.getSupportedLanguage(), 'Ruby');

    // PHP
    const phpDoc = createMockDocument('php');
    const phpParser = ParserFactory.getBestParser(phpDoc);
    assert.strictEqual(phpParser.getSupportedLanguage(), 'PHP');

    // HTML
    const htmlDoc = createMockDocument('html');
    const htmlParser = ParserFactory.getBestParser(htmlDoc);
    assert.strictEqual(htmlParser.getSupportedLanguage(), 'HTML');

    // CSS
    const cssDoc = createMockDocument('css');
    const cssParser = ParserFactory.getBestParser(cssDoc);
    assert.strictEqual(cssParser.getSupportedLanguage(), 'CSS');
  });

  test('should return default parser for unsupported file types', () => {
    const unknownDoc = createMockDocument('typescript');
    unknownDoc.languageId = 'unknown-language';
    unknownDoc.fileName = '/test/file.xyz';
    
    const parser = ParserFactory.getBestParser(unknownDoc);
    assert.strictEqual(parser.getSupportedLanguage(), 'Unknown');
  });

  test('should provide parser statistics', () => {
    const tsDoc = createMockDocument('typescript');
    const stats = ParserFactory.getParserStats(tsDoc);
    
    assert.ok(stats.detectedLanguage, 'Should detect a language');
    assert.ok(stats.selectedParser, 'Should select a parser');
    assert.ok(Array.isArray(stats.availableParsers), 'Should list available parsers');
    assert.ok(typeof stats.confidence === 'number', 'Should provide confidence score');
    assert.ok(stats.confidence >= 0 && stats.confidence <= 1, 'Confidence should be between 0 and 1');
  });

  test('should get parser by specific language', () => {
    const tsParser = ParserFactory.getParserByLanguage(ProgrammingLanguage.TYPESCRIPT);
    assert.ok(tsParser, 'Should find TypeScript parser');
    assert.strictEqual(tsParser!.getSupportedLanguage(), ProgrammingLanguage.TYPESCRIPT);

    const pyParser = ParserFactory.getParserByLanguage(ProgrammingLanguage.PYTHON);
    assert.ok(pyParser, 'Should find Python parser');
    assert.strictEqual(pyParser!.getSupportedLanguage(), ProgrammingLanguage.PYTHON);

    const unknownParser = ParserFactory.getParserByLanguage('NonExistentLanguage' as ProgrammingLanguage);
    assert.strictEqual(unknownParser, null, 'Should return null for non-existent language');
  });

  test('should list all supported languages', () => {
    const languages = ParserFactory.getSupportedLanguages();
    
    assert.ok(Array.isArray(languages), 'Should return an array');
    assert.ok(languages.length >= 7, 'Should support at least 7 languages');
    
    // Check for key languages
    assert.ok(languages.includes(ProgrammingLanguage.TYPESCRIPT), 'Should include TypeScript');
    assert.ok(languages.includes(ProgrammingLanguage.PYTHON), 'Should include Python');
    assert.ok(languages.includes(ProgrammingLanguage.JAVA), 'Should include Java');
    assert.ok(languages.includes(ProgrammingLanguage.RUBY), 'Should include Ruby');
    assert.ok(languages.includes(ProgrammingLanguage.PHP), 'Should include PHP');
    assert.ok(languages.includes(ProgrammingLanguage.HTML), 'Should include HTML');
    assert.ok(languages.includes(ProgrammingLanguage.CSS), 'Should include CSS');
  });

  test('should get all parsers', () => {
    const parsers = ParserFactory.getAllParsers();
    
    assert.ok(Array.isArray(parsers), 'Should return an array');
    assert.ok(parsers.length >= 8, 'Should have at least 8 parsers (including default)');
    
    // Check parser types
    const parserLanguages = parsers.map(p => p.getSupportedLanguage());
    assert.ok(parserLanguages.includes(ProgrammingLanguage.TYPESCRIPT), 'Should include TypeScript parser');
    assert.ok(parserLanguages.includes(ProgrammingLanguage.PYTHON), 'Should include Python parser');
    assert.ok(parserLanguages.includes(ProgrammingLanguage.JAVA), 'Should include Java parser');
    assert.ok(parserLanguages.includes(ProgrammingLanguage.RUBY), 'Should include Ruby parser');
    assert.ok(parserLanguages.includes(ProgrammingLanguage.PHP), 'Should include PHP parser');
    assert.ok(parserLanguages.includes(ProgrammingLanguage.HTML), 'Should include HTML parser');
    assert.ok(parserLanguages.includes(ProgrammingLanguage.CSS), 'Should include CSS parser');
    assert.ok(parserLanguages.includes(ProgrammingLanguage.UNKNOWN), 'Should include default parser');
  });

  test('should register and use custom parsers', () => {
    // Create a mock custom parser
    const customLanguage = 'Custom' as ProgrammingLanguage;
    class CustomParser {
      getSupportedLanguage() { return customLanguage; }
      canParse() { return true; }
      extractFunctions() { return []; }
      extractEnhancedFunctions() { return []; }
      getConfidence() { return 0.9; }
    }

    const customParser = new CustomParser() as any;
    ParserFactory.registerParser(customParser);

    // Check that custom parser is now available
    const languages = ParserFactory.getSupportedLanguages();
    assert.ok(languages.includes(customLanguage), 'Should include custom language');

    const retrievedParser = ParserFactory.getParserByLanguage(customLanguage);
    assert.ok(retrievedParser, 'Should retrieve custom parser');
    assert.strictEqual(retrievedParser!.getSupportedLanguage(), customLanguage);
  });

  test('should prioritize parsers by confidence and language match', () => {
    // Test with JavaScript file (should prefer TypeScript parser due to language match)
    const jsDoc = createMockDocument('typescript');
    jsDoc.languageId = 'javascript';
    jsDoc.fileName = '/test/file.js';
    
    const parser = ParserFactory.getBestParser(jsDoc);
    assert.strictEqual(parser.getSupportedLanguage(), ProgrammingLanguage.TYPESCRIPT, 'Should select TypeScript parser for JavaScript');

    // Test confidence scoring
    const stats = ParserFactory.getParserStats(jsDoc);
    assert.ok(stats.confidence > 0.5, 'Should have reasonable confidence for JavaScript files');
  });

  test('should handle file extension vs language ID conflicts gracefully', () => {
    // File with .py extension but TypeScript language ID (unusual but possible)
    const conflictDoc = createMockDocument('python');
    conflictDoc.languageId = 'typescript';
    conflictDoc.fileName = '/test/file.py';
    
    const parser = ParserFactory.getBestParser(conflictDoc);
    // Should prefer language ID over file extension
    assert.strictEqual(parser.getSupportedLanguage(), ProgrammingLanguage.TYPESCRIPT);
  });

  test('should provide detailed statistics for diagnostics', () => {
    const complexDoc = createMockDocument('typescript', 'complex');
    const stats = ParserFactory.getParserStats(complexDoc);
    
    assert.ok(stats.detectedLanguage === ProgrammingLanguage.TYPESCRIPT, 'Should detect TypeScript');
    assert.ok(stats.selectedParser === ProgrammingLanguage.TYPESCRIPT, 'Should select TypeScript parser');
    assert.ok(stats.availableParsers.includes(ProgrammingLanguage.TYPESCRIPT), 'Available parsers should include TypeScript');
    assert.ok(stats.confidence >= 0.8, 'Should have high confidence for TypeScript files');
  });

  test('should handle edge cases gracefully', () => {
    // Empty document
    const emptyDoc = createMockDocument('typescript');
    emptyDoc.getText = () => '';
    
    const emptyParser = ParserFactory.getBestParser(emptyDoc);
    assert.ok(emptyParser, 'Should return a parser for empty documents');
    
    // Document with no language information
    const unknownDoc = createMockDocument('typescript');
    unknownDoc.languageId = '';
    unknownDoc.fileName = '';
    
    const unknownParser = ParserFactory.getBestParser(unknownDoc);
    assert.ok(unknownParser, 'Should return a parser for unknown documents');
    assert.strictEqual(unknownParser.getSupportedLanguage(), ProgrammingLanguage.UNKNOWN);
  });

  test('should maintain parser order for consistent selection', () => {
    const doc = createMockDocument('typescript');
    
    // Get parser multiple times
    const parser1 = ParserFactory.getBestParser(doc);
    const parser2 = ParserFactory.getBestParser(doc);
    const parser3 = ParserFactory.getBestParser(doc);
    
    // Should consistently return the same parser type
    assert.strictEqual(parser1.getSupportedLanguage(), parser2.getSupportedLanguage());
    assert.strictEqual(parser2.getSupportedLanguage(), parser3.getSupportedLanguage());
  });

  test('should handle complex language detection scenarios', () => {
    // Test Vue.js file (HTML with embedded JavaScript)
    const vueContent = `
<template>
  <div>{{ message }}</div>
</template>
<script>
export default {
  data() {
    return { message: 'Hello Vue!' }
  }
}
</script>`;
    
    const vueDoc = createMockDocument('html');
    vueDoc.getText = () => vueContent;
    vueDoc.fileName = '/test/component.vue';
    vueDoc.languageId = 'vue';
    
    const vueParser = ParserFactory.getBestParser(vueDoc);
    // Should detect as HTML due to template structure
    assert.ok([ProgrammingLanguage.HTML, ProgrammingLanguage.UNKNOWN].includes(vueParser.getSupportedLanguage()));

    // Test TypeScript React file
    const tsxContent = `
import React from 'react';
export const Component: React.FC = () => {
  return <div>Hello TSX!</div>;
};`;
    
    const tsxDoc = createMockDocument('typescript');
    tsxDoc.getText = () => tsxContent;
    tsxDoc.fileName = '/test/component.tsx';
    tsxDoc.languageId = 'typescriptreact';
    
    const tsxParser = ParserFactory.getBestParser(tsxDoc);
    assert.strictEqual(tsxParser.getSupportedLanguage(), ProgrammingLanguage.TYPESCRIPT);
  });
});