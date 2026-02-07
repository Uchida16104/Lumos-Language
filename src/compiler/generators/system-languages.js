class RustGenerator {
  constructor() {
    this.indentLevel = 0;
    this.indentString = '    ';
  }

  generate(ir) {
    const code = [];
    
    const functions = this.groupByFunctions(ir);
    
    for (const func of functions) {
      code.push(this.generateFunction(func));
      code.push('');
    }
    
    code.push('fn main() {');
    code.push('}');
    
    return code.join('\n');
  }

  groupByFunctions(ir) {
    const functions = [];
    let current = { name: 'main', params: [], body: [] };
    
    for (const inst of ir) {
      if (inst.op === 'function') {
        if (current.body.length > 0) {
          functions.push(current);
        }
        current = { name: inst.arg1, params: [], body: [] };
      } else if (inst.op === 'param') {
        current.params.push(inst.arg1);
      } else if (inst.op === 'end_function') {
        functions.push(current);
        current = { name: 'main', params: [], body: [] };
      } else {
        current.body.push(inst);
      }
    }
    
    if (current.body.length > 0) {
      functions.push(current);
    }
    
    return functions;
  }

  generateFunction(func) {
    const lines = [];
    const params = func.params.map(p => `${p}: i64`).join(', ');
    
    lines.push(`fn ${func.name}(${params}) -> i64 {`);
    this.indentLevel++;
    
    for (const inst of func.body) {
      const line = this.generateInstruction(inst);
      if (line) {
        lines.push(this.indent() + line);
      }
    }
    
    if (func.body.length === 0 || func.body[func.body.length - 1].op !== 'return') {
      lines.push(this.indent() + '0');
    }
    
    this.indentLevel--;
    lines.push('}');
    
    return lines.join('\n');
  }

  generateInstruction(inst) {
    switch (inst.op) {
      case 'assign':
        return `let mut ${inst.result} = ${this.formatValue(inst.arg1)};`;
      
      case '+':
      case '-':
      case '*':
      case '/':
      case '%':
        return `let ${inst.result} = ${this.formatValue(inst.arg1)} ${inst.op} ${this.formatValue(inst.arg2)};`;
      
      case 'call':
        return `let ${inst.result} = ${inst.arg1}();`;
      
      case 'return':
        return inst.arg1 ? this.formatValue(inst.arg1) : '0';
      
      default:
        return '';
    }
  }

  formatValue(value) {
    if (typeof value === 'string') {
      if (value.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
        return value;
      }
      return `"${value}"`;
    }
    return String(value);
  }

  indent() {
    return this.indentString.repeat(this.indentLevel);
  }
}

class CGenerator {
  constructor() {
    this.indentLevel = 0;
    this.indentString = '    ';
  }

  generate(ir) {
    const code = [];
    code.push('#include <stdio.h>');
    code.push('#include <stdlib.h>');
    code.push('');
    
    const functions = this.groupByFunctions(ir);
    
    for (const func of functions) {
      code.push(this.generateFunctionDeclaration(func));
    }
    code.push('');
    
    for (const func of functions) {
      code.push(this.generateFunction(func));
      code.push('');
    }
    
    code.push('int main(void) {');
    code.push('    return 0;');
    code.push('}');
    
    return code.join('\n');
  }

  groupByFunctions(ir) {
    const functions = [];
    let current = { name: 'main', params: [], body: [] };
    
    for (const inst of ir) {
      if (inst.op === 'function') {
        if (current.body.length > 0) {
          functions.push(current);
        }
        current = { name: inst.arg1, params: [], body: [] };
      } else if (inst.op === 'param') {
        current.params.push(inst.arg1);
      } else if (inst.op === 'end_function') {
        functions.push(current);
        current = { name: 'main', params: [], body: [] };
      } else {
        current.body.push(inst);
      }
    }
    
    if (current.body.length > 0) {
      functions.push(current);
    }
    
    return functions;
  }

  generateFunctionDeclaration(func) {
    const params = func.params.map(p => `int ${p}`).join(', ');
    return `int ${func.name}(${params});`;
  }

