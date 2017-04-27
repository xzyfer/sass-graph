'use strict';

var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var glob = require('glob');
var assign = require('object.assign');
var parseImports = require('./parse-imports');

function removeExtensionsFromFile(filepath, extensions) {
  var re = new RegExp('(\.(' + extensions.join('|') + '))$', 'i');
  return filepath.replace(re, '');
};

function isFile(file) {
  try {
    return fs.lstatSync(file).isFile();
  } catch (e) {
    return false;
  }
};

function findFileWithExtension(filepath, extension) {
    var scssPath = filepath + '.' + extension;

    if (isFile(scssPath)) {
      return scssPath;
    }
};

function findPartialWithExtension(filepath, extension) {
    var scssPath = filepath + '.' + extension;
    var partialPath = path.join(path.dirname(scssPath), '_' + path.basename(scssPath));

    if (isFile(partialPath)) {
      return partialPath;
    }
};

function findFilesInDirectoryWithExtensions(directory, extensions) {
  return glob.sync(directory + '/**/*.@(' + extensions.join('|') + ')', {
    dot: true,
    nodir: true,
  });
};

// resolve a sass module to a path
function resolveSassPath(sassPath, loadPaths, extensions) {
  var sassPathName = removeExtensionsFromFile(sassPath, extensions);

  // check all load paths
  var i, j, basePath, scssPath, partialPath;
  for (i = 0; i < loadPaths.length; i++) {
    basePath = path.normalize(path.join(loadPaths[i], sassPathName));

    for (j = 0; j < extensions.length; j++) {
      scssPath = findFileWithExtension(basePath, extensions[j]);
      if (scssPath) return scssPath;
    }

    // special case for _partials
    for (j = 0; j < extensions.length; j++) {
      partialPath = findPartialWithExtension(basePath, extensions[j]);
      if (partialPath) return partialPath;
    }
  }

  // File to import not found or unreadable so we assume this is a custom import
  return false;
}

function getOrCreateGraphNode(index, filepath) {
  if (!index[filepath]) {
    index[filepath] = index[filepath] || {
      imports: [],
      importedBy: [],
      modified: fs.statSync(filepath).mtime
    };
  }

  return index[filepath];
};

function isIndentedSyntax(filepath) {
  return path.extname(filepath) === '.sass';
}

function sanitizePaths(filepaths) {
  // Make sure we're dealing with absolute paths.
  filepaths = _.map(filepaths, function(loadPath) {
    return path.resolve(loadPath);
  });

  // Remove any paths that resolve to the same absolute path
  filepaths = _.uniq(filepaths);

  // Remove any empty entries
  filepaths = _.filter(filepaths);

  return filepaths;
}

var defaults = {
  loadPaths: [process.cwd()],
  extensions: ['scss', 'css', 'sass'],
};

function Graph(options) {
  this.opts = assign({}, defaults, options);
  this.directories = [];
  this.opts.loadPaths = sanitizePaths(this.opts.loadPaths);

  // The graph
  this.index = {};
};

Graph.prototype.addDirectory = function(filepath) {
  this.directories.push(filepath);

  var files = findFilesInDirectoryWithExtensions(filepath, this.opts.extensions);

  _.each(files, function(file) {
    this.addFile(file);
  }.bind(this));
};

// add a sass file to the graph
Graph.prototype.addFile = function(filepath, parent) {

  var resolvedParent;
  var resolvedPath = path.resolve(filepath);
  var entry = getOrCreateGraphNode(this.index, resolvedPath);
  var imports = parseImports(fs.readFileSync(filepath, 'utf-8'), isIndentedSyntax(resolvedPath));

  var loadPaths = sanitizePaths(
    [path.dirname(resolvedPath)]    // prioritise the current file's directory
      .concat(this.directories)     // explicitly added directories (?)
      .concat(this.opts.loadPaths)  // loadPaths have the lowest priority
  );

    console.log('\n');
  console.log('addFile');
    console.log('resolvedPath', '\t', resolvedPath);
    console.log('filepath', '\t', filepath);
    console.log('parent', '\t', '\t', parent);
    console.log('imports', '\t', imports);

  var i, length = imports.length, resolved;
  for (i = 0; i < length; i++) {
    resolved = resolveSassPath(imports[i], loadPaths, this.opts.extensions);
    if (!resolved) continue;

    // recurse into dependencies if not already enumerated
    if (entry.imports.indexOf(resolved) === -1) {
      entry.imports.push(resolved);
      this.addFile(fs.realpathSync(resolved), filepath);
    }
  }

  // add link back to parent
  if (parent) {
    resolvedParent = resolveSassPath(parent, loadPaths, this.opts.extensions);
    console.log('\n');
    console.log('resolvedPath', '\t', resolvedPath);
    console.log('parent', '\t', '\t', parent);
    console.log('loadPaths', '\t', loadPaths);
    console.log('this.opts.extensions', '\t', this.opts.extensions);
    console.log('resolvedParent', '\t', resolvedParent);
    if (resolvedParent) {
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
    if (!_.includes(visited, edges[i])) {
      visited.push(edges[i]);
      callback(edges[i], this.index[edges[i]]);
      this.visit(edges[i], callback, edgeCallback, visited);
    }
  }
};

function processOptions(options) {
  return assign({
    loadPaths: [process.cwd()],
    extensions: ['scss', 'css', 'sass'],
  }, options);
}

module.exports.parseFile = function(filepath, options) {
  var stats = fs.lstatSync(filepath);
  if (!stats || !stats.isFile()) return new Graph();

  var resolvedPath = path.resolve(filepath);
  var opt = processOptions(options);
  var graph = new Graph(opt);
  graph.addFile(resolvedPath);
  return graph;
};

module.exports.parseDir = function(dirpath, options) {
  var stats = fs.lstatSync(dirpath);
  if (!stats || !stats.isDirectory()) return new Graph();

  var resolvedPath = path.resolve(dirpath);
  var opt = processOptions(options);
  var graph = new Graph(opt);
  graph.addDirectory(resolvedPath);
  return graph;
};
