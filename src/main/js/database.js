const lowDB = require( 'lowdb' );

const ERROR_CONSTANTS = require( './constants/error-constants' );

const SuiteHelper = require( './helpers/suite-helper' );
const ErrorHelper = require( './helpers/error-helper' );

let db;

const DIALOG_SCREENSHOTS_DB = 'dialog_screenshots';
const DIALOG_DIFFS_RESULT_DB = 'dialog_diffs_result';
const SUITE_RESULT_DB = 'suite_result';

/**
 * @interface Database
 */

/**
 * @typedef {Object} Database.SearchDialogScreenshot
 * @property {Number} width
 * @property {Number} height
 * @memberOf Database
 */

/**
 * @typedef {Database.SearchDialogScreenshot} Database.DialogScreenshot
 * @property {String} dialogId
 * @property {String} dialogVersion
 * @property {String} base64
 * @memberOf Database
 */

/**
 * @typedef {Object} Database.DialogsResult
 * @property {String} dialogId
 * @property {String} originalVersion
 * @property {String} currentVersion
 * @property {String} result
 * @property {Array<Suite.DialogResultDiff>} differ
 * @memberOf Database
 */

/**
 * @typedef {Object} Database.SuiteResult
 * @property {String} dialogId
 * @property {String} originalVersion
 * @property {String} currentVersion
 * @property {Array<{dialogId: String, originalVersion: String, currentVersion: String, result: String}>} dialogsResult
 * @property {Number} timestamp
 * @memberOf Database
 */

/**
 * @param {String} [dbFile] Uses in-memory if not given
 */
module.exports.initDB = ( dbFile ) => {
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
};

module.exports.clearDB = () => {
    if ( db ) {
        db.setState( {} );
    }
    return Promise.resolve();
};

/**
 * @param {Suite.Dialog} dialog
 * @param {Suite.DialogScreenshot} dialogScreenshot
 * @return {Promise<Database.DialogScreenshot>}
 */
module.exports.saveDialogScreenshot = ( dialog, dialogScreenshot ) => {
    return new Promise( ( fulfill, reject ) => {
        try {
            const dialogScreenshotDb = db
                .get( DIALOG_SCREENSHOTS_DB )
                .insert( {
                    dialogId: dialog.id,
                    dialogVersion: dialog.version,
                    height: dialogScreenshot.height,
                    width: dialogScreenshot.width,
                    base64: dialogScreenshot.base64
                } )
                .write();

            fulfill( dialogScreenshotDb );
        }
        catch ( err ) {
            reject( ErrorHelper.createError( err, 'Could not save dialog screenshot', ERROR_CONSTANTS.SAVE_DIALOG_SCREENSHOT_DB_ERROR, { dialog, dialogScreenshot } ) );
        }
    } );
};

/**
 * @param {Suite.Dialog} dialog
 * @param {Database.SearchDialogScreenshot} dialogScreenshot
 * @return {Promise<Database.DialogScreenshot>}
 */
module.exports.getDialogScreenshot = ( dialog, dialogScreenshot ) => {
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
};

/**
 * @param {Suite.Dialog} dialog
 * @return {Promise<Array<Database.DialogScreenshot>>}
 */
module.exports.getDialogScreenshots = ( dialog ) => {
    return new Promise( ( fulfill, reject ) => {
        try {
            const dialogScreenshotDb = db
                .get( DIALOG_SCREENSHOTS_DB )
                .filter( {
                    dialogId: dialog.id,
                    dialogVersion: dialog.version,
                } )
                .value();

            fulfill( dialogScreenshotDb );
        }
        catch ( err ) {
            reject( ErrorHelper.createError( err, 'Could not get dialog screenshots', ERROR_CONSTANTS.GET_DIALOG_SCREENSHOTS_DB_ERROR, { dialog } ) );
        }
    } );
};

/**
 * @param {Array<Suite.Dialog>} dialogs
 * @return {Promise<Array<Array<Database.DialogScreenshot>>>}
 */
module.exports.getDialogsScreenshots = ( dialogs ) => {
    return new Promise( ( fulfill, reject ) => {
        Promise
            .all( dialogs.map( this.getDialogScreenshots ) )
            .then( fulfill )
            .catch( err => reject( ErrorHelper.createError( err, 'Could not get dialog screenshots', ERROR_CONSTANTS.GET_DIALOGS_SCREENSHOTS_DB_ERROR, { dialogs } ) ) );
    } );
};

/**
 * @param {Suite.Options} options
 * @param {Suite.Dialog} dialogOriginal
 * @param {Suite.Dialog} dialogCurrent
 * @param {Suite.DialogsResult} dialogsResult
 * @returns {Promise<{dialogsResult: Suite.DialogsResult, dialogsResultDb: Database.DialogsResult}>}
 */
module.exports.saveDialogsResult = ( options, dialogOriginal, dialogCurrent, dialogsResult ) => {
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
 * @param {Suite.Options} options
 * @param {Suite.Dialog|null} dialogOriginal
 * @param {Suite.Dialog|null} dialogCurrent
 * @returns {Promise<Database.DialogsResult>}
 */
module.exports.getDialogsResult = ( options, dialogOriginal, dialogCurrent ) => {
    return new Promise( ( fulfill, reject ) => {
        try {
            const dialogsDiffResultDb = db
                .get( DIALOG_DIFFS_RESULT_DB )
                .find( {
                    dialogId: dialogOriginal.id,
                    originalVersion: dialogOriginal.version,
                    currentVersion: dialogCurrent.version,
                    options: SuiteHelper.createUniqueOptionsId( options ),
                } )
                .value();

            fulfill( dialogsDiffResultDb );
        }
        catch ( err ) {
            reject( ErrorHelper.createError( err, 'Could not get dialogs diff result', ERROR_CONSTANTS.GET_DIALOG_SCREENSHOT_DB_ERROR, { options, dialogOriginal, dialogCurrent } ) );
        }
    } );
};

/**
 * @param {Suite.SuiteResult} suiteResult
 * @return {Promise<Suite.SuiteResult>}
 */
module.exports.saveSuiteResult = ( suiteResult ) => {
    return new Promise( ( fulfill, reject ) => {
        try {
            db
                .get( SUITE_RESULT_DB )
                .insert( {
                    originalVersion: suiteResult.options.originalVersion,
                    currentVersion: suiteResult.options.currentVersion,
                    options: suiteResult.options,
                    timestamp: Date.now(),
                    dialogsResult: Object
                        .keys( suiteResult.results )
                        .map( dialogId => {
                            /** @type {Suite.DialogsResult} */
                            const dialogsResult = suiteResult.results[dialogId];

                            return {
                                dialogId,
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
};

/**
 * @return {Promise<Array<Database.SuiteResult>>}
 */
module.exports.getLastSuiteResults = () => {
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
};