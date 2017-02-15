'use strict';

var request = require('request');

var Events = function(headers) {
  this.options = {}
  this.options.headers = headers;
};

Events.prototype.setEventsOptions = function() {
  var DEFAULT_URL = 'https://eu-api.legalesign.com/api/';
  return DEFAULT_URL;
};

Events.prototype.resetOptions = function() {
  this.options.url = this.setEventsOptions();
};

Events.prototype.subscribe = function() {
  return new Promise(function(resolve, reject) {
    this.resetOptions();

    this.options.url += 'subscribe/';

    var req = request.post(this.options, function(err, res, body) {
      if (err) {
        return reject(err);
      }

      if (res.statusCode != 201) {
        var message = body;
        if (!body) {
          message = 'Please check the request is correct';
        }
        var error = 'Legalesign Error: ' + message;
        return reject(new Error(error));
      }

      resolve(body, res.headers)
    });
  }.bind(this));
};

module.exports = Events;
