const mongoose = require('mongoose')
const AbstractDatabaseLayer = require('./abstract-database.layer')

const DIALOG_SCREENSHOTS_DB = 'dialog_screenshots'
const DIALOG_DIFFS_RESULT_DB = 'dialog_diffs_result'
const SUITE_RESULT_DB = 'suite_result'

const toDataMethod = function () {
  const obj = this.toObject()

  obj.id = String(obj._id)
  delete obj._id

  return obj
}

const dialogScreenshotModelSchema = new mongoose.Schema(
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
)

dialogScreenshotModelSchema.methods.toData = toDataMethod

const DialogScreenshotModel = mongoose.model(DIALOG_SCREENSHOTS_DB, dialogScreenshotModelSchema)

let dialogDiffsResultModelSchema = new mongoose.Schema(
  {
    dialogId: String,
    originalVersion: String,
    currentVersion: String,
    options: String,
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
)

dialogDiffsResultModelSchema.methods.toData = toDataMethod

const DialogDiffsResultModel = mongoose.model(DIALOG_DIFFS_RESULT_DB, dialogDiffsResultModelSchema)

const suiteResultModelSchema = new mongoose.Schema(
  {
    status: String,
    errorCode: String,
    timestamp: Number,
    options: Object,
    stats: Object,
    results: Array,
  },
  {
    timestamps: true
  },
)

suiteResultModelSchema.methods.toData = toDataMethod

const SuiteResultModel = mongoose.model(SUITE_RESULT_DB, suiteResultModelSchema)

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
      .then(res => res && res.toData() || res)
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
      .then(res => res.map(par => par.toData()))
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
    ).then(res => res && res.toData() || res)
  }

  updateDialogScreenshot ({
    dialogScreenshotId,
    dialogScreenshotBase64,
  }) {
    return DialogScreenshotModel
      .findByIdAndUpdate(
        dialogScreenshotId, {
          '$set': {
            base64: dialogScreenshotBase64,
          },
        },
        {
          new: true
        },
      ).then(res => res && res.toData() || res)
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
    return SuiteResultModel.create(suiteResult).then(res => res && res.toData() || res)
  }

  updateSuiteResult (suiteResultId, suiteResult) {
    return SuiteResultModel.findByIdAndUpdate(suiteResultId, {'$set': suiteResult}, {new: true}).then(res => res && res.toData() || res)
  }

  getLastSuiteResults () {
    return SuiteResultModel.find().sort({createdAt: -1}).then(res => res.map(par => par.toData()))
  }

  getSuiteResult (suiteId) {
    return SuiteResultModel.findById(suiteId).then(res => res && res.toData() || res)
  }

  /*
   * DIALOGS RESULT
   */

  /**
   * @param {String} options
   * @param {String} dialogId
   * @param {String} originalVersion
   * @param {String} currentVersion
   * @returns {Promise<DialogDiffer.Database.DialogsResult>}
   */
  getDialogsResult ({options, dialogId, originalVersion, currentVersion}) {
    return DialogDiffsResultModel.findOne({
      dialogId: dialogId,
      originalVersion: originalVersion,
      currentVersion: currentVersion,
      options: options,
    }).then(res => res && res.toData() || res)
  }

  /**
   * @param {DialogDiffer.Database.DialogsResult} dialogsResult
   * @returns {Promise<DialogDiffer.Database.DialogsResult>}
   */
  newDialogsResult (dialogsResult) {
    return DialogDiffsResultModel.create(dialogsResult).then(res => res && res.toData() || res)
  }

  deleteSuiteResult (suiteId) {
    return DialogDiffsResultModel.remove({_id: suiteId})
  }
}

module.exports = MongoDbDatabaseLayer
