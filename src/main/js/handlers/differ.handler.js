const TAG = 'Differ';

const tmp = require( 'tmp' );
const path = require( 'path' );
const imageDiff = require( 'image-diff' );
const base64Img = require( 'base64-img' );
const Promise = require( 'bluebird' );

const LOGGER_CONSTANTS = require( '../constants/logger-constants' );
const DIFFER_CONSTANTS = require( '../constants/differ-constants' );
const SUITE_CONSTANTS = require( '../constants/suite-constants' );

const SuiteHelper = require( '../helpers/suite.helper' );
const DialogHelper = require( '../helpers/dialog.helper' );
const logger = require( '../logger' );

class DifferHandler {
    constructor( databaseHandler ) {
        this.databaseHandler = databaseHandler;
    }

    /**
     * @param {DialogDiffer.Dialog} dialog
     * @returns {Promise<Dialog>}
     * @private
     */
    prepareDialogScreenshots( dialog ) {
        return new Promise( ( fulfill ) => {
            dialog.screenshots.forEach( screenshot => {
                const tmpFile = tmp.fileSync( {
                    postfix: '.png'
                } );

                screenshot.path = tmpFile.name;
                screenshot.removeCallback = tmpFile.removeCallback;
                base64Img.imgSync( screenshot.base64, path.dirname( tmpFile.name ), path.basename( tmpFile.name, '.png' ) );
            } );

            fulfill( dialog );
        } );
    }

    /**
     * @param {DialogDiffer.Dialog|null} dialogOriginal
     * @param {DialogDiffer.Dialog|null} dialogCurrent
     * @param {String} result
     * @param {Array<DialogDiffer.DialogResultDiff>} [differ]
     * @return {DialogDiffer.DialogsResult}
     * @private
     */
    createDialogsResult( dialogOriginal, dialogCurrent, result, differ = [] ) {
        return {
            dialogId: dialogOriginal && dialogOriginal.id || dialogCurrent && dialogCurrent.id,
            original: dialogOriginal,
            current: dialogCurrent,
            originalVersion: dialogOriginal && dialogOriginal.version || null,
            currentVersion: dialogCurrent && dialogCurrent.version || null,
            result,
            differ,
        };
    }

    /**
     * @param {DialogDiffer.DialogScreenshot} screenshotOriginal
     * @param {DialogDiffer.DialogScreenshot} screenshotCurrent
     * @returns {Promise<{isIdentical: Boolean, base64: String|null}>}
     */
    differDialogScreenshot( screenshotOriginal, screenshotCurrent ) {
        return new Promise( ( fulfill, reject ) => {
            const tmpFile = tmp.fileSync( {
                postfix: '.png'
            } );

            imageDiff( {
                expectedImage: screenshotCurrent.path,
                actualImage: screenshotOriginal.path,
                diffImage: tmpFile.name
            }, ( err, isIdentical ) => {
                if ( err ) {
                    reject( err );
                    return;
                }

                fulfill( {
                    isIdentical: isIdentical,
                    base64: !isIdentical ? base64Img.base64Sync( tmpFile.name ) : null
                } );

                // remove tmp files
                if ( tmpFile.removeCallback ) {
                    tmpFile.removeCallback();
                }

                if ( screenshotOriginal.removeCallback ) {
                    screenshotOriginal.removeCallback();
                    delete screenshotOriginal.path;
                }

                if ( screenshotCurrent.removeCallback ) {
                    screenshotCurrent.removeCallback();
                    delete screenshotCurrent.path;
                }
            } );
        } );
    }

