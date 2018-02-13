const TAG = 'Snap';

const puppeteer = require( 'puppeteer' );
const Promise = require( 'bluebird' );
const base64ArrayBuffer = require( 'base64-arraybuffer' );

const logger = require( '../logger' );

const config = require( '../../../../config.json' );

const LOGGER_CONSTANTS = require( '../constants/logger-constants' );
const ERROR_CONSTANTS = require( '../constants/error-constants' );

const DialogHelper = require( '../helpers/dialog.helper' );
const ErrorHelper = require( '../helpers/error.helper' );

function getElementClip( selector ) {
    /*eslint-disable */
    var iframe = document.querySelector( selector );

    return {
        y: iframe.offsetTop,
        x: iframe.offsetLeft,
        width: iframe.clientWidth,
        height: iframe.clientHeight
    };
    /*eslint-enable */
}

function puppeteerScreenshot( page, dialog, size, databaseHandler ) {
    return new Promise( ( resolve, reject ) => {
        const takeScreenshot = () => {
            if ( dialog.crop ) {
                return page
                    .evaluate( getElementClip, dialog.crop )
                    .then( clip => page.screenshot( { clip } ) );
            }
            else {
                return page.screenshot();
            }
        };

        logger.log(
            TAG,
            'dialogScreenshot',
            'Taking screenshot \'%s\', \'%s%s\'',
            LOGGER_CONSTANTS.SCREENSHOT_FROM_BROWSER_LOGGER, DialogHelper.createUniqueDialogScreenshotId( dialog, { width: size.width, height: size.height } ),
            dialog.url,
            dialog.hash ? `#${dialog.hash}` : ''
        );

        takeScreenshot()
            .then( screenshot => {
                /** @type {DialogDiffer.DialogScreenshot} */
                const dialogScreenshot = DialogHelper.createDialogScreenshot( size.width, size.height, `data:image/png;base64,${base64ArrayBuffer.encode( screenshot )}` );

                dialog.screenshots.push( dialogScreenshot );

                // save screenshot to database
                return databaseHandler.saveDialogScreenshot( dialog, dialogScreenshot );
            } )
            .then( resolve )
            .catch( err => reject( ErrorHelper.createError( err, 'Could not take dialog screenshot', ERROR_CONSTANTS.DIALOG_SCREENSHOT_ERROR ) ) );
    } );
}

