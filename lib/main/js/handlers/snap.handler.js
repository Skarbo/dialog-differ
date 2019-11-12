'use strict';

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var puppeteerScreenshot = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(page, dialog, size, databaseHandler) {
    var _this = this;

    var takeScreenshot, screenshot, dialogScreenshot;
    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            logger.log(TAG, 'dialogScreenshot', 'Taking screenshot \'%s\', \'%s%s\'. Crop \'%s\'.', LOGGER_CONSTANTS.SCREENSHOT_FROM_BROWSER_LOGGER, DialogHelper.createUniqueDialogScreenshotId(dialog, { width: size.width, height: size.height }), dialog.url, dialog.hash ? '#' + dialog.hash : '', dialog.crop || false);

            takeScreenshot = function () {
              var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee() {
                var clip;
                return _regenerator2.default.wrap(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        if (!dialog.crop) {
                          _context.next = 7;
                          break;
                        }

                        _context.next = 3;
                        return page.evaluate(getElementClipEvaluate, dialog.crop);

                      case 3:
                        clip = _context.sent;
                        return _context.abrupt('return', page.screenshot({ clip: clip }));

                      case 7:
                        return _context.abrupt('return', page.screenshot());

                      case 8:
                      case 'end':
                        return _context.stop();
                    }
                  }
                }, _callee, _this);
              }));

              return function takeScreenshot() {
                return _ref2.apply(this, arguments);
              };
            }();

            _context2.prev = 2;
            _context2.next = 5;
            return takeScreenshot();

          case 5:
            screenshot = _context2.sent;
            dialogScreenshot = DialogHelper.createDialogScreenshot(size.width, size.height, 'data:image/png;base64,' + base64ArrayBuffer.encode(screenshot));

            dialog.screenshots.push(dialogScreenshot);

            return _context2.abrupt('return', databaseHandler.saveDialogScreenshot(dialog, dialogScreenshot));

          case 11:
            _context2.prev = 11;
            _context2.t0 = _context2['catch'](2);
            throw ErrorHelper.createError(_context2.t0, 'Could not take dialog screenshot', ERROR_CONSTANTS.DIALOG_SCREENSHOT_ERROR);

          case 14:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this, [[2, 11]]);
  }));

  return function puppeteerScreenshot(_x, _x2, _x3, _x4) {
    return _ref.apply(this, arguments);
  };
}();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var TAG = 'Snap';

var puppeteer = require('puppeteer');
var Promise = require('bluebird');
var base64ArrayBuffer = require('base64-arraybuffer');

var logger = require('../logger');

var configLib = require('../config.lib');

var LOGGER_CONSTANTS = require('../constants/logger.constants');
var ERROR_CONSTANTS = require('../constants/error.constants');

var DialogHelper = require('../helpers/dialog.helper');
var ErrorHelper = require('../helpers/error.helper');

function getElementClipEvaluate(selector) {
  var element = document.querySelector(selector);

  if (!element) {
    return null;
  }

  return {
    y: element.offsetTop,
    x: element.offsetLeft,
    width: element.clientWidth,
    height: element.clientHeight
  };
}

function injectCSSEvaluate() {
  var css = '* { animation: none!important; -webkit-animation: none!important; caret-color: transparent!important; }',
      head = document.head || document.getElementsByTagName('head')[0],
      style = document.createElement('style');

  style.type = 'text/css';
  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }

  head.appendChild(style);
}

function redirectHashEvaluate(hash) {
  document.location.hash = hash;
}

