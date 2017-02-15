'use strict';

var request = require('request');

var DEFAULT_URL = 'https://eu-api.legalesign.com/api/';

var Events = function(headers) {
  this.options = {}
  this.options.headers = headers;
};

Events.prototype.setOptions = function(options) {
  this.options = Object.assign(this.options || {}, options);
};

Events.prototype.resetOptions = function() {
  this.setOptions({ url: DEFAULT_URL, json: null });
};

Events.prototype.subscribe = function(postbackURL) {
  return new Promise(function(resolve, reject) {
    this.resetOptions();

    this.options.url += 'subscribe/';
    this.options.json = {
      url: postbackURL
    };

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
