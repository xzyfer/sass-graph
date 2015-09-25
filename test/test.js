
var assert = require("assert");
var path = require("path");

var fixtures = path.resolve(path.join("test", "fixtures")),
    sass_fixtures = path.resolve(path.join("test", "fixtures-indent"));
var files = {
  'a.scss': path.join(fixtures, 'a.scss'),
  'b.scss': path.join(fixtures, 'b.scss'),
  '_c.scss': path.join(fixtures, '_c.scss'),
  'd.scss': path.join(fixtures, 'd.scss'),
  '_e.scss': path.join(fixtures, 'components', '_e.scss'),
  'f.scss': path.join(fixtures, 'f.scss'),
  'g.scss': path.join(fixtures, 'g.scss'),
  '_h.scss': path.join(fixtures, 'nested/_h.scss'),
  '_i.scss': path.join(fixtures, 'nested/_i.scss'),
  'i.scss': path.join(fixtures, '_i.scss'),
  'j.scss': path.join(fixtures, 'j.scss'),
  'k.l.scss': path.join(fixtures, 'components', 'k.l.scss'),
  'm.scss': path.join(fixtures, 'm.scss'),
  '_n.scss': path.join(fixtures, 'compass/_n.scss'),
  '_compass.scss': path.join(fixtures, 'components', '_compass.scss')
};
var sassfiles = {
  'sample.sass': path.join(sass_fixtures, 'sample.sass'),
  '_sassy.sass': path.join(sass_fixtures, 'components', '_sassy.sass'),
  '_more.sass': path.join(sass_fixtures, '_more.sass')
};

describe('sass-graph', function(){
  var sassGraph = require('../sass-graph');

  describe('parsing a graph of all scss files', function(){
    var graph = sassGraph.parseDir(fixtures, {loadPaths: [path.join(fixtures, 'components')]});

    it('should have all files', function(){
      assert.equal(Object.keys(files).length, Object.keys(graph.index).length);
    })

    it('should have the correct imports for a.scss', function() {
      assert.deepEqual([files['b.scss']], graph.index[files['a.scss']].imports);
    });

    it('should have the correct importedBy for _c.scss', function() {
      assert.deepEqual([files['b.scss']], graph.index[files['_c.scss']].importedBy);
    });

    it('should have the correct (nested) imports for g.scss', function() {
      var expectedDescendents = [files['_h.scss'], files['_i.scss']];
      var descendents = [];

      graph.visitDescendents(files['g.scss'], function (imp) {
        descendents.push(imp);
        assert.notEqual(expectedDescendents.indexOf(imp), -1);
      });
    });

    it('should ignore custom imports for m.scss', function() {
      assert.deepEqual([files['_compass.scss'] , files['_n.scss']], graph.index[files['m.scss']].imports);
    });

    it('should traverse ancestors of _c.scss', function() {
      ancestors = [];
      graph.visitAncestors(files['_c.scss'], function(k) {
        ancestors.push(k);
      })
      assert.deepEqual([files['b.scss'], files['a.scss']], ancestors);
    });

    it('should prioritize cwd', function() {
      var expectedDescendents = [files['_i.scss']];
      var descendents = [];

      graph.visitDescendents(files['_h.scss'], function (imp) {
        descendents.push(imp);
        assert.notEqual(expectedDescendents.indexOf(imp), -1);
      });
    });
  })

  describe('parseFile', function () {
    it('should parse imports', function () {
      var graph = sassGraph.parseFile(files['a.scss']);
      var expectedDescendents = [files['b.scss'], files['_c.scss']];
      var descendents = [];
      graph.visitDescendents(files['a.scss'], function (imp) {
        descendents.push(imp);
        assert.notEqual(expectedDescendents.indexOf(imp), -1);
      });
      assert.equal(expectedDescendents.length, descendents.length);
    });

    it('should parse imports with loadPaths', function () {
      var graph = sassGraph.parseFile(files['d.scss'], {loadPaths: [path.join(fixtures, 'components')]} );
      var expectedDescendents = [files['_e.scss']];
      var descendents = [];
      graph.visitDescendents(files['d.scss'], function (imp) {
        descendents.push(imp);
        assert.notEqual(expectedDescendents.indexOf(imp), -1);
      });
      assert.equal(expectedDescendents.length, descendents.length);
    });

    it('should parse sass import', function () {
      var graph = sassGraph.parseFile(sassfiles['sample.sass'], {
        extensions: ['sass']
      });
      var expectedDescendents = [sassfiles['_sassy.sass'], sassfiles['_more.sass']];
      var descendents = [];
      graph.visitDescendents(sassfiles['sample.sass'], function (imp) {
        descendents.push(imp);
        assert.notEqual(expectedDescendents.indexOf(imp), -1);
      });
      assert.equal(expectedDescendents.length, descendents.length);
    });

    it('should thow an error', function () {
      try {
        var graph = sassGraph.parseFile(files['d.scss']);
      } catch (e) {
        assert.equal(e, "File to import not found or unreadable: e");
      }
    });

    it('should not throw an error for a file with no dependencies with Array having added functions', function () {
      try {
        Array.prototype.foo = function() {
          return false;
        }
        var graph = sassGraph.parseFile(files['f.scss']);
      } catch (e) {
        assert.fail("Error: " + e);
      }
    });
  });
});
