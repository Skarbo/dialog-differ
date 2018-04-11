'use strict';

var extend = require('extend');
var defaultConfig = require('../../../config.json');

/**
 * @param {DialogDiffer.Config} [config]
 * @return {DialogDiffer.Config}
 */
module.exports.getConfig = function () {
  var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  return extend(true, defaultConfig, config);
};