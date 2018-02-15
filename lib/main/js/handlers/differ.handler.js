'use strict';

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var TAG = 'Differ';

var tmp = require('tmp');
var path = require('path');
var imageDiff = require('image-diff');
var base64Img = require('base64-img');
var Promise = require('bluebird');

var LOGGER_CONSTANTS = require('../constants/logger-constants');
var DIFFER_CONSTANTS = require('../constants/differ-constants');
var SUITE_CONSTANTS = require('../constants/suite-constants');

var SuiteHelper = require('../helpers/suite.helper');
var DialogHelper = require('../helpers/dialog.helper');
var logger = require('../logger');

/**
 * @typedef {Object} DifferHandler.DifferDialogScreenshotResult
 * @property {Boolean} isIdentical
 * @property {String|null} base64
 * @memberOf DifferHandler
 */

/**
 * @class
 */

var DifferHandler = function () {
    /**
     * @param {DatabaseHandler} databaseHandler
     */
    function DifferHandler(databaseHandler) {
        (0, _classCallCheck3.default)(this, DifferHandler);

        this.databaseHandler = databaseHandler;
    }

    /**
     * @param {DialogDiffer.Dialog} dialog
     * @returns {DialogDiffer.Dialog}
     * @private
     */


    (0, _createClass3.default)(DifferHandler, [{
        key: 'prepareDialogScreenshots',
        value: function prepareDialogScreenshots(dialog) {
            dialog.screenshots.forEach(function (screenshot) {
                var tmpFile = tmp.fileSync({
                    postfix: '.png'
                });

                screenshot.path = tmpFile.name;
                screenshot.removeCallback = tmpFile.removeCallback;
                base64Img.imgSync(screenshot.base64, path.dirname(tmpFile.name), path.basename(tmpFile.name, '.png'));
            });

            return dialog;
        }

        /**
         * @param {DialogDiffer.Dialog|null} dialogOriginal
         * @param {DialogDiffer.Dialog|null} dialogCurrent
         * @param {String} result
         * @param {Array<DialogDiffer.DialogResultDiff>} [differ]
         * @return {DialogDiffer.DialogsResult}
         * @private
         */

    }, {
        key: 'createDialogsResult',
        value: function createDialogsResult(dialogOriginal, dialogCurrent, result) {
            var differ = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : [];

            return {
                dialogId: dialogOriginal && dialogOriginal.id || dialogCurrent && dialogCurrent.id,
                original: dialogOriginal,
                current: dialogCurrent,
                originalVersion: dialogOriginal && dialogOriginal.version || null,
                currentVersion: dialogCurrent && dialogCurrent.version || null,
                result: result,
                differ: differ
            };
        }

        /**
         * @param {DialogDiffer.DialogScreenshot} screenshotOriginal
         * @param {DialogDiffer.DialogScreenshot} screenshotCurrent
         * @returns {Promise<DifferHandler.DifferDialogScreenshotResult>}
         */

    }, {
        key: 'differDialogScreenshot',
        value: function differDialogScreenshot(screenshotOriginal, screenshotCurrent) {
            return new Promise(function (fulfill, reject) {
                var tmpFile = tmp.fileSync({
                    postfix: '.png'
                });

                imageDiff({
                    expectedImage: screenshotCurrent.path,
                    actualImage: screenshotOriginal.path,
                    diffImage: tmpFile.name
                }, function (err, isIdentical) {
                    if (err) {
                        reject(err);
                        return;
                    }

                    fulfill({
                        isIdentical: isIdentical,
                        base64: !isIdentical ? base64Img.base64Sync(tmpFile.name) : null
                    });

                    // remove tmp files
                    if (tmpFile.removeCallback) {
                        tmpFile.removeCallback();
                    }

                    if (screenshotOriginal.removeCallback) {
                        screenshotOriginal.removeCallback();
                        delete screenshotOriginal.path;
                    }

                    if (screenshotCurrent.removeCallback) {
                        screenshotCurrent.removeCallback();
                        delete screenshotCurrent.path;
                    }
                });
            });
        }

        /**
         * @param {DialogDiffer.Options} options
         * @param {DialogDiffer.Dialog|null} dialogOriginal
         * @param {DialogDiffer.Dialog|null} dialogCurrent
         * @returns {Promise<DialogDiffer.DialogsResult>}
         * @throws {DialogDiffer.Error}
         */

    }, {
        key: 'differDialog',
        value: function () {
            var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(options, dialogOriginal, dialogCurrent) {
                var dialogResultDb;
                return _regenerator2.default.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                if (!(!dialogOriginal || !dialogCurrent)) {
                                    _context.next = 2;
                                    break;
                                }

                                return _context.abrupt('return', this.createDialogsResult(dialogOriginal, dialogCurrent, !dialogCurrent ? DIFFER_CONSTANTS.DELETED_DIFFER_RESULT : DIFFER_CONSTANTS.ADDED_DIFFER_RESULT, []));

                            case 2:
                                if (!(dialogOriginal.error || dialogCurrent.error)) {
                                    _context.next = 4;
                                    break;
                                }

                                return _context.abrupt('return', this.createDialogsResult(dialogOriginal, dialogCurrent, DIFFER_CONSTANTS.ERROR_DIFFER_RESULT, []));

                            case 4:
                                _context.next = 6;
                                return this.databaseHandler.getDialogsResult(options, dialogOriginal.id, dialogOriginal.version, dialogCurrent.version);

                            case 6:
                                dialogResultDb = _context.sent;

                                if (!(dialogResultDb && !options.isForceDiff)) {
                                    _context.next = 12;
                                    break;
                                }

                                logger.info(TAG, 'differDialog', 'Using dialogs \'%s\' and \'%s\' diff result from database', LOGGER_CONSTANTS.DIALOG_DIFF_FROM_DATABASE_LOGGER, DialogHelper.createUniqueDialogId(dialogOriginal), DialogHelper.createUniqueDialogId(dialogCurrent));

                                return _context.abrupt('return', this.createDialogsResult(dialogOriginal, dialogCurrent, dialogResultDb.result, dialogResultDb.differ));

                            case 12:
                                logger.info(TAG, 'differDialog', 'Getting dialogs \'%s\' and \'%s\' diff result from image diff', LOGGER_CONSTANTS.DIALOG_DIFF_FROM_IMAGE_DIFF_LOGGER, DialogHelper.createUniqueDialogId(dialogOriginal), DialogHelper.createUniqueDialogId(dialogCurrent));

                                return _context.abrupt('return', this.differDialogWithImageDiff(options, dialogOriginal, dialogCurrent));

                            case 14:
                            case 'end':
                                return _context.stop();
                        }
                    }
                }, _callee, this);
            }));

            function differDialog(_x2, _x3, _x4) {
                return _ref.apply(this, arguments);
            }

            return differDialog;
        }()

        /**
         * @param {DialogDiffer.Options} options
         * @param {DialogDiffer.Dialog|null} dialogOriginal
         * @param {DialogDiffer.Dialog|null} dialogCurrent
         * @returns {Promise<DialogDiffer.DialogsResult>}
         * @throws {DialogDiffer.Error}
         * @private
         */

    }, {
        key: 'differDialogWithImageDiff',
        value: function () {
            var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(options, dialogOriginal, dialogCurrent) {
                var _this = this;

                var dialogsDiffers, dialogsResult;
                return _regenerator2.default.wrap(function _callee2$(_context2) {
                    while (1) {
                        switch (_context2.prev = _context2.next) {
                            case 0:
                                // prepare dialogs screenshots
                                this.prepareDialogScreenshots(dialogOriginal);
                                this.prepareDialogScreenshots(dialogCurrent);

                                // diff dialogs
                                /** @type {Array<DifferHandler.DifferDialogScreenshotResult>} */
                                _context2.next = 4;
                                return Promise.map(dialogOriginal.screenshots, function (screenshot, i) {
                                    return _this.differDialogScreenshot(dialogOriginal.screenshots[i], dialogCurrent.screenshots[i]);
                                }, { concurrency: 10 });

                            case 4:
                                dialogsDiffers = _context2.sent;


                                /** @type {DialogDiffer.DialogsResult} */
                                dialogsResult = this.createDialogsResult(dialogOriginal, dialogCurrent, DIFFER_CONSTANTS.IDENTICAL_DIFFER_RESULT, []);


                                dialogsDiffers.forEach(function (_ref3, i) {
                                    var isIdentical = _ref3.isIdentical,
                                        base64 = _ref3.base64;

                                    if (!isIdentical) {
                                        dialogsResult.result = DIFFER_CONSTANTS.CHANGED_DIFFER_RESULT;
                                    }

                                    dialogsResult.differ.push({
                                        index: i,
                                        result: isIdentical ? DIFFER_CONSTANTS.IDENTICAL_DIFFER_RESULT : DIFFER_CONSTANTS.CHANGED_DIFFER_RESULT,
                                        base64: base64
                                    });
                                });

                                // save dialogs result to database
                                _context2.next = 9;
                                return this.databaseHandler.saveDialogsResult(options, dialogOriginal, dialogCurrent, dialogsResult);

                            case 9:
                                return _context2.abrupt('return', dialogsResult);

                            case 10:
                            case 'end':
                                return _context2.stop();
                        }
                    }
                }, _callee2, this);
            }));

            function differDialogWithImageDiff(_x5, _x6, _x7) {
                return _ref2.apply(this, arguments);
            }

            return differDialogWithImageDiff;
        }()

        /**
         * @param {DialogDiffer.Suite} suite
         * @param {DialogDiffer.OnEndCallback} [onEnd]
         * @returns {Promise<DialogDiffer.SuiteResult>}
         */

    }, {
        key: 'differSuite',
        value: function () {
            var _ref4 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3(suite) {
                var _this2 = this;

                var _ref5 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
                    _ref5$onEnd = _ref5.onEnd,
                    onEnd = _ref5$onEnd === undefined ? null : _ref5$onEnd;

                var suiteResultDb, suiteResult, dialogsResults;
                return _regenerator2.default.wrap(function _callee3$(_context3) {
                    while (1) {
                        switch (_context3.prev = _context3.next) {
                            case 0:
                                logger.log(TAG, 'differSuite', 'Differ suite...', null, suite.id);

                                // get suite result from database
                                _context3.next = 3;
                                return this.databaseHandler.getSuiteResult(suite.id);

                            case 3:
                                suiteResultDb = _context3.sent;


                                // prepare suite result
                                suiteResult = SuiteHelper.prepareSuiteResults(suite, suiteResultDb);

                                // differ dialogs
                                /** @type {Array<DialogDiffer.DialogsResult>} */

                                _context3.next = 7;
                                return Promise.map(suiteResult.results, function (result) {
                                    return _this2.differDialog(suite.options, result.original, result.current);
                                }, { concurrency: 10 });

                            case 7:
                                dialogsResults = _context3.sent;


                                logger.log(TAG, 'differSuite', 'Diffed suite', null, suite.id);

                                dialogsResults.forEach(function (dialogResult, i) {
                                    suiteResult.results[i] = dialogResult;
                                });

                                // finish suite result
                                return _context3.abrupt('return', this.finishSuiteResult(suiteResult, { onEnd: onEnd }));

                            case 11:
                            case 'end':
                                return _context3.stop();
                        }
                    }
                }, _callee3, this);
            }));

            function differSuite(_x8) {
                return _ref4.apply(this, arguments);
            }

            return differSuite;
        }()

        /**
         * @param {DialogDiffer.Suite} suite
         * @param {DialogDiffer.OnStartCallback} [onStart]
         * @return {Promise<DialogDiffer.Suite>}
         * @throws {DialogDiffer.Error}
         */

    }, {
        key: 'initSuiteResult',
        value: function () {
            var _ref6 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4(suite) {
                var _ref7 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
                    _ref7$onStart = _ref7.onStart,
                    onStart = _ref7$onStart === undefined ? null : _ref7$onStart;

                var suiteResultDb;
                return _regenerator2.default.wrap(function _callee4$(_context4) {
                    while (1) {
                        switch (_context4.prev = _context4.next) {
                            case 0:
                                if (!suite.id) {
                                    _context4.next = 6;
                                    break;
                                }

                                _context4.next = 3;
                                return this.databaseHandler.getSuiteResult(suite.id);

                            case 3:
                                _context4.t0 = _context4.sent;
                                _context4.next = 9;
                                break;

                            case 6:
                                _context4.next = 8;
                                return this.databaseHandler.newSuiteResult(suite);

                            case 8:
                                _context4.t0 = _context4.sent;

                            case 9:
                                suiteResultDb = _context4.t0;


                                // inject Suite id
                                suite.id = suiteResultDb.id;

                                if (onStart) {
                                    onStart(suiteResultDb);
                                }

                                return _context4.abrupt('return', suite);

                            case 13:
                            case 'end':
                                return _context4.stop();
                        }
                    }
                }, _callee4, this);
            }));

            function initSuiteResult(_x10) {
                return _ref6.apply(this, arguments);
            }

            return initSuiteResult;
        }()

        /**
         * @param {DialogDiffer.SuiteResult} suiteResult
         * @param {DialogDiffer.OnEndCallback} [onEnd]
         * @return {Promise<DialogDiffer.SuiteResult>}
         * @throws {DialogDiffer.Error}
         */

    }, {
        key: 'finishSuiteResult',
        value: function () {
            var _ref8 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee5(suiteResult) {
                var _ref9 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
                    _ref9$onEnd = _ref9.onEnd,
                    onEnd = _ref9$onEnd === undefined ? null : _ref9$onEnd;

                var suiteResultDb;
                return _regenerator2.default.wrap(function _callee5$(_context5) {
                    while (1) {
                        switch (_context5.prev = _context5.next) {
                            case 0:
                                // duration
                                suiteResult.stats.duration = Date.now() - suiteResult.timestamp;

                                // status
                                suiteResult.status = SUITE_CONSTANTS.FINISHED_STATUS;

                                // dialog results
                                (0, _keys2.default)(suiteResult.results).forEach(function (dialogId) {
                                    /** @type {DialogDiffer.DialogsResult} */
                                    var dialogsResult = suiteResult.results[dialogId];

                                    switch (dialogsResult.result) {
                                        case DIFFER_CONSTANTS.IDENTICAL_DIFFER_RESULT:
                                            suiteResult.stats.identical++;
                                            break;
                                        case DIFFER_CONSTANTS.CHANGED_DIFFER_RESULT:
                                            suiteResult.stats.changed++;
                                            break;
                                        case DIFFER_CONSTANTS.ADDED_DIFFER_RESULT:
                                            suiteResult.stats.added++;
                                            break;
                                        case DIFFER_CONSTANTS.DELETED_DIFFER_RESULT:
                                            suiteResult.stats.deleted++;
                                            break;
                                        case DIFFER_CONSTANTS.ERROR_DIFFER_RESULT:
                                            suiteResult.stats.error++;
                                            break;
                                    }
                                });

                                // save suite result to database
                                _context5.next = 5;
                                return this.databaseHandler.saveSuiteResult(suiteResult);

                            case 5:
                                _context5.next = 7;
                                return this.databaseHandler.getSuiteResult(suiteResult.id);

                            case 7:
                                suiteResultDb = _context5.sent;


                                if (onEnd) {
                                    onEnd(suiteResultDb);
                                }

                                return _context5.abrupt('return', suiteResult);

                            case 10:
                            case 'end':
                                return _context5.stop();
                        }
                    }
                }, _callee5, this);
            }));

            function finishSuiteResult(_x12) {
                return _ref8.apply(this, arguments);
            }

            return finishSuiteResult;
        }()

        /**
         * @param {DialogDiffer.Suite} suite
         * @param {DialogDiffer.Error} err
         * @return {Promise<DialogDiffer.Suite>}
         * @throws {DialogDiffer.Error}
         */

    }, {
        key: 'errorSuiteResult',
        value: function () {
            var _ref10 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee6(suite, err) {
                return _regenerator2.default.wrap(function _callee6$(_context6) {
                    while (1) {
                        switch (_context6.prev = _context6.next) {
                            case 0:
                                if (!this.databaseHandler.isInitialized()) {
                                    _context6.next = 3;
                                    break;
                                }

                                _context6.next = 3;
                                return this.databaseHandler.saveSuiteResultError(suite, err);

                            case 3:
                                return _context6.abrupt('return', suite);

                            case 4:
                            case 'end':
                                return _context6.stop();
                        }
                    }
                }, _callee6, this);
            }));

            function errorSuiteResult(_x14, _x15) {
                return _ref10.apply(this, arguments);
            }

            return errorSuiteResult;
        }()
    }]);
    return DifferHandler;
}();

module.exports = DifferHandler;