  generateFunction(func) {
    const lines = [];
    const params = func.params.map(p => `int ${p}`).join(', ');
    
    lines.push(`int ${func.name}(${params}) {`);
    this.indentLevel++;
    
    for (const inst of func.body) {
      const line = this.generateInstruction(inst);
      if (line) {
        lines.push(this.indent() + line);
      }
    }
    
    if (func.body.length === 0 || func.body[func.body.length - 1].op !== 'return') {
      lines.push(this.indent() + 'return 0;');
    }
    
    this.indentLevel--;
    lines.push('}');
    
    return lines.join('\n');
  }

  generateInstruction(inst) {
    switch (inst.op) {
      case 'assign':
        return `int ${inst.result} = ${this.formatValue(inst.arg1)};`;
      
      case '+':
      case '-':
      case '*':
      case '/':
      case '%':
        return `int ${inst.result} = ${this.formatValue(inst.arg1)} ${inst.op} ${this.formatValue(inst.arg2)};`;
      
      case 'call':
        return `int ${inst.result} = ${inst.arg1}();`;
      
      case 'return':
        return inst.arg1 ? `return ${this.formatValue(inst.arg1)};` : 'return 0;';
      
      default:
        return '';
    }
  }

  formatValue(value) {
    if (typeof value === 'string') {
      if (value.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
        return value;
      }
      return `"${value}"`;
    }
    return String(value);
  }

  indent() {
    return this.indentString.repeat(this.indentLevel);
  }
}

class CppGenerator extends CGenerator {
  generate(ir) {
    const code = [];
    code.push('#include <iostream>');
    code.push('#include <string>');
    code.push('');
    code.push('using namespace std;');
    code.push('');
    
    const functions = this.groupByFunctions(ir);
    
    for (const func of functions) {
      code.push(this.generateFunctionDeclaration(func));
    }
    code.push('');
    
    for (const func of functions) {
      code.push(this.generateFunction(func));
      code.push('');
    }
    
    code.push('int main() {');
    code.push('    return 0;');
    code.push('}');
    
    return code.join('\n');
  }

  generateFunctionDeclaration(func) {
    const params = func.params.map(p => `auto ${p}`).join(', ');
    return `auto ${func.name}(${params}) -> int;`;
  }

  generateFunction(func) {
    const lines = [];
    const params = func.params.map(p => `auto ${p}`).join(', ');
    
    lines.push(`auto ${func.name}(${params}) -> int {`);
    this.indentLevel++;
    
    for (const inst of func.body) {
      const line = this.generateInstruction(inst);
      if (line) {
        lines.push(this.indent() + line);
      }
    }
    
    if (func.body.length === 0 || func.body[func.body.length - 1].op !== 'return') {
      lines.push(this.indent() + 'return 0;');
    }
    
    this.indentLevel--;
    lines.push('}');
    
    return lines.join('\n');
  }

  generateInstruction(inst) {
    switch (inst.op) {
      case 'assign':
        return `auto ${inst.result} = ${this.formatValue(inst.arg1)};`;
      
      case '+':
      case '-':
      case '*':
      case '/':
      case '%':
        return `auto ${inst.result} = ${this.formatValue(inst.arg1)} ${inst.op} ${this.formatValue(inst.arg2)};`;
      
      case 'call':
        return `auto ${inst.result} = ${inst.arg1}();`;
      
      case 'return':
        return inst.arg1 ? `return ${this.formatValue(inst.arg1)};` : 'return 0;';
      
      default:
        return '';
    }
  }
}

class CSharpGenerator {
  constructor() {
    this.indentLevel = 0;
    this.indentString = '    ';
  }

