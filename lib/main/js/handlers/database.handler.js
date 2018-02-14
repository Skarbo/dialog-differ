'use strict';

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var LowDbDatabaseLayer = require('../layers/lowdb-database.layer');

var ERROR_CONSTANTS = require('../constants/error-constants');
var SUITE_CONSTANTS = require('../constants/suite-constants');

var SuiteHelper = require('../helpers/suite.helper');
var DialogHelper = require('../helpers/dialog.helper');
var ErrorHelper = require('../helpers/error.helper');

/**
 * @interface DialogDiffer.Database
 * @memberOf DialogDiffer
 */

/**
 * @typedef {Object} DialogDiffer.Database.SearchDialogScreenshot
 * @property {Number} width
 * @property {Number} height
 * @memberOf DialogDiffer.Database
 */

/**
 * @typedef {Object} DialogDiffer.Database.DialogScreenshot
 * @property {String} id
 * @property {String} dialogId
 * @property {String} dialogVersion
 * @property {String} base64
 * @property {Number} height
 * @property {Number} width
 * @memberOf DialogDiffer.Database
 */

/**
 * @typedef {Object} DialogDiffer.Database.DialogsResult
 * @property {String} dialogId
 * @property {String} originalVersion
 * @property {String} currentVersion
 * @property {{version: String, id: String, url: String, hash: String, options: DialogDiffer.Options}} original
 * @property {{version: String, id: String, url: String, hash: String, options: DialogDiffer.Options}} current
 * @property {String} result
 * @property {Array<DialogDiffer.DialogResultDiff>} differ
 * @memberOf DialogDiffer.Database
 */

/**
 * @typedef {Object} DialogDiffer.Database.SuiteResultDialogsResult
 * @property {String} dialogId
 * @property {String} originalVersion
 * @property {String} currentVersion
 * @property {String} result
 * @memberOf DialogDiffer.Database
 */

/**
 * @typedef {Object} DialogDiffer.Database.SuiteResult
 * @property {String} id
 * @property {String} status
 * @property {String|null} errorCode
 * @property {Number} timestamp
 * @property {DialogDiffer.Options} options
 * @property {DialogDiffer.SuiteStats} stats
 * @property {Array<DialogDiffer.Database.SuiteResultDialogsResult>} results
 * @memberOf DialogDiffer.Database
 */

/** @type {AbstractDatabaseLayer} */
var databaseLayer = null;

/**
 * @class
 */

