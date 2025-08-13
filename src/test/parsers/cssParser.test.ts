import * as assert from 'assert';
import { CssParser } from '../../services/parsers/cssParser';
import { createMockDocument, TestCodeSamples } from '../testUtils';

suite('CSS Parser Test Suite', () => {
  let parser: CssParser;

  setup(() => {
    parser = new CssParser();
  });

  test('should identify CSS files correctly', () => {
    const cssDoc = createMockDocument('css');
    const tsDoc = createMockDocument('typescript');
    
    assert.strictEqual(parser.canParse(cssDoc), true);
    assert.strictEqual(parser.canParse(tsDoc), false);
    assert.strictEqual(parser.getSupportedLanguage(), 'CSS');
  });

  test('should extract CSS rules as functions', () => {
    const document = createMockDocument('css');
    const functions = parser.extractFunctions(document);
    
    assert.ok(functions.length >= 8, 'Should find at least 8 CSS rules in sample');
    
    // Verify some rule names
    const functionNames = functions.map(f => f.name);
    assert.ok(functionNames.includes(':root'), 'Should find CSS custom properties');
    assert.ok(functionNames.includes('.calculator'), 'Should find calculator class');
    assert.ok(functionNames.includes('.display'), 'Should find display class');
    assert.ok(functionNames.includes('.button'), 'Should find button class');
    assert.ok(functionNames.includes('.button:hover'), 'Should find hover pseudo-class');
    assert.ok(functionNames.includes('@keyframes pulse'), 'Should find keyframe animation');
    assert.ok(functionNames.includes('@media (max-width: 480px)'), 'Should find media query');
  });

  test('should extract enhanced functions with complexity metrics', () => {
    const document = createMockDocument('css');
    const enhancedFunctions = parser.extractEnhancedFunctions(document);
    
    assert.ok(enhancedFunctions.length >= 8, 'Should find multiple CSS rules with metrics');
    
    // Find complex rules
    const calculatorRule = enhancedFunctions.find(f => f.name === '.calculator');
    assert.ok(calculatorRule, 'calculator rule should be found');
    assert.ok(calculatorRule.cyclomaticComplexity >= 2, 'calculator should have complexity from grid and properties');
    
    const mediaQuery = enhancedFunctions.find(f => f.name.includes('@media'));
    assert.ok(mediaQuery, 'media query should be found');
    assert.ok(mediaQuery.cyclomaticComplexity >= 2, 'media query should have complexity from nested rules');
    
    // Check that functions have reasonable metrics
    enhancedFunctions.forEach(func => {
      assert.ok(func.cyclomaticComplexity >= 1, `${func.name} should have at least base complexity`);
      assert.ok(func.nestingDepth >= 0, `${func.name} should have non-negative nesting depth`);
    });
  });

  test('should handle SCSS/Sass syntax correctly', () => {
    const scssCode = `
$primary-color: #3498db;
$secondary-color: #2ecc71;
$font-stack: 'Helvetica Neue', sans-serif;

@mixin button-style($bg-color, $text-color: white) {
  background-color: $bg-color;
  color: $text-color;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  
  &:hover {
    background-color: darken($bg-color, 10%);
  }
  
  &:active {
    transform: translateY(1px);
  }
}

@function calculate-rem($pixels) {
  @return $pixels / 16px * 1rem;
}

%flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}

.navigation {
  @extend %flex-center;
  background: $primary-color;
  
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    
    li {
      display: inline-block;
      
      a {
        @include button-style($primary-color);
        text-decoration: none;
        font-family: $font-stack;
        font-size: calculate-rem(16px);
        
        &.active {
          background-color: $secondary-color;
        }
        
        &:hover {
          transform: scale(1.05);
        }
      }
    }
  }
}

.card {
  @extend %flex-center;
  flex-direction: column;
  padding: 20px;
  
  &--highlighted {
    border: 2px solid $primary-color;
  }
  
  .title {
    font-size: calculate-rem(24px);
    margin-bottom: 10px;
  }
  
  .content {
    font-size: calculate-rem(14px);
  }
}

@media (max-width: 768px) {
  .navigation {
    flex-direction: column;
    
    ul li {
      display: block;
      width: 100%;
    }
  }
  
  .card {
    padding: 10px;
    
    .title {
      font-size: calculate-rem(20px);
    }
  }
}`;

    const document = createMockDocument('css');
    document.getText = () => scssCode;
    
    const functions = parser.extractFunctions(document);
    const functionNames = functions.map(f => f.name);
    
    assert.ok(functionNames.includes('@mixin button-style'), 'Should detect SCSS mixins');
    assert.ok(functionNames.includes('@function calculate-rem'), 'Should detect SCSS functions');
    assert.ok(functionNames.includes('%flex-center'), 'Should detect SCSS placeholders');
    assert.ok(functionNames.includes('.navigation'), 'Should detect nested SCSS rules');
    assert.ok(functionNames.includes('.navigation ul'), 'Should detect deeply nested rules');
    assert.ok(functionNames.includes('.navigation ul li a'), 'Should detect deeply nested selectors');
    assert.ok(functionNames.includes('.card'), 'Should detect SCSS classes with modifiers');
    assert.ok(functionNames.includes('.card--highlighted'), 'Should detect BEM modifier classes');
    assert.ok(functionNames.includes('@media (max-width: 768px)'), 'Should detect SCSS media queries');
  });

  test('should handle modern CSS features', () => {
    const modernCssCode = `
:root {
  --primary: hsl(210, 100%, 50%);
  --secondary: hsl(120, 100%, 40%);
  --text: hsl(0, 0%, 20%);
  --spacing: clamp(1rem, 5vw, 3rem);
}

.container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  grid-gap: var(--spacing);
  container-type: inline-size;
}

.card {
  background: linear-gradient(45deg, var(--primary), var(--secondary));
  border-radius: 1rem;
  padding: var(--spacing);
  container-type: inline-size;
  
  &:has(.special-content) {
    border: 2px solid var(--primary);
  }
}

@container (min-width: 400px) {
  .card {
    padding: calc(var(--spacing) * 2);
    
    .title {
      font-size: clamp(1.5rem, 4vw, 2.5rem);
    }
  }
}

.interactive-element {
  background: color-mix(in srgb, var(--primary) 80%, white);
  transition: all 0.3s ease;
  
  &:hover {
    background: color-mix(in srgb, var(--primary) 60%, white);
    transform: translateY(-2px);
  }
  
  &:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
  }
}

.grid-layout {
  display: grid;
  grid-template-areas: 
    "header header"
    "sidebar main"
    "footer footer";
  grid-template-rows: auto 1fr auto;
  grid-template-columns: 250px 1fr;
  min-height: 100vh;
  
  .header {
    grid-area: header;
  }
  
  .sidebar {
    grid-area: sidebar;
  }
  
  .main {
    grid-area: main;
  }
  
  .footer {
    grid-area: footer;
  }
}

@supports (backdrop-filter: blur(10px)) {
  .modal {
    backdrop-filter: blur(10px);
    background: rgba(255, 255, 255, 0.1);
  }
}

@layer base, components, utilities;

@layer base {
  * {
    box-sizing: border-box;
  }
  
  body {
    margin: 0;
    font-family: system-ui, sans-serif;
  }
}

@layer components {
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
  }
}`;

    const document = createMockDocument('css');
    document.getText = () => modernCssCode;
    
    const functions = parser.extractFunctions(document);
    const functionNames = functions.map(f => f.name);
    
    assert.ok(functionNames.includes(':root'), 'Should detect CSS custom properties');
    assert.ok(functionNames.includes('.container'), 'Should detect CSS Grid containers');
    assert.ok(functionNames.includes('.card:has(.special-content)'), 'Should detect :has() pseudo-class');
    assert.ok(functionNames.includes('@container (min-width: 400px)'), 'Should detect container queries');
    assert.ok(functionNames.includes('.interactive-element:focus-visible'), 'Should detect modern pseudo-classes');
    assert.ok(functionNames.includes('.grid-layout'), 'Should detect grid template areas');
    assert.ok(functionNames.includes('@supports (backdrop-filter: blur(10px))'), 'Should detect feature queries');
    assert.ok(functionNames.includes('@layer base'), 'Should detect CSS layers');
    assert.ok(functionNames.includes('@layer components'), 'Should detect layer components');
  });

  test('should provide appropriate confidence scores', () => {
    const cssDocument = createMockDocument('css');
    cssDocument.languageId = 'css';
    cssDocument.fileName = '/test/file.css';
    
    const scssDocument = createMockDocument('css');
    scssDocument.languageId = 'scss';
    scssDocument.fileName = '/test/file.scss';
    
    const tsDocument = createMockDocument('typescript');
    
    assert.ok(parser.getConfidence(cssDocument) >= 0.9, 'Should have high confidence for CSS files');
    assert.ok(parser.getConfidence(scssDocument) >= 0.8, 'Should have good confidence for SCSS files');
    assert.ok(parser.getConfidence(tsDocument) < 0.3, 'Should have low confidence for TypeScript files');
  });

  test('should handle CSS-in-JS and styled-components', () => {
    const cssInJsCode = `
const Button = styled.button\`
  background: \${props => props.primary ? 'blue' : 'white'};
  color: \${props => props.primary ? 'white' : 'blue'};
  font-size: 1em;
  margin: 1em;
  padding: 0.25em 1em;
  border: 2px solid blue;
  border-radius: 3px;
  
  &:hover {
    background: \${props => props.primary ? 'darkblue' : 'lightgray'};
  }
  
  &:focus {
    outline: 2px solid orange;
  }
\`;

const Container = styled.div\`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  
  \${Button} {
    margin-top: 1rem;
  }
  
  @media (max-width: 768px) {
    padding: 1rem;
    
    \${Button} {
      width: 100%;
    }
  }
\`;

const theme = {
  colors: {
    primary: '#007bff',
    secondary: '#6c757d'
  }
};

const ThemedButton = styled(Button)\`
  background: \${props => props.theme.colors.primary};
  border-color: \${props => props.theme.colors.primary};
\`;`;

    const document = createMockDocument('css');
    document.getText = () => cssInJsCode;
    
    const functions = parser.extractFunctions(document);
    const functionNames = functions.map(f => f.name);
    
    // CSS-in-JS should still detect some CSS-like patterns
    assert.ok(functions.length > 0, 'Should detect some patterns in CSS-in-JS');
  });

  test('should handle edge cases gracefully', () => {
    // Empty file
    const emptyDoc = createMockDocument('css');
    emptyDoc.getText = () => '';
    const emptyFunctions = parser.extractFunctions(emptyDoc);
    assert.strictEqual(emptyFunctions.length, 0, 'Should handle empty files');

    // File with no CSS rules
    const noRulesDoc = createMockDocument('css');
    noRulesDoc.getText = () => '/* Just comments */ // And more comments';
    const noRules = parser.extractFunctions(noRulesDoc);
    assert.strictEqual(noRules.length, 0, 'Should handle files with no CSS rules');

    // File with broken CSS (should not crash)
    const brokenDoc = createMockDocument('css');
    brokenDoc.getText = () => '.broken { color: red; missing-brace';
    assert.doesNotThrow(() => {
      parser.extractFunctions(brokenDoc);
    }, 'Should handle broken CSS gracefully');
  });
});