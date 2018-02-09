const TAG = 'Snap';

const Horseman = require( 'node-horseman' );

const logger = require( '../logger' );

const config = require( '../../../../config.json' );

const LOGGER_CONSTANTS = require( '../constants/logger-constants' );
const ERROR_CONSTANTS = require( '../constants/error-constants' );

const DialogHelper = require( '../helpers/dialog.helper' );
const ErrorHelper = require( '../helpers/error.helper' );

Horseman.registerAction( 'dialogScreenshot',
    /**
     * @param {DialogDiffer.Dialog} dialog
     * @param {{height: Number, width: Number}} size
     * @param {DatabaseHandler} databaseHandler
     * @return {Promise<DialogDiffer.Dialog>}
     */
    function ( dialog, size, databaseHandler ) {
        const self = this;

        return new Promise( ( fulfill, reject ) => {
            logger.log(
                TAG,
                'dialogScreenshot',
                'Taking screenshot \'%s\', \'%s%s\'',
                LOGGER_CONSTANTS.SCREENSHOT_FROM_HORSEMAN_LOGGER, DialogHelper.createUniqueDialogScreenshotId( dialog, { width: size.width, height: size.height } ),
                dialog.url,
                dialog.hash ? `#${dialog.hash}` : ''
            );

            const chain = dialog.crop
                ? self.cropBase64( dialog.crop, 'PNG' )
                : self.screenshotBase64( 'PNG' );

            return chain
                .then( result => {
                    /** @type {DialogDiffer.DialogScreenshot} */
                    const dialogScreenshot = DialogHelper.createDialogScreenshot( size.width, size.height, `data:image/png;base64,${result}` );

                    dialog.screenshots.push( dialogScreenshot );

                    // save screenshot to database
                    return databaseHandler.saveDialogScreenshot( dialog, dialogScreenshot );
                } )
                .then( fulfill )
                .catch( err => reject( ErrorHelper.createError( err, 'Could not take dialog screenshot', ERROR_CONSTANTS.DIALOG_SCREENSHOT_ERROR ) ) );
        } );
    } );

/**
 * Stop CSS animations
 *  This will run in PhantomJS environment
 */
function evaluateStopCSSAnimations() {
    /*eslint-disable */
    const css = '* { animation: none!important; -webkit-animation: none!important }',
        head = document.head || document.getElementsByTagName( 'head' )[0],
        style = document.createElement( 'style' );

    style.type = 'text/css';
    if ( style.styleSheet ) {
        style.styleSheet.cssText = css;
    } else {
        style.appendChild( document.createTextNode( css ) );
    }

    head.appendChild( style );
    /*eslint-enable */
}

/**
 * Redirects location hash
 *  This will run in PhantomJS environment
 * @param {String} hash
 */
function evaluateRedirectHash( hash ) {
    /*eslint-disable */
    document.location.hash = hash;
    /*eslint-enable */
}

class SnapHandler {
    constructor( databaseHandler ) {
        this.databaseHandler = databaseHandler;
    }

    /**
     * @param {DialogDiffer.Suite} suite
     * @param {DialogDiffer.OnSnapCallback} [onSnap]
     * @return {Promise<DialogDiffer.Suite>}
     */
    snapSuite( suite, { onSnap } = {} ) {
        return new Promise( ( fulfill, reject ) => {
            logger.log( TAG, 'snapSuite', 'Snapping suite..', null, suite );

            Promise
                .all( [
                    this.snapSuiteDialogs( suite.options, suite.original, { onSnap } ),
                    this.snapSuiteDialogs( suite.options, suite.current, { onSnap } ),
                ] )
                .then( () => ( logger.log( TAG, 'snapSuite', 'Snapped suite' ), true ) )
                .then( () => fulfill( suite ) )
                .catch( err => reject( ErrorHelper.createError( err, 'Could not snap Suite', ERROR_CONSTANTS.SNAP_SUITE_ERROR ) ) )
        } );
    }

