# Lumos Language

Version 2.0.0 - Multi-Target Compiler & Interpreter

[![npm version](https://img.shields.io/npm/v/lumos-language.svg)](https://www.npmjs.com/package/lumos-language)

![Lumos Logo](Lumos.png)

## Overview

Lumos Language Enhanced is a comprehensive programming language implementation that supports compilation to over 100 target languages, frameworks, and technologies. This enhanced version builds upon the original Lumos Language with full-stack capabilities, multi-paradigm support, and professional-grade code generation.

## Features

### Core Capabilities

- Interactive REPL with multiline support
- File-based script execution
- Multi-target compilation to 100+ languages
- Full abstract syntax tree (AST) generation
- Comprehensive error handling
- Built-in standard library

### Language Paradigms Supported

- Imperative programming
- Object-oriented programming
- Functional programming
- Procedural programming
- Declarative programming
- Assembly-level programming

### Compilation Targets

#### Interpreted Languages
- Python
- Ruby

### Framework Support

#### Backend Frameworks
- Laravel (PHP)
- Django, FastAPI, Flask (Python)
- Express, NestJS, Fastify (Node.js)
- Phoenix (Elixir)
- Spring Boot (Java)
- ASP.NET (C#)
- Ruby on Rails

#### Frontend Frameworks
- React, Vue, Angular
- Next.js, Nuxt, Gatsby
- Svelte, SvelteKit
- Alpine.js, HTMX
- Tailwind CSS

#### Database ORMs
- Prisma, TypeORM
- SQLAlchemy, Django ORM
- ActiveRecord
- Sequelize

## Installation

```bash
npm install lumos-language
```

Or install globally:

```bash
npm install -g lumos-language
```

## Usage

### Interactive REPL

```bash
lumos
```

In the REPL:

```lumos
lumos> let x = 42
=> 42

lumos> def greet(name) { return "Hello, " + name }
=> [Function]

lumos> greet("World")
=> "Hello, World"

lumos> .compile python
Compiled to python:
---
x = 42

def greet(name):
    return "Hello, " + name
---
```

### Running Files

```bash
lumos script.lumos
```

### Compilation

Compile Lumos code to any target language:

```bash
lumos compile script.lumos python
lumos compile script.lumos rust
lumos compile script.lumos javascript
```

With optimization:

```bash
lumos compile script.lumos c --optimize
```

## Language Syntax

### Variables

```lumos
let x = 10
const PI = 3.14159
var message = "Hello"
```

### Functions

```lumos
def add(a, b) {
    return a + b
}

def fibonacci(n) {
    if (n <= 1) {
        return n
    }
    return fibonacci(n - 1) + fibonacci(n - 2)
}
```

### Classes

```lumos
class Person {
    let name
    let age
    
    def constructor(name, age) {
        this.name = name
        this.age = age
    }
    
    def greet() {
        return "Hello, I'm " + this.name
    }
}
```

### Control Flow

```lumos
if (x > 10) {
    print("Greater")
} elsif (x < 10) {
    print("Lesser")
} else {
    print("Equal")
}

while (x < 100) {
    x = x + 1
}

for i = 1 to 10 {
    print(i)
}
```

### Error Handling

```lumos
try {
    let result = riskyOperation()
} catch (error) {
    print("Error:", error)
} finally {
    cleanup()
}
```

## REPL Commands

- `.help` - Show help message
- `.exit` - Exit the REPL
- `.history` - Show command history
- `.compile [target]` - Compile to target language
- `.targets` - Show all available targets
- `.vars` - Show current variables
- `.clear` - Clear the console
- `.reset` - Reset the runtime

## Architecture

### Core Components

- **Lexer**: Tokenizes source code
- **Parser**: Generates Abstract Syntax Tree (AST)
- **Evaluator**: Executes AST directly
- **Compiler**: Orchestrates multi-target compilation
- **Runtime**: Provides built-in functions and module system

### Backend Generators

Each target language has a dedicated backend generator that transforms the Lumos AST into idiomatic target code. Generators handle:

- Syntax transformation
- Type mapping
- Standard library translation
- Platform-specific optimizations

## API Usage

```javascript
const LumosEngine = require('lumos-language-enhanced');

const engine = new LumosEngine();

const code = 'let x = 42';
const result = engine.execute(code);

const pythonCode = engine.compileToTarget(code, 'python');
const rustCode = engine.compileToTarget(code, 'rust');
```

## Testing

```bash
npm test
```

## Caution

- ***Please write all code on a single line.***

## Contributing

Contributions are welcome! Please read the contributing guidelines before submitting pull requests.

## License

MIT License - Copyright (c) 2025 Hirotoshi Uchida

## Credits

Created by Hirotoshi Uchida

Influenced by Python, JavaScript, Ruby, and other modern programming languages.

## Links

- [Documentation](https://cdn.glitch.global/a6e15949-0cae-4ce8-a653-5883a6d0adc5/Lumos.pdf)
- [GitHub Repository](https://github.com/Uchida16104/Lumos-Language)
- [npm Package](https://www.npmjs.com/package/lumos-language)
- [Official Website](https://lumos-language.glitch.me)

## Support

For issues and feature requests, please visit the [GitHub Issues](https://github.com/Uchida16104/Lumos-Language/issues) page.

## Changelog

### Version 2.0.0 (Enhanced)

- Added multi-target compilation support for 100+ languages
- Complete rewrite of lexer and parser
- New AST-based architecture
- Added comprehensive backend generators
- Enhanced REPL with compilation support
- Added class and module system
- Improved error handling and reporting
- Added framework integration support
- Full TypeScript support
- Database language support
- Assembly language support

### Version 1.1.2 (Original)

- Initial release
- Basic interpreter functionality
- Simple REPL
- Core language features

2025 © Hirotoshi Uchida
