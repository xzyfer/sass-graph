
var assert = require("assert");
var path = require("path");

var fixtures = path.resolve("test/fixtures");
var files = {
  'a.scss': fixtures + "/a.scss",
  'b.scss': fixtures + "/b.scss",
  '_c.scss': fixtures + "/_c.scss"
}

describe('sass-graph', function(){
  var sassGraph = require("../sass-graph");

  describe('parsing a graph of all scss files', function(){
    var graph = sassGraph.parseDir(fixtures);

    it('should have all files', function(){
      assert.equal(Object.keys(files).length, Object.keys(graph.index).length);
    })

    it('should have the correct imports for a.scss', function() {
      assert.deepEqual([files['b.scss']], graph.index[files['a.scss']].imports);
    });

    it('should have the correct importedBy for _c.scss', function() {
      assert.deepEqual([files['b.scss']], graph.index[files['_c.scss']].importedBy);
    });

    it('should traverse ancestors of _c.scss', function() {
      ancestors = [];
      graph.visitAncestors(files['_c.scss'], function(k) {
        ancestors.push(k);
      })

      assert.deepEqual([files['b.scss'], files['a.scss']], ancestors);
    });
  })
})
