class BreakException extends Error {
  constructor() {
    super('Break');
    this.name = 'BreakException';
  }
}

class ContinueException extends Error {
  constructor() {
    super('Continue');
    this.name = 'ContinueException';
  }
}

class ReturnException extends Error {
  constructor(value) {
    super('Return');
    this.name = 'ReturnException';
    this.value = value;
  }
}

class Evaluator {
  constructor(runtime) {
    this.runtime = runtime;
    this.globalScope = {};
    this.currentScope = this.globalScope;
  }

  evaluate(ast) {
    return this.evaluateNode(ast);
  }

  evaluateNode(node) {
    if (!node) return null;

    switch (node.type) {
      case 'Program':
        return this.evaluateProgram(node);
      case 'VariableDeclaration':
        return this.evaluateVariableDeclaration(node);
      case 'FunctionDeclaration':
        return this.evaluateFunctionDeclaration(node);
      case 'ClassDeclaration':
        return this.evaluateClassDeclaration(node);
      case 'ImportStatement':
        return this.evaluateImportStatement(node);
      case 'TryStatement':
        return this.evaluateTryStatement(node);
      case 'IfStatement':
        return this.evaluateIfStatement(node);
      case 'WhileStatement':
        return this.evaluateWhileStatement(node);
      case 'ForStatement':
        return this.evaluateForStatement(node);
      case 'ReturnStatement':
        return this.evaluateReturnStatement(node);
      case 'Break':
        throw new BreakException();
      case 'Continue':
        throw new ContinueException();
      case 'ExpressionStatement':
        return this.evaluateNode(node.expression);
      case 'Assignment':
        return this.evaluateAssignment(node);
      case 'BinaryExpression':
        return this.evaluateBinaryExpression(node);
      case 'UnaryExpression':
        return this.evaluateUnaryExpression(node);
      case 'CallExpression':
        return this.evaluateCallExpression(node);
      case 'IndexExpression':
        return this.evaluateIndexExpression(node);
      case 'MemberExpression':
        return this.evaluateMemberExpression(node);
      case 'Identifier':
        return this.evaluateIdentifier(node);
      case 'Literal':
        return node.value;
      case 'ArrayLiteral':
        return this.evaluateArrayLiteral(node);
      case 'ObjectLiteral':
        return this.evaluateObjectLiteral(node);
      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  }

  evaluateProgram(node) {
    let result = null;
    for (const statement of node.statements) {
      result = this.evaluateNode(statement);
    }
    return result;
  }

  evaluateVariableDeclaration(node) {
    const value = node.initializer ? this.evaluateNode(node.initializer) : null;
    this.currentScope[node.name] = value;
    return value;
  }

  evaluateFunctionDeclaration(node) {
    const func = {
      type: 'function',
      parameters: node.parameters,
      body: node.body,
      scope: this.currentScope
    };
    this.currentScope[node.name] = func;
    return func;
  }

  evaluateClassDeclaration(node) {
    const classObj = {
      type: 'class',
      name: node.name,
      superclass: node.superclass,
      methods: {},
      properties: {}
    };

    const previousScope = this.currentScope;
    this.currentScope = {};

    for (const method of node.methods) {
      this.evaluateFunctionDeclaration(method);
      classObj.methods[method.name] = this.currentScope[method.name];
    }

    for (const property of node.properties) {
      this.evaluateVariableDeclaration(property);
      classObj.properties[property.name] = this.currentScope[property.name];
    }

    this.currentScope = previousScope;
    this.currentScope[node.name] = classObj;
    return classObj;
  }

  evaluateImportStatement(node) {
    const module = this.runtime.loadModule(node.source);
    for (const spec of node.specifiers) {
      if (spec.name === '*') {
        Object.assign(this.currentScope, module);
      } else {
        this.currentScope[spec.alias] = module[spec.name];
      }
    }
    return module;
  }

  evaluateTryStatement(node) {
    try {
      return this.evaluateBlock(node.tryBlock);
    } catch (error) {
      if (node.catchClause) {
        const previousScope = this.currentScope;
        this.currentScope = Object.create(this.currentScope);
        if (node.catchClause.parameter) {
          this.currentScope[node.catchClause.parameter] = error;
        }
        const result = this.evaluateBlock(node.catchClause.body);
        this.currentScope = previousScope;
        return result;
      } else {
        throw error;
      }
    } finally {
      if (node.finallyBlock) {
        this.evaluateBlock(node.finallyBlock);
      }
    }
  }

  evaluateIfStatement(node) {
    if (this.evaluateNode(node.condition)) {
      return this.evaluateBlock(node.thenBranch);
    }

    for (const elif of node.elifBranches || []) {
      if (this.evaluateNode(elif.condition)) {
        return this.evaluateBlock(elif.body);
      }
    }

    if (node.elseBranch) {
      return this.evaluateBlock(node.elseBranch);
    }

    return null;
  }

  evaluateWhileStatement(node) {
    let result = null;
    let iterations = 0;
    const maxIterations = 1000000;

    while (this.evaluateNode(node.condition)) {
      if (iterations++ > maxIterations) {
        throw new Error('Infinite loop detected');
      }

      try {
        result = this.evaluateBlock(node.body);
      } catch (error) {
        if (error instanceof BreakException) break;
        if (error instanceof ContinueException) continue;
        throw error;
      }
    }

    return result;
  }

  evaluateForStatement(node) {
    const start = this.evaluateNode(node.start);
    const end = this.evaluateNode(node.end);
    const step = this.evaluateNode(node.step);

    let result = null;
    const previousScope = this.currentScope;
    this.currentScope = Object.create(this.currentScope);

    for (let i = start; i <= end; i += step) {
      this.currentScope[node.iterator] = i;

      try {
        result = this.evaluateBlock(node.body);
      } catch (error) {
        if (error instanceof BreakException) break;
        if (error instanceof ContinueException) continue;
        throw error;
      }
    }

    this.currentScope = previousScope;
    return result;
  }

  evaluateReturnStatement(node) {
    const value = node.value ? this.evaluateNode(node.value) : null;
    throw new ReturnException(value);
  }

  evaluateBlock(statements) {
    let result = null;
    for (const statement of statements) {
      result = this.evaluateNode(statement);
    }
    return result;
  }

  evaluateAssignment(node) {
    const value = this.evaluateNode(node.value);

    if (node.target.type === 'Identifier') {
      const name = node.target.name;

      if (node.operator === '=') {
        this.currentScope[name] = value;
      } else {
        const current = this.currentScope[name] || 0;
        switch (node.operator) {
          case '+=': this.currentScope[name] = current + value; break;
          case '-=': this.currentScope[name] = current - value; break;
          case '*=': this.currentScope[name] = current * value; break;
          case '/=': this.currentScope[name] = current / value; break;
        }
      }

      return this.currentScope[name];
    }

    if (node.target.type === 'IndexExpression') {
      const object = this.evaluateNode(node.target.object);
      const index = this.evaluateNode(node.target.index);
      object[index] = value;
      return value;
    }

    if (node.target.type === 'MemberExpression') {
      const object = this.evaluateNode(node.target.object);
      object[node.target.property] = value;
      return value;
    }

    throw new Error('Invalid assignment target');
  }

  evaluateBinaryExpression(node) {
    const left = this.evaluateNode(node.left);
    const right = this.evaluateNode(node.right);

    switch (node.operator) {
      case '+': return left + right;
      case '-': return left - right;
      case '*': return left * right;
      case '/': return left / right;
      case '%': return left % right;
      case '==': return left == right;
      case '!=': return left != right;
      case '<': return left < right;
      case '<=': return left <= right;
      case '>': return left > right;
      case '>=': return left >= right;
      case 'and': case '&&': return left && right;
      case 'or': case '||': return left || right;
      default:
        throw new Error(`Unknown binary operator: ${node.operator}`);
    }
  }

  evaluateUnaryExpression(node) {
    const operand = this.evaluateNode(node.operand);

    switch (node.operator) {
      case '-': return -operand;
      case '+': return +operand;
      case 'not': case '!': return !operand;
      default:
        throw new Error(`Unknown unary operator: ${node.operator}`);
    }
  }

  evaluateCallExpression(node) {
    const callee = this.evaluateNode(node.callee);
    const args = node.arguments.map(arg => this.evaluateNode(arg));

    if (typeof callee === 'function') {
      return callee(...args);
    }

    if (callee.type === 'function') {
      const previousScope = this.currentScope;
      this.currentScope = Object.create(callee.scope);

      for (let i = 0; i < callee.parameters.length; i++) {
        this.currentScope[callee.parameters[i]] = args[i];
      }

      try {
        this.evaluateBlock(callee.body);
        this.currentScope = previousScope;
        return null;
      } catch (error) {
        this.currentScope = previousScope;
        if (error instanceof ReturnException) {
          return error.value;
        }
        throw error;
      }
    }

    throw new Error('Not a function');
  }

  evaluateIndexExpression(node) {
    const object = this.evaluateNode(node.object);
    const index = this.evaluateNode(node.index);
    return object[index];
  }

  evaluateMemberExpression(node) {
    const object = this.evaluateNode(node.object);
    return object[node.property];
  }

  evaluateIdentifier(node) {
    const name = node.name;

    if (name in this.currentScope) {
      return this.currentScope[name];
    }

    let scope = this.currentScope;
    while (Object.getPrototypeOf(scope)) {
      scope = Object.getPrototypeOf(scope);
      if (name in scope) {
        return scope[name];
      }
    }

    if (name in this.globalScope) {
      return this.globalScope[name];
    }

    if (name in this.runtime.builtins) {
      return this.runtime.builtins[name];
    }

    throw new Error(`Undefined variable: ${name}`);
  }

  evaluateArrayLiteral(node) {
    return node.elements.map(el => this.evaluateNode(el));
  }

  evaluateObjectLiteral(node) {
    const obj = {};
    for (const prop of node.properties) {
      obj[prop.key] = this.evaluateNode(prop.value);
    }
    return obj;
  }
}

module.exports = Evaluator;
