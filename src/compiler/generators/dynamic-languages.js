class JavaScriptGenerator {
  constructor() {
    this.indentLevel = 0;
    this.indentString = '  ';
  }

  generate(ir) {
    const code = [];
    code.push('"use strict";');
    code.push('');
    
    for (const inst of ir) {
      const line = this.generateInstruction(inst);
      if (line) {
        code.push(this.indent() + line);
      }
    }
    
    return code.join('\n');
  }

  generateInstruction(inst) {
    switch (inst.op) {
      case 'function':
        this.indentLevel--;
        const funcDecl = `function ${inst.arg1}() {`;
        this.indentLevel++;
        return funcDecl;
      
      case 'end_function':
        this.indentLevel--;
        return '}';
      
      case 'param':
        return ``;
      
      case 'assign':
        if (typeof inst.arg1 === 'string' && inst.arg1.startsWith('t')) {
          return `const ${inst.result} = ${inst.arg1};`;
        }
        return `let ${inst.result} = ${this.formatValue(inst.arg1)};`;
      
      case '+':
        return `const ${inst.result} = ${this.formatValue(inst.arg1)} + ${this.formatValue(inst.arg2)};`;
      
      case '-':
        return `const ${inst.result} = ${this.formatValue(inst.arg1)} - ${this.formatValue(inst.arg2)};`;
      
      case '*':
        return `const ${inst.result} = ${this.formatValue(inst.arg1)} * ${this.formatValue(inst.arg2)};`;
      
      case '/':
        return `const ${inst.result} = ${this.formatValue(inst.arg1)} / ${this.formatValue(inst.arg2)};`;
      
      case '%':
        return `const ${inst.result} = ${this.formatValue(inst.arg1)} % ${this.formatValue(inst.arg2)};`;
      
      case 'call':
        return `const ${inst.result} = ${inst.arg1}();`;
      
      case 'push':
        return ``;
      
      case 'return':
        return inst.arg1 ? `return ${this.formatValue(inst.arg1)};` : 'return;';
      
      case 'if_false':
        return `if (!${this.formatValue(inst.arg1)}) { goto ${inst.result}; }`;
      
      case 'goto':
        return ``;
      
      case 'label':
        this.indentLevel--;
        const label = `${inst.arg1}:`;
        this.indentLevel++;
        return label;
      
      default:
        return ``;
    }
  }

  formatValue(value) {
    if (typeof value === 'string') {
      if (value.startsWith('t') || value.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
        return value;
      }
      return `"${value}"`;
    }
    return String(value);
  }

  indent() {
    return this.indentString.repeat(Math.max(0, this.indentLevel));
  }
}

class TypeScriptGenerator extends JavaScriptGenerator {
  generate(ir) {
    const code = [];
    code.push('');
    
    const functions = this.groupByFunctions(ir);
    
    for (const func of functions) {
      code.push(this.generateFunction(func));
      code.push('');
    }
    
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
    const params = func.params.map(p => `${p}: any`).join(', ');
    
    lines.push(`function ${func.name}(${params}): any {`);
    this.indentLevel++;
    
    for (const inst of func.body) {
      const line = this.generateInstruction(inst);
      if (line) {
        lines.push(this.indent() + line);
      }
    }
    
    this.indentLevel--;
    lines.push('}');
    
    return lines.join('\n');
  }

  generateInstruction(inst) {
    switch (inst.op) {
      case 'assign':
        if (typeof inst.arg1 === 'string' && inst.arg1.startsWith('t')) {
          return `const ${inst.result}: any = ${inst.arg1};`;
        }
        return `let ${inst.result}: any = ${this.formatValue(inst.arg1)};`;
      
      case '+':
      case '-':
      case '*':
      case '/':
      case '%':
        return `const ${inst.result}: number = ${this.formatValue(inst.arg1)} ${inst.op} ${this.formatValue(inst.arg2)};`;
      
      default:
        return super.generateInstruction(inst);
    }
  }
}

class PythonGenerator {
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
    
    lines.push(`def ${func.name}(${params}):`);
    this.indentLevel++;
    
    if (func.body.length === 0) {
      lines.push(this.indent() + 'pass');
    } else {
      for (const inst of func.body) {
        const line = this.generateInstruction(inst);
        if (line) {
          lines.push(this.indent() + line);
        }
      }
    }
    
