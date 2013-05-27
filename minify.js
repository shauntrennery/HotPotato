var Min = require("node-minify");

//
// Vendor JavaScript
//
new Min.minify({
    type: "gcc",
    fileIn: [
      "public/js/vendor/jquery.js",
      "public/js/vendor/hammer.min.js",
      "public/js/vendor/howler.min.js",
      "public/js/vendor/jquery.shake.js",
      "public/js/vendor/TweenMax.min.js"
    ],
    fileOut: "public/js/hp.libs.min.js",
    callback: function(err) {
      if(err) {
        console.log(err);
      }
    }
  }
);

//
// Core JavaScript
//
new Min.minify({
    type: "gcc",
    fileIn: [
      "public/js/hp.core.js"
    ],
    fileOut: "public/js/hp.core.min.js",
    callback: function(err) {
      if(err) {
        console.log(err);
      }
    }
  }
);