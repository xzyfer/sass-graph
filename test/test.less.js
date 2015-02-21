
var assert = require("assert");
var path = require("path");

var fixtures = path.resolve("test/fixtures/less");
var files = {
  'a.less': fixtures + "/a.less",
  'b.less': fixtures + "/b.less",
  '_c.less': fixtures + "/_c.less",
  'd.less': fixtures + "/d.less",
  '_e.less': fixtures + "/components/_e.less",
  'f.less': fixtures + "/f.less"
};

describe('less-graph', function(){
  var lessGraph = require("../sass-graph");

  describe('parsing a graph of all less files', function(){
    var graph = lessGraph.parseDir(fixtures, {
      loadPaths: [fixtures + '/components'],
      extensions: '.less'
    });

    it('should have all files', function(){
      assert.equal(Object.keys(files).length, Object.keys(graph.index).length);
    });

    it('should have the correct imports for a.less', function() {
      assert.deepEqual([files['b.less']], graph.index[files['a.less']].imports);
    });

    it('should have the correct importedBy for _c.less', function() {
      assert.deepEqual([files['b.less']], graph.index[files['_c.less']].importedBy);
    });

    it('should traverse ancestors of _c.less', function() {
      var ancestors = [];
      graph.visitAncestors(files['_c.less'], function(k) {
        ancestors.push(k);
      });
      assert.deepEqual([files['b.less'], files['a.less']], ancestors);
    });
  });

  describe('parseFile', function () {
    it('should parse imports', function () {
      var graph = lessGraph.parseFile(files['a.less'], {
        extensions: '.less'
      });

      var expectedDescendents = [files['b.less'], files['_c.less']];
      var descendents = [];
      graph.visitDescendents(files['a.less'], function (imp) {
        descendents.push(imp);
        assert.notEqual(expectedDescendents.indexOf(imp), -1);
      });
      assert.equal(expectedDescendents.length, descendents.length);
    });
  });

  describe('parseFile', function () {
    it('should parse imports with loadPaths', function () {
      var graph = lessGraph.parseFile(files['d.less'], {
        loadPaths: [fixtures + '/components'],
        extensions: '.less'
      });

      var expectedDescendents = [files['_e.less']];
      var descendents = [];
      graph.visitDescendents(files['d.less'], function (imp) {
        descendents.push(imp);
        assert.notEqual(expectedDescendents.indexOf(imp), -1);
      });
      assert.equal(expectedDescendents.length, descendents.length);
    });
  });

  describe('parseFile', function () {
    it('should thow an error', function () {
      try {
        var graph = lessGraph.parseFile(files['d.less'], {
          extensions: '.less'
        });
      } catch (e) {
        assert.equal(e, "File to import not found or unreadable: e");
      }
    });
  });

  describe('parseFile', function () {
    it('should not throw an error for a file with no dependencies with Array having added functions', function () {
      try {
        Array.prototype.foo = function() {
          return false;
        };
        var graph = lessGraph.parseFile(files['f.less'], {
          extensions: '.less'
        });
      } catch (e) {
        assert.fail("Error: " + e);
      }
    });
  });
});