    /**
     * @param {DialogDiffer.Options} options
     * @param {Array<DialogDiffer.Dialog>} dialogs
     * @param {DialogDiffer.OnSnapCallback} [onSnap]
     * @return {Promise<Array<DialogDiffer.Dialog>>}
     */
    snapSuiteDialogs( options, dialogs, { onSnap } = {} ) {
        // prepare dialogs screenshots
        dialogs.forEach( dialog => {
            if ( !dialog.screenshots ) {
                dialog.screenshots = [];
            }
        } );

        return new Promise( ( fulfill, reject ) => {
            this.databaseHandler
                .getDialogsScreenshots( dialogs, options.sizes )
                .then( dialogsScreenshotsDb => {
                    const dialogsCollection = DialogHelper.collectSnappedDialogs( options, dialogs, dialogsScreenshotsDb );

                    return Promise.all( [].concat( dialogsCollection.snappedCollection.map( par => {
                        // snapped collection
                        if ( Array.isArray( par ) ) {
                            return this.snapDialogsWithHashFromDatabase(
                                par.map( snappedCollectedDialog => snappedCollectedDialog.dialog ),
                                par.map( snappedCollectedDialog => snappedCollectedDialog.screenshots ),
                                { onSnap }
                            );
                        }
                        else {
                            return this.snapDialogFromDatabase( par.dialog, par.screenshots );
                        }
                    } ), dialogsCollection.nonSnappedCollection.map( par => {
                        // non snapped collection
                        if ( Array.isArray( par ) ) {
                            return this.snapDialogsWithHashFromHorseman(
                                options,
                                par.map( snappedCollectedDialog => snappedCollectedDialog.dialog ),
                                { onSnap }
                            );
                        }
                        else {
                            return this.snapDialogFromHorseman(
                                options,
                                par.dialog,
                                { onSnap }
                            );
                        }
                    } ) ) );
                } )
                .then( result => {
                    fulfill( result.reduce( ( acc, cur ) => ( acc = acc.concat( cur ), acc ), [] ) );
                } )
                .catch( err => reject( ErrorHelper.createError( err, 'Could not snap Suite dialogs', ERROR_CONSTANTS.SNAP_SUITE_DIALOGS_ERROR ) ) );
        } );
    }

    /**
     * @param {DialogDiffer.Options} options
     * @param {DialogDiffer.Dialog} dialog
     * @param {DialogDiffer.OnSnapCallback} [onSnap]
     * @return {Promise<DialogDiffer.Dialog>}
     */
    snapDialog( options, dialog, { onSnap } = {} ) {
        return new Promise( ( fulfill, reject ) => {
            // prepare dialog screenshots
            if ( !dialog.screenshots ) {
                dialog.screenshots = [];
            }

            this.databaseHandler
                .getDialogScreenshots( dialog, DialogHelper.getDialogSizes( options.sizes, dialog ) )
                .then( dialogScreenshotsDb => {
                    // use dialog from database if already snapped, and not force new snap
                    if ( DialogHelper.isDialogSnapped( DialogHelper.getDialogSizes( options.sizes, dialog ), dialog, dialogScreenshotsDb ) && !options.isForceSnap ) {
                        return this.snapDialogFromDatabase( dialog, dialogScreenshotsDb );
                    }
                    // snap dialog using horseman
                    else {
                        return this.snapDialogFromHorseman( options, dialog );
                    }
                } )
                .then( () => ( onSnap ? onSnap( dialog ) : null ) )
                .then( () => fulfill( dialog ) )
                .catch( reject );
        } );
    }

    /**
     * @param {DialogDiffer.Dialog} dialog
     * @param {Array<DialogDiffer.Database.DialogScreenshot>} dialogScreenshotsDb
     * @param {DialogDiffer.OnSnapCallback} [onSnap]
     * @return {Promise<DialogDiffer.Dialog>}
     * @private
     */
    snapDialogFromDatabase( dialog, dialogScreenshotsDb, { onSnap } = {} ) {
        logger.log( TAG, 'snapDialogFromDatabase', 'Snapping dialog \'%s\' from database', null, dialog.id );

        return new Promise( ( fulfill ) => {
            // append dialog screenshots from database
            dialogScreenshotsDb.forEach( dialogScreenshotDb => {
                dialog.screenshots.push( DialogHelper.createDialogScreenshot( dialogScreenshotDb.width, dialogScreenshotDb.height, dialogScreenshotDb.base64 ) );
            } );

            logger.info( TAG, 'snapDialogFromDatabase', 'Dialog \'%s\' using \'%d\' screenshots from database', LOGGER_CONSTANTS.SCREENSHOTS_FROM_DATABASE_LOGGER, DialogHelper.createUniqueDialogId( dialog ), dialogScreenshotsDb.length );

            if ( onSnap ) {
                onSnap( dialog );
            }

            fulfill( dialog );
        } );
    }

