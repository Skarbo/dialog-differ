/* eslint-disable no-unused-vars */

/**
 * @abstract
 */
class AbstractDatabaseLayer {
    /**
     * @abstract
     */
    initDB() {
        throw new Error( 'Must be implemented' );
    }

    /**
     * @abstract
     */
    clearDB() {
        throw new Error( 'Must be implemented' );
    }

    /**
     * @abstract
     * @return {Boolean}
     */
    isInitialized() {
        throw new Error( 'Must be implemented' );
    }

    /**
     * @param {String} dialogScreenshotId
     * @return {Promise<DialogDiffer.Database.DialogScreenshot|null>}
     */
    getDialogScreenshotFromId( dialogScreenshotId ) {
        throw new Error( 'Must be implemented' );
    }

    /**
     * @return {Promise<DialogDiffer.Database.DialogScreenshot>}
     */
    getDialogScreenshot( { dialogId, dialogVersion, dialogScreenshotHeight, dialogScreenshotWidth } ) {
        throw new Error( 'Must be implemented' );
    }

    /**
     * @param {String} dialogId
     * @param {String} dialogVersion
     * @param {Array<{width: Number, height: Number}>} sizes
     * @return {Promise<Array<DialogDiffer.Database.DialogScreenshot>>}
     */
    getDialogScreenshots( { dialogId, dialogVersion, sizes } ) {
        throw new Error( 'Must be implemented' );
    }

    /**
     * @param {String} dialogId
     * @param {String} dialogVersion
     * @param {Number} dialogScreenshotHeight
     * @param {Number} dialogScreenshotWidth
     * @param {String} dialogScreenshotBase64
     * @return {Promise<DialogDiffer.Database.DialogScreenshot>}
     */
    newDialogScreenshot( {
        dialogId,
        dialogVersion,
        dialogScreenshotHeight,
        dialogScreenshotWidth,
        dialogScreenshotBase64,
    } ) {
        throw new Error( 'Must be implemented' );
    }

    /**
     * @param {String} dialogScreenshotId
     * @param {String} dialogScreenshotBase64
     * @return {Promise<DialogDiffer.Database.DialogScreenshot>}
     */
    updateDialogScreenshot( {
        dialogScreenshotId,
        dialogScreenshotBase64,
    } ) {
        throw new Error( 'Must be implemented' );
    }

    /**
     * @param {String} dialogVersion
     * @returns {Promise<Boolean>}
     */
    deleteDialogsScreenshots( dialogVersion ) {
        throw new Error( 'Must be implemented' );
    }

    /**
     * @param {String} options
     * @param {String} dialogId
     * @param {String} originalVersion
     * @param {String} currentVersion
     * @returns {Promise<DialogDiffer.Database.DialogsResult>}
     */
    getDialogsResult( { options, dialogId, originalVersion, currentVersion } ) {
        throw new Error( 'Must be implemented' );
    }

    /**
     * @param {String} dialogId
     * @param {String} originalVersion
     * @param {String} currentVersion
     * @param {String} options
     * @param {String} result
     * @param {Array<DialogDiffer.DialogResultDiff>} differ
     * @returns {Promise<DialogDiffer.Database.DialogsResult>}
     */
    newDialogsResult( { dialogId, originalVersion, currentVersion, options, result, differ } ) {
        throw new Error( 'Must be implemented' );
    }

    /**
     * @param {String} suiteId
     * @return {Promise<DialogDiffer.Database.SuiteResult|null>}
     */
    getSuiteResult( suiteId ) {
        throw new Error( 'Must be implemented' );
    }

    /**
     * @return {Promise<Array<DialogDiffer.Database.SuiteResult>>}
     */
    getLastSuiteResults() {
        throw new Error( 'Must be implemented' );
    }

    /**
     * @param {DialogDiffer.Database.SuiteResult} suiteResult
     * @return {Promise<DialogDiffer.Database.SuiteResult>}
     */
    newSuiteResult( suiteResult ) {
        throw new Error( 'Must be implemented' );
    }

    /**
     * @param {String} suiteResultId
     * @param {DialogDiffer.Database.SuiteResult} suiteResult
     * @return {Promise<DialogDiffer.Database.SuiteResult>}
     */
    updateSuiteResult( suiteResultId, suiteResult ) {
        throw new Error( 'Must be implemented' );
    }

    /**
     * @param {String} suiteId
     * @returns {Promise<Boolean>}
     */
    deleteSuiteResult( suiteId ) {
        throw new Error( 'Must be implemented' );
    }
}

module.exports = AbstractDatabaseLayer;