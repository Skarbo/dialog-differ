const TAG = 'Differ'

const tmp = require('tmp')
const path = require('path')
const looksSame = require('looks-same')
const base64Img = require('base64-img')
const Promise = require('bluebird')

const LOGGER_CONSTANTS = require('../constants/logger.constants')
const DIFFER_CONSTANTS = require('../constants/differ.constants')
const SUITE_CONSTANTS = require('../constants/suite.constants')

const configLib = require('../config.lib')
const SuiteHelper = require('../helpers/suite.helper')
const logger = require('../logger')

/**
 * @typedef {Object} DifferHandler.DifferDialogScreenshotResult
 * @property {Boolean} isIdentical
 * @property {String|null} base64
 * @memberOf DifferHandler
 */

/**
 * @class
 */
class DifferHandler {
  /**
   * @param {DatabaseHandler} databaseHandler
   * @param {DialogDiffer.Config} [config]
   */
  constructor (databaseHandler, config = {}) {
    this.databaseHandler = databaseHandler
    this.config = configLib.getConfig(config)
  }

  /**
   * @param {DialogDiffer.Dialog} dialog
   * @returns {DialogDiffer.Dialog}
   * @private
   */
  prepareDialogScreenshots (dialog) {
    dialog.screenshots.forEach(screenshot => {
      const tmpFile = tmp.fileSync({
        postfix: '.png'
      })

      screenshot.path = tmpFile.name
      screenshot.removeCallback = tmpFile.removeCallback
      base64Img.imgSync(screenshot.base64, path.dirname(tmpFile.name), path.basename(tmpFile.name, '.png'))
    })

    return dialog
  }

  /**
   * @param {DialogDiffer.Dialog|null} dialogOriginal
   * @param {DialogDiffer.Dialog|null} dialogCurrent
   * @param {String} result
   * @param {Array<DialogDiffer.DialogResultDiff>} [differ]
   * @return {DialogDiffer.DialogsResult}
   * @private
   */
  createDialogsResult (dialogOriginal, dialogCurrent, result, differ = []) {
    return {
      dialogId: dialogOriginal && dialogOriginal.id || dialogCurrent && dialogCurrent.id,
      original: dialogOriginal,
      current: dialogCurrent,
      originalVersion: dialogOriginal && dialogOriginal.version || null,
      currentVersion: dialogCurrent && dialogCurrent.version || null,
      result,
      differ,
    }
  }

  /**
   * @param {DialogDiffer.DialogScreenshot} screenshotOriginal
   * @param {DialogDiffer.DialogScreenshot} screenshotCurrent
   * @returns {Promise<DifferHandler.DifferDialogScreenshotResult>}
   */
  differDialogScreenshot (screenshotOriginal, screenshotCurrent) {
    return new Promise((resolve, reject) => {
      const tmpFile = tmp.fileSync({
        postfix: '.png'
      })

      const removeTmpFiles = () => {
        try {
          if (tmpFile.removeCallback) {
            tmpFile.removeCallback()
          }

          if (screenshotOriginal.removeCallback) {
            screenshotOriginal.removeCallback()
            delete screenshotOriginal.path
          }

          if (screenshotCurrent.removeCallback) {
            screenshotCurrent.removeCallback()
            delete screenshotCurrent.path
          }
        }
        catch (err) {
          // ignore
        }
      }

      looksSame(
        screenshotCurrent.path,
        screenshotOriginal.path,
        {
          strict: false,
          tolerance: this.config.diffTolerance,
        },
        (err, isIdentical) => {
          if (err) {
            reject(err)
            removeTmpFiles()
            return
          }

          // identical
          if (isIdentical) {
            resolve({
              isIdentical: true,
              base64: null
            })
            removeTmpFiles()
          }
          // diff
          else {
            looksSame.createDiff({
              reference: screenshotCurrent.path,
              current: screenshotOriginal.path,
              diff: tmpFile.name,
              highlightColor: this.config.diffHighlightColor,
              strict: false,
              tolerance: this.config.diffTolerance,
            }, (err) => {
              if (err) {
                reject(err)
                removeTmpFiles()
                return
              }

              resolve({
                isIdentical: false,
                base64: base64Img.base64Sync(tmpFile.name)
              })
              removeTmpFiles()
            })
          }
        })
    })
  }

