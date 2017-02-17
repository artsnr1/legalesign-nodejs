'use strict';

var request = require('request');
var Document = require('./document');
var Events = require('./events');
var path = require('path')

var Legalesign = function(apiUser, apiKey, opts) {

  if (!(this instanceof Legalesign)) {
    return new Legalesign(apiUser, apiKey, opts);
  }

  var DEFAULT_URL = 'https://legalesign.com/api/v1/';
  this.url = opts.url || DEFAULT_URL;

  var DEFAULT_HEADERS = {
    'Authorization': 'ApiKey ' + apiUser + ':' + apiKey,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  this.headers = opts.headers || DEFAULT_HEADERS;

  this.getDefaultURL = function() {
    return this.url;
  };

  this.getDefaultHeaders = function() {
    return this.headers;
  };

  this.options = opts || {};
  this.options.url = this.getDefaultURL();
  this.options.headers = this.getDefaultHeaders();

  // Expose Document object
  this.Document = Document;

  // Expose Events instance.
  this.Events = new Events(this.getDefaultHeaders());
};

Legalesign.prototype.resetOptions = function() {
  this.options.json = null;
  this.options.url = this.getDefaultURL();
};

Legalesign.prototype.send = function(document, callback) {
  var callback = callback || function() {};
  this.resetOptions();

  if (document.constructor !== Document) {
    document = new Document(document);
  }

  var options = Object.assign(this.options, {
    url: this.options + 'document/',
    json: document
  })

  var req = request.post(options, function(err, res, body) {
    if (err) {
      return callback(err, null);
    }

    if (res.statusCode != 201) {
      var message = body;
      if (!body) {
        message = 'Please review Group, Signer(s) and other related document information';
      }
      var error = 'Legalesign Error: ' + message;
      return callback(new Error(error), null);
    }

    return callback(null, body, res.headers);
  });
};

Legalesign.prototype.download = function(docId) {
  this.resetOptions();

  var options = Object.assign(this.options, {
    url: this.options.url + 'pdf/' + docId + '/',
    encoding: null
  })

  return new Promise(function(resolve, reject) {
    var req = request.get(options, function(err, res, body) {
      if (err) {
        return reject(err)
      }

      if (res.statusCode != 200) {
        return reject(res)
      }

      resolve(body, res)
    });
  });
};

module.exports = Legalesign;