    /**
     * @param {DialogDiffer.Options} options
     * @param {DialogDiffer.Dialog|null} dialogOriginal
     * @param {DialogDiffer.Dialog|null} dialogCurrent
     * @returns {Promise<DialogDiffer.DialogsResult>}
     */
    differDialog( options, dialogOriginal, dialogCurrent ) {
        if ( !dialogOriginal || !dialogCurrent ) {
            return Promise.resolve( this.createDialogsResult(
                dialogOriginal,
                dialogCurrent,
                !dialogCurrent ? DIFFER_CONSTANTS.DELETED_DIFFER_RESULT : DIFFER_CONSTANTS.ADDED_DIFFER_RESULT,
                []
            ) );
        }

        if ( dialogOriginal.error || dialogCurrent.error ) {
            return Promise.resolve( this.createDialogsResult(
                dialogOriginal,
                dialogCurrent,
                DIFFER_CONSTANTS.ERROR_DIFFER_RESULT,
                []
            ) );
        }

        return new Promise( ( fulfill, reject ) => {
            this.databaseHandler
                .getDialogsResult( options, dialogOriginal.id, dialogOriginal.version, dialogCurrent.version )
                .then( dialogResultDb => {
                    // use dialog result from database
                    if ( dialogResultDb && !options.isForceDiff ) {
                        logger.info( TAG, 'differDialog', 'Using dialogs \'%s\' and \'%s\' diff result from database', LOGGER_CONSTANTS.DIALOG_DIFF_FROM_DATABASE_LOGGER, DialogHelper.createUniqueDialogId( dialogOriginal ), DialogHelper.createUniqueDialogId( dialogCurrent ) );

                        return Promise.resolve( this.createDialogsResult(
                            dialogOriginal,
                            dialogCurrent,
                            dialogResultDb.result,
                            dialogResultDb.differ
                        ) );
                    }
                    // get dialog result from image diff
                    else {
                        logger.info( TAG, 'differDialog', 'Getting dialogs \'%s\' and \'%s\' diff result from image diff', LOGGER_CONSTANTS.DIALOG_DIFF_FROM_IMAGE_DIFF_LOGGER, DialogHelper.createUniqueDialogId( dialogOriginal ), DialogHelper.createUniqueDialogId( dialogCurrent ) );

                        return this.differDialogWithImageDiff( options, dialogOriginal, dialogCurrent );
                    }
                } )
                .then( fulfill )
                .catch( reject );
        } );
    }

    /**
     * @param {DialogDiffer.Options} options
     * @param {DialogDiffer.Dialog|null} dialogOriginal
     * @param {DialogDiffer.Dialog|null} dialogCurrent
     * @returns {Promise<DialogDiffer.DialogsResult>}
     * @private
     */
    differDialogWithImageDiff( options, dialogOriginal, dialogCurrent ) {
        return new Promise( ( fulfill, reject ) => {
            Promise
                .all( [
                    this.prepareDialogScreenshots( dialogOriginal ),
                    this.prepareDialogScreenshots( dialogCurrent )
                ] )
                .then( ( [dialogOriginal, dialogCurrent] ) => {
                    return Promise
                        .map(
                            dialogOriginal.screenshots,
                            ( screenshot, i ) => this.differDialogScreenshot( dialogOriginal.screenshots[i], dialogCurrent.screenshots[i] ),
                            { concurrency: 10 }
                        );
                } )
                .then( result => {
                    /** @type {DialogDiffer.DialogsResult} */
                    const dialogsResult = this.createDialogsResult(
                        dialogOriginal,
                        dialogCurrent,
                        DIFFER_CONSTANTS.IDENTICAL_DIFFER_RESULT,
                        []
                    );

                    result.forEach( ( { isIdentical, base64 }, i ) => {
                        if ( !isIdentical ) {
                            dialogsResult.result = DIFFER_CONSTANTS.CHANGED_DIFFER_RESULT;
                        }

                        dialogsResult.differ.push( {
                            index: i,
                            result: isIdentical ? DIFFER_CONSTANTS.IDENTICAL_DIFFER_RESULT : DIFFER_CONSTANTS.CHANGED_DIFFER_RESULT,
                            base64
                        } );
                    } );

                    return Promise.resolve( dialogsResult );
                } )
                .then( dialogsResult => this.databaseHandler.saveDialogsResult( options, dialogOriginal, dialogCurrent, dialogsResult ) )
                .then( ( { dialogsResult } ) => fulfill( dialogsResult ) )
                .catch( reject )
        } );
    }

