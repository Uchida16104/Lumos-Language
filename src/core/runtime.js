class Runtime {
  constructor() {
    this.builtins = this.initializeBuiltins();
    this.modules = {};
  }

  initializeBuiltins() {
    return {
      print: (...args) => {
        console.log(...args);
        return null;
      },
      
      println: (...args) => {
        console.log(...args);
        return null;
      },
      
      input: (prompt = '') => {
        if (typeof window !== 'undefined') {
          return window.prompt(prompt);
        }
        return '';
      },
      
      len: (obj) => {
        if (Array.isArray(obj) || typeof obj === 'string') {
          return obj.length;
        }
        if (typeof obj === 'object' && obj !== null) {
          return Object.keys(obj).length;
        }
        return 0;
      },
      
      str: (value) => String(value),
      
      int: (value) => parseInt(value, 10),
      
      float: (value) => parseFloat(value),
      
      bool: (value) => Boolean(value),
      
      type: (value) => typeof value,
      
      range: (start, end, step = 1) => {
        const result = [];
        for (let i = start; i <= end; i += step) {
          result.push(i);
        }
        return result;
      },
      
      map: (arr, func) => arr.map(func),
      
      filter: (arr, func) => arr.filter(func),
      
      reduce: (arr, func, initial) => arr.reduce(func, initial),
      
      sort: (arr, compareFn) => arr.slice().sort(compareFn),
      
      reverse: (arr) => arr.slice().reverse(),
      
      join: (arr, separator = ',') => arr.join(separator),
      
      split: (str, separator) => str.split(separator),
      
      push: (arr, ...items) => {
        arr.push(...items);
        return arr;
      },
      
      pop: (arr) => arr.pop(),
      
      shift: (arr) => arr.shift(),
      
      unshift: (arr, ...items) => {
        arr.unshift(...items);
        return arr;
      },
      
      slice: (arr, start, end) => arr.slice(start, end),
      
      indexOf: (arr, item) => arr.indexOf(item),
      
      includes: (arr, item) => arr.includes(item),
      
      keys: (obj) => Object.keys(obj),
      
      values: (obj) => Object.values(obj),
      
      entries: (obj) => Object.entries(obj),
      
      assign: (target, ...sources) => Object.assign(target, ...sources),
      
      freeze: (obj) => Object.freeze(obj),
      
      seal: (obj) => Object.seal(obj),
      
      Math: {
        abs: Math.abs,
        acos: Math.acos,
        asin: Math.asin,
        atan: Math.atan,
        atan2: Math.atan2,
        ceil: Math.ceil,
        cos: Math.cos,
        exp: Math.exp,
        floor: Math.floor,
        log: Math.log,
        max: Math.max,
        min: Math.min,
        pow: Math.pow,
        random: Math.random,
        round: Math.round,
        sin: Math.sin,
        sqrt: Math.sqrt,
        tan: Math.tan,
        PI: Math.PI,
        E: Math.E
      },
      
      Date: {
        now: () => new Date(),
        parse: (str) => new Date(str),
        timestamp: () => Date.now(),
        format: (date, format) => date.toISOString()
      },
      
      JSON: {
        parse: JSON.parse,
        stringify: JSON.stringify
      },
      
      setTimeout: typeof setTimeout !== 'undefined' ? setTimeout : () => {},
      setInterval: typeof setInterval !== 'undefined' ? setInterval : () => {},
      clearTimeout: typeof clearTimeout !== 'undefined' ? clearTimeout : () => {},
      clearInterval: typeof clearInterval !== 'undefined' ? clearInterval : () => {},
      
      Promise: typeof Promise !== 'undefined' ? Promise : class {},
      
      fetch: typeof fetch !== 'undefined' ? fetch : async () => ({})
    };
  }

  loadModule(modulePath) {
    if (this.modules[modulePath]) {
      return this.modules[modulePath];
    }

    try {
      const module = require(modulePath);
      this.modules[modulePath] = module;
      return module;
    } catch (error) {
      throw new Error(`Failed to load module: ${modulePath}`);
    }
  }

  registerModule(name, module) {
    this.modules[name] = module;
  }

  getBuiltin(name) {
    return this.builtins[name];
  }

  hasBuiltin(name) {
    return name in this.builtins;
  }
}

module.exports = Runtime;
