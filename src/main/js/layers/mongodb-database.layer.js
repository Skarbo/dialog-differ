const mongoose = require('mongoose')
const AbstractDatabaseLayer = require('./abstract-database.layer')

const DIALOG_SCREENSHOTS_DB = 'dialog_screenshots'
const DIALOG_DIFFS_RESULT_DB = 'dialog_diffs_result'
const SUITE_RESULT_DB = 'suite_result'

const DialogScreenshotModel = mongoose.model(DIALOG_SCREENSHOTS_DB, new mongoose.Schema(
  {
    dialogId: String,
    dialogVersion: String,
    base64: String,
    height: Number,
    width: Number,
  },
  {
    timestamps: true
  },
))

const DialogDiffsResultModel = mongoose.model(DIALOG_DIFFS_RESULT_DB, new mongoose.Schema(
  {
    dialogId: String,
    originalVersion: String,
    currentVersion: String,
    original: {
      version: String,
      id: String,
      url: String,
      hash: String,
      options: Object,
    },
    current: {
      version: String,
      id: String,
      url: String,
      hash: String,
      options: Object,
    },
    result: String,
    differ: [{
      index: Number,
      result: String,
      base64: String,
    }],
  },
  {
    timestamps: true
  },
))

const SuiteResultModel = mongoose.model(SUITE_RESULT_DB, new mongoose.Schema(
  {
    status: String,
    errorCode: String,
    timestamp: Number,
    options: Object,
    stats: Object,
    result: [
      {
        dialogId: String,
        originalVersion: String,
        currentVersion: String,
        result: String,
        error: Object,
      }
    ],
  },
  {
    timestamps: true
  },
))

let db = null

class MongoDbDatabaseLayer extends AbstractDatabaseLayer {
  initDB (uri) {
    return mongoose
      .connect(uri)
      .then(() => {
        db = mongoose.connection
        return Promise.resolve()
      })
  }

  clearDB () {
    if (db) {
      return Promise.all([
        DialogScreenshotModel.remove({}),
        DialogDiffsResultModel.remove({}),
        SuiteResultModel.remove({}),
      ])
    }
    else {
      return Promise.resolve()
    }
  }

  isInitialized () {
    return !!db
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
  getDialogScreenshot ({dialogId, dialogVersion, dialogScreenshotHeight, dialogScreenshotWidth}) {
    return DialogScreenshotModel
      .findOne({
        dialogId,
        dialogVersion,
        height: dialogScreenshotHeight,
        width: dialogScreenshotWidth,
      })
      .exec()
  }

  /**
   * @param {String} dialogId
   * @param {String} dialogVersion
   * @param {Array<{width: Number, height: Number}>} sizes
   * @return {Promise<Array<DialogDiffer.Database.DialogScreenshot>>}
   */
  getDialogScreenshots ({dialogId, dialogVersion, sizes}) {
    return DialogScreenshotModel
      .find({
        dialogId,
        dialogVersion,
      })
      .sort({
        width: 1
      })
      .exec()
  }

  /**
   * @param {String} dialogId
   * @param {String} dialogVersion
   * @param {Number} dialogScreenshotHeight
   * @param {Number} dialogScreenshotWidth
   * @param {String} dialogScreenshotBase64
   * @return {Promise<DialogDiffer.Database.DialogScreenshot>}
   */
  newDialogScreenshot ({
    dialogId,
    dialogVersion,
    dialogScreenshotHeight,
    dialogScreenshotWidth,
    dialogScreenshotBase64,
  }) {
    return DialogScreenshotModel.create(
      {
        dialogId,
        dialogVersion,
        height: dialogScreenshotHeight,
        width: dialogScreenshotWidth,
        base64: dialogScreenshotBase64,
      }
    )
  }

  updateDialogScreenshot ({
    dialogScreenshotId,
    dialogScreenshotBase64,
  }) {
    return DialogScreenshotModel
      .findByIdAndUpdate(dialogScreenshotId, {
        base64: dialogScreenshotBase64,
      })
  }

  deleteDialogsScreenshots (dialogVersion) {
    return DialogScreenshotModel.remove({
      dialogVersion,
    })
  }

  /*
   * SUITE RESULT
   */

  newSuiteResult (suiteResult) {
    return SuiteResultModel.create(suiteResult)
  }

  updateSuiteResult (suiteResultId, suiteResult) {
    return SuiteResultModel.findByIdAndUpdate(suiteResultId, suiteResult)
  }

  getDialogsResult ({options, dialogId, originalVersion, currentVersion}) {
    return SuiteResultModel.find({
      dialogId: dialogId,
      originalVersion: originalVersion,
      currentVersion: currentVersion,
      options: options,
    })
  }

  getLastSuiteResults () {
    return SuiteResultModel.find().sort({createdAt: -1})
  }

  getSuiteResult (suiteId) {
    return SuiteResultModel.findById(suiteId)
  }

  /*
   * DIALOGS RESULT
   */

  newDialogsResult (dialogsResult) {
    return DialogDiffsResultModel.create(dialogsResult)
  }

  getDialogScreenshotFromId (dialogScreenshotId) {
    return DialogDiffsResultModel.findbyId(dialogScreenshotId)
  }

  deleteSuiteResult (suiteId) {
    return DialogDiffsResultModel.remove({_id: suiteId})
  }
}

module.exports = MongoDbDatabaseLayer
