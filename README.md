es6-module-transpiler-resolver-factory
=====================================
ES6 Module Transpiler - Extendable multi-step FileResolver

## Overview

ES6 Module Transpiler `es6-module-transpiler` is an experimental compiler that allows you to write your JavaScript using a subset of the current ES6 module syntax, and compile it into various formats.

When used as a library in an importing node module it is required that one or more FileResolvers be provided. `es6-module-transpiler-resolver-factory` makes it easier to extend FileResolver and perform custom logic for doing things such as resolving paths and manipulating ASTs.

[es6-module-transpiler]: https://github.com/square/es6-module-transpiler

## Usage

### Build tools

Since this resolver is a plugin for [es6-module-transpiler], you can use it with any existing build tool that supports [es6-module-transpiler] as the underlying engine to transpile the ES6 modules.

You just need to make sure that `es6-module-transpiler-resolver-factory` is accessible for those tools, and pass the proper `resolvers` option thru the [es6-module-transpiler]'s configuration.

### Library

You should use the hooked resolver with the transpiler as a library:

```javascript
var transpiler      = require("es6-module-transpiler");
var BundleFormatter = transpiler.formatters.bundle;
var Container       = transpiler.Container;
var ResolverFactory  = require("es6-module-transpiler-resolver-factory");

var container = new Container({
  resolvers: [new ResolverFactory(["lib/"])],
  formatter: new BundleFormatter()
});

container.getModule("index");
container.write("out/mylib.js");
```

### Extending

You can also extend the ResolverFactory and provide overrides for each step:
```javascript
var ResolverFactory = require("es6-module-transpiler-resolver-factory");
var ESNextResolver  = ResolverFactory.extend({
    translate : function(source, load) {
        var ast = recast.parse(source, {
            sourceFileName : path.basename(load.resolvedPath)
        });

        // Run the ast through the esnext transformer before the module transformer
        return esnext.transform(ast);
    }
});

var container = new Container({
  resolvers: [new ESNextResolver(["lib/"])],
  formatter: new BundleFormatter()
});
```

### Resolver Steps

`es6-module-transpiler-resolver-factory` will go through a series of steps to resolve to a module instance. These steps are named such as to parallel the ES6 Loader hooks.

Each step function will always receive a load object as it's last parameter. This object tracks meta data about the module as it progresses from step to step.

- `resolver.locate(importedPath, load)` Resolves `importedPath` imported by the given module `fromModule` to a resolvedPath to be used in the fetch operation
- `resolver.fetch(resolvedPath, load)` Retrieves module source from location `resolvedPath`
- `resolver.translate(source, load)` Parses module source into an es6-module-transpiler compatible ast
- `resolver.instantiate(ast, load)` Creates a Module instance and assigns it the ast

### load object
- `load.fromModule` The importing module
- `load.importedPath` The path used by the importing module
- `load.container` The container these modules belong to
- `load.resolver` The resolver instance
- `load.resolvedPath` The fully resolved path
- `load.source` The raw module source
- `load.ast` A recast compatible AST produced from the module source
- `load.module` An instance of `es6-module-transpile/lib/module`

## Contributing

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request

Thanks, and enjoy living in the ES6 future!
