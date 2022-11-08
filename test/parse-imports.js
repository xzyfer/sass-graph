var parseImports = require('../parse-imports');
var assert = require('chai').assert;
var path = require('path');

describe('parse-imports', function () {
  it('should parse single import with single quotes', function () {
    var scss = "@import 'app';";
    var result = parseImports(scss);
    var scssUse = "@use 'app';";
    var resultUse = parseImports(scssUse);
    assert.deepEqual(['app'], result);
    assert.deepEqual(['app'], resultUse);
  });

  it('should parse single import with double quotes', function () {
    var scss = '@import "app";';
    var result = parseImports(scss);
    var scssUse = '@use "app";';
    var resultUse = parseImports(scssUse);
    assert.deepEqual(['app'], result);
    assert.deepEqual(['app'], resultUse)
  });

  it('should parse single import without quotes', function () {
    var scss = '@import app;';
    var result = parseImports(scss);
    var scssUse = '@use app;';
    var resultUse = parseImports(scssUse);
    assert.deepEqual(['app'], result);
    assert.deepEqual(['app'], resultUse)
  });

  it('should parse single import without quotes in indented syntax', function () {
    var scss = '@import app';
    var result = parseImports(scss, true);
    var scssUse = '@use app';
    var resultUse = parseImports(scssUse);
    assert.deepEqual(['app'], result);
    assert.deepEqual(['app'], resultUse)
  });

  it('should parse unquoted import', function () {
    var scss = '@import include/app;\n' +
               '@import include/foo,\n' +
                  'include/bar;';
    var result = parseImports(scss);
    assert.deepEqual(['include/app', 'include/foo', 'include/bar'], result);
  });

  it('should parse unquoted use', function () {
    var scss = '@use include/app;\n' +
               '@use include/foo,\n' +
                  'include/bar;';
    var result = parseImports(scss);
    assert.deepEqual(['include/app', 'include/foo', 'include/bar'], result);
  });

  it('should parse single import with extra spaces after import', function () {
    var scss = '@import  "app";';
    var result = parseImports(scss);
    var scssUse = '@use  "app";';
    var resultUse = parseImports(scssUse);
    assert.deepEqual(['app'], result);
    assert.deepEqual(['app'], resultUse)
  });

  it('should parse single import with extra spaces before ;', function () {
    var scss = '@import "app" ;';
    var result = parseImports(scss);
    var scssUse = '@use "app" ;';
    var resultUse = parseImports(scssUse);
    assert.deepEqual(['app'], result);
    assert.deepEqual(['app'], resultUse)
  });

  it('should parse two individual imports', function () {
    var scss = '@import "app"; \n' +
               '@import "foo"; \n';
    var result = parseImports(scss);
    var scssUse = '@use "app"; \n' +
                  '@use "foo"; \n';
    var resultUse = parseImports(scssUse);
    assert.deepEqual(['app', 'foo'], result);
    assert.deepEqual(['app', 'foo'], resultUse);
  });

  it('should parse two individual use', function () {
    var scss = '@use "app"; \n' +
               '@use "foo"; \n';
    var result = parseImports(scss);
    assert.deepEqual(['app', 'foo'], result);
  });

  it('should parse two imports on same line', function () {
    var scss = '@import "app", "foo";';
    var result = parseImports(scss);
    var scssUse = '@use "app", "foo";';
    var resultUse = parseImports(scssUse);
    assert.deepEqual(['app', 'foo'], result);
    assert.deepEqual(['app', 'foo'], resultUse);
  });

  it('should parse two imports continued on multiple lines ', function () {
    var scss = '@import "app", \n' +
                   '"foo"; \n';
    var result = parseImports(scss);
    assert.deepEqual(['app', 'foo'], result);
  });

  it('should parse two use continued on multiple lines ', function () {
    var scss = '@use "app", \n' +
                   '"foo"; \n';
    var result = parseImports(scss);
    assert.deepEqual(['app', 'foo'], result);
  });

  it('should parse three imports with mixed style ', function () {
    var scss = '@import "app", \n' +
                        '"foo"; \n' +
               '@import "bar";';
    var result = parseImports(scss);
    assert.deepEqual(['app', 'foo', 'bar'], result);
  });

  it('should parse three use with mixed style ', function () {
    var scss = '@use "app", \n' +
                        '"foo"; \n' +
               '@use "bar";';
    var result = parseImports(scss);
    assert.deepEqual(['app', 'foo', 'bar'], result);
  });

  it('should not parse import in CSS comment', function () {
    var scss = '@import "app"; \n' +
               '/*@import "foo";*/ \n' +
               '/*@import "nav"; */ \n' +
               '@import /*"bar"; */ "baz"; \n' +
               '@import /*"bar";*/ "bam"';
    var result = parseImports(scss);
    assert.deepEqual(['app', 'baz', 'bam'], result);
  });

  it('should not parse use in CSS comment', function () {
    var scss = '@use "app"; \n' +
               '/*@use "foo";*/ \n' +
               '/*@use "nav"; */ \n' +
               '@use /*"bar"; */ "baz"; \n' +
               '@use /*"bar";*/ "bam"';
    var result = parseImports(scss);
    assert.deepEqual(['app', 'baz', 'bam'], result);
  });

  it('should not parse import in Sass comment', function () {
    var scss = '@import "app"; \n' +
               '//@import "foo"; \n' +
               '@import //"bar"; \n'+
                        '"baz"';
    var result = parseImports(scss);
    assert.deepEqual(['app', 'baz'], result);
  });

  it('should not parse use in Sass comment', function () {
    var scss = '@use "app"; \n' +
               '//@use "foo"; \n' +
               '@use //"bar"; \n'+
                        '"baz"';
    var result = parseImports(scss);
    assert.deepEqual(['app', 'baz'], result);
  });

  it('should not parse import in any comment', function () {
    var scss = '@import \n' +
      '// app imports foo\n' +
      '"app",\n' +
      '\n' +
      '/** do not import bar;\n' +
      ' "bar"\n' +
      '*/\n' +
      '\n' +
      '// do not import nav: "d",\n' +
      '\n' +
      '// footer imports nothing else\n' +
      '"baz"';
    var result = parseImports(scss);
    assert.deepEqual(['app', 'baz'], result);
  });

  it('should not parse use in any comment', function () {
    var scss = '@use \n' +
      '// app uses foo\n' +
      '"app",\n' +
      '\n' +
      '/** do not use bar;\n' +
      ' "bar"\n' +
      '*/\n' +
      '\n' +
      '// do not use nav: "d",\n' +
      '\n' +
      '// footer uses nothing else\n' +
      '"baz"';
    var result = parseImports(scss);
    assert.deepEqual(['app', 'baz'], result);
  });

  it('should throw error when invalid @import syntax is encountered', function () {
    var scss = '@import "a"\n' +
        '@import "b";';
    assert.throws(function() {
      parseImports(scss);
    });
  });

  it('should throw error when invalid @use syntax is encountered', function () {
    var scss = '@use "a"\n' +
        '@use "b";';
    assert.throws(function() {
      parseImports(scss);
    });
  });

  it('should not throw error when invalid @import syntax is encountered using indented syntax', function () {
    var scss = '@import a\n' +
        '@import b';
    assert.doesNotThrow(function() {
      parseImports(scss, true);
    });
  });

  it('should not throw error when invalid @use syntax is encountered using indented syntax', function () {
    var scss = '@use a\n' +
        '@use b';
    assert.doesNotThrow(function() {
      parseImports(scss, true);
    });
  });

  it('should parse a full css file', function () {
    var scss = '@import url("a.css");\n' +
        '@import url("b.scss");\n' +
        '@import "c.scss";\n' +
        '@import "d";\n' +
        '@import "app1", "foo1";\n' +
        '@import "app2",\n' +
        '  "foo2";\n' +
        '/********\n' +
        'reset\n' +
        '*********/\n' +
        '/*\n' +
        'table{\n' +
        '  border-collapse: collapse;\n' +
        '  width: 100%;\n' +
        '}\n' +
        '\n' +
        '  [class*="jimu"],\n' +
        '  [class*="jimu"] * {\n' +
        '  -moz-box-sizing: border-box;\n' +
        '  box-sizing: border-box;\n' +
        '}';
    var result = parseImports(scss);
    assert.deepEqual(["c.scss", "d", "app1", "foo1", "app2", "foo2"], result);
  });

  it('should parse @use a full css file', function () {
    var scss = '@use url("a.css");\n' +
        '@use url("b.scss");\n' +
        '@use "c.scss";\n' +
        '@use "d";\n' +
        '@use "app1", "foo1";\n' +
        '@use "app2",\n' +
        '  "foo2";\n' +
        '/********\n' +
        'reset\n' +
        '*********/\n' +
        '/*\n' +
        'table{\n' +
        '  border-collapse: collapse;\n' +
        '  width: 100%;\n' +
        '}\n' +
        '\n' +
        '  [class*="jimu"],\n' +
        '  [class*="jimu"] * {\n' +
        '  -moz-box-sizing: border-box;\n' +
        '  box-sizing: border-box;\n' +
        '}';
    var result = parseImports(scss);
    assert.deepEqual(["c.scss", "d", "app1", "foo1", "app2", "foo2"], result);
  });
});
