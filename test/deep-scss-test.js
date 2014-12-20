
var assert = require("assert");
var path = require("path");

var fixtures = path.resolve("test/fixtures/deep");
var files = {
  'a.scss': fixtures + "/a.scss",
  'b.scss': fixtures + "/b.scss",
  'c.scss': fixtures + "/c.scss",
  'd.scss': fixtures + "/d.scss",
  'e.scss': fixtures + "/e.scss"
}

describe('deep sass-graph', function(){
  var sassGraph = require("../sass-graph");

  describe('parsing a graph of all scss files', function(){
    var graph = sassGraph.parseDir(fixtures, {loadPaths: [fixtures + '/components']});

    it('should have all files', function(){
      assert.equal(Object.keys(files).length, Object.keys(graph.index).length);
    })

    it('should have the correct imports for a.scss', function() {
      assert.deepEqual([files['b.scss'], files['c.scss'], files['d.scss'], files['e.scss']], graph.index[files['a.scss']].imports);
    });

  })

  describe('parseFile', function () {
    it('should parse multiline imports', function () {
      var graph = sassGraph.parseFile(files['a.scss']);
      var expectedDescendents = [files['b.scss'], files['c.scss'], files['d.scss'], files['e.scss']];
      var descendents = [];
      graph.visitDescendents(files['a.scss'], function (imp) {
        descendents.push(imp);
        assert.notEqual(expectedDescendents.indexOf(imp), -1);
      });
      assert.equal(descendents.length, expectedDescendents.length);
    });
  });

});
