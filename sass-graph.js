'use strict';

var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var glob = require('glob');
var parseImports = require('./parse-imports');

// resolve a sass module to a path
function resolveSassPath(sassPath, loadPaths) {
  // trim any file extensions
  var sassPathName = sassPath.replace(/\.\w+$/, '');
  // check all load paths
  var result = [];
  _(loadPaths).forEach(function(aPath) {
    var scssPath = path.normalize(aPath + "/" + sassPathName + ".scss");
    if (fs.existsSync(scssPath)) {
      result.push(scssPath);
      return false;
    }
    // special case for _partials
    var partialPath = path.join(path.dirname(scssPath), "_" + path.basename(scssPath));
    if (fs.existsSync(partialPath)) {
      result.push(partialPath);
      return false;
    }
  }, this);

  if (result.length == 1) {
    return result[0];
  }

  var errMsg = "File to import not found or unreadable: " + sassPath;
  throw errMsg;
}

function Graph(loadPaths, dir) {
  this.dir = dir;
  this.loadPaths = loadPaths;
  this.index = {};

  if(dir) {
    var graph = this;
    _(glob.sync(dir+"/**/*.scss", {})).forEach(function(file) {
      graph.addFile(path.resolve(file));
    });
  }
}

// add a sass file to the graph
Graph.prototype.addFile = function(filepath, parent) {
  var entry = this.index[filepath] = this.index[filepath] || {
    imports: [],
    importedBy: [],
    modified: fs.statSync(filepath).mtime
  };

  var resolvedParent;
  var imports = parseImports(fs.readFileSync(filepath, 'utf-8'));
  var cwd = path.dirname(filepath);

  var iterationResult = [];
  _(imports).forEach(function(anImport) {
    [this.dir, cwd].forEach(function (path) {
      if (path && this.loadPaths.indexOf(path) === -1) {
        this.loadPaths.push(path);
      }
    }, this);

    var resolved = resolveSassPath(anImport, _.uniq(this.loadPaths));
    if (!resolved) {
      iterationResult.push(false);
      return false;
    }

    // recurse into dependencies if not already enumerated
    if(!_.contains(entry.imports, resolved)) {
      entry.imports.push(resolved);
      this.addFile(fs.realpathSync(resolved), filepath);
    }
  }, this);

  if (iterationResult.length == 1) {
    return false;
  }

  // add link back to parent
  if(parent) {
    resolvedParent = _.find(this.loadPaths, function(path) {
      return parent.indexOf(path) !== -1;
    });

    if (resolvedParent) {
      resolvedParent = parent.substr(parent.indexOf(resolvedParent));//.replace(/^\/*/, '');
    } else {
      resolvedParent = parent;
    }

    entry.importedBy.push(resolvedParent);
  }
};

// visits all files that are ancestors of the provided file
Graph.prototype.visitAncestors = function(filepath, callback) {
  this.visit(filepath, callback, function(err, node) {
    if (err || !node) return [];
    return node.importedBy;
  });
};

// visits all files that are descendents of the provided file
Graph.prototype.visitDescendents = function(filepath, callback) {
  this.visit(filepath, callback, function(err, node) {
    if (err || !node) return [];
    return node.imports;
  });
};

// a generic visitor that uses an edgeCallback to find the edges to traverse for a node
Graph.prototype.visit = function(filepath, callback, edgeCallback, visited) {
  filepath = fs.realpathSync(filepath);
  var visited = visited || [];
  if(!this.index.hasOwnProperty(filepath)) {
    edgeCallback("Graph doesn't contain " + filepath, null);
  }
  var edges = edgeCallback(null, this.index[filepath]);
  _(edges).forEach(function(edge) {
    if(!_.contains(visited, edge)) {
      visited.push(edge);
      callback(edge, this.index[edge]);
      this.visit(edge, callback, edgeCallback, visited);
    }
  }, this);
};

function processOptions(options) {
  options = options || {};
  if(!options.hasOwnProperty('loadPaths')) options['loadPaths'] = [];
  return options;
}

module.exports.parseFile = function(filepath, options) {
  var filepath = path.resolve(filepath);
  var options = processOptions(options);
  var graph = new Graph(options.loadPaths);
  graph.addFile(filepath);
  return graph;
};

module.exports.parseDir = function(dirpath, options) {
  var dirpath = path.resolve(dirpath);
  var options = processOptions(options);
  var graph = new Graph(options.loadPaths, dirpath);
  return graph;
};
