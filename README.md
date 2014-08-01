es6-module-transpiler-hooked-resolver
=====================================
ES6 Module Transpiler - Resolver with support for custom hooks

## Overview

ES6 Module Transpiler `es6-module-transpiler` is an experimental compiler that allows you to write your JavaScript using a subset of the current ES6 module syntax, and compile it into various formats. When used as a library in an importing node module it is required that one or more FileResolvers be provided.

This module is built to make it easier to hook into the FileResolver and perform custom logic for doing things like resolving paths and manipulating ASTs.

[es6-module-transpiler]: https://github.com/square/es6-module-transpiler

## Usage

### Build tools

Since this resolver is a plugin for [es6-module-transpiler], you can use it with any existing build tool that supports [es6-module-transpiler] as the underlying engine to transpile the ES6 modules.

You just need to make sure that `es6-module-transpiler-hooked-resolver` is accessible for those tools, and pass the proper `resolvers` option thru the [es6-module-transpiler]'s configuration.

### Library

You should use the hooked resolver with the transpiler as a library:

```javascript
var fs              = require("fs");
var transpiler      = require("es6-module-transpiler");
var BundleFormatter = transpiler.formatters.bundle;
var Container       = transpiler.Container;
var Module          = require("es6-module-transpiler/lib/module");
var recast          = require("recast");
var HookedResolver  = require("es6-module-transpiler-hooked-resolver");

// NOTE: if a hook returns false it will not continue to the following phases
var hooks = {
    locate: function(importedPath, load) {
        // return a fully resolved path for the module
        return this.resolvePath(importedPath, load.fromModule);
    },

    fetch: function(resolvedPath, load) {
        // retrieve and return the modules source
        return fs.readFileSync(resolvedPath);
    },

    translate: function(source, load) {
        // return an es6-module-transpiler compatible AST
        return recast.parse(source);
    },

    instantiate: function(ast, load) {
        // return an instance of Module
        var module = new Module(load.resolvedPath, load.importedPath, load.container);
        module.ast = ast;
        return module;
    }
};

var container = new Container({
  resolvers: [new HookedResolver(["lib/"], hooks)],
  formatter: new SystemFormatter()
});

container.getModule("index");
container.write("out/mylib.js");
```

## Supported ES6 Module Syntax

Again, this syntax is in flux and is closely tracking the module work being done by TC39. This package relies on the syntax supported by [es6-module-transpiler], which relies on [esprima], you can have more information about the supported syntax here: https://github.com/square/es6-module-transpiler#supported-es6-module-syntax

[esprima]: https://github.com/ariya/esprima

## Contributing

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request

Thanks, and enjoy living in the ES6 future!
