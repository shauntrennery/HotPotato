(function(module, require) {
  'use strict';

  var Utils = require('../lib/utils'),
    Game = require('../lib/game');

  var routes = {
    home: function(req, res) {
      Utils.render(req, res, 'index');
    },

    clear: function(req, res) {
      Game.clear();
      res.redirect('/');
    }
  };

  module.exports = routes;

}(module, require));