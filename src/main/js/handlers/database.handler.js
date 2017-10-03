const lowDB = require( 'lowdb' );

const ERROR_CONSTANTS = require( '../constants/error-constants' );
const SUITE_CONSTANTS = require( '../constants/suite-constants' );

const SuiteHelper = require( '../helpers/suite.helper' );
const ErrorHelper = require( '../helpers/error.helper' );

const DIALOG_SCREENSHOTS_DB = 'dialog_screenshots';
const DIALOG_DIFFS_RESULT_DB = 'dialog_diffs_result';
const SUITE_RESULT_DB = 'suite_result';

/**
 * @interface DialogDiffer.Database
 * @memberOf DialogDiffer
 */

/**
 * @typedef {Object} DialogDiffer.Database.SearchDialogScreenshot
 * @property {Number} width
 * @property {Number} height
 * @memberOf DialogDiffer.Database
 */

/**
 * @typedef {Object} DialogDiffer.Database.DialogScreenshot
 * @property {String} id
 * @property {String} dialogId
 * @property {String} dialogVersion
 * @property {String} base64
 * @property {Number} height
 * @property {Number} width
 * @memberOf DialogDiffer.Database
 */

/**
 * @typedef {Object} DialogDiffer.Database.DialogsResult
 * @property {String} dialogId
 * @property {String} originalVersion
 * @property {String} currentVersion
 * @property {String} result
 * @property {Array<DialogDiffer.DialogResultDiff>} differ
 * @memberOf DialogDiffer.Database
 */

/**
 * @typedef {Object} DialogDiffer.Database.SuiteResultDialogsResult
 * @property {String} dialogId
 * @property {String} originalVersion
 * @property {String} currentVersion
 * @property {String} result
 * @memberOf DialogDiffer.Database
 */

/**
 * @typedef {Object} DialogDiffer.Database.SuiteResult
 * @property {String} id
 * @property {String} status
 * @property {String|null} errorCode
 * @property {Number} timestamp
 * @property {DialogDiffer.Options} options
 * @property {DialogDiffer.SuiteStats} stats
 * @property {Array<DialogDiffer.Database.SuiteResultDialogsResult>} results
 * @memberOf DialogDiffer.Database
 */

let db = null;

/**
 * @class
 */
class DatabaseHandler {
    /**
     * @param {String} [dbFile] Uses in-memory if not given
     */
    initDB( dbFile = null ) {
        return new Promise( ( fulfill, reject ) => {
            try {
                if ( !db ) {
                    db = lowDB( dbFile );

                    db._.mixin( require( 'lodash-id' ) );
                }

                db
                    .defaults( {
                        [DIALOG_SCREENSHOTS_DB]: [],
                        [DIALOG_DIFFS_RESULT_DB]: [],
                        [SUITE_RESULT_DB]: [],
                    } )
                    .write();

                fulfill();
            }
            catch ( err ) {
                reject( ErrorHelper.createError( err, 'Could not init DB', ERROR_CONSTANTS.INIT_DB_ERROR, { dbFile } ) );
            }
        } );
    }

    clearDB() {
        if ( db ) {
            db.setState( {} );
        }
        return Promise.resolve();
    }

    /**
     * @return {Boolean}
     */
    isInitialized() {
        return !!db;
    }

    /**
     * @param {DialogDiffer.Dialog} dialog
     * @param {DialogDiffer.DialogScreenshot} dialogScreenshot
     * @return {Promise<DialogDiffer.Database.DialogScreenshot>}
     */
    saveDialogScreenshot( dialog, dialogScreenshot ) {
        return new Promise( ( fulfill, reject ) => {
            try {
                this
                    .getDialogScreenshot( dialog, dialogScreenshot )
                    .then( dialogScreenshotDb => {
                        if ( dialogScreenshotDb ) {
                            db
                                .get( DIALOG_SCREENSHOTS_DB )
                                .find( {
                                    id: dialogScreenshotDb.id,
                                } )
                                .assign( {
                                    base64: dialogScreenshot.base64,
                                } )
                                .write();

                            dialogScreenshotDb = db
                                .get( DIALOG_SCREENSHOTS_DB )
                                .find( {
                                    id: dialogScreenshotDb.id,
                                } )
                                .value();
                        }
                        else {
                            dialogScreenshotDb = db
                                .get( DIALOG_SCREENSHOTS_DB )
                                .insert( {
                                    dialogId: dialog.id,
                                    dialogVersion: dialog.version,
                                    height: dialogScreenshot.height,
                                    width: dialogScreenshot.width,
                                    base64: dialogScreenshot.base64,
                                } )
                                .write();
                        }

                        fulfill( dialogScreenshotDb );
                    } );
            }
            catch ( err ) {
                reject( ErrorHelper.createError( err, 'Could not save dialog screenshot', ERROR_CONSTANTS.SAVE_DIALOG_SCREENSHOT_DB_ERROR, { dialog, dialogScreenshot } ) );
            }
        } );
    }

