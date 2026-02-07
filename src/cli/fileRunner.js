const fs = require("fs");
const path = require("path");

class FileRunner {
  constructor(engine) {
    this.engine = engine;
  }

  run(filepath) {
    if (!fs.existsSync(filepath)) {
      throw new Error(`File not found: ${filepath}`);
    }

    const ext = path.extname(filepath);
    if (ext !== '.lumos') {
      console.warn(`Warning: Expected .lumos file, got ${ext}`);
    }

    const code = fs.readFileSync(filepath, 'utf8');
    const lines = code.split(/\r?\n/);

    let result = null;
    let lineNumber = 1;

    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed === '' || trimmed.startsWith('//')) {
        lineNumber++;
        continue;
      }

      try {
        result = this.engine.execute(trimmed);
        if (result !== null && result !== undefined) {
          console.log(`Line ${lineNumber}: ${this.formatOutput(result)}`);
        }
      } catch (error) {
        console.error(`Error on line ${lineNumber}: ${error.message}`);
        console.error(`Code: ${trimmed}`);
        throw error;
      }

      lineNumber++;
    }

    return result;
  }

  runWithCompilation(filepath, target, outputPath) {
    if (!fs.existsSync(filepath)) {
      throw new Error(`File not found: ${filepath}`);
    }

    const code = fs.readFileSync(filepath, 'utf8');
    const compiled = this.engine.compileToTarget(code, target);

    if (outputPath) {
      fs.writeFileSync(outputPath, compiled);
      console.log(`Compiled output written to: ${outputPath}`);
    }

    return compiled;
  }

  formatOutput(value) {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'function') return '[Function]';
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return '[Object]';
      }
    }
    return String(value);
  }
}

module.exports = FileRunner;
