var parseImports = require('../parse-imports');
var assert = require('chai').assert;
var path = require('path');

describe('parse-imports', function () {
  it('should parse single import with single quotes', function () {
    var scss = "@import 'app';";
    var result = parseImports(scss);
    assert.deepEqual(['app'], result);
  });

  it('should parse single import with double quotes', function () {
    var scss = '@import "app";';
    var result = parseImports(scss);
    assert.deepEqual(['app'], result);
  });

  it('should parse single import with extra spaces after import', function () {
    var scss = '@import  "app";';
    var result = parseImports(scss);
    assert.deepEqual(['app'], result);
  });

  it('should parse single import with extra spaces before ;', function () {
    var scss = '@import "app" ;';
    var result = parseImports(scss);
    assert.deepEqual(['app'], result);
  });

  it('should parse two individual imports', function () {
    var scss = '@import "app"; \n' +
               '@import "foo"; \n';
    var result = parseImports(scss);
    assert.deepEqual(['app', 'foo'], result);
  });

  it('should parse two imports on same line', function () {
    var scss = '@import "app", "foo";';
    var result = parseImports(scss);
    assert.deepEqual(['app', 'foo'], result);
  });

  it('should parse two imports continued on multiple lines ', function () {
    var scss = '@import "app", \n' +
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

  it('should not parse import in CSS comment', function () {
    var scss = '@import "app"; \n' +
               '/*@import "foo";*/ \n' +
               '@import /*"bar";*/ "baz"';
    var result = parseImports(scss);
    assert.deepEqual(['app', 'baz'], result);
  });

  it('should not parse import in Sass comment', function () {
    var scss = '@import "app"; \n' +
               '//@import "foo"; \n' +
               '@import //"bar"; \n'+
                        '"baz"';
    var result = parseImports(scss);
    assert.deepEqual(['app', 'baz'], result);
  });
});
