const TAG = 'Differ'

const tmp = require('tmp')
const path = require('path')
const imageDiff = require('image-diff')
const base64Img = require('base64-img')
const Promise = require('bluebird')

const LOGGER_CONSTANTS = require('../constants/logger.constants')
const DIFFER_CONSTANTS = require('../constants/differ.constants')
const SUITE_CONSTANTS = require('../constants/suite.constants')

const SuiteHelper = require('../helpers/suite.helper')
const DialogHelper = require('../helpers/dialog.helper')
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
   */
  constructor (databaseHandler) {
    this.databaseHandler = databaseHandler
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
    return new Promise((fulfill, reject) => {
      const tmpFile = tmp.fileSync({
        postfix: '.png'
      })

      imageDiff({
        expectedImage: screenshotCurrent.path,
        actualImage: screenshotOriginal.path,
        diffImage: tmpFile.name
      }, (err, isIdentical) => {
        if (err) {
          reject(err)
          return
        }

        fulfill({
          isIdentical: isIdentical,
          base64: !isIdentical ? base64Img.base64Sync(tmpFile.name) : null
        })

        // remove tmp files
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
      })
    })
  }

  /**
   * @param {DialogDiffer.Options} options
   * @param {DialogDiffer.Dialog|null} dialogOriginal
   * @param {DialogDiffer.Dialog|null} dialogCurrent
   * @returns {Promise<DialogDiffer.DialogsResult>}
   * @throws {DialogDiffer.Error}
   */
  async differDialog (options, dialogOriginal, dialogCurrent) {
    // dialog deleted or added
    if (!dialogOriginal || !dialogCurrent) {
      return this.createDialogsResult(
        dialogOriginal,
        dialogCurrent,
        !dialogCurrent ? DIFFER_CONSTANTS.DELETED_DIFFER_RESULT : DIFFER_CONSTANTS.ADDED_DIFFER_RESULT,
        []
      )
    }

    // dialog error
    if (dialogOriginal.error || dialogCurrent.error) {
      return this.createDialogsResult(
        dialogOriginal,
        dialogCurrent,
        DIFFER_CONSTANTS.ERROR_DIFFER_RESULT,
        []
      )
    }

    // get dialog result from database
    const dialogResultDb = await this.databaseHandler.getDialogsResult(options, dialogOriginal.id, dialogOriginal.version, dialogCurrent.version)

    // use dialog result from database
    if (dialogResultDb && !options.isForceDiff) {
      logger.info(
        TAG,
        'differDialog',
        'Using dialogs \'%s\' and \'%s\' diff result from database',
        LOGGER_CONSTANTS.DIALOG_DIFF_FROM_DATABASE_LOGGER,
        DialogHelper.createUniqueDialogId(dialogOriginal),
        DialogHelper.createUniqueDialogId(dialogCurrent)
      )

      return this.createDialogsResult(
        dialogOriginal,
        dialogCurrent,
        dialogResultDb.result,
        dialogResultDb.differ
      )
    }
    // get dialog result from image diff
    else {
      logger.info(
        TAG,
        'differDialog',
        'Getting dialogs \'%s\' and \'%s\' diff result from image diff',
        LOGGER_CONSTANTS.DIALOG_DIFF_FROM_IMAGE_DIFF_LOGGER,
        DialogHelper.createUniqueDialogId(dialogOriginal),
        DialogHelper.createUniqueDialogId(dialogCurrent)
      )

      return this.differDialogWithImageDiff(options, dialogOriginal, dialogCurrent)
    }
  }

  /**
   * @param {DialogDiffer.Options} options
   * @param {DialogDiffer.Dialog|null} dialogOriginal
   * @param {DialogDiffer.Dialog|null} dialogCurrent
   * @returns {Promise<DialogDiffer.DialogsResult>}
   * @throws {DialogDiffer.Error}
   * @private
   */
  async differDialogWithImageDiff (options, dialogOriginal, dialogCurrent) {
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

    // save dialogs result to database
    await this.databaseHandler.saveDialogsResult(options, dialogOriginal, dialogCurrent, dialogsResult)

    return dialogsResult
  }

  /**
   * @param {DialogDiffer.Suite} suite
   * @param {DialogDiffer.OnEndCallback} [onEnd]
   * @returns {Promise<DialogDiffer.SuiteResult>}
   */
  async differSuite (suite, {onEnd = null} = {}) {
    logger.log(TAG, 'differSuite', 'Differ suite...', null, suite.id)

    // get suite result from database
    const suiteResultDb = await this.databaseHandler.getSuiteResult(suite.id)

    // prepare suite result
    const suiteResult = SuiteHelper.prepareSuiteResults(suite, suiteResultDb)

    // differ dialogs
    /** @type {Array<DialogDiffer.DialogsResult>} */
    const dialogsResults = await Promise.map(
      suiteResult.results,
      result => this.differDialog(suite.options, result.original, result.current),
      {concurrency: 10}
    )

    logger.log(TAG, 'differSuite', 'Diffed suite', null, suite.id)

    dialogsResults.forEach((dialogResult, i) => {
      suiteResult.results[i] = dialogResult
    })

    // finish suite result
    return this.finishSuiteResult(suiteResult, {onEnd})
  }

  /**
   * @param {DialogDiffer.Suite} suite
   * @param {DialogDiffer.OnStartCallback} [onStart]
   * @return {Promise<DialogDiffer.Suite>}
   * @throws {DialogDiffer.Error}
   */
  async initSuiteResult (suite, {onStart = null} = {}) {
    // get suite result from database or create new suite result in database
    const suiteResultDb = suite.id ? await this.databaseHandler.getSuiteResult(suite.id) : await this.databaseHandler.newSuiteResult(suite)

    // inject Suite id
    suite.id = suiteResultDb.id

    if (onStart) {
      onStart(suiteResultDb)
    }

    return suite
  }

  /**
   * @param {DialogDiffer.SuiteResult} suiteResult
   * @param {DialogDiffer.OnEndCallback} [onEnd]
   * @return {Promise<DialogDiffer.SuiteResult>}
   * @throws {DialogDiffer.Error}
   */
  async finishSuiteResult (suiteResult, {onEnd = null} = {}) {
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

    if (onEnd) {
      onEnd(suiteResultDb)
    }

    return suiteResult
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
