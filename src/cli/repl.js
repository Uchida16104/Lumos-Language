const readline = require("readline");

class REPL {
  constructor(engine) {
    this.engine = engine;
    this.history = [];
    this.multilineBuffer = '';
    this.inMultilineMode = false;
  }

  start() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: "lumos> ",
    });

    console.log("Lumos Language Enhanced REPL");
    console.log("Multi-target compiler supporting 100+ languages");
    console.log("Type '.help' for commands, '.exit' to quit\n");

    this.rl.prompt();

    this.rl.on("line", (line) => {
      this.handleLine(line.trim());
    });

    this.rl.on("close", () => {
      console.log("\nGoodbye!");
      process.exit(0);
    });
  }

  handleLine(line) {
    if (line === "") {
      this.rl.prompt();
      return;
    }

    if (line.startsWith(".")) {
      this.handleCommand(line);
      return;
    }

    if (this.inMultilineMode) {
      if (line === "end" || line === "}") {
        this.multilineBuffer += "\n" + line;
        this.executeCode(this.multilineBuffer);
        this.multilineBuffer = '';
        this.inMultilineMode = false;
      } else {
        this.multilineBuffer += "\n" + line;
        this.rl.setPrompt("...    ");
        this.rl.prompt();
        return;
      }
    } else {
      if (line.endsWith("{") || line.startsWith("def ") || line.startsWith("class ")) {
        this.multilineBuffer = line;
        this.inMultilineMode = true;
        this.rl.setPrompt("...    ");
        this.rl.prompt();
        return;
      }

      this.executeCode(line);
    }

    this.rl.setPrompt("lumos> ");
    this.rl.prompt();
  }

  executeCode(code) {
    try {
      this.history.push(code);
      const result = this.engine.execute(code);
      if (result !== null && result !== undefined) {
        console.log("=> " + this.formatOutput(result));
      }
    } catch (error) {
      console.error("Error: " + error.message);
    }
  }

  handleCommand(cmd) {
    const parts = cmd.split(" ");
    const command = parts[0];
    const args = parts.slice(1);

    switch (command) {
      case ".exit":
      case ".quit":
        this.rl.close();
        break;

      case ".help":
        this.showHelp();
        break;

      case ".history":
        this.showHistory();
        break;

      case ".clear":
        console.clear();
        break;

      case ".compile":
        this.handleCompile(args);
        break;

      case ".targets":
        this.showTargets();
        break;

      case ".vars":
        this.showVariables();
        break;

      case ".reset":
        this.engine.runtime = new (require("./runtime"))();
        console.log("Runtime reset");
        break;

      default:
        console.log(`Unknown command: ${command}`);
        console.log("Type '.help' for available commands");
    }

    this.rl.prompt();
  }

  showHelp() {
    console.log(`
Available Commands:
  .help                Show this help message
  .exit, .quit         Exit the REPL
  .clear               Clear the console
  .history             Show command history
  .compile [target]    Compile last expression to target language
  .targets             Show available compilation targets
  .vars                Show current variables
  .reset               Reset the runtime environment

Examples:
  let x = 42
  def greet(name) { print("Hello, " + name) }
  .compile python
  .compile rust
    `);
  }

  showHistory() {
    console.log("\nCommand History:");
    this.history.forEach((cmd, index) => {
      console.log(`${index + 1}: ${cmd}`);
    });
    console.log();
  }

  handleCompile(args) {
    if (args.length === 0) {
      console.log("Usage: .compile [target]");
      console.log("Example: .compile python");
      return;
    }

    const target = args[0];
    const lastCode = this.history[this.history.length - 1];

    if (!lastCode) {
      console.log("No code to compile. Execute some code first.");
      return;
    }

    try {
      const compiled = this.engine.compileToTarget(lastCode, target);
      console.log(`\nCompiled to ${target}:`);
      console.log("---");
      console.log(compiled);
      console.log("---\n");
    } catch (error) {
      console.error(`Compilation error: ${error.message}`);
    }
  }

  showTargets() {
    const targets = this.engine.compiler.getSupportedTargets();
    console.log("\nAvailable Compilation Targets:");
    
    const categories = {
      assembly: [],
      compiled: [],
      interpreted: [],
      scripting: [],
      functional: [],
      web: [],
      database: [],
      specialized: []
    };

    targets.forEach(target => {
      const type = this.engine.compiler.getTargetType(target);
      if (categories[type]) {
        categories[type].push(target);
      }
    });

    Object.entries(categories).forEach(([category, langs]) => {
      if (langs.length > 0) {
        console.log(`\n${category.charAt(0).toUpperCase() + category.slice(1)}:`);
        console.log(`  ${langs.join(', ')}`);
      }
    });

    console.log();
  }

  showVariables() {
    const vars = this.engine.evaluator.currentScope;
    console.log("\nCurrent Variables:");
    Object.entries(vars).forEach(([name, value]) => {
      console.log(`  ${name} = ${this.formatOutput(value)}`);
    });
    console.log();
  }

  formatOutput(value) {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'function') return '[Function]';
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return '[Object]';
      }
    }
    return String(value);
  }
}

module.exports = REPL;
