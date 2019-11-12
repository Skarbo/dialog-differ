'use strict';

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _from = require('babel-runtime/core-js/array/from');

var _from2 = _interopRequireDefault(_from);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var SuiteHelper = require('./suite.helper');

module.exports.createDialogScreenshot = function (width, height, base64) {
  return {
    width: width,
    height: height,
    base64: base64
  };
};

module.exports.createUniqueDialogId = function (dialog) {
  return dialog.version + '/' + dialog.id;
};

module.exports.createUniqueDialogScreenshotId = function (dialog, dialogScreenshot) {
  return dialog.version + '/' + dialog.id + '/' + dialogScreenshot.width + '/' + dialogScreenshot.height;
};

module.exports.createUniqueDialogResultId = function (options, dialogOriginal, dialogCurrent) {
  return [module.exports.createUniqueDialogId(dialogOriginal), module.exports.createUniqueDialogId(dialogCurrent), SuiteHelper.createUniqueOptionsId(options)].join('-');
};

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
    if (!options.isForceSnap && module.exports.isDialogSnapped(module.exports.getDialogSizes(options.sizes, dialog), dialog, dialogsScreenshotsDb[i])) {
      if (dialog.hash) {
        if (!snappedCollection.dialogsWithHash[dialog.url]) {
          snappedCollection.dialogsWithHash[dialog.url] = [];
        }

        snappedCollection.dialogsWithHash[dialog.url].push({ dialog: dialog, screenshots: dialogsScreenshotsDb[i] });
      } else {
        snappedCollection.dialogs.push({ dialog: dialog, screenshots: dialogsScreenshotsDb[i] });
      }
    } else {
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

module.exports.getDialogSizes = function (sizes, dialog) {
  return dialog && dialog.options && dialog.options.sizes || sizes;
};