  generate(ir) {
    const code = [];
    code.push('using System;');
    code.push('');
    code.push('namespace LumosProgram');
    code.push('{');
    this.indentLevel++;
    
    code.push(this.indent() + 'class Program');
    code.push(this.indent() + '{');
    this.indentLevel++;
    
    const functions = this.groupByFunctions(ir);
    
    for (const func of functions) {
      const funcCode = this.generateFunction(func);
      funcCode.split('\n').forEach(line => {
        code.push(this.indent() + line);
      });
      code.push('');
    }
    
    code.push(this.indent() + 'static void Main(string[] args)');
    code.push(this.indent() + '{');
    code.push(this.indent() + '}');
    
    this.indentLevel--;
    code.push(this.indent() + '}');
    
    this.indentLevel--;
    code.push('}');
    
    return code.join('\n');
  }

  groupByFunctions(ir) {
    const functions = [];
    let current = { name: 'main', params: [], body: [] };
    
    for (const inst of ir) {
      if (inst.op === 'function') {
        if (current.body.length > 0) {
          functions.push(current);
        }
        current = { name: inst.arg1, params: [], body: [] };
      } else if (inst.op === 'param') {
        current.params.push(inst.arg1);
      } else if (inst.op === 'end_function') {
        functions.push(current);
        current = { name: 'main', params: [], body: [] };
      } else {
        current.body.push(inst);
      }
    }
    
    if (current.body.length > 0) {
      functions.push(current);
    }
    
    return functions;
  }

  generateFunction(func) {
    const lines = [];
    const params = func.params.map(p => `object ${p}`).join(', ');
    
    lines.push(`static object ${func.name}(${params})`);
    lines.push('{');
    
    const tempIndent = this.indentLevel;
    this.indentLevel = 0;
    
    for (const inst of func.body) {
      const line = this.generateInstruction(inst);
      if (line) {
        lines.push(this.indentString + line);
      }
    }
    
    if (func.body.length === 0 || func.body[func.body.length - 1].op !== 'return') {
      lines.push(this.indentString + 'return null;');
    }
    
    this.indentLevel = tempIndent;
    
    lines.push('}');
    
    return lines.join('\n');
  }

  generateInstruction(inst) {
    switch (inst.op) {
      case 'assign':
        return `var ${inst.result} = ${this.formatValue(inst.arg1)};`;
      
      case '+':
      case '-':
      case '*':
      case '/':
      case '%':
        return `var ${inst.result} = ${this.formatValue(inst.arg1)} ${inst.op} ${this.formatValue(inst.arg2)};`;
      
      case 'call':
        return `var ${inst.result} = ${inst.arg1}();`;
      
      case 'return':
        return inst.arg1 ? `return ${this.formatValue(inst.arg1)};` : 'return null;';
      
      default:
        return '';
    }
  }

  formatValue(value) {
    if (typeof value === 'string') {
      if (value.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
        return value;
      }
      return `"${value}"`;
    }
    return String(value);
  }

  indent() {
    return this.indentString.repeat(this.indentLevel);
  }
}

class JavaGenerator {
  constructor() {
    this.indentLevel = 0;
    this.indentString = '    ';
  }

  generate(ir) {
    const code = [];
    code.push('public class LumosProgram {');
    this.indentLevel++;
    
    const functions = this.groupByFunctions(ir);
    
    for (const func of functions) {
      const funcCode = this.generateFunction(func);
      funcCode.split('\n').forEach(line => {
        code.push(this.indent() + line);
      });
      code.push('');
    }
    
    code.push(this.indent() + 'public static void main(String[] args) {');
    code.push(this.indent() + '}');
    
    this.indentLevel--;
    code.push('}');
    
    return code.join('\n');
  }

  groupByFunctions(ir) {
    const functions = [];
    let current = { name: 'main', params: [], body: [] };
    
    for (const inst of ir) {
      if (inst.op === 'function') {
        if (current.body.length > 0) {
          functions.push(current);
        }
        current = { name: inst.arg1, params: [], body: [] };
      } else if (inst.op === 'param') {
        current.params.push(inst.arg1);
      } else if (inst.op === 'end_function') {
        functions.push(current);
        current = { name: 'main', params: [], body: [] };
      } else {
        current.body.push(inst);
      }
    }
    
    if (current.body.length > 0) {
      functions.push(current);
    }
    
    return functions;
  }