    /**
     * @param {DialogDiffer.Suite} suite
     * @param {DialogDiffer.OnEndCallback} [onEnd]
     * @returns {Promise<DialogDiffer.SuiteResult>}
     */
    differSuite( suite, { onEnd = null } = {} ) {
        return new Promise( ( fulfill, reject ) => {
            /** @type {DialogDiffer.SuiteResult} */
            let suiteResult;
            logger.log( TAG, 'differSuite', 'Differ suite...' );

            this.databaseHandler
                .getSuiteResult( suite.id )
                .then( suiteResultDb => {
                    suiteResult = SuiteHelper.prepareSuiteResults( suite, suiteResultDb );

                    return Promise.map(
                        suiteResult.results,
                        result => this.differDialog( suite.options, result.original, result.current ),
                        { concurrency: 10 }
                    );
                } )
                .then( results => {
                    logger.log( TAG, 'differSuite', 'Diffed suite' );

                    results.forEach( ( dialogResult, i ) => {
                        suiteResult.results[i] = dialogResult;
                    } );

                    return Promise.resolve( suiteResult );
                } )
                .then( () => this.finishSuiteResult( suiteResult, { onEnd } ) )
                .then( fulfill )
                .catch( reject );
        } );
    }

    /**
     * @param {DialogDiffer.Suite} suite
     * @param {DialogDiffer.OnStartCallback} [onStart]
     * @return {Promise<DialogDiffer.Suite, DialogDiffer.Error>}
     */
    initSuiteResult( suite, { onStart = null } = {} ) {
        const suiteResultPromise = () => {
            if ( suite.id ) {
                return this.databaseHandler.getSuiteResult( suite.id );
            }
            else {
                return this.databaseHandler.newSuiteResult( suite );
            }
        };

        return new Promise( ( fulfill, reject ) => {
            suiteResultPromise()
                .then( suiteResultDb => {
                    // inject Suite id
                    suite.id = suiteResultDb.id;

                    if ( onStart ) {
                        onStart( suiteResultDb );
                    }

                    fulfill( suite );
                } )
                .catch( reject );
        } );
    }

    /**
     * @param {DialogDiffer.SuiteResult} suiteResult
     * @param {DialogDiffer.OnEndCallback} [onEnd]
     * @return {Promise<DialogDiffer.SuiteResult, DialogDiffer.Error>}
     */
    finishSuiteResult( suiteResult, { onEnd = null } = {} ) {
        return new Promise( ( fulfill, reject ) => {
            // duration
            suiteResult.stats.duration = Date.now() - suiteResult.timestamp;

            // status
            suiteResult.status = SUITE_CONSTANTS.FINISHED_STATUS;

            // dialog results
            Object
                .keys( suiteResult.results )
                .forEach( dialogId => {
                    /** @type {DialogDiffer.DialogsResult} */
                    const dialogsResult = suiteResult.results[dialogId];

                    switch ( dialogsResult.result ) {
                        case DIFFER_CONSTANTS.IDENTICAL_DIFFER_RESULT:
                            suiteResult.stats.identical++;
                            break;
                        case DIFFER_CONSTANTS.CHANGED_DIFFER_RESULT:
                            suiteResult.stats.changed++;
                            break;
                        case DIFFER_CONSTANTS.ADDED_DIFFER_RESULT:
                            suiteResult.stats.added++;
                            break;
                        case DIFFER_CONSTANTS.DELETED_DIFFER_RESULT:
                            suiteResult.stats.deleted++;
                            break;
                        case DIFFER_CONSTANTS.ERROR_DIFFER_RESULT:
                            suiteResult.stats.error++;
                            break;
                    }
                } );

            this.databaseHandler.saveSuiteResult( suiteResult )
                .then( suiteResult => this.databaseHandler.getSuiteResult( suiteResult.id ) )
                .then( suiteResultDb => ( onEnd ? onEnd( suiteResultDb ) : null ) )
                .then( () => fulfill( suiteResult ) )
                .catch( reject );
        } );
    }

    /**
     * @param {DialogDiffer.Suite} suite
     * @param {DialogDiffer.Error} err
     * @return {Promise<DialogDiffer.Suite, DialogDiffer.Error>}
     */
    errorSuiteResult( suite, err ) {
        return new Promise( ( fulfill, reject ) => {
            if ( this.databaseHandler.isInitialized() ) {
                this.databaseHandler.saveSuiteResultError( suite, err )
                    .then( () => fulfill( suite ) )
                    .catch( reject );
            }
            else {
                fulfill( suite );
            }
        } );
    }

}

module.exports = DifferHandler;