var SnapHandler = function () {
  function SnapHandler(databaseHandler) {
    var config = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    (0, _classCallCheck3.default)(this, SnapHandler);

    this.databaseHandler = databaseHandler;
    this.config = configLib.getConfig(config);
  }

  (0, _createClass3.default)(SnapHandler, [{
    key: 'snapSuite',
    value: function () {
      var _ref3 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3(suite) {
        var _ref4 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
            onSnap = _ref4.onSnap;

        return _regenerator2.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                logger.log(TAG, 'snapSuite', 'Snapping suite..', null, suite);

                _context3.prev = 1;
                _context3.next = 4;
                return this.snapSuiteDialogs(suite.options, suite.original, { onSnap: onSnap, isOriginal: true });

              case 4:
                _context3.next = 6;
                return this.snapSuiteDialogs(suite.options, suite.current, { onSnap: onSnap, isCurrent: true });

              case 6:

                logger.log(TAG, 'snapSuite', 'Snapped suite', null, suite.id);
                return _context3.abrupt('return', suite);

              case 10:
                _context3.prev = 10;
                _context3.t0 = _context3['catch'](1);
                throw ErrorHelper.createError(_context3.t0, 'Could not snap Suite', ERROR_CONSTANTS.SNAP_SUITE_ERROR);

              case 13:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this, [[1, 10]]);
      }));

      function snapSuite(_x6) {
        return _ref3.apply(this, arguments);
      }

      return snapSuite;
    }()
  }, {
    key: 'snapSuiteDialogs',
    value: function () {
      var _ref5 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4(options, dialogs) {
        var _this2 = this;

        var _ref6 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
            onSnap = _ref6.onSnap,
            _ref6$isOriginal = _ref6.isOriginal,
            isOriginal = _ref6$isOriginal === undefined ? false : _ref6$isOriginal,
            _ref6$isCurrent = _ref6.isCurrent,
            isCurrent = _ref6$isCurrent === undefined ? false : _ref6$isCurrent;

        var dialogsScreenshotsDb, _DialogHelper$collect, snappedCollection, nonSnappedCollection, result, snappedDialogs;

        return _regenerator2.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                dialogs.forEach(function (dialog) {
                  if (!dialog.screenshots) {
                    dialog.screenshots = [];
                  }
                });

                _context4.prev = 1;
                _context4.next = 4;
                return this.databaseHandler.getDialogsScreenshots(dialogs, options.sizes);

              case 4:
                dialogsScreenshotsDb = _context4.sent;
                _DialogHelper$collect = DialogHelper.collectSnappedDialogs(options, dialogs, dialogsScreenshotsDb), snappedCollection = _DialogHelper$collect.snappedCollection, nonSnappedCollection = _DialogHelper$collect.nonSnappedCollection;
                _context4.next = 8;
                return Promise.all([].concat(snappedCollection.dialogsWithHash.map(function (par) {
                  return _this2.snapDialogsWithHashFromDatabase(par.map(function (snappedCollectedDialog) {
                    return snappedCollectedDialog.dialog;
                  }), par.map(function (snappedCollectedDialog) {
                    return snappedCollectedDialog.screenshots;
                  }), { onSnap: onSnap, isOriginal: isOriginal, isCurrent: isCurrent });
                }), snappedCollection.dialogs.map(function (par) {
                  return _this2.snapDialogFromDatabase(par.dialog, par.screenshots, { onSnap: onSnap, isOriginal: isOriginal, isCurrent: isCurrent });
                }), nonSnappedCollection.dialogsWithHash.map(function (par) {
                  return _this2.snapDialogsWithHashFromBrowser(options, par.map(function (snappedCollectedDialog) {
                    return snappedCollectedDialog.dialog;
                  }), { onSnap: onSnap, isOriginal: isOriginal, isCurrent: isCurrent });
                }), this.snapDialogsFromBrowser(options, nonSnappedCollection.dialogs.map(function (par) {
                  return par.dialog;
                }), { onSnap: onSnap, isOriginal: isOriginal, isCurrent: isCurrent })));

              case 8:
                result = _context4.sent;
                snappedDialogs = result.reduce(function (acc, cur) {
                  acc = acc.concat(cur);
                  return acc;
                }, []);


                logger.log(TAG, 'snapSuiteDialogs', 'Snapped dialogs \'%s\'. Collections \'%s\'.', null, snappedDialogs.length, result.length);

                return _context4.abrupt('return', snappedDialogs);

              case 14:
                _context4.prev = 14;
                _context4.t0 = _context4['catch'](1);
                throw ErrorHelper.createError(_context4.t0, 'Could not snap Suite dialogs', ERROR_CONSTANTS.SNAP_SUITE_DIALOGS_ERROR);

              case 17:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this, [[1, 14]]);
      }));

      function snapSuiteDialogs(_x8, _x9) {
        return _ref5.apply(this, arguments);
      }

      return snapSuiteDialogs;
    }()
  }, {
    key: 'snapDialog',
    value: function () {
      var _ref7 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee5(options, dialog) {
        var _ref8 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
            onSnap = _ref8.onSnap,
            _ref8$isOriginal = _ref8.isOriginal,
            isOriginal = _ref8$isOriginal === undefined ? false : _ref8$isOriginal,
            _ref8$isCurrent = _ref8.isCurrent,
            isCurrent = _ref8$isCurrent === undefined ? false : _ref8$isCurrent;

        var dialogScreenshotsDb;
        return _regenerator2.default.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                if (!dialog.screenshots) {
                  dialog.screenshots = [];
                }

                _context5.prev = 1;
                _context5.next = 4;
                return this.databaseHandler.getDialogScreenshots(dialog, DialogHelper.getDialogSizes(options.sizes, dialog));

              case 4:
                dialogScreenshotsDb = _context5.sent;

                if (!(DialogHelper.isDialogSnapped(DialogHelper.getDialogSizes(options.sizes, dialog), dialog, dialogScreenshotsDb) && !options.isForceSnap)) {
                  _context5.next = 10;
                  break;
                }

                _context5.next = 8;
                return this.snapDialogFromDatabase(dialog, dialogScreenshotsDb, { onSnap: onSnap, isOriginal: isOriginal, isCurrent: isCurrent });

              case 8:
                _context5.next = 12;
                break;

              case 10:
                _context5.next = 12;
                return this.snapDialogFromBrowser(options, dialog, { onSnap: onSnap, isOriginal: isOriginal, isCurrent: isCurrent });

              case 12:
                if (onSnap) {
                  onSnap({ dialog: dialog, isOriginal: isOriginal, isCurrent: isCurrent });
                }

                return _context5.abrupt('return', dialog);

              case 16:
                _context5.prev = 16;
                _context5.t0 = _context5['catch'](1);

                if (onSnap) {
                  onSnap({ dialog: dialog, err: _context5.t0, isOriginal: isOriginal, isCurrent: isCurrent });
                }

                throw _context5.t0;

              case 20:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this, [[1, 16]]);
      }));

      function snapDialog(_x11, _x12) {
        return _ref7.apply(this, arguments);
      }

      return snapDialog;
    }()
  }, {
    key: 'snapDialogFromDatabase',
    value: function () {
      var _ref9 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee6(dialog, dialogScreenshotsDb) {
        var _ref10 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
            onSnap = _ref10.onSnap,
            _ref10$isOriginal = _ref10.isOriginal,
            isOriginal = _ref10$isOriginal === undefined ? false : _ref10$isOriginal,
            _ref10$isCurrent = _ref10.isCurrent,
            isCurrent = _ref10$isCurrent === undefined ? false : _ref10$isCurrent;

        return _regenerator2.default.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                logger.log(TAG, 'snapDialogFromDatabase', 'Snapping dialog \'%s\' from database', null, dialog.id);

                _context6.prev = 1;

                dialogScreenshotsDb.forEach(function (dialogScreenshotDb) {
                  dialog.screenshots.push(DialogHelper.createDialogScreenshot(dialogScreenshotDb.width, dialogScreenshotDb.height, dialogScreenshotDb.base64));
                });

                logger.info(TAG, 'snapDialogFromDatabase', '[dialog_version=%s][dialog_id=%s][dialog_screenshots=%d]', LOGGER_CONSTANTS.SCREENSHOTS_FROM_DATABASE_LOGGER, dialog.version, dialog.id, dialogScreenshotsDb.length);

                if (onSnap) {
                  onSnap({ dialog: dialog, isDatabase: true, isOriginal: isOriginal, isCurrent: isCurrent });
                }

                return _context6.abrupt('return', dialog);

              case 8:
                _context6.prev = 8;
                _context6.t0 = _context6['catch'](1);

                if (onSnap) {
                  onSnap({ dialog: dialog, err: _context6.t0, isDatabase: true, isOriginal: isOriginal, isCurrent: isCurrent });
                }

                throw _context6.t0;

              case 12:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6, this, [[1, 8]]);
      }));

      function snapDialogFromDatabase(_x14, _x15) {
        return _ref9.apply(this, arguments);
      }

      return snapDialogFromDatabase;
    }()
  }, {
    key: 'snapDialogFromBrowser',
    value: function () {
      var _ref11 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee8(options, dialog) {
        var _this3 = this;

        var _ref12 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
            onSnap = _ref12.onSnap,
            _ref12$isOriginal = _ref12.isOriginal,
            isOriginal = _ref12$isOriginal === undefined ? false : _ref12$isOriginal,
            _ref12$isCurrent = _ref12.isCurrent,
            isCurrent = _ref12$isCurrent === undefined ? false : _ref12$isCurrent;

        var browser, page, sizes, error;
        return _regenerator2.default.wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                browser = void 0;
                page = void 0;
                _context8.prev = 2;
                sizes = DialogHelper.getDialogSizes(options.sizes, dialog);


                logger.log(TAG, 'snapDialogFromBrowser', '[dialog_version=%s][dialog_id=%s][dialog_url=%s][dialog_sizes=%s]', LOGGER_CONSTANTS.SNAP_DIALOG_WITH_HASH_FROM_BROWSER_LOGGER, dialog.version, dialog.id, dialog.url, sizes.map(function (_ref13) {
                  var width = _ref13.width,
                      height = _ref13.height;
                  return width + 'x' + height;
                }).join(','));

                _context8.next = 7;
                return puppeteer.launch((0, _extends3.default)({
                  timeout: this.config.browserTimeout
                }, this.config.puppeteerLaunchOptions));

              case 7:
                browser = _context8.sent;
                _context8.next = 10;
                return browser.newPage();

              case 10:
                page = _context8.sent;


                page.on('error', function (msg) {
                  logger.warn(TAG, 'snapDialogFromBrowser', '[dialog_version=%s][dialog_id=%s][dialog_url=%s][error=%s]', ERROR_CONSTANTS.SNAP_DIALOG_FROM_BROWSER_ERROR, dialog.version, dialog.id, dialog.url, msg);
                });

                _context8.next = 14;
                return page.goto(dialog.url, {
                  timeout: this.config.browserTimeout
                });

              case 14:
                _context8.next = 16;
                return page.evaluate(injectCSSEvaluate);

              case 16:
                if (!dialog.waitForSelector) {
                  _context8.next = 19;
                  break;
                }

                _context8.next = 19;
                return page.waitForSelector(dialog.waitForSelector, {
                  timeout: this.config.browserTimeout
                });

              case 19:
                _context8.next = 21;
                return Promise.each(sizes, function () {
                  var _ref14 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee7(size) {
                    var newSize;
                    return _regenerator2.default.wrap(function _callee7$(_context7) {
                      while (1) {
                        switch (_context7.prev = _context7.next) {
                          case 0:
                            _context7.next = 2;
                            return page.setViewport(size);

                          case 2:
                            _context7.next = 4;
                            return page.waitFor(dialog.timeout || 0);

                          case 4:
                            if (!dialog.resize) {
                              _context7.next = 15;
                              break;
                            }

                            _context7.next = 7;
                            return page.evaluate(dialog.resize, size.width, size.height);

                          case 7:
                            newSize = _context7.sent;
                            _context7.next = 10;
                            return page.setViewport(newSize);

                          case 10:
                            _context7.next = 12;
                            return page.evaluate(dialog.resize, newSize.width, newSize.height);

                          case 12:
                            newSize = _context7.sent;
                            _context7.next = 15;
                            return page.setViewport(newSize);

                          case 15:
                            _context7.next = 17;
                            return puppeteerScreenshot(page, dialog, size, _this3.databaseHandler);

                          case 17:
                          case 'end':
                            return _context7.stop();
                        }
                      }
                    }, _callee7, _this3);
                  }));

                  return function (_x20) {
                    return _ref14.apply(this, arguments);
                  };
                }());

              case 21:
                if (onSnap) {
                  onSnap({ dialog: dialog, isOriginal: isOriginal, isCurrent: isCurrent });
                }
                _context8.next = 30;
                break;

              case 24:
                _context8.prev = 24;
                _context8.t0 = _context8['catch'](2);
                error = ErrorHelper.createError(_context8.t0, '[dialog_version=%s][dialog_id=%s][dialog_url=%s][error=%s]', ERROR_CONSTANTS.SNAP_DIALOG_FROM_BROWSER_ERROR, dialog.version, dialog.id, dialog.url, _context8.t0.message);


                dialog.error = {
                  code: error.code,
                  message: error.message,
                  args: error.args,
                  stack: error.stack
                };

                logger.error.apply(logger, [TAG, 'snapDialogFromBrowser', error.message, error.code].concat((0, _toConsumableArray3.default)(error.args), [error.stack]));

                if (onSnap) {
                  onSnap({ dialog: dialog, err: error, isOriginal: isOriginal, isCurrent: isCurrent });
                }

              case 30:
                if (!page) {
                  _context8.next = 33;
                  break;
                }

                _context8.next = 33;
                return page.close();

              case 33:
                if (!browser) {
                  _context8.next = 36;
                  break;
                }

                _context8.next = 36;
                return browser.close();

              case 36:
                return _context8.abrupt('return', dialog);

              case 37:
              case 'end':
                return _context8.stop();
            }
          }
        }, _callee8, this, [[2, 24]]);
      }));

      function snapDialogFromBrowser(_x17, _x18) {
        return _ref11.apply(this, arguments);
      }

      return snapDialogFromBrowser;
    }()
  }, {
    key: 'snapDialogsFromBrowser',
    value: function () {
      var _ref15 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee12(options, dialogs) {
        var _this4 = this;

        var _ref16 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
            onSnap = _ref16.onSnap,
            _ref16$isOriginal = _ref16.isOriginal,
            isOriginal = _ref16$isOriginal === undefined ? false : _ref16$isOriginal,
            _ref16$isCurrent = _ref16.isCurrent,
            isCurrent = _ref16$isCurrent === undefined ? false : _ref16$isCurrent;

        var browser, page, lastDialog, createBrowser, createPage, error;
        return _regenerator2.default.wrap(function _callee12$(_context12) {
          while (1) {
            switch (_context12.prev = _context12.next) {
              case 0:
                browser = void 0;
                page = void 0;
                lastDialog = dialogs[0];

                createBrowser = function createBrowser() {
                  return puppeteer.launch((0, _extends3.default)({
                    timeout: _this4.config.browserTimeout
                  }, _this4.config.puppeteerLaunchOptions));
                };

                createPage = function () {
                  var _ref17 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee9(browser) {
                    var page;
                    return _regenerator2.default.wrap(function _callee9$(_context9) {
                      while (1) {
                        switch (_context9.prev = _context9.next) {
                          case 0:
                            _context9.next = 2;
                            return browser.newPage();

                          case 2:
                            page = _context9.sent;

                            page.on('error', function (msg) {
                              logger.warn(TAG, 'snapDialogsWithHashFromBrowser', '[dialog_version=%s][dialog_id=%s][dialog_url=%s#%s][error=%s]', ERROR_CONSTANTS.SNAP_DIALOGS_WITH_HASH_FROM_BROWSER_ERROR, lastDialog.version, lastDialog.id, lastDialog.url, lastDialog.hash, msg);
                            });

                            return _context9.abrupt('return', page);

                          case 5:
                          case 'end':
                            return _context9.stop();
                        }
                      }
                    }, _callee9, _this4);
                  }));

                  return function createPage(_x24) {
                    return _ref17.apply(this, arguments);
                  };
                }();

                _context12.prev = 5;
                _context12.next = 8;
                return createBrowser();

              case 8:
                browser = _context12.sent;
                _context12.next = 11;
                return createPage(browser);

              case 11:
                page = _context12.sent;
                _context12.next = 14;
                return Promise.map(dialogs, function () {
                  var _ref18 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee11(dialog) {
                    var sizes, response, error;
                    return _regenerator2.default.wrap(function _callee11$(_context11) {
                      while (1) {
                        switch (_context11.prev = _context11.next) {
                          case 0:
                            lastDialog = dialog;

                            _context11.prev = 1;
                            sizes = DialogHelper.getDialogSizes(options.sizes, dialog);
                            _context11.next = 5;
                            return page.goto(dialog.url, {
                              timeout: _this4.config.browserTimeout
                            });

                          case 5:
                            response = _context11.sent;

                            if (response) {
                              _context11.next = 9;
                              break;
                            }

                            _context11.next = 9;
                            return page.reload();

                          case 9:
                            _context11.next = 11;
                            return page.evaluate(injectCSSEvaluate);

                          case 11:
                            if (!dialog.waitForSelector) {
                              _context11.next = 14;
                              break;
                            }

                            _context11.next = 14;
                            return page.waitForSelector(dialog.waitForSelector, {
                              timeout: _this4.config.browserTimeout
                            });

                          case 14:
                            _context11.next = 16;
                            return Promise.each(sizes, function () {
                              var _ref19 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee10(size) {
                                var newSize;
                                return _regenerator2.default.wrap(function _callee10$(_context10) {
                                  while (1) {
                                    switch (_context10.prev = _context10.next) {
                                      case 0:
                                        _context10.next = 2;
                                        return page.setViewport(size);

                                      case 2:
                                        _context10.next = 4;
                                        return page.waitFor(dialog.timeout || 0);

                                      case 4:
                                        if (!dialog.resize) {
                                          _context10.next = 15;
                                          break;
                                        }

                                        _context10.next = 7;
                                        return page.evaluate(dialog.resize, size.width, size.height);

                                      case 7:
                                        newSize = _context10.sent;
                                        _context10.next = 10;
                                        return page.setViewport(newSize);

                                      case 10:
                                        _context10.next = 12;
                                        return page.evaluate(dialog.resize, newSize.width, newSize.height);

                                      case 12:
                                        newSize = _context10.sent;
                                        _context10.next = 15;
                                        return page.setViewport(newSize);

                                      case 15:
                                        _context10.next = 17;
                                        return puppeteerScreenshot(page, dialog, size, _this4.databaseHandler);

                                      case 17:
                                      case 'end':
                                        return _context10.stop();
                                    }
                                  }
                                }, _callee10, _this4);
                              }));

                              return function (_x26) {
                                return _ref19.apply(this, arguments);
                              };
                            }());

                          case 16:
                            if (onSnap) {
                              onSnap({ dialog: dialog, isOriginal: isOriginal, isCurrent: isCurrent });
                            }
                            _context11.next = 37;
                            break;

                          case 19:
                            _context11.prev = 19;
                            _context11.t0 = _context11['catch'](1);
                            error = ErrorHelper.createError(_context11.t0, '[dialog_version=%s][dialog_id=%s][dialog_url=%s#%s][error=%s]', ERROR_CONSTANTS.SNAP_DIALOG_FROM_BROWSER_ERROR, lastDialog.version, lastDialog.id, lastDialog.url, lastDialog.hash, _context11.t0.message);


                            dialog.error = {
                              code: error.code,
                              message: error.message
                            };

                            logger.error(TAG, 'snapDialogsFromBrowser', error.message, error.code, error.stack);

                            if (onSnap) {
                              onSnap({ dialog: dialog, err: error, isOriginal: isOriginal, isCurrent: isCurrent });
                            }

                            _context11.prev = 25;
                            _context11.next = 28;
                            return page.close();

                          case 28:
                            _context11.next = 30;
                            return createPage(browser);

                          case 30:
                            page = _context11.sent;
                            _context11.next = 37;
                            break;

                          case 33:
                            _context11.prev = 33;
                            _context11.t1 = _context11['catch'](25);

                            logger.error(TAG, 'snapDialogsFromBrowser', '[dialog_version=%s][dialog_id=%s][dialog_url=%s][error=could not reload page]', ERROR_CONSTANTS.SNAP_DIALOG_FROM_BROWSER_ERROR, lastDialog.version, lastDialog.id, lastDialog.url);
                            throw _context11.t1;

                          case 37:
                          case 'end':
                            return _context11.stop();
                        }
                      }
                    }, _callee11, _this4, [[1, 19], [25, 33]]);
                  }));

                  return function (_x25) {
                    return _ref18.apply(this, arguments);
                  };
                }(), { concurrency: 1 });

              case 14:
                _context12.next = 21;
                break;

              case 16:
                _context12.prev = 16;
                _context12.t0 = _context12['catch'](5);
                error = ErrorHelper.createError(_context12.t0, '[dialog_version=%s][dialog_id=%s][dialogs=%d][dialogs_with_error=%d][dialog_url=%s][error=%s]', ERROR_CONSTANTS.SNAP_DIALOGS_WITH_HASH_FROM_BROWSER_ERROR, lastDialog.version, lastDialog.id, dialogs.length, dialogs.filter(function (dialog) {
                  return !!dialog.error;
                }).length, lastDialog.url, _context12.t0.message);


                logger.error(TAG, 'snapDialogsFromBrowser', error.message, error.code, error.stack);

                dialogs.forEach(function (dialog) {
                  if (!dialog.error && dialog.screenshots.length === 0) {
                    dialog.error = {
                      code: error.code,
                      message: error.message
                    };

                    if (onSnap) {
                      onSnap({ dialog: dialog, err: error, isOriginal: isOriginal, isCurrent: isCurrent });
                    }
                  }
                });

              case 21:
                if (!page) {
                  _context12.next = 24;
                  break;
                }

                _context12.next = 24;
                return page.close();

              case 24:
                if (!browser) {
                  _context12.next = 27;
                  break;
                }

                _context12.next = 27;
                return browser.close();

              case 27:
                return _context12.abrupt('return', dialogs);

              case 28:
              case 'end':
                return _context12.stop();
            }
          }
        }, _callee12, this, [[5, 16]]);
      }));

      function snapDialogsFromBrowser(_x21, _x22) {
        return _ref15.apply(this, arguments);
      }

      return snapDialogsFromBrowser;
    }()
  }, {
    key: 'snapDialogsWithHashFromDatabase',
    value: function () {
      var _ref20 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee13(dialogs, dialogsScreenshotsDb, _ref21) {
        var _this5 = this;

        var onSnap = _ref21.onSnap,
            _ref21$isOriginal = _ref21.isOriginal,
            isOriginal = _ref21$isOriginal === undefined ? false : _ref21$isOriginal,
            _ref21$isCurrent = _ref21.isCurrent,
            isCurrent = _ref21$isCurrent === undefined ? false : _ref21$isCurrent;
        return _regenerator2.default.wrap(function _callee13$(_context13) {
          while (1) {
            switch (_context13.prev = _context13.next) {
              case 0:
                logger.log(TAG, 'snapDialogsWithHashFromDatabase', 'Snapping %d dialogs with hash from database', null, dialogs.length);

                _context13.prev = 1;
                _context13.next = 4;
                return Promise.all(dialogs.map(function (dialog, i) {
                  return _this5.snapDialogFromDatabase(dialog, dialogsScreenshotsDb[i], { onSnap: onSnap });
                }));

              case 4:
                return _context13.abrupt('return', dialogs);

              case 7:
                _context13.prev = 7;
                _context13.t0 = _context13['catch'](1);
                throw ErrorHelper.createError(_context13.t0, 'Could not snap dialogs with hash from database', ERROR_CONSTANTS.SNAP_DIALOGS_WITH_HASH_FROM_DB_ERROR);

              case 10:
              case 'end':
                return _context13.stop();
            }
          }
        }, _callee13, this, [[1, 7]]);
      }));

      function snapDialogsWithHashFromDatabase(_x27, _x28, _x29) {
        return _ref20.apply(this, arguments);
      }

      return snapDialogsWithHashFromDatabase;
    }()
  }, {
    key: 'snapDialogsWithHashFromBrowser',
    value: function () {
      var _ref22 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee18(options, dialogs) {
        var _this6 = this;

        var _ref23 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
            onSnap = _ref23.onSnap,
            _ref23$isOriginal = _ref23.isOriginal,
            isOriginal = _ref23$isOriginal === undefined ? false : _ref23$isOriginal,
            _ref23$isCurrent = _ref23.isCurrent,
            isCurrent = _ref23$isCurrent === undefined ? false : _ref23$isCurrent;

        var dialogUrl, dialogVersion, dialogSizes, dialogsCollections, createAndGoToPage;
        return _regenerator2.default.wrap(function _callee18$(_context18) {
          while (1) {
            switch (_context18.prev = _context18.next) {
              case 0:
                dialogUrl = dialogs[0].url;
                dialogVersion = dialogs[0].version;
                dialogSizes = DialogHelper.getDialogSizes(options.sizes, dialogs[0]);

                dialogs.forEach(function (dialog) {
                  dialog.screenshots = [];
                });

                dialogsCollections = this.config.snapDialogsWithHashFromBrowserCollections ? dialogs.reduce(function (rows, key, index) {
                  return (index % _this6.config.snapDialogsWithHashFromBrowserCollections === 0 ? rows.push([key]) : rows[rows.length - 1].push(key)) && rows;
                }, []) : [dialogs];

                createAndGoToPage = function () {
                  var _ref24 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee14(browser, dialog) {
                    var page;
                    return _regenerator2.default.wrap(function _callee14$(_context14) {
                      while (1) {
                        switch (_context14.prev = _context14.next) {
                          case 0:
                            _context14.next = 2;
                            return browser.newPage();

                          case 2:
                            page = _context14.sent;

                            page.on('error', function (msg) {
                              logger.warn(TAG, 'snapDialogsWithHashFromBrowser', '[dialog_version=%s][dialog_id=%s][dialog_url=%s#%s][error=%s]', ERROR_CONSTANTS.SNAP_DIALOGS_WITH_HASH_FROM_BROWSER_ERROR, dialogVersion, dialog.id, dialog.url, dialog.hash, msg);
                            });

                            _context14.next = 6;
                            return page.goto(dialog.url, {
                              timeout: _this6.config.browserTimeout
                            });

                          case 6:
                            _context14.next = 8;
                            return page.evaluate(injectCSSEvaluate);

                          case 8:
                            return _context14.abrupt('return', page);

                          case 9:
                          case 'end':
                            return _context14.stop();
                        }
                      }
                    }, _callee14, _this6);
                  }));

                  return function createAndGoToPage(_x33, _x34) {
                    return _ref24.apply(this, arguments);
                  };
                }();

                _context18.next = 8;
                return Promise.map(dialogsCollections, function () {
                  var _ref25 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee17(dialogsCollection) {
                    var lastDialog, browser, page, error;
                    return _regenerator2.default.wrap(function _callee17$(_context17) {
                      while (1) {
                        switch (_context17.prev = _context17.next) {
                          case 0:
                            lastDialog = dialogsCollection[0];
                            browser = void 0;
                            page = void 0;
                            _context17.prev = 3;

                            logger.info(TAG, 'snapDialogsWithHashFromBrowser', '[dialog_version=%s][dialogs=%d][dialog_url=%s][dialog_sizes=%s]', LOGGER_CONSTANTS.SNAP_DIALOG_WITH_HASH_FROM_BROWSER_LOGGER, dialogVersion, dialogsCollection.length, dialogUrl, dialogSizes.map(function (_ref26) {
                              var width = _ref26.width,
                                  height = _ref26.height;
                              return width + 'x' + height;
                            }).join(','));

                            _context17.next = 7;
                            return puppeteer.launch((0, _extends3.default)({
                              timeout: _this6.config.browserTimeout
                            }, _this6.config.puppeteerLaunchOptions));

                          case 7:
                            browser = _context17.sent;
                            _context17.next = 10;
                            return createAndGoToPage(browser, lastDialog);

                          case 10:
                            page = _context17.sent;
                            _context17.next = 13;
                            return Promise.each(dialogsCollection, function () {
                              var _ref27 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee16(dialog) {
                                var sizes, error;
                                return _regenerator2.default.wrap(function _callee16$(_context16) {
                                  while (1) {
                                    switch (_context16.prev = _context16.next) {
                                      case 0:
                                        _context16.prev = 0;

                                        lastDialog = dialog;

                                        logger.info(TAG, 'snapDialogsWithHashFromBrowser', '[dialog_version=%s][dialog_id=%s][dialog_url=%s#%s]', LOGGER_CONSTANTS.SNAP_DIALOGS_WITH_HASH_FROM_BROWSER_LOGGER, dialogVersion, dialog.id, dialogUrl, dialog.hash);

                                        sizes = DialogHelper.getDialogSizes(options.sizes, dialog);
                                        _context16.next = 6;
                                        return page.evaluate(redirectHashEvaluate, dialog.hash);

                                      case 6:
                                        if (!dialog.waitForSelector) {
                                          _context16.next = 9;
                                          break;
                                        }

                                        _context16.next = 9;
                                        return page.waitForSelector(dialog.waitForSelector, {
                                          timeout: _this6.config.browserTimeout
                                        });

                                      case 9:
                                        _context16.next = 11;
                                        return Promise.each(sizes, function () {
                                          var _ref28 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee15(size) {
                                            var newSize;
                                            return _regenerator2.default.wrap(function _callee15$(_context15) {
                                              while (1) {
                                                switch (_context15.prev = _context15.next) {
                                                  case 0:
                                                    _context15.next = 2;
                                                    return page.setViewport(size);

                                                  case 2:
                                                    _context15.next = 4;
                                                    return page.waitFor(dialog.timeout || 0);

                                                  case 4:
                                                    if (!dialog.resize) {
                                                      _context15.next = 15;
                                                      break;
                                                    }

                                                    _context15.next = 7;
                                                    return page.evaluate(dialog.resize, size.width, size.height);

                                                  case 7:
                                                    newSize = _context15.sent;
                                                    _context15.next = 10;
                                                    return page.setViewport(newSize);

                                                  case 10:
                                                    _context15.next = 12;
                                                    return page.evaluate(dialog.resize, newSize.width, newSize.height);

                                                  case 12:
                                                    newSize = _context15.sent;
                                                    _context15.next = 15;
                                                    return page.setViewport(newSize);

                                                  case 15:
                                                    _context15.next = 17;
                                                    return puppeteerScreenshot(page, dialog, size, _this6.databaseHandler);

                                                  case 17:
                                                  case 'end':
                                                    return _context15.stop();
                                                }
                                              }
                                            }, _callee15, _this6);
                                          }));

                                          return function (_x37) {
                                            return _ref28.apply(this, arguments);
                                          };
                                        }());

                                      case 11:
                                        if (onSnap) {
                                          onSnap({ dialog: dialog, isOriginal: isOriginal, isCurrent: isCurrent });
                                        }
                                        _context16.next = 32;
                                        break;

                                      case 14:
                                        _context16.prev = 14;
                                        _context16.t0 = _context16['catch'](0);
                                        error = ErrorHelper.createError(_context16.t0, '[dialog_version=%s][dialog_id=%s][dialog_url=%s#%s][error=%s]', ERROR_CONSTANTS.SNAP_DIALOG_WITH_HASH_FROM_BROWSER_ERROR, lastDialog.version, lastDialog.id, dialogUrl, lastDialog.hash, _context16.t0.message);


                                        dialog.error = {
                                          code: error.code,
                                          message: error.message
                                        };

                                        logger.error(TAG, 'snapDialogsWithHashFromBrowser', error.message, error.code, error.stack);

                                        if (onSnap) {
                                          onSnap({ dialog: dialog, err: error, isOriginal: isOriginal, isCurrent: isCurrent });
                                        }

                                        _context16.prev = 20;
                                        _context16.next = 23;
                                        return page.close();

                                      case 23:
                                        _context16.next = 25;
                                        return createAndGoToPage(browser, lastDialog);

                                      case 25:
                                        page = _context16.sent;
                                        _context16.next = 32;
                                        break;

                                      case 28:
                                        _context16.prev = 28;
                                        _context16.t1 = _context16['catch'](20);

                                        logger.error(TAG, 'snapDialogsWithHashFromBrowser', '[dialog_version=%s][dialog_id=%s][dialog_url=%s][error=could not reload page]', ERROR_CONSTANTS.SNAP_DIALOG_WITH_HASH_FROM_BROWSER_RELOAD_ERROR, lastDialog.version, lastDialog.id, lastDialog.url);
                                        throw _context16.t1;

                                      case 32:
                                      case 'end':
                                        return _context16.stop();
                                    }
                                  }
                                }, _callee16, _this6, [[0, 14], [20, 28]]);
                              }));

                              return function (_x36) {
                                return _ref27.apply(this, arguments);
                              };
                            }());

                          case 13:
                            _context17.next = 20;
                            break;

                          case 15:
                            _context17.prev = 15;
                            _context17.t0 = _context17['catch'](3);
                            error = ErrorHelper.createError(_context17.t0, '[dialog_version=%s][dialog_id=%s][dialogs=%d][dialogs_with_error=%d][dialog_url=%s][error=%s]', ERROR_CONSTANTS.SNAP_DIALOGS_WITH_HASH_FROM_BROWSER_ERROR, dialogVersion, lastDialog.id, dialogsCollection.length, dialogsCollection.filter(function (dialog) {
                              return !!dialog.error;
                            }).length, dialogUrl, _context17.t0.message);


                            logger.error(TAG, 'snapDialogsWithHashFromBrowser', error.message, error.code, error.stack);

                            dialogsCollection.forEach(function (dialog) {
                              if (!dialog.error && dialog.screenshots.length === 0) {
                                dialog.error = {
                                  code: error.code,
                                  message: error.message
                                };

                                if (onSnap) {
                                  onSnap({ dialog: dialog, err: error, isOriginal: isOriginal, isCurrent: isCurrent });
                                }
                              }
                            });

                          case 20:
                            if (!page) {
                              _context17.next = 23;
                              break;
                            }

                            _context17.next = 23;
                            return page.close();

                          case 23:
                            if (!browser) {
                              _context17.next = 26;
                              break;
                            }

                            _context17.next = 26;
                            return browser.close();

                          case 26:
                          case 'end':
                            return _context17.stop();
                        }
                      }
                    }, _callee17, _this6, [[3, 15]]);
                  }));

                  return function (_x35) {
                    return _ref25.apply(this, arguments);
                  };
                }(), { concurrency: this.config.snapDialogsWithHashFromBrowserConcurrency });

              case 8:
                return _context18.abrupt('return', dialogs);

              case 9:
              case 'end':
                return _context18.stop();
            }
          }
        }, _callee18, this);
      }));

      function snapDialogsWithHashFromBrowser(_x30, _x31) {
        return _ref22.apply(this, arguments);
      }

      return snapDialogsWithHashFromBrowser;
    }()
  }]);
  return SnapHandler;
}();

module.exports = SnapHandler;