  generateFunction(func) {
    const lines = [];
    const params = func.params.map(p => `Object ${p}`).join(', ');
    
    lines.push(`public static Object ${func.name}(${params}) {`);
    
    const tempIndent = this.indentLevel;
    this.indentLevel = 0;
    
    for (const inst of func.body) {
      const line = this.generateInstruction(inst);
      if (line) {
        lines.push(this.indentString + line);
      }
    }
    
    if (func.body.length === 0 || func.body[func.body.length - 1].op !== 'return') {
      lines.push(this.indentString + 'return null;');
    }
    
    this.indentLevel = tempIndent;
    
    lines.push('}');
    
    return lines.join('\n');
  }

  generateInstruction(inst) {
    switch (inst.op) {
      case 'assign':
        return `Object ${inst.result} = ${this.formatValue(inst.arg1)};`;
      
      case '+':
      case '-':
      case '*':
      case '/':
      case '%':
        return `Object ${inst.result} = ${this.formatValue(inst.arg1)} ${inst.op} ${this.formatValue(inst.arg2)};`;
      
      case 'call':
        return `Object ${inst.result} = ${inst.arg1}();`;
      
      case 'return':
        return inst.arg1 ? `return ${this.formatValue(inst.arg1)};` : 'return null;';
      
      default:
        return '';
    }
  }

  formatValue(value) {
    if (typeof value === 'string') {
      if (value.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
        return value;
      }
      return `"${value}"`;
    }
    return String(value);
  }

  indent() {
    return this.indentString.repeat(this.indentLevel);
  }
}

class ElixirGenerator {
  constructor() {
    this.indentLevel = 0;
    this.indentString = '  ';
  }

  generate(ir) {
    const code = [];
    code.push('defmodule LumosProgram do');
    this.indentLevel++;
    
    const functions = this.groupByFunctions(ir);
    
    for (const func of functions) {
      const funcCode = this.generateFunction(func);
      funcCode.split('\n').forEach(line => {
        code.push(this.indent() + line);
      });
      code.push('');
    }
    
    this.indentLevel--;
    code.push('end');
    
    return code.join('\n');
  }

  groupByFunctions(ir) {
    const functions = [];
    let current = { name: 'main', params: [], body: [] };
    
    for (const inst of ir) {
      if (inst.op === 'function') {
        if (current.body.length > 0) {
          functions.push(current);
        }
        current = { name: inst.arg1, params: [], body: [] };
      } else if (inst.op === 'param') {
        current.params.push(inst.arg1);
      } else if (inst.op === 'end_function') {
        functions.push(current);
        current = { name: 'main', params: [], body: [] };
      } else {
        current.body.push(inst);
      }
    }
    
    if (current.body.length > 0) {
      functions.push(current);
    }
    
    return functions;
  }

  generateFunction(func) {
    const lines = [];
    const params = func.params.join(', ');
    
    lines.push(`def ${func.name}(${params}) do`);
    
    const tempIndent = this.indentLevel;
    this.indentLevel = 0;
    
    for (const inst of func.body) {
      const line = this.generateInstruction(inst);
      if (line) {
        lines.push(this.indentString + line);
      }
    }
    
    if (func.body.length === 0 || func.body[func.body.length - 1].op !== 'return') {
      lines.push(this.indentString + 'nil');
    }
    
    this.indentLevel = tempIndent;
    
    lines.push('end');
    
    return lines.join('\n');
  }

  generateInstruction(inst) {
    switch (inst.op) {
      case 'assign':
        return `${inst.result} = ${this.formatValue(inst.arg1)}`;
      
      case '+':
      case '-':
      case '*':
      case '/':
        return `${inst.result} = ${this.formatValue(inst.arg1)} ${inst.op} ${this.formatValue(inst.arg2)}`;
      
      case '%':
        return `${inst.result} = rem(${this.formatValue(inst.arg1)}, ${this.formatValue(inst.arg2)})`;
      
      case 'call':
        return `${inst.result} = ${inst.arg1}()`;
      
      case 'return':
        return inst.arg1 ? this.formatValue(inst.arg1) : 'nil';
      
      default:
        return '';
    }
  }

