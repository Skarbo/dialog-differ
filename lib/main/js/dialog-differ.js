'use strict';

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @typedef {Object} DialogDiffer.Config
 * @property {String} [logLevel=error]
 * @property {Number} [browserTimeout=5000] Milliseconds to wait for browser instance to start, page to open, and page waiting selectors
 * @property {Object} [puppeteerLaunchOptions] {@link https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#puppeteerlaunchoptions|Puppeteer launch options}
 * @property {Number} [snapDialogsWithHashFromBrowserCollections] Number of hash dialogs to collect into collections (0 is off)
 * @property {Number} [snapDialogsWithHashFromBrowserConcurrency] Number of hash dialogs with has to run at same time
 * @property {Number} [diffHighlightColor=#ff0000] Diff highlight color, default red
 * @property {Number} [diffTolerance=2.3] Diff tolerance, see {@link https://github.com/gemini-testing/looks-same|looks-same} library
 * @property {Object} [test]
 * @property {String} [test.mongoUri] Mongo DB test uri
 * @memberOf DialogDiffer
 */

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
 * @property {function(width: Number, height: Number): { width: Number, height: Number }} [resize]
 * @property {{code: String, message: String, args: [Object], stack: [Object]}} [error] Injected
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
 * @property {Object} [extra] Extra data that can be stored in database
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
 * @property {Number} dialogs
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
 * @param {Object} obj
 * @param {String} obj.suiteId
 * @param {DialogDiffer.Dialog} obj.dialog
 * @param {ErrorHelper} [obj.err]
 * @param {Boolean} [obj.isDatabase]
 * @param {Boolean} [isOriginal]
 * @param {Boolean} [isCurrent]
 * @memberOf DialogDiffer
 */

/**
 * @callback DialogDiffer.OnDiffCallback
 * @param {Object} obj
 * @param {String} obj.suiteId
 * @param {DialogDiffer.DialogsResult} obj.dialogsResult
 * @memberOf DialogDiffer
 */

/**
 * @callback DialogDiffer.OnEndCallback
 * @param {DialogDiffer.Database.SuiteResult} suiteResult
 * @memberOf DialogDiffer
 */

process.setMaxListeners(0); // needed for puppeteer

var TAG = 'DialogDiffer';

var DatabaseHandler = require('./handlers/database.handler');
var LowDbDatabaseLayer = require('./layers/lowdb-database.layer');
var MongoDbDatabaseLayer = require('./layers/mongodb-database.layer');
var SnapHandler = require('./handlers/snap.handler');
var DifferHandler = require('./handlers/differ.handler');
var logger = require('./logger');
var configLib = require('./config.lib');

var ERROR_CONSTANTS = require('./constants/error.constants');
var SUITE_CONSTANTS = require('./constants/suite.constants');
var DIFFER_CONSTANTS = require('./constants/differ.constants');
var LOGGER_CONSTANTS = require('./constants/logger.constants');

var ErrorHelper = require('./helpers/error.helper');
var SuiteHelper = require('./helpers/suite.helper');
var DialogHelper = require('./helpers/dialog.helper');

/**
 * @class
 */

var DialogDiffer = function () {
  /**
   * @param {AbstractDatabaseLayer|String} [databaseLayer]
   * @param {DatabaseHandler} [databaseHandler]
   * @param {DifferHandler} [differHandler]
   * @param {SnapHandler} [snapHandler]
   * @param {DialogDiffer.Config} [config]
   */
  function DialogDiffer() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref$databaseLayer = _ref.databaseLayer,
        databaseLayer = _ref$databaseLayer === undefined ? null : _ref$databaseLayer,
        _ref$databaseHandler = _ref.databaseHandler,
        databaseHandler = _ref$databaseHandler === undefined ? null : _ref$databaseHandler,
        _ref$differHandler = _ref.differHandler,
        differHandler = _ref$differHandler === undefined ? null : _ref$differHandler,
        _ref$snapHandler = _ref.snapHandler,
        snapHandler = _ref$snapHandler === undefined ? null : _ref$snapHandler,
        _ref$config = _ref.config,
        config = _ref$config === undefined ? {} : _ref$config;

    (0, _classCallCheck3.default)(this, DialogDiffer);

    logger.setLevel(configLib.getConfig(config).logLevel);
    /** @type {DatabaseHandler} */
    this.databaseHandler = databaseHandler || new DatabaseHandler(databaseLayer);
    /** @type {DifferHandler} */
    this.differHandler = differHandler || new DifferHandler(this.databaseHandler, config);
    /** @type {SnapHandler} */
    this.snapHandler = snapHandler || new SnapHandler(this.databaseHandler, config);
  }

  (0, _createClass3.default)(DialogDiffer, [{
    key: 'initDialogDiffer',


    /**
     * @param {*} [databaseArgs]
     * @return {Promise<void>}
     * @throws {DialogDiffer.Error}
     */
    value: function () {
      var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee() {
        var _ref3 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
            _ref3$databaseArgs = _ref3.databaseArgs,
            databaseArgs = _ref3$databaseArgs === undefined ? null : _ref3$databaseArgs;

        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                return _context.abrupt('return', this.databaseHandler.initDB(databaseArgs));

              case 1:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function initDialogDiffer() {
        return _ref2.apply(this, arguments);
      }

      return initDialogDiffer;
    }()

    /**
     * @param {DialogDiffer.Suite} suite
     * @param {DialogDiffer.OnStartCallback} [onStart]
     * @param {function({suiteId: String, dialogs: Number}): void} [onSnapStart]
     * @param {DialogDiffer.OnSnapCallback} [onSnap]
     * @param {function({suiteId: String, dialogs: Number}): void} [onSnapEnd]
     * @param {function({suiteId: String, dialogs: Number}): void} [onDiffStart]
     * @param {DialogDiffer.OnDiffCallback} [onDiff]
     * @param {function({suiteId: String, dialogs: Number}): void} [onDiffEnd]
     * @param {DialogDiffer.OnEndCallback} [onEnd]
     * @return {Promise<DialogDiffer.SuiteResult>}
     * @throws {DialogDiffer.Error}
     */

  }, {
    key: 'diff',
    value: function () {
      var _ref4 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(suite) {
        var _ref5 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
            _ref5$onStart = _ref5.onStart,
            onStart = _ref5$onStart === undefined ? null : _ref5$onStart,
            _ref5$onSnapStart = _ref5.onSnapStart,
            onSnapStart = _ref5$onSnapStart === undefined ? null : _ref5$onSnapStart,
            _ref5$onSnap = _ref5.onSnap,
            _onSnap = _ref5$onSnap === undefined ? null : _ref5$onSnap,
            _ref5$onSnapEnd = _ref5.onSnapEnd,
            onSnapEnd = _ref5$onSnapEnd === undefined ? null : _ref5$onSnapEnd,
            _ref5$onDiffStart = _ref5.onDiffStart,
            onDiffStart = _ref5$onDiffStart === undefined ? null : _ref5$onDiffStart,
            _ref5$onDiff = _ref5.onDiff,
            _onDiff = _ref5$onDiff === undefined ? null : _ref5$onDiff,
            _ref5$onDiffEnd = _ref5.onDiffEnd,
            onDiffEnd = _ref5$onDiffEnd === undefined ? null : _ref5$onDiffEnd,
            _ref5$onEnd = _ref5.onEnd,
            onEnd = _ref5$onEnd === undefined ? null : _ref5$onEnd;

        var numberOfDialogs, numberOfUniqueDialogs, _ref6, initSuiteResultDb, _ref8, suiteResult, suiteResultDb, _suiteResultDb;

        return _regenerator2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.prev = 0;
                _context2.next = 3;
                return SuiteHelper.validateSuite(suite);

              case 3:
                numberOfDialogs = SuiteHelper.getNumberOfDialogs(suite);
                numberOfUniqueDialogs = SuiteHelper.getNumberOfUniqueDialogs(suite);

                // init Suite result

                _context2.next = 7;
                return this.differHandler.initSuiteResult(suite);

              case 7:
                _ref6 = _context2.sent;
                initSuiteResultDb = _ref6.suiteResultDb;


                if (onStart) {
                  onStart(initSuiteResultDb);
                }

                if (onSnapStart) {
                  onSnapStart({ suiteId: initSuiteResultDb.id, dialogs: numberOfDialogs });
                }

                // snap Suite
                _context2.next = 13;
                return this.snapHandler.snapSuite(suite, {
                  onSnap: function onSnap(_ref7) {
                    var dialog = _ref7.dialog,
                        err = _ref7.err,
                        isDatabase = _ref7.isDatabase,
                        isOriginal = _ref7.isOriginal,
                        isCurrent = _ref7.isCurrent;

                    if (_onSnap) {
                      _onSnap({ suiteId: initSuiteResultDb.id, dialog: dialog, err: err, isDatabase: isDatabase, isOriginal: isOriginal, isCurrent: isCurrent });
                    }
                  }
                });

              case 13:

                if (onSnapEnd) {
                  onSnapEnd({ suiteId: initSuiteResultDb.id, dialogs: numberOfDialogs });
                }

                if (onDiffStart) {
                  onDiffStart({ suiteId: initSuiteResultDb.id, dialogs: numberOfUniqueDialogs });
                }

                // differ Suite
                _context2.next = 17;
                return this.differHandler.differSuite(suite, {
                  onDiff: function onDiff(_ref9) {
                    var dialogsResult = _ref9.dialogsResult;

                    if (_onDiff) {
                      _onDiff({ suiteId: initSuiteResultDb.id, dialogsResult: dialogsResult });
                    }
                  }
                });

              case 17:
                _ref8 = _context2.sent;
                suiteResult = _ref8.suiteResult;
                suiteResultDb = _ref8.suiteResultDb;


                if (onDiffEnd) {
                  onDiffEnd({ suiteId: initSuiteResultDb.id, dialogs: numberOfUniqueDialogs });
                }

                if (onEnd) {
                  onEnd(suiteResultDb);
                }

                return _context2.abrupt('return', suiteResult);

              case 25:
                _context2.prev = 25;
                _context2.t0 = _context2['catch'](0);

                logger.error(TAG, 'diff', _context2.t0.toString(), (0, _stringify2.default)(_context2.t0.args), _context2.t0.stack);

                _context2.prev = 28;
                _context2.next = 31;
                return this.differHandler.errorSuiteResult(suite, _context2.t0);

              case 31:
                _context2.next = 33;
                return this.databaseHandler.getSuiteResult(suite.id);

              case 33:
                _suiteResultDb = _context2.sent;


                if (onEnd) {
                  onEnd(_suiteResultDb);
                }
                _context2.next = 39;
                break;

              case 37:
                _context2.prev = 37;
                _context2.t1 = _context2['catch'](28);

              case 39:
                throw ErrorHelper.createError(_context2.t0, 'Unexpected error', ERROR_CONSTANTS.UNEXPECTED_ERROR);

              case 40:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this, [[0, 25], [28, 37]]);
      }));

      function diff(_x3) {
        return _ref4.apply(this, arguments);
      }

      return diff;
    }()

    /**
     * @param {String} suiteId
     * @return {Promise<DialogDiffer.SuiteResult>}
     * @throws {DialogDiffer.Error}
     */

  }, {
    key: 'getSuiteResult',
    value: function () {
      var _ref10 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3(suiteId) {
        var _this = this;

        var suiteResultDb, suiteResult, dialogsScreenshotsMapDb, dialogsResultsDb;
        return _regenerator2.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.prev = 0;
                _context3.next = 3;
                return this.databaseHandler.getSuiteResult(suiteId);

              case 3:
                suiteResultDb = _context3.sent;

                if (!(!suiteResultDb || suiteResultDb.status !== SUITE_CONSTANTS.FINISHED_STATUS)) {
                  _context3.next = 6;
                  break;
                }

                throw ErrorHelper.createError(null, 'Suite does not exist or is not finished', null, { suiteResultDb: suiteResultDb });

              case 6:

                /** @type {DialogDiffer.SuiteResult} */
                suiteResult = (0, _extends3.default)({}, suiteResultDb);

                // get dialogs screenshots
                /** @type {Array<Array<DialogDiffer.Database.DialogScreenshot>>} */

                _context3.next = 9;
                return _promise2.default.all(suiteResultDb.results.map(function (suiteResultDialogsResultDb) {
                  return _this.databaseHandler.getDialogsScreenshots([{ id: suiteResultDialogsResultDb.dialogId, version: suiteResultDialogsResultDb.originalVersion }, { id: suiteResultDialogsResultDb.dialogId, version: suiteResultDialogsResultDb.currentVersion }], DialogHelper.getDialogSizes(suiteResultDb.options.sizes, suiteResultDialogsResultDb.original || suiteResultDialogsResultDb.current));
                }));

              case 9:
                dialogsScreenshotsMapDb = _context3.sent;


                dialogsScreenshotsMapDb.forEach(function (dialogsScreenshotsDb, i) {
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

                /** @type {Array<DialogDiffer.Database.DialogsResult>} */
                _context3.next = 13;
                return _promise2.default.all(suiteResult.results.map(function (suiteResultDialogsResultDb) {
                  return _this.databaseHandler.getDialogsResult({
                    options: suiteResult.options,
                    dialogId: suiteResultDialogsResultDb.dialogId,
                    originalVersion: suiteResultDialogsResultDb.originalVersion,
                    currentVersion: suiteResultDialogsResultDb.currentVersion
                  });
                }));

              case 13:
                dialogsResultsDb = _context3.sent;


                dialogsResultsDb.forEach(function (dialogsResultDb, i) {
                  if (dialogsResultDb) {
                    suiteResult.results[i].differ = dialogsResultDb.differ;
                  } else {
                    // set differ to result
                    suiteResult.results[i].differ.forEach(function (diffResult) {
                      diffResult.result = suiteResult.results[i].result;
                    });
                  }
                });

                return _context3.abrupt('return', suiteResult);

              case 18:
                _context3.prev = 18;
                _context3.t0 = _context3['catch'](0);
                throw ErrorHelper.createError(_context3.t0, 'Could not get Suite', ERROR_CONSTANTS.GET_SUITE_ERROR, { suiteId: suiteId });

              case 21:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this, [[0, 18]]);
      }));

      function getSuiteResult(_x5) {
        return _ref10.apply(this, arguments);
      }

      return getSuiteResult;
    }()

    /**
     * @return {Promise<Array<DialogDiffer.Database.SuiteResult>>}
     * @throws {DialogDiffer.Error}
     */

  }, {
    key: 'getLastSuiteResults',
    value: function () {
      var _ref11 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4() {
        return _regenerator2.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                return _context4.abrupt('return', this.databaseHandler.getLastSuiteResults());

              case 1:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function getLastSuiteResults() {
        return _ref11.apply(this, arguments);
      }

      return getLastSuiteResults;
    }()

    /**
     * @param {String} dialogVersion
     * @returns {Promise<Boolean>}
     * @throws {DialogDiffer.Error}
     */

  }, {
    key: 'deleteDialogs',
    value: function () {
      var _ref12 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee5(dialogVersion) {
        return _regenerator2.default.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                return _context5.abrupt('return', this.databaseHandler.deleteDialogsScreenshots(dialogVersion));

              case 1:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function deleteDialogs(_x6) {
        return _ref12.apply(this, arguments);
      }

      return deleteDialogs;
    }()

    /**
     * @param {String} suiteId
     * @returns {Promise<Boolean>}
     * @throws {DialogDiffer.Error}
     */

  }, {
    key: 'deleteSuiteResult',
    value: function () {
      var _ref13 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee6(suiteId) {
        return _regenerator2.default.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                return _context6.abrupt('return', this.databaseHandler.deleteSuiteResult(suiteId));

              case 1:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function deleteSuiteResult(_x7) {
        return _ref13.apply(this, arguments);
      }

      return deleteSuiteResult;
    }()
  }], [{
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
  }, {
    key: 'LowDbDatabaseLayer',
    get: function get() {
      return LowDbDatabaseLayer;
    }
  }, {
    key: 'MongoDbDatabaseLayer',
    get: function get() {
      return MongoDbDatabaseLayer;
    }
  }]);
  return DialogDiffer;
}();

module.exports = DialogDiffer;