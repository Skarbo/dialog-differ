require('string-format-js')
const LowDbDatabaseLayer = require('../layers/lowdb-database.layer')

const ERROR_CONSTANTS = require('../constants/error.constants')
const SUITE_CONSTANTS = require('../constants/suite.constants')

const SuiteHelper = require('../helpers/suite.helper')
const DialogHelper = require('../helpers/dialog.helper')
const ErrorHelper = require('../helpers/error.helper')

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
class DatabaseHandler {
  /**
   * @param {AbstractDatabaseLayer} [databaseLayer] Uses {@link LowDbDatabaseLayer} as default
   */
  constructor (databaseLayer = null) {
    /** @type {AbstractDatabaseLayer} */
    this.databaseLayer = databaseLayer || new LowDbDatabaseLayer()
  }

  /**
   * @param {*} [args]
   * @return {Promise<void>}
   */
  initDB (args = null) {
    return this.databaseLayer.initDB(args)
  }

  /**
   * @return {Promise<void>}
   */
  clearDB () {
    return this.databaseLayer ? this.databaseLayer.clearDB() : Promise.resolve()
  }

  /**
   * @return {Boolean}
   */
  isInitialized () {
    return this.databaseLayer ? this.databaseLayer.isInitialized() : false
  }

  /**
   * @param {DialogDiffer.Dialog} dialog
   * @param {DialogDiffer.DialogScreenshot} dialogScreenshot
   * @return {Promise<DialogDiffer.Database.DialogScreenshot>}
   */
  saveDialogScreenshot (dialog, dialogScreenshot) {
    return new Promise((fulfill, reject) => {
      this
        .getDialogScreenshot(dialog, dialogScreenshot)
        .then(dialogScreenshotDb => {
          if (dialogScreenshotDb) {
            return this.databaseLayer
              .updateDialogScreenshot({
                dialogScreenshotId: dialogScreenshotDb.id,
                dialogScreenshotBase64: dialogScreenshot.base64
              })
          }
          else {
            return this.databaseLayer
              .newDialogScreenshot({
                dialogId: dialog.id,
                dialogVersion: dialog.version,
                dialogScreenshotHeight: dialogScreenshot.height,
                dialogScreenshotWidth: dialogScreenshot.width,
                dialogScreenshotBase64: dialogScreenshot.base64,
              })
          }
        })
        .then(fulfill)
        .catch(err => {
          reject(ErrorHelper.createError(err, 'Could not save dialog screenshot', ERROR_CONSTANTS.SAVE_DIALOG_SCREENSHOT_DB_ERROR, {
            dialog,
            dialogScreenshot
          }))
        })
    })
  }

  /**
   * @param {DialogDiffer.Dialog} dialog
   * @param {DialogDiffer.Database.SearchDialogScreenshot} dialogScreenshot
   * @return {Promise<DialogDiffer.Database.DialogScreenshot>}
   */
  getDialogScreenshot (dialog, dialogScreenshot) {
    return new Promise((resolve, reject) => {
      this.databaseLayer
        .getDialogScreenshot({
          dialogId: dialog.id,
          dialogVersion: dialog.version,
          dialogScreenshotWidth: dialogScreenshot.width,
          dialogScreenshotHeight: dialogScreenshot.height,
        })
        .then(resolve)
        .catch(err => {
          reject(ErrorHelper.createError(err, 'Could not get dialog screenshot', ERROR_CONSTANTS.GET_DIALOG_SCREENSHOT_DB_ERROR, {
            dialog,
            dialogScreenshot
          }))
        })
    })
  }

  /**
   * @param {DialogDiffer.Dialog} dialog
   * @param {Array<DialogDiffer.Database.SearchDialogScreenshot>} sizes
   * @return {Promise<Array<DialogDiffer.Database.DialogScreenshot>>}
   */
  getDialogScreenshots (dialog, sizes) {
    return new Promise((resolve, reject) => {
      this.databaseLayer
        .getDialogScreenshots({
          dialogId: dialog.id,
          dialogVersion: dialog.version,
          sizes,
        })
        .then(resolve)
        .catch(err => {
          reject(ErrorHelper.createError(err, 'Could not get dialog screenshots', ERROR_CONSTANTS.GET_DIALOG_SCREENSHOTS_DB_ERROR, {dialog}))
        })
    })
  }

