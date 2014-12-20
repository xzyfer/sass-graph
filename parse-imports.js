var gonzales = require('gonzales-pe');
var _ = require('lodash');
var deepEqual = require('deep-equal');
var deepEqualStrictOpts = {strict: true};
var importNodePrefix = ['atrules', ["atkeyword", ["ident", "import"]]];

function parseImports(content, syntax) {
  var ast = gonzales.srcToAST({src: content, syntax: syntax});
  return extractImports(ast);
}

function extractImports(node) {
  if (isImportAstNode(node)) {
    return extractImportAstNode(node);
  }

  if (!_.isArray(node)) {
    return [];
  }

  var imports = [];
  node.forEach(function (element) {
    imports.push.apply(imports, extractImports(element));
  });

  return imports;
}

function extractImportAstNode(node) {
  var imports = [];

  for (var i = 2; i < node.length; i++) {
    var element = node[i];
    if (isStringAstNode(element)) {
      imports.push(trimQuotes(element[1]));
    }
  }

  return imports;
}

function isImportAstNode(node) {
  return _.isArray(node) && strictEqual(importNodePrefix, _.first(node, 2));
}

function isStringAstNode(node) {
  return _.isArray(node) && _.first(node) === 'string';
}

function strictEqual(lhs, rhs) {
  return deepEqual(lhs, rhs, deepEqualStrictOpts);
}

function trimQuotes(str) {
  return str.length < 3 ? str : str.substr(1, str.length - 2);
}

module.exports = parseImports;