    /**
     * @param {DialogDiffer.Dialog} dialog
     * @param {DialogDiffer.Database.SearchDialogScreenshot} dialogScreenshot
     * @return {Promise<DialogDiffer.Database.DialogScreenshot>}
     */
    getDialogScreenshot( dialog, dialogScreenshot ) {
        return new Promise( ( fulfill, reject ) => {
            try {
                const dialogScreenshotDb = db
                    .get( DIALOG_SCREENSHOTS_DB )
                    .find( {
                        dialogId: dialog.id,
                        dialogVersion: dialog.version,
                        height: dialogScreenshot.height,
                        width: dialogScreenshot.width,
                    } )
                    .value();

                fulfill( dialogScreenshotDb );
            }
            catch ( err ) {
                reject( ErrorHelper.createError( err, 'Could not get dialog screenshot', ERROR_CONSTANTS.GET_DIALOG_SCREENSHOT_DB_ERROR, { dialog, dialogScreenshot } ) );
            }
        } );
    }

    /**
     * @param {DialogDiffer.Dialog} dialog
     * @param {Array<DialogDiffer.Database.SearchDialogScreenshot>} sizes
     * @return {Promise<Array<DialogDiffer.Database.DialogScreenshot>>}
     */
    getDialogScreenshots( dialog, sizes ) {
        return new Promise( ( fulfill, reject ) => {
            try {
                const dialogScreenshotDb = db
                    .get( DIALOG_SCREENSHOTS_DB )
                    .filter( dialogScreenshotDb => {
                        const correctSize = sizes.filter( size => size.width === dialogScreenshotDb.width && size.height === dialogScreenshotDb.height ).length > 0;

                        return dialogScreenshotDb.dialogId === dialog.id && dialogScreenshotDb.dialogVersion === dialog.version && correctSize;
                    } )
                    .value();

                fulfill( dialogScreenshotDb );
            }
            catch ( err ) {
                reject( ErrorHelper.createError( err, 'Could not get dialog screenshots', ERROR_CONSTANTS.GET_DIALOG_SCREENSHOTS_DB_ERROR, { dialog } ) );
            }
        } );
    }

    /**
     * @param {Array<DialogDiffer.Dialog>} dialogs
     * @param {Array<DialogDiffer.Database.SearchDialogScreenshot>} sizes
     * @return {Promise<Array<Array<DialogDiffer.Database.DialogScreenshot>>>}
     */
    getDialogsScreenshots( dialogs, sizes ) {
        return new Promise( ( fulfill, reject ) => {
            Promise
                .all( dialogs.map( dialog => this.getDialogScreenshots( dialog, sizes ) ) )
                .then( fulfill )
                .catch( err => reject( ErrorHelper.createError( err, 'Could not get dialog screenshots', ERROR_CONSTANTS.GET_DIALOGS_SCREENSHOTS_DB_ERROR, { dialogs } ) ) );
        } );
    }

    /**
     * @param {String} dialogVersion
     * @returns {Promise<Boolean, DialogDiffer.Error>}
     */
    deleteDialogsScreenshots( dialogVersion ) {
        return new Promise( ( fulfill, reject ) => {
            try {
                db.get( DIALOG_SCREENSHOTS_DB )
                    .remove( {
                        dialogVersion: dialogVersion,
                    } )
                    .write();

                fulfill( true );
            }
            catch ( err ) {
                reject( ErrorHelper.createError( err, 'Could not delete dialog screenshots', ERROR_CONSTANTS.DELETE_DIALOGS_SCREENSHOTS_DB_ERROR, { dialogVersion } ) );
            }
        } );
    }

    /**
     * @param {DialogDiffer.Options} options
     * @param {DialogDiffer.Dialog} dialogOriginal
     * @param {DialogDiffer.Dialog} dialogCurrent
     * @param {DialogDiffer.DialogsResult} dialogsResult
     * @returns {Promise<{dialogsResult: DialogDiffer.DialogsResult, dialogsResultDb: DialogDiffer.Database.DialogsResult}>}
     */
    saveDialogsResult( options, dialogOriginal, dialogCurrent, dialogsResult ) {
        return new Promise( ( fulfill, reject ) => {
            try {
                const dialogsResultDb = db
                    .get( DIALOG_DIFFS_RESULT_DB )
                    .insert( {
                        dialogId: dialogsResult.dialogId,
                        originalVersion: dialogsResult.originalVersion,
                        currentVersion: dialogsResult.currentVersion,
                        options: SuiteHelper.createUniqueOptionsId( options ),
                        result: dialogsResult.result,
                        differ: dialogsResult.differ,
                    } )
                    .write();

                fulfill( { dialogsResult: dialogsResult, dialogResultDb: dialogsResultDb } );
            }
            catch ( err ) {
                reject( ErrorHelper.createError( err, 'Could not save dialogs diff result', ERROR_CONSTANTS.SAVE_DIALOGS_DIFF_RESULT_DB_ERROR, { options, dialogOriginal, dialogCurrent, dialogsResult } ) );
            }
        } );
    };

