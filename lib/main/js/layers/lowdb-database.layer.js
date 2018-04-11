'use strict';

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var lowDB = require('lowdb');
var AbstractDatabaseLayer = require('./abstract-database.layer');

var DIALOG_SCREENSHOTS_DB = 'dialog_screenshots';
var DIALOG_DIFFS_RESULT_DB = 'dialog_diffs_result';
var SUITE_RESULT_DB = 'suite_result';

var db = null;

var LowDbDatabaseLayer = function (_AbstractDatabaseLaye) {
  (0, _inherits3.default)(LowDbDatabaseLayer, _AbstractDatabaseLaye);

  function LowDbDatabaseLayer() {
    (0, _classCallCheck3.default)(this, LowDbDatabaseLayer);
    return (0, _possibleConstructorReturn3.default)(this, (LowDbDatabaseLayer.__proto__ || (0, _getPrototypeOf2.default)(LowDbDatabaseLayer)).apply(this, arguments));
  }

  (0, _createClass3.default)(LowDbDatabaseLayer, [{
    key: 'initDB',

    /**
     * @param {String} [dbFile] Uses in-memory if not given
     */
    value: function initDB() {
      var dbFile = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

      return new _promise2.default(function (resolve, reject) {
        try {
          var _db$defaults;

          if (!db) {
            db = lowDB(dbFile);

            db._.mixin(require('lodash-id'));
          }

          db.defaults((_db$defaults = {}, (0, _defineProperty3.default)(_db$defaults, DIALOG_SCREENSHOTS_DB, []), (0, _defineProperty3.default)(_db$defaults, DIALOG_DIFFS_RESULT_DB, []), (0, _defineProperty3.default)(_db$defaults, SUITE_RESULT_DB, []), _db$defaults)).write();

          resolve();
        } catch (err) {
          reject(err);
        }
      });
    }
  }, {
    key: 'clearDB',
    value: function clearDB() {
      if (db) {
        var _db$setState;

        db.setState((_db$setState = {}, (0, _defineProperty3.default)(_db$setState, DIALOG_SCREENSHOTS_DB, []), (0, _defineProperty3.default)(_db$setState, DIALOG_DIFFS_RESULT_DB, []), (0, _defineProperty3.default)(_db$setState, SUITE_RESULT_DB, []), _db$setState));
      }
      return _promise2.default.resolve();
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
      return new _promise2.default(function (resolve, reject) {
        try {
          resolve(_promise2.default.resolve(db.get(DIALOG_SCREENSHOTS_DB).find({
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

      return new _promise2.default(function (resolve, reject) {
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

      return new _promise2.default(function (resolve, reject) {
        try {
          var dialogScreenshotDb = db.get(DIALOG_SCREENSHOTS_DB).filter(function (dialogScreenshotDb) {
            var isCorrectSize = sizes.filter(function (size) {
              return size.width === dialogScreenshotDb.width && size.height === dialogScreenshotDb.height;
            }).length > 0;

            return dialogScreenshotDb.dialogId === dialogId && dialogScreenshotDb.dialogVersion === dialogVersion && isCorrectSize;
          }).value();

          resolve(dialogScreenshotDb);
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

      return new _promise2.default(function (resolve, reject) {
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

      return new _promise2.default(function (resolve, reject) {
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
      return new _promise2.default(function (resolve, reject) {
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

      return new _promise2.default(function (resolve, reject) {
        try {
          var dialogsDiffResultDb = db.get(DIALOG_DIFFS_RESULT_DB).find({
            dialogId: dialogId,
            originalVersion: originalVersion,
            currentVersion: currentVersion,
            options: options
          }).value();

          resolve(dialogsDiffResultDb);
        } catch (err) {
          reject(err);
        }
      });
    }

    /**
     * @param {DialogDiffer.Database.DialogsResult} dialogsResult
     * @returns {Promise<DialogDiffer.Database.DialogsResult>}
     */

  }, {
    key: 'newDialogsResult',
    value: function newDialogsResult(dialogsResult) {
      return new _promise2.default(function (resolve, reject) {
        try {
          var dialogsResultDb = db.get(DIALOG_DIFFS_RESULT_DB).insert(dialogsResult).write();

          resolve(dialogsResultDb);
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
      return new _promise2.default(function (fulfill, reject) {
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
      return new _promise2.default(function (resolve, reject) {
        try {
          var suiteResultsDb = db.get(SUITE_RESULT_DB).sortBy('timestamp').reverse().value();

          resolve(suiteResultsDb);
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
      return new _promise2.default(function (resolve, reject) {
        try {
          var suiteResultDb = db.get(SUITE_RESULT_DB).insert(suiteResult).write();

          resolve(suiteResultDb);
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
      return new _promise2.default(function (fulfill, reject) {
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
      return new _promise2.default(function (fulfill, reject) {
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