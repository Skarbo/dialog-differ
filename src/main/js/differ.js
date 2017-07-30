const tmp = require( 'tmp' );
const path = require( 'path' );
const imageDiff = require( 'image-diff' );
const base64Img = require( 'base64-img' );

const SuiteHelper = require( './suite-helper' );

const CONSTANTS = require( './constants' );

/**
 * @param {Dialog} dialog
 * @returns {Promise<Dialog>}
 */
function prepareDialogScreenshots( dialog ) {
    return new Promise( ( fulfill ) => {
        dialog.screenshots.forEach( screenshot => {
            const tmpFile = tmp.fileSync( {
                postfix: '.png'
            } );

            screenshot.path = tmpFile.name;
            base64Img.imgSync( screenshot.base64, path.dirname( tmpFile.name ), path.basename( tmpFile.name, '.png' ) );
        } );

        fulfill( dialog );
    } );
}

/**
 * @param {DialogScreenshot} screenshotOriginal
 * @param {DialogScreenshot} screenshotCurrent
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
        } );
    } );
};

/**
 * @param {Dialog|null} dialogOriginal
 * @param {Dialog|null} dialogCurrent
 * @returns {Promise<DialogResult>}
 */
module.exports.differDialog = ( dialogOriginal, dialogCurrent ) => {
    if ( !dialogOriginal || !dialogCurrent ) {
        return Promise.resolve( {
            original: dialogOriginal,
            current: dialogCurrent,
            status: !dialogCurrent ? CONSTANTS.DIFFER_STATUS_DELETED : CONSTANTS.DIFFER_STATUS_NEW,
            differ: []
        } );
    }

    return new Promise( ( fulfill, reject ) => {
        Promise
            .all( [
                prepareDialogScreenshots( dialogOriginal ),
                prepareDialogScreenshots( dialogCurrent )
            ] )
            .then( ( [dialogOriginal, dialogCurrent] ) => {
                return Promise.all( dialogOriginal.screenshots.map( ( screenshot, i ) => {
                    return this.differDialogScreenshot( dialogOriginal.screenshots[i], dialogCurrent.screenshots[i] );
                } ) );
            } )
            .then( result => {
                const dialogResult = {
                    id: dialogOriginal.id,
                    original: dialogOriginal,
                    current: dialogCurrent,
                    status: CONSTANTS.DIFFER_STATUS_IDENTICAL,
                    differ: []
                };

                result.forEach( ( { isIdentical, base64 }, i ) => {
                    if ( !isIdentical ) {
                        dialogResult.status = CONSTANTS.DIFFER_STATUS_CHANGED;
                    }

                    dialogResult.differ.push( {
                        index: i,
                        status: isIdentical ? CONSTANTS.DIFFER_STATUS_IDENTICAL : CONSTANTS.DIFFER_STATUS_CHANGED,
                        base64
                    } );
                } );

                return dialogResult;
            } )
            .then( fulfill )
            .catch( reject )
    } );
};

/**
 * @param {Suite} suite
 * @returns {Promise<Suite>}
 */
module.exports.differSuite = ( suite ) => {
    return new Promise( ( fulfill, reject ) => {
        SuiteHelper.prepareSuiteCollections( suite );

        Promise
            .all( Object
                .keys( suite.collections )
                .map( id => this.differDialog( suite.collections[id].original, suite.collections[id].current ) )
            )
            .then( results => {
                results.forEach( dialogResult => {
                    suite.collections[dialogResult.id].result = dialogResult
                } );

                fulfill( suite );
            } )
            .catch( reject );
    } );
};