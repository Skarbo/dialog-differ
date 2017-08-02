const tmp = require( 'tmp' );
const path = require( 'path' );
const imageDiff = require( 'image-diff' );
const base64Img = require( 'base64-img' );

const TAG = 'Differ';
const LOGGER_CONSTANTS = require( './constants/logger-constants' );
const CONSTANTS = require( './constants/differ-constants' );

const SuiteHelper = require( './helpers/suite-helper' );
const DialogHelper = require( './helpers/dialog-helper' );
const logger = require( './logger' );
const db = require( './database' );

const self = this;

/**
 * @param {Suite.Dialog} dialog
 * @returns {Promise<Dialog>}
 */
function prepareDialogScreenshots( dialog ) {
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
 * @param {Suite.Dialog|null} dialogOriginal
 * @param {Suite.Dialog|null} dialogCurrent
 * @param {String} result
 * @param {Array<Suite.DialogResultDiff>} [differ]
 * @return {Suite.DialogsResult}
 */
function createDialogsResult( dialogOriginal, dialogCurrent, result, differ = [] ) {
    return {
        dialogId: dialogOriginal && dialogOriginal.id || dialogCurrent && dialogCurrent.id,
        original: dialogOriginal,
        current: dialogCurrent,
        originalVersion: dialogOriginal.version,
        currentVersion: dialogCurrent.version,
        result,
        differ,
    };
}

/**
 * @param {Suite.DialogScreenshot} screenshotOriginal
 * @param {Suite.DialogScreenshot} screenshotCurrent
 * @returns {Promise<{isIdentical: Boolean, base64: String|null}>}
 */
module.exports.differDialogScreenshot = function ( screenshotOriginal, screenshotCurrent ) {
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
};

/**
 * @param {Suite.Options} options
 * @param {Suite.Dialog|null} dialogOriginal
 * @param {Suite.Dialog|null} dialogCurrent
 * @returns {Promise<Suite.DialogsResult>}
 */
module.exports.differDialog = ( options, dialogOriginal, dialogCurrent ) => {
    if ( !dialogOriginal || !dialogCurrent ) {
        return Promise.resolve( createDialogsResult(
            dialogOriginal,
            dialogCurrent,
            !dialogCurrent ? CONSTANTS.DELETED_STATUS_DIFFER : CONSTANTS.NEW_STATUS_DIFFER,
            []
        ) );
    }

    return new Promise( ( fulfill, reject ) => {
        db
            .getDialogsResult( options, dialogOriginal, dialogCurrent )
            .then( dialogResultDb => {
                // use dialog result from database
                if ( dialogResultDb && !options.isForceDiff ) {
                    logger.info( TAG, 'differDialog', 'Using dialogs \'%s\' and \'%s\' diff result from database', LOGGER_CONSTANTS.DIALOG_DIFF_FROM_DATABASE_LOGGER, DialogHelper.createUniqueDialogId( dialogOriginal ), DialogHelper.createUniqueDialogId( dialogCurrent ) );

                    return Promise.resolve( createDialogsResult(
                        dialogOriginal,
                        dialogCurrent,
                        dialogResultDb.result,
                        dialogResultDb.differ
                    ) );
                }
                // get dialog result from image diff
                else {
                    logger.info( TAG, 'differDialog', 'Getting dialogs \'%s\' and \'%s\' diff result from image diff', LOGGER_CONSTANTS.DIALOG_DIFF_FROM_IMAGE_DIFF_LOGGER, DialogHelper.createUniqueDialogId( dialogOriginal ), DialogHelper.createUniqueDialogId( dialogCurrent ) );

                    return differDialogWithImageDiff( options, dialogOriginal, dialogCurrent );
                }
            } )
            .then( fulfill )
            .catch( reject );
    } );
};

/**
 * @param {Suite.Options} options
 * @param {Suite.Dialog|null} dialogOriginal
 * @param {Suite.Dialog|null} dialogCurrent
 * @returns {Promise<Suite.DialogsResult>}
 */
function differDialogWithImageDiff( options, dialogOriginal, dialogCurrent ) {
    return new Promise( ( fulfill, reject ) => {
        Promise
            .all( [
                prepareDialogScreenshots( dialogOriginal ),
                prepareDialogScreenshots( dialogCurrent )
            ] )
            .then( ( [dialogOriginal, dialogCurrent] ) => {
                return Promise.all( dialogOriginal.screenshots.map( ( screenshot, i ) => {
                    return self.differDialogScreenshot( dialogOriginal.screenshots[i], dialogCurrent.screenshots[i] );
                } ) );
            } )
            .then( result => {
                /** @type {Suite.DialogsResult} */
                const dialogsResult = createDialogsResult(
                    dialogOriginal,
                    dialogCurrent,
                    CONSTANTS.IDENTICAL_STATUS_DIFFER,
                    []
                );

                result.forEach( ( { isIdentical, base64 }, i ) => {
                    if ( !isIdentical ) {
                        dialogsResult.result = CONSTANTS.CHANGED_STATUS_DIFFER;
                    }

                    dialogsResult.differ.push( {
                        index: i,
                        result: isIdentical ? CONSTANTS.IDENTICAL_STATUS_DIFFER : CONSTANTS.CHANGED_STATUS_DIFFER,
                        base64
                    } );
                } );

                return Promise.resolve( dialogsResult );
            } )
            .then( dialogsResult => db.saveDialogsResult( options, dialogOriginal, dialogCurrent, dialogsResult ) )
            .then( ( { dialogsResult } ) => fulfill( dialogsResult ) )
            .catch( reject )
    } );
}

/**
 * @param {Suite} suite
 * @returns {Promise<SuiteResult>}
 */
module.exports.differSuite = ( suite ) => {
    return new Promise( ( fulfill, reject ) => {
        /** @type {SuiteResult} */
        const suiteResult = SuiteHelper.prepareSuiteResults( suite );
        logger.log( TAG, 'differSuite', 'Differ suite...' );

        Promise
            .all( Object
                .keys( suiteResult.results )
                .map( dialogId => self.differDialog( suite.options, suiteResult.results[dialogId].original, suiteResult.results[dialogId].current ) )
            )
            .then( results => {
                logger.log( TAG, 'differSuite', 'Diffed suite' );

                results.forEach( dialogResult => {
                    if ( suiteResult.results[dialogResult.dialogId] ) {
                        suiteResult.results[dialogResult.dialogId] = dialogResult
                    }
                    else {
                        logger.error( TAG, 'differSuite', 'Suite result does not exist', dialogResult );
                    }
                } );

                fulfill( suiteResult );
            } )
            .catch( reject );
    } );
};