    /**
     * @param {DialogDiffer.Options} options
     * @param {DialogDiffer.Dialog} dialog
     * @param {DialogDiffer.OnSnapCallback} [onSnap]
     * @return {Promise<DialogDiffer.Dialog>}
     * @private
     */
    snapDialogFromHorseman( options, dialog, { onSnap } = {} ) {
        logger.log( TAG, 'snapDialogFromHorseman', 'Snapping dialog \'%s\' from horseman', null, dialog.id );

        function onError( err ) {
            err = ErrorHelper.createError( err, 'Could not snap dialog from Horseman. Version: \'%s\'. Id: \'%s\'. Url: \'%s\'.', ERROR_CONSTANTS.SNAP_DIALOG_FROM_HORSEMAN_ERROR, dialog.version, dialog.id, dialog.url, { options } );

            dialog.error = {
                code: err.code,
                message: err.message,
                args: err.args,
                stack: err.stack,
            };

            logger.error( TAG, 'snapDialogFromHorseman', err.message, err.code, ...err.args, err.stack );
        }

        return new Promise( ( fulfill ) => {
            try {
                const horseman = new Horseman( {
                    timeout: config.horsemanTimeout,
                } );
                const sizes = DialogHelper.getDialogSizes( options.sizes, dialog );

                let chain = horseman
                    .on( 'error', msg => {
                        logger.warn( TAG, 'snapDialogFromHorseman', 'Error in dialog. Message: \'%s\'. Version: \'%s\'. Id: \'%s\'. Url: \'%s\'.', ERROR_CONSTANTS.SNAP_DIALOG_FROM_HORSEMAN_ERROR, msg, dialog.version, dialog.id, dialog.url );
                    } )
                    .open( dialog.url )
                    .evaluate( evaluateStopCSSAnimations );

                // wait for selector
                if ( dialog.waitForSelector ) {
                    chain = chain
                        .waitForSelector( dialog.waitForSelector );
                }

                // foreach dialog size
                sizes.forEach( size => {
                    chain = chain
                        .viewport( size.width, size.height )
                        .wait( dialog.timeout || 0 )
                        .dialogScreenshot( dialog, size, this.databaseHandler )
                } );

                // callback
                if ( onSnap ) {
                    chain = chain.then( () => {
                        onSnap( dialog );
                        return Promise.resolve( dialog );
                    } );
                }

                chain
                    .then( () => fulfill( dialog ) )
                    .catch( err => {
                        onError( err );

                        fulfill( dialog );
                    } )
                    .close();
            }
            catch ( err ) {
                onError( err );
                fulfill( dialog );
            }
        } );
    }

    /**
     * @param {Array<DialogDiffer.Dialog>} dialogs
     * @param {Array<Array<DialogDiffer.Database.DialogScreenshot>>} dialogsScreenshotsDb
     * @param {DialogDiffer.OnSnapCallback} [onSnap]
     * @returns {Promise<Array<DialogDiffer.Dialog>>}
     * @private
     */
    snapDialogsWithHashFromDatabase( dialogs, dialogsScreenshotsDb, { onSnap } ) {
        logger.log( TAG, 'snapDialogsWithHashFromDatabase', 'Snapping %d dialogs with hash from database', null, dialogs.length );

        return new Promise( ( fulfill, reject ) => {
            Promise
                .all( dialogs.map( ( dialog, i ) => this.snapDialogFromDatabase( dialog, dialogsScreenshotsDb[i], { onSnap } ) ) )
                .then( () => fulfill( dialogs ) )
                .catch( err => reject( ErrorHelper.createError( err, 'Could not snap dialogs with hash from database', ERROR_CONSTANTS.SNAP_DIALOGS_WITH_HASH_FROM_DB_ERROR ) ) );
        } );
    }