    /**
     * @param {DialogDiffer.Options} options
     * @param {String} dialogId
     * @param {String} originalVersion
     * @param {String} currentVersion
     * @returns {Promise<DialogDiffer.Database.DialogsResult>}
     */
    getDialogsResult( options, dialogId, originalVersion, currentVersion ) {
        return new Promise( ( fulfill, reject ) => {
            try {
                const dialogsDiffResultDb = db
                    .get( DIALOG_DIFFS_RESULT_DB )
                    .find( {
                        dialogId: dialogId,
                        originalVersion: originalVersion,
                        currentVersion: currentVersion,
                        options: SuiteHelper.createUniqueOptionsId( options ),
                    } )
                    .value();

                fulfill( dialogsDiffResultDb );
            }
            catch ( err ) {
                reject( ErrorHelper.createError( err, 'Could not get dialogs diff result', ERROR_CONSTANTS.GET_DIALOG_SCREENSHOT_DB_ERROR, { options, dialogOriginal, dialogCurrent } ) );
            }
        } );
    }

    /**
     * @param {DialogDiffer.Suite} suite
     * @return {Promise<DialogDiffer.Database.SuiteResult>}
     */
    newSuiteResult( suite ) {
        return new Promise( ( fulfill, reject ) => {
            try {
                const suiteResultDb = db
                    .get( SUITE_RESULT_DB )
                    .insert( {
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
                            dialogs: Math.max( ( suite.original || [] ).length, ( suite.current || [] ).length ),
                        },
                        dialogsResult: []
                    } )
                    .write();

                fulfill( suiteResultDb );
            }
            catch ( err ) {
                reject( ErrorHelper.createError( err, 'Could not save suite result', ERROR_CONSTANTS.NEW_SUITE_RESULT_DB_ERROR, { suite } ) );
            }
        } );
    }

    /**
     * @param {DialogDiffer.SuiteResult} suiteResult
     * @return {Promise<DialogDiffer.SuiteResult>}
     */
    saveSuiteResult( suiteResult ) {
        return new Promise( ( fulfill, reject ) => {
            try {
                db
                    .get( SUITE_RESULT_DB )
                    .find( { id: suiteResult.id } )
                    .assign( {
                        status: suiteResult.status,
                        stats: suiteResult.stats,
                        results: suiteResult.results
                            .map( dialogsResult => {
                                return {
                                    dialogId: dialogsResult.dialogId,
                                    originalVersion: dialogsResult.originalVersion,
                                    currentVersion: dialogsResult.currentVersion,
                                    result: dialogsResult.result,
                                };
                            } )
                    } )
                    .write();

                fulfill( suiteResult );
            }
            catch ( err ) {
                reject( ErrorHelper.createError( err, 'Could not save suite result', ERROR_CONSTANTS.SAVE_SUITE_RESULT_DB_ERROR, { suiteResult } ) );
            }
        } );
    }

    /**
     * @param {DialogDiffer.Suite} suite
     * @param {DialogDiffer.Error} err
     * @return {Promise<DialogDiffer.Suite, DialogDiffer.Error>}
     */
    saveSuiteResultError( suite, err ) {
        return new Promise( ( fulfill, reject ) => {
            try {
                db
                    .get( SUITE_RESULT_DB )
                    .find( { id: suite.id } )
                    .assign( {
                        status: SUITE_CONSTANTS.ERROR_STATUS,
                        errorCode: err.code,
                    } )
                    .write();

                fulfill( suite );
            }
            catch ( err ) {
                reject( ErrorHelper.createError( err, 'Could not save suite result', ERROR_CONSTANTS.SAVE_SUITE_RESULT_DB_ERROR, { suiteResult } ) );
            }
        } );
    }

    /**
     * @param {String} suiteId
     * @return {Promise<DialogDiffer.Database.SuiteResult|null>}
     */
    getSuiteResult( suiteId ) {
        return new Promise( ( fulfill, reject ) => {
            try {
                const suiteResultsDb = db
                    .get( SUITE_RESULT_DB )
                    .find( { id: suiteId } )
                    .value();

                fulfill( suiteResultsDb );
            }
            catch ( err ) {
                reject( ErrorHelper.createError( err, 'Could not get suite results', ERROR_CONSTANTS.GET_SUITE_RESULTS_DB_ERROR ) );
            }
        } );
    }

    /**
     * @return {Promise<Array<DialogDiffer.Database.SuiteResult>>}
     */
    getLastSuiteResults() {
        return new Promise( ( fulfill, reject ) => {
            try {
                const suiteResultsDb = db
                    .get( SUITE_RESULT_DB )
                    .sortBy( 'timestamp' )
                    .reverse()
                    .value();

                fulfill( suiteResultsDb );
            }
            catch ( err ) {
                reject( ErrorHelper.createError( err, 'Could not get suite results', ERROR_CONSTANTS.GET_SUITE_RESULTS_DB_ERROR ) );
            }
        } );
    }
}

module.exports = DatabaseHandler;