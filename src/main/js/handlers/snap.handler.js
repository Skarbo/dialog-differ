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

/**
 * @param {String} selector
 * @return {{y: Number, x: Number, width: Number, height: Number}|null}
 */
function getElementClipEvaluate( selector ) {
    /*eslint-disable */
    var element = document.querySelector( selector );

    if ( !element ) {
        return null;
    }

    return {
        y: element.offsetTop,
        x: element.offsetLeft,
        width: element.clientWidth,
        height: element.clientHeight
    };
    /*eslint-enable */
}

/**
 * Stop CSS animations
 */
function stopCSSAnimationsEvaluate() {
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
function redirectHashEvaluate( hash ) {
    /*eslint-disable */
    document.location.hash = hash;
    /*eslint-enable */
}

/**
 * @param {Page} page
 * @param {DialogDiffer.Dialog} dialog
 * @param {{width: Number, height: Number}} size
 * @param {DatabaseHandler} databaseHandler
 * @return {Promise<DialogDiffer.Database.DialogScreenshot>}
 */
async function puppeteerScreenshot( page, dialog, size, databaseHandler ) {
    logger.log(
        TAG,
        'dialogScreenshot',
        'Taking screenshot \'%s\', \'%s%s\'. Crop \'%s\'.',
        LOGGER_CONSTANTS.SCREENSHOT_FROM_BROWSER_LOGGER,
        DialogHelper.createUniqueDialogScreenshotId( dialog, { width: size.width, height: size.height } ),
        dialog.url,
        dialog.hash ? `#${dialog.hash}` : '',
        dialog.crop || false
    );

    const takeScreenshot = async () => {
        if ( dialog.crop ) {
            const clip = await page.evaluate( getElementClipEvaluate, dialog.crop );
            return page.screenshot( { clip } );
        }
        else {
            return page.screenshot();
        }
    };

    try {
        // take screenshot
        const screenshot = await takeScreenshot();

        // create dialog screenshot
        const dialogScreenshot = DialogHelper.createDialogScreenshot( size.width, size.height, `data:image/png;base64,${base64ArrayBuffer.encode( screenshot )}` );

        // push dialog screenshot to dialog
        dialog.screenshots.push( dialogScreenshot );

        // save dialog screenshot to database
        return databaseHandler.saveDialogScreenshot( dialog, dialogScreenshot );
    }
    catch ( err ) {
        throw ErrorHelper.createError( err, 'Could not take dialog screenshot', ERROR_CONSTANTS.DIALOG_SCREENSHOT_ERROR )
    }
}

/**
 * @class
 */
class SnapHandler {
    /**
     * @param {DatabaseHandler} databaseHandler
     */
    constructor( databaseHandler ) {
        this.databaseHandler = databaseHandler;
    }

    /**
     * @param {DialogDiffer.Suite} suite
     * @param {DialogDiffer.OnSnapCallback} [onSnap]
     * @return {Promise<DialogDiffer.Suite>}
     */
    async snapSuite( suite, { onSnap } = {} ) {
        logger.log( TAG, 'snapSuite', 'Snapping suite..', null, suite );

        try {
            // snap original dialogs
            await this.snapSuiteDialogs( suite.options, suite.original, { onSnap } );
            // snap current dialogs
            await this.snapSuiteDialogs( suite.options, suite.current, { onSnap } );

            logger.log( TAG, 'snapSuite', 'Snapped suite', null, suite.id );
            return suite;
        }
        catch ( err ) {
            throw ErrorHelper.createError( err, 'Could not snap Suite', ERROR_CONSTANTS.SNAP_SUITE_ERROR );
        }
    }

    /**
     * @param {DialogDiffer.Options} options
     * @param {Array<DialogDiffer.Dialog>} dialogs
     * @param {DialogDiffer.OnSnapCallback} [onSnap]
     * @return {Promise<Array<DialogDiffer.Dialog>>}
     */
    async snapSuiteDialogs( options, dialogs, { onSnap } = {} ) {
        // prepare dialogs screenshots
        dialogs.forEach( dialog => {
            if ( !dialog.screenshots ) {
                dialog.screenshots = [];
            }
        } );

        try {
            // get dialogs screenshots from database
            const dialogsScreenshotsDb = await this.databaseHandler.getDialogsScreenshots( dialogs, options.sizes );

            // collect snapped and non snapped dialogs from dialogs screenshots from database
            const dialogsCollection = DialogHelper.collectSnappedDialogs( options, dialogs, dialogsScreenshotsDb );

            logger.log( TAG, 'snapSuiteDialogs', 'Snapping \'%s\' dialogs. Non snapped collections \'%s\'. Snapped collections \'%s\'.', null, dialogs.length, dialogsCollection.nonSnappedCollection.length, dialogsCollection.snappedCollection.length );

            // snap dialogs from database or from browser
            const result = await Promise.all( [].concat( dialogsCollection.snappedCollection.map( par => {
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
            } ) ) );

            // reduce result collections to one dialogs array
            const snappedDialogs = result.reduce( ( acc, cur ) => ( acc = acc.concat( cur ), acc ), [] );

            logger.log( TAG, 'snapSuiteDialogs', 'Snapped dialogs \'%s\'. Collections \'%s\'.', null, snappedDialogs.length, result.length );

            return snappedDialogs;
        }
        catch ( err ) {
            throw ErrorHelper.createError( err, 'Could not snap Suite dialogs', ERROR_CONSTANTS.SNAP_SUITE_DIALOGS_ERROR )
        }
    }

    /**
     * @param {DialogDiffer.Options} options
     * @param {DialogDiffer.Dialog} dialog
     * @param {DialogDiffer.OnSnapCallback} [onSnap]
     * @return {Promise<DialogDiffer.Dialog>}
     */
    async snapDialog( options, dialog, { onSnap } = {} ) {
        // prepare dialog screenshots
        if ( !dialog.screenshots ) {
            dialog.screenshots = [];
        }

        try {
            const dialogScreenshotsDb = await this.databaseHandler.getDialogScreenshots( dialog, DialogHelper.getDialogSizes( options.sizes, dialog ) );

            // use dialog from database if already snapped, and not force new snap
            if ( DialogHelper.isDialogSnapped( DialogHelper.getDialogSizes( options.sizes, dialog ), dialog, dialogScreenshotsDb ) && !options.isForceSnap ) {
                await this.snapDialogFromDatabase( dialog, dialogScreenshotsDb );
            }
            // snap dialog using browser
            else {
                await this.snapDialogFromBrowser( options, dialog );
            }

            if ( onSnap ) {
                onSnap( dialog );
            }

            return dialog;
        }
        catch ( err ) {
            throw err;
        }
    }

    /**
     * @param {DialogDiffer.Dialog} dialog
     * @param {Array<DialogDiffer.Database.DialogScreenshot>} dialogScreenshotsDb
     * @param {DialogDiffer.OnSnapCallback} [onSnap]
     * @return {Promise<DialogDiffer.Dialog>}
     * @private
     */
    async snapDialogFromDatabase( dialog, dialogScreenshotsDb, { onSnap } = {} ) {
        logger.log( TAG, 'snapDialogFromDatabase', 'Snapping dialog \'%s\' from database', null, dialog.id );

        // append dialog screenshots from database
        dialogScreenshotsDb.forEach( dialogScreenshotDb => {
            dialog.screenshots.push( DialogHelper.createDialogScreenshot( dialogScreenshotDb.width, dialogScreenshotDb.height, dialogScreenshotDb.base64 ) );
        } );

        logger.info( TAG, 'snapDialogFromDatabase', 'Dialog \'%s\' using \'%d\' screenshots from database', LOGGER_CONSTANTS.SCREENSHOTS_FROM_DATABASE_LOGGER, DialogHelper.createUniqueDialogId( dialog ), dialogScreenshotsDb.length );

        if ( onSnap ) {
            onSnap( dialog );
        }

        return dialog;
    }

    /**
     * @param {DialogDiffer.Options} options
     * @param {DialogDiffer.Dialog} dialog
     * @param {DialogDiffer.OnSnapCallback} [onSnap]
     * @return {Promise<DialogDiffer.Dialog>}
     * @private
     */
    async snapDialogFromBrowser( options, dialog, { onSnap } = {} ) {
        let browser;
        let page;

        try {
            logger.log( TAG, 'snapDialogFromBrowser', 'Snapping dialog \'%s\' from browser', null, DialogHelper.createUniqueDialogId( dialog ) );

            // get sizes
            const sizes = DialogHelper.getDialogSizes( options.sizes, dialog );

            // create browser
            browser = await puppeteer.launch( {
                timeout: config.browserTimeout,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            } );

            // create page
            page = await browser.newPage();

            page.on( 'error', msg => {
                logger.warn(
                    TAG,
                    'snapDialogFromBrowser',
                    'Error in dialog. Message: \'%s\'. Version: \'%s\'. Id: \'%s\'. Url: \'%s\'.',
                    ERROR_CONSTANTS.SNAP_DIALOG_FROM_BROWSER_ERROR,
                    msg,
                    dialog.version,
                    dialog.id,
                    dialog.url
                );
            } );

            // go to dialog url
            await page.goto( dialog.url, {
                timeout: config.browserTimeout,
            } );

            // stop CSS animation
            await page.evaluate( stopCSSAnimationsEvaluate );

            // wait for selector
            if ( dialog.waitForSelector ) {
                await page.waitForSelector( dialog.waitForSelector, {
                    timeout: config.browserTimeout
                } );
            }

            // foreach dialog size
            await Promise.each( sizes, async size => {
                // set viewport
                await page.setViewport( size );

                // wait for timeout
                await page.waitFor( dialog.timeout || 0 );

                // resize
                if ( dialog.resize ) {
                    // resize
                    let newSize = await page.evaluate( dialog.resize, size.width, size.height );

                    // set new viewport
                    await page.setViewport( newSize );

                    // resize once more in case of responsive changes
                    newSize = await page.evaluate( dialog.resize, newSize.width, newSize.height );

                    // set new viewport
                    await page.setViewport( newSize );
                }

                // take screenshot
                await puppeteerScreenshot( page, dialog, size, this.databaseHandler );
            } );

            // callback
            if ( onSnap ) {
                onSnap( dialog );
            }
        }
        catch ( err ) {
            const error = ErrorHelper.createError(
                err,
                'Could not snap dialog from Browser. Version: \'%s\'. Id: \'%s\'. Url: \'%s%s\'.',
                ERROR_CONSTANTS.SNAP_DIALOG_FROM_BROWSER_ERROR,
                dialog.version,
                dialog.id,
                dialog.url,
                dialog.hash && `#${dialog.hash}` || '',
                { options }
            );

            dialog.error = {
                code: error.code,
                message: error.message,
                args: error.args,
                stack: error.stack,
            };

            logger.error( TAG, 'snapDialogFromBrowser', error.message, error.code, ...error.args, error.stack );
        }

        // close page and browser
        if ( page ) {
            await page.close();
        }
        if ( browser ) {
            await browser.close();
        }

        return dialog;
    }

    /**
     * @param {Array<DialogDiffer.Dialog>} dialogs
     * @param {Array<Array<DialogDiffer.Database.DialogScreenshot>>} dialogsScreenshotsDb
     * @param {DialogDiffer.OnSnapCallback} [onSnap]
     * @returns {Promise<Array<DialogDiffer.Dialog>>}
     * @private
     */
    async snapDialogsWithHashFromDatabase( dialogs, dialogsScreenshotsDb, { onSnap } ) {
        logger.log( TAG, 'snapDialogsWithHashFromDatabase', 'Snapping %d dialogs with hash from database', null, dialogs.length );

        try {
            await Promise.all( dialogs.map( ( dialog, i ) => this.snapDialogFromDatabase( dialog, dialogsScreenshotsDb[i], { onSnap } ) ) );

            return dialogs;
        }
        catch ( err ) {
            throw ErrorHelper.createError( err, 'Could not snap dialogs with hash from database', ERROR_CONSTANTS.SNAP_DIALOGS_WITH_HASH_FROM_DB_ERROR );
        }
    }

    /**
     * @param {DialogDiffer.Options} options
     * @param {Array<DialogDiffer.Dialog>} dialogs
     * @param {DialogDiffer.OnSnapCallback} [onSnap]
     * @returns {Promise<Array<DialogDiffer.Dialog>>}
     * @private
     */
    async snapDialogsWithHashFromBrowser( options, dialogs, { onSnap } = {} ) {
        const dialogUrl = dialogs[0].url;
        const dialogVersion = dialogs[0].version;
        const dialogId = dialogs[0].id;
        const dialogHashList = dialogs.map( dialog => dialog.hash );
        let lastDialog = dialogs[0].id;

        let browser;

        try {
            logger.log( TAG, 'snapDialogsWithHashFromBrowser', 'Snapping %d dialogs with hash from browser', null, dialogs.length, dialogs.map( dialog => dialog.id ) );

            // launch browser
            browser = await puppeteer.launch( {
                timeout: config.browserTimeout,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            } );

            await Promise.map( dialogs,
                /** @type {DialogDiffer.Dialog} dialog */
                async dialog => {
                    dialog.screenshots = [];
                    lastDialog = dialog.id;

                    logger.log( TAG, 'snapDialogsWithHashFromBrowser', 'Dialog \'%s\',  \'%s\'', null, DialogHelper.createUniqueDialogId( dialog ), dialog.hash );

                    // get sizes
                    const sizes = DialogHelper.getDialogSizes( options.sizes, dialog );

                    let page;
                    try {
                        // create page
                        page = await browser.newPage();

                        // listen on error
                        page.on( 'error', msg => {
                            logger.warn( TAG, 'snapDialogsWithHashFromBrowser', 'Error in dialogs with hash. Message: \'%s\', Url: \'%s\'. Version: \'%s\'. First id: \'%s\'. Hash list: \'%s\'.', ERROR_CONSTANTS.SNAP_DIALOGS_WITH_HASH_FROM_BROWSER_ERROR, msg, dialogUrl, dialogVersion, dialogId, dialogHashList.join( ', ' ) );
                        } );

                        // go to dialog url
                        await page.goto( dialogUrl, {
                            timeout: config.browserTimeout,
                        } );

                        // stop CSS animations
                        await page.evaluate( stopCSSAnimationsEvaluate );

                        // redirect to hash
                        await page.evaluate( redirectHashEvaluate, dialog.hash );

                        // wait for selector
                        if ( dialog.waitForSelector ) {
                            await page.waitForSelector( dialog.waitForSelector, {
                                timeout: config.browserTimeout
                            } );
                        }

                        // for each size
                        await Promise.each( sizes, async size => {
                            // set viewport
                            await page.setViewport( size );

                            // wait for timeout
                            await page.waitFor( dialog.timeout || 0 );

                            // resize
                            if ( dialog.resize ) {
                                // resize
                                let newSize = await page.evaluate( dialog.resize, size.width, size.height );

                                // set new viewport
                                await page.setViewport( newSize );

                                // resize once more in case of responsive changes
                                newSize = await page.evaluate( dialog.resize, newSize.width, newSize.height );

                                // set new viewport
                                await page.setViewport( newSize );
                            }

                            // take screenshot
                            await puppeteerScreenshot( page, dialog, size, this.databaseHandler )
                        } );

                        // close page
                        await page.close();

                        // callback
                        if ( onSnap ) {
                            onSnap( dialog );
                        }
                    }
                    catch ( err ) {
                        if ( page ) {
                            page.close();
                        }

                        const error = ErrorHelper.createError(
                            err,
                            'Could not snap dialog with hash from Browser. Url: \'%s%s\'. Version: \'%s\'. Dialog id: \'%s\'.',
                            ERROR_CONSTANTS.SNAP_DIALOG_WITH_HASH_FROM_BROWSER_ERROR,
                            dialogUrl, dialog.hash ? `#${dialog.hash}` : '',
                            dialogVersion,
                            dialogId
                        );

                        dialog.error = {
                            code: error.code,
                            message: error.message,
                            args: error.args,
                            stack: error.stack,
                        };

                        logger.error( TAG, 'snapDialogsWithHashFromBrowser', error.message, error.code, ...error.args, error.stack );
                    }
                },
                { concurrency: 10 }
            );
        }
        catch ( err ) {
            const error = ErrorHelper.createError( err, 'Could not snap dialogs with hash from Browser. Url: \'%s\'. Version: \'%s\'. First id: \'%s\'. Last dialog id: \'%s\'. Hash list: \'%s\'.', ERROR_CONSTANTS.SNAP_DIALOGS_WITH_HASH_FROM_BROWSER_ERROR, dialogUrl, dialogVersion, dialogId, lastDialog, dialogHashList.join( ', ' ) );

            dialogs.forEach( dialog => {
                dialog.error = {
                    code: error.code,
                    message: error.message,
                    args: error.args,
                    stack: error.stack,
                };
            } );

            logger.error( TAG, 'snapDialogsWithHashFromBrowser', error.message, error.code, ...error.args, error.stack );
        }

        // close browser
        if ( browser ) {
            await browser.close();
        }

        return dialogs;
    }
}

module.exports = SnapHandler;