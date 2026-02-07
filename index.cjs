#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const Lexer = require("./src/core/lexer");
const Parser = require("./src/core/parser");
const Evaluator = require("./src/core/evaluator");
const Compiler = require("./src/core/compiler");
const Runtime = require("./src/core/runtime");
const REPL = require("./src/cli/repl");
const FileRunner = require("./src/cli/fileRunner");

class LumosEngine {
  constructor() {
    this.runtime = new Runtime();
    this.compiler = new Compiler();
    this.evaluator = new Evaluator(this.runtime);
    this.version = "2.0.0";
  }

  execute(code, options = {}) {
    try {
      const lexer = new Lexer(code);
      const tokens = lexer.tokenize();
      
      const parser = new Parser(tokens);
      const ast = parser.parse();
      
      if (options.compile) {
        return this.compiler.compile(ast, options.target || "javascript");
      }
      
      return this.evaluator.evaluate(ast);
    } catch (error) {
      throw new Error(`Lumos Execution Error: ${error.message}`);
    }
  }

  compileToTarget(code, target) {
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    
    return this.compiler.compile(ast, target);
  }

  runFile(filepath) {
    const runner = new FileRunner(this);
    return runner.run(filepath);
  }

  startREPL() {
    const repl = new REPL(this);
    repl.start();
  }
}

function main() {
  const args = process.argv.slice(2);
  const engine = new LumosEngine();

  if (args.length === 0) {
    console.log(`Lumos Language v${engine.version}`);
    console.log("Enhanced Multi-Target Compiler & Interpreter");
    console.log("Type 'exit' to quit, 'help' for commands\n");
    engine.startREPL();
    return;
  }

  const command = args[0];

  if (command === "--version" || command === "-v") {
    console.log(`Lumos Language v${engine.version}`);
    return;
  }

  if (command === "--help" || command === "-h") {
    console.log(`
Lumos Language - Multi-Target Compiler & Interpreter

Usage:
  lumos [file.lumos]                 Run a Lumos file
  lumos compile [file.lumos] [target] Compile to target language
  lumos --version                    Show version
  lumos --help                       Show this help

Compilation Targets:
  Assembly:    x86, arm, wasm
  Compiled:    c, cpp, rust, go, java, csharp, swift, ada, d, fortran
  Interpreted: python, ruby, php, perl, lua, javascript, typescript
  Functional:  haskell, scala, elixir, erlang, fsharp, clojure, lisp
  Web:         html, jsx, vue, react, nextjs
  Database:    sql, postgresql, mysql, sqlite, mongodb
  Frameworks:  laravel, django, fastapi, express, nestjs, phoenix
  Specialized: cobol, matlab, vhdl, mql4, vba, gas

Examples:
  lumos script.lumos
  lumos compile script.lumos python
  lumos compile script.lumos rust --optimize
    `);
    return;
  }

  if (command === "compile") {
    if (args.length < 3) {
      console.error("Error: Missing file or target");
      console.error("Usage: lumos compile [file.lumos] [target]");
      process.exit(1);
    }

    const filepath = args[1];
    const target = args[2];

    if (!fs.existsSync(filepath)) {
      console.error(`Error: File not found: ${filepath}`);
      process.exit(1);
    }

    try {
      const code = fs.readFileSync(filepath, "utf8");
      const compiled = engine.compileToTarget(code, target);
      
      const ext = engine.compiler.getExtension(target);
      const outputPath = filepath.replace(/\.lumos$/, ext);
      
      fs.writeFileSync(outputPath, compiled);
      console.log(`Successfully compiled to ${target}: ${outputPath}`);
    } catch (error) {
      console.error(`Compilation Error: ${error.message}`);
      process.exit(1);
    }
    return;
  }

  const filepath = args[0];
  if (!fs.existsSync(filepath)) {
    console.error(`Error: File not found: ${filepath}`);
    process.exit(1);
  }

  try {
    engine.runFile(filepath);
  } catch (error) {
    console.error(`Runtime Error: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = LumosEngine;
