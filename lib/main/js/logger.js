'use strict';

var LOGGER_CONSTANTS = require('./constants/logger-constants');

var collections = {
    logs: [],
    warns: [],
    errors: [],
    infos: []
};

var currentLevel = LOGGER_CONSTANTS.DEBUG_LOG_LEVEL;

/**
 * @interface Logger
 */

/**
 * @typedef {Object} Logger.Log
 * @property {String} tag
 * @property {String} code
 * @property {String} context
 * @property {String} message
 * @property {Array} args
 * @memberOf Logger
 */

function createMessage(_ref) {
    var type = _ref.type,
        tag = _ref.tag,
        context = _ref.context,
        code = _ref.code,
        message = _ref.message;

    var logMessage = '[' + type + '] [' + tag + '~' + context + ']';

    if (code) {
        logMessage += ' [' + code + ']';
    }

    logMessage += ' ' + message;

    return logMessage;
}

function createLogLevelNumber() {
    if (LOGGER_CONSTANTS.INFO_LOG_LEVEL) {
        return 1;
    } else if (LOGGER_CONSTANTS.ERROR_LOG_LEVEL) {
        return 2;
    } else if (LOGGER_CONSTANTS.NONE_LOG_LEVEL) {
        return -1;
    } else {
        return 0;
    }
}

function isLogLevel(level) {
    if (currentLevel === LOGGER_CONSTANTS.NONE_LOG_LEVEL) {
        return false;
    }
    return createLogLevelNumber(level) >= createLogLevelNumber(currentLevel);
}

module.exports.log = function (tag, context, message, code) {
    for (var _len = arguments.length, args = Array(_len > 4 ? _len - 4 : 0), _key = 4; _key < _len; _key++) {
        args[_key - 4] = arguments[_key];
    }

    if (isLogLevel(LOGGER_CONSTANTS.DEBUG_LOG_LEVEL)) {
        console.log.apply(null, [createMessage({ type: 'LOG', tag: tag, context: context, code: code, message: message })].concat(args));
    }

    collections.logs.push({
        tag: tag,
        context: context,
        code: code,
        message: message,
        args: args
    });
};

module.exports.warn = function (tag, context, message, code) {
    for (var _len2 = arguments.length, args = Array(_len2 > 4 ? _len2 - 4 : 0), _key2 = 4; _key2 < _len2; _key2++) {
        args[_key2 - 4] = arguments[_key2];
    }

    if (isLogLevel(LOGGER_CONSTANTS.INFO_LOG_LEVEL)) {
        console.warn.apply(null, [createMessage({ type: 'WARN', tag: tag, context: context, code: code, message: message })].concat(args));
    }

    collections.warns.push({
        tag: tag,
        context: context,
        code: code,
        message: message,
        args: args
    });
};

module.exports.error = function (tag, context, message, code) {
    for (var _len3 = arguments.length, args = Array(_len3 > 4 ? _len3 - 4 : 0), _key3 = 4; _key3 < _len3; _key3++) {
        args[_key3 - 4] = arguments[_key3];
    }

    if (isLogLevel(LOGGER_CONSTANTS.ERROR_LOG_LEVEL)) {
        console.error.apply(null, [createMessage({ type: 'ERROR', tag: tag, context: context, code: code, message: message })].concat(args));
    }

    collections.errors.push({
        tag: tag,
        context: context,
        code: code,
        message: message,
        args: args
    });
};

module.exports.info = function (tag, context, message, code) {
    for (var _len4 = arguments.length, args = Array(_len4 > 4 ? _len4 - 4 : 0), _key4 = 4; _key4 < _len4; _key4++) {
        args[_key4 - 4] = arguments[_key4];
    }

    if (isLogLevel(LOGGER_CONSTANTS.INFO_LOG_LEVEL)) {
        console.info.apply(null, [createMessage({ type: 'INFO', tag: tag, context: context, code: code, message: message })].concat(args));
    }

    collections.infos.push({
        tag: tag,
        context: context,
        code: code,
        message: message,
        args: args
    });
};

module.exports.clear = function () {
    collections.logs.splice(0, collections.logs.length);
    collections.warns.splice(0, collections.warns.length);
    collections.errors.splice(0, collections.errors.length);
    collections.infos.splice(0, collections.infos.length);
};

/**
 * @param {String} [type]
 * @param {String} [tag]
 * @param {String} [context]
 * @param {String} [code]
 * @return {Array<Logger.Log>}
 */
module.exports.getCollections = function (_ref2) {
    var type = _ref2.type,
        tag = _ref2.tag,
        context = _ref2.context,
        code = _ref2.code;

    var filteredCollections = [];

    for (var logType in collections) {
        if (!type || type === logType) {
            filteredCollections = filteredCollections.concat(collections[logType].filter(function (log) {
                return (tag && log.tag === tag || !tag) && (context && log.context === context || !context) && (code && log.code === code || !code);
            }));
        }
    }

    return filteredCollections;
};

module.exports.level = currentLevel;
module.exports.setLevel = function (level) {
    return currentLevel = level;
};
/** @type {Array<Logger.Log>} */
module.exports.logs = collections.logs;
/** @type {Array<Logger.Log>} */
module.exports.warns = collections.warns;
/** @type {Array<Logger.Log>} */
module.exports.errors = collections.errors;
/** @type {Array<Logger.Log>} */
module.exports.infos = collections.infos;