var DatabaseHandler = function () {
    function DatabaseHandler() {
        (0, _classCallCheck3.default)(this, DatabaseHandler);
    }

    (0, _createClass3.default)(DatabaseHandler, [{
        key: 'initDB',

        /**
         * @param {AbstractDatabaseLayer} [databaseLayer_]
         * @param {*} [args]
         */
        value: function initDB(databaseLayer_) {
            var args = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

            // use default database layer
            if (!databaseLayer_) {
                databaseLayer_ = new LowDbDatabaseLayer();
            }

            databaseLayer = databaseLayer_;

            return databaseLayer.initDB(args);
        }
    }, {
        key: 'clearDB',
        value: function clearDB() {
            if (databaseLayer) {
                return databaseLayer.clearDB();
            }
            return _promise2.default.resolve();
        }

        /**
         * @return {Boolean}
         */

    }, {
        key: 'isInitialized',
        value: function isInitialized() {
            return databaseLayer ? databaseLayer.isInitialized() : false;
        }

        /**
         * @param {DialogDiffer.Dialog} dialog
         * @param {DialogDiffer.DialogScreenshot} dialogScreenshot
         * @return {Promise<DialogDiffer.Database.DialogScreenshot>}
         */

    }, {
        key: 'saveDialogScreenshot',
        value: function saveDialogScreenshot(dialog, dialogScreenshot) {
            var _this = this;

            return new _promise2.default(function (fulfill, reject) {
                _this.getDialogScreenshot(dialog, dialogScreenshot).then(function (dialogScreenshotDb) {
                    if (dialogScreenshotDb) {
                        return databaseLayer.updateDialogScreenshot({
                            dialogScreenshotId: dialogScreenshotDb.id,
                            dialogScreenshotBase64: dialogScreenshot.base64
                        });
                    } else {
                        return databaseLayer.newDialogScreenshot({
                            dialogId: dialog.id,
                            dialogVersion: dialog.version,
                            dialogScreenshotHeight: dialogScreenshot.height,
                            dialogScreenshotWidth: dialogScreenshot.width,
                            dialogScreenshotBase64: dialogScreenshot.base64
                        });
                    }
                }).then(fulfill).catch(function (err) {
                    reject(ErrorHelper.createError(err, 'Could not save dialog screenshot', ERROR_CONSTANTS.SAVE_DIALOG_SCREENSHOT_DB_ERROR, { dialog: dialog, dialogScreenshot: dialogScreenshot }));
                });
            });
        }

        /**
         * @param {DialogDiffer.Dialog} dialog
         * @param {DialogDiffer.Database.SearchDialogScreenshot} dialogScreenshot
         * @return {Promise<DialogDiffer.Database.DialogScreenshot>}
         */

    }, {
        key: 'getDialogScreenshot',
        value: function getDialogScreenshot(dialog, dialogScreenshot) {
            return new _promise2.default(function (resolve, reject) {
                databaseLayer.getDialogScreenshot({
                    dialogId: dialog.id,
                    dialogVersion: dialog.version,
                    dialogScreenshotWidth: dialogScreenshot.width,
                    dialogScreenshotHeight: dialogScreenshot.height
                }).then(resolve).catch(function (err) {
                    reject(ErrorHelper.createError(err, 'Could not get dialog screenshot', ERROR_CONSTANTS.GET_DIALOG_SCREENSHOT_DB_ERROR, { dialog: dialog, dialogScreenshot: dialogScreenshot }));
                });
            });
        }

        /**
         * @param {DialogDiffer.Dialog} dialog
         * @param {Array<DialogDiffer.Database.SearchDialogScreenshot>} sizes
         * @return {Promise<Array<DialogDiffer.Database.DialogScreenshot>>}
         */

    }, {
        key: 'getDialogScreenshots',
        value: function getDialogScreenshots(dialog, sizes) {
            return new _promise2.default(function (resolve, reject) {
                databaseLayer.getDialogScreenshots({
                    dialogId: dialog.id,
                    dialogVersion: dialog.version,
                    sizes: sizes
                }).then(resolve).catch(function (err) {
                    reject(ErrorHelper.createError(err, 'Could not get dialog screenshots', ERROR_CONSTANTS.GET_DIALOG_SCREENSHOTS_DB_ERROR, { dialog: dialog }));
                });
            });
        }

        /**
         * @param {Array<DialogDiffer.Dialog>} dialogs
         * @param {Array<DialogDiffer.Database.SearchDialogScreenshot>} sizes
         * @return {Promise<Array<Array<DialogDiffer.Database.DialogScreenshot>>>}
         */

    }, {
        key: 'getDialogsScreenshots',
        value: function getDialogsScreenshots(dialogs, sizes) {
            var _this2 = this;

            return new _promise2.default(function (fulfill, reject) {
                _promise2.default.all(dialogs.map(function (dialog) {
                    return _this2.getDialogScreenshots(dialog, DialogHelper.getDialogSizes(sizes, dialog));
                })).then(fulfill).catch(function (err) {
                    return reject(ErrorHelper.createError(err, 'Could not get dialog screenshots', ERROR_CONSTANTS.GET_DIALOGS_SCREENSHOTS_DB_ERROR, { dialogs: dialogs }));
                });
            });
        }

        /**
         * @param {String} dialogVersion
         * @returns {Promise<Boolean>}
         */

    }, {
        key: 'deleteDialogsScreenshots',
        value: function deleteDialogsScreenshots(dialogVersion) {
            return new _promise2.default(function (resolve, reject) {
                databaseLayer.deleteDialogsScreenshots(dialogVersion).then(resolve).catch(function (err) {
                    reject(ErrorHelper.createError(err, 'Could not delete dialog screenshots', ERROR_CONSTANTS.DELETE_DIALOGS_SCREENSHOTS_DB_ERROR, { dialogVersion: dialogVersion }));
                });
            });
        }

        /**
         * @param {DialogDiffer.Options} options
         * @param {DialogDiffer.Dialog} dialogOriginal
         * @param {DialogDiffer.Dialog} dialogCurrent
         * @param {DialogDiffer.DialogsResult} dialogsResult
         * @returns {Promise<{dialogsResult: DialogDiffer.DialogsResult, dialogsResultDb: DialogDiffer.Database.DialogsResult}>}
         */

    }, {
        key: 'saveDialogsResult',
        value: function saveDialogsResult(options, dialogOriginal, dialogCurrent, dialogsResult) {
            return new _promise2.default(function (resolve, reject) {
                databaseLayer.newDialogsResult({
                    dialogId: dialogsResult.dialogId,
                    originalVersion: dialogsResult.originalVersion,
                    currentVersion: dialogsResult.currentVersion,
                    options: SuiteHelper.createUniqueOptionsId(options),
                    result: dialogsResult.result,
                    differ: dialogsResult.differ
                }).then(function (dialogsResultDb) {
                    resolve({ dialogsResult: dialogsResult, dialogResultDb: dialogsResultDb });
                }).catch(function (err) {
                    reject(ErrorHelper.createError(err, 'Could not save dialogs diff result', ERROR_CONSTANTS.SAVE_DIALOGS_DIFF_RESULT_DB_ERROR, { options: options, dialogOriginal: dialogOriginal, dialogCurrent: dialogCurrent, dialogsResult: dialogsResult }));
                });
            });
        }

        /**
         * @param {DialogDiffer.Options} options
         * @param {String} dialogId
         * @param {String} originalVersion
         * @param {String} currentVersion
         * @returns {Promise<DialogDiffer.Database.DialogsResult>}
         */

    }, {
        key: 'getDialogsResult',
        value: function getDialogsResult(options, dialogId, originalVersion, currentVersion) {
            return new _promise2.default(function (resolve, reject) {
                databaseLayer.getDialogsResult({
                    dialogId: dialogId,
                    originalVersion: originalVersion,
                    currentVersion: currentVersion,
                    options: SuiteHelper.createUniqueOptionsId(options)
                }).then(resolve).catch(function (err) {
                    reject(ErrorHelper.createError(err, 'Could not get dialogs diff result', ERROR_CONSTANTS.GET_DIALOG_SCREENSHOT_DB_ERROR, { options: options, dialogId: dialogId, originalVersion: originalVersion, currentVersion: currentVersion }));
                });
            });
        }

        /**
         * @param {DialogDiffer.Suite} suite
         * @return {Promise<DialogDiffer.Database.SuiteResult>}
         */

    }, {
        key: 'newSuiteResult',
        value: function newSuiteResult(suite) {
            return new _promise2.default(function (resolve, reject) {
                databaseLayer.newSuiteResult({
                    status: SUITE_CONSTANTS.RUNNING_STATUS,
                    errorCode: null,
                    timestamp: Date.now(),
                    options: suite.options,
                    stats: {
                        identical: 0,
                        changed: 0,
                        added: 0,
                        deleted: 0,
                        duration: 0,
                        error: 0,
                        dialogs: Math.max((suite.original || []).length, (suite.current || []).length)
                    },
                    dialogsResult: []
                }).then(resolve).catch(function (err) {
                    reject(ErrorHelper.createError(err, 'Could not save suite result', ERROR_CONSTANTS.NEW_SUITE_RESULT_DB_ERROR, { suite: suite }));
                });
            });
        }

        /**
         * @param {DialogDiffer.SuiteResult} suiteResult
         * @return {Promise<DialogDiffer.SuiteResult>}
         */

    }, {
        key: 'saveSuiteResult',
        value: function saveSuiteResult(suiteResult) {
            return new _promise2.default(function (fulfill, reject) {
                databaseLayer.updateSuiteResult(suiteResult.id, {
                    status: suiteResult.status,
                    stats: suiteResult.stats,
                    results: suiteResult.results.map(function (dialogsResult) {
                        return {
                            dialogId: dialogsResult.dialogId,
                            originalVersion: dialogsResult.originalVersion,
                            currentVersion: dialogsResult.currentVersion,
                            original: dialogsResult.original ? {
                                version: dialogsResult.originalVersion,
                                id: dialogsResult.original.id,
                                url: dialogsResult.original.url,
                                hash: dialogsResult.original.hash,
                                options: dialogsResult.original.options || {}
                            } : null,
                            current: dialogsResult.current ? {
                                version: dialogsResult.currentVersion,
                                id: dialogsResult.current.id,
                                url: dialogsResult.current.url,
                                hash: dialogsResult.current.hash,
                                options: dialogsResult.current.options || {}
                            } : null,
                            result: dialogsResult.result
                        };
                    })
                }).then(fulfill).catch(function (err) {
                    reject(ErrorHelper.createError(err, 'Could not save suite result', ERROR_CONSTANTS.SAVE_SUITE_RESULT_DB_ERROR, { suiteResult: suiteResult }));
                });
            });
        }

        /**
         * @param {DialogDiffer.Suite} suite
         * @param {DialogDiffer.Error} err
         * @return {Promise<DialogDiffer.Suite>}
         */

    }, {
        key: 'saveSuiteResultError',
        value: function saveSuiteResultError(suite, err) {
            return new _promise2.default(function (resolve, reject) {
                databaseLayer.updateSuiteResult(suite.id, {
                    status: SUITE_CONSTANTS.ERROR_STATUS,
                    errorCode: err.code
                }).then(function () {
                    return resolve(suite);
                }).catch(function (err) {
                    reject(ErrorHelper.createError(err, 'Could not save suite result', ERROR_CONSTANTS.SAVE_SUITE_RESULT_DB_ERROR, { suite: suite }));
                });
            });
        }

        /**
         * @param {String} suiteId
         * @return {Promise<DialogDiffer.Database.SuiteResult|null>}
         */

    }, {
        key: 'getSuiteResult',
        value: function getSuiteResult(suiteId) {
            return new _promise2.default(function (resolve, reject) {
                databaseLayer.getSuiteResult(suiteId).then(resolve).catch(function (err) {
                    reject(ErrorHelper.createError(err, 'Could not get suite results', ERROR_CONSTANTS.GET_SUITE_RESULTS_DB_ERROR));
                });
            });
        }

        /**
         * @return {Promise<Array<DialogDiffer.Database.SuiteResult>>}
         */

    }, {
        key: 'getLastSuiteResults',
        value: function getLastSuiteResults() {
            return new _promise2.default(function (resolve, reject) {
                databaseLayer.getLastSuiteResults().then(resolve).catch(function (err) {
                    reject(ErrorHelper.createError(err, 'Could not get suite results', ERROR_CONSTANTS.GET_SUITE_RESULTS_DB_ERROR));
                });
            });
        }

        /**
         * @param {String} suiteId
         * @returns {Promise<Boolean, DialogDiffer.Error>}
         */

    }, {
        key: 'deleteSuiteResult',
        value: function deleteSuiteResult(suiteId) {
            return new _promise2.default(function (resolve, reject) {
                databaseLayer.deleteSuiteResult(suiteId).then(resolve).catch(function (err) {
                    reject(ErrorHelper.createError(err, 'Could not delete suite result', ERROR_CONSTANTS.DELETE_SUITE_RESULT_DB_ERROR, { suiteId: suiteId }));
                });
            });
        }
    }]);
    return DatabaseHandler;
}();

module.exports = DatabaseHandler;