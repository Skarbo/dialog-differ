/* eslint-disable no-unused-vars */

/**
 * @abstract
 */
class AbstractDatabaseLayer {
  /**
   * @abstract
   * @param {*} [args]
   * @return {Promise<void>}
   */
  initDB (args) {
    throw new Error('Must be implemented')
  }

  /**
   * @abstract
   * @return {Promise<void>}
   */
  clearDB () {
    throw new Error('Must be implemented')
  }

  /**
   * @abstract
   * @return {Boolean}
   */
  isInitialized () {
    throw new Error('Must be implemented')
  }

  /**
   * @abstract
   * @param {String} dialogId
   * @param {String} dialogVersion
   * @param {Number} dialogScreenshotHeight
   * @param {Number} dialogScreenshotWidth
   * @return {Promise<DialogDiffer.Database.DialogScreenshot>}
   */
  getDialogScreenshot ({dialogId, dialogVersion, dialogScreenshotHeight, dialogScreenshotWidth}) {
    throw new Error('Must be implemented')
  }

  /**
   * @abstract
   * @param {String} dialogId
   * @param {String} dialogVersion
   * @param {Array<{width: Number, height: Number}>} sizes
   * @return {Promise<Array<DialogDiffer.Database.DialogScreenshot>>}
   */
  getDialogScreenshots ({dialogId, dialogVersion, sizes}) {
    throw new Error('Must be implemented')
  }

  /**
   * @abstract
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
    throw new Error('Must be implemented')
  }

  /**
   * @abstract
   * @param {String} dialogScreenshotId
   * @param {String} dialogScreenshotBase64
   * @return {Promise<DialogDiffer.Database.DialogScreenshot>}
   */
  updateDialogScreenshot ({
    dialogScreenshotId,
    dialogScreenshotBase64,
  }) {
    throw new Error('Must be implemented')
  }

  /**
   * @abstract
   * @param {String} dialogVersion
   * @returns {Promise<Boolean>}
   */
  deleteDialogsScreenshots (dialogVersion) {
    throw new Error('Must be implemented')
  }

  /**
   * @abstract
   * @param {String} options
   * @param {String} dialogId
   * @param {String} originalVersion
   * @param {String} currentVersion
   * @returns {Promise<DialogDiffer.Database.DialogsResult>}
   */
  getDialogsResult ({options, dialogId, originalVersion, currentVersion}) {
    throw new Error('Must be implemented')
  }

  /**
   * @abstract
   * @param {DialogDiffer.Database.DialogsResult} dialogsResult
   * @returns {Promise<DialogDiffer.Database.DialogsResult>}
   */
  newDialogsResult (dialogsResult) {
    throw new Error('Must be implemented')
  }

  /**
   * @abstract
   * @param {String} suiteId
   * @return {Promise<DialogDiffer.Database.SuiteResult|null>}
   */
  getSuiteResult (suiteId) {
    throw new Error('Must be implemented')
  }

  /**
   * @abstract
   * @return {Promise<Array<DialogDiffer.Database.SuiteResult>>}
   */
  getLastSuiteResults () {
    throw new Error('Must be implemented')
  }

  /**
   * @abstract
   * @param {DialogDiffer.Database.SuiteResult} suiteResult
   * @return {Promise<DialogDiffer.Database.SuiteResult>}
   */
  newSuiteResult (suiteResult) {
    throw new Error('Must be implemented')
  }

  /**
   * @abstract
   * @param {String} suiteResultId
   * @param {DialogDiffer.Database.SuiteResult} suiteResult
   * @return {Promise<DialogDiffer.Database.SuiteResult>}
   */
  updateSuiteResult (suiteResultId, suiteResult) {
    throw new Error('Must be implemented')
  }

  /**
   * @abstract
   * @param {String} suiteId
   * @returns {Promise<Boolean>}
   */
  deleteSuiteResult (suiteId) {
    throw new Error('Must be implemented')
  }
}

module.exports = AbstractDatabaseLayer
