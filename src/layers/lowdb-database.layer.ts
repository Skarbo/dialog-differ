import lowdb, {LowdbSync} from 'lowdb'
import FileSync from 'lowdb/adapters/FileSync'
import Memory from 'lowdb/adapters/Memory'
import AbstractDatabaseLayer, {
  GetDialogScreenshot,
  GetDialogScreenshots,
  GetDialogsResult,
  NewDialogScreenshot,
  UpdateDialogScreenshot
} from './abstract-database.layer'
import {
  DialogDifferDatabaseDialogScreenshot,
  DialogDifferDatabaseDialogsResult,
  DialogDifferDatabaseSuiteResult
} from '../interfaces'

const DIALOG_SCREENSHOTS_DB = 'dialog_screenshots'
const DIALOG_DIFFS_RESULT_DB = 'dialog_diffs_result'
const SUITE_RESULT_DB = 'suite_result'

let db: LowdbSync<{ dialog_screenshots: DialogDifferDatabaseDialogScreenshot[], dialog_diffs_result: DialogDifferDatabaseDialogsResult[], suite_result: DialogDifferDatabaseSuiteResult[] }>

export default class LowDbDatabaseLayer extends AbstractDatabaseLayer {
  /**
   * @param [dbFile] Uses in-memory if not given
   */
  async initDB (dbFile: string = null): Promise<void> {
    if (!db) {
      db = lowdb(dbFile ? new FileSync(dbFile) : new Memory(null))

      db._.mixin(require('lodash-id'))
    }

    db
      .defaults({
        [DIALOG_SCREENSHOTS_DB]: [],
        [DIALOG_DIFFS_RESULT_DB]: [],
        [SUITE_RESULT_DB]: [],
      })
      .write()

    return Promise.resolve()
  }

  clearDB () {
    return new Promise(resolve => {
      if (db) {
        db.setState({
          [DIALOG_SCREENSHOTS_DB]: [],
          [DIALOG_DIFFS_RESULT_DB]: [],
          [SUITE_RESULT_DB]: [],
        })
      }
      resolve()
    }) as Promise<void>
  }

  isInitialized () {
    return !!db
  }

  getDialogScreenshotFromId (dialogScreenshotId: string): Promise<DialogDifferDatabaseDialogScreenshot> {
    return new Promise<DialogDifferDatabaseDialogScreenshot>((resolve, reject) => {
      try {
        return resolve(db
          .get('dialog_screenshots')
          .find({
            id: dialogScreenshotId
          })
          .value())
      }
      catch (err) {
        return reject(err)
      }
    })
  }

  getDialogScreenshot ({dialogId, dialogVersion, dialogScreenshotHeight, dialogScreenshotWidth}: GetDialogScreenshot) {
    return new Promise<DialogDifferDatabaseDialogScreenshot>((resolve, reject) => {
      try {
        return resolve(db
          .get('dialog_screenshots')
          .find({
            dialogId: dialogId,
            dialogVersion: dialogVersion,
            height: dialogScreenshotHeight,
            width: dialogScreenshotWidth,
          })
          .value())
      }
      catch (err) {
        return reject(err)
      }
    })
  }

  getDialogScreenshots ({dialogId, dialogVersion, sizes}: GetDialogScreenshots) {
    return new Promise<DialogDifferDatabaseDialogScreenshot[]>((resolve, reject) => {
      try {
        return resolve(db
          .get('dialog_screenshots')
          .filter(dialogScreenshotDb => {
            const isCorrectSize = sizes.filter(size => size.width === dialogScreenshotDb.width && size.height === dialogScreenshotDb.height).length > 0

            return dialogScreenshotDb.dialogId === dialogId && dialogScreenshotDb.dialogVersion === dialogVersion && isCorrectSize
          })
          .value())
      }
      catch (err) {
        return reject(err)
      }
    })
  }

  newDialogScreenshot ({
                         dialogId,
                         dialogVersion,
                         dialogScreenshotHeight,
                         dialogScreenshotWidth,
                         dialogScreenshotBase64,
                       }: NewDialogScreenshot) {
    return new Promise<DialogDifferDatabaseDialogScreenshot>((resolve, reject) => {
      try {
        return resolve(db
          .get('dialog_screenshots')
          // @ts-ignore
          .insert({
            dialogId: dialogId,
            dialogVersion: dialogVersion,
            height: dialogScreenshotHeight,
            width: dialogScreenshotWidth,
            base64: dialogScreenshotBase64,
          })
          .write())
      }
      catch (err) {
        return reject(err)
      }
    })
  }

