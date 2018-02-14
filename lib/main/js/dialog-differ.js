'use strict';

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @typedef {Object} DialogDiffer.Error
 * @property {String} code
 * @property {String} message
 * @property {Object} args
 * @property {Error} [err]
 * @property {*} stack
 * @property {String} toString
 * @memberOf DialogDiffer
 */

/**
 * @typedef {Object} DialogDiffer.DialogScreenshot
 * @property {String} id
 * @property {String} base64
 * @property {Number} height
 * @property {Number} width
 * @property {String} [path] Injected
 * @property {Function} [removeCallback] Injected
 * @memberOf DialogDiffer
 */

/**
 * @typedef {Object} DialogDiffer.DialogResultDiff
 * @property {Number} index
 * @property {String} result
 * @property {String} base64
 * @memberOf DialogDiffer
 */

/**
 * @typedef {Object} DialogDiffer.DialogOptions
 * @property {Array<{width: Number, height: Number}>} [sizes]
 * @property {Object} [extra] Extra data that can be stored in database
 * @memberOf DialogDiffer
 */

/**
 * @typedef {Object} DialogDiffer.Dialog
 * @property {String} version
 * @property {String} id
 * @property {String} url
 * @property {String} [hash]
 * @property {String} [waitForSelector]
 * @property {String} [crop]
 * @property {Number} [timeout]
 * @property {{code: String, message: String, args: Object, stack: Object}} [error] Injected
 * @property {Array<DialogDiffer.DialogScreenshot>} [screenshots] Injected
 * @property {DialogDiffer.DialogOptions} [options]
 * @memberOf DialogDiffer
 */

/**
 * @typedef {Object} DialogDiffer.Options
 * @property {Array<{width: Number, height: Number}>} sizes
 * @property {String} originalVersion
 * @property {String} currentVersion
 * @property {Boolean} [isForceSnap]
 * @property {Boolean} [isForceDiff]
 * @property {String} [database]
 * @property {String} [logLevel]
 * @memberOf DialogDiffer
 */

/**
 * @typedef {Object} DialogDiffer.DialogsResult
 * @property {String} dialogId
 * @property {DialogDiffer.Dialog|null} original
 * @property {DialogDiffer.Dialog|null} current
 * @property {String} originalVersion
 * @property {String} currentVersion
 * @property {DialogDiffer.DialogOptions} originalOptions
 * @property {DialogDiffer.DialogOptions} currentOptions
 * @property {String} result
 * @property {Array<DialogDiffer.DialogResultDiff>} differ
 * @memberOf DialogDiffer
 */

/**
 * @typedef {Object} DialogDiffer.SuiteStats
 * @property {Number} identical
 * @property {Number} changed
 * @property {Number} added
 * @property {Number} deleted
 * @property {Number} duration
 * @property {Number} error
 * @memberOf DialogDiffer
 */

/**
 * @typedef {Object} DialogDiffer.Suite
 * @property {String} [id] (Injected)
 * @property {DialogDiffer.Options} options
 * @property {Array<DialogDiffer.Dialog>} original
 * @property {Array<DialogDiffer.Dialog>} current
 * @memberOf DialogDiffer
 */

/**
 * @typedef {Object} DialogDiffer.SuiteResult
 * @property {String} id
 * @property {String} status
 * @property {String|null} errorCode
 * @property {Number} timestamp
 * @property {DialogDiffer.Options} options
 * @property {DialogDiffer.SuiteStats} stats
 * @property {Array<DialogDiffer.DialogsResult>} results
 * @memberOf DialogDiffer
 */

/**
 * @callback DialogDiffer.OnStartCallback
 * @param {DialogDiffer.Database.SuiteResult} suiteResult
 * @memberOf DialogDiffer
 */

/**
 * @callback DialogDiffer.OnSnapCallback
 * @memberOf DialogDiffer
 */

/**
 * @callback DialogDiffer.OnDiffCallback
 * @memberOf DialogDiffer
 */

/**
 * @callback DialogDiffer.OnEndCallback
 * @param {DialogDiffer.Database.SuiteResult} suiteResult
 * @memberOf DialogDiffer
 */

process.setMaxListeners(0);

var TAG = 'DialogDiffer';

var DatabaseHandler = require('./handlers/database.handler');
var SnapHandler = require('./handlers/snap.handler');
var DifferHandler = require('./handlers/differ.handler');
var logger = require('./logger');

var ERROR_CONSTANTS = require('./constants/error-constants');
var SUITE_CONSTANTS = require('./constants/suite-constants');
var DIFFER_CONSTANTS = require('./constants/differ-constants');
var LOGGER_CONSTANTS = require('./constants/logger-constants');

