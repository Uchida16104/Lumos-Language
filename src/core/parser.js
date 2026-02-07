class ASTNode {
  constructor(type, attributes = {}) {
    this.type = type;
    Object.assign(this, attributes);
  }
}

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.position = 0;
  }

  parse() {
    const statements = [];
    while (!this.isAtEnd()) {
      if (this.match('EOF')) break;
      statements.push(this.statement());
    }
    return new ASTNode('Program', { statements });
  }

  statement() {
    if (this.match('LET', 'CONST', 'VAR')) return this.variableDeclaration();
    if (this.match('DEF', 'FUNCTION')) return this.functionDeclaration();
    if (this.match('IF')) return this.ifStatement();
    if (this.match('WHILE')) return this.whileStatement();
    if (this.match('FOR')) return this.forStatement();
    if (this.match('RETURN')) return this.returnStatement();
    if (this.match('BREAK')) return new ASTNode('Break');
    if (this.match('CONTINUE')) return new ASTNode('Continue');
    if (this.match('CLASS')) return this.classDeclaration();
    if (this.match('IMPORT')) return this.importStatement();
    if (this.match('TRY')) return this.tryStatement();
    
    return this.expressionStatement();
  }

  variableDeclaration() {
    const keyword = this.previous().value;
    const name = this.consume('IDENTIFIER', 'Expected variable name').value;
    
    let initializer = null;
    if (this.match('ASSIGN')) {
      initializer = this.expression();
    }
    
    this.consumeOptional('SEMICOLON');
    return new ASTNode('VariableDeclaration', { keyword, name, initializer });
  }

  functionDeclaration() {
    const name = this.consume('IDENTIFIER', 'Expected function name').value;
    this.consume('LPAREN', 'Expected ( after function name');
    
    const parameters = [];
    if (!this.check('RPAREN')) {
      do {
        parameters.push(this.consume('IDENTIFIER', 'Expected parameter name').value);
      } while (this.match('COMMA'));
    }
    
    this.consume('RPAREN', 'Expected ) after parameters');
    this.consume('LBRACE', 'Expected { before function body');
    
    const body = this.block();
    
    return new ASTNode('FunctionDeclaration', { name, parameters, body });
  }

  classDeclaration() {
    const name = this.consume('IDENTIFIER', 'Expected class name').value;
    
    let superclass = null;
    if (this.match('LT')) {
      superclass = this.consume('IDENTIFIER', 'Expected superclass name').value;
    }
    
    this.consume('LBRACE', 'Expected { before class body');
    
    const methods = [];
    const properties = [];
    
    while (!this.check('RBRACE') && !this.isAtEnd()) {
      if (this.match('DEF', 'FUNCTION')) {
        methods.push(this.functionDeclaration());
      } else if (this.match('LET', 'CONST', 'VAR')) {
        properties.push(this.variableDeclaration());
      } else {
        this.advance();
      }
    }
    
    this.consume('RBRACE', 'Expected } after class body');
    
    return new ASTNode('ClassDeclaration', { name, superclass, methods, properties });
  }

  importStatement() {
    const specifiers = [];
    
    if (this.match('LBRACE')) {
      do {
        const name = this.consume('IDENTIFIER', 'Expected import specifier').value;
        let alias = name;
        if (this.match('AS')) {
          alias = this.consume('IDENTIFIER', 'Expected alias').value;
        }
        specifiers.push({ name, alias });
      } while (this.match('COMMA'));
      this.consume('RBRACE', 'Expected }');
    } else if (this.match('MULT')) {
      this.consume('AS', 'Expected as after *');
      const alias = this.consume('IDENTIFIER', 'Expected alias').value;
      specifiers.push({ name: '*', alias });
    } else {
      const name = this.consume('IDENTIFIER', 'Expected import name').value;
      specifiers.push({ name, alias: name });
    }
    
    this.consume('FROM', 'Expected from');
    const source = this.consume('STRING', 'Expected module path').value;
    
    this.consumeOptional('SEMICOLON');
    return new ASTNode('ImportStatement', { specifiers, source });
  }

  tryStatement() {
    this.consume('LBRACE', 'Expected { after try');
    const tryBlock = this.block();
    
    let catchClause = null;
    if (this.match('CATCH')) {
      let parameter = null;
      if (this.match('LPAREN')) {
        parameter = this.consume('IDENTIFIER', 'Expected parameter name').value;
        this.consume('RPAREN', 'Expected )');
      }
      this.consume('LBRACE', 'Expected {');
      const catchBlock = this.block();
      catchClause = { parameter, body: catchBlock };
    }
    
    let finallyBlock = null;
    if (this.match('FINALLY')) {
      this.consume('LBRACE', 'Expected {');
      finallyBlock = this.block();
    }
    
    return new ASTNode('TryStatement', { tryBlock, catchClause, finallyBlock });
  }

  ifStatement() {
    this.consume('LPAREN', 'Expected ( after if');
    const condition = this.expression();
    this.consume('RPAREN', 'Expected ) after condition');
    this.consume('LBRACE', 'Expected { after condition');
    
    const thenBranch = this.block();
    
    const elifBranches = [];
    while (this.match('ELSIF', 'ELIF')) {
      this.consume('LPAREN', 'Expected (');
      const elifCondition = this.expression();
      this.consume('RPAREN', 'Expected )');
      this.consume('LBRACE', 'Expected {');
      const elifBody = this.block();
      elifBranches.push({ condition: elifCondition, body: elifBody });
    }
    
    let elseBranch = null;
    if (this.match('ELSE')) {
      this.consume('LBRACE', 'Expected {');
      elseBranch = this.block();
    }
    
    return new ASTNode('IfStatement', { condition, thenBranch, elifBranches, elseBranch });
  }

  whileStatement() {
    this.consume('LPAREN', 'Expected ( after while');
    const condition = this.expression();
    this.consume('RPAREN', 'Expected ) after condition');
    this.consume('LBRACE', 'Expected { after condition');
    const body = this.block();
    
    return new ASTNode('WhileStatement', { condition, body });
  }

  forStatement() {
    const iterator = this.consume('IDENTIFIER', 'Expected iterator variable').value;
    this.consume('ASSIGN', 'Expected =');
    const start = this.expression();
    this.consume('TO', 'Expected to');
    const end = this.expression();
    
    let step = new ASTNode('Literal', { value: 1 });
    if (this.match('IDENTIFIER') && this.previous().value === 'step') {
      step = this.expression();
    }
    
    this.consume('LBRACE', 'Expected {');
    const body = this.block();
    
    return new ASTNode('ForStatement', { iterator, start, end, step, body });
  }

  returnStatement() {
    let value = null;
    if (!this.check('SEMICOLON') && !this.check('RBRACE')) {
      value = this.expression();
    }
    this.consumeOptional('SEMICOLON');
    return new ASTNode('ReturnStatement', { value });
  }

  expressionStatement() {
    const expr = this.expression();
    this.consumeOptional('SEMICOLON');
    return new ASTNode('ExpressionStatement', { expression: expr });
  }

  block() {
    const statements = [];
    while (!this.check('RBRACE') && !this.isAtEnd()) {
      statements.push(this.statement());
    }
    this.consume('RBRACE', 'Expected } after block');
    return statements;
  }

  expression() {
    return this.assignment();
  }

  assignment() {
    const expr = this.logicalOr();
    
    if (this.match('ASSIGN', 'PLUS_ASSIGN', 'MINUS_ASSIGN', 'MULT_ASSIGN', 'DIV_ASSIGN')) {
      const operator = this.previous().value;
      const value = this.assignment();
      return new ASTNode('Assignment', { target: expr, operator, value });
    }
    
    return expr;
  }

  logicalOr() {
    let expr = this.logicalAnd();
    
    while (this.match('OR')) {
      const operator = this.previous().value;
      const right = this.logicalAnd();
      expr = new ASTNode('BinaryExpression', { left: expr, operator, right });
    }
    
    return expr;
  }

  logicalAnd() {
    let expr = this.equality();
    
    while (this.match('AND')) {
      const operator = this.previous().value;
      const right = this.equality();
      expr = new ASTNode('BinaryExpression', { left: expr, operator, right });
    }
    
    return expr;
  }

  equality() {
    let expr = this.comparison();
    
    while (this.match('EQ', 'NEQ')) {
      const operator = this.previous().value;
      const right = this.comparison();
      expr = new ASTNode('BinaryExpression', { left: expr, operator, right });
    }
    
    return expr;
  }

  comparison() {
    let expr = this.term();
    
    while (this.match('GT', 'GTE', 'LT', 'LTE')) {
      const operator = this.previous().value;
      const right = this.term();
      expr = new ASTNode('BinaryExpression', { left: expr, operator, right });
    }
    
    return expr;
  }

  term() {
    let expr = this.factor();
    
    while (this.match('PLUS', 'MINUS')) {
      const operator = this.previous().value;
      const right = this.factor();
      expr = new ASTNode('BinaryExpression', { left: expr, operator, right });
    }
    
    return expr;
  }

  factor() {
    let expr = this.unary();
    
    while (this.match('MULT', 'DIV', 'MOD')) {
      const operator = this.previous().value;
      const right = this.unary();
      expr = new ASTNode('BinaryExpression', { left: expr, operator, right });
    }
    
    return expr;
  }

  unary() {
    if (this.match('NOT', 'MINUS', 'PLUS')) {
      const operator = this.previous().value;
      const operand = this.unary();
      return new ASTNode('UnaryExpression', { operator, operand });
    }
    
    return this.postfix();
  }

  postfix() {
    let expr = this.primary();
    
    while (true) {
      if (this.match('LPAREN')) {
        const args = [];
        if (!this.check('RPAREN')) {
          do {
            args.push(this.expression());
          } while (this.match('COMMA'));
        }
        this.consume('RPAREN', 'Expected ) after arguments');
        expr = new ASTNode('CallExpression', { callee: expr, arguments: args });
      } else if (this.match('LBRACKET')) {
        const index = this.expression();
        this.consume('RBRACKET', 'Expected ]');
        expr = new ASTNode('IndexExpression', { object: expr, index });
      } else if (this.match('DOT')) {
        const property = this.consume('IDENTIFIER', 'Expected property name').value;
        expr = new ASTNode('MemberExpression', { object: expr, property });
      } else {
        break;
      }
    }
    
    return expr;
  }

  primary() {
    if (this.match('TRUE')) return new ASTNode('Literal', { value: true });
    if (this.match('FALSE')) return new ASTNode('Literal', { value: false });
    if (this.match('NULL', 'NIL')) return new ASTNode('Literal', { value: null });
    
    if (this.match('NUMBER')) {
      return new ASTNode('Literal', { value: this.previous().value });
    }
    
    if (this.match('STRING')) {
      return new ASTNode('Literal', { value: this.previous().value });
    }
    
    if (this.match('IDENTIFIER')) {
      return new ASTNode('Identifier', { name: this.previous().value });
    }
    
    if (this.match('LPAREN')) {
      const expr = this.expression();
      this.consume('RPAREN', 'Expected ) after expression');
      return expr;
    }
    
    if (this.match('LBRACKET')) {
      const elements = [];
      if (!this.check('RBRACKET')) {
        do {
          elements.push(this.expression());
        } while (this.match('COMMA'));
      }
      this.consume('RBRACKET', 'Expected ]');
      return new ASTNode('ArrayLiteral', { elements });
    }
    
    if (this.match('LBRACE')) {
      const properties = [];
      if (!this.check('RBRACE')) {
        do {
          const key = this.consume('IDENTIFIER', 'Expected property name').value;
          this.consume('COLON', 'Expected :');
          const value = this.expression();
          properties.push({ key, value });
        } while (this.match('COMMA'));
      }
      this.consume('RBRACE', 'Expected }');
      return new ASTNode('ObjectLiteral', { properties });
    }
    
    throw new Error(`Unexpected token: ${this.peek().type} at line ${this.peek().line}`);
  }

  match(...types) {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  check(type) {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  advance() {
    if (!this.isAtEnd()) this.position++;
    return this.previous();
  }

  isAtEnd() {
    return this.position >= this.tokens.length;
  }

  peek() {
    return this.tokens[this.position];
  }

  previous() {
    return this.tokens[this.position - 1];
  }

  consume(type, message) {
    if (this.check(type)) return this.advance();
    const token = this.peek();
    throw new Error(`${message} at line ${token.line}, column ${token.column}`);
  }

  consumeOptional(type) {
    if (this.check(type)) this.advance();
  }
}

module.exports = Parser;