  /**
   * @param {Array<DialogDiffer.Dialog>} dialogs
   * @param {Array<DialogDiffer.Database.SearchDialogScreenshot>} sizes
   * @return {Promise<Array<Array<DialogDiffer.Database.DialogScreenshot>>>}
   */
  getDialogsScreenshots (dialogs, sizes) {
    return new Promise((resolve, reject) => {
      Promise
        .all(dialogs.map(dialog => this.getDialogScreenshots(dialog, DialogHelper.getDialogSizes(sizes, dialog))))
        .then(resolve)
        .catch(err => reject(ErrorHelper.createError(err, 'Could not get dialog screenshots', ERROR_CONSTANTS.GET_DIALOGS_SCREENSHOTS_DB_ERROR, {dialogs})))
    })
  }

  /**
   * @param {String} dialogVersion
   * @returns {Promise<Boolean>}
   */
  deleteDialogsScreenshots (dialogVersion) {
    return new Promise((resolve, reject) => {
      this.databaseLayer
        .deleteDialogsScreenshots(dialogVersion)
        .then(resolve)
        .catch(err => {
          reject(ErrorHelper.createError(err, 'Could not delete dialog screenshots', ERROR_CONSTANTS.DELETE_DIALOGS_SCREENSHOTS_DB_ERROR, {dialogVersion}))
        })
    })
  }

  /**
   * @param {DialogDiffer.Options} options
   * @param {DialogDiffer.Dialog} dialogOriginal
   * @param {DialogDiffer.Dialog} dialogCurrent
   * @param {DialogDiffer.DialogsResult} dialogsResult
   * @returns {Promise<{dialogsResult: DialogDiffer.DialogsResult, dialogsResultDb: DialogDiffer.Database.DialogsResult}>}
   */
  saveDialogsResult (options, dialogOriginal, dialogCurrent, dialogsResult) {
    return new Promise((resolve, reject) => {
      this.databaseLayer
        .newDialogsResult({
          dialogId: dialogsResult.dialogId,
          originalVersion: dialogsResult.originalVersion,
          currentVersion: dialogsResult.currentVersion,
          options: SuiteHelper.createUniqueOptionsId(options),
          result: dialogsResult.result,
          differ: dialogsResult.differ,
        })
        .then(dialogsResultDb => {
          resolve({dialogsResult: dialogsResult, dialogResultDb: dialogsResultDb})
        })
        .catch(err => {
          reject(ErrorHelper.createError(err, 'Could not save dialogs diff result', ERROR_CONSTANTS.SAVE_DIALOGS_DIFF_RESULT_DB_ERROR, {
            options,
            dialogOriginal,
            dialogCurrent,
            dialogsResult
          }))
        })
    })
  }

  /**
   * @param {DialogDiffer.Options} options
   * @param {String} dialogId
   * @param {String} originalVersion
   * @param {String} currentVersion
   * @returns {Promise<DialogDiffer.Database.DialogsResult>}
   */
  getDialogsResult (options, dialogId, originalVersion, currentVersion) {
    return new Promise((resolve, reject) => {
      this.databaseLayer
        .getDialogsResult({
          dialogId: dialogId,
          originalVersion: originalVersion,
          currentVersion: currentVersion,
          options: SuiteHelper.createUniqueOptionsId(options),
        })
        .then(resolve)
        .catch(err => {
          reject(ErrorHelper.createError(err, 'Could not get dialogs diff result', ERROR_CONSTANTS.GET_DIALOG_SCREENSHOT_DB_ERROR, {
            options,
            dialogId,
            originalVersion,
            currentVersion
          }))
        })
    })
  }

