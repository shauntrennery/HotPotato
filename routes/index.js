(function(module, require) {
  'use strict';

  var Routes = require('./routes'),
    Utils = require('../lib/utils');

  var routes = {
    init: function(app) {
      app.get('/clear', Routes.clear);
      app.get('/', Routes.home);

      // 404
      app.get('*', Utils.render404);
    }
  };

  module.exports = routes;

}(module, require));