class RubyBackend {
  generate(ast, options = {}) {
    this.output = [];
    this.indent = 0;
    this.generateNode(ast);
    return this.output.join('\n');
  }

  generateNode(node) {
    if (!node) return '';
    
    switch (node.type) {
      case 'Program':
        return this.generateProgram(node);
      case 'VariableDeclaration':
        return this.generateVariableDeclaration(node);
      case 'FunctionDeclaration':
        return this.generateFunctionDeclaration(node);
      case 'ClassDeclaration':
        return this.generateClassDeclaration(node);
      case 'IfStatement':
        return this.generateIfStatement(node);
      case 'WhileStatement':
        return this.generateWhileStatement(node);
      case 'ForStatement':
        return this.generateForStatement(node);
      case 'ReturnStatement':
        return this.generateReturnStatement(node);
      case 'Break':
        this.write('break');
        return;
      case 'Continue':
        this.write('next');
        return;
      case 'Assignment':
        return this.generateAssignment(node);
      case 'BinaryExpression':
        return this.generateBinaryExpression(node);
      case 'CallExpression':
        return this.generateCallExpression(node);
      case 'Identifier':
        return node.name;
      case 'Literal':
        return this.generateLiteral(node.value);
      case 'ArrayLiteral':
        return this.generateArrayLiteral(node);
      case 'ObjectLiteral':
        return this.generateObjectLiteral(node);
      default:
        return '';
    }
  }

  generateProgram(node) {
    this.write('#!/usr/bin/env ruby');
    this.write('');
    for (const stmt of node.statements) {
      this.generateNode(stmt);
    }
  }

  generateVariableDeclaration(node) {
    const value = node.initializer ? this.generateNode(node.initializer) : 'nil';
    this.write(`${node.name} = ${value}`);
  }

  generateFunctionDeclaration(node) {
    const params = node.parameters.join(', ');
    this.write(`def ${node.name}(${params})`);
    this.indent++;
    for (const stmt of node.body) {
      this.generateNode(stmt);
    }
    this.indent--;
    this.write('end');
    this.write('');
  }

  generateClassDeclaration(node) {
    const superclass = node.superclass ? ` < ${node.superclass}` : '';
    this.write(`class ${node.name}${superclass}`);
    this.indent++;
    
    if (node.properties.length > 0) {
      this.write('def initialize');
      this.indent++;
      for (const prop of node.properties) {
        const value = prop.initializer ? this.generateNode(prop.initializer) : 'nil';
        this.write(`@${prop.name} = ${value}`);
      }
      this.indent--;
      this.write('end');
      this.write('');
    }
    
    for (const method of node.methods) {
      this.generateFunctionDeclaration(method);
    }
    
    this.indent--;
    this.write('end');
    this.write('');
  }

  generateIfStatement(node) {
    const cond = this.generateNode(node.condition);
    this.write(`if ${cond}`);
    this.indent++;
    for (const stmt of node.thenBranch) {
      this.generateNode(stmt);
    }
    this.indent--;
    
    for (const elif of node.elifBranches || []) {
      const elifCond = this.generateNode(elif.condition);
      this.write(`elsif ${elifCond}`);
      this.indent++;
      for (const stmt of elif.body) {
        this.generateNode(stmt);
      }
      this.indent--;
    }
    
    if (node.elseBranch) {
      this.write('else');
      this.indent++;
      for (const stmt of node.elseBranch) {
        this.generateNode(stmt);
      }
      this.indent--;
    }
    
    this.write('end');
  }

  generateWhileStatement(node) {
    const cond = this.generateNode(node.condition);
    this.write(`while ${cond}`);
    this.indent++;
    for (const stmt of node.body) {
      this.generateNode(stmt);
    }
    this.indent--;
    this.write('end');
  }

  generateForStatement(node) {
    const start = this.generateNode(node.start);
    const end = this.generateNode(node.end);
    this.write(`(${start}..${end}).each do |${node.iterator}|`);
    this.indent++;
    for (const stmt of node.body) {
      this.generateNode(stmt);
    }
    this.indent--;
    this.write('end');
  }

  generateReturnStatement(node) {
    if (node.value) {
      const value = this.generateNode(node.value);
      this.write(`return ${value}`);
    } else {
      this.write('return');
    }
  }

  generateAssignment(node) {
    const target = this.generateNode(node.target);
    const value = this.generateNode(node.value);
    this.write(`${target} ${node.operator} ${value}`);
  }

  generateBinaryExpression(node) {
    const left = this.generateNode(node.left);
    const right = this.generateNode(node.right);
    
    const operatorMap = {
      '&&': 'and',
      '||': 'or',
      '!': 'not'
    };
    
    const op = operatorMap[node.operator] || node.operator;
    return `(${left} ${op} ${right})`;
  }

  generateCallExpression(node) {
    const callee = this.generateNode(node.callee);
    const args = node.arguments.map(arg => this.generateNode(arg)).join(', ');
    return `${callee}(${args})`;
  }

  generateArrayLiteral(node) {
    const elements = node.elements.map(el => this.generateNode(el)).join(', ');
    return `[${elements}]`;
  }

  generateObjectLiteral(node) {
    const props = node.properties.map(prop => {
      const key = prop.key;
      const value = this.generateNode(prop.value);
      return `${key}: ${value}`;
    }).join(', ');
    return `{${props}}`;
  }

  generateLiteral(value) {
    if (value === null) return 'nil';
    if (value === true) return 'true';
    if (value === false) return 'false';
    if (typeof value === 'string') return `"${value.replace(/"/g, '\\"')}"`;
    return String(value);
  }

  write(line) {
    const indentation = '  '.repeat(this.indent);
    this.output.push(indentation + line);
  }
}

module.exports = new RubyBackend();
