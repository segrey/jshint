"use strict";

var browserify = require("browserify");
var path       = require("path");
var version    = require("../package.json").version;

var srcDir     = path.join(__dirname, "../src");

var targets = ["web", "rhino"];

module.exports = function(target, done) {
  var bundle = browserify();

  done = done || function() {};

  if (targets.indexOf(target) === -1) {
    done(new Error("Unrecognized target: '" + target + "'"));
    return;
  }

  bundle.require(srcDir + "/jshint.js", { expose: "jshint" });

  return bundle.bundle(function(err, src) {
    var wrapped;

    if (err) {
      done(err);
      return;
    }

    wrapped = [ "/*! " + version + " */",
      "if (typeof java !== 'undefined' &&",
      "    typeof java.lang !== 'undefined' &&",
      "    typeof java.lang.System !== 'undefined') {",
      "  // rhino environment detected",
      "  if (typeof global === 'undefined' && typeof self === 'undefined' && typeof window === 'undefined') {",
      "    global = this;",
      "  }",
      "}",
      "else if (typeof window === 'undefined') {",
      "  window = {};",
      "}",
      "var JSHINT;",
      "(function () {",
        "var require;",
        src,
        "JSHINT = require('jshint').JSHINT;",
        "if (typeof exports === 'object' && exports) exports.JSHINT = JSHINT;",
      "}());"
    ];

    if (target === "rhino") {
      wrapped.splice(0, 0, "#!/usr/bin/env rhino", "var window = {};");
    }

    done(null, version, wrapped.join("\n"));
  });
};
