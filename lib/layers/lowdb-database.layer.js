'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var lowDB = require('lowdb');
var AbstractDatabaseLayer = require('./abstract-database.layer');

var DIALOG_SCREENSHOTS_DB = 'dialog_screenshots';
var DIALOG_DIFFS_RESULT_DB = 'dialog_diffs_result';
var SUITE_RESULT_DB = 'suite_result';

var db = null;

var LowDbDatabaseLayer = function (_AbstractDatabaseLaye) {
    _inherits(LowDbDatabaseLayer, _AbstractDatabaseLaye);

    function LowDbDatabaseLayer() {
        _classCallCheck(this, LowDbDatabaseLayer);

        return _possibleConstructorReturn(this, (LowDbDatabaseLayer.__proto__ || Object.getPrototypeOf(LowDbDatabaseLayer)).apply(this, arguments));
    }

    _createClass(LowDbDatabaseLayer, [{
        key: 'initDB',

        /**
         * @param {String} [dbFile] Uses in-memory if not given
         */
        value: function initDB() {
            var dbFile = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

            return new Promise(function (fulfill, reject) {
                try {
                    var _db$defaults;

                    if (!db) {
                        db = lowDB(dbFile);

                        db._.mixin(require('lodash-id'));
                    }

                    db.defaults((_db$defaults = {}, _defineProperty(_db$defaults, DIALOG_SCREENSHOTS_DB, []), _defineProperty(_db$defaults, DIALOG_DIFFS_RESULT_DB, []), _defineProperty(_db$defaults, SUITE_RESULT_DB, []), _db$defaults)).write();

                    fulfill();
                } catch (err) {
                    reject(err);
                }
            });
        }
    }, {
        key: 'clearDB',
        value: function clearDB() {
            if (db) {
                db.setState({});
            }
            return Promise.resolve();
        }

        /**
         * @return {Boolean}
         */

    }, {
        key: 'isInitialized',
        value: function isInitialized() {
            return !!db;
        }

        /**
         * @param {String} dialogScreenshotId
         * @return {Promise<DialogDiffer.Database.DialogScreenshot|null>}
         */

    }, {
        key: 'getDialogScreenshotFromId',
        value: function getDialogScreenshotFromId(dialogScreenshotId) {
            return new Promise(function (resolve, reject) {
                try {
                    resolve(Promise.resolve(db.get(DIALOG_SCREENSHOTS_DB).find({
                        id: dialogScreenshotId
                    }).value()));
                } catch (err) {
                    reject(err);
                }
            });
        }

        /**
         * @return {Promise<DialogDiffer.Database.DialogScreenshot>}
         */

    }, {
        key: 'getDialogScreenshot',
        value: function getDialogScreenshot(_ref) {
            var dialogId = _ref.dialogId,
                dialogVersion = _ref.dialogVersion,
                dialogScreenshotHeight = _ref.dialogScreenshotHeight,
                dialogScreenshotWidth = _ref.dialogScreenshotWidth;

            return new Promise(function (resolve, reject) {
                try {
                    resolve(db.get(DIALOG_SCREENSHOTS_DB).find({
                        dialogId: dialogId,
                        dialogVersion: dialogVersion,
                        height: dialogScreenshotHeight,
                        width: dialogScreenshotWidth
                    }).value());
                } catch (err) {
                    reject(err);
                }
            });
        }

        /**
         * @param {String} dialogId
         * @param {String} dialogVersion
         * @param {Array<{width: Number, height: Number}>} sizes
         * @return {Promise<Array<DialogDiffer.Database.DialogScreenshot>>}
         */

    }, {
        key: 'getDialogScreenshots',
        value: function getDialogScreenshots(_ref2) {
            var dialogId = _ref2.dialogId,
                dialogVersion = _ref2.dialogVersion,
                sizes = _ref2.sizes;

            return new Promise(function (fulfill, reject) {
                try {
                    var dialogScreenshotDb = db.get(DIALOG_SCREENSHOTS_DB).filter(function (dialogScreenshotDb) {
                        var isCorrectSize = sizes.filter(function (size) {
                            return size.width === dialogScreenshotDb.width && size.height === dialogScreenshotDb.height;
                        }).length > 0;

                        return dialogScreenshotDb.dialogId === dialogId && dialogScreenshotDb.dialogVersion === dialogVersion && isCorrectSize;
                    }).value();

                    fulfill(dialogScreenshotDb);
                } catch (err) {
                    reject(err);
                }
            });
        }

        /**
         * @param {String} dialogId
         * @param {String} dialogVersion
         * @param {Number} dialogScreenshotHeight
         * @param {Number} dialogScreenshotWidth
         * @param {String} dialogScreenshotBase64
         * @return {Promise<DialogDiffer.Database.DialogScreenshot>}
         */

    }, {
        key: 'newDialogScreenshot',
        value: function newDialogScreenshot(_ref3) {
            var dialogId = _ref3.dialogId,
                dialogVersion = _ref3.dialogVersion,
                dialogScreenshotHeight = _ref3.dialogScreenshotHeight,
                dialogScreenshotWidth = _ref3.dialogScreenshotWidth,
                dialogScreenshotBase64 = _ref3.dialogScreenshotBase64;

            return new Promise(function (resolve, reject) {
                try {
                    var dialogScreenshotDb = db.get(DIALOG_SCREENSHOTS_DB).insert({
                        dialogId: dialogId,
                        dialogVersion: dialogVersion,
                        height: dialogScreenshotHeight,
                        width: dialogScreenshotWidth,
                        base64: dialogScreenshotBase64
                    }).write();

                    resolve(dialogScreenshotDb);
                } catch (err) {
                    reject(err);
                }
            });
        }

        /**
         * @param {String} dialogScreenshotId
         * @param {String} dialogScreenshotBase64
         * @return {Promise<DialogDiffer.Database.DialogScreenshot>}
         */

    }, {
        key: 'updateDialogScreenshot',
        value: function updateDialogScreenshot(_ref4) {
            var _this2 = this;

            var dialogScreenshotId = _ref4.dialogScreenshotId,
                dialogScreenshotBase64 = _ref4.dialogScreenshotBase64;

            return new Promise(function (resolve, reject) {
                try {
                    db.get(DIALOG_SCREENSHOTS_DB).find({
                        id: dialogScreenshotId
                    }).assign({
                        base64: dialogScreenshotBase64
                    }).write();

                    _this2.getDialogScreenshotFromId(dialogScreenshotId).then(resolve).catch(reject);
                } catch (err) {
                    reject(err);
                }
            });
        }

        /**
         * @param {String} dialogVersion
         * @returns {Promise<Boolean>}
         */

    }, {
        key: 'deleteDialogsScreenshots',
        value: function deleteDialogsScreenshots(dialogVersion) {
            return new Promise(function (resolve, reject) {
                try {
                    db.get(DIALOG_SCREENSHOTS_DB).remove({
                        dialogVersion: dialogVersion
                    }).write();

                    resolve(true);
                } catch (err) {
                    reject(err);
                }
            });
        }

        /*
         * DIALOG RESULT
         */

        /**
         * @param {String} options
         * @param {String} dialogId
         * @param {String} originalVersion
         * @param {String} currentVersion
         * @returns {Promise<DialogDiffer.Database.DialogsResult>}
         */

    }, {
        key: 'getDialogsResult',
        value: function getDialogsResult(_ref5) {
            var options = _ref5.options,
                dialogId = _ref5.dialogId,
                originalVersion = _ref5.originalVersion,
                currentVersion = _ref5.currentVersion;

            return new Promise(function (fulfill, reject) {
                try {
                    var dialogsDiffResultDb = db.get(DIALOG_DIFFS_RESULT_DB).find({
                        dialogId: dialogId,
                        originalVersion: originalVersion,
                        currentVersion: currentVersion,
                        options: options
                    }).value();

                    fulfill(dialogsDiffResultDb);
                } catch (err) {
                    reject(err);
                }
            });
        }

        /**
         * @param {String} dialogId
         * @param {String} originalVersion
         * @param {String} currentVersion
         * @param {String} options
         * @param {String} result
         * @param {Array<DialogDiffer.DialogResultDiff>} differ
         * @returns {Promise<DialogDiffer.Database.DialogsResult>}
         */

    }, {
        key: 'newDialogsResult',
        value: function newDialogsResult(_ref6) {
            var dialogId = _ref6.dialogId,
                originalVersion = _ref6.originalVersion,
                currentVersion = _ref6.currentVersion,
                options = _ref6.options,
                result = _ref6.result,
                differ = _ref6.differ;

            return new Promise(function (fulfill, reject) {
                try {
                    var dialogsResultDb = db.get(DIALOG_DIFFS_RESULT_DB).insert({
                        dialogId: dialogId,
                        originalVersion: originalVersion,
                        currentVersion: currentVersion,
                        options: options,
                        result: result,
                        differ: differ
                    }).write();

                    fulfill(dialogsResultDb);
                } catch (err) {
                    reject(err);
                }
            });
        }

        /*
         * SUITE RESULT
         */

        /**
         * @param {String} suiteId
         * @return {Promise<DialogDiffer.Database.SuiteResult|null>}
         */

    }, {
        key: 'getSuiteResult',
        value: function getSuiteResult(suiteId) {
            return new Promise(function (fulfill, reject) {
                try {
                    var suiteResultsDb = db.get(SUITE_RESULT_DB).find({ id: suiteId }).value();

                    fulfill(suiteResultsDb);
                } catch (err) {
                    reject(err);
                }
            });
        }

        /**
         * @return {Promise<Array<DialogDiffer.Database.SuiteResult>>}
         */

    }, {
        key: 'getLastSuiteResults',
        value: function getLastSuiteResults() {
            return new Promise(function (fulfill, reject) {
                try {
                    var suiteResultsDb = db.get(SUITE_RESULT_DB).sortBy('timestamp').reverse().value();

                    fulfill(suiteResultsDb);
                } catch (err) {
                    reject(err);
                }
            });
        }

        /**
         * @param {DialogDiffer.Database.SuiteResult} suiteResult
         * @return {Promise<DialogDiffer.Database.SuiteResult>}
         */

    }, {
        key: 'newSuiteResult',
        value: function newSuiteResult(suiteResult) {
            return new Promise(function (fulfill, reject) {
                try {
                    var suiteResultDb = db.get(SUITE_RESULT_DB).insert(suiteResult).write();

                    fulfill(suiteResultDb);
                } catch (err) {
                    reject(err);
                }
            });
        }

        /**
         * @param {String} suiteResultId
         * @param {DialogDiffer.Database.SuiteResult} suiteResult
         * @return {Promise<DialogDiffer.Database.SuiteResult>}
         */

    }, {
        key: 'updateSuiteResult',
        value: function updateSuiteResult(suiteResultId, suiteResult) {
            return new Promise(function (fulfill, reject) {
                try {
                    var suiteResultDb = db.get(SUITE_RESULT_DB).find({ id: suiteResultId }).assign(suiteResult).write();

                    fulfill(suiteResultDb);
                } catch (err) {
                    reject(err);
                }
            });
        }

        /**
         * @param {String} suiteId
         * @returns {Promise<Boolean>}
         */

    }, {
        key: 'deleteSuiteResult',
        value: function deleteSuiteResult(suiteId) {
            return new Promise(function (fulfill, reject) {
                try {
                    db.get(SUITE_RESULT_DB).remove({
                        id: suiteId
                    }).write();

                    fulfill(true);
                } catch (err) {
                    reject(err);
                }
            });
        }
    }]);

    return LowDbDatabaseLayer;
}(AbstractDatabaseLayer);

module.exports = LowDbDatabaseLayer;