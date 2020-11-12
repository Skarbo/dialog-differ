import DatabaseHandler from './handlers/database.handler'
import SnapHandler from './handlers/snap.handler'
import DifferHandler from './handlers/differ.handler'
import * as logger from './logger'
import {getConfig} from './config'
import * as ERROR_CONSTANTS from './constants/error.constants'
import * as SUITE_CONSTANTS from './constants/suite.constants'
import * as DIFFER_CONSTANTS from './constants/differ.constants'
import * as LOGGER_CONSTANTS from './constants/logger.constants'
import * as ErrorHelper from './helpers/error.helper'
import * as SuiteHelper from './helpers/suite.helper'
import * as DialogHelper from './helpers/dialog.helper'
import AbstractDatabaseLayer from './layers/abstract-database.layer'
import {
  DialogDifferConfig,
  DialogDifferDatabaseDialogScreenshot,
  DialogDifferDatabaseSuiteResult,
  DialogDifferDialog,
  DialogDifferOnDiff,
  DialogDifferOnEnd,
  DialogDifferOnProgress,
  DialogDifferOnSnap,
  DialogDifferOnStart,
  DialogDifferSuite,
  DialogDifferSuiteResult
} from './interfaces'
export * from './interfaces'

process.setMaxListeners(0) // needed for puppeteer

const TAG = 'DialogDiffer'

export default class DialogDiffer {
  readonly databaseHandler: DatabaseHandler
  differHandler: DifferHandler
  snapHandler: SnapHandler

  constructor ({
                 databaseLayer = null,
                 databaseHandler = null,
                 differHandler = null,
                 snapHandler = null,
                 config = {}
               }: {
    databaseLayer?: AbstractDatabaseLayer
    databaseHandler?: DatabaseHandler,
    differHandler?: DifferHandler
    snapHandler?: SnapHandler
    config?: DialogDifferConfig
  } = {}) {
    logger.setLevel(getConfig(config).logLevel)
    this.databaseHandler = databaseHandler || new DatabaseHandler(databaseLayer)
    this.differHandler = differHandler || new DifferHandler(this.databaseHandler, config)
    this.snapHandler = snapHandler || new SnapHandler(this.databaseHandler, config)
  }

  initDialogDiffer ({databaseArgs = null}: { databaseArgs?: unknown } = {}): Promise<void> {
    return this.databaseHandler.initDB(databaseArgs)
  }

  async diff (suite: DialogDifferSuite, {
    onStart = null,
    onSnapStart = null,
    onSnap = null,
    onSnapEnd = null,
    onDiffStart = null,
    onDiff = null,
    onDiffEnd = null,
    onEnd = null,
  }: {
    onStart?: DialogDifferOnStart
    onSnapStart?: DialogDifferOnProgress,
    onSnap?: DialogDifferOnSnap,
    onSnapEnd?: DialogDifferOnProgress,
    onDiffStart?: DialogDifferOnProgress,
    onDiff?: DialogDifferOnDiff,
    onDiffEnd?: DialogDifferOnProgress,
    onEnd?: DialogDifferOnEnd
  } = {}): Promise<DialogDifferSuiteResult> {
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

  async getSuiteResult (suiteId: string): Promise<DialogDifferSuiteResult> {
    try {
      // get suite result from database
      const suiteResultDb = await this.databaseHandler.getSuiteResult(suiteId)

      // suite result must be finished
      if (!suiteResultDb || suiteResultDb.status !== SUITE_CONSTANTS.FINISHED_STATUS) {
        throw ErrorHelper.createError(null, 'Suite does not exist or is not finished', null, {suiteResultDb})
      }

      const suiteResult: DialogDifferSuiteResult = {...suiteResultDb} as DialogDifferSuiteResult

      // get dialogs screenshots
      const dialogsScreenshotsMapDb: DialogDifferDatabaseDialogScreenshot[][][] = await Promise.all(suiteResultDb.results.map(suiteResultDialogsResultDb => {
        return this.databaseHandler.getDialogsScreenshots([
          {
            id: suiteResultDialogsResultDb.dialogId,
            version: suiteResultDialogsResultDb.originalVersion
          } as DialogDifferDialog,
          {
            id: suiteResultDialogsResultDb.dialogId,
            version: suiteResultDialogsResultDb.currentVersion
          } as DialogDifferDialog,
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

      /** @type {Array<DialogDifferDatabaseDialogsResult>} */
      const dialogsResultsDb = await Promise.all(suiteResult.results.map(suiteResultDialogsResultDb => {
        return this.databaseHandler.getDialogsResult({
          options: suiteResult.options,
          dialogId: suiteResultDialogsResultDb.dialogId,
          originalVersion: suiteResultDialogsResultDb.originalVersion,
          currentVersion: suiteResultDialogsResultDb.currentVersion
        })
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

  getLastSuiteResults (): Promise<DialogDifferDatabaseSuiteResult[]> {
    return this.databaseHandler.getLastSuiteResults()
  }

  deleteDialogs (dialogVersion: string): Promise<boolean> {
    return this.databaseHandler.deleteDialogsScreenshots(dialogVersion)
  }

  deleteSuiteResult (suiteId: string): Promise<boolean> {
    return this.databaseHandler.deleteSuiteResult(suiteId)
  }

  deleteSuiteResults (keepLatest = 3): Promise<boolean> {
    return this.databaseHandler.deleteSuiteResults(keepLatest)
  }
}

export {ERROR_CONSTANTS}
export {SUITE_CONSTANTS}
export {DIFFER_CONSTANTS}
export {LOGGER_CONSTANTS}

