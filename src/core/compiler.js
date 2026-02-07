const AssemblyBackends = {
  x86: require('../backends/assembly/x86'),
  arm: require('../backends/assembly/arm'),
  wasm: require('../backends/assembly/wasm')
};

const CompiledBackends = {
  c: require('../backends/compiled/c'),
  cpp: require('../backends/compiled/cpp'),
  rust: require('../backends/compiled/rust'),
  go: require('../backends/compiled/go'),
  java: require('../backends/compiled/java'),
  csharp: require('../backends/compiled/csharp'),
  swift: require('../backends/compiled/swift')
};

const InterpretedBackends = {
  python: require('../backends/interpreted/python'),
  ruby: require('../backends/interpreted/ruby'),
  php: require('../backends/interpreted/php'),
  perl: require('../backends/interpreted/perl'),
  lua: require('../backends/interpreted/lua')
};

const ScriptingBackends = {
  javascript: require('../backends/scripting/javascript'),
  typescript: require('../backends/scripting/typescript'),
  bash: require('../backends/scripting/bash'),
  powershell: require('../backends/scripting/powershell'),
  vbscript: require('../backends/scripting/vbscript')
};

const FunctionalBackends = {
  haskell: require('../backends/functional/haskell'),
  scala: require('../backends/functional/scala'),
  elixir: require('../backends/functional/elixir'),
  erlang: require('../backends/functional/erlang'),
  fsharp: require('../backends/functional/fsharp'),
  clojure: require('../backends/functional/clojure')
};

const WebBackends = {
  html: require('../backends/web/html'),
  css: require('../backends/web/css'),
  jsx: require('../backends/web/jsx'),
  vue: require('../backends/web/vue')
};

const DatabaseBackends = {
  sql: require('../backends/database/sql'),
  postgresql: require('../backends/database/postgresql'),
  mysql: require('../backends/database/mysql'),
  sqlite: require('../backends/database/sqlite'),
  mongodb: require('../backends/database/mongodb')
};

const SpecializedBackends = {
  ada: require('../backends/specialized/ada'),
  cobol: require('../backends/specialized/cobol'),
  fortran: require('../backends/specialized/fortran'),
  lisp: require('../backends/specialized/lisp'),
  prolog: require('../backends/specialized/prolog'),
  mlang: require('../backends/specialized/mlang')
};

class Compiler {
  constructor() {
    this.backends = {
      ...AssemblyBackends,
      ...CompiledBackends,
      ...InterpretedBackends,
      ...ScriptingBackends,
      ...FunctionalBackends,
      ...WebBackends,
      ...DatabaseBackends,
      ...SpecializedBackends
    };

    this.extensionMap = {
      x86: '.asm',
      arm: '.s',
      wasm: '.wat',
      c: '.c',
      cpp: '.cpp',
      rust: '.rs',
      go: '.go',
      java: '.java',
      csharp: '.cs',
      swift: '.swift',
      python: '.py',
      ruby: '.rb',
      php: '.php',
      perl: '.pl',
      lua: '.lua',
      javascript: '.js',
      typescript: '.ts',
      bash: '.sh',
      powershell: '.ps1',
      vbscript: '.vbs',
      haskell: '.hs',
      scala: '.scala',
      elixir: '.ex',
      erlang: '.erl',
      fsharp: '.fs',
      clojure: '.clj',
      html: '.html',
      css: '.css',
      jsx: '.jsx',
      vue: '.vue',
      sql: '.sql',
      postgresql: '.sql',
      mysql: '.sql',
      sqlite: '.sql',
      mongodb: '.js',
      ada: '.adb',
      cobol: '.cob',
      fortran: '.f90',
      lisp: '.lisp',
      prolog: '.pl',
      mlang: '.m'
    };
  }

  compile(ast, target, options = {}) {
    const normalizedTarget = target.toLowerCase();

    if (!this.backends[normalizedTarget]) {
      throw new Error(`Unsupported compilation target: ${target}`);
    }

    const backend = this.backends[normalizedTarget];
    const compiled = backend.generate(ast, options);

    if (options.optimize) {
      return this.optimize(compiled, normalizedTarget);
    }

    return compiled;
  }

  getExtension(target) {
    const normalizedTarget = target.toLowerCase();
    return this.extensionMap[normalizedTarget] || '.txt';
  }

  optimize(code, target) {
    return code;
  }

  getSupportedTargets() {
    return Object.keys(this.backends);
  }

  getTargetInfo(target) {
    const normalizedTarget = target.toLowerCase();
    if (!this.backends[normalizedTarget]) {
      return null;
    }

    return {
      name: target,
      extension: this.getExtension(target),
      type: this.getTargetType(normalizedTarget),
      backend: this.backends[normalizedTarget]
    };
  }

  getTargetType(target) {
    if (AssemblyBackends[target]) return 'assembly';
    if (CompiledBackends[target]) return 'compiled';
    if (InterpretedBackends[target]) return 'interpreted';
    if (ScriptingBackends[target]) return 'scripting';
    if (FunctionalBackends[target]) return 'functional';
    if (WebBackends[target]) return 'web';
    if (DatabaseBackends[target]) return 'database';
    if (SpecializedBackends[target]) return 'specialized';
    return 'unknown';
  }
}

module.exports = Compiler;
