import AbstractDatabaseLayer from '../layers/abstract-database.layer'
import * as SuiteHelper from '../helpers/suite.helper'
import * as DialogHelper from '../helpers/dialog.helper'
import * as ErrorHelper from '../helpers/error.helper'
import * as ERROR_CONSTANTS from '../constants/error.constants'
import * as SUITE_CONSTANTS from '../constants/suite.constants'
import LowDbDatabaseLayer from '../layers/lowdb-database.layer'
import {
  DialogDifferDatabaseDialogScreenshot,
  DialogDifferDatabaseDialogsResult,
  DialogDifferDatabaseSearchDialogScreenshot,
  DialogDifferDatabaseSuiteResult,
  DialogDifferDatabaseSuiteResultDialogsResult,
  DialogDifferDialog,
  DialogDifferDialogScreenshot,
  DialogDifferDialogsResult,
  DialogDifferError,
  DialogDifferOptions,
  DialogDifferSize,
  DialogDifferSuite,
  DialogDifferSuiteResult
} from '../interfaces'

require('string-format-js')

export default class DatabaseHandler {
  private readonly databaseLayer: AbstractDatabaseLayer

  /**
   * @param [databaseLayer] Uses {@link LowDbDatabaseLayer} as default
   */
  constructor (databaseLayer: AbstractDatabaseLayer = null) {
    this.databaseLayer = databaseLayer || new LowDbDatabaseLayer()
  }

  initDB (args?: unknown): Promise<void> {
    return this.databaseLayer.initDB(args)
  }

  clearDB (): Promise<void> {
    return this.databaseLayer ? this.databaseLayer.clearDB() : Promise.resolve()
  }

  isInitialized (): boolean {
    return this.databaseLayer ? this.databaseLayer.isInitialized() : false
  }

  /*
   * DIALOG SCREENSHOT
   */

  async saveDialogScreenshot (dialog: DialogDifferDialog, dialogScreenshot: DialogDifferDialogScreenshot): Promise<DialogDifferDatabaseDialogScreenshot> {
    try {
      const dialogScreenshotDb = await this.getDialogScreenshot(dialog, dialogScreenshot)

      if (dialogScreenshotDb) {
        return this.databaseLayer.updateDialogScreenshot({
          dialogScreenshotId: dialogScreenshotDb.id,
          dialogScreenshotBase64: dialogScreenshot.base64
        })
      }
      else {
        return this.databaseLayer.newDialogScreenshot({
          dialogId: dialog.id,
          dialogVersion: dialog.version,
          dialogScreenshotHeight: dialogScreenshot.height,
          dialogScreenshotWidth: dialogScreenshot.width,
          dialogScreenshotBase64: dialogScreenshot.base64,
        })
      }
    }
    catch (err) {
      throw ErrorHelper.createError(err, 'Could not save dialog screenshot', ERROR_CONSTANTS.SAVE_DIALOG_SCREENSHOT_DB_ERROR, {
        dialog,
        dialogScreenshot
      })
    }
  }

  getDialogScreenshot (dialog: DialogDifferDialog, dialogScreenshot: DialogDifferDatabaseSearchDialogScreenshot): Promise<DialogDifferDatabaseDialogScreenshot> {
    try {
      return this.databaseLayer.getDialogScreenshot({
        dialogId: dialog.id,
        dialogVersion: dialog.version,
        dialogScreenshotWidth: dialogScreenshot.width,
        dialogScreenshotHeight: dialogScreenshot.height,
      })
    }
    catch (err) {
      throw ErrorHelper.createError(err, 'Could not get dialog screenshot', ERROR_CONSTANTS.GET_DIALOG_SCREENSHOT_DB_ERROR, {
        dialog,
        dialogScreenshot
      })
    }
  }

  getDialogScreenshots (dialog: DialogDifferDialog, sizes: DialogDifferSize[]): Promise<DialogDifferDatabaseDialogScreenshot[]> {
    try {
      return this.databaseLayer.getDialogScreenshots({
        dialogId: dialog.id,
        dialogVersion: dialog.version,
        sizes,
      })
    }
    catch (err) {
      throw ErrorHelper.createError(err, 'Could not get dialog screenshots', ERROR_CONSTANTS.GET_DIALOG_SCREENSHOTS_DB_ERROR, {dialog})
    }
  }

  getDialogsScreenshots (dialogs: DialogDifferDialog[], sizes: DialogDifferSize[]): Promise<DialogDifferDatabaseDialogScreenshot[][]> {
    try {
      return Promise.all(dialogs.map(dialog => this.getDialogScreenshots(dialog, DialogHelper.getDialogSizes(sizes, dialog))))
    }
    catch (err) {
      throw ErrorHelper.createError(err, 'Could not get dialog screenshots', ERROR_CONSTANTS.GET_DIALOGS_SCREENSHOTS_DB_ERROR, {dialogs})
    }
  }

  deleteDialogsScreenshots (dialogVersion: string): Promise<boolean> {
    try {
      return this.databaseLayer.deleteDialogsScreenshots(dialogVersion)
    }
    catch (err) {
      throw ErrorHelper.createError(err, 'Could not delete dialog screenshots', ERROR_CONSTANTS.DELETE_DIALOGS_SCREENSHOTS_DB_ERROR, {dialogVersion})
    }
  }

  /*
   * DIALOGS RESULT
   */

