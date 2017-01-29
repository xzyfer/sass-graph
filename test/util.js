var assert = require('chai').assert;
var fs = require('fs');
var path = require('path');
var sassGraph = require('..');

var fixtures = path.resolve(path.join('test', 'fixtures'));

var fixture = function(name) {
  return function(file) {
    if (!file) file = 'index.scss';
    return path.join(fixtures, name, file);
  };
};

var graph = function(opts) {
  var instance, dir;

  return  {
    fromFixtureDir: function(name) {
      dir = fixture(name);
      instance = sassGraph.parseDir(path.dirname(dir()), opts);
      return this;
    },

    fromFixtureFile: function(name) {
      dir = fixture(name);
      instance = sassGraph.parseFile(dir(), opts);
      return this;
    },

    assertDecendents: function(expected) {
      var actual = [];

      instance.visitDescendents(dir(), function(imp) {
        actual.push(imp)
      });

      assert.deepEqual(expected.map(dir), actual);
      return this;
    },

    assertAncestors: function(file, expected) {
      var actual = [];

      instance.visitAncestors(dir(file), function(imp) {
        actual.push(imp)
      });

      assert.deepEqual(expected.map(dir), actual);
      return this;
    },
  };
};

module.exports.fixture = fixture;
module.exports.graph = graph;
