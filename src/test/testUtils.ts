import * as vscode from 'vscode';

/**
 * Enhanced mock implementation of vscode.TextDocument for testing
 */
export class MockTextDocument implements vscode.TextDocument {
  private _content: string;
  uri: vscode.Uri;
  fileName: string;
  isUntitled: boolean = false;
  languageId: string;
  version: number = 1;
  isDirty: boolean = false;
  isClosed: boolean = false;
  eol: vscode.EndOfLine = vscode.EndOfLine.LF;
  lineCount: number = 0;
  encoding: any = 'utf8';

  constructor(
    content: string, 
    fileName: string = '/mock-document.ts', 
    languageId: string = 'typescript'
  ) {
    this._content = content;
    this.fileName = fileName;
    this.languageId = languageId;
    this.uri = vscode.Uri.parse(`file://${fileName}`);
    this.lineCount = content.split('\n').length;
  }

  getText(): string {
    return this._content;
  }

  positionAt(offset: number): vscode.Position {
    const text = this._content.substring(0, offset);
    const lines = text.split('\n');
    const line = lines.length - 1;
    const character = lines[line].length;
    return new vscode.Position(line, character);
  }

  // Required interface methods (not needed for parser tests)
  getWordRangeAtPosition(): vscode.Range { throw new Error('Not implemented'); }
  lineAt(): vscode.TextLine { throw new Error('Not implemented'); }
  offsetAt(): number { throw new Error('Not implemented'); }
  save(): Thenable<boolean> { throw new Error('Not implemented'); }
  validateRange(): vscode.Range { throw new Error('Not implemented'); }
  validatePosition(): vscode.Position { throw new Error('Not implemented'); }
}

/**
 * Sample code snippets for testing different languages
 */
