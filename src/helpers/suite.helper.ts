import * as ERROR_CONSTANTS from '../constants/error.constants'
import * as SUITE_CONSTANTS from '../constants/suite.constants'
import * as ErrorHelper from './error.helper'
import {
  DialogDifferDatabaseSuiteResult, DialogDifferDialog,
  DialogDifferDialogsResult, DialogDifferOptions,
  DialogDifferSuite,
  DialogDifferSuiteResult
} from '../interfaces'

export function prepareSuiteResults (suite: DialogDifferSuite, suiteResultDb: DialogDifferDatabaseSuiteResult = {}): DialogDifferSuiteResult {
  const suiteResult: DialogDifferSuiteResult = {
    id: suiteResultDb && suiteResultDb.id || null,
    status: SUITE_CONSTANTS.RUNNING_STATUS,
    errorCode: null,
    timestamp: suiteResultDb && suiteResultDb.timestamp || Date.now(),
    options: suite.options,
    results: [],
    stats: {
      identical: 0,
      changed: 0,
      added: 0,
      deleted: 0,
      duration: 0,
      error: 0,
      dialogs: (suite.original || []).length + (suite.current || []).length
    },
  }
  const resultsObj: Record<string, DialogDifferDialogsResult> = {}

  const createEmptyResult = (dialogId: string): DialogDifferDialogsResult => {
    return {
      dialogId: dialogId,
      current: null,
      original: null,
      originalVersion: null,
      currentVersion: null,
      result: null,
      differ: []
    }
  }

  suite.current.forEach(dialog => {
    resultsObj[dialog.id] = createEmptyResult(dialog.id)
    resultsObj[dialog.id].current = dialog
    resultsObj[dialog.id].originalVersion = dialog.version
  })

  suite.original.forEach(dialog => {
    if (!resultsObj[dialog.id]) {
      resultsObj[dialog.id] = createEmptyResult(dialog.id)
    }

    resultsObj[dialog.id].original = dialog
    resultsObj[dialog.id].originalVersion = dialog.version
  })

  // append results obj as array
  suiteResult.results = Object.keys(resultsObj).map(dialogId => resultsObj[dialogId])

  return suiteResult
}

export function createUniqueOptionsId (options: DialogDifferOptions): string {
  const sizes = Array.from(options.sizes).sort(size => size.width)
  return sizes.map(size => `${size.width}/${size.height}`).join('/')
}

export function validateSuite (suite: DialogDifferSuite): Promise<boolean> {
  /*
   * Validate options
   */
  if (!suite.options) {
    return Promise.reject(ErrorHelper.createError(null, 'Missing options', ERROR_CONSTANTS.SUITE_OPTIONS_ERROR))
  }

  if (!suite.options.sizes || !Array.isArray(suite.options.sizes) || suite.options.sizes.length === 0) {
    return Promise.reject(ErrorHelper.createError(null, 'Size is not given', ERROR_CONSTANTS.SUITE_OPTIONS_ERROR))
  }

  for (let i = 0; i < suite.options.sizes.length; i++) {
    if (!suite.options.sizes[i].width || !suite.options.sizes[i].height) {
      return Promise.reject(ErrorHelper.createError(null, `Size ${i} is not valid`, ERROR_CONSTANTS.SUITE_OPTIONS_ERROR))
    }
  }

  // validate versions
  if (!suite.options.originalVersion || !suite.options.currentVersion) {
    return Promise.reject(ErrorHelper.createError(null, 'Missing original or current version', ERROR_CONSTANTS.SUITE_OPTIONS_ERROR))
  }

  if (suite.options.originalVersion === suite.options.currentVersion) {
    return Promise.reject(ErrorHelper.createError(null, 'Original version is equal to current version', ERROR_CONSTANTS.SUITE_OPTIONS_ERROR))
  }

  /*
   * Validate dialogs
   */
  const validateDialog = (dialog: DialogDifferDialog, code: string, version: string, i: number) => {
    if (!dialog.version || !dialog.id || !dialog.url) {
      return ErrorHelper.createError(null, `Dialog ${i} is missing version, id or url`, code)
    }
  }

  if (!suite.original || suite.original.length === 0) {
    return Promise.reject(ErrorHelper.createError(null, 'Missing original dialogs', ERROR_CONSTANTS.SUITE_ORIGINAL_DIALOG_ERROR))
  }

  if (!suite.current || suite.current.length === 0) {
    return Promise.reject(ErrorHelper.createError(null, 'Missing current dialogs', ERROR_CONSTANTS.SUITE_CURRENT_DIALOG_ERROR))
  }

  for (let i = 0; i < suite.original.length; i++) {
    const err = validateDialog(suite.original[i], ERROR_CONSTANTS.SUITE_ORIGINAL_DIALOG_ERROR, suite.options.originalVersion, i)

    if (err) {
      return Promise.reject(err)
    }
  }

  for (let i = 0; i < suite.current.length; i++) {
    const err = validateDialog(suite.current[i], ERROR_CONSTANTS.SUITE_CURRENT_DIALOG_ERROR, suite.options.currentVersion, i)

    if (err) {
      return Promise.reject(err)
    }
  }

  return Promise.resolve(true)
}

/**
 * @return Number of current and original dialogs
 **/
export function getNumberOfDialogs (suite: DialogDifferSuite): number {
  return suite.current.length + suite.original.length
}

/**
 * @return Number of unique dialogs
 **/
export function getNumberOfUniqueDialogs (suite: DialogDifferSuite): number {
  return suite.current
    .concat(suite.original)
    .map(dialog => dialog.id)
    .filter((elem, pos, arr) => {
      return arr.indexOf(elem) === pos
    }).length
}
