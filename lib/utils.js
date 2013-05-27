(function(module, require) {
  'use strict';

  var Config = require('../lib/config'),
    Util = require('util');

  var utils = {
    render: function(req, res, view, options) {
      options = options || {};
      options.site = Config.site;
      options.title = options.title || "";
      options.description = options.description || Config.site.description;
      options.err = options.err || false;
      options.info = options.info || false;

      if(options.title.length > 0) options.title = options.title + " - " + Config.site.baseTitle;

      res.render(view, options);
    },

    render404: function(req, res) {
      // respond with html page
      if(req.accepts("html")) {
        res.status(404);
        utils.render(req, res, "404", {title: Config.errorMessages.notFound, info: true});
        return;
      }

      // respond with json
      if(req.accepts("json")) {
        res.send({error: "Not found" });
        return;
      }

      // default to plain-text. send()
      res.type("txt").send("Not found");
    },

    render500: function(req, res, err) {
      res.status(500);
      utils.render(req, res, "500", {title: Config.errorMessages.serverError, err: true});
    }
  };

  module.exports = utils;

}(module, require));