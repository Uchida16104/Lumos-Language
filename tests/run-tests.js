const { compiler, interpret, compileFile } = require('../index-enhanced.cjs');
const fs = require('fs');
const path = require('path');

class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(description, testFn) {
    this.tests.push({ description, testFn });
  }

  assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(`${message}\nExpected: ${expected}\nActual: ${actual}`);
    }
  }

  assertContains(actual, substring, message) {
    if (!actual.includes(substring)) {
      throw new Error(`${message}\nExpected to contain: ${substring}\nActual: ${actual}`);
    }
  }

  assertThrows(fn, message) {
    try {
      fn();
      throw new Error(`${message}\nExpected function to throw but it did not`);
    } catch (error) {
      if (error.message.includes('Expected function to throw')) {
        throw error;
      }
    }
  }

  async run() {
    console.log('\n=== Running Lumos Language Tests ===\n');

    for (const test of this.tests) {
      try {
        await test.testFn();
        this.passed++;
        console.log(`✓ ${test.description}`);
      } catch (error) {
        this.failed++;
        console.log(`✗ ${test.description}`);
        console.log(`  Error: ${error.message}`);
      }
    }

    console.log(`\n=== Test Results ===`);
    console.log(`Total: ${this.tests.length}`);
    console.log(`Passed: ${this.passed}`);
    console.log(`Failed: ${this.failed}`);
    console.log(`Success Rate: ${((this.passed / this.tests.length) * 100).toFixed(2)}%\n`);

    return this.failed === 0;
  }
}

const runner = new TestRunner();

runner.test('Variable declaration and assignment', () => {
  const result = interpret('let x = 5');
  runner.assertEqual(result, 'x = 5', 'Variable declaration failed');
});

runner.test('Arithmetic operations', () => {
  interpret('let a = 10');
  interpret('let b = 20');
  const result = interpret('let c = a + b');
  runner.assertContains(result, '30', 'Arithmetic operation failed');
});

runner.test('Function definition', () => {
  const result = interpret('def test(x) { let y = x * 2 }');
  runner.assertEqual(result, 'Function test defined.', 'Function definition failed');
});

runner.test('For loop execution', () => {
  const result = interpret('for i = 1 to 5 { let x = i }');
  runner.assertContains(result, 'Looped', 'For loop failed');
});

runner.test('While loop execution', () => {
  interpret('let count = 0');
  const result = interpret('while (count < 3) { let count = count + 1 }');
  runner.assertEqual(result, 'While loop executed.', 'While loop failed');
});

runner.test('If-else conditional', () => {
  interpret('let val = 15');
  const result = interpret('if (val > 10) { let status = "high" } else { let status = "low" }');
  runner.assertContains(result, 'high', 'If-else conditional failed');
});

runner.test('Times iteration', () => {
  const result = interpret('3.times do |i| { let x = i }');
  runner.assertContains(result, '0', 'Times iteration failed');
});

runner.test('Compilation to JavaScript', () => {
  const code = 'let x = 5';
  const compiled = compiler.compile(code, 'javascript');
  runner.assertContains(compiled, 'let x', 'JavaScript compilation failed');
});

runner.test('Compilation to TypeScript', () => {
  const code = 'let name = "test"';
  const compiled = compiler.compile(code, 'typescript');
  runner.assertContains(compiled, 'any', 'TypeScript compilation failed');
});

runner.test('Compilation to Python', () => {
  const code = 'let value = 42';
  const compiled = compiler.compile(code, 'python');
  runner.assertContains(compiled, 'value', 'Python compilation failed');
});

runner.test('Compilation to Rust', () => {
  const code = 'let num = 10';
  const compiled = compiler.compile(code, 'rust');
  runner.assertContains(compiled, 'let', 'Rust compilation failed');
});

runner.test('Compilation to C', () => {
  const code = 'let integer = 100';
  const compiled = compiler.compile(code, 'c');
  runner.assertContains(compiled, 'int', 'C compilation failed');
});

