'use strict';

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

var mongoose = require('mongoose');
var AbstractDatabaseLayer = require('./abstract-database.layer');

var DIALOG_SCREENSHOTS_DB = 'dialog_screenshots';
var DIALOG_DIFFS_RESULT_DB = 'dialog_diffs_result';
var SUITE_RESULT_DB = 'suite_result';

var DialogScreenshotModel = mongoose.model(DIALOG_SCREENSHOTS_DB, new mongoose.Schema({
  dialogId: String,
  dialogVersion: String,
  base64: String,
  height: Number,
  width: Number
}, {
  timestamps: true
}));

var DialogDiffsResultModel = mongoose.model(DIALOG_DIFFS_RESULT_DB, new mongoose.Schema({
  dialogId: String,
  originalVersion: String,
  currentVersion: String,
  original: {
    version: String,
    id: String,
    url: String,
    hash: String,
    options: Object
  },
  current: {
    version: String,
    id: String,
    url: String,
    hash: String,
    options: Object
  },
  result: String,
  differ: [{
    index: Number,
    result: String,
    base64: String
  }]
}, {
  timestamps: true
}));

var SuiteResultModel = mongoose.model(SUITE_RESULT_DB, new mongoose.Schema({
  status: String,
  errorCode: String,
  timestamp: Number,
  options: Object,
  stats: Object,
  result: [{
    dialogId: String,
    originalVersion: String,
    currentVersion: String,
    result: String,
    error: Object
  }]
}, {
  timestamps: true
}));

var db = null;

var MongoDbDatabaseLayer = function (_AbstractDatabaseLaye) {
  (0, _inherits3.default)(MongoDbDatabaseLayer, _AbstractDatabaseLaye);

  function MongoDbDatabaseLayer() {
    (0, _classCallCheck3.default)(this, MongoDbDatabaseLayer);
    return (0, _possibleConstructorReturn3.default)(this, (MongoDbDatabaseLayer.__proto__ || (0, _getPrototypeOf2.default)(MongoDbDatabaseLayer)).apply(this, arguments));
  }

  (0, _createClass3.default)(MongoDbDatabaseLayer, [{
    key: 'initDB',
    value: function initDB(uri) {
      return mongoose.connect(uri).then(function () {
        db = mongoose.connection;
        return _promise2.default.resolve();
      });
    }
  }, {
    key: 'clearDB',
    value: function clearDB() {
      if (db) {
        return _promise2.default.all([DialogScreenshotModel.remove({}), DialogDiffsResultModel.remove({}), SuiteResultModel.remove({})]);
      } else {
        return _promise2.default.resolve();
      }
    }
  }, {
    key: 'isInitialized',
    value: function isInitialized() {
      return !!db;
    }

    /*
     * DIALOG SCREENSHOT
     */

    /**
     * @param {String} dialogId
     * @param {String} dialogVersion
     * @param {Number} dialogScreenshotHeight
     * @param {Number} dialogScreenshotWidth
     * @return {Promise<DialogDiffer.Database.DialogScreenshot>}
     */

  }, {
    key: 'getDialogScreenshot',
    value: function getDialogScreenshot(_ref) {
      var dialogId = _ref.dialogId,
          dialogVersion = _ref.dialogVersion,
          dialogScreenshotHeight = _ref.dialogScreenshotHeight,
          dialogScreenshotWidth = _ref.dialogScreenshotWidth;

      return DialogScreenshotModel.findOne({
        dialogId: dialogId,
        dialogVersion: dialogVersion,
        height: dialogScreenshotHeight,
        width: dialogScreenshotWidth
      }).exec();
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

      return DialogScreenshotModel.find({
        dialogId: dialogId,
        dialogVersion: dialogVersion
      }).sort({
        width: 1
      }).exec();
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

      return DialogScreenshotModel.create({
        dialogId: dialogId,
        dialogVersion: dialogVersion,
        height: dialogScreenshotHeight,
        width: dialogScreenshotWidth,
        base64: dialogScreenshotBase64
      });
    }
  }, {
    key: 'updateDialogScreenshot',
    value: function updateDialogScreenshot(_ref4) {
      var dialogScreenshotId = _ref4.dialogScreenshotId,
          dialogScreenshotBase64 = _ref4.dialogScreenshotBase64;

      return DialogScreenshotModel.findByIdAndUpdate(dialogScreenshotId, {
        base64: dialogScreenshotBase64
      });
    }
  }, {
    key: 'deleteDialogsScreenshots',
    value: function deleteDialogsScreenshots(dialogVersion) {
      return DialogScreenshotModel.remove({
        dialogVersion: dialogVersion
      });
    }

    /*
     * SUITE RESULT
     */

  }, {
    key: 'newSuiteResult',
    value: function newSuiteResult(suiteResult) {
      return SuiteResultModel.create(suiteResult);
    }
  }, {
    key: 'updateSuiteResult',
    value: function updateSuiteResult(suiteResultId, suiteResult) {
      return SuiteResultModel.findByIdAndUpdate(suiteResultId, suiteResult);
    }
  }, {
    key: 'getDialogsResult',
    value: function getDialogsResult(_ref5) {
      var options = _ref5.options,
          dialogId = _ref5.dialogId,
          originalVersion = _ref5.originalVersion,
          currentVersion = _ref5.currentVersion;

      return SuiteResultModel.find({
        dialogId: dialogId,
        originalVersion: originalVersion,
        currentVersion: currentVersion,
        options: options
      });
    }
  }, {
    key: 'getLastSuiteResults',
    value: function getLastSuiteResults() {
      return SuiteResultModel.find().sort({ createdAt: -1 });
    }
  }, {
    key: 'getSuiteResult',
    value: function getSuiteResult(suiteId) {
      return SuiteResultModel.findById(suiteId);
    }

    /*
     * DIALOGS RESULT
     */

  }, {
    key: 'newDialogsResult',
    value: function newDialogsResult(dialogsResult) {
      return DialogDiffsResultModel.create(dialogsResult);
    }
  }, {
    key: 'getDialogScreenshotFromId',
    value: function getDialogScreenshotFromId(dialogScreenshotId) {
      return DialogDiffsResultModel.findbyId(dialogScreenshotId);
    }
  }, {
    key: 'deleteSuiteResult',
    value: function deleteSuiteResult(suiteId) {
      return DialogDiffsResultModel.remove({ _id: suiteId });
    }
  }]);
  return MongoDbDatabaseLayer;
}(AbstractDatabaseLayer);

module.exports = MongoDbDatabaseLayer;