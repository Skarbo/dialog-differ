'use strict';

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

require('string-format-js');
var LowDbDatabaseLayer = require('../layers/lowdb-database.layer');

var ERROR_CONSTANTS = require('../constants/error.constants');
var SUITE_CONSTANTS = require('../constants/suite.constants');

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
 * @property {{code: String, message: String}|null} originalError
 * @property {{code: String, message: String}|null} currentError
 * @memberOf DialogDiffer.Database
 */

/**
 * @typedef {Object} DialogDiffer.Database.SuiteResultDialogsResult
 * @property {String} dialogId
 * @property {String} originalVersion
 * @property {String} currentVersion
 * @property {String} result
 * @property {{code: String, message: String}|null} error
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

/**
 * @class
 */

var DatabaseHandler = function () {
  /**
   * @param {AbstractDatabaseLayer} [databaseLayer] Uses {@link LowDbDatabaseLayer} as default
   */
  function DatabaseHandler() {
    var databaseLayer = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
    (0, _classCallCheck3.default)(this, DatabaseHandler);

    /** @type {AbstractDatabaseLayer} */
    this.databaseLayer = databaseLayer || new LowDbDatabaseLayer();
  }

  /**
   * @param {*} [args]
   * @return {Promise<void>}
   */


  (0, _createClass3.default)(DatabaseHandler, [{
    key: 'initDB',
    value: function initDB() {
      var args = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

      return this.databaseLayer.initDB(args);
    }

    /**
     * @return {Promise<void>}
     */

  }, {
    key: 'clearDB',
    value: function clearDB() {
      return this.databaseLayer ? this.databaseLayer.clearDB() : _promise2.default.resolve();
    }

    /**
     * @return {Boolean}
     */

  }, {
    key: 'isInitialized',
    value: function isInitialized() {
      return this.databaseLayer ? this.databaseLayer.isInitialized() : false;
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

      return new _promise2.default(function (resolve, reject) {
        _this.getDialogScreenshot(dialog, dialogScreenshot).then(function (dialogScreenshotDb) {
          if (dialogScreenshotDb) {
            return _this.databaseLayer.updateDialogScreenshot({
              dialogScreenshotId: dialogScreenshotDb.id,
              dialogScreenshotBase64: dialogScreenshot.base64
            });
          } else {
            return _this.databaseLayer.newDialogScreenshot({
              dialogId: dialog.id,
              dialogVersion: dialog.version,
              dialogScreenshotHeight: dialogScreenshot.height,
              dialogScreenshotWidth: dialogScreenshot.width,
              dialogScreenshotBase64: dialogScreenshot.base64
            });
          }
        }).then(resolve).catch(function (err) {
          reject(ErrorHelper.createError(err, 'Could not save dialog screenshot', ERROR_CONSTANTS.SAVE_DIALOG_SCREENSHOT_DB_ERROR, {
            dialog: dialog,
            dialogScreenshot: dialogScreenshot
          }));
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
      var _this2 = this;

      return new _promise2.default(function (resolve, reject) {
        _this2.databaseLayer.getDialogScreenshot({
          dialogId: dialog.id,
          dialogVersion: dialog.version,
          dialogScreenshotWidth: dialogScreenshot.width,
          dialogScreenshotHeight: dialogScreenshot.height
        }).then(resolve).catch(function (err) {
          reject(ErrorHelper.createError(err, 'Could not get dialog screenshot', ERROR_CONSTANTS.GET_DIALOG_SCREENSHOT_DB_ERROR, {
            dialog: dialog,
            dialogScreenshot: dialogScreenshot
          }));
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
      var _this3 = this;

      return new _promise2.default(function (resolve, reject) {
        _this3.databaseLayer.getDialogScreenshots({
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
      var _this4 = this;

      return new _promise2.default(function (resolve, reject) {
        _promise2.default.all(dialogs.map(function (dialog) {
          return _this4.getDialogScreenshots(dialog, DialogHelper.getDialogSizes(sizes, dialog));
        })).then(resolve).catch(function (err) {
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
      var _this5 = this;

      return new _promise2.default(function (resolve, reject) {
        _this5.databaseLayer.deleteDialogsScreenshots(dialogVersion).then(resolve).catch(function (err) {
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
      var _this6 = this;

      return new _promise2.default(function (resolve, reject) {
        _this6.databaseLayer.newDialogsResult({
          dialogId: dialogsResult.dialogId,
          originalVersion: dialogsResult.originalVersion,
          currentVersion: dialogsResult.currentVersion,
          options: SuiteHelper.createUniqueOptionsId(options),
          result: dialogsResult.result,
          differ: dialogsResult.differ
        }).then(function (dialogsResultDb) {
          resolve({ dialogsResult: dialogsResult, dialogResultDb: dialogsResultDb });
        }).catch(function (err) {
          reject(ErrorHelper.createError(err, 'Could not save dialogs diff result', ERROR_CONSTANTS.SAVE_DIALOGS_DIFF_RESULT_DB_ERROR, {
            options: options,
            dialogOriginal: dialogOriginal,
            dialogCurrent: dialogCurrent,
            dialogsResult: dialogsResult
          }));
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
      var _this7 = this;

      return new _promise2.default(function (resolve, reject) {
        _this7.databaseLayer.getDialogsResult({
          dialogId: dialogId,
          originalVersion: originalVersion,
          currentVersion: currentVersion,
          options: SuiteHelper.createUniqueOptionsId(options)
        }).then(resolve).catch(function (err) {
          reject(ErrorHelper.createError(err, 'Could not get dialogs diff result', ERROR_CONSTANTS.GET_DIALOG_SCREENSHOT_DB_ERROR, {
            options: options,
            dialogId: dialogId,
            originalVersion: originalVersion,
            currentVersion: currentVersion
          }));
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
      var _this8 = this;

      return new _promise2.default(function (resolve, reject) {
        _this8.databaseLayer.newSuiteResult({
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
            dialogs: (suite.original || []).length + (suite.current || []).length
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
      var _this9 = this;

      /** @param {DialogDiffer.Dialog|null} dialog */
      var createErrorObj = function createErrorObj(dialog) {
        if (!dialog || !dialog.error) {
          return null;
        }
        return {
          code: dialog.error.code,
          message: (dialog.error.message || '').format.apply(dialog.error.message || '', dialog.error.args)
        };
      };

      return new _promise2.default(function (resolve, reject) {
        _this9.databaseLayer.updateSuiteResult(suiteResult.id, {
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
                options: dialogsResult.original.options || {},
                error: createErrorObj(dialogsResult.original)
              } : null,
              current: dialogsResult.current ? {
                version: dialogsResult.currentVersion,
                id: dialogsResult.current.id,
                url: dialogsResult.current.url,
                hash: dialogsResult.current.hash,
                options: dialogsResult.current.options || {},
                error: createErrorObj(dialogsResult.current)
              } : null,
              result: dialogsResult.result
            };
          })
        }).then(resolve).catch(function (err) {
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
      var _this10 = this;

      return new _promise2.default(function (resolve, reject) {
        _this10.databaseLayer.updateSuiteResult(suite.id, {
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
      var _this11 = this;

      return new _promise2.default(function (resolve, reject) {
        _this11.databaseLayer.getSuiteResult(suiteId).then(resolve).catch(function (err) {
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
      var _this12 = this;

      return new _promise2.default(function (resolve, reject) {
        _this12.databaseLayer.getLastSuiteResults().then(resolve).catch(function (err) {
          reject(ErrorHelper.createError(err, 'Could not get suite results', ERROR_CONSTANTS.GET_SUITE_RESULTS_DB_ERROR));
        });
      });
    }

    /**
     * @param {String} suiteId
     * @returns {Promise<Boolean>}
     * @throws {DialogDiffer.Error}
     */

  }, {
    key: 'deleteSuiteResult',
    value: function deleteSuiteResult(suiteId) {
      var _this13 = this;

      return new _promise2.default(function (resolve, reject) {
        _this13.databaseLayer.deleteSuiteResult(suiteId).then(resolve).catch(function (err) {
          reject(ErrorHelper.createError(err, 'Could not delete suite result', ERROR_CONSTANTS.DELETE_SUITE_RESULT_DB_ERROR, { suiteId: suiteId }));
        });
      });
    }
  }]);
  return DatabaseHandler;
}();

module.exports = DatabaseHandler;