  /**
   * @param {DialogDiffer.Options} options
   * @param {DialogDiffer.Dialog|null} dialogOriginal
   * @param {DialogDiffer.Dialog|null} dialogCurrent
   * @param {function({dialogsResult: DialogDiffer.DialogsResult}): void} [onDiff]
   * @returns {Promise<DialogDiffer.DialogsResult>}
   * @throws {DialogDiffer.Error}
   */
  async differDialog (options, dialogOriginal, dialogCurrent, {onDiff = null} = {}) {

    // dialog deleted or added
    if (!dialogOriginal || !dialogCurrent) {
      const dialogsResult = this.createDialogsResult(
        dialogOriginal,
        dialogCurrent,
        !dialogCurrent ? DIFFER_CONSTANTS.DELETED_DIFFER_RESULT : DIFFER_CONSTANTS.ADDED_DIFFER_RESULT,
        []
      )

      logger.info(
        TAG,
        'differDialog',
        '[dialog_original_version=%s][dialog_current_version=%s][dialog_id=%s][diff_result=%s]',
        LOGGER_CONSTANTS.DIALOG_DIFF_NEW_DELETED_LOGGER,
        dialogsResult.originalVersion,
        dialogsResult.currentVersion,
        dialogsResult.dialogId,
        dialogsResult.result,
      )

      if (onDiff) {
        onDiff({dialogsResult})
      }

      return dialogsResult
    }

    // dialog error
    if (dialogOriginal.error || dialogCurrent.error) {
      const dialogsResult = this.createDialogsResult(
        dialogOriginal,
        dialogCurrent,
        DIFFER_CONSTANTS.ERROR_DIFFER_RESULT,
        []
      )

      logger.info(
        TAG,
        'differDialog',
        '[dialog_original_version=%s][dialog_current_version=%s][dialog_id=%s][diff_result=%s]',
        LOGGER_CONSTANTS.DIALOG_DIFF_ERROR_LOGGER,
        dialogsResult.originalVersion,
        dialogsResult.currentVersion,
        dialogsResult.dialogId,
        dialogsResult.result,
      )

      if (onDiff) {
        onDiff({dialogsResult})
      }

      return dialogsResult
    }

    // get dialog result from database
    const dialogResultDb = await this.databaseHandler.getDialogsResult(options, dialogOriginal.id, dialogOriginal.version, dialogCurrent.version)

    // use dialog result from database
    if (dialogResultDb && !options.isForceDiff) {
      const dialogsResult = this.createDialogsResult(
        dialogOriginal,
        dialogCurrent,
        dialogResultDb.result,
        dialogResultDb.differ
      )

      logger.info(
        TAG,
        'differDialog',
        '[dialog_original_version=%s][dialog_current_version=%s][dialog_id=%s][diff_result=%s]',
        LOGGER_CONSTANTS.DIALOG_DIFF_FROM_DATABASE_LOGGER,
        dialogsResult.originalVersion,
        dialogsResult.currentVersion,
        dialogsResult.dialogId,
        dialogsResult.result,
      )

      if (onDiff) {
        onDiff({dialogsResult})
      }

      return dialogsResult
    }
    // get dialog result from image diff
    else {
      return this.differDialogWithImageDiff(options, dialogOriginal, dialogCurrent, {onDiff})
    }
  }

  /**
   * @param {DialogDiffer.Options} options
   * @param {DialogDiffer.Dialog|null} dialogOriginal
   * @param {DialogDiffer.Dialog|null} dialogCurrent
   * @param {function({dialogsResult: DialogDiffer.DialogsResult}): void} [onDiff]
   * @returns {Promise<DialogDiffer.DialogsResult>}
   * @throws {DialogDiffer.Error}
   * @private
   */
  async differDialogWithImageDiff (options, dialogOriginal, dialogCurrent, {onDiff = null} = {}) {
    // prepare dialogs screenshots
    this.prepareDialogScreenshots(dialogOriginal)
    this.prepareDialogScreenshots(dialogCurrent)

    // diff dialogs
    /** @type {Array<DifferHandler.DifferDialogScreenshotResult>} */
    const dialogsDiffers = await Promise.map(
      dialogOriginal.screenshots,
      (screenshot, i) => this.differDialogScreenshot(dialogOriginal.screenshots[i], dialogCurrent.screenshots[i]),
      {concurrency: 10}
    )

    /** @type {DialogDiffer.DialogsResult} */
    const dialogsResult = this.createDialogsResult(
      dialogOriginal,
      dialogCurrent,
      DIFFER_CONSTANTS.IDENTICAL_DIFFER_RESULT,
      []
    )

    dialogsDiffers.forEach(({isIdentical, base64}, i) => {
      if (!isIdentical) {
        dialogsResult.result = DIFFER_CONSTANTS.CHANGED_DIFFER_RESULT
      }

      dialogsResult.differ.push({
        index: i,
        result: isIdentical ? DIFFER_CONSTANTS.IDENTICAL_DIFFER_RESULT : DIFFER_CONSTANTS.CHANGED_DIFFER_RESULT,
        base64
      })
    })

    logger.info(
      TAG,
      'differDialogWithImageDiff',
      '[dialog_original_version=%s][dialog_current_version=%s][dialog_id=%s][diff_result=%s]',
      LOGGER_CONSTANTS.DIALOG_DIFF_FROM_IMAGE_DIFF_LOGGER,
      dialogsResult.originalVersion,
      dialogsResult.currentVersion,
      dialogsResult.dialogId,
      dialogsResult.result,
    )

    // save dialogs result to database
    await this.databaseHandler.saveDialogsResult(options, dialogOriginal, dialogCurrent, dialogsResult)

    if (onDiff) {
      onDiff({dialogsResult})
    }

    return dialogsResult
  }