  updateDialogScreenshot ({
                            dialogScreenshotId,
                            dialogScreenshotBase64,
                          }: UpdateDialogScreenshot) {
    try {
      db
        .get('dialog_screenshots')
        .find({
          id: dialogScreenshotId
        })
        .assign({
          base64: dialogScreenshotBase64
        })
        .write()

      return this.getDialogScreenshotFromId(dialogScreenshotId)
    }
    catch (err) {
      return Promise.reject(err)
    }
  }

  deleteDialogsScreenshots (dialogVersion: string) {
    return new Promise<boolean>((resolve, reject) => {
      try {
        db.get('dialog_screenshots')
          .remove({
            dialogVersion: dialogVersion,
          })
          .write()

        return resolve(true)
      }
      catch (err) {
        return reject(err)
      }
    })
  }

  /*
   * DIALOG RESULT
   */

  /**
   * @param {String} options
   * @param {String} dialogId
   * @param {String} originalVersion
   * @param {String} currentVersion
   * @returns {Promise<DialogDifferDatabaseDialogsResult>}
   */
  getDialogsResult ({options, dialogId, originalVersion, currentVersion}: GetDialogsResult) {
    return new Promise<DialogDifferDatabaseDialogsResult>((resolve, reject) => {
      try {
        const dialogsDiffResultDb = db
          .get('dialog_diffs_result')
          .find({
            dialogId: dialogId,
            originalVersion: originalVersion,
            currentVersion: currentVersion,
            options: options,
          })
          .value()

        resolve(dialogsDiffResultDb)
      }
      catch (err) {
        reject(err)
      }
    })
  }

  /**
   * @param {DialogDifferDatabaseDialogsResult} dialogsResult
   * @returns {Promise<DialogDifferDatabaseDialogsResult>}
   */
  newDialogsResult (dialogsResult: DialogDifferDatabaseDialogsResult) {
    return new Promise<DialogDifferDatabaseDialogsResult>((resolve, reject) => {
      try {
        const dialogsResultDb = db
          .get('dialog_diffs_result')
          // @ts-ignore
          .insert(dialogsResult)
          .write()

        resolve(dialogsResultDb)
      }
      catch (err) {
        reject(err)
      }
    })
  }

  /*
   * SUITE RESULT
   */

  getSuiteResult (suiteId: string) {
    return new Promise<DialogDifferDatabaseSuiteResult | null>((resolve, reject) => {
      try {
        const suiteResultsDb = db
          .get('suite_result')
          .find({id: suiteId})
          .value()

        resolve(suiteResultsDb || null)
      }
      catch (err) {
        reject(err)
      }
    })
  }

  getLastSuiteResults () {
    return new Promise<DialogDifferDatabaseSuiteResult[]>((resolve, reject) => {
      try {
        const suiteResultsDb = db
          .get('suite_result')
          .sortBy('timestamp')
          .reverse()
          .value()

        resolve(suiteResultsDb)
      }
      catch (err) {
        reject(err)
      }
    })
  }

  newSuiteResult (suiteResult: DialogDifferDatabaseSuiteResult) {
    return new Promise<DialogDifferDatabaseSuiteResult>((resolve, reject) => {
      try {
        const suiteResultDb = db
          .get('suite_result')
          // @ts-ignore
          .insert(suiteResult)
          .write()

        resolve(suiteResultDb)
      }
      catch (err) {
        reject(err)
      }
    })
  }

  updateSuiteResult (suiteResultId: string, suiteResult: DialogDifferDatabaseSuiteResult) {
    return new Promise<DialogDifferDatabaseSuiteResult>((resolve, reject) => {
      try {
        const suiteResultDb = db
          .get('suite_result')
          .find({id: suiteResultId})
          .assign(suiteResult)
          .write()

        resolve(suiteResultDb)
      }
      catch (err) {
        reject(err)
      }
    })
  }

  deleteSuiteResult (suiteId: string) {
    return new Promise<boolean>((resolve, reject) => {
      try {
        db.get('suite_result')
          .remove({
            id: suiteId,
          })
          .write()

        resolve(true)
      }
      catch (err) {
        reject(err)
      }
    })
  }
}