runner.test('Compilation to Go', () => {
  const code = 'let data = 50';
  const compiled = compiler.compile(code, 'go');
  runner.assertContains(compiled, 'package', 'Go compilation failed');
});

runner.test('Compilation to PHP', () => {
  const code = 'let text = "hello"';
  const compiled = compiler.compile(code, 'php');
  runner.assertContains(compiled, '<?php', 'PHP compilation failed');
});

runner.test('Compilation to Ruby', () => {
  const code = 'let result = 25';
  const compiled = compiler.compile(code, 'ruby');
  runner.assertContains(compiled, 'result', 'Ruby compilation failed');
});

runner.test('Compilation to Java', () => {
  const code = 'let object = 1';
  const compiled = compiler.compile(code, 'java');
  runner.assertContains(compiled, 'class', 'Java compilation failed');
});

runner.test('Compilation to C#', () => {
  const code = 'let property = 99';
  const compiled = compiler.compile(code, 'csharp');
  runner.assertContains(compiled, 'namespace', 'C# compilation failed');
});

runner.test('Compilation to Elixir', () => {
  const code = 'let atom = 7';
  const compiled = compiler.compile(code, 'elixir');
  runner.assertContains(compiled, 'defmodule', 'Elixir compilation failed');
});

runner.test('Compilation to F#', () => {
  const code = 'let func = 3';
  const compiled = compiler.compile(code, 'fsharp');
  runner.assertContains(compiled, 'let', 'F# compilation failed');
});

runner.test('Error handling for invalid expressions', () => {
  runner.assertThrows(
    () => interpret('let x ='),
    'Should throw error for invalid expression'
  );
});

runner.test('Error handling for undefined functions', () => {
  runner.assertThrows(
    () => interpret('undefinedFunc()'),
    'Should throw error for undefined function'
  );
});

runner.test('Tokenizer creates correct tokens', () => {
  const tokens = compiler.tokenize('let x = 5');
  runner.assertEqual(tokens.length >= 4, true, 'Tokenizer should create multiple tokens');
});

runner.test('Parser creates AST', () => {
  const tokens = compiler.tokenize('let x = 5');
  const ast = compiler.parse(tokens);
  runner.assertEqual(ast.type, 'Program', 'Parser should create Program node');
});

runner.test('Type inference for numbers', () => {
  const type = compiler.typeSystem.inferType({ type: 'Literal', value: 42 });
  runner.assertEqual(type, 'number', 'Should infer number type');
});

runner.test('Type inference for strings', () => {
  const type = compiler.typeSystem.inferType({ type: 'Literal', value: 'text' });
  runner.assertEqual(type, 'string', 'Should infer string type');
});

runner.test('Optimizer performs constant folding', () => {
  const ir = [
    { op: '+', arg1: 2, arg2: 3, result: 't0' }
  ];
  const optimizer = new (require('../src/compiler/core/compiler').Optimizer)();
  const optimized = optimizer.constantFolding(ir);
  runner.assertEqual(optimized[0].op, 'assign', 'Should fold constants');
});

runner.test('Multiple variable declarations', () => {
  interpret('let a = 1');
  interpret('let b = 2');
  interpret('let c = 3');
  const result = interpret('let sum = a + b + c');
  runner.assertContains(result, '6', 'Multiple variables failed');
});

runner.test('Nested conditionals', () => {
  interpret('let x = 15');
  const result = interpret('if (x > 10) { if (x > 20) { let level = "high" } else { let level = "medium" } } else { let level = "low" }');
  runner.assertContains(result, 'medium', 'Nested conditionals failed');
});

runner.test('Function with parameters', () => {
  interpret('def multiply(a, b) { let product = a * b }');
  const result = interpret('multiply(6, 7)');
  runner.assertContains(result, '42', 'Function with parameters failed');
});

runner.run().then(success => {
  process.exit(success ? 0 : 1);
});