  formatValue(value) {
    if (typeof value === 'string') {
      if (value.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
        return value;
      }
      return `"${value}"`;
    }
    return String(value);
  }

  indent() {
    return this.indentString.repeat(this.indentLevel);
  }
}

class FSharpGenerator {
  constructor() {
    this.indentLevel = 0;
    this.indentString = '    ';
  }

  generate(ir) {
    const code = [];
    
    const functions = this.groupByFunctions(ir);
    
    for (const func of functions) {
      code.push(this.generateFunction(func));
      code.push('');
    }
    
    code.push('[<EntryPoint>]');
    code.push('let main argv =');
    code.push('    0');
    
    return code.join('\n');
  }

  groupByFunctions(ir) {
    const functions = [];
    let current = { name: 'main', params: [], body: [] };
    
    for (const inst of ir) {
      if (inst.op === 'function') {
        if (current.body.length > 0) {
          functions.push(current);
        }
        current = { name: inst.arg1, params: [], body: [] };
      } else if (inst.op === 'param') {
        current.params.push(inst.arg1);
      } else if (inst.op === 'end_function') {
        functions.push(current);
        current = { name: 'main', params: [], body: [] };
      } else {
        current.body.push(inst);
      }
    }
    
    if (current.body.length > 0) {
      functions.push(current);
    }
    
    return functions;
  }

  generateFunction(func) {
    const lines = [];
    const params = func.params.join(' ');
    
    lines.push(`let ${func.name} ${params} =`);
    this.indentLevel++;
    
    for (const inst of func.body) {
      const line = this.generateInstruction(inst);
      if (line) {
        lines.push(this.indent() + line);
      }
    }
    
    if (func.body.length === 0 || func.body[func.body.length - 1].op !== 'return') {
      lines.push(this.indent() + '0');
    }
    
    this.indentLevel--;
    
    return lines.join('\n');
  }

  generateInstruction(inst) {
    switch (inst.op) {
      case 'assign':
        return `let ${inst.result} = ${this.formatValue(inst.arg1)}`;
      
      case '+':
      case '-':
      case '*':
      case '/':
      case '%':
        return `let ${inst.result} = ${this.formatValue(inst.arg1)} ${inst.op} ${this.formatValue(inst.arg2)}`;
      
      case 'call':
        return `let ${inst.result} = ${inst.arg1}()`;
      
      case 'return':
        return inst.arg1 ? this.formatValue(inst.arg1) : '0';
      
      default:
        return '';
    }
  }

  formatValue(value) {
    if (typeof value === 'string') {
      if (value.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
        return value;
      }
      return `"${value}"`;
    }
    return String(value);
  }

  indent() {
    return this.indentString.repeat(this.indentLevel);
  }
}

class AdaGenerator {
  constructor() {
    this.indentLevel = 0;
    this.indentString = '   ';
  }

  generate(ir) {
    const code = [];
    code.push('with Ada.Text_IO; use Ada.Text_IO;');
    code.push('');
    code.push('procedure Lumos_Program is');
    this.indentLevel++;
    
    const functions = this.groupByFunctions(ir);
    
    for (const func of functions) {
      const funcCode = this.generateFunction(func);
      funcCode.split('\n').forEach(line => {
        code.push(this.indent() + line);
      });
      code.push('');
    }
    
    this.indentLevel--;
    code.push('begin');
    this.indentLevel++;
    code.push(this.indent() + 'null;');
    this.indentLevel--;
    code.push('end Lumos_Program;');
    
    return code.join('\n');
  }

