/* jshint node:true, undef:true, unused:true */

var fs           = require("fs"),
    path         = require("path"),
    util         = require("util"),
    recast       = require("recast"),
    transpiler   = require("es6-module-transpiler"),
    Module       = require("es6-module-transpiler/lib/module"),
    FileResolver = transpiler.FileResolver;

/**
 * Provides an es6-module-transpiler valid file resolver and optionally 
 * allows custom hooks for different resolution phases
 * 
 * @constructor
 */
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

/**
 * Resolves `importedPath` imported by the given module `fromModule` to a
 * es6-module-transpiler Module instance
 * 
 * @param  {String} importedPath
 * @param  {String} fromModule
 * @param  {Container} container
 * @return {Module}
 */
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

/**
 * Resolves `importedPath` imported by the given module `fromModule` to a
 * resolvedPath to be used in the fetch operation
 * 
 * @param  {String} importedPath
 * @param  {Object} load
 * @return {String}
 */
HookedResolver.prototype.locate = function(importedPath, load) {
    return this.resolvePath(importedPath, load.fromModule);
};

/**
 * Retrieves module source from location `resolvedPath`
 * 
 * @param  {String} resolvedPath
 * @param  {Object} load
 * @return {String}
 */
HookedResolver.prototype.fetch = function(resolvedPath, load) {
    if(load.module = load.container.getCachedModule(resolvedPath)) {
        return false;
    }
    return fs.readFileSync(resolvedPath);
};

/**
 * Parses module source into an es6-module-transpiler compatible ast
 * 
 * @param  {String} source
 * @param  {Object} load
 * @return {Object}
 */
HookedResolver.prototype.translate = function(source, load) {
    return recast.parse(source, {
        sourceFileName : path.basename(load.resolvedPath)
    });
};

/**
 * Creates a Module instance and assigns it the ast
 * 
 * @param  {Object} ast
 * @param  {Object} load
 * @return {Module}
 */
HookedResolver.prototype.instantiate = function(ast, load) {
    var module = new Module(load.resolvedPath, load.importedPath, load.container);
    module.ast = ast;
    return module;
};

HookedResolver.Module     = Module;
HookedResolver.recast     = recast;
HookedResolver.transpiler = transpiler;

module.exports = HookedResolver;