  /**
   * @param {DialogDiffer.Suite} suite
   * @param {function({dialogsResult: DialogDiffer.DialogsResult}): void} [onDiff]
   * @returns {Promise<{suiteResult: DialogDiffer.SuiteResult, suiteResultDb: DialogDiffer.Database.SuiteResult}>}
   */
  async differSuite (suite, {onDiff = null} = {}) {
    logger.log(TAG, 'differSuite', 'Differ suite...', null, suite.id)

    // get suite result from database
    const suiteResultDb = await this.databaseHandler.getSuiteResult(suite.id)

    // prepare suite result
    const suiteResult = SuiteHelper.prepareSuiteResults(suite, suiteResultDb)

    // differ dialogs
    /** @type {Array<DialogDiffer.DialogsResult>} */
    const dialogsResults = await Promise.map(
      suiteResult.results,
      result => this.differDialog(suite.options, result.original, result.current, {onDiff}),
      {concurrency: 10}
    )

    logger.log(TAG, 'differSuite', 'Diffed suite', null, suite.id)

    dialogsResults.forEach((dialogResult, i) => {
      suiteResult.results[i] = dialogResult
    })

    // finish suite result
    return this.finishSuiteResult(suiteResult)
  }

  /**
   * @param {DialogDiffer.Suite} suite
   * @return {Promise<{suite: DialogDiffer.Suite, suiteResultDb: DialogDiffer.Database.SuiteResult}>}
   * @throws {DialogDiffer.Error}
   */
  async initSuiteResult (suite) {
    // get suite result from database or create new suite result in database
    const suiteResultDb = suite.id ? await this.databaseHandler.getSuiteResult(suite.id) : await this.databaseHandler.newSuiteResult(suite)

    // inject Suite id
    suite.id = suiteResultDb.id

    return {suite, suiteResultDb}
  }

  /**
   * @param {DialogDiffer.SuiteResult} suiteResult
   * @return {Promise<{suiteResult: DialogDiffer.SuiteResult, suiteResultDb: DialogDiffer.Database.SuiteResult}>}
   * @throws {DialogDiffer.Error}
   */
  async finishSuiteResult (suiteResult) {
    // duration
    suiteResult.stats.duration = Date.now() - suiteResult.timestamp

    // status
    suiteResult.status = SUITE_CONSTANTS.FINISHED_STATUS

    // dialog results
    Object
      .keys(suiteResult.results)
      .forEach(dialogId => {
        /** @type {DialogDiffer.DialogsResult} */
        const dialogsResult = suiteResult.results[dialogId]

        switch (dialogsResult.result) {
          case DIFFER_CONSTANTS.IDENTICAL_DIFFER_RESULT:
            suiteResult.stats.identical++
            break
          case DIFFER_CONSTANTS.CHANGED_DIFFER_RESULT:
            suiteResult.stats.changed++
            break
          case DIFFER_CONSTANTS.ADDED_DIFFER_RESULT:
            suiteResult.stats.added++
            break
          case DIFFER_CONSTANTS.DELETED_DIFFER_RESULT:
            suiteResult.stats.deleted++
            break
          case DIFFER_CONSTANTS.ERROR_DIFFER_RESULT:
            suiteResult.stats.error++
            break
        }
      })

    // save suite result to database
    await this.databaseHandler.saveSuiteResult(suiteResult)

    // get suite result from database
    const suiteResultDb = await this.databaseHandler.getSuiteResult(suiteResult.id)

    return {suiteResult, suiteResultDb}
  }

  /**
   * @param {DialogDiffer.Suite} suite
   * @param {DialogDiffer.Error} err
   * @return {Promise<DialogDiffer.Suite>}
   * @throws {DialogDiffer.Error}
   */
  async errorSuiteResult (suite, err) {
    if (this.databaseHandler.isInitialized()) {
      await this.databaseHandler.saveSuiteResultError(suite, err)
    }

    return suite
  }

}

module.exports = DifferHandler