    this.indentLevel--;
    
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
      case '%':
        return `${inst.result} = ${this.formatValue(inst.arg1)} ${inst.op} ${this.formatValue(inst.arg2)}`;
      
      case 'call':
        return `${inst.result} = ${inst.arg1}()`;
      
      case 'return':
        return inst.arg1 ? `return ${this.formatValue(inst.arg1)}` : 'return';
      
      case 'if_false':
        return `if not ${this.formatValue(inst.arg1)}:`;
      
      case 'label':
        return ``;
      
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

class PHPGenerator {
  constructor() {
    this.indentLevel = 0;
    this.indentString = '    ';
  }

  generate(ir) {
    const code = [];
    code.push('<?php');
    code.push('');
    
    const functions = this.groupByFunctions(ir);
    
    for (const func of functions) {
      code.push(this.generateFunction(func));
      code.push('');
    }
    
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
    const params = func.params.map(p => `$${p}`).join(', ');
    
    lines.push(`function ${func.name}(${params}) {`);
    this.indentLevel++;
    
    for (const inst of func.body) {
      const line = this.generateInstruction(inst);
      if (line) {
        lines.push(this.indent() + line);
      }
    }
    
    this.indentLevel--;
    lines.push('}');
    
    return lines.join('\n');
  }

  generateInstruction(inst) {
    switch (inst.op) {
      case 'assign':
        return `$${inst.result} = ${this.formatValue(inst.arg1)};`;
      
      case '+':
      case '-':
      case '*':
      case '/':
      case '%':
        return `$${inst.result} = ${this.formatValue(inst.arg1)} ${inst.op} ${this.formatValue(inst.arg2)};`;
      
      case 'call':
        return `$${inst.result} = ${inst.arg1}();`;
      
      case 'return':
        return inst.arg1 ? `return ${this.formatValue(inst.arg1)};` : 'return;';
      
      default:
        return '';
    }
  }

  formatValue(value) {
    if (typeof value === 'string') {
      if (value.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
        return `$${value}`;
      }
      return `"${value}"`;
    }
    return String(value);
  }

  indent() {
    return this.indentString.repeat(this.indentLevel);
  }
}

class RubyGenerator {
  constructor() {
    this.indentLevel = 0;
    this.indentString = '  ';
  }

  generate(ir) {
    const code = [];
    
    const functions = this.groupByFunctions(ir);
    
    for (const func of functions) {
      code.push(this.generateFunction(func));
      code.push('');
    }
    
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
    
    lines.push(`def ${func.name}(${params})`);
    this.indentLevel++;
    
    for (const inst of func.body) {
      const line = this.generateInstruction(inst);
      if (line) {
        lines.push(this.indent() + line);
      }
    }
    
    this.indentLevel--;
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
      case '%':
        return `${inst.result} = ${this.formatValue(inst.arg1)} ${inst.op} ${this.formatValue(inst.arg2)}`;
      
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

class GoGenerator {
  constructor() {
    this.indentLevel = 0;
    this.indentString = '\t';
  }

  generate(ir) {
    const code = [];
    code.push('package main');
    code.push('');
    code.push('import "fmt"');
    code.push('');
    
    const functions = this.groupByFunctions(ir);
    
    for (const func of functions) {
      code.push(this.generateFunction(func));
      code.push('');
    }
    
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
    const params = func.params.map(p => `${p} interface{}`).join(', ');
    
    lines.push(`func ${func.name}(${params}) interface{} {`);
    this.indentLevel++;
    
    for (const inst of func.body) {
      const line = this.generateInstruction(inst);
      if (line) {
        lines.push(this.indent() + line);
      }
    }
    
    this.indentLevel--;
    lines.push('}');
    
    return lines.join('\n');
  }

  generateInstruction(inst) {
    switch (inst.op) {
      case 'assign':
        return `${inst.result} := ${this.formatValue(inst.arg1)}`;
      
      case '+':
      case '-':
      case '*':
      case '/':
      case '%':
        return `${inst.result} := ${this.formatValue(inst.arg1)} ${inst.op} ${this.formatValue(inst.arg2)}`;
      
      case 'call':
        return `${inst.result} := ${inst.arg1}()`;
      
      case 'return':
        return inst.arg1 ? `return ${this.formatValue(inst.arg1)}` : 'return nil';
      
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

module.exports = {
  JavaScriptGenerator,
  TypeScriptGenerator,
  PythonGenerator,
  PHPGenerator,
  RubyGenerator,
  GoGenerator
};
