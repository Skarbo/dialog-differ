'use strict';

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var extend = require('extend');
var defaultConfig = require('../../../config.json');

module.exports.getConfig = function () {
  var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var config_ = extend(true, defaultConfig, config);
  var args = process.argv.slice(2);

  args.forEach(function (arg) {
    var _slice = (arg.match(/--(\w+)=(\w+)/) || [null, null, null]).slice(1),
        _slice2 = (0, _slicedToArray3.default)(_slice, 2),
        key = _slice2[0],
        value = _slice2[1];

    if (key && config_.hasOwnProperty(key)) {
      try {
        config_.key = JSON.parse(value);
      } catch (err) {
        config_.key = value;
      }
    }
  });

  return config_;
};