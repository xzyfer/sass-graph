
# Sass Graph

Parses sass and exposes a graph of dependencies

## Install

Install with [npm](https://npmjs.org/package/sass-graph)

```
npm install --save-dev sass-graph
```

## Usage

Usage as a Node library:

    $ node
    > var sassGraph = require('./sass-graph');
    undefined
    > sassGraph.parseDir('tests/fixtures');
    { index: {,
        'tests/fixtures/a.scss': {
          imports: ['b.scss'],
          importedBy: [],
        },
        'tests/fixtures/b.scss': {
          imports: ['_c.scss'],
          importedBy: ['a.scss'],
        },
        'tests/fixtures/_c.scss': {
          imports: [],
          importedBy: ['b/scss'],
        },
      }}

Usage as a command line tool:

The command line tool will parse a graph and then either display ancestors, descendents or both.

    $ ./bin/sassgraph tests/fixtures tests/fixtures/a.scss -d
    tests/fixtures/a.scss
    tests/fixtures/b.scss
    tests/fixtures/_c.scss

## License

MIT © [Lachlan Donald](http://lachlan.me)
