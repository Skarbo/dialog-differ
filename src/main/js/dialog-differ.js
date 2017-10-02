/**
 * @interface DialogDiffer
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
 * @typedef {Object} DialogDiffer.Dialog
 * @property {String} version
 * @property {String} id
 * @property {String} url
 * @property {String} [hash]
 * @property {String} [waitForSelector]
 * @property {Number} [timeout]
 * @property {{code: String, message: String, args: Object, stack: Object}} [error] Injected
 * @property {Array<DialogDiffer.DialogScreenshot>} [screenshots] Injected
 * @memberOf DialogDiffer
 */

/**
 * @typedef {Object} DialogDiffer.Options
 * @property {Array<{width: Number, height: Number}>} sizes
 * @property {String} originalVersion
 * @property {String} currentVersion
 * @property {Boolean} [isForceSnap]
 * @property {Boolean} [isForceDiff]
 * @property {String} [database]
 * @memberOf DialogDiffer
 */

/**
 * @typedef {Object} DialogDiffer.DialogsResult
 * @property {String} dialogId
 * @property {DialogDiffer.Dialog} original
 * @property {DialogDiffer.Dialog} current
 * @property {String} originalVersion
 * @property {String} currentVersion
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
 * @memberOf DialogDiffer
 */

/**
 * @callback DialogDiffer.OnDiffCallback
 * @memberOf DialogDiffer
 */

/**
 * @callback DialogDiffer.OnEndCallback
 * @param {DialogDiffer.Database.SuiteResult} suiteResult
 * @memberOf DialogDiffer
 */

const TAG = 'DialogDiffer';

const DatabaseHandler = require( './handlers/database.handler' );
const SnapHandler = require( './handlers/snap.handler' );
const DifferHandler = require( './handlers/differ.handler' );
const logger = require( './logger' );

const ERROR_CONSTANTS = require( './constants/error-constants' );
const SUITE_CONSTANTS = require( './constants/suite-constants' );
const DIFFER_CONSTANTS = require( './constants/differ-constants' );

const ErrorHelper = require( './helpers/error.helper' );
const SuiteHelper = require( './helpers/suite.helper' );

class DialogDiffer {

    /**
     * @param {DialogDiffer.Suite} suite
     * @param {DialogDiffer.OnStartCallback} [onStart]
     * @param {DialogDiffer.OnSnapCallback} [onSnap]
     * @param {DialogDiffer.OnDiffCallback} [onDiff]
     * @param {DialogDiffer.OnEndCallback} [onEnd]
     * @return {Promise<DialogDiffer.SuiteResult, DialogDiffer.Error>}
     */
    static diff( suite, { onStart = null, onSnap = null, onDiff = null, onEnd = null } = {} ) {
        const databaseHandler = new DatabaseHandler();
        const differHandler = new DifferHandler( databaseHandler );
        const snapHandler = new SnapHandler( databaseHandler );

        return new Promise( ( fulfill, reject ) => {
            SuiteHelper.validateSuite( suite )
                .then( () => databaseHandler.initDB( suite.options.database ) )
                .then( () => differHandler.initSuiteResult( suite, { onStart } ) )
                .then( () => snapHandler.snapSuite( suite, { onSnap } ) )
                .then( () => differHandler.differSuite( suite, { onDiff, onEnd } ) )
                .then( fulfill )
                .catch( err => {
                    logger.error( TAG, 'diff', err.toString(), JSON.stringify( err.args ), err.stack );

                    differHandler
                        .errorSuiteResult( suite, err )
                        .then( () => databaseHandler.getSuiteResult( suite.id ) )
                        .then( suiteResultDb => {
                            if ( onEnd ) {
                                onEnd( suiteResultDb );
                            }

                            reject( ErrorHelper.createError( err, 'Unexpected error', ERROR_CONSTANTS.UNEXPECTED_ERROR ) );
                        } )
                        .catch( () => {
                            reject( ErrorHelper.createError( err, 'Unexpected error', ERROR_CONSTANTS.UNEXPECTED_ERROR ) );
                        } )
                } );
        } );
    }