    /**
     * @param {DialogDiffer.Options} options
     * @param {Array<DialogDiffer.Dialog>} dialogs
     * @param {DialogDiffer.OnSnapCallback} [onSnap]
     * @returns {Promise<Array<DialogDiffer.Dialog>>}
     * @private
     */
    snapDialogsWithHashFromHorseman( options, dialogs, { onSnap } = {} ) {
        const dialogUrl = dialogs[0].url;
        const dialogVersion = dialogs[0].version;
        const dialogId = dialogs[0].id;
        const dialogHashList = dialogs.map( dialog => dialog.hash );
        let lastDialog = dialogs[0].id;

        logger.log( TAG, 'snapDialogsWithHashFromHorseman', 'Snapping %d dialogs with hash from horseman', null, dialogs.length, dialogs.map( dialog => dialog.id ) );

        function onError( err ) {
            err = ErrorHelper.createError( err, 'Could not snap dialogs with hash from Horseman. Url: \'%s\'. Version: \'%s\'. First id: \'%s\'. Last dialog id: \'%s\'. Hash list: \'%s\'.', ERROR_CONSTANTS.SNAP_DIALOGS_WITH_HASH_FROM_HORSEMAN_ERROR, dialogUrl, dialogVersion, dialogId, lastDialog, dialogHashList.join( ', ' ) );

            dialogs.forEach( dialog => {
                dialog.error = {
                    code: err.code,
                    message: err.message,
                    args: err.args,
                    stack: err.stack,
                };
            } );

            logger.error( TAG, 'snapDialogsWithHashFromHorseman', err.message, err.code, ...err.args, err.stack );
        }

        return new Promise( ( fulfill ) => {
            try {
                const horseman = new Horseman( {
                    timeout: config.horsemanTimeout,
                } );

                let chain = horseman
                    .on( 'error', msg => {
                        logger.warn( TAG, 'snapDialogsWithHashFromHorseman', 'Error in dialogs with hash. Message: \'%s\', Url: \'%s\'. Version: \'%s\'. First id: \'%s\'. Hash list: \'%s\'.', ERROR_CONSTANTS.SNAP_DIALOGS_WITH_HASH_FROM_HORSEMAN_ERROR, msg, dialogUrl, dialogVersion, dialogId, dialogHashList.join( ', ' ) );
                    } )
                    .open( dialogUrl )
                    .evaluate( evaluateStopCSSAnimations );

                dialogs.forEach( dialog => {
                    dialog.screenshots = [];
                    const sizes = DialogHelper.getDialogSizes( options.sizes, dialog );

                    logger.log( TAG, 'snapDialogsWithHashFromHorseman', 'Dialog \'%s\',  \'%s\'', null, DialogHelper.createUniqueDialogId( dialog ), dialog.hash );

                    chain = chain
                        .then( () => {
                            lastDialog = dialog.id;
                        } );

                    // crop
                    if ( dialog.crop ) {
                        // full viewport
                        chain = chain
                            .viewport( 1000, 1000 );

                        // foreach dialog size
                        sizes.forEach( size => {
                            // change hash
                            chain = chain
                                .evaluate( evaluateRedirectHash, dialog.hash
                                    .replace( /%width%/, size.width )
                                    .replace( /%height%/, size.height ) );

                            // wait for selector
                            if ( dialog.waitForSelector ) {
                                chain = chain
                                    .waitForSelector( dialog.waitForSelector );
                            }

                            // take screenshot
                            chain = chain
                                .wait( dialog.timeout || 0 )
                                .dialogScreenshot( dialog, size, this.databaseHandler );
                        } );
                    }
                    // no crop
                    else {
                        // change hash
                        chain = chain
                            .evaluate( evaluateRedirectHash, dialog.hash );

                        // wait for selector
                        if ( dialog.waitForSelector ) {
                            chain = chain
                                .waitForSelector( dialog.waitForSelector );
                        }

                        // foreach dialog size
                        sizes.forEach( size => {
                            chain = chain
                                .viewport( size.width, size.height )
                                .wait( dialog.timeout || 0 )
                                .dialogScreenshot( dialog, size, this.databaseHandler )
                        } );
                    }

                    // callback
                    if ( onSnap ) {
                        chain = chain.then( () => {
                            onSnap( dialog );
                            return Promise.resolve( dialog );
                        } );
                    }
                } );

                chain
                    .then( () => fulfill( dialogs ) )
                    .catch( err => {
                        onError( err );
                        fulfill( dialogs );
                    } )
                    .close();
            }
            catch ( err ) {
                onError( err );
                fulfill( dialogs );
            }
        } );
    }
}

module.exports = SnapHandler;