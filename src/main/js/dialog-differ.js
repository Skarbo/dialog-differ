/**
 * @typedef {Object} DialogDiffer.Config
 * @property {String} [logLevel=error]
 * @property {Number} [browserTimeout=5000] Milliseconds to wait for browser instance to start, page to open, and page waiting selectors
 * @property {Object} [puppeteerLaunchOptions] {@link https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#puppeteerlaunchoptions|Puppeteer launch options}
 * @property {Number} [snapDialogsWithHashFromBrowserCollections] Number of hash dialogs to collect into collections (0 is off)
 * @property {Number} [snapDialogsWithHashFromBrowserConcurrency] Number of hash dialogs with has to run at same time
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

process.setMaxListeners(0) // needed for puppeteer

const TAG = 'DialogDiffer'

const DatabaseHandler = require('./handlers/database.handler')
const SnapHandler = require('./handlers/snap.handler')
const DifferHandler = require('./handlers/differ.handler')
const logger = require('./logger')
const configLib = require('./config.lib')

const ERROR_CONSTANTS = require('./constants/error.constants')
const SUITE_CONSTANTS = require('./constants/suite.constants')
const DIFFER_CONSTANTS = require('./constants/differ.constants')
const LOGGER_CONSTANTS = require('./constants/logger.constants')

const ErrorHelper = require('./helpers/error.helper')
const SuiteHelper = require('./helpers/suite.helper')
const DialogHelper = require('./helpers/dialog.helper')

/**
 * @class
 */
class DialogDiffer {
  /**
   * @param {AbstractDatabaseLayer|String} [databaseLayer]
   * @param {DatabaseHandler} [databaseHandler]
   * @param {DifferHandler} [differHandler]
   * @param {SnapHandler} [snapHandler]
   * @param {DialogDiffer.Config} [config]
   */
  constructor ({
    databaseLayer = null,
    databaseHandler = null,
    differHandler = null,
    snapHandler = null,
    config = {}
  } = {}) {
    logger.setLevel(configLib.getConfig(config).logLevel)
    /** @type {DatabaseHandler} */
    this.databaseHandler = databaseHandler || new DatabaseHandler(databaseLayer)
    /** @type {DifferHandler} */
    this.differHandler = differHandler || new DifferHandler(this.databaseHandler)
    /** @type {SnapHandler} */
    this.snapHandler = snapHandler || new SnapHandler(this.databaseHandler)
  }

  static get ERROR_CONSTANTS () {
    return ERROR_CONSTANTS
  }

  static get SUITE_CONSTANTS () {
    return SUITE_CONSTANTS
  }

  static get DIFFER_CONSTANTS () {
    return DIFFER_CONSTANTS
  }

  static get LOGGER_CONSTANTS () {
    return LOGGER_CONSTANTS
  }

  /**
   * @param {*} [databaseArgs]
   * @return {Promise<void>}
   * @throws {DialogDiffer.Error}
   */
  async initDialogDiffer ({databaseArgs = null} = {}) {
    return this.databaseHandler.initDB(databaseArgs)
  }

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
  async diff (suite, {
    onStart = null,
    onSnapStart = null,
    onSnap = null,
    onSnapEnd = null,
    onDiffStart = null,
    onDiff = null,
    onDiffEnd = null,
    onEnd = null,
  } = {}) {
    try {
      // validate Suite
      await SuiteHelper.validateSuite(suite)

      const numberOfDialogs = SuiteHelper.getNumberOfDialogs(suite)
      const numberOfUniqueDialogs = SuiteHelper.getNumberOfUniqueDialogs(suite)

      // init Suite result
      const {suiteResultDb: initSuiteResultDb} = await this.differHandler.initSuiteResult(suite)

      if (onStart) {
        onStart(initSuiteResultDb)
      }

      if (onSnapStart) {
        onSnapStart({suiteId: initSuiteResultDb.id, dialogs: numberOfDialogs})
      }

      // snap Suite
      await this.snapHandler.snapSuite(suite, {
        onSnap ({dialog, err, isDatabase, isOriginal, isCurrent}) {
          if (onSnap) {
            onSnap({suiteId: initSuiteResultDb.id, dialog, err, isDatabase, isOriginal, isCurrent})
          }
        }
      })

      if (onSnapEnd) {
        onSnapEnd({suiteId: initSuiteResultDb.id, dialogs: numberOfDialogs})
      }

      if (onDiffStart) {
        onDiffStart({suiteId: initSuiteResultDb.id, dialogs: numberOfUniqueDialogs})
      }

      // differ Suite
      const {suiteResult, suiteResultDb} = await this.differHandler.differSuite(suite, {
        onDiff ({dialogsResult}) {
          if (onDiff) {
            onDiff({suiteId: initSuiteResultDb.id, dialogsResult})
          }
        }
      })

      if (onDiffEnd) {
        onDiffEnd({suiteId: initSuiteResultDb.id, dialogs: numberOfUniqueDialogs})
      }

      if (onEnd) {
        onEnd(suiteResultDb)
      }

      return suiteResult
    }
    catch (err) {
      logger.error(TAG, 'diff', err.toString(), JSON.stringify(err.args), err.stack)

      try {
        await this.differHandler.errorSuiteResult(suite, err)
        const suiteResultDb = await this.databaseHandler.getSuiteResult(suite.id)

        if (onEnd) {
          onEnd(suiteResultDb)
        }
      }
      catch (err) {
        // ignore
      }

      throw ErrorHelper.createError(err, 'Unexpected error', ERROR_CONSTANTS.UNEXPECTED_ERROR)
    }
  }

