/* jshint node:true, undef:true, unused:true */

var fs           = require("fs"),
    path         = require("path"),
    util         = require("util"),
    recast       = require("recast"),
    transpiler   = require("es6-module-transpiler"),
    Module       = require("es6-module-transpiler/lib/module"),
    FileResolver = transpiler.FileResolver;

var defineProperty           = Object.defineProperty,
    getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor,
    getOwnPropertyNames      = Object.getOwnPropertyNames;

/**
 * Creates a constructor function inheriting from FileResolver
 * with custom extensions
 * 
 * @param  {Object} extensions
 * @return {Function}
 */
function extend(extensions) {
    var ParentResolver = isResolver(this) ? this : FileResolver;

    function CustomResolver() {
        ParentResolver.apply(this, arguments);
    }

    util.inherits(CustomResolver, ParentResolver);

    getOwnPropertyNames(extensions).forEach(function(key) {
        defineProperty(CustomResolver.prototype, key, getOwnPropertyDescriptor(extensions, key));
    });

    defineProperty(CustomResolver.prototype, "_parent", {
        value        : ParentResolver,
        enumerable   : false,
        writable     : false,
        configurable : true
    });

    CustomResolver.extend = extend;

    return CustomResolver;
}

/**
 * Checks if a constructor inherits from FileResolver
 * 
 * @param  {Function}  ctor
 * @return {Boolean}
 */
function isResolver(ctor) {
    return typeof ctor === "function" && ctor.prototype instanceof FileResolver;
}

/**
 * Provides an es6-module-transpiler valid file resolver
 * 
 * @constructor
 */
var ResolverFactory = extend({

    /**
     * Resolves `importedPath` imported by the given module `fromModule` to a
     * es6-module-transpiler Module instance
     * 
     * @param  {String} importedPath
     * @param  {String} fromModule
     * @param  {Container} container
     * @return {Module}
     */
    resolveModule : function(importedPath, fromModule, container) {
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
    },

    /**
     * Resolves `importedPath` imported by the given module `fromModule` to a
     * resolvedPath to be used in the fetch operation
     * 
     * @param  {String} importedPath
     * @param  {Object} load
     * @return {String}
     */
    locate : function(importedPath, load) {
        return this.resolvePath(importedPath, load.fromModule);
    },

    /**
     * Retrieves module source from location `resolvedPath`
     * 
     * @param  {String} resolvedPath
     * @param  {Object} load
     * @return {String}
     */
    fetch : function(resolvedPath, load) {
        if(load.module = load.container.getCachedModule(resolvedPath)) {
            return false;
        }
        return fs.readFileSync(resolvedPath);
    },

    /**
     * Parses module source into an es6-module-transpiler compatible ast
     * 
     * @param  {String} source
     * @param  {Object} load
     * @return {Object}
     */
    translate : function(source, load) {
        return recast.parse(source, {
            sourceFileName : path.basename(load.resolvedPath)
        });
    },

    /**
     * Creates a Module instance and assigns it the ast
     * 
     * @param  {Object} ast
     * @param  {Object} load
     * @return {Module}
     */
    instantiate : function(ast, load) {
        var module = new Module(load.resolvedPath, load.importedPath, load.container);
        module.ast = ast;
        return module;
    }
    
});

ResolverFactory.Module     = Module;
ResolverFactory.recast     = recast;
ResolverFactory.transpiler = transpiler;

module.exports = ResolverFactory;