  /**
   * @param {DialogDiffer.Suite} suite
   * @return {Promise<DialogDiffer.Database.SuiteResult>}
   */
  newSuiteResult (suite) {
    return new Promise((resolve, reject) => {
      this.databaseLayer
        .newSuiteResult({
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
            dialogs: (suite.original || []).length + (suite.current || []).length,
          },
          dialogsResult: []
        })
        .then(resolve)
        .catch(err => {
          reject(ErrorHelper.createError(err, 'Could not save suite result', ERROR_CONSTANTS.NEW_SUITE_RESULT_DB_ERROR, {suite}))
        })
    })
  }

  /**
   * @param {DialogDiffer.SuiteResult} suiteResult
   * @return {Promise<DialogDiffer.SuiteResult>}
   */
  saveSuiteResult (suiteResult) {
    /** @param {DialogDiffer.Dialog|null} dialog */
    const createErrorObj = (dialog) => {
      if (!dialog || !dialog.error) {
        return null
      }
      return {
        code: dialog.error.code,
        message: (dialog.error.message || '').format.apply(dialog.error.message || '', dialog.error.args),
      }
    }

    return new Promise((resolve, reject) => {
      this.databaseLayer
        .updateSuiteResult(suiteResult.id, {
          status: suiteResult.status,
          stats: suiteResult.stats,
          results: suiteResult.results
            .map(dialogsResult => {
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
                  error: createErrorObj(dialogsResult.original),
                } : null,
                current: dialogsResult.current ? {
                  version: dialogsResult.currentVersion,
                  id: dialogsResult.current.id,
                  url: dialogsResult.current.url,
                  hash: dialogsResult.current.hash,
                  options: dialogsResult.current.options || {},
                  error: createErrorObj(dialogsResult.current),
                } : null,
                result: dialogsResult.result,
              }
            })
        })
        .then(resolve)
        .catch(err => {
          reject(ErrorHelper.createError(err, 'Could not save suite result', ERROR_CONSTANTS.SAVE_SUITE_RESULT_DB_ERROR, {suiteResult}))
        })
    })
  }

  /**
   * @param {DialogDiffer.Suite} suite
   * @param {DialogDiffer.Error} err
   * @return {Promise<DialogDiffer.Suite>}
   */
  saveSuiteResultError (suite, err) {
    return new Promise((resolve, reject) => {
      this.databaseLayer
        .updateSuiteResult(suite.id, {
          status: SUITE_CONSTANTS.ERROR_STATUS,
          errorCode: err.code,
        })
        .then(() => resolve(suite))
        .catch(err => {
          reject(ErrorHelper.createError(err, 'Could not save suite result', ERROR_CONSTANTS.SAVE_SUITE_RESULT_DB_ERROR, {suite}))
        })
    })
  }

  /**
   * @param {String} suiteId
   * @return {Promise<DialogDiffer.Database.SuiteResult|null>}
   */
  getSuiteResult (suiteId) {
    return new Promise((resolve, reject) => {
      this.databaseLayer
        .getSuiteResult(suiteId)
        .then(resolve)
        .catch(err => {
          reject(ErrorHelper.createError(err, 'Could not get suite results', ERROR_CONSTANTS.GET_SUITE_RESULTS_DB_ERROR))
        })
    })
  }

  /**
   * @return {Promise<Array<DialogDiffer.Database.SuiteResult>>}
   */
  getLastSuiteResults () {
    return new Promise((resolve, reject) => {
      this.databaseLayer
        .getLastSuiteResults()
        .then(resolve)
        .catch(err => {
          reject(ErrorHelper.createError(err, 'Could not get suite results', ERROR_CONSTANTS.GET_SUITE_RESULTS_DB_ERROR))
        })
    })
  }

  /**
   * @param {String} suiteId
   * @returns {Promise<Boolean>}
   * @throws {DialogDiffer.Error}
   */
  deleteSuiteResult (suiteId) {
    return new Promise((resolve, reject) => {
      this.databaseLayer
        .deleteSuiteResult(suiteId)
        .then(resolve)
        .catch(err => {
          reject(ErrorHelper.createError(err, 'Could not delete suite result', ERROR_CONSTANTS.DELETE_SUITE_RESULT_DB_ERROR, {suiteId}))
        })
    })
  }
}

module.exports = DatabaseHandler
