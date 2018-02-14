'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/* eslint-disable no-unused-vars */

/**
 * @abstract
 */
var AbstractDatabaseLayer = function () {
    function AbstractDatabaseLayer() {
        _classCallCheck(this, AbstractDatabaseLayer);
    }

    _createClass(AbstractDatabaseLayer, [{
        key: 'initDB',

        /**
         * @abstract
         */
        value: function initDB() {
            throw new Error('Must be implemented');
        }

        /**
         * @abstract
         */

    }, {
        key: 'clearDB',
        value: function clearDB() {
            throw new Error('Must be implemented');
        }

        /**
         * @abstract
         * @return {Boolean}
         */

    }, {
        key: 'isInitialized',
        value: function isInitialized() {
            throw new Error('Must be implemented');
        }

        /**
         * @param {String} dialogScreenshotId
         * @return {Promise<DialogDiffer.Database.DialogScreenshot|null>}
         */

    }, {
        key: 'getDialogScreenshotFromId',
        value: function getDialogScreenshotFromId(dialogScreenshotId) {
            throw new Error('Must be implemented');
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

            throw new Error('Must be implemented');
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

            throw new Error('Must be implemented');
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

            throw new Error('Must be implemented');
        }

        /**
         * @param {String} dialogScreenshotId
         * @param {String} dialogScreenshotBase64
         * @return {Promise<DialogDiffer.Database.DialogScreenshot>}
         */

    }, {
        key: 'updateDialogScreenshot',
        value: function updateDialogScreenshot(_ref4) {
            var dialogScreenshotId = _ref4.dialogScreenshotId,
                dialogScreenshotBase64 = _ref4.dialogScreenshotBase64;

            throw new Error('Must be implemented');
        }

        /**
         * @param {String} dialogVersion
         * @returns {Promise<Boolean>}
         */

    }, {
        key: 'deleteDialogsScreenshots',
        value: function deleteDialogsScreenshots(dialogVersion) {
            throw new Error('Must be implemented');
        }

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

            throw new Error('Must be implemented');
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

            throw new Error('Must be implemented');
        }

        /**
         * @param {String} suiteId
         * @return {Promise<DialogDiffer.Database.SuiteResult|null>}
         */

    }, {
        key: 'getSuiteResult',
        value: function getSuiteResult(suiteId) {
            throw new Error('Must be implemented');
        }

        /**
         * @return {Promise<Array<DialogDiffer.Database.SuiteResult>>}
         */

    }, {
        key: 'getLastSuiteResults',
        value: function getLastSuiteResults() {
            throw new Error('Must be implemented');
        }

        /**
         * @param {DialogDiffer.Database.SuiteResult} suiteResult
         * @return {Promise<DialogDiffer.Database.SuiteResult>}
         */

    }, {
        key: 'newSuiteResult',
        value: function newSuiteResult(suiteResult) {
            throw new Error('Must be implemented');
        }

        /**
         * @param {String} suiteResultId
         * @param {DialogDiffer.Database.SuiteResult} suiteResult
         * @return {Promise<DialogDiffer.Database.SuiteResult>}
         */

    }, {
        key: 'updateSuiteResult',
        value: function updateSuiteResult(suiteResultId, suiteResult) {
            throw new Error('Must be implemented');
        }

        /**
         * @param {String} suiteId
         * @returns {Promise<Boolean>}
         */

    }, {
        key: 'deleteSuiteResult',
        value: function deleteSuiteResult(suiteId) {
            throw new Error('Must be implemented');
        }
    }]);

    return AbstractDatabaseLayer;
}();

module.exports = AbstractDatabaseLayer;