  async saveDialogsResult ({options, dialogsResult}: { options: DialogDifferOptions, dialogsResult: DialogDifferDialogsResult }): Promise<{ dialogsResult: DialogDifferDialogsResult, dialogsResultDb: DialogDifferDatabaseDialogsResult }> {
    try {
      const dialogsResultDb = await this.databaseLayer.newDialogsResult({
        dialogId: dialogsResult.dialogId,
        originalVersion: dialogsResult.originalVersion,
        currentVersion: dialogsResult.currentVersion,
        options: SuiteHelper.createUniqueOptionsId(options),
        result: dialogsResult.result,
        differ: dialogsResult.differ,
      })

      return {dialogsResult: dialogsResult, dialogsResultDb: dialogsResultDb}
    }
    catch (err) {
      throw ErrorHelper.createError(err, 'Could not save dialogs diff result', ERROR_CONSTANTS.SAVE_DIALOGS_DIFF_RESULT_DB_ERROR, {
        options,
        dialogsResult,
      })
    }
  }

  getDialogsResult ({options, dialogId, originalVersion, currentVersion}: { options: DialogDifferOptions, dialogId: string, originalVersion: string, currentVersion: string }): Promise<DialogDifferDatabaseDialogsResult> {
    try {
      return this.databaseLayer.getDialogsResult({
        dialogId: dialogId,
        originalVersion: originalVersion,
        currentVersion: currentVersion,
        options: SuiteHelper.createUniqueOptionsId(options),
      })
    }
    catch (err) {
      throw ErrorHelper.createError(err, 'Could not get dialogs diff result', ERROR_CONSTANTS.GET_DIALOG_SCREENSHOT_DB_ERROR, {
        options,
        dialogId,
        originalVersion,
        currentVersion
      })
    }
  }

  /*
   * SUITE RESULT
   */

  newSuiteResult (suite: DialogDifferSuite): Promise<DialogDifferDatabaseSuiteResult> {
    try {
      return this.databaseLayer.newSuiteResult({
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
        results: []
      })
    }
    catch (err) {
      throw ErrorHelper.createError(err, 'Could not save suite result', ERROR_CONSTANTS.NEW_SUITE_RESULT_DB_ERROR, {suite})
    }
  }

  saveSuiteResult (suiteResult: DialogDifferSuiteResult): Promise<DialogDifferDatabaseSuiteResult> {
    const createErrorObj = (dialog: DialogDifferDialog | null) => {
      if (!dialog || !dialog.error) {
        return null
      }
      return {
        code: dialog.error.code,
        // @ts-ignore
        // eslint-disable-next-line prefer-spread
        message: (dialog.error.message || '').format.apply(dialog.error.message || '', dialog.error.args),
      }
    }

    try {
      const results: DialogDifferDatabaseSuiteResultDialogsResult[] = suiteResult.results
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
          } as DialogDifferDatabaseSuiteResultDialogsResult
        })

      return this.databaseLayer.updateSuiteResult(suiteResult.id, {
        status: suiteResult.status,
        stats: suiteResult.stats,
        results
      })
    }
    catch (err) {
      throw ErrorHelper.createError(err, 'Could not save suite result', ERROR_CONSTANTS.SAVE_SUITE_RESULT_DB_ERROR, {suiteResult})
    }
  }

  saveSuiteResultError (suite: DialogDifferSuite, err: DialogDifferError): Promise<DialogDifferSuiteResult> {
    try {
      // @ts-ignore
      return this.databaseLayer.updateSuiteResult(suite.id, {
        status: SUITE_CONSTANTS.ERROR_STATUS,
        errorCode: err.code,
      })
    }
    catch (err) {
      throw ErrorHelper.createError(err, 'Could not save suite result', ERROR_CONSTANTS.SAVE_SUITE_RESULT_DB_ERROR, {suite})
    }
  }

  getSuiteResult (suiteId: string): Promise<DialogDifferDatabaseSuiteResult | null> {
    try {
      return this.databaseLayer.getSuiteResult(suiteId)
    }
    catch (err) {
      throw ErrorHelper.createError(err, 'Could not get suite results', ERROR_CONSTANTS.GET_SUITE_RESULTS_DB_ERROR)
    }
  }

  getLastSuiteResults (): Promise<DialogDifferDatabaseSuiteResult[]> {
    try {
      return this.databaseLayer.getLastSuiteResults()
    }
    catch (err) {
      throw ErrorHelper.createError(err, 'Could not get suite results', ERROR_CONSTANTS.GET_SUITE_RESULTS_DB_ERROR)
    }
  }

  deleteSuiteResult (suiteId: string): Promise<boolean> {
    try {
      return this.databaseLayer.deleteSuiteResult(suiteId)
    }
    catch (err) {
      throw ErrorHelper.createError(err, 'Could not delete suite result', ERROR_CONSTANTS.DELETE_SUITE_RESULT_DB_ERROR, {suiteId})
    }
  }

  async deleteSuiteResults (keepLatest: number): Promise<boolean> {
    try {
      const suiteResults = await this.getLastSuiteResults()

      await Promise.all(suiteResults.slice(keepLatest).map(suiteResult => this.deleteSuiteResult(suiteResult.id)))

      return true
    }
    catch (err) {
      throw ErrorHelper.createError(err, 'Could not delete suite result', ERROR_CONSTANTS.DELETE_SUITE_RESULTS_DB_ERROR, {keepLatest})
    }
  }
}