  groupByFunctions(ir) {
    const functions = [];
    let current = { name: 'Main', params: [], body: [] };
    
    for (const inst of ir) {
      if (inst.op === 'function') {
        if (current.body.length > 0) {
          functions.push(current);
        }
        current = { name: this.capitalize(inst.arg1), params: [], body: [] };
      } else if (inst.op === 'param') {
        current.params.push(inst.arg1);
      } else if (inst.op === 'end_function') {
        functions.push(current);
        current = { name: 'Main', params: [], body: [] };
      } else {
        current.body.push(inst);
      }
    }
    
    if (current.body.length > 0) {
      functions.push(current);
    }
    
    return functions;
  }

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  generateFunction(func) {
    const lines = [];
    const params = func.params.map(p => `${this.capitalize(p)} : Integer`).join('; ');
    
    lines.push(`function ${func.name}(${params}) return Integer is`);
    
    const tempIndent = this.indentLevel;
    this.indentLevel = 0;
    
    for (const inst of func.body) {
      const line = this.generateInstruction(inst);
      if (line && !line.startsWith('begin') && !line.startsWith('end')) {
        lines.push(this.indentString + line);
      }
    }
    
    lines.push('begin');
    lines.push(this.indentString + 'return 0;');
    lines.push(`end ${func.name};`);
    
    this.indentLevel = tempIndent;
    
    return lines.join('\n');
  }

  generateInstruction(inst) {
    switch (inst.op) {
      case 'assign':
        return `${this.capitalize(inst.result)} : Integer := ${this.formatValue(inst.arg1)};`;
      
      case '+':
      case '-':
      case '*':
      case '/':
        return `${this.capitalize(inst.result)} : Integer := ${this.formatValue(inst.arg1)} ${inst.op} ${this.formatValue(inst.arg2)};`;
      
      case '%':
        return `${this.capitalize(inst.result)} : Integer := ${this.formatValue(inst.arg1)} mod ${this.formatValue(inst.arg2)};`;
      
      case 'call':
        return `${this.capitalize(inst.result)} : Integer := ${this.capitalize(inst.arg1)};`;
      
      case 'return':
        return '';
      
      default:
        return '';
    }
  }

  formatValue(value) {
    if (typeof value === 'string') {
      if (value.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
        return this.capitalize(value);
      }
      return `"${value}"`;
    }
    return String(value);
  }

  indent() {
    return this.indentString.repeat(this.indentLevel);
  }
}

class DlangGenerator {
  constructor() {
    this.indentLevel = 0;
    this.indentString = '    ';
  }

  generate(ir) {
    const code = [];
    code.push('import std.stdio;');
    code.push('');
    
    const functions = this.groupByFunctions(ir);
    
    for (const func of functions) {
      code.push(this.generateFunction(func));
      code.push('');
    }
    
    code.push('void main() {');
    code.push('}');
    
    return code.join('\n');
  }

  groupByFunctions(ir) {
    const functions = [];
    let current = { name: 'main', params: [], body: [] };
    
    for (const inst of ir) {
      if (inst.op === 'function') {
        if (current.body.length > 0) {
          functions.push(current);
        }
        current = { name: inst.arg1, params: [], body: [] };
      } else if (inst.op === 'param') {
        current.params.push(inst.arg1);
      } else if (inst.op === 'end_function') {
        functions.push(current);
        current = { name: 'main', params: [], body: [] };
      } else {
        current.body.push(inst);
      }
    }
    
    if (current.body.length > 0) {
      functions.push(current);
    }
    
    return functions;
  }

  generateFunction(func) {
    const lines = [];
    const params = func.params.map(p => `long ${p}`).join(', ');
    
    lines.push(`long ${func.name}(${params}) {`);
    this.indentLevel++;
    
    for (const inst of func.body) {
      const line = this.generateInstruction(inst);
      if (line) {
        lines.push(this.indent() + line);
      }
    }
    
    if (func.body.length === 0 || func.body[func.body.length - 1].op !== 'return') {
      lines.push(this.indent() + 'return 0;');
    }
    
    this.indentLevel--;
    lines.push('}');
    
    return lines.join('\n');
  }

