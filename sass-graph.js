'use strict';

var fs = require('fs');
var path = require('path');
var includes = require('lodash/includes');
var intersection = require('lodash/intersection');
var uniq = require('lodash/uniq');
var glob = require('glob');
var parseImports = require('./parse-imports');

function identity (value) {
  return value;
}

// resolve a sass module to a path
function resolveSassPath(sassPath, loadPaths, extensions) {
  // trim sass file extensions
  var re = new RegExp('(\.('+extensions.join('|')+'))$', 'i');
  var sassPathName = sassPath.replace(re, '');
  // check all load paths
  var i, j, length = loadPaths.length, scssPath, partialPath;
  for (i = 0; i < length; i++) {
    for (j = 0; j < extensions.length; j++) {
      scssPath = path.normalize(loadPaths[i] + '/' + sassPathName + '.' + extensions[j]);
      try {
        if (fs.lstatSync(scssPath).isFile()) {
          return scssPath;
        }
      } catch (e) {}
    }

    // special case for _partials
    for (j = 0; j < extensions.length; j++) {
      scssPath = path.normalize(loadPaths[i] + '/' + sassPathName + '.' + extensions[j]);
      partialPath = path.join(path.dirname(scssPath), '_' + path.basename(scssPath));
      try {
        if (fs.lstatSync(partialPath).isFile()) {
          return partialPath;
        }
      } catch (e) {}
    }
  }

  // File to import not found or unreadable so we assume this is a custom import
  return false;
}

function Graph(options, dir) {
  this.dir = dir;
  this.extensions = options.extensions || [];
  this.exclude = options.exclude instanceof RegExp ? options.exclude : null;
  this.index = {};
  this.follow = options.follow || false;
  this.loadPaths = (options.loadPaths || []).map(function(p) {
    return path.resolve(p);
  });

  if (dir) {
    var graph = this;
    glob.sync(dir+'/**/*.@('+this.extensions.join('|')+')', { dot: true, nodir: true, follow: this.follow }).forEach(function(file) {
      try {
        graph.addFile(path.resolve(file));
      } catch (e) {}
    });
  }
}

// add a sass file to the graph
Graph.prototype.addFile = function(filepath, parent) {
  if (this.exclude !== null && this.exclude.test(filepath)) return;

  var entry = this.index[filepath] = this.index[filepath] || {
    imports: [],
    importedBy: [],
    modified: fs.statSync(filepath).mtime
  };

  var resolvedParent;
  var isIndentedSyntax = path.extname(filepath) === '.sass';
  var imports = parseImports(fs.readFileSync(filepath, 'utf-8'), isIndentedSyntax);
  var cwd = path.dirname(filepath);

  var i, length = imports.length, loadPaths, resolved;
  for (i = 0; i < length; i++) {
    loadPaths = uniq([cwd, this.dir].concat(this.loadPaths).filter(identity));
    resolved = resolveSassPath(imports[i], loadPaths, this.extensions);
    if (!resolved) continue;

    // check exclcude regex
    if (this.exclude !== null && this.exclude.test(resolved)) continue;

    // recurse into dependencies if not already enumerated
    if (!includes(entry.imports, resolved)) {
      entry.imports.push(resolved);
      this.addFile(fs.realpathSync(resolved), filepath);
    }
  }

  // add link back to parent
  if (parent) {
    resolvedParent =  intersection(parent, this.loadPaths);

    if (resolvedParent) {
      resolvedParent = parent.substr(parent.indexOf(resolvedParent));
    } else {
      resolvedParent = parent;
    }

    // check exclcude regex
    if (!(this.exclude !== null && this.exclude.test(resolvedParent))) {
      entry.importedBy.push(resolvedParent);
    }
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
  if (!this.index.hasOwnProperty(filepath)) {
    edgeCallback('Graph doesn\'t contain ' + filepath, null);
  }
  var edges = edgeCallback(null, this.index[filepath]);

  var i, length = edges.length;
  for (i = 0; i < length; i++) {
    if (!includes(visited, edges[i])) {
      visited.push(edges[i]);
      callback(edges[i], this.index[edges[i]]);
      this.visit(edges[i], callback, edgeCallback, visited);
    }
  }
};

function processOptions(options) {
  return Object.assign({
    loadPaths: [process.cwd()],
    extensions: ['scss', 'sass'],
  }, options);
}

module.exports.parseFile = function(filepath, options) {
  if (fs.lstatSync(filepath).isFile()) {
    filepath = path.resolve(filepath);
    options = processOptions(options);
    var graph = new Graph(options);
    graph.addFile(filepath);
    return graph;
  }
  // throws
};

module.exports.parseDir = function(dirpath, options) {
  if (fs.lstatSync(dirpath).isDirectory()) {
    dirpath = path.resolve(dirpath);
    options = processOptions(options);
    var graph = new Graph(options, dirpath);
    return graph;
  }
  // throws
};
