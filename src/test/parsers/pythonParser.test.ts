import * as assert from 'assert';
import { PythonParser } from '../../services/parsers/pythonParser';
import { createMockDocument, TestCodeSamples } from '../testUtils';

suite('Python Parser Test Suite', () => {
  let parser: PythonParser;

  setup(() => {
    parser = new PythonParser();
  });

  test('should identify Python files correctly', () => {
    const pyDoc = createMockDocument('python');
    const tsDoc = createMockDocument('typescript');
    
    assert.strictEqual(parser.canParse(pyDoc), true);
    assert.strictEqual(parser.canParse(tsDoc), false);
    assert.strictEqual(parser.getSupportedLanguage(), 'Python');
  });

  test('should extract functions from Python code', () => {
    const document = createMockDocument('python');
    const functions = parser.extractFunctions(document);
    
    assert.ok(functions.length >= 4, 'Should find at least 4 functions in Python sample');
    
    // Verify function names
    const functionNames = functions.map(f => f.name);
    assert.ok(functionNames.includes('fibonacci'), 'Should find fibonacci function');
    assert.ok(functionNames.includes('__init__'), 'Should find constructor method');
    assert.ok(functionNames.includes('add'), 'Should find add method');
    assert.ok(functionNames.includes('divide'), 'Should find divide method');
    assert.ok(functionNames.includes('fetch_data'), 'Should find async function');
  });

  test('should extract enhanced functions with complexity metrics', () => {
    const document = createMockDocument('python');
    const enhancedFunctions = parser.extractEnhancedFunctions(document);
    
    assert.ok(enhancedFunctions.length >= 4, 'Should find multiple functions with metrics');
    
    // Find the fibonacci function
    const fibFunc = enhancedFunctions.find(f => f.name === 'fibonacci');
    assert.ok(fibFunc, 'fibonacci function should be found');
    assert.ok(fibFunc.cyclomaticComplexity >= 2, 'fibonacci should have conditional complexity');
    
    // Find the divide function
    const divideFunc = enhancedFunctions.find(f => f.name === 'divide');
    assert.ok(divideFunc, 'divide function should be found');
    assert.ok(divideFunc.cyclomaticComplexity >= 2, 'divide should have exception handling complexity');
    
    // Find the async function
    const fetchFunc = enhancedFunctions.find(f => f.name === 'fetch_data');
    assert.ok(fetchFunc, 'fetch_data function should be found');
    assert.ok(fetchFunc.cyclomaticComplexity >= 3, 'async function should have error handling complexity');
  });

  test('should handle Python-specific syntax', () => {
    const pythonCode = `
class DataProcessor:
    def __init__(self, config=None):
        self.config = config or {}
    
    @property
    def is_ready(self):
        return bool(self.config)
    
    @staticmethod
    def validate_data(data):
        return isinstance(data, dict) and 'id' in data
    
    @classmethod
    def from_config(cls, config_path):
        with open(config_path) as f:
            config = json.load(f)
        return cls(config)
    
    def process_items(self, items):
        for item in items:
            if self.validate_data(item):
                yield self._transform_item(item)
    
    def _transform_item(self, item):
        # Private method
        return {**item, 'processed': True}

def list_comprehension_example():
    return [x**2 for x in range(10) if x % 2 == 0]

async def async_generator():
    for i in range(5):
        await asyncio.sleep(0.1)
        yield i
`;

    const document = createMockDocument('python');
    document.getText = () => pythonCode;
    
    const functions = parser.extractFunctions(document);
    const functionNames = functions.map(f => f.name);
    
    assert.ok(functionNames.includes('__init__'), 'Should detect constructor');
    assert.ok(functionNames.includes('is_ready'), 'Should detect property methods');
    assert.ok(functionNames.includes('validate_data'), 'Should detect static methods');
    assert.ok(functionNames.includes('from_config'), 'Should detect class methods');
    assert.ok(functionNames.includes('process_items'), 'Should detect generator methods');
    assert.ok(functionNames.includes('_transform_item'), 'Should detect private methods');
    assert.ok(functionNames.includes('list_comprehension_example'), 'Should detect standalone functions');
    assert.ok(functionNames.includes('async_generator'), 'Should detect async generators');
  });

  test('should provide appropriate confidence scores', () => {
    const pyDocument = createMockDocument('python');
    pyDocument.languageId = 'python';
    pyDocument.fileName = '/test/file.py';
    
    const tsDocument = createMockDocument('typescript');
    
    assert.ok(parser.getConfidence(pyDocument) >= 0.9, 'Should have high confidence for Python files');
    assert.ok(parser.getConfidence(tsDocument) < 0.3, 'Should have low confidence for TypeScript files');
  });

  test('should handle indentation-based syntax correctly', () => {
    const indentedCode = `
def outer_function():
    def inner_function():
        def deeply_nested():
            return "deep"
        return deeply_nested()
    
    if True:
        def conditional_function():
            pass
    
    return inner_function()

class NestedClass:
    def method_with_nested_def(self):
        def local_helper():
            return 42
        return local_helper()
`;

    const document = createMockDocument('python');
    document.getText = () => indentedCode;
    
    const functions = parser.extractFunctions(document);
    const functionNames = functions.map(f => f.name);
    
    assert.ok(functionNames.includes('outer_function'), 'Should detect outer function');
    assert.ok(functionNames.includes('inner_function'), 'Should detect nested functions');
    assert.ok(functionNames.includes('deeply_nested'), 'Should detect deeply nested functions');
    assert.ok(functionNames.includes('conditional_function'), 'Should detect conditionally defined functions');
    assert.ok(functionNames.includes('method_with_nested_def'), 'Should detect class methods');
    assert.ok(functionNames.includes('local_helper'), 'Should detect locally defined helpers');
  });

  test('should handle edge cases gracefully', () => {
    // Empty file
    const emptyDoc = createMockDocument('python');
    emptyDoc.getText = () => '';
    const emptyFunctions = parser.extractFunctions(emptyDoc);
    assert.strictEqual(emptyFunctions.length, 0, 'Should handle empty files');

    // File with no functions
    const noFuncDoc = createMockDocument('python');
    noFuncDoc.getText = () => 'x = 1\ny = 2\nprint(x + y)';
    const noFunctions = parser.extractFunctions(noFuncDoc);
    assert.strictEqual(noFunctions.length, 0, 'Should handle files with no functions');

    // File with incomplete function (should not crash)
    const incompleteDoc = createMockDocument('python');
    incompleteDoc.getText = () => 'def incomplete_function(\n    # missing closing parenthesis';
    assert.doesNotThrow(() => {
      parser.extractFunctions(incompleteDoc);
    }, 'Should handle incomplete syntax gracefully');
  });
});