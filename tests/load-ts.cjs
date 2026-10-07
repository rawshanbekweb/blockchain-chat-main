const { readFileSync } = require('node:fs');
const { resolve, dirname } = require('node:path');
const ts = require('typescript');
const Module = require('node:module');
module.exports = function load(relative, mocks = {}) {
  const filename = resolve(__dirname, '..', relative);
  const output = ts.transpileModule(readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const local = Module.createRequire(filename);
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', '__dirname', output)(name => name in mocks ? mocks[name] : local(name), mod, mod.exports, dirname(filename));
  return mod.exports;
};
