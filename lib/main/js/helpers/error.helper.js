'use strict';

require('string-format-js');

/**
 * @param {Error|DialogDiffer.Error|null} err
 * @param {String} message
 * @param {String} [code]
 * @param {*} [args...]
 * @return {DialogDiffer.Error}
 */
module.exports.createError = function (err, message) {
  for (var _len = arguments.length, args = Array(_len > 3 ? _len - 3 : 0), _key = 3; _key < _len; _key++) {
    args[_key - 3] = arguments[_key];
  }

  var code = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

  code = err && err.code || code;
  message = (message || '').format.apply(message || '', args);
  err = err && err.args ? err.err : err || new Error(message, code);

  args = args.concat(err.args || []);

  return {
    code: code,
    message: message,
    err: err,
    stack: err.stack,
    args: args,
    toString: function toString() {
      var str = '';

      if (err.code) {
        str += '[' + code + '] ';
      }

      str += '' + err.message;

      return str;
    }
  };
};