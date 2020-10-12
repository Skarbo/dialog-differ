'use strict';

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _from = require('babel-runtime/core-js/array/from');

var _from2 = _interopRequireDefault(_from);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var SuiteHelper = require('./suite.helper');

/**
 * @param width
 * @param height
 * @param base64
 * @return {DialogDiffer.DialogScreenshot}
 */
module.exports.createDialogScreenshot = function (width, height, base64) {
  return {
    width: width,
    height: height,
    base64: base64
  };
};

/**
 * @param {DialogDiffer.Dialog} dialog
 * @return {String}
 */
module.exports.createUniqueDialogId = function (dialog) {
  return dialog.version + '/' + dialog.id;
};

/**
 * @param {DialogDiffer.Dialog} dialog
 * @param {DialogDiffer.Database.DialogScreenshot|DialogDiffer.DialogScreenshot} dialogScreenshot
 * @return {String}
 */
module.exports.createUniqueDialogScreenshotId = function (dialog, dialogScreenshot) {
  return dialog.version + '/' + dialog.id + '/' + dialogScreenshot.width + '/' + dialogScreenshot.height;
};

/**
 * @param {DialogDiffer.Options} options
 * @param {DialogDiffer.Dialog} dialogOriginal
 * @param {DialogDiffer.Dialog} dialogCurrent
 * @return {String}
 */
module.exports.createUniqueDialogResultId = function (options, dialogOriginal, dialogCurrent) {
  return [module.exports.createUniqueDialogId(dialogOriginal), module.exports.createUniqueDialogId(dialogCurrent), SuiteHelper.createUniqueOptionsId(options)].join('-');
};

/**
 * @param {Array<{width: Number, height: Number}>} sizes
 * @param {DialogDiffer.Dialog} dialog
 * @param {Array<DialogDiffer.Database.DialogScreenshot>} dialogScreenshotsDb Sorted by width
 */
module.exports.isDialogSnapped = function (sizes, dialog, dialogScreenshotsDb) {
  if (!dialogScreenshotsDb) {
    return false;
  }

  if (dialogScreenshotsDb.length === 0) {
    return false;
  }

  sizes = (0, _from2.default)(sizes).sort(function (size) {
    return size.width;
  });
  var sortedDialogScreenshotsDb = (0, _from2.default)(dialogScreenshotsDb).sort(function (dialogScreenshotDb) {
    return dialogScreenshotDb.width;
  });

  if (sizes.length === sortedDialogScreenshotsDb.length) {
    for (var i = 0; i < sortedDialogScreenshotsDb.length; i++) {
      if (sizes[i].width !== sortedDialogScreenshotsDb[i].width || sizes[i].height !== sortedDialogScreenshotsDb[i].height) {
        return false;
      }
    }

    return true;
  }
  return false;
};

/**
 * @typedef {Object} DialogDiffer.SnappedCollectedDialog
 * @property {DialogDiffer.Dialog} dialog
 * @property {Array<DialogDiffer.Database.DialogScreenshot>} [screenshots]
 * @memberOf DialogDiffer
 */

/**
 * @param {DialogDiffer.Options} options
 * @param {Array<DialogDiffer.Dialog>} dialogs
 * @param {Array<Array<DialogDiffer.Database.DialogScreenshot>>} dialogsScreenshotsDb
 * @return {{snappedCollection: {dialogs: Array<DialogDiffer.SnappedCollectedDialog>, dialogsWithHash: Array<Array<DialogDiffer.SnappedCollectedDialog>>}, nonSnappedCollection: {dialogs: Array<DialogDiffer.SnappedCollectedDialog>, dialogsWithHash: Array<Array<DialogDiffer.SnappedCollectedDialog>>}}}
 */
module.exports.collectSnappedDialogs = function (options, dialogs, dialogsScreenshotsDb) {
  var snappedCollection = {
    dialogs: [],
    dialogsWithHash: {}
  };
  var nonSnappedCollection = {
    dialogs: [],
    dialogsWithHash: {}
  };

  dialogs.forEach(function (dialog, i) {
    // snapped
    if (!options.isForceSnap && module.exports.isDialogSnapped(module.exports.getDialogSizes(options.sizes, dialog), dialog, dialogsScreenshotsDb[i])) {
      if (dialog.hash) {
        if (!snappedCollection.dialogsWithHash[dialog.url]) {
          snappedCollection.dialogsWithHash[dialog.url] = [];
        }

        snappedCollection.dialogsWithHash[dialog.url].push({ dialog: dialog, screenshots: dialogsScreenshotsDb[i] });
      } else {
        snappedCollection.dialogs.push({ dialog: dialog, screenshots: dialogsScreenshotsDb[i] });
      }
    }
    // non snapped
    else {
        if (dialog.hash) {
          if (!nonSnappedCollection.dialogsWithHash[dialog.url]) {
            nonSnappedCollection.dialogsWithHash[dialog.url] = [];
          }

          nonSnappedCollection.dialogsWithHash[dialog.url].push({ dialog: dialog });
        } else {
          nonSnappedCollection.dialogs.push({ dialog: dialog });
        }
      }
  });

  return {
    snappedCollection: {
      dialogs: snappedCollection.dialogs,
      dialogsWithHash: (0, _keys2.default)(snappedCollection.dialogsWithHash).map(function (url) {
        return snappedCollection.dialogsWithHash[url];
      })
    },
    nonSnappedCollection: {
      dialogs: nonSnappedCollection.dialogs,
      dialogsWithHash: (0, _keys2.default)(nonSnappedCollection.dialogsWithHash).map(function (url) {
        return nonSnappedCollection.dialogsWithHash[url];
      })
    }
  };
};

/**
 * @param {Array<{width: Number, height: Number}>} sizes
 * @param {DialogDiffer.Dialog} dialog
 * @returns {Array<{width: Number, height: Number}>}
 */
module.exports.getDialogSizes = function (sizes, dialog) {
  return dialog && dialog.options && dialog.options.sizes || sizes;
};