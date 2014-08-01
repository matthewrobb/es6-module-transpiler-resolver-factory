/* jshint node:true, undef:true, unused:true */

var fs           = require("fs"),
    path         = require("path"),
    util         = require("util"),
    recast       = require("recast"),
    transpiler   = require("es6-module-transpiler"),
    Module       = require("es6-module-transpiler/lib/module"),
    FileResolver = transpiler.FileResolver;

function HookedResolver(paths, hooks) {
    FileResolver.call(this, paths || []);

    this.phases(function(phase) {
        if (typeof hooks[phase] === "function") {
            this[phase] = hooks[phase];
        }
    });
}

util.inherits(HookedResolver, FileResolver);

HookedResolver.prototype.resolveModule = function(importedPath, fromModule, container) {
    var load = {};

    load.importedPath = importedPath;
    load.fromModule   = fromModule;
    load.container    = container;
    load.resolver     = this;

    this.phases(function(phase, prev, key) {
        return (load[key] = this[phase](prev, load)) !== false;
    }, importedPath);

    return load.module;
};

HookedResolver.prototype.locate = function(importedPath, load) {
    return this.resolvePath(importedPath, fromModule);
};

HookedResolver.prototype.fetch = function(resolvedPath, load) {
    if(load.module = load.container.getCachedModule(resolvedPath)) {
        return false;
    }
    return fs.readFileSync(resolvedPath);
};

HookedResolver.prototype.translate = function(source, load) {
    return recast.parse(source, {
        sourceFileName : path.basename(load.resolvedPath)
    });
};

HookedResolver.prototype.instantiate = function(ast, load) {
    var mod = new Module(load.resolvedPath, load.importedPath, load.container);
    mod.ast = ast;
    return mod;
};

HookedResolver.prototype.phases = (function() {
    var phases = [ "locate", "fetch", "translate", "instantiate" ];

    phases.locate      = "resolvedPath";
    phases.fetch       = "source";
    phases.translate   = "ast";
    phases.instantiate = "module";

    return function(fn, result) {
        phases.every(function(phase) {
            result = fn.call(this, phase, result, phases[phase]);
            return result !== false;
        }, this);

        return result;
    };
}());

module.exports = HookedResolver;
