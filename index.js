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

    this.super = {};

    ["locate", "fetch", "translate", "instantiate"].forEach(function(phase) {
        if (typeof hooks[phase] === "function") {
            this.super[phase] = this[phase].bind(this);
            this[phase] = hooks[phase];
        }
    }, this);
}

util.inherits(HookedResolver, FileResolver);

HookedResolver.prototype.resolveModule = function(importedPath, fromModule, container) {
    var load  = {};

    load.importedPath = importedPath;
    load.fromModule   = fromModule;
    load.container    = container;
    load.resolver     = this;

    (load.resolvedPath = this.locate(importedPath, load))     !== false &&
    (load.source       = this.fetch(load.resolvedPath, load)) !== false &&
    (load.ast          = this.translate(load.source, load))   !== false &&
    (load.module       = this.instantiate(load.ast, load));

    return load.module;
};

HookedResolver.prototype.locate = function(importedPath, load) {
    return this.resolvePath(importedPath, load.fromModule);
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

HookedResolver.Module     = Module;
HookedResolver.recast     = recast;
HookedResolver.transpiler = transpiler;

module.exports = HookedResolver;
