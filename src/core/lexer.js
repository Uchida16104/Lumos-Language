class Token {
  constructor(type, value, line, column) {
    this.type = type;
    this.value = value;
    this.line = line;
    this.column = column;
  }
}

class Lexer {
  constructor(input) {
    this.input = input;
    this.position = 0;
    this.line = 1;
    this.column = 1;
    this.tokens = [];
  }

  tokenize() {
    while (this.position < this.input.length) {
      this.skipWhitespace();
      
      if (this.position >= this.input.length) break;

      const char = this.current();

      if (this.isLetter(char)) {
        this.tokens.push(this.readIdentifierOrKeyword());
        continue;
      }

      if (this.isDigit(char)) {
        this.tokens.push(this.readNumber());
        continue;
      }

      if (char === '"' || char === "'") {
        this.tokens.push(this.readString(char));
        continue;
      }

      if (char === '/' && this.peek() === '/') {
        this.skipLineComment();
        continue;
      }

      if (char === '/' && this.peek() === '*') {
        this.skipBlockComment();
        continue;
      }

      const operator = this.readOperator();
      if (operator) {
        this.tokens.push(operator);
        continue;
      }

      throw new Error(`Unexpected character '${char}' at line ${this.line}, column ${this.column}`);
    }

    this.tokens.push(new Token('EOF', null, this.line, this.column));
    return this.tokens;
  }

  current() {
    return this.input[this.position];
  }

  peek(offset = 1) {
    return this.input[this.position + offset];
  }

  advance() {
    const char = this.current();
    this.position++;
    if (char === '\n') {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    return char;
  }

  skipWhitespace() {
    while (this.position < this.input.length && /\s/.test(this.current())) {
      this.advance();
    }
  }

  skipLineComment() {
    while (this.position < this.input.length && this.current() !== '\n') {
      this.advance();
    }
  }

  skipBlockComment() {
    this.advance();
    this.advance();
    while (this.position < this.input.length) {
      if (this.current() === '*' && this.peek() === '/') {
        this.advance();
        this.advance();
        break;
      }
      this.advance();
    }
  }

  isLetter(char) {
    return /[a-zA-Z_]/.test(char);
  }

  isDigit(char) {
    return /[0-9]/.test(char);
  }

  isAlphaNumeric(char) {
    return this.isLetter(char) || this.isDigit(char);
  }

  readIdentifierOrKeyword() {
    const start = this.position;
    const startLine = this.line;
    const startColumn = this.column;

    while (this.position < this.input.length && this.isAlphaNumeric(this.current())) {
      this.advance();
    }

    const value = this.input.substring(start, this.position);
    const keywords = [
      'let', 'const', 'var', 'def', 'function', 'return',
      'if', 'else', 'elsif', 'elif', 'while', 'for', 'do', 'end',
      'break', 'continue', 'times', 'to', 'in', 'of',
      'class', 'struct', 'interface', 'trait', 'module',
      'import', 'export', 'from', 'as', 'with',
      'try', 'catch', 'finally', 'throw', 'raise',
      'true', 'false', 'null', 'nil', 'undefined',
      'and', 'or', 'not', 'is', 'new', 'delete',
      'async', 'await', 'yield', 'lambda', 'match', 'case',
      'public', 'private', 'protected', 'static', 'final'
    ];

    const type = keywords.includes(value) ? value.toUpperCase() : 'IDENTIFIER';
    return new Token(type, value, startLine, startColumn);
  }

  readNumber() {
    const start = this.position;
    const startLine = this.line;
    const startColumn = this.column;

    while (this.position < this.input.length && this.isDigit(this.current())) {
      this.advance();
    }

    if (this.current() === '.' && this.isDigit(this.peek())) {
      this.advance();
      while (this.position < this.input.length && this.isDigit(this.current())) {
        this.advance();
      }
    }

    if (this.current() === 'e' || this.current() === 'E') {
      this.advance();
      if (this.current() === '+' || this.current() === '-') {
        this.advance();
      }
      while (this.position < this.input.length && this.isDigit(this.current())) {
        this.advance();
      }
    }

    const value = this.input.substring(start, this.position);
    return new Token('NUMBER', parseFloat(value), startLine, startColumn);
  }

  readString(quote) {
    const startLine = this.line;
    const startColumn = this.column;
    this.advance();

    let value = '';
    while (this.position < this.input.length && this.current() !== quote) {
      if (this.current() === '\\') {
        this.advance();
        const escapeChar = this.current();
        const escapeMap = {
          'n': '\n',
          't': '\t',
          'r': '\r',
          '\\': '\\',
          '"': '"',
          "'": "'"
        };
        value += escapeMap[escapeChar] || escapeChar;
        this.advance();
      } else {
        value += this.current();
        this.advance();
      }
    }

    if (this.current() !== quote) {
      throw new Error(`Unterminated string at line ${startLine}, column ${startColumn}`);
    }

    this.advance();
    return new Token('STRING', value, startLine, startColumn);
  }

  readOperator() {
    const startLine = this.line;
    const startColumn = this.column;
    const char = this.current();
    const next = this.peek();

    const twoCharOps = {
      '==': 'EQ', '!=': 'NEQ', '<=': 'LTE', '>=': 'GTE',
      '&&': 'AND', '||': 'OR', '++': 'INCREMENT', '--': 'DECREMENT',
      '+=': 'PLUS_ASSIGN', '-=': 'MINUS_ASSIGN', '*=': 'MULT_ASSIGN', '/=': 'DIV_ASSIGN',
      '=>': 'ARROW', '->': 'ARROW', '::': 'SCOPE', '..': 'RANGE'
    };

    const twoChar = char + next;
    if (twoCharOps[twoChar]) {
      this.advance();
      this.advance();
      return new Token(twoCharOps[twoChar], twoChar, startLine, startColumn);
    }

    const oneCharOps = {
      '+': 'PLUS', '-': 'MINUS', '*': 'MULT', '/': 'DIV', '%': 'MOD',
      '=': 'ASSIGN', '<': 'LT', '>': 'GT', '!': 'NOT',
      '(': 'LPAREN', ')': 'RPAREN', '{': 'LBRACE', '}': 'RBRACE',
      '[': 'LBRACKET', ']': 'RBRACKET', ',': 'COMMA', ';': 'SEMICOLON',
      ':': 'COLON', '.': 'DOT', '|': 'PIPE', '&': 'AMPERSAND',
      '^': 'XOR', '~': 'TILDE', '?': 'QUESTION'
    };

    if (oneCharOps[char]) {
      this.advance();
      return new Token(oneCharOps[char], char, startLine, startColumn);
    }

    return null;
  }
}

module.exports = Lexer;
