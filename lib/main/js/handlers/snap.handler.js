'use strict';

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

/**
 * @param {Page} page
 * @param {DialogDiffer.Dialog} dialog
 * @param {{width: Number, height: Number}} size
 * @param {DatabaseHandler} databaseHandler
 * @return {Promise<DialogDiffer.Database.DialogScreenshot>}
 */
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


                        // create dialog screenshot
                        dialogScreenshot = DialogHelper.createDialogScreenshot(size.width, size.height, 'data:image/png;base64,' + base64ArrayBuffer.encode(screenshot));

                        // push dialog screenshot to dialog

                        dialog.screenshots.push(dialogScreenshot);

                        // save dialog screenshot to database
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

/**
 * @class
 */


function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var TAG = 'Snap';

var puppeteer = require('puppeteer');
var Promise = require('bluebird');
var base64ArrayBuffer = require('base64-arraybuffer');

var logger = require('../logger');

var config = require('../../../../config.json');

var LOGGER_CONSTANTS = require('../constants/logger-constants');
var ERROR_CONSTANTS = require('../constants/error-constants');

var DialogHelper = require('../helpers/dialog.helper');
var ErrorHelper = require('../helpers/error.helper');

/**
 * @param {String} selector
 * @return {{y: Number, x: Number, width: Number, height: Number}|null}
 */
function getElementClipEvaluate(selector) {
    /*eslint-disable */
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
    /*eslint-enable */
}

/**
 * Stop CSS animations
 */
function stopCSSAnimationsEvaluate() {
    /*eslint-disable */
    var css = '* { animation: none!important; -webkit-animation: none!important }',
        head = document.head || document.getElementsByTagName('head')[0],
        style = document.createElement('style');

    style.type = 'text/css';
    if (style.styleSheet) {
        style.styleSheet.cssText = css;
    } else {
        style.appendChild(document.createTextNode(css));
    }

    head.appendChild(style);
    /*eslint-enable */
}

/**
 * Redirects location hash
 * @param {String} hash
 */