    /**
     * @param {String} suiteId
     * @param {String} [database]
     * @return {Promise<DialogDiffer.SuiteResult>}
     */
    static getSuiteResult( suiteId, database ) {
        return new Promise( ( fulfill, reject ) => {
            const databaseHandler = new DatabaseHandler();
            console.log( 'getSuiteResult', suiteId );
            /** @type {DialogDiffer.SuiteResult} */
            let suiteResult;

            databaseHandler
                .initDB( database )
                .then( () => {
                    return databaseHandler.getSuiteResult( suiteId );
                } )
                .then( suiteResultDb => {
                    if ( !suiteResultDb || suiteResultDb.status !== SUITE_CONSTANTS.FINISHED_STATUS ) {
                        throw ErrorHelper.createError( null, 'Suite does not exist or is not finished', null, { suiteResultDb } );
                    }

                    suiteResult = suiteResultDb;

                    return Promise.all( suiteResultDb.results.map( suiteResultDialogsResultDb => {
                        return new Promise( ( fulfill, reject ) => {
                            databaseHandler
                                .getDialogsScreenshots( [
                                    { id: suiteResultDialogsResultDb.dialogId, version: suiteResultDialogsResultDb.originalVersion },
                                    { id: suiteResultDialogsResultDb.dialogId, version: suiteResultDialogsResultDb.currentVersion },
                                ], suiteResultDb.options.sizes )
                                .then( fulfill )
                                .catch( reject );
                        } );
                    } ) );
                } )
                .then(
                    /** @type {Array<Array<DialogDiffer.Database.DialogScreenshot>>} */
                    ( results ) => {
                        results.forEach( ( dialogsScreenshotsDb, i ) => {
                            // set original dialog, if result is not added
                            suiteResult.results[i].original = suiteResult.results[i].result !== DIFFER_CONSTANTS.ADDED_DIFFER_RESULT ? {
                                version: suiteResult.results[i].originalVersion,
                                id: suiteResult.results[i].dialogId,
                                screenshots: dialogsScreenshotsDb[0],
                            } : null;

                            // set current dialog, if result is not deleted
                            suiteResult.results[i].current = suiteResult.results[i].result !== DIFFER_CONSTANTS.DELETED_DIFFER_RESULT ? {
                                version: suiteResult.results[i].currentVersion,
                                id: suiteResult.results[i].dialogId,
                                screenshots: dialogsScreenshotsDb[1],
                            } : null;

                            // set default differ results
                            suiteResult.results[i].differ = suiteResult.options.sizes.map( ( _, i ) => {
                                return {
                                    index: i,
                                    result: DIFFER_CONSTANTS.IDENTICAL_DIFFER_RESULT,
                                    base64: null,
                                };
                            } );
                        } );

                        return Promise.all( suiteResult.results.map( suiteResultDialogsResultDb => {
                            return new Promise( ( fulfill, reject ) => {
                                databaseHandler
                                    .getDialogsResult( suiteResult.options, suiteResultDialogsResultDb.dialogId, suiteResultDialogsResultDb.originalVersion, suiteResultDialogsResultDb.currentVersion )
                                    .then( fulfill )
                                    .catch( reject );
                            } );
                        } ) );
                    } )
                .then(
                    /** @type {Array<DialogDiffer.Database.DialogsResult>} */
                    ( results ) => {
                        results.forEach( ( dialogsResultDb, i ) => {
                            if ( dialogsResultDb ) {
                                suiteResult.results[i].differ = dialogsResultDb.differ;
                            }
                            else {
                                // set differ to result
                                suiteResult.results[i].differ.forEach( diffResult => {
                                    diffResult.result = suiteResult.results[i].result;
                                } );
                            }
                        } );

                        return Promise.resolve( suiteResult );
                    } )
                .then( suiteResult => fulfill( suiteResult ) )
                .catch( err => reject( ErrorHelper.createError( err, 'Could not get Suite', ERROR_CONSTANTS.GET_SUITE_ERROR, { suiteId } ) ) )
        } );
    }

    /**
     * @return {Promise<Array<DialogDiffer.SuiteResult>, DialogDiffer.Error>}
     */
    static getLastSuiteResults( database ) {
        return new Promise( ( fulfill, reject ) => {
            const databaseHandler = new DatabaseHandler();

            databaseHandler
                .initDB( database )
                .then( () => databaseHandler.getLastSuiteResults() )
                .then( fulfill )
                .catch( reject );
        } );
    }

}

/**
 * @type {DialogDiffer}
 */
module.exports = DialogDiffer;