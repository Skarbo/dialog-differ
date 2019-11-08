'use strict';

var extend = require('extend');
var defaultConfig = require('../../../config.json');

module.exports.getConfig = function () {
  var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  return extend(true, defaultConfig, config);
};