function redirectHashEvaluate(hash) {
    /*eslint-disable */
    document.location.hash = hash;
    /*eslint-enable */
}
var SnapHandler = function () {
    /**
     * @param {DatabaseHandler} databaseHandler
     */
    function SnapHandler(databaseHandler) {
        (0, _classCallCheck3.default)(this, SnapHandler);

        this.databaseHandler = databaseHandler;
    }

    /**
     * @param {DialogDiffer.Suite} suite
     * @param {DialogDiffer.OnSnapCallback} [onSnap]
     * @return {Promise<DialogDiffer.Suite>}
     */


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
                                return this.snapSuiteDialogs(suite.options, suite.original, { onSnap: onSnap });

                            case 4:
                                _context3.next = 6;
                                return this.snapSuiteDialogs(suite.options, suite.current, { onSnap: onSnap });

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

            function snapSuite(_x5) {
                return _ref3.apply(this, arguments);
            }

            return snapSuite;
        }()

        /**
         * @param {DialogDiffer.Options} options
         * @param {Array<DialogDiffer.Dialog>} dialogs
         * @param {DialogDiffer.OnSnapCallback} [onSnap]
         * @return {Promise<Array<DialogDiffer.Dialog>>}
         */

    }, {
        key: 'snapSuiteDialogs',
        value: function () {
            var _ref5 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4(options, dialogs) {
                var _this2 = this;

                var _ref6 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
                    onSnap = _ref6.onSnap;

                var dialogsScreenshotsDb, dialogsCollection, result, snappedDialogs;
                return _regenerator2.default.wrap(function _callee4$(_context4) {
                    while (1) {
                        switch (_context4.prev = _context4.next) {
                            case 0:
                                // prepare dialogs screenshots
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


                                // collect snapped and non snapped dialogs from dialogs screenshots from database
                                dialogsCollection = DialogHelper.collectSnappedDialogs(options, dialogs, dialogsScreenshotsDb);


                                logger.log(TAG, 'snapSuiteDialogs', 'Snapping \'%s\' dialogs. Non snapped collections \'%s\'. Snapped collections \'%s\'.', null, dialogs.length, dialogsCollection.nonSnappedCollection.length, dialogsCollection.snappedCollection.length);

                                // snap dialogs from database or from browser
                                _context4.next = 9;
                                return Promise.all([].concat(dialogsCollection.snappedCollection.map(function (par) {
                                    // snapped collection
                                    if (Array.isArray(par)) {
                                        return _this2.snapDialogsWithHashFromDatabase(par.map(function (snappedCollectedDialog) {
                                            return snappedCollectedDialog.dialog;
                                        }), par.map(function (snappedCollectedDialog) {
                                            return snappedCollectedDialog.screenshots;
                                        }), { onSnap: onSnap });
                                    } else {
                                        return _this2.snapDialogFromDatabase(par.dialog, par.screenshots);
                                    }
                                }), dialogsCollection.nonSnappedCollection.map(function (par) {
                                    // non snapped collection
                                    if (Array.isArray(par)) {
                                        return _this2.snapDialogsWithHashFromBrowser(options, par.map(function (snappedCollectedDialog) {
                                            return snappedCollectedDialog.dialog;
                                        }), { onSnap: onSnap });
                                    } else {
                                        return _this2.snapDialogFromBrowser(options, par.dialog, { onSnap: onSnap });
                                    }
                                })));

                            case 9:
                                result = _context4.sent;


                                // reduce result collections to one dialogs array
                                snappedDialogs = result.reduce(function (acc, cur) {
                                    return acc = acc.concat(cur), acc;
                                }, []);


                                logger.log(TAG, 'snapSuiteDialogs', 'Snapped dialogs \'%s\'. Collections \'%s\'.', null, snappedDialogs.length, result.length);

                                return _context4.abrupt('return', snappedDialogs);

                            case 15:
                                _context4.prev = 15;
                                _context4.t0 = _context4['catch'](1);
                                throw ErrorHelper.createError(_context4.t0, 'Could not snap Suite dialogs', ERROR_CONSTANTS.SNAP_SUITE_DIALOGS_ERROR);

                            case 18:
                            case 'end':
                                return _context4.stop();
                        }
                    }
                }, _callee4, this, [[1, 15]]);
            }));

            function snapSuiteDialogs(_x7, _x8) {
                return _ref5.apply(this, arguments);
            }

            return snapSuiteDialogs;
        }()

        /**
         * @param {DialogDiffer.Options} options
         * @param {DialogDiffer.Dialog} dialog
         * @param {DialogDiffer.OnSnapCallback} [onSnap]
         * @return {Promise<DialogDiffer.Dialog>}
         */

    }, {
        key: 'snapDialog',
        value: function () {
            var _ref7 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee5(options, dialog) {
                var _ref8 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
                    onSnap = _ref8.onSnap;

                var dialogScreenshotsDb;
                return _regenerator2.default.wrap(function _callee5$(_context5) {
                    while (1) {
                        switch (_context5.prev = _context5.next) {
                            case 0:
                                // prepare dialog screenshots
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
                                return this.snapDialogFromDatabase(dialog, dialogScreenshotsDb);

                            case 8:
                                _context5.next = 12;
                                break;

                            case 10:
                                _context5.next = 12;
                                return this.snapDialogFromBrowser(options, dialog);

                            case 12:

                                if (onSnap) {
                                    onSnap(dialog);
                                }

                                return _context5.abrupt('return', dialog);

                            case 16:
                                _context5.prev = 16;
                                _context5.t0 = _context5['catch'](1);
                                throw _context5.t0;

                            case 19:
                            case 'end':
                                return _context5.stop();
                        }
                    }
                }, _callee5, this, [[1, 16]]);
            }));

            function snapDialog(_x10, _x11) {
                return _ref7.apply(this, arguments);
            }

            return snapDialog;
        }()

        /**
         * @param {DialogDiffer.Dialog} dialog
         * @param {Array<DialogDiffer.Database.DialogScreenshot>} dialogScreenshotsDb
         * @param {DialogDiffer.OnSnapCallback} [onSnap]
         * @return {Promise<DialogDiffer.Dialog>}
         * @private
         */

    }, {
        key: 'snapDialogFromDatabase',
        value: function () {
            var _ref9 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee6(dialog, dialogScreenshotsDb) {
                var _ref10 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
                    onSnap = _ref10.onSnap;

                return _regenerator2.default.wrap(function _callee6$(_context6) {
                    while (1) {
                        switch (_context6.prev = _context6.next) {
                            case 0:
                                logger.log(TAG, 'snapDialogFromDatabase', 'Snapping dialog \'%s\' from database', null, dialog.id);

                                // append dialog screenshots from database
                                dialogScreenshotsDb.forEach(function (dialogScreenshotDb) {
                                    dialog.screenshots.push(DialogHelper.createDialogScreenshot(dialogScreenshotDb.width, dialogScreenshotDb.height, dialogScreenshotDb.base64));
                                });

                                logger.info(TAG, 'snapDialogFromDatabase', 'Dialog \'%s\' using \'%d\' screenshots from database', LOGGER_CONSTANTS.SCREENSHOTS_FROM_DATABASE_LOGGER, DialogHelper.createUniqueDialogId(dialog), dialogScreenshotsDb.length);

                                if (onSnap) {
                                    onSnap(dialog);
                                }

                                return _context6.abrupt('return', dialog);

                            case 5:
                            case 'end':
                                return _context6.stop();
                        }
                    }
                }, _callee6, this);
            }));

            function snapDialogFromDatabase(_x13, _x14) {
                return _ref9.apply(this, arguments);
            }

            return snapDialogFromDatabase;
        }()

        /**
         * @param {DialogDiffer.Options} options
         * @param {DialogDiffer.Dialog} dialog
         * @param {DialogDiffer.OnSnapCallback} [onSnap]
         * @return {Promise<DialogDiffer.Dialog>}
         * @private
         */

    }, {
        key: 'snapDialogFromBrowser',
        value: function () {
            var _ref11 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee8(options, dialog) {
                var _this3 = this;

                var _ref12 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
                    onSnap = _ref12.onSnap;

                var browser, page, sizes, error;
                return _regenerator2.default.wrap(function _callee8$(_context8) {
                    while (1) {
                        switch (_context8.prev = _context8.next) {
                            case 0:
                                browser = void 0;
                                page = void 0;
                                _context8.prev = 2;

                                logger.log(TAG, 'snapDialogFromBrowser', 'Snapping dialog \'%s\' from browser', null, DialogHelper.createUniqueDialogId(dialog));

                                // get sizes
                                sizes = DialogHelper.getDialogSizes(options.sizes, dialog);

                                // create browser

                                _context8.next = 7;
                                return puppeteer.launch({
                                    timeout: config.browserTimeout,
                                    args: ['--no-sandbox', '--disable-setuid-sandbox']
                                });

                            case 7:
                                browser = _context8.sent;
                                _context8.next = 10;
                                return browser.newPage();

                            case 10:
                                page = _context8.sent;


                                page.on('error', function (msg) {
                                    logger.warn(TAG, 'snapDialogFromBrowser', 'Error in dialog. Message: \'%s\'. Version: \'%s\'. Id: \'%s\'. Url: \'%s\'.', ERROR_CONSTANTS.SNAP_DIALOG_FROM_BROWSER_ERROR, msg, dialog.version, dialog.id, dialog.url);
                                });

                                // go to dialog url
                                _context8.next = 14;
                                return page.goto(dialog.url, {
                                    timeout: config.browserTimeout
                                });

                            case 14:
                                _context8.next = 16;
                                return page.evaluate(stopCSSAnimationsEvaluate);

                            case 16:
                                if (!dialog.waitForSelector) {
                                    _context8.next = 19;
                                    break;
                                }

                                _context8.next = 19;
                                return page.waitForSelector(dialog.waitForSelector, {
                                    timeout: config.browserTimeout
                                });

                            case 19:
                                _context8.next = 21;
                                return Promise.each(sizes, function () {
                                    var _ref13 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee7(size) {
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

                                    return function (_x19) {
                                        return _ref13.apply(this, arguments);
                                    };
                                }());

                            case 21:

                                // callback
                                if (onSnap) {
                                    onSnap(dialog);
                                }
                                _context8.next = 29;
                                break;

                            case 24:
                                _context8.prev = 24;
                                _context8.t0 = _context8['catch'](2);
                                error = ErrorHelper.createError(_context8.t0, 'Could not snap dialog from Browser. Version: \'%s\'. Id: \'%s\'. Url: \'%s%s\'.', ERROR_CONSTANTS.SNAP_DIALOG_FROM_BROWSER_ERROR, dialog.version, dialog.id, dialog.url, dialog.hash && '#' + dialog.hash || '', { options: options });


                                dialog.error = {
                                    code: error.code,
                                    message: error.message,
                                    args: error.args,
                                    stack: error.stack
                                };

                                logger.error.apply(logger, [TAG, 'snapDialogFromBrowser', error.message, error.code].concat((0, _toConsumableArray3.default)(error.args), [error.stack]));

                            case 29:
                                if (!page) {
                                    _context8.next = 32;
                                    break;
                                }

                                _context8.next = 32;
                                return page.close();

                            case 32:
                                if (!browser) {
                                    _context8.next = 35;
                                    break;
                                }

                                _context8.next = 35;
                                return browser.close();

                            case 35:
                                return _context8.abrupt('return', dialog);

                            case 36:
                            case 'end':
                                return _context8.stop();
                        }
                    }
                }, _callee8, this, [[2, 24]]);
            }));

            function snapDialogFromBrowser(_x16, _x17) {
                return _ref11.apply(this, arguments);
            }

            return snapDialogFromBrowser;
        }()

        /**
         * @param {Array<DialogDiffer.Dialog>} dialogs
         * @param {Array<Array<DialogDiffer.Database.DialogScreenshot>>} dialogsScreenshotsDb
         * @param {DialogDiffer.OnSnapCallback} [onSnap]
         * @returns {Promise<Array<DialogDiffer.Dialog>>}
         * @private
         */

    }, {
        key: 'snapDialogsWithHashFromDatabase',
        value: function () {
            var _ref14 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee9(dialogs, dialogsScreenshotsDb, _ref15) {
                var _this4 = this;

                var onSnap = _ref15.onSnap;
                return _regenerator2.default.wrap(function _callee9$(_context9) {
                    while (1) {
                        switch (_context9.prev = _context9.next) {
                            case 0:
                                logger.log(TAG, 'snapDialogsWithHashFromDatabase', 'Snapping %d dialogs with hash from database', null, dialogs.length);

                                _context9.prev = 1;
                                _context9.next = 4;
                                return Promise.all(dialogs.map(function (dialog, i) {
                                    return _this4.snapDialogFromDatabase(dialog, dialogsScreenshotsDb[i], { onSnap: onSnap });
                                }));

                            case 4:
                                return _context9.abrupt('return', dialogs);

                            case 7:
                                _context9.prev = 7;
                                _context9.t0 = _context9['catch'](1);
                                throw ErrorHelper.createError(_context9.t0, 'Could not snap dialogs with hash from database', ERROR_CONSTANTS.SNAP_DIALOGS_WITH_HASH_FROM_DB_ERROR);

                            case 10:
                            case 'end':
                                return _context9.stop();
                        }
                    }
                }, _callee9, this, [[1, 7]]);
            }));

            function snapDialogsWithHashFromDatabase(_x20, _x21, _x22) {
                return _ref14.apply(this, arguments);
            }

            return snapDialogsWithHashFromDatabase;
        }()

        /**
         * @param {DialogDiffer.Options} options
         * @param {Array<DialogDiffer.Dialog>} dialogs
         * @param {DialogDiffer.OnSnapCallback} [onSnap]
         * @returns {Promise<Array<DialogDiffer.Dialog>>}
         * @private
         */

    }, {
        key: 'snapDialogsWithHashFromBrowser',
        value: function () {
            var _ref16 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee12(options, dialogs) {
                var _this5 = this;

                var _ref17 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
                    onSnap = _ref17.onSnap;

                var dialogUrl, dialogVersion, dialogId, dialogHashList, lastDialog, browser, error;
                return _regenerator2.default.wrap(function _callee12$(_context12) {
                    while (1) {
                        switch (_context12.prev = _context12.next) {
                            case 0:
                                dialogUrl = dialogs[0].url;
                                dialogVersion = dialogs[0].version;
                                dialogId = dialogs[0].id;
                                dialogHashList = dialogs.map(function (dialog) {
                                    return dialog.hash;
                                });
                                lastDialog = dialogs[0].id;
                                browser = void 0;
                                _context12.prev = 6;

                                logger.log(TAG, 'snapDialogsWithHashFromBrowser', 'Snapping %d dialogs with hash from browser', null, dialogs.length, dialogs.map(function (dialog) {
                                    return dialog.id;
                                }));

                                // launch browser
                                _context12.next = 10;
                                return puppeteer.launch({
                                    timeout: config.browserTimeout,
                                    args: ['--no-sandbox', '--disable-setuid-sandbox']
                                });

                            case 10:
                                browser = _context12.sent;
                                _context12.next = 13;
                                return Promise.map(dialogs,
                                /** @type {DialogDiffer.Dialog} dialog */
                                function () {
                                    var _ref18 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee11(dialog) {
                                        var sizes, page, error;
                                        return _regenerator2.default.wrap(function _callee11$(_context11) {
                                            while (1) {
                                                switch (_context11.prev = _context11.next) {
                                                    case 0:
                                                        dialog.screenshots = [];
                                                        lastDialog = dialog.id;

                                                        logger.log(TAG, 'snapDialogsWithHashFromBrowser', 'Dialog \'%s\',  \'%s\'', null, DialogHelper.createUniqueDialogId(dialog), dialog.hash);

                                                        // get sizes
                                                        sizes = DialogHelper.getDialogSizes(options.sizes, dialog);
                                                        page = void 0;
                                                        _context11.prev = 5;
                                                        _context11.next = 8;
                                                        return browser.newPage();

                                                    case 8:
                                                        page = _context11.sent;


                                                        // listen on error
                                                        page.on('error', function (msg) {
                                                            logger.warn(TAG, 'snapDialogsWithHashFromBrowser', 'Error in dialogs with hash. Message: \'%s\', Url: \'%s\'. Version: \'%s\'. First id: \'%s\'. Hash list: \'%s\'.', ERROR_CONSTANTS.SNAP_DIALOGS_WITH_HASH_FROM_BROWSER_ERROR, msg, dialogUrl, dialogVersion, dialogId, dialogHashList.join(', '));
                                                        });

                                                        // go to dialog url
                                                        _context11.next = 12;
                                                        return page.goto(dialogUrl, {
                                                            timeout: config.browserTimeout
                                                        });

                                                    case 12:
                                                        _context11.next = 14;
                                                        return page.evaluate(stopCSSAnimationsEvaluate);

                                                    case 14:
                                                        _context11.next = 16;
                                                        return page.evaluate(redirectHashEvaluate, dialog.hash);

                                                    case 16:
                                                        if (!dialog.waitForSelector) {
                                                            _context11.next = 19;
                                                            break;
                                                        }

                                                        _context11.next = 19;
                                                        return page.waitForSelector(dialog.waitForSelector, {
                                                            timeout: config.browserTimeout
                                                        });

                                                    case 19:
                                                        _context11.next = 21;
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
                                                                                return puppeteerScreenshot(page, dialog, size, _this5.databaseHandler);

                                                                            case 17:
                                                                            case 'end':
                                                                                return _context10.stop();
                                                                        }
                                                                    }
                                                                }, _callee10, _this5);
                                                            }));

                                                            return function (_x27) {
                                                                return _ref19.apply(this, arguments);
                                                            };
                                                        }());

                                                    case 21:
                                                        _context11.next = 23;
                                                        return page.close();

                                                    case 23:

                                                        // callback
                                                        if (onSnap) {
                                                            onSnap(dialog);
                                                        }
                                                        _context11.next = 32;
                                                        break;

                                                    case 26:
                                                        _context11.prev = 26;
                                                        _context11.t0 = _context11['catch'](5);

                                                        if (page) {
                                                            page.close();
                                                        }

                                                        error = ErrorHelper.createError(_context11.t0, 'Could not snap dialog with hash from Browser. Url: \'%s%s\'. Version: \'%s\'. Dialog id: \'%s\'.', ERROR_CONSTANTS.SNAP_DIALOG_WITH_HASH_FROM_BROWSER_ERROR, dialogUrl, dialog.hash ? '#' + dialog.hash : '', dialogVersion, dialogId);


                                                        dialog.error = {
                                                            code: error.code,
                                                            message: error.message,
                                                            args: error.args,
                                                            stack: error.stack
                                                        };

                                                        logger.error.apply(logger, [TAG, 'snapDialogsWithHashFromBrowser', error.message, error.code].concat((0, _toConsumableArray3.default)(error.args), [error.stack]));

                                                    case 32:
                                                    case 'end':
                                                        return _context11.stop();
                                                }
                                            }
                                        }, _callee11, _this5, [[5, 26]]);
                                    }));

                                    return function (_x26) {
                                        return _ref18.apply(this, arguments);
                                    };
                                }(), { concurrency: 10 });

                            case 13:
                                _context12.next = 20;
                                break;

                            case 15:
                                _context12.prev = 15;
                                _context12.t0 = _context12['catch'](6);
                                error = ErrorHelper.createError(_context12.t0, 'Could not snap dialogs with hash from Browser. Url: \'%s\'. Version: \'%s\'. First id: \'%s\'. Last dialog id: \'%s\'. Hash list: \'%s\'.', ERROR_CONSTANTS.SNAP_DIALOGS_WITH_HASH_FROM_BROWSER_ERROR, dialogUrl, dialogVersion, dialogId, lastDialog, dialogHashList.join(', '));


                                dialogs.forEach(function (dialog) {
                                    dialog.error = {
                                        code: error.code,
                                        message: error.message,
                                        args: error.args,
                                        stack: error.stack
                                    };
                                });

                                logger.error.apply(logger, [TAG, 'snapDialogsWithHashFromBrowser', error.message, error.code].concat((0, _toConsumableArray3.default)(error.args), [error.stack]));

                            case 20:
                                if (!browser) {
                                    _context12.next = 23;
                                    break;
                                }

                                _context12.next = 23;
                                return browser.close();

                            case 23:
                                return _context12.abrupt('return', dialogs);

                            case 24:
                            case 'end':
                                return _context12.stop();
                        }
                    }
                }, _callee12, this, [[6, 15]]);
            }));

            function snapDialogsWithHashFromBrowser(_x23, _x24) {
                return _ref16.apply(this, arguments);
            }

            return snapDialogsWithHashFromBrowser;
        }()
    }]);
    return SnapHandler;
}();

module.exports = SnapHandler;