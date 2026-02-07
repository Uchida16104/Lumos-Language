class Backend {
  generate(ast, options = {}) {
    this.output = [];
    this.indent = 0;
    this.generateNode(ast);
    return this.output.join('\n');
  }

  generateNode(node) {
    if (!node) return '';
    switch (node.type) {
      case 'Program': return this.generateProgram(node);
      case 'VariableDeclaration': return this.generateVariableDeclaration(node);
      case 'FunctionDeclaration': return this.generateFunctionDeclaration(node);
      default: return '';
    }
  }

  generateProgram(node) {
    for (const stmt of node.statements) {
      this.generateNode(stmt);
    }
  }

  generateVariableDeclaration(node) {
    const value = node.initializer ? this.generateNode(node.initializer) : 'null';
    this.write(`var ${node.name} = ${value};`);
  }

  generateFunctionDeclaration(node) {
    this.write(`function ${node.name}() {}`);
  }

  write(line) {
    this.output.push('  '.repeat(this.indent) + line);
  }
}

module.exports = new Backend();
