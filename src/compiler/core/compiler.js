const fs = require('fs');
const path = require('path');

class LumosCompiler {
  constructor() {
    this.ast = null;
    this.tokens = [];
    this.targetLanguages = [
      'javascript', 'typescript', 'python', 'php', 'ruby', 'go', 
      'rust', 'c', 'cpp', 'csharp', 'java', 'kotlin', 'swift',
      'elixir', 'fsharp', 'ada', 'dlang', 'assembly', 'llvm'
    ];
    this.symbolTable = new Map();
    this.typeSystem = new TypeSystem();
  }

  compile(sourceCode, targetLang = 'javascript') {
    try {
      this.tokens = this.tokenize(sourceCode);
      this.ast = this.parse(this.tokens);
      this.semanticAnalysis(this.ast);
      const ir = this.generateIR(this.ast);
      const optimizedIR = this.optimize(ir);
      return this.codeGen(optimizedIR, targetLang);
    } catch (error) {
      throw new CompilationError(`Compilation failed: ${error.message}`, error);
    }
  }

  tokenize(source) {
    const tokens = [];
    const patterns = {
      KEYWORD: /\b(let|def|for|while|if|elsif|else|break|continue|return|class|import|export|async|await|match|case|try|catch|finally|throw|yield|lambda|const|var|type|interface|struct|enum|trait|impl|mod|use|pub|fn|mut)\b/,
      IDENTIFIER: /\b[a-zA-Z_][a-zA-Z0-9_]*\b/,
      NUMBER: /\b\d+(\.\d+)?\b/,
      STRING: /"([^"\\]|\\.)*"|'([^'\\]|\\.)*'/,
      OPERATOR: /[+\-*\/%=<>!&|^~]+/,
      DELIMITER: /[{}()\[\];,.:]/,
      WHITESPACE: /\s+/,
      COMMENT: /\/\/.*|\/\*[\s\S]*?\*\//,
      ANNOTATION: /@[a-zA-Z_][a-zA-Z0-9_]*/,
      TEMPLATE: /`([^`\\]|\\.)*`/
    };

    let position = 0;
    const lines = source.split('\n');
    
    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
      let line = lines[lineNum];
      let column = 0;
      
      while (column < line.length) {
        let matched = false;
        
        for (const [type, pattern] of Object.entries(patterns)) {
          const regex = new RegExp(`^${pattern.source}`);
          const match = line.substring(column).match(regex);
          
          if (match) {
            if (type !== 'WHITESPACE' && type !== 'COMMENT') {
              tokens.push({
                type,
                value: match[0],
                line: lineNum + 1,
                column: column + 1,
                position: position
              });
            }
            column += match[0].length;
            position += match[0].length;
            matched = true;
            break;
          }
        }
        
        if (!matched) {
          throw new SyntaxError(`Unexpected character '${line[column]}' at line ${lineNum + 1}, column ${column + 1}`);
        }
      }
      position++;
    }
    
    return tokens;
  }

  parse(tokens) {
    const parser = new Parser(tokens);
    return parser.parseProgram();
  }

  semanticAnalysis(ast) {
    const analyzer = new SemanticAnalyzer(this.symbolTable, this.typeSystem);
    analyzer.analyze(ast);
  }

  generateIR(ast) {
    const generator = new IRGenerator(this.symbolTable);
    return generator.generate(ast);
  }

  optimize(ir) {
    const optimizer = new Optimizer();
    return optimizer.optimize(ir);
  }

  codeGen(ir, targetLang) {
    const generators = {
      javascript: new JavaScriptGenerator(),
      typescript: new TypeScriptGenerator(),
      python: new PythonGenerator(),
      php: new PHPGenerator(),
      ruby: new RubyGenerator(),
      go: new GoGenerator(),
      rust: new RustGenerator(),
      c: new CGenerator(),
      cpp: new CppGenerator(),
      csharp: new CSharpGenerator(),
      java: new JavaGenerator(),
      elixir: new ElixirGenerator(),
      fsharp: new FSharpGenerator(),
      ada: new AdaGenerator(),
      dlang: new DlangGenerator(),
      assembly: new AssemblyGenerator(),
      llvm: new LLVMGenerator()
    };

    const generator = generators[targetLang];
    if (!generator) {
      throw new Error(`Unsupported target language: ${targetLang}`);
    }

    return generator.generate(ir);
  }
}

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.current = 0;
  }

  parseProgram() {
    const program = {
      type: 'Program',
      body: [],
      sourceType: 'module'
    };

    while (!this.isAtEnd()) {
      program.body.push(this.parseStatement());
    }

    return program;
  }

  parseStatement() {
    const token = this.peek();

    if (token.type === 'KEYWORD') {
      switch (token.value) {
        case 'let':
        case 'const':
        case 'var':
          return this.parseVariableDeclaration();
        case 'def':
        case 'fn':
        case 'function':
          return this.parseFunctionDeclaration();
        case 'class':
          return this.parseClassDeclaration();
        case 'if':
          return this.parseIfStatement();
        case 'for':
          return this.parseForStatement();
        case 'while':
          return this.parseWhileStatement();
        case 'return':
          return this.parseReturnStatement();
        case 'break':
          return this.parseBreakStatement();
        case 'continue':
          return this.parseContinueStatement();
        case 'import':
          return this.parseImportStatement();
        case 'export':
          return this.parseExportStatement();
        case 'try':
          return this.parseTryStatement();
        case 'match':
          return this.parseMatchStatement();
        case 'type':
        case 'interface':
          return this.parseTypeDeclaration();
        default:
          return this.parseExpressionStatement();
      }
    }

    return this.parseExpressionStatement();
  }

  parseVariableDeclaration() {
    const keyword = this.advance();
    const identifier = this.consume('IDENTIFIER', 'Expected variable name');
    
    let init = null;
    if (this.match('OPERATOR', '=')) {
      this.advance();
      init = this.parseExpression();
    }

    return {
      type: 'VariableDeclaration',
      kind: keyword.value,
      declarations: [{
        type: 'VariableDeclarator',
        id: { type: 'Identifier', name: identifier.value },
        init
      }]
    };
  }

  parseFunctionDeclaration() {
    this.advance();
    const name = this.consume('IDENTIFIER', 'Expected function name');
    this.consume('DELIMITER', '(');
    
    const params = [];
    while (!this.check('DELIMITER', ')')) {
      params.push({
        type: 'Identifier',
        name: this.consume('IDENTIFIER', 'Expected parameter name').value
      });
      if (!this.check('DELIMITER', ')')) {
        this.consume('DELIMITER', ',');
      }
    }
    
    this.consume('DELIMITER', ')');
    this.consume('DELIMITER', '{');
    
    const body = [];
    while (!this.check('DELIMITER', '}')) {
      body.push(this.parseStatement());
    }
    
    this.consume('DELIMITER', '}');

    return {
      type: 'FunctionDeclaration',
      id: { type: 'Identifier', name: name.value },
      params,
      body: { type: 'BlockStatement', body }
    };
  }

  parseClassDeclaration() {
    this.advance();
    const name = this.consume('IDENTIFIER', 'Expected class name');
    
    let superClass = null;
    if (this.match('OPERATOR', '<') || this.match('KEYWORD', 'extends')) {
      this.advance();
      superClass = {
        type: 'Identifier',
        name: this.consume('IDENTIFIER', 'Expected superclass name').value
      };
    }

    this.consume('DELIMITER', '{');
    
    const body = [];
    while (!this.check('DELIMITER', '}')) {
      if (this.check('KEYWORD', 'def') || this.check('KEYWORD', 'fn')) {
        body.push(this.parseFunctionDeclaration());
      } else {
        body.push(this.parseStatement());
      }
    }
    
    this.consume('DELIMITER', '}');

    return {
      type: 'ClassDeclaration',
      id: { type: 'Identifier', name: name.value },
      superClass,
      body: { type: 'ClassBody', body }
    };
  }

  parseIfStatement() {
    this.advance();
    this.consume('DELIMITER', '(');
    const test = this.parseExpression();
    this.consume('DELIMITER', ')');
    this.consume('DELIMITER', '{');
    
    const consequent = [];
    while (!this.check('DELIMITER', '}')) {
      consequent.push(this.parseStatement());
    }
    this.consume('DELIMITER', '}');

    let alternate = null;
    if (this.match('KEYWORD', 'elsif')) {
      alternate = this.parseIfStatement();
    } else if (this.match('KEYWORD', 'else')) {
      this.advance();
      this.consume('DELIMITER', '{');
      const elseBody = [];
      while (!this.check('DELIMITER', '}')) {
        elseBody.push(this.parseStatement());
      }
      this.consume('DELIMITER', '}');
      alternate = { type: 'BlockStatement', body: elseBody };
    }

    return {
      type: 'IfStatement',
      test,
      consequent: { type: 'BlockStatement', body: consequent },
      alternate
    };
  }

  parseForStatement() {
    this.advance();
    const variable = this.consume('IDENTIFIER', 'Expected loop variable');
    this.consume('OPERATOR', '=');
    const start = this.parseExpression();
    this.consume('KEYWORD', 'to');
    const end = this.parseExpression();
    this.consume('DELIMITER', '{');
    
    const body = [];
    while (!this.check('DELIMITER', '}')) {
      body.push(this.parseStatement());
    }
    this.consume('DELIMITER', '}');

    return {
      type: 'ForStatement',
      init: {
        type: 'VariableDeclaration',
        kind: 'let',
        declarations: [{
          type: 'VariableDeclarator',
          id: { type: 'Identifier', name: variable.value },
          init: start
        }]
      },
      test: {
        type: 'BinaryExpression',
        operator: '<=',
        left: { type: 'Identifier', name: variable.value },
        right: end
      },
      update: {
        type: 'UpdateExpression',
        operator: '++',
        prefix: false,
        argument: { type: 'Identifier', name: variable.value }
      },
      body: { type: 'BlockStatement', body }
    };
  }

  parseWhileStatement() {
    this.advance();
    this.consume('DELIMITER', '(');
    const test = this.parseExpression();
    this.consume('DELIMITER', ')');
    this.consume('DELIMITER', '{');
    
    const body = [];
    while (!this.check('DELIMITER', '}')) {
      body.push(this.parseStatement());
    }
    this.consume('DELIMITER', '}');

    return {
      type: 'WhileStatement',
      test,
      body: { type: 'BlockStatement', body }
    };
  }

  parseReturnStatement() {
    this.advance();
    let argument = null;
    if (!this.isAtEnd() && !this.check('DELIMITER', '}')) {
      argument = this.parseExpression();
    }
    return {
      type: 'ReturnStatement',
      argument
    };
  }

  parseBreakStatement() {
    this.advance();
    return { type: 'BreakStatement' };
  }

  parseContinueStatement() {
    this.advance();
    return { type: 'ContinueStatement' };
  }

  parseImportStatement() {
    this.advance();
    const specifiers = [];
    
    if (this.check('DELIMITER', '{')) {
      this.advance();
      while (!this.check('DELIMITER', '}')) {
        const imported = this.consume('IDENTIFIER', 'Expected import name');
        let local = imported;
        if (this.match('KEYWORD', 'as')) {
          this.advance();
          local = this.consume('IDENTIFIER', 'Expected alias name');
        }
        specifiers.push({
          type: 'ImportSpecifier',
          imported: { type: 'Identifier', name: imported.value },
          local: { type: 'Identifier', name: local.value }
        });
        if (!this.check('DELIMITER', '}')) {
          this.consume('DELIMITER', ',');
        }
      }
      this.consume('DELIMITER', '}');
    } else {
      const name = this.consume('IDENTIFIER', 'Expected module name');
      specifiers.push({
        type: 'ImportDefaultSpecifier',
        local: { type: 'Identifier', name: name.value }
      });
    }

    this.consume('KEYWORD', 'from');
    const source = this.consume('STRING', 'Expected module path');

    return {
      type: 'ImportDeclaration',
      specifiers,
      source: { type: 'Literal', value: source.value.slice(1, -1) }
    };
  }

  parseExportStatement() {
    this.advance();
    const declaration = this.parseStatement();
    return {
      type: 'ExportNamedDeclaration',
      declaration
    };
  }

  parseTryStatement() {
    this.advance();
    this.consume('DELIMITER', '{');
    
    const block = [];
    while (!this.check('DELIMITER', '}')) {
      block.push(this.parseStatement());
    }
    this.consume('DELIMITER', '}');

    let handler = null;
    if (this.match('KEYWORD', 'catch')) {
      this.advance();
      this.consume('DELIMITER', '(');
      const param = this.consume('IDENTIFIER', 'Expected exception variable');
      this.consume('DELIMITER', ')');
      this.consume('DELIMITER', '{');
      
      const catchBody = [];
      while (!this.check('DELIMITER', '}')) {
        catchBody.push(this.parseStatement());
      }
      this.consume('DELIMITER', '}');

      handler = {
        type: 'CatchClause',
        param: { type: 'Identifier', name: param.value },
        body: { type: 'BlockStatement', body: catchBody }
      };
    }

    let finalizer = null;
    if (this.match('KEYWORD', 'finally')) {
      this.advance();
      this.consume('DELIMITER', '{');
      
      const finallyBody = [];
      while (!this.check('DELIMITER', '}')) {
        finallyBody.push(this.parseStatement());
      }
      this.consume('DELIMITER', '}');
      
      finalizer = { type: 'BlockStatement', body: finallyBody };
    }

    return {
      type: 'TryStatement',
      block: { type: 'BlockStatement', body: block },
      handler,
      finalizer
    };
  }

  parseMatchStatement() {
    this.advance();
    this.consume('DELIMITER', '(');
    const discriminant = this.parseExpression();
    this.consume('DELIMITER', ')');
    this.consume('DELIMITER', '{');

    const cases = [];
    while (!this.check('DELIMITER', '}')) {
      this.consume('KEYWORD', 'case');
      const test = this.parseExpression();
      this.consume('OPERATOR', '=>');
      this.consume('DELIMITER', '{');
      
      const consequent = [];
      while (!this.check('DELIMITER', '}')) {
        consequent.push(this.parseStatement());
      }
      this.consume('DELIMITER', '}');

      cases.push({
        type: 'SwitchCase',
        test,
        consequent
      });
    }
    this.consume('DELIMITER', '}');

    return {
      type: 'SwitchStatement',
      discriminant,
      cases
    };
  }

  parseTypeDeclaration() {
    const keyword = this.advance();
    const name = this.consume('IDENTIFIER', 'Expected type name');
    
    this.consume('OPERATOR', '=');
    const definition = this.parseTypeExpression();

    return {
      type: 'TypeAliasDeclaration',
      id: { type: 'Identifier', name: name.value },
      typeAnnotation: definition
    };
  }

  parseTypeExpression() {
    const types = [];
    types.push(this.parseBasicType());
    
    while (this.match('OPERATOR', '|')) {
      this.advance();
      types.push(this.parseBasicType());
    }

    if (types.length === 1) {
      return types[0];
    }

    return {
      type: 'UnionType',
      types
    };
  }

  parseBasicType() {
    if (this.check('IDENTIFIER')) {
      const name = this.advance();
      return { type: 'TypeReference', name: name.value };
    }
    
    if (this.check('DELIMITER', '{')) {
      this.advance();
      const properties = [];
      
      while (!this.check('DELIMITER', '}')) {
        const key = this.consume('IDENTIFIER', 'Expected property name');
        this.consume('DELIMITER', ':');
        const valueType = this.parseTypeExpression();
        
        properties.push({
          type: 'PropertySignature',
          key: { type: 'Identifier', name: key.value },
          typeAnnotation: valueType
        });
        
        if (!this.check('DELIMITER', '}')) {
          this.consume('DELIMITER', ',');
        }
      }
      this.consume('DELIMITER', '}');
      
      return {
        type: 'ObjectType',
        properties
      };
    }

    throw new Error('Expected type expression');
  }

  parseExpressionStatement() {
    const expr = this.parseExpression();
    return {
      type: 'ExpressionStatement',
      expression: expr
    };
  }

  parseExpression() {
    return this.parseAssignment();
  }

  parseAssignment() {
    const expr = this.parseLogicalOr();

    if (this.match('OPERATOR', '=')) {
      this.advance();
      const value = this.parseAssignment();
      return {
        type: 'AssignmentExpression',
        operator: '=',
        left: expr,
        right: value
      };
    }

    return expr;
  }

  parseLogicalOr() {
    let expr = this.parseLogicalAnd();

    while (this.match('OPERATOR', '||')) {
      const operator = this.advance();
      const right = this.parseLogicalAnd();
      expr = {
        type: 'LogicalExpression',
        operator: operator.value,
        left: expr,
        right
      };
    }

    return expr;
  }

  parseLogicalAnd() {
    let expr = this.parseEquality();

    while (this.match('OPERATOR', '&&')) {
      const operator = this.advance();
      const right = this.parseEquality();
      expr = {
        type: 'LogicalExpression',
        operator: operator.value,
        left: expr,
        right
      };
    }

    return expr;
  }

  parseEquality() {
    let expr = this.parseComparison();

    while (this.match('OPERATOR', '==') || this.match('OPERATOR', '!=')) {
      const operator = this.advance();
      const right = this.parseComparison();
      expr = {
        type: 'BinaryExpression',
        operator: operator.value,
        left: expr,
        right
      };
    }

    return expr;
  }

  parseComparison() {
    let expr = this.parseAdditive();

    while (this.match('OPERATOR', '<') || this.match('OPERATOR', '>') || 
           this.match('OPERATOR', '<=') || this.match('OPERATOR', '>=')) {
      const operator = this.advance();
      const right = this.parseAdditive();
      expr = {
        type: 'BinaryExpression',
        operator: operator.value,
        left: expr,
        right
      };
    }

    return expr;
  }

  parseAdditive() {
    let expr = this.parseMultiplicative();

    while (this.match('OPERATOR', '+') || this.match('OPERATOR', '-')) {
      const operator = this.advance();
      const right = this.parseMultiplicative();
      expr = {
        type: 'BinaryExpression',
        operator: operator.value,
        left: expr,
        right
      };
    }

    return expr;
  }

  parseMultiplicative() {
    let expr = this.parseUnary();

    while (this.match('OPERATOR', '*') || this.match('OPERATOR', '/') || this.match('OPERATOR', '%')) {
      const operator = this.advance();
      const right = this.parseUnary();
      expr = {
        type: 'BinaryExpression',
        operator: operator.value,
        left: expr,
        right
      };
    }

    return expr;
  }

  parseUnary() {
    if (this.match('OPERATOR', '!') || this.match('OPERATOR', '-') || this.match('OPERATOR', '+')) {
      const operator = this.advance();
      const argument = this.parseUnary();
      return {
        type: 'UnaryExpression',
        operator: operator.value,
        prefix: true,
        argument
      };
    }

    return this.parsePostfix();
  }

  parsePostfix() {
    let expr = this.parsePrimary();

    while (true) {
      if (this.check('DELIMITER', '(')) {
        this.advance();
        const args = [];
        
        while (!this.check('DELIMITER', ')')) {
          args.push(this.parseExpression());
          if (!this.check('DELIMITER', ')')) {
            this.consume('DELIMITER', ',');
          }
        }
        
        this.consume('DELIMITER', ')');
        expr = {
          type: 'CallExpression',
          callee: expr,
          arguments: args
        };
      } else if (this.check('DELIMITER', '[')) {
        this.advance();
        const property = this.parseExpression();
        this.consume('DELIMITER', ']');
        expr = {
          type: 'MemberExpression',
          object: expr,
          property,
          computed: true
        };
      } else if (this.check('DELIMITER', '.')) {
        this.advance();
        const property = this.consume('IDENTIFIER', 'Expected property name');
        expr = {
          type: 'MemberExpression',
          object: expr,
          property: { type: 'Identifier', name: property.value },
          computed: false
        };
      } else {
        break;
      }
    }

    return expr;
  }

  parsePrimary() {
    if (this.check('NUMBER')) {
      const token = this.advance();
      return {
        type: 'Literal',
        value: parseFloat(token.value),
        raw: token.value
      };
    }

    if (this.check('STRING')) {
      const token = this.advance();
      return {
        type: 'Literal',
        value: token.value.slice(1, -1),
        raw: token.value
      };
    }

    if (this.check('IDENTIFIER')) {
      const token = this.advance();
      return {
        type: 'Identifier',
        name: token.value
      };
    }

    if (this.check('DELIMITER', '(')) {
      this.advance();
      const expr = this.parseExpression();
      this.consume('DELIMITER', ')');
      return expr;
    }

    if (this.check('DELIMITER', '[')) {
      this.advance();
      const elements = [];
      
      while (!this.check('DELIMITER', ']')) {
        elements.push(this.parseExpression());
        if (!this.check('DELIMITER', ']')) {
          this.consume('DELIMITER', ',');
        }
      }
      
      this.consume('DELIMITER', ']');
      return {
        type: 'ArrayExpression',
        elements
      };
    }

    if (this.check('DELIMITER', '{')) {
      this.advance();
      const properties = [];
      
      while (!this.check('DELIMITER', '}')) {
        const key = this.consume('IDENTIFIER', 'Expected property name');
        this.consume('DELIMITER', ':');
        const value = this.parseExpression();
        
        properties.push({
          type: 'Property',
          key: { type: 'Identifier', name: key.value },
          value,
          kind: 'init'
        });
        
        if (!this.check('DELIMITER', '}')) {
          this.consume('DELIMITER', ',');
        }
      }
      
      this.consume('DELIMITER', '}');
      return {
        type: 'ObjectExpression',
        properties
      };
    }

    throw new Error(`Unexpected token: ${this.peek().value}`);
  }

  peek() {
    return this.tokens[this.current];
  }

  advance() {
    if (!this.isAtEnd()) {
      this.current++;
    }
    return this.tokens[this.current - 1];
  }

  check(type, value = null) {
    if (this.isAtEnd()) return false;
    const token = this.peek();
    if (token.type !== type) return false;
    if (value !== null && token.value !== value) return false;
    return true;
  }

  match(type, value = null) {
    return this.check(type, value);
  }

  consume(type, message) {
    if (this.check(type)) {
      return this.advance();
    }
    throw new Error(message);
  }

  isAtEnd() {
    return this.current >= this.tokens.length;
  }
}

class TypeSystem {
  constructor() {
    this.types = new Map();
    this.initializePrimitiveTypes();
  }

  initializePrimitiveTypes() {
    const primitives = ['int', 'float', 'string', 'bool', 'void', 'any', 'number', 'object', 'array'];
    primitives.forEach(type => {
      this.types.set(type, { kind: 'primitive', name: type });
    });
  }

  defineType(name, definition) {
    this.types.set(name, definition);
  }

  getType(name) {
    return this.types.get(name);
  }

  inferType(node) {
    switch (node.type) {
      case 'Literal':
        if (typeof node.value === 'number') return 'number';
        if (typeof node.value === 'string') return 'string';
        if (typeof node.value === 'boolean') return 'bool';
        return 'any';
      case 'Identifier':
        return 'any';
      case 'BinaryExpression':
        return this.inferBinaryType(node);
      case 'CallExpression':
        return 'any';
      default:
        return 'any';
    }
  }

  inferBinaryType(node) {
    const leftType = this.inferType(node.left);
    const rightType = this.inferType(node.right);

    if (['+', '-', '*', '/', '%'].includes(node.operator)) {
      if (leftType === 'number' && rightType === 'number') return 'number';
      if (node.operator === '+' && (leftType === 'string' || rightType === 'string')) return 'string';
      return 'any';
    }

    if (['==', '!=', '<', '>', '<=', '>='].includes(node.operator)) {
      return 'bool';
    }

    return 'any';
  }

  checkTypeCompatibility(type1, type2) {
    if (type1 === 'any' || type2 === 'any') return true;
    return type1 === type2;
  }
}

class SemanticAnalyzer {
  constructor(symbolTable, typeSystem) {
    this.symbolTable = symbolTable;
    this.typeSystem = typeSystem;
    this.scopes = [new Map()];
    this.errors = [];
  }

  analyze(ast) {
    this.visitProgram(ast);
    if (this.errors.length > 0) {
      throw new Error(`Semantic errors:\n${this.errors.join('\n')}`);
    }
  }

  visitProgram(node) {
    node.body.forEach(stmt => this.visitNode(stmt));
  }

  visitNode(node) {
    const visitor = `visit${node.type}`;
    if (this[visitor]) {
      return this[visitor](node);
    }
    return null;
  }

  visitVariableDeclaration(node) {
    node.declarations.forEach(decl => {
      const name = decl.id.name;
      const currentScope = this.scopes[this.scopes.length - 1];
      
      if (currentScope.has(name)) {
        this.errors.push(`Variable '${name}' is already declared in this scope`);
      }
      
      let type = 'any';
      if (decl.init) {
        type = this.visitNode(decl.init);
      }
      
      currentScope.set(name, { type, kind: node.kind });
      this.symbolTable.set(name, { type, kind: node.kind });
    });
  }

  visitFunctionDeclaration(node) {
    const name = node.id.name;
    const currentScope = this.scopes[this.scopes.length - 1];
    
    currentScope.set(name, { type: 'function', params: node.params });
    this.symbolTable.set(name, { type: 'function', params: node.params });

    this.scopes.push(new Map());
    
    node.params.forEach(param => {
      this.scopes[this.scopes.length - 1].set(param.name, { type: 'any', kind: 'param' });
    });
    
    this.visitNode(node.body);
    
    this.scopes.pop();
  }

  visitBlockStatement(node) {
    node.body.forEach(stmt => this.visitNode(stmt));
  }

  visitExpressionStatement(node) {
    return this.visitNode(node.expression);
  }

  visitBinaryExpression(node) {
    const leftType = this.visitNode(node.left);
    const rightType = this.visitNode(node.right);
    return this.typeSystem.inferBinaryType(node);
  }

  visitCallExpression(node) {
    const calleeType = this.visitNode(node.callee);
    node.arguments.forEach(arg => this.visitNode(arg));
    return 'any';
  }

  visitIdentifier(node) {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      if (this.scopes[i].has(node.name)) {
        return this.scopes[i].get(node.name).type;
      }
    }
    return 'any';
  }

  visitLiteral(node) {
    return this.typeSystem.inferType(node);
  }

  visitIfStatement(node) {
    this.visitNode(node.test);
    this.visitNode(node.consequent);
    if (node.alternate) {
      this.visitNode(node.alternate);
    }
  }

  visitForStatement(node) {
    this.scopes.push(new Map());
    this.visitNode(node.init);
    this.visitNode(node.test);
    this.visitNode(node.update);
    this.visitNode(node.body);
    this.scopes.pop();
  }

  visitWhileStatement(node) {
    this.visitNode(node.test);
    this.visitNode(node.body);
  }

  visitReturnStatement(node) {
    if (node.argument) {
      return this.visitNode(node.argument);
    }
    return 'void';
  }
}

class IRGenerator {
  constructor(symbolTable) {
    this.symbolTable = symbolTable;
    this.instructions = [];
    this.nextTemp = 0;
    this.nextLabel = 0;
  }

  generate(ast) {
    this.visitProgram(ast);
    return this.instructions;
  }

  newTemp() {
    return `t${this.nextTemp++}`;
  }

  newLabel() {
    return `L${this.nextLabel++}`;
  }

  emit(op, arg1 = null, arg2 = null, result = null) {
    this.instructions.push({ op, arg1, arg2, result });
  }

  visitProgram(node) {
    node.body.forEach(stmt => this.visitNode(stmt));
  }

  visitNode(node) {
    const visitor = `visit${node.type}`;
    if (this[visitor]) {
      return this[visitor](node);
    }
    return null;
  }

  visitVariableDeclaration(node) {
    node.declarations.forEach(decl => {
      if (decl.init) {
        const value = this.visitNode(decl.init);
        this.emit('assign', value, null, decl.id.name);
      }
    });
  }

  visitFunctionDeclaration(node) {
    this.emit('function', node.id.name);
    node.params.forEach(param => {
      this.emit('param', param.name);
    });
    this.visitNode(node.body);
    this.emit('end_function');
  }

  visitBlockStatement(node) {
    node.body.forEach(stmt => this.visitNode(stmt));
  }

  visitExpressionStatement(node) {
    return this.visitNode(node.expression);
  }

  visitBinaryExpression(node) {
    const left = this.visitNode(node.left);
    const right = this.visitNode(node.right);
    const result = this.newTemp();
    this.emit(node.operator, left, right, result);
    return result;
  }

  visitCallExpression(node) {
    const args = node.arguments.map(arg => this.visitNode(arg));
    args.forEach(arg => {
      this.emit('push', arg);
    });
    const result = this.newTemp();
    this.emit('call', this.visitNode(node.callee), args.length, result);
    return result;
  }

  visitIdentifier(node) {
    return node.name;
  }

  visitLiteral(node) {
    return node.value;
  }

  visitIfStatement(node) {
    const test = this.visitNode(node.test);
    const elseLabel = this.newLabel();
    const endLabel = this.newLabel();

    this.emit('if_false', test, null, elseLabel);
    this.visitNode(node.consequent);
    this.emit('goto', null, null, endLabel);
    
    this.emit('label', elseLabel);
    if (node.alternate) {
      this.visitNode(node.alternate);
    }
    
    this.emit('label', endLabel);
  }

  visitForStatement(node) {
    const startLabel = this.newLabel();
    const endLabel = this.newLabel();

    this.visitNode(node.init);
    this.emit('label', startLabel);
    
    const test = this.visitNode(node.test);
    this.emit('if_false', test, null, endLabel);
    
    this.visitNode(node.body);
    this.visitNode(node.update);
    this.emit('goto', null, null, startLabel);
    
    this.emit('label', endLabel);
  }

  visitWhileStatement(node) {
    const startLabel = this.newLabel();
    const endLabel = this.newLabel();

    this.emit('label', startLabel);
    const test = this.visitNode(node.test);
    this.emit('if_false', test, null, endLabel);
    
    this.visitNode(node.body);
    this.emit('goto', null, null, startLabel);
    
    this.emit('label', endLabel);
  }

  visitReturnStatement(node) {
    if (node.argument) {
      const value = this.visitNode(node.argument);
      this.emit('return', value);
    } else {
      this.emit('return');
    }
  }

  visitAssignmentExpression(node) {
    const value = this.visitNode(node.right);
    const target = node.left.name;
    this.emit('assign', value, null, target);
    return target;
  }
}

class Optimizer {
  optimize(instructions) {
    let optimized = instructions;
    optimized = this.constantFolding(optimized);
    optimized = this.deadCodeElimination(optimized);
    optimized = this.commonSubexpressionElimination(optimized);
    return optimized;
  }

  constantFolding(instructions) {
    return instructions.map(inst => {
      if (['+', '-', '*', '/', '%'].includes(inst.op)) {
        if (typeof inst.arg1 === 'number' && typeof inst.arg2 === 'number') {
          let value;
          switch (inst.op) {
            case '+': value = inst.arg1 + inst.arg2; break;
            case '-': value = inst.arg1 - inst.arg2; break;
            case '*': value = inst.arg1 * inst.arg2; break;
            case '/': value = inst.arg1 / inst.arg2; break;
            case '%': value = inst.arg1 % inst.arg2; break;
          }
          return { op: 'assign', arg1: value, arg2: null, result: inst.result };
        }
      }
      return inst;
    });
  }

  deadCodeElimination(instructions) {
    const used = new Set();
    const labels = new Set();

    instructions.forEach(inst => {
      if (inst.op === 'label' || inst.op === 'goto' || inst.op === 'if_false') {
        if (inst.result) labels.add(inst.result);
        if (inst.arg1 && typeof inst.arg1 === 'string') labels.add(inst.arg1);
      }
    });

    for (let i = instructions.length - 1; i >= 0; i--) {
      const inst = instructions[i];
      if (inst.result) used.add(inst.result);
      if (inst.arg1 && typeof inst.arg1 === 'string') used.add(inst.arg1);
      if (inst.arg2 && typeof inst.arg2 === 'string') used.add(inst.arg2);
    }

    return instructions.filter(inst => {
      if (inst.op === 'label') return labels.has(inst.arg1);
      if (!inst.result) return true;
      return used.has(inst.result);
    });
  }

  commonSubexpressionElimination(instructions) {
    const expressions = new Map();
    
    return instructions.map(inst => {
      if (['+', '-', '*', '/', '%'].includes(inst.op)) {
        const key = `${inst.op}:${inst.arg1}:${inst.arg2}`;
        if (expressions.has(key)) {
          return { op: 'assign', arg1: expressions.get(key), arg2: null, result: inst.result };
        }
        expressions.set(key, inst.result);
      }
      return inst;
    });
  }
}

class CompilationError extends Error {
  constructor(message, originalError) {
    super(message);
    this.name = 'CompilationError';
    this.originalError = originalError;
  }
}

module.exports = { LumosCompiler, Parser, TypeSystem, SemanticAnalyzer, IRGenerator, Optimizer, CompilationError };