  /**
   * @param {String} suiteId
   * @return {Promise<DialogDiffer.SuiteResult>}
   * @throws {DialogDiffer.Error}
   */
  async getSuiteResult (suiteId) {
    try {
      // get suite result from database
      const suiteResultDb = await this.databaseHandler.getSuiteResult(suiteId)

      // suite result must be finished
      if (!suiteResultDb || suiteResultDb.status !== SUITE_CONSTANTS.FINISHED_STATUS) {
        throw ErrorHelper.createError(null, 'Suite does not exist or is not finished', null, {suiteResultDb})
      }

      /** @type {DialogDiffer.SuiteResult} */
      const suiteResult = {...suiteResultDb}

      // get dialogs screenshots
      /** @type {Array<Array<DialogDiffer.Database.DialogScreenshot>>} */
      const dialogsScreenshotsMapDb = await Promise.all(suiteResultDb.results.map(suiteResultDialogsResultDb => {
        return this.databaseHandler
          .getDialogsScreenshots([
            {id: suiteResultDialogsResultDb.dialogId, version: suiteResultDialogsResultDb.originalVersion},
            {id: suiteResultDialogsResultDb.dialogId, version: suiteResultDialogsResultDb.currentVersion},
          ], DialogHelper.getDialogSizes(suiteResultDb.options.sizes, suiteResultDialogsResultDb.original || suiteResultDialogsResultDb.current))
      }))

      dialogsScreenshotsMapDb.forEach((dialogsScreenshotsDb, i) => {
        // set original dialog, if result is not added
        if (suiteResult.results[i].original && suiteResult.results[i].result !== DIFFER_CONSTANTS.ADDED_DIFFER_RESULT) {
          suiteResult.results[i].original.screenshots = dialogsScreenshotsDb[0]
        }
        else {
          suiteResult.results[i].original = null
        }

        // set current dialog, if result is not deleted
        if (suiteResult.results[i].current && suiteResult.results[i].result !== DIFFER_CONSTANTS.DELETED_DIFFER_RESULT) {
          suiteResult.results[i].current.screenshots = dialogsScreenshotsDb[1]
        }
        else {
          suiteResult.results[i].current = null
        }

        // set default differ results
        suiteResult.results[i].differ = DialogHelper
          .getDialogSizes(suiteResult.options.sizes, suiteResult.results[i].original || suiteResult.results[i].current)
          .map((_, i) => {
            return {
              index: i,
              result: DIFFER_CONSTANTS.IDENTICAL_DIFFER_RESULT,
              base64: null,
            }
          })
      })

      /** @type {Array<DialogDiffer.Database.DialogsResult>} */
      const dialogsResultsDb = await Promise.all(suiteResult.results.map(suiteResultDialogsResultDb => {
        return this.databaseHandler.getDialogsResult(
          suiteResult.options,
          suiteResultDialogsResultDb.dialogId,
          suiteResultDialogsResultDb.originalVersion,
          suiteResultDialogsResultDb.currentVersion
        )
      }))

      dialogsResultsDb.forEach((dialogsResultDb, i) => {
        if (dialogsResultDb) {
          suiteResult.results[i].differ = dialogsResultDb.differ
        }
        else {
          // set differ to result
          suiteResult.results[i].differ.forEach(diffResult => {
            diffResult.result = suiteResult.results[i].result
          })
        }
      })

      return suiteResult
    }
    catch (err) {
      throw ErrorHelper.createError(err, 'Could not get Suite', ERROR_CONSTANTS.GET_SUITE_ERROR, {suiteId})
    }
  }

  /**
   * @return {Promise<Array<DialogDiffer.Database.SuiteResult>>}
   * @throws {DialogDiffer.Error}
   */
  async getLastSuiteResults () {
    return this.databaseHandler.getLastSuiteResults()
  }

  /**
   * @param {String} dialogVersion
   * @returns {Promise<Boolean>}
   * @throws {DialogDiffer.Error}
   */
  async deleteDialogs (dialogVersion) {
    return this.databaseHandler.deleteDialogsScreenshots(dialogVersion)
  }

  /**
   * @param {String} suiteId
   * @returns {Promise<Boolean>}
   * @throws {DialogDiffer.Error}
   */
  async deleteSuiteResult (suiteId) {
    return this.databaseHandler.deleteSuiteResult(suiteId)
  }
}

module.exports = DialogDiffer
