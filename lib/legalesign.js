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
    url: this.options.url + 'document/',
    json: document
  })

  var req = request.post(options, function(err, res, body) {
    if (err) {
      return callback(err, null);
    }

    if (res.statusCode != 201) {
      var message = JSON.stringify(body);
      if (!body) {
        message = 'Please review Group, Signer(s) and other related document information';
      }
      var error = 'Legalesign Error: ' + message;
      return callback(new Error(error), res);
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

Legalesign.prototype.refreshLink = function (docId) {
  var self = this
  this.resetOptions();

  var options = Object.assign(this.options, {
    url: this.options.url + 'document/' + docId + '/'
  });

  return new Promise(function(resolve, reject) {
    request.get(options, function (err, res, body) {
      if (err) {
        reject(err);
      }

      if (res.statusCode != 200) {
        reject(new Error(res));
      }

      // Pick out the signer and post off a refresh request.
      var parsedBody
      var signerPath

      try {
        parsedBody = JSON.parse(body)
        if (!parsedBody.signers) {
          throw new Error('no signers attached to document', parsedBody)
        }
        signerPath = parsedBody.signers[0][0].replace('/api/v1/', '')
      } catch (err) {
        reject(err)
      }

      self.resetOptions();
      var refreshOptions = Object.assign(self.options, {
        url: self.options.url + signerPath + 'new-link/'
      })

      request.get(refreshOptions, function (err, res, body) {
        if (err) {
          reject(err);
        }

        if (res.statusCode != 201) {
          reject(new Error(JSON.stringify(res)));
        }

        resolve(res);
      });
    });
  });
};

module.exports = Legalesign;
