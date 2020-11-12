import fs from 'fs'
import DatabaseHandler from './database.handler'
import looksSame from 'looks-same'
import Bluebird from 'bluebird'
import * as LOGGER_CONSTANTS from '../constants/logger.constants'
import * as DIFFER_CONSTANTS from '../constants/differ.constants'
import * as SUITE_CONSTANTS from '../constants/suite.constants'
import * as SuiteHelper from '../helpers/suite.helper'
import {
  DialogDifferConfig,
  DialogDifferDatabaseSuiteResult,
  DialogDifferDialog,
  DialogDifferDialogResultDiff,
  DialogDifferDialogScreenshot,
  DialogDifferDialogsResult,
  DialogDifferError,
  DialogDifferOnDiff,
  DialogDifferOptions,
  DialogDifferSuite,
  DialogDifferSuiteResult
} from '../interfaces'
import {getConfig} from '../config'
import * as logger from '../logger'

const TAG = 'Differ'
const tmp = require('tmp')

type DifferDialogScreenshotResult = {
  isIdentical: boolean
  base64: string | null
}

export default class DifferHandler {
  private databaseHandler: DatabaseHandler
  private config: DialogDifferConfig

  constructor (databaseHandler: DatabaseHandler, config: DialogDifferConfig = {}) {
    this.databaseHandler = databaseHandler
    this.config = getConfig(config)
  }

  differDialogScreenshot (screenshotOriginal: DialogDifferDialogScreenshot, screenshotCurrent: DialogDifferDialogScreenshot): Promise<DifferDialogScreenshotResult> {
    return new Promise((resolve, reject) => {
      const removeTmpFiles = () => {
        try {
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
        (err, {equal}) => {
          if (err) {
            reject(err)
            removeTmpFiles()
            return
          }

          // identical
          if (equal) {
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
              highlightColor: this.config.diffHighlightColor,
              strict: false,
              tolerance: this.config.diffTolerance,
            }, (err, buffer) => {
              const diff = Buffer.from(buffer)

              if (err) {
                reject(err)
                removeTmpFiles()
                return
              }

              resolve({
                isIdentical: false,
                base64: `data:image/png;base64,${diff.toString('base64')}`
              })
              removeTmpFiles()
            })
          }
        })
    })
  }

  async differDialog (options: DialogDifferOptions, dialogOriginal: DialogDifferDialog | null, dialogCurrent: DialogDifferDialog | null, {onDiff}: { onDiff?: DialogDifferOnDiff } = {}): Promise<DialogDifferDialogsResult> {
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
    const dialogResultDb = await this.databaseHandler.getDialogsResult({
      options,
      dialogId: dialogOriginal.id,
      originalVersion: dialogOriginal.version,
      currentVersion: dialogCurrent.version
    })

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

  async differSuite (suite: DialogDifferSuite, {onDiff}: { onDiff?: DialogDifferOnDiff } = {}): Promise<{ suiteResult: DialogDifferSuiteResult, suiteResultDb: DialogDifferDatabaseSuiteResult }> {
    logger.log(TAG, 'differSuite', 'Differ suite...', null, suite.id)

    // get suite result from database
    const suiteResultDb = await this.databaseHandler.getSuiteResult(suite.id)

    // prepare suite result
    const suiteResult = SuiteHelper.prepareSuiteResults(suite, suiteResultDb)

    // differ dialogs
    const dialogsResults: DialogDifferDialogsResult[] = await Bluebird.map(
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

  async initSuiteResult (suite: DialogDifferSuite): Promise<{ suite: DialogDifferSuite, suiteResultDb: DialogDifferDatabaseSuiteResult }> {
    // get suite result from database or create new suite result in database
    const suiteResultDb = suite.id ? await this.databaseHandler.getSuiteResult(suite.id) : await this.databaseHandler.newSuiteResult(suite)

    // inject Suite id
    suite.id = suiteResultDb.id

    return {suite, suiteResultDb}
  }

  async finishSuiteResult (suiteResult: DialogDifferSuiteResult): Promise<{ suiteResult: DialogDifferSuiteResult, suiteResultDb: DialogDifferDatabaseSuiteResult }> {
    // duration
    suiteResult.stats.duration = Date.now() - suiteResult.timestamp

    // status
    suiteResult.status = SUITE_CONSTANTS.FINISHED_STATUS

    // dialog results
    suiteResult.results.forEach(dialogsResult => {
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

  async errorSuiteResult (suite: DialogDifferSuite, err: DialogDifferError): Promise<DialogDifferSuite> {
    if (this.databaseHandler.isInitialized()) {
      await this.databaseHandler.saveSuiteResultError(suite, err)
    }

    return suite
  }

  private async differDialogWithImageDiff (options: DialogDifferOptions, dialogOriginal: DialogDifferDialog | null, dialogCurrent: DialogDifferDialog | null, {onDiff}: { onDiff?: DialogDifferOnDiff } = {}): Promise<DialogDifferDialogsResult> {
    // prepare dialogs screenshots
    this.prepareDialogScreenshots(dialogOriginal)
    this.prepareDialogScreenshots(dialogCurrent)

    // diff dialogs
    const dialogsDiffers: DifferDialogScreenshotResult[] = await Bluebird.map(
      dialogOriginal.screenshots,
      (screenshot, i) => this.differDialogScreenshot(dialogOriginal.screenshots[i], dialogCurrent.screenshots[i]),
      {concurrency: 10}
    )

    /** @type {DialogDifferDialogsResult} */
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
    await this.databaseHandler.saveDialogsResult({options, dialogsResult})

    if (onDiff) {
      onDiff({dialogsResult})
    }

    return dialogsResult
  }

  private createDialogsResult (dialogOriginal: DialogDifferDialog | null, dialogCurrent: DialogDifferDialog | null, result: string, differ: DialogDifferDialogResultDiff[] = []): DialogDifferDialogsResult {
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

  private prepareDialogScreenshots (dialog: DialogDifferDialog): DialogDifferDialog {
    dialog.screenshots.forEach(screenshot => {
      const tmpFile = tmp.fileSync({
        postfix: '.png'
      })

      screenshot.path = tmpFile.name
      screenshot.removeCallback = tmpFile.removeCallback
      fs.writeFileSync(tmpFile.name, screenshot.base64.replace(/^data:image\/png;base64,/, ''), 'base64')
    })

    return dialog
  }
}
