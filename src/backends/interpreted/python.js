class PythonBackend {
  generate(ast, options = {}) {
    this.indent = 0;
    this.indentStr = '    ';
    this.output = [];
    
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
      case 'ImportStatement':
        return this.generateImportStatement(node);
      case 'TryStatement':
        return this.generateTryStatement(node);
      case 'IfStatement':
        return this.generateIfStatement(node);
      case 'WhileStatement':
        return this.generateWhileStatement(node);
      case 'ForStatement':
        return this.generateForStatement(node);
      case 'ReturnStatement':
        return this.generateReturnStatement(node);
      case 'Break':
        return this.write('break');
      case 'Continue':
        return this.write('continue');
      case 'ExpressionStatement':
        return this.generateNode(node.expression);
      case 'Assignment':
        return this.generateAssignment(node);
      case 'BinaryExpression':
        return this.generateBinaryExpression(node);
      case 'UnaryExpression':
        return this.generateUnaryExpression(node);
      case 'CallExpression':
        return this.generateCallExpression(node);
      case 'IndexExpression':
        return this.generateIndexExpression(node);
      case 'MemberExpression':
        return this.generateMemberExpression(node);
      case 'Identifier':
        return node.name;
      case 'Literal':
        return this.generateLiteral(node.value);
      case 'ArrayLiteral':
        return this.generateArrayLiteral(node);
      case 'ObjectLiteral':
        return this.generateObjectLiteral(node);
      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  }

  generateProgram(node) {
    this.write('#!/usr/bin/env python3');
    this.write('');
    
    for (const statement of node.statements) {
      this.generateNode(statement);
    }
  }

  generateVariableDeclaration(node) {
    const value = node.initializer ? this.generateNode(node.initializer) : 'None';
    this.write(`${node.name} = ${value}`);
  }

  generateFunctionDeclaration(node) {
    const params = node.parameters.join(', ');
    this.write(`def ${node.name}(${params}):`);
    this.indent++;
    
    if (node.body.length === 0) {
      this.write('pass');
    } else {
      for (const statement of node.body) {
        this.generateNode(statement);
      }
    }
    
    this.indent--;
    this.write('');
  }

  generateClassDeclaration(node) {
    const superclass = node.superclass ? `(${node.superclass})` : '';
    this.write(`class ${node.name}${superclass}:`);
    this.indent++;
    
    if (node.properties.length === 0 && node.methods.length === 0) {
      this.write('pass');
    } else {
      this.write('def __init__(self):');
      this.indent++;
      for (const prop of node.properties) {
        const value = prop.initializer ? this.generateNode(prop.initializer) : 'None';
        this.write(`self.${prop.name} = ${value}`);
      }
      if (node.properties.length === 0) {
        this.write('pass');
      }
      this.indent--;
      this.write('');
      
      for (const method of node.methods) {
        const params = ['self', ...method.parameters].join(', ');
        this.write(`def ${method.name}(${params}):`);
        this.indent++;
        for (const statement of method.body) {
          this.generateNode(statement);
        }
        if (method.body.length === 0) {
          this.write('pass');
        }
        this.indent--;
        this.write('');
      }
    }
    
    this.indent--;
  }

  generateImportStatement(node) {
    const modulePath = node.source.replace(/\//g, '.');
    
    for (const spec of node.specifiers) {
      if (spec.name === '*') {
        this.write(`from ${modulePath} import *`);
      } else if (spec.name === spec.alias) {
        this.write(`from ${modulePath} import ${spec.name}`);
      } else {
        this.write(`from ${modulePath} import ${spec.name} as ${spec.alias}`);
      }
    }
  }

  generateTryStatement(node) {
    this.write('try:');
    this.indent++;
    for (const statement of node.tryBlock) {
      this.generateNode(statement);
    }
    if (node.tryBlock.length === 0) {
      this.write('pass');
    }
    this.indent--;
    
    if (node.catchClause) {
      const param = node.catchClause.parameter || 'e';
      this.write(`except Exception as ${param}:`);
      this.indent++;
      for (const statement of node.catchClause.body) {
        this.generateNode(statement);
      }
      if (node.catchClause.body.length === 0) {
        this.write('pass');
      }
      this.indent--;
    }
    
    if (node.finallyBlock) {
      this.write('finally:');
      this.indent++;
      for (const statement of node.finallyBlock) {
        this.generateNode(statement);
      }
      if (node.finallyBlock.length === 0) {
        this.write('pass');
      }
      this.indent--;
    }
  }

  generateIfStatement(node) {
    const condition = this.generateNode(node.condition);
    this.write(`if ${condition}:`);
    this.indent++;
    for (const statement of node.thenBranch) {
      this.generateNode(statement);
    }
    if (node.thenBranch.length === 0) {
      this.write('pass');
    }
    this.indent--;
    
    for (const elif of node.elifBranches || []) {
      const elifCond = this.generateNode(elif.condition);
      this.write(`elif ${elifCond}:`);
      this.indent++;
      for (const statement of elif.body) {
        this.generateNode(statement);
      }
      if (elif.body.length === 0) {
        this.write('pass');
      }
      this.indent--;
    }
    
    if (node.elseBranch) {
      this.write('else:');
      this.indent++;
      for (const statement of node.elseBranch) {
        this.generateNode(statement);
      }
      if (node.elseBranch.length === 0) {
        this.write('pass');
      }
      this.indent--;
    }
  }

  generateWhileStatement(node) {
    const condition = this.generateNode(node.condition);
    this.write(`while ${condition}:`);
    this.indent++;
    for (const statement of node.body) {
      this.generateNode(statement);
    }
    if (node.body.length === 0) {
      this.write('pass');
    }
    this.indent--;
  }

  generateForStatement(node) {
    const start = this.generateNode(node.start);
    const end = this.generateNode(node.end);
    const step = this.generateNode(node.step);
    
    if (step === '1') {
      this.write(`for ${node.iterator} in range(${start}, ${end} + 1):`);
    } else {
      this.write(`for ${node.iterator} in range(${start}, ${end} + 1, ${step}):`);
    }
    
    this.indent++;
    for (const statement of node.body) {
      this.generateNode(statement);
    }
    if (node.body.length === 0) {
      this.write('pass');
    }
    this.indent--;
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
    
    if (node.operator === '=') {
      this.write(`${target} = ${value}`);
    } else {
      this.write(`${target} ${node.operator} ${value}`);
    }
  }

  generateBinaryExpression(node) {
    const left = this.generateNode(node.left);
    const right = this.generateNode(node.right);
    
    const operatorMap = {
      '==': '==',
      '!=': '!=',
      '<': '<',
      '<=': '<=',
      '>': '>',
      '>=': '>=',
      'and': 'and',
      '&&': 'and',
      'or': 'or',
      '||': 'or'
    };
    
    const op = operatorMap[node.operator] || node.operator;
    return `(${left} ${op} ${right})`;
  }

  generateUnaryExpression(node) {
    const operand = this.generateNode(node.operand);
    
    const operatorMap = {
      'not': 'not',
      '!': 'not'
    };
    
    const op = operatorMap[node.operator] || node.operator;
    return `${op} ${operand}`;
  }

  generateCallExpression(node) {
    const callee = this.generateNode(node.callee);
    const args = node.arguments.map(arg => this.generateNode(arg)).join(', ');
    return `${callee}(${args})`;
  }

  generateIndexExpression(node) {
    const object = this.generateNode(node.object);
    const index = this.generateNode(node.index);
    return `${object}[${index}]`;
  }

  generateMemberExpression(node) {
    const object = this.generateNode(node.object);
    return `${object}.${node.property}`;
  }

  generateLiteral(value) {
    if (value === null) return 'None';
    if (value === true) return 'True';
    if (value === false) return 'False';
    if (typeof value === 'string') return `"${value.replace(/"/g, '\\"')}"`;
    return String(value);
  }

  generateArrayLiteral(node) {
    const elements = node.elements.map(el => this.generateNode(el)).join(', ');
    return `[${elements}]`;
  }

  generateObjectLiteral(node) {
    const props = node.properties.map(prop => {
      const key = `"${prop.key}"`;
      const value = this.generateNode(prop.value);
      return `${key}: ${value}`;
    }).join(', ');
    return `{${props}}`;
  }

  write(line) {
    const indentation = this.indentStr.repeat(this.indent);
    this.output.push(indentation + line);
  }
}

module.exports = new PythonBackend();
