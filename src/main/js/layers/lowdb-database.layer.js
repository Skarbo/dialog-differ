const lowDB = require( 'lowdb' );
const AbstractDatabaseLayer = require( './abstract-database.layer' )

const DIALOG_SCREENSHOTS_DB = 'dialog_screenshots';
const DIALOG_DIFFS_RESULT_DB = 'dialog_diffs_result';
const SUITE_RESULT_DB = 'suite_result';

let db = null;

class LowDbDatabaseLayer extends AbstractDatabaseLayer {
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
                reject( err );
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
     * @param {String} dialogScreenshotId
     * @return {Promise<DialogDiffer.Database.DialogScreenshot|null>}
     */
    getDialogScreenshotFromId( dialogScreenshotId ) {
        return new Promise( ( resolve, reject ) => {
            try {
                resolve( Promise.resolve( db
                    .get( DIALOG_SCREENSHOTS_DB )
                    .find( {
                        id: dialogScreenshotId
                    } )
                    .value() ) );
            }
            catch ( err ) {
                reject( err );
            }
        } );
    }

    /**
     * @return {Promise<DialogDiffer.Database.DialogScreenshot>}
     */
    getDialogScreenshot( { dialogId, dialogVersion, dialogScreenshotHeight, dialogScreenshotWidth } ) {
        return new Promise( ( resolve, reject ) => {
            try {
                resolve( db
                    .get( DIALOG_SCREENSHOTS_DB )
                    .find( {
                        dialogId: dialogId,
                        dialogVersion: dialogVersion,
                        height: dialogScreenshotHeight,
                        width: dialogScreenshotWidth,
                    } )
                    .value() )
            }
            catch ( err ) {
                reject( err )
            }
        } );
    }

    /**
     * @param {String} dialogId
     * @param {String} dialogVersion
     * @param {Array<{width: Number, height: Number}>} sizes
     * @return {Promise<Array<DialogDiffer.Database.DialogScreenshot>>}
     */
    getDialogScreenshots( { dialogId, dialogVersion, sizes } ) {
        return new Promise( ( fulfill, reject ) => {
            try {
                const dialogScreenshotDb = db
                    .get( DIALOG_SCREENSHOTS_DB )
                    .filter( dialogScreenshotDb => {
                        const isCorrectSize = sizes.filter( size => size.width === dialogScreenshotDb.width && size.height === dialogScreenshotDb.height ).length > 0;

                        return dialogScreenshotDb.dialogId === dialogId && dialogScreenshotDb.dialogVersion === dialogVersion && isCorrectSize;
                    } )
                    .value();

                fulfill( dialogScreenshotDb );
            }
            catch ( err ) {
                reject( err )
            }
        } );
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
        return new Promise( ( resolve, reject ) => {
            try {
                const dialogScreenshotDb = db
                    .get( DIALOG_SCREENSHOTS_DB )
                    .insert( {
                        dialogId: dialogId,
                        dialogVersion: dialogVersion,
                        height: dialogScreenshotHeight,
                        width: dialogScreenshotWidth,
                        base64: dialogScreenshotBase64,
                    } )
                    .write();

                resolve( dialogScreenshotDb )
            }
            catch ( err ) {
                reject( err )
            }
        } );
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
        return new Promise( ( resolve, reject ) => {
            try {
                db
                    .get( DIALOG_SCREENSHOTS_DB )
                    .find( {
                        id: dialogScreenshotId
                    } )
                    .assign( {
                        base64: dialogScreenshotBase64
                    } )
                    .write();

                this
                    .getDialogScreenshotFromId( dialogScreenshotId )
                    .then( resolve )
                    .catch( reject )
            }
            catch ( err ) {
                reject( err )
            }
        } );
    }

    /**
     * @param {String} dialogVersion
     * @returns {Promise<Boolean>}
     */
    deleteDialogsScreenshots( dialogVersion ) {
        return new Promise( ( resolve, reject ) => {
            try {
                db.get( DIALOG_SCREENSHOTS_DB )
                    .remove( {
                        dialogVersion: dialogVersion,
                    } )
                    .write();

                resolve( true )
            }
            catch ( err ) {
                reject( err )
            }
        } );
    }

    /*
     * DIALOG RESULT
     */

    /**
     * @param {String} options
     * @param {String} dialogId
     * @param {String} originalVersion
     * @param {String} currentVersion
     * @returns {Promise<DialogDiffer.Database.DialogsResult>}
     */
    getDialogsResult( { options, dialogId, originalVersion, currentVersion } ) {
        return new Promise( ( fulfill, reject ) => {
            try {
                const dialogsDiffResultDb = db
                    .get( DIALOG_DIFFS_RESULT_DB )
                    .find( {
                        dialogId: dialogId,
                        originalVersion: originalVersion,
                        currentVersion: currentVersion,
                        options: options,
                    } )
                    .value();

                fulfill( dialogsDiffResultDb );
            }
            catch ( err ) {
                reject( err );
            }
        } );
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
        return new Promise( ( fulfill, reject ) => {
            try {
                const dialogsResultDb = db
                    .get( DIALOG_DIFFS_RESULT_DB )
                    .insert( {
                        dialogId: dialogId,
                        originalVersion: originalVersion,
                        currentVersion: currentVersion,
                        options: options,
                        result: result,
                        differ: differ,
                    } )
                    .write();

                fulfill( dialogsResultDb );
            }
            catch ( err ) {
                reject( err );
            }
        } );
    }

    /*
     * SUITE RESULT
     */

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
                reject( err );
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
                reject( err );
            }
        } );
    }

    /**
     * @param {DialogDiffer.Database.SuiteResult} suiteResult
     * @return {Promise<DialogDiffer.Database.SuiteResult>}
     */
    newSuiteResult( suiteResult ) {
        return new Promise( ( fulfill, reject ) => {
            try {
                const suiteResultDb = db
                    .get( SUITE_RESULT_DB )
                    .insert( suiteResult )
                    .write();

                fulfill( suiteResultDb );
            }
            catch ( err ) {
                reject( err );
            }
        } );
    }

    /**
     * @param {String} suiteResultId
     * @param {DialogDiffer.Database.SuiteResult} suiteResult
     * @return {Promise<DialogDiffer.Database.SuiteResult>}
     */
    updateSuiteResult( suiteResultId, suiteResult ) {
        return new Promise( ( fulfill, reject ) => {
            try {
                const suiteResultDb = db
                    .get( SUITE_RESULT_DB )
                    .find( { id: suiteResultId } )
                    .assign( suiteResult )
                    .write();

                fulfill( suiteResultDb );
            }
            catch ( err ) {
                reject( err );
            }
        } );
    }

    /**
     * @param {String} suiteId
     * @returns {Promise<Boolean>}
     */
    deleteSuiteResult( suiteId ) {
        return new Promise( ( fulfill, reject ) => {
            try {
                db.get( SUITE_RESULT_DB )
                    .remove( {
                        id: suiteId,
                    } )
                    .write();

                fulfill( true );
            }
            catch ( err ) {
                reject( err );
            }
        } );
    }
}

module
    .exports = LowDbDatabaseLayer;
