(function(module) {
  'use strict';

  var config = {
    express: {
      port: 3000,
      cookieSecret: 'h0tpot1two'
    },

    site: {
      name: 'Hot Potato',
      url: 'http://localhost:3000',
      baseTitle: 'Hot Potato',
      description: 'A mobile version of the popular kids game, Hot Potato',
      keywords: 'Brown Bag, Presentation, Derivco, Node.js, Socket.io, Kids Game',
      googleAnalytics: {
        trackingId: 'UA-41203295-1'
      }
    },

    infoMessages: {

    },

    errorMessages: {
      default: 'An error has occurred. Please try again.',
      notFound: 'Page Not Found.',
      serverError: 'Server Error.'
    }
  };

  module.exports = config;

}(module));