/**
 * Stop CSS animations
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

            this.snapSuiteDialogs( suite.options, suite.original, { onSnap } )
                .then( () => this.snapSuiteDialogs( suite.options, suite.current, { onSnap } ) )
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

                    return Promise.each( [].concat( dialogsCollection.snappedCollection.map( par => {
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
                            return this.snapDialogsWithHashFromBrowser(
                                options,
                                par.map( snappedCollectedDialog => snappedCollectedDialog.dialog ),
                                { onSnap }
                            );
                        }
                        else {
                            return this.snapDialogFromBrowser(
                                options,
                                par.dialog,
                                { onSnap }
                            );
                        }
                    } ) ), par => par );
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
                    // snap dialog using browser
                    else {
                        return this.snapDialogFromBrowser( options, dialog );
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
        return new Promise( ( fulfill ) => {
            logger.log( TAG, 'snapDialogFromDatabase', 'Snapping dialog \'%s\' from database', null, dialog.id );

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
    snapDialogFromBrowser( options, dialog, { onSnap } = {} ) {
        function onError( err ) {
            err = ErrorHelper.createError( err, 'Could not snap dialog from Browser. Version: \'%s\'. Id: \'%s\'. Url: \'%s\'.', ERROR_CONSTANTS.SNAP_DIALOG_FROM_BROWSER_ERROR, dialog.version, dialog.id, dialog.url, { options } );

            dialog.error = {
                code: err.code,
                message: err.message,
                args: err.args,
                stack: err.stack,
            };

            logger.error( TAG, 'snapDialogFromBrowser', err.message, err.code, ...err.args, err.stack );
        }

        return new Promise( ( fulfill ) => {
            try {
                logger.log( TAG, 'snapDialogFromBrowser', 'Snapping dialog \'%s\' from browser', null, dialog.id );

                const sizes = DialogHelper.getDialogSizes( options.sizes, dialog );
                let browser;
                let page;

                puppeteer.launch( {
                    timeout: config.browserTimeout,
                } )
                    .then( browser_ => {
                        browser = browser_;
                        return browser.newPage();
                    } )
                    .then( page_ => {
                        page = page_;

                        page.on( 'error', msg => {
                            logger.warn( TAG, 'snapDialogFromBrowser', 'Error in dialog. Message: \'%s\'. Version: \'%s\'. Id: \'%s\'. Url: \'%s\'.', ERROR_CONSTANTS.SNAP_DIALOG_FROM_BROWSER_ERROR, msg, dialog.version, dialog.id, dialog.url );
                        } );

                        return page.goto( dialog.url, {
                            timeout: config.browserTimeout,
                        } )
                    } )
                    .then( () => page.evaluate( evaluateStopCSSAnimations ) )
                    .then( () => {
                        if ( dialog.waitForSelector ) {
                            return page.waitForSelector( dialog.waitForSelector, {
                                timeout: config.browserTimeout
                            } );
                        }
                        return page
                    } )
                    .then( () => {
                        logger.log( TAG, 'snapDialogFromBrowser', 'Dialog \'%s\'', null, DialogHelper.createUniqueDialogId( dialog ) );

                        // foreach dialog size
                        return Promise.each( sizes, size => {
                            return page
                                .setViewport( size )
                                .then( () => page.waitFor( dialog.timeout || 0 ) )
                                .then( () => puppeteerScreenshot( page, dialog, size, this.databaseHandler ) )
                        } );
                    } )
                    .then( () => {
                        // callback
                        if ( onSnap ) {
                            onSnap( dialog );
                        }
                        return Promise.resolve();
                    } )
                    .then( () => {
                        if ( browser ) {
                            return browser.close();
                        }
                        return Promise.resolve()
                    } )
                    .then( () => {
                        fulfill( dialog );
                    } )
                    .catch( err => {
                        onError( err );

                        if ( browser ) {
                            browser.close()
                                .then( () => fulfill( dialog ) );
                        }
                        else {
                            fulfill( dialog );
                        }
                    } );
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
        return new Promise( ( fulfill, reject ) => {
            logger.log( TAG, 'snapDialogsWithHashFromDatabase', 'Snapping %d dialogs with hash from database', null, dialogs.length );

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
    snapDialogsWithHashFromBrowser( options, dialogs, { onSnap } = {} ) {
        const dialogUrl = dialogs[0].url;
        const dialogVersion = dialogs[0].version;
        const dialogId = dialogs[0].id;
        const dialogHashList = dialogs.map( dialog => dialog.hash );
        let lastDialog = dialogs[0].id;

        function onError( err ) {
            err = ErrorHelper.createError( err, 'Could not snap dialogs with hash from Browser. Url: \'%s\'. Version: \'%s\'. First id: \'%s\'. Last dialog id: \'%s\'. Hash list: \'%s\'.', ERROR_CONSTANTS.SNAP_DIALOGS_WITH_HASH_FROM_BROWSER_ERROR, dialogUrl, dialogVersion, dialogId, lastDialog, dialogHashList.join( ', ' ) );

            dialogs.forEach( dialog => {
                dialog.error = {
                    code: err.code,
                    message: err.message,
                    args: err.args,
                    stack: err.stack,
                };
            } );

            logger.error( TAG, 'snapDialogsWithHashFromBrowser', err.message, err.code, ...err.args, err.stack );
        }

        return new Promise( ( fulfill ) => {
            try {
                logger.log( TAG, 'snapDialogsWithHashFromBrowser', 'Snapping %d dialogs with hash from browser', null, dialogs.length, dialogs.map( dialog => dialog.id ) );

                let browser;
                let page;

                puppeteer.launch( {
                    timeout: config.browserTimeout,
                } )
                    .then( browser_ => {
                        browser = browser_;
                        return browser.newPage();
                    } )
                    .then( page_ => {
                        page = page_;

                        page.on( 'error', msg => {
                            logger.warn( TAG, 'snapDialogsWithHashFromBrowser', 'Error in dialogs with hash. Message: \'%s\', Url: \'%s\'. Version: \'%s\'. First id: \'%s\'. Hash list: \'%s\'.', ERROR_CONSTANTS.SNAP_DIALOGS_WITH_HASH_FROM_BROWSER_ERROR, msg, dialogUrl, dialogVersion, dialogId, dialogHashList.join( ', ' ) );
                        } );

                        return page.goto( dialogUrl, {
                            timeout: config.browserTimeout,
                        } )
                    } )
                    .then( () => page.evaluate( evaluateStopCSSAnimations ) )
                    .then( () => {
                        return Promise.each( dialogs, ( dialog => {
                            dialog.screenshots = [];
                            lastDialog = dialog.id;
                            const sizes = DialogHelper.getDialogSizes( options.sizes, dialog );

                            logger.log( TAG, 'snapDialogsWithHashFromBrowser', 'Dialog \'%s\',  \'%s\'', null, DialogHelper.createUniqueDialogId( dialog ), dialog.hash );

                            // crop
                            if ( dialog.crop ) {
                                return page
                                    .setViewport( { width: 1000, height: 1000 } ) // full viewport
                                    .then( () => {
                                        return Promise.each( sizes, size => {
                                            return page
                                            // change hash
                                                .evaluate( evaluateRedirectHash, dialog.hash
                                                    .replace( /%width%/, size.width )
                                                    .replace( /%height%/, size.height ) )
                                                .then( () => {
                                                    // wait for selector
                                                    if ( dialog.waitForSelector ) {
                                                        return page.waitForSelector( dialog.waitForSelector, {
                                                            timeout: config.browserTimeout
                                                        } );
                                                    }
                                                    return page;
                                                } )
                                                .then( () => puppeteerScreenshot( page, dialog, size, this.databaseHandler ) )
                                        } );
                                    } )
                                    .then( () => {
                                        // callback
                                        if ( onSnap ) {
                                            onSnap( dialog );
                                        }
                                        return Promise.resolve( dialog );
                                    } );
                            }
                            // no crop
                            else {
                                // change hash
                                return page
                                    .evaluate( evaluateRedirectHash, dialog.hash )
                                    .then( () => {
                                        // wait for selector
                                        if ( dialog.waitForSelector ) {
                                            return page.waitForSelector( dialog.waitForSelector, {
                                                timeout: config.browserTimeout
                                            } );
                                        }
                                        return page
                                    } )
                                    .then( () => {
                                        return Promise.each( sizes, size => {
                                            return page
                                                .setViewport( size )
                                                .then( () => page.waitFor( dialog.timeout || 0 ) )
                                                .then( () => puppeteerScreenshot( page, dialog, size, this.databaseHandler ) )
                                        } )
                                    } )
                                    .then( () => {
                                        // callback
                                        if ( onSnap ) {
                                            onSnap( dialog );
                                        }
                                        return Promise.resolve( dialog );
                                    } );
                            }
                        } ) );
                    } )
                    .then( () => {
                        if ( browser ) {
                            return browser.close()
                        }
                        return Promise.resolve();
                    } )
                    .then( () => {
                        fulfill( dialogs );
                    } )
                    .catch( err => {
                        onError( err );

                        if ( browser ) {
                            browser.close()
                                .then( () => fulfill( dialogs ) );
                        }
                        else {
                            fulfill( dialogs );
                        }
                    } );
            }
            catch ( err ) {
                onError( err );
                fulfill( dialogs );
            }
        } );
    }
}

module.exports = SnapHandler;