  generateInstruction(inst) {
    switch (inst.op) {
      case 'assign':
        return `auto ${inst.result} = ${this.formatValue(inst.arg1)};`;
      
      case '+':
      case '-':
      case '*':
      case '/':
      case '%':
        return `auto ${inst.result} = ${this.formatValue(inst.arg1)} ${inst.op} ${this.formatValue(inst.arg2)};`;
      
      case 'call':
        return `auto ${inst.result} = ${inst.arg1}();`;
      
      case 'return':
        return inst.arg1 ? `return ${this.formatValue(inst.arg1)};` : 'return 0;';
      
      default:
        return '';
    }
  }

  formatValue(value) {
    if (typeof value === 'string') {
      if (value.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
        return value;
      }
      return `"${value}"`;
    }
    return String(value);
  }

  indent() {
    return this.indentString.repeat(this.indentLevel);
  }
}

class AssemblyGenerator {
  constructor() {
    this.registerAlloc = new Map();
    this.nextRegister = 0;
    this.labelCounter = 0;
  }

  generate(ir) {
    const code = [];
    code.push('section .text');
    code.push('global _start');
    code.push('');
    code.push('_start:');
    
    for (const inst of ir) {
      const asm = this.generateInstruction(inst);
      if (asm) {
        code.push('    ' + asm);
      }
    }
    
    code.push('    mov eax, 1');
    code.push('    xor ebx, ebx');
    code.push('    int 0x80');
    
    return code.join('\n');
  }

  generateInstruction(inst) {
    switch (inst.op) {
      case 'assign':
        if (typeof inst.arg1 === 'number') {
          return `mov dword [${inst.result}], ${inst.arg1}`;
        }
        return `mov eax, [${inst.arg1}]
    mov [${inst.result}], eax`;
      
      case '+':
        return `mov eax, [${inst.arg1}]
    add eax, [${inst.arg2}]
    mov [${inst.result}], eax`;
      
      case '-':
        return `mov eax, [${inst.arg1}]
    sub eax, [${inst.arg2}]
    mov [${inst.result}], eax`;
      
      case '*':
        return `mov eax, [${inst.arg1}]
    imul eax, [${inst.arg2}]
    mov [${inst.result}], eax`;
      
      case '/':
        return `mov eax, [${inst.arg1}]
    xor edx, edx
    idiv dword [${inst.arg2}]
    mov [${inst.result}], eax`;
      
      case 'return':
        return '';
      
      default:
        return '';
    }
  }
}

class LLVMGenerator {
  constructor() {
    this.nextTemp = 0;
    this.nextLabel = 0;
  }

  generate(ir) {
    const code = [];
    code.push('define i32 @main() {');
    code.push('entry:');
    
    for (const inst of ir) {
      const llvm = this.generateInstruction(inst);
      if (llvm) {
        code.push('  ' + llvm);
      }
    }
    
    code.push('  ret i32 0');
    code.push('}');
    
    return code.join('\n');
  }

  generateInstruction(inst) {
    switch (inst.op) {
      case 'assign':
        if (typeof inst.arg1 === 'number') {
          return `%${inst.result} = alloca i32
  store i32 ${inst.arg1}, i32* %${inst.result}`;
        }
        return `%${inst.result} = load i32, i32* %${inst.arg1}`;
      
      case '+':
        return `%${inst.result} = add i32 %${inst.arg1}, %${inst.arg2}`;
      
      case '-':
        return `%${inst.result} = sub i32 %${inst.arg1}, %${inst.arg2}`;
      
      case '*':
        return `%${inst.result} = mul i32 %${inst.arg1}, %${inst.arg2}`;
      
      case '/':
        return `%${inst.result} = sdiv i32 %${inst.arg1}, %${inst.arg2}`;
      
      case '%':
        return `%${inst.result} = srem i32 %${inst.arg1}, %${inst.arg2}`;
      
      case 'return':
        return inst.arg1 ? `ret i32 %${inst.arg1}` : 'ret i32 0';
      
      default:
        return '';
    }
  }
}

module.exports = {
  RustGenerator,
  CGenerator,
  CppGenerator,
  CSharpGenerator,
  JavaGenerator,
  ElixirGenerator,
  FSharpGenerator,
  AdaGenerator,
  DlangGenerator,
  AssemblyGenerator,
  LLVMGenerator
};