var ErrorHelper = require('./helpers/error.helper');
var SuiteHelper = require('./helpers/suite.helper');
var DialogHelper = require('./helpers/dialog.helper');

/**
 * @class
 */

var DialogDiffer = function () {
    function DialogDiffer() {
        (0, _classCallCheck3.default)(this, DialogDiffer);
    }

    (0, _createClass3.default)(DialogDiffer, null, [{
        key: 'diff',


        /**
         * @param {DialogDiffer.Suite} suite
         * @param {DialogDiffer.OnStartCallback} [onStart]
         * @param {DialogDiffer.OnSnapCallback} [onSnap]
         * @param {DialogDiffer.OnDiffCallback} [onDiff]
         * @param {DialogDiffer.OnEndCallback} [onEnd]
         * @return {Promise<DialogDiffer.SuiteResult, DialogDiffer.Error>}
         */
        value: function diff(suite) {
            var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
                _ref$onStart = _ref.onStart,
                onStart = _ref$onStart === undefined ? null : _ref$onStart,
                _ref$onSnap = _ref.onSnap,
                onSnap = _ref$onSnap === undefined ? null : _ref$onSnap,
                _ref$onDiff = _ref.onDiff,
                onDiff = _ref$onDiff === undefined ? null : _ref$onDiff,
                _ref$onEnd = _ref.onEnd,
                onEnd = _ref$onEnd === undefined ? null : _ref$onEnd;

            var databaseHandler = new DatabaseHandler();
            var differHandler = new DifferHandler(databaseHandler);
            var snapHandler = new SnapHandler(databaseHandler);

            logger.setLevel(suite.options.logLevel || LOGGER_CONSTANTS.NONE_LOG_LEVEL);

            return new _promise2.default(function (fulfill, reject) {
                SuiteHelper.validateSuite(suite).then(function () {
                    return databaseHandler.initDB(null, suite.options.database);
                }).then(function () {
                    return differHandler.initSuiteResult(suite, { onStart: onStart });
                }).then(function () {
                    return snapHandler.snapSuite(suite, { onSnap: onSnap });
                }).then(function () {
                    return differHandler.differSuite(suite, { onDiff: onDiff, onEnd: onEnd });
                }).then(fulfill).catch(function (err) {
                    logger.error(TAG, 'diff', err.toString(), (0, _stringify2.default)(err.args), err.stack);

                    differHandler.errorSuiteResult(suite, err).then(function () {
                        return databaseHandler.getSuiteResult(suite.id);
                    }).then(function (suiteResultDb) {
                        if (onEnd) {
                            onEnd(suiteResultDb);
                        }

                        reject(ErrorHelper.createError(err, 'Unexpected error', ERROR_CONSTANTS.UNEXPECTED_ERROR));
                    }).catch(function () {
                        reject(ErrorHelper.createError(err, 'Unexpected error', ERROR_CONSTANTS.UNEXPECTED_ERROR));
                    });
                });
            });
        }

        /**
         * @param {String} suiteId
         * @param {String} [database]
         * @return {Promise<DialogDiffer.SuiteResult>}
         */

    }, {
        key: 'getSuiteResult',
        value: function getSuiteResult(suiteId, database) {
            return new _promise2.default(function (fulfill, reject) {
                var databaseHandler = new DatabaseHandler();

                /** @type {DialogDiffer.SuiteResult} */
                var suiteResult = void 0;

                logger.setLevel(LOGGER_CONSTANTS.NONE_LOG_LEVEL);

                databaseHandler.initDB(null, database).then(function () {
                    return databaseHandler.getSuiteResult(suiteId);
                }).then(function (suiteResultDb) {
                    if (!suiteResultDb || suiteResultDb.status !== SUITE_CONSTANTS.FINISHED_STATUS) {
                        throw ErrorHelper.createError(null, 'Suite does not exist or is not finished', null, { suiteResultDb: suiteResultDb });
                    }

                    suiteResult = suiteResultDb;

                    return _promise2.default.all(suiteResultDb.results.map(function (suiteResultDialogsResultDb) {
                        return new _promise2.default(function (fulfill, reject) {
                            databaseHandler.getDialogsScreenshots([{ id: suiteResultDialogsResultDb.dialogId, version: suiteResultDialogsResultDb.originalVersion }, { id: suiteResultDialogsResultDb.dialogId, version: suiteResultDialogsResultDb.currentVersion }], DialogHelper.getDialogSizes(suiteResultDb.options.sizes, suiteResultDialogsResultDb.original || suiteResultDialogsResultDb.current)).then(fulfill).catch(reject);
                        });
                    }));
                }).then(
                /** @type {Array<Array<DialogDiffer.Database.DialogScreenshot>>} */
                function (results) {
                    results.forEach(function (dialogsScreenshotsDb, i) {
                        // set original dialog, if result is not added
                        if (suiteResult.results[i].original && suiteResult.results[i].result !== DIFFER_CONSTANTS.ADDED_DIFFER_RESULT) {
                            suiteResult.results[i].original.screenshots = dialogsScreenshotsDb[0];
                        } else {
                            suiteResult.results[i].original = null;
                        }

                        // set current dialog, if result is not deleted
                        if (suiteResult.results[i].current && suiteResult.results[i].result !== DIFFER_CONSTANTS.DELETED_DIFFER_RESULT) {
                            suiteResult.results[i].current.screenshots = dialogsScreenshotsDb[1];
                        } else {
                            suiteResult.results[i].current = null;
                        }

                        // set default differ results
                        suiteResult.results[i].differ = DialogHelper.getDialogSizes(suiteResult.options.sizes, suiteResult.results[i].original || suiteResult.results[i].current).map(function (_, i) {
                            return {
                                index: i,
                                result: DIFFER_CONSTANTS.IDENTICAL_DIFFER_RESULT,
                                base64: null
                            };
                        });
                    });

                    return _promise2.default.all(suiteResult.results.map(function (suiteResultDialogsResultDb) {
                        return new _promise2.default(function (fulfill, reject) {
                            databaseHandler.getDialogsResult(suiteResult.options, suiteResultDialogsResultDb.dialogId, suiteResultDialogsResultDb.originalVersion, suiteResultDialogsResultDb.currentVersion).then(fulfill).catch(reject);
                        });
                    }));
                }).then(
                /** @type {Array<DialogDiffer.Database.DialogsResult>} */
                function (results) {
                    results.forEach(function (dialogsResultDb, i) {
                        if (dialogsResultDb) {
                            suiteResult.results[i].differ = dialogsResultDb.differ;
                        } else {
                            // set differ to result
                            suiteResult.results[i].differ.forEach(function (diffResult) {
                                diffResult.result = suiteResult.results[i].result;
                            });
                        }
                    });

                    return _promise2.default.resolve(suiteResult);
                }).then(function (suiteResult) {
                    return fulfill(suiteResult);
                }).catch(function (err) {
                    return reject(ErrorHelper.createError(err, 'Could not get Suite', ERROR_CONSTANTS.GET_SUITE_ERROR, { suiteId: suiteId }));
                });
            });
        }

        /**
         * @return {Promise<Array<DialogDiffer.Database.SuiteResult>, DialogDiffer.Error>}
         */

    }, {
        key: 'getLastSuiteResults',
        value: function getLastSuiteResults(database) {
            return new _promise2.default(function (fulfill, reject) {
                var databaseHandler = new DatabaseHandler();

                logger.setLevel(LOGGER_CONSTANTS.NONE_LOG_LEVEL);

                databaseHandler.initDB(null, database).then(function () {
                    return databaseHandler.getLastSuiteResults();
                }).then(fulfill).catch(reject);
            });
        }

        /**
         * @param {String} dialogVersion
         * @param {String} [database]
         * @returns {Promise}
         */

    }, {
        key: 'deleteDialogs',
        value: function deleteDialogs(dialogVersion, database) {
            return new _promise2.default(function (fulfill, reject) {
                var databaseHandler = new DatabaseHandler();

                logger.setLevel(LOGGER_CONSTANTS.NONE_LOG_LEVEL);

                databaseHandler.initDB(null, database).then(function () {
                    return databaseHandler.deleteDialogsScreenshots(dialogVersion);
                }).then(fulfill).catch(reject);
            });
        }

        /**
         * @param {String} suiteId
         * @param {String} [database]
         * @returns {Promise}
         */

    }, {
        key: 'deleteSuiteResult',
        value: function deleteSuiteResult(suiteId, database) {
            return new _promise2.default(function (fulfill, reject) {
                var databaseHandler = new DatabaseHandler();

                logger.setLevel(LOGGER_CONSTANTS.NONE_LOG_LEVEL);

                databaseHandler.initDB(null, database).then(function () {
                    return databaseHandler.deleteSuiteResult(suiteId);
                }).then(fulfill).catch(reject);
            });
        }
    }, {
        key: 'ERROR_CONSTANTS',
        get: function get() {
            return ERROR_CONSTANTS;
        }
    }, {
        key: 'SUITE_CONSTANTS',
        get: function get() {
            return SUITE_CONSTANTS;
        }
    }, {
        key: 'DIFFER_CONSTANTS',
        get: function get() {
            return DIFFER_CONSTANTS;
        }
    }, {
        key: 'LOGGER_CONSTANTS',
        get: function get() {
            return LOGGER_CONSTANTS;
        }
    }]);
    return DialogDiffer;
}();

module.exports = DialogDiffer;