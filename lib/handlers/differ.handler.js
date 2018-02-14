'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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

var DifferHandler = function () {
    function DifferHandler(databaseHandler) {
        _classCallCheck(this, DifferHandler);

        this.databaseHandler = databaseHandler;
    }

    /**
     * @param {DialogDiffer.Dialog} dialog
     * @returns {Promise<Dialog>}
     * @private
     */


    _createClass(DifferHandler, [{
        key: 'prepareDialogScreenshots',
        value: function prepareDialogScreenshots(dialog) {
            return new Promise(function (fulfill) {
                dialog.screenshots.forEach(function (screenshot) {
                    var tmpFile = tmp.fileSync({
                        postfix: '.png'
                    });

                    screenshot.path = tmpFile.name;
                    screenshot.removeCallback = tmpFile.removeCallback;
                    base64Img.imgSync(screenshot.base64, path.dirname(tmpFile.name), path.basename(tmpFile.name, '.png'));
                });

                fulfill(dialog);
            });
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
         * @returns {Promise<{isIdentical: Boolean, base64: String|null}>}
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
         */

    }, {
        key: 'differDialog',
        value: function differDialog(options, dialogOriginal, dialogCurrent) {
            var _this = this;

            if (!dialogOriginal || !dialogCurrent) {
                return Promise.resolve(this.createDialogsResult(dialogOriginal, dialogCurrent, !dialogCurrent ? DIFFER_CONSTANTS.DELETED_DIFFER_RESULT : DIFFER_CONSTANTS.ADDED_DIFFER_RESULT, []));
            }

            if (dialogOriginal.error || dialogCurrent.error) {
                return Promise.resolve(this.createDialogsResult(dialogOriginal, dialogCurrent, DIFFER_CONSTANTS.ERROR_DIFFER_RESULT, []));
            }

            return new Promise(function (fulfill, reject) {
                _this.databaseHandler.getDialogsResult(options, dialogOriginal.id, dialogOriginal.version, dialogCurrent.version).then(function (dialogResultDb) {
                    // use dialog result from database
                    if (dialogResultDb && !options.isForceDiff) {
                        logger.info(TAG, 'differDialog', 'Using dialogs \'%s\' and \'%s\' diff result from database', LOGGER_CONSTANTS.DIALOG_DIFF_FROM_DATABASE_LOGGER, DialogHelper.createUniqueDialogId(dialogOriginal), DialogHelper.createUniqueDialogId(dialogCurrent));

                        return Promise.resolve(_this.createDialogsResult(dialogOriginal, dialogCurrent, dialogResultDb.result, dialogResultDb.differ));
                    }
                    // get dialog result from image diff
                    else {
                            logger.info(TAG, 'differDialog', 'Getting dialogs \'%s\' and \'%s\' diff result from image diff', LOGGER_CONSTANTS.DIALOG_DIFF_FROM_IMAGE_DIFF_LOGGER, DialogHelper.createUniqueDialogId(dialogOriginal), DialogHelper.createUniqueDialogId(dialogCurrent));

                            return _this.differDialogWithImageDiff(options, dialogOriginal, dialogCurrent);
                        }
                }).then(fulfill).catch(reject);
            });
        }

        /**
         * @param {DialogDiffer.Options} options
         * @param {DialogDiffer.Dialog|null} dialogOriginal
         * @param {DialogDiffer.Dialog|null} dialogCurrent
         * @returns {Promise<DialogDiffer.DialogsResult>}
         * @private
         */

    }, {
        key: 'differDialogWithImageDiff',
        value: function differDialogWithImageDiff(options, dialogOriginal, dialogCurrent) {
            var _this2 = this;

            return new Promise(function (fulfill, reject) {
                Promise.all([_this2.prepareDialogScreenshots(dialogOriginal), _this2.prepareDialogScreenshots(dialogCurrent)]).then(function (_ref) {
                    var _ref2 = _slicedToArray(_ref, 2),
                        dialogOriginal = _ref2[0],
                        dialogCurrent = _ref2[1];

                    return Promise.map(dialogOriginal.screenshots, function (screenshot, i) {
                        return _this2.differDialogScreenshot(dialogOriginal.screenshots[i], dialogCurrent.screenshots[i]);
                    }, { concurrency: 10 });
                }).then(function (result) {
                    /** @type {DialogDiffer.DialogsResult} */
                    var dialogsResult = _this2.createDialogsResult(dialogOriginal, dialogCurrent, DIFFER_CONSTANTS.IDENTICAL_DIFFER_RESULT, []);

                    result.forEach(function (_ref3, i) {
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

                    return Promise.resolve(dialogsResult);
                }).then(function (dialogsResult) {
                    return _this2.databaseHandler.saveDialogsResult(options, dialogOriginal, dialogCurrent, dialogsResult);
                }).then(function (_ref4) {
                    var dialogsResult = _ref4.dialogsResult;
                    return fulfill(dialogsResult);
                }).catch(reject);
            });
        }

        /**
         * @param {DialogDiffer.Suite} suite
         * @param {DialogDiffer.OnEndCallback} [onEnd]
         * @returns {Promise<DialogDiffer.SuiteResult>}
         */

    }, {
        key: 'differSuite',
        value: function differSuite(suite) {
            var _this3 = this;

            var _ref5 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
                _ref5$onEnd = _ref5.onEnd,
                onEnd = _ref5$onEnd === undefined ? null : _ref5$onEnd;

            return new Promise(function (fulfill, reject) {
                /** @type {DialogDiffer.SuiteResult} */
                var suiteResult = void 0;
                logger.log(TAG, 'differSuite', 'Differ suite...');

                _this3.databaseHandler.getSuiteResult(suite.id).then(function (suiteResultDb) {
                    suiteResult = SuiteHelper.prepareSuiteResults(suite, suiteResultDb);

                    return Promise.map(suiteResult.results, function (result) {
                        return _this3.differDialog(suite.options, result.original, result.current);
                    }, { concurrency: 10 });
                }).then(function (results) {
                    logger.log(TAG, 'differSuite', 'Diffed suite');

                    results.forEach(function (dialogResult, i) {
                        suiteResult.results[i] = dialogResult;
                    });

                    return Promise.resolve(suiteResult);
                }).then(function () {
                    return _this3.finishSuiteResult(suiteResult, { onEnd: onEnd });
                }).then(fulfill).catch(reject);
            });
        }

        /**
         * @param {DialogDiffer.Suite} suite
         * @param {DialogDiffer.OnStartCallback} [onStart]
         * @return {Promise<DialogDiffer.Suite, DialogDiffer.Error>}
         */

    }, {
        key: 'initSuiteResult',
        value: function initSuiteResult(suite) {
            var _this4 = this;

            var _ref6 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
                _ref6$onStart = _ref6.onStart,
                onStart = _ref6$onStart === undefined ? null : _ref6$onStart;

            var suiteResultPromise = function suiteResultPromise() {
                if (suite.id) {
                    return _this4.databaseHandler.getSuiteResult(suite.id);
                } else {
                    return _this4.databaseHandler.newSuiteResult(suite);
                }
            };

            return new Promise(function (fulfill, reject) {
                suiteResultPromise().then(function (suiteResultDb) {
                    // inject Suite id
                    suite.id = suiteResultDb.id;

                    if (onStart) {
                        onStart(suiteResultDb);
                    }

                    fulfill(suite);
                }).catch(reject);
            });
        }

        /**
         * @param {DialogDiffer.SuiteResult} suiteResult
         * @param {DialogDiffer.OnEndCallback} [onEnd]
         * @return {Promise<DialogDiffer.SuiteResult, DialogDiffer.Error>}
         */

    }, {
        key: 'finishSuiteResult',
        value: function finishSuiteResult(suiteResult) {
            var _this5 = this;

            var _ref7 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
                _ref7$onEnd = _ref7.onEnd,
                onEnd = _ref7$onEnd === undefined ? null : _ref7$onEnd;

            return new Promise(function (fulfill, reject) {
                // duration
                suiteResult.stats.duration = Date.now() - suiteResult.timestamp;

                // status
                suiteResult.status = SUITE_CONSTANTS.FINISHED_STATUS;

                // dialog results
                Object.keys(suiteResult.results).forEach(function (dialogId) {
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

                _this5.databaseHandler.saveSuiteResult(suiteResult).then(function (suiteResult) {
                    return _this5.databaseHandler.getSuiteResult(suiteResult.id);
                }).then(function (suiteResultDb) {
                    return onEnd ? onEnd(suiteResultDb) : null;
                }).then(function () {
                    return fulfill(suiteResult);
                }).catch(reject);
            });
        }

        /**
         * @param {DialogDiffer.Suite} suite
         * @param {DialogDiffer.Error} err
         * @return {Promise<DialogDiffer.Suite, DialogDiffer.Error>}
         */

    }, {
        key: 'errorSuiteResult',
        value: function errorSuiteResult(suite, err) {
            var _this6 = this;

            return new Promise(function (fulfill, reject) {
                if (_this6.databaseHandler.isInitialized()) {
                    _this6.databaseHandler.saveSuiteResultError(suite, err).then(function () {
                        return fulfill(suite);
                    }).catch(reject);
                } else {
                    fulfill(suite);
                }
            });
        }
    }]);

    return DifferHandler;
}();

module.exports = DifferHandler;