export const TestCodeSamples = {
  // TypeScript/JavaScript samples
  typescript: {
    simple: `
function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

const calculate = (a: number, b: number) => {
  return a + b;
};

class Calculator {
  public add(x: number, y: number): number {
    return x + y;
  }
  
  private multiply(x: number, y: number): number {
    if (x === 0 || y === 0) {
      return 0;
    }
    return x * y;
  }
}`,
    complex: `
import React, { useState, useEffect } from 'react';

interface Props {
  items: string[];
  onSelect: (item: string) => void;
}

const ItemList: React.FC<Props> = ({ items, onSelect }) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [filteredItems, setFilteredItems] = useState<string[]>(items);

  useEffect(() => {
    setFilteredItems(items.filter(item => item.length > 0));
  }, [items]);

  const handleClick = (index: number) => {
    if (index >= 0 && index < filteredItems.length) {
      setSelectedIndex(index);
      onSelect(filteredItems[index]);
    }
  };

  return (
    <div>
      {filteredItems.map((item, index) => (
        <button
          key={index}
          onClick={() => handleClick(index)}
          className={index === selectedIndex ? 'selected' : ''}
        >
          {item}
        </button>
      ))}
    </div>
  );
};`
  },

  // Python samples
  python: `
def fibonacci(n):
    """Calculate fibonacci number recursively."""
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

class Calculator:
    def __init__(self, precision=2):
        self.precision = precision
    
    def add(self, a, b):
        result = a + b
        return round(result, self.precision)
    
    def divide(self, a, b):
        if b == 0:
            raise ValueError("Cannot divide by zero")
        return round(a / b, self.precision)

async def fetch_data(url, timeout=30):
    import asyncio
    import aiohttp
    
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(url, timeout=timeout) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    return None
        except asyncio.TimeoutError:
            return None`,

  // Java samples
  java: `
package com.example.calculator;

import java.util.List;
import java.util.stream.Collectors;

public class Calculator {
    private double precision = 0.001;
    
    public Calculator() {
        this.precision = 0.001;
    }
    
    public Calculator(double precision) {
        this.precision = precision;
    }
    
    public double add(double a, double b) {
        return a + b;
    }
    
    public static double multiply(double a, double b) {
        return a * b;
    }
    
    public List<Double> processNumbers(List<Double> numbers) {
        return numbers.stream()
            .filter(n -> n != null)
            .filter(n -> n > 0)
            .map(n -> n * 2)
            .collect(Collectors.toList());
    }
    
    private boolean isValid(double number) {
        return !Double.isNaN(number) && !Double.isInfinite(number);
    }
}`,

  // Ruby samples
  ruby: `
class Calculator
  attr_reader :precision
  
  def initialize(precision = 2)
    @precision = precision
  end
  
  def add(a, b)
    result = a + b
    result.round(@precision)
  end
  
  def self.multiply(a, b)
    a * b
  end
  
  def divide(a, b)
    raise ArgumentError, "Cannot divide by zero" if b.zero?
    result = a.to_f / b
    result.round(@precision)
  end
  
  def process_numbers(numbers)
    numbers
      .select { |n| n.is_a?(Numeric) && n > 0 }
      .map { |n| n * 2 }
      .sort
  end
  
  private
  
  def valid?(number)
    number.is_a?(Numeric) && !number.nan? && !number.infinite?
  end
end

def fibonacci(n)
  return n if n <= 1
  fibonacci(n - 1) + fibonacci(n - 2)
end`,

  // PHP samples  
  php: `
<?php

namespace App\\Services;

use Exception;

class Calculator {
    private float $precision;
    
    public function __construct(float $precision = 0.001) {
        $this->precision = $precision;
    }
    
    public function add(float $a, float $b): float {
        return $a + $b;
    }
    
    public static function multiply(float $a, float $b): float {
        return $a * $b;
    }
    
    public function divide(float $a, float $b): float {
        if ($b === 0.0) {
            throw new Exception("Cannot divide by zero");
        }
        return $a / $b;
    }
    
    public function processNumbers(array $numbers): array {
        return array_filter(
            array_map(
                function($n) { return $n * 2; },
                array_filter($numbers, function($n) { 
                    return is_numeric($n) && $n > 0; 
                })
            )
        );
    }
    
    private function isValid(float $number): bool {
        return !is_nan($number) && !is_infinite($number);
    }
}

function fibonacci(int $n): int {
    if ($n <= 1) {
        return $n;
    }
    return fibonacci($n - 1) + fibonacci($n - 2);
}

$calculator = new Calculator(2);
echo $calculator->add(10, 20);
?>`,

  // HTML samples
  html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Calculator App</title>
    <style>
        .calculator {
            max-width: 300px;
            margin: 0 auto;
            padding: 20px;
            border: 1px solid #ccc;
        }
        
        .display {
            width: 100%;
            height: 50px;
            font-size: 24px;
            text-align: right;
            margin-bottom: 10px;
        }
        
        .buttons {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 5px;
        }
        
        button {
            height: 50px;
            font-size: 18px;
        }
    </style>
</head>
<body>
    <div class="calculator">
        <input type="text" class="display" id="display" readonly>
        <div class="buttons">
            <button onclick="clearDisplay()">C</button>
            <button onclick="appendToDisplay('/')">/</button>
            <button onclick="appendToDisplay('*')">*</button>
            <button onclick="deleteLast()">Del</button>
            
            <button onclick="appendToDisplay('7')">7</button>
            <button onclick="appendToDisplay('8')">8</button>
            <button onclick="appendToDisplay('9')">9</button>
            <button onclick="appendToDisplay('-')">-</button>
        </div>
    </div>
    
    <script>
        function appendToDisplay(value) {
            const display = document.getElementById('display');
            display.value += value;
        }
        
        function clearDisplay() {
            document.getElementById('display').value = '';
        }
        
        function calculate() {
            const display = document.getElementById('display');
            try {
                display.value = eval(display.value);
            } catch (error) {
                display.value = 'Error';
            }
        }
        
        function deleteLast() {
            const display = document.getElementById('display');
            display.value = display.value.slice(0, -1);
        }
    </script>
</body>
</html>`,

  // CSS samples
  css: `
/* Modern CSS with Grid and Animations */
:root {
  --primary-color: #3498db;
  --secondary-color: #2ecc71;
  --danger-color: #e74c3c;
  --border-radius: 8px;
  --box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.calculator {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-gap: 10px;
  max-width: 400px;
  margin: 50px auto;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
}

.display {
  grid-column: 1 / -1;
  background: #fff;
  border: none;
  border-radius: var(--border-radius);
  padding: 20px;
  font-size: 2em;
  text-align: right;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.button {
  background: var(--primary-color);
  border: none;
  border-radius: var(--border-radius);
  color: white;
  font-size: 1.2em;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.button:hover {
  background: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.button:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.button.operator {
  background: var(--secondary-color);
}

.button.operator:hover {
  background: #27ae60;
}

.button.clear {
  background: var(--danger-color);
}

.button.clear:hover {
  background: #c0392b;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.button.equals {
  animation: pulse 2s infinite;
  background: var(--secondary-color);
  grid-column: span 2;
}

@media (max-width: 480px) {
  .calculator {
    max-width: 300px;
    grid-gap: 5px;
    padding: 15px;
  }
  
  .button {
    padding: 15px;
    font-size: 1em;
  }
  
  .display {
    padding: 15px;
    font-size: 1.5em;
  }
}`
};

/**
 * Expected results for test samples
 */
export const ExpectedResults = {
  typescript: {
    simple: [
      { name: 'greet', startLine: 1, complexity: { cyclomatic: 1, nesting: 0 } },
      { name: 'calculate', startLine: 5, complexity: { cyclomatic: 1, nesting: 0 } },
      { name: 'add', startLine: 10, complexity: { cyclomatic: 1, nesting: 0 } },
      { name: 'multiply', startLine: 14, complexity: { cyclomatic: 2, nesting: 1 } }
    ],
    complex: [
      { name: 'ItemList', startLine: 7, complexity: { cyclomatic: 4, nesting: 2 } },
      { name: 'handleClick', startLine: 15, complexity: { cyclomatic: 2, nesting: 1 } }
    ]
  },
  
  python: [
    { name: 'fibonacci', startLine: 1, complexity: { cyclomatic: 2, nesting: 1 } },
    { name: '__init__', startLine: 6, complexity: { cyclomatic: 1, nesting: 0 } },
    { name: 'add', startLine: 9, complexity: { cyclomatic: 1, nesting: 0 } },
    { name: 'divide', startLine: 13, complexity: { cyclomatic: 2, nesting: 1 } },
    { name: 'fetch_data', startLine: 17, complexity: { cyclomatic: 3, nesting: 2 } }
  ],
  
  java: [
    { name: 'Calculator (constructor)', startLine: 8, complexity: { cyclomatic: 1, nesting: 0 } },
    { name: 'Calculator (constructor)', startLine: 12, complexity: { cyclomatic: 1, nesting: 0 } },
    { name: 'add', startLine: 16, complexity: { cyclomatic: 1, nesting: 0 } },
    { name: 'multiply (static)', startLine: 20, complexity: { cyclomatic: 1, nesting: 0 } },
    { name: 'processNumbers', startLine: 24, complexity: { cyclomatic: 4, nesting: 0 } },
    { name: 'isValid (private)', startLine: 31, complexity: { cyclomatic: 1, nesting: 0 } }
  ],
  
  ruby: [
    { name: 'initialize', startLine: 4, complexity: { cyclomatic: 1, nesting: 0 } },
    { name: 'add', startLine: 8, complexity: { cyclomatic: 1, nesting: 0 } },
    { name: 'multiply (class method)', startLine: 13, complexity: { cyclomatic: 1, nesting: 0 } },
    { name: 'divide', startLine: 17, complexity: { cyclomatic: 2, nesting: 1 } },
    { name: 'process_numbers', startLine: 23, complexity: { cyclomatic: 4, nesting: 0 } },
    { name: 'valid? (predicate)', startLine: 32, complexity: { cyclomatic: 1, nesting: 0 } },
    { name: 'fibonacci', startLine: 36, complexity: { cyclomatic: 2, nesting: 1 } }
  ]
};

/**
 * Helper function to create mock documents for different languages
 */
export function createMockDocument(
  language: keyof typeof TestCodeSamples, 
  variant: string = 'simple'
): MockTextDocument {
  const extensionMap = {
    typescript: '.ts',
    python: '.py',
    java: '.java',
    ruby: '.rb',
    php: '.php',
    html: '.html',
    css: '.css'
  };
  
  const languageIdMap = {
    typescript: 'typescript',
    python: 'python',
    java: 'java',
    ruby: 'ruby',
    php: 'php',
    html: 'html',
    css: 'css'
  };
  
  const extension = extensionMap[language] || '.txt';
  const languageId = languageIdMap[language] || 'plaintext';
  const fileName = `/test/mock${extension}`;
  
  const content = typeof TestCodeSamples[language] === 'string' 
    ? TestCodeSamples[language] 
    : (TestCodeSamples[language] as any)[variant] || '';
  
  return new MockTextDocument(content, fileName, languageId);
}

/**
 * Assert helper for testing parser results
 */
export function assertParserResult(
  actual: any[], 
  expected: any[], 
  testName: string
): void {
  if (actual.length !== expected.length) {
    throw new Error(
      `${testName}: Expected ${expected.length} functions, but found ${actual.length}`
    );
  }
  
  for (let i = 0; i < expected.length; i++) {
    const exp = expected[i];
    const act = actual[i];
    
    if (exp.name && act.name !== exp.name) {
      throw new Error(
        `${testName}: Function ${i} name mismatch. Expected '${exp.name}', got '${act.name}'`
      );
    }
    
    if (exp.startLine !== undefined && act.startLine !== exp.startLine) {
      throw new Error(
        `${testName}: Function '${act.name}' start line mismatch. Expected ${exp.startLine}, got ${act.startLine}`
      );
    }
    
    if (exp.complexity) {
      if (exp.complexity.cyclomatic !== undefined && 
          act.cyclomaticComplexity !== exp.complexity.cyclomatic) {
        throw new Error(
          `${testName}: Function '${act.name}' cyclomatic complexity mismatch. Expected ${exp.complexity.cyclomatic}, got ${act.cyclomaticComplexity}`
        );
      }
    }
  }
}