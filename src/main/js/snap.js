const Horseman = require( 'node-horseman' );

const logger = require( './logger' );
const db = require( './database' );

const LOGGER_CONSTANTS = require( './constants/logger-constants' );

const DialogHelper = require( './helpers/dialog-helper' );

const TAG = 'Snap';
const self = this;

module.exports.TAG = TAG;

Horseman.registerAction( 'dialogScreenshot',
    /**
     * @param {Suite.Dialog} dialog
     * @param {{height: Number, width: Number}} size
     * @return {Promise<Suite.Dialog>}
     */
    function ( dialog, size ) {
        const self = this;

        return new Promise( ( fulfill, reject ) => {
            logger.info(
                TAG,
                'dialogScreenshot',
                'Taking screenshot \'%s\', \'%s%s\'',
                LOGGER_CONSTANTS.SCREENSHOT_FROM_HORSEMAN_LOGGER, DialogHelper.createUniqueDialogScreenshotId( dialog, { width: size.width, height: size.height } ),
                dialog.url,
                dialog.hash ? `#${dialog.hash}` : ''
            );

            return self
                .screenshotBase64( 'PNG' )
                .then( result => {
                    /** @type {Suite.DialogScreenshot} */
                    const dialogScreenshot = DialogHelper.createDialogScreenshot( size.width, size.height, `data:image/png;base64,${result}` );

                    dialog.screenshots.push( dialogScreenshot );

                    // save screenshot to database
                    return db.saveDialogScreenshot( dialog, dialogScreenshot );
                } )
                .then( fulfill )
                .catch( reject );
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

/**
 * @param {Array<Suite.Dialog>} dialogs
 * @returns {Array<Suite.Dialog|Array<Suite.Dialog>>}
 */
function collectDialogs( dialogs ) {
    const collection = {};

    dialogs.forEach( dialog => {
        if ( dialog.hash ) {
            if ( !collection[dialog.url] ) {
                collection[dialog.url] = [];
            }

            collection[dialog.url].push( dialog );
        }
        else {
            collection[dialog.url] = dialog;
        }
    } );

    return Object.keys( collection ).map( url => collection[url] );
}

/**
 * @param {Suite} suite
 * @return {Promise<Suite>}
 */
module.exports.snapSuite = ( suite ) => {
    return new Promise( ( fulfill, reject ) => {
        logger.log( TAG, 'snapSuite', 'Snapping suite..' );

        Promise
            .all( [
                self.snapSuiteDialogs( suite.options, suite.original ),
                self.snapSuiteDialogs( suite.options, suite.current ),
            ] )
            .then( () => (logger.log( TAG, 'snapSuite', 'Snapped suite' ), true) )
            .then( () => fulfill( suite ) )
            .catch( reject )
    } );
};

/**
 * @param {Suite.Options} options
 * @param {Array<Suite.Dialog>} dialogsNdb
 * @return {Promise<Array<Suite.Dialog>>}
 */
module.exports.snapSuiteDialogs = ( options, dialogs ) => {
    return new Promise( ( fulfill, reject ) => {
        const dialogCollection = collectDialogs( dialogs );

        Promise
            .all( dialogCollection.map( par => {
                if ( Array.isArray( par ) ) {
                    return self.snapDialogsWithHash( options, par );
                }
                else {
                    return self.snapDialog( options, par );
                }
            } ) )
            .then( result => {
                fulfill( result.reduce( ( acc, cur ) => (acc = acc.concat( cur ), acc), [] ) );
            } )
            .catch( reject );
    } );
};

/**
 * @param {Suite.Options} options
 * @param {Array<Suite.Dialog>} dialogs Dialogs with given hash and same URL
 * @returns {Promise<Array<Suite.Dialog>>}
 */
module.exports.snapDialogsWithHash = ( options, dialogs ) => {
    return new Promise( ( fulfill, reject ) => {
        logger.log( TAG, 'snapDialogsWithHash', '‰s dialogs with url \'%s\', version \'%s\'', null, dialogs.length, dialogs[0].url, dialogs[0].version );

        // prepare dialogs screenshots
        dialogs.forEach( dialog => {
            if ( !dialog.screenshots ) {
                dialog.screenshots = [];
            }
        } );

        db
            .getDialogsScreenshots( dialogs )
            .then( dialogsScreenshotsDb => {
                const isDialogsSnapped = dialogsScreenshotsDb
                    .filter( ( dialogScreenshotDb, i ) => DialogHelper.isDialogSnapped( options, dialogs[i], dialogScreenshotDb ) )
                    .length === dialogs.length;

                // use dialogs screenshots with hash from database if already snapped, and not force new snap
                if ( isDialogsSnapped && !options.isForceSnap ) {
                    return snapDialogsWithHashFromDatabase( dialogs, dialogsScreenshotsDb );
                }
                // snap dialogs with hash using horseman
                else {
                    return snapDialogsWithHashFromHorseman( options, dialogs );
                }
            } )
            .then( () => fulfill( dialogs ) )
            .catch( reject );
    } );
};

/**
 * @param {Suite.Options} options
 * @param {Suite.Dialog} dialog
 * @return {Promise<Suite.Dialog>}
 */
module.exports.snapDialog = function snapDialog( options, dialog ) {
    return new Promise( ( fulfill, reject ) => {
        // prepare dialog screenshots
        if ( !dialog.screenshots ) {
            dialog.screenshots = [];
        }

        db
            .getDialogScreenshots( dialog )
            .then( dialogScreenshotsDb => {
                // use dialog from database if already snapped, and not force new snap
                if ( DialogHelper.isDialogSnapped( options, dialog, dialogScreenshotsDb ) && !options.isForceSnap ) {
                    return snapDialogFromDatabase( dialog, dialogScreenshotsDb );
                }
                // snap dialog using horseman
                else {
                    return snapDialogFromHorseman( options, dialog );
                }
            } )
            .then( () => fulfill( dialog ) )
            .catch( reject );
    } );
};

/**
 * @param {Suite.Dialog} dialog
 * @param {Array<Database.DialogScreenshot>} dialogScreenshotsDb
 * @return {Promise<Suite.Dialog>}
 */
function snapDialogFromDatabase( dialog, dialogScreenshotsDb ) {
    return new Promise( ( fulfill ) => {
        // append dialog screenshots from database
        dialogScreenshotsDb.forEach( dialogScreenshotDb => {
            dialog.screenshots.push( DialogHelper.createDialogScreenshot( dialogScreenshotDb.width, dialogScreenshotDb.height, dialogScreenshotDb.base64 ) );
        } );

        logger.info( TAG, 'snapDialog', 'Dialog \'%s\' using \'%d\' screenshots from database', LOGGER_CONSTANTS.SCREENSHOTS_FROM_DATABASE_LOGGER, DialogHelper.createUniqueDialogId( dialog ), dialogScreenshotsDb.length );

        fulfill( dialog );
    } );
}

/**
 * @param {Suite.Options} options
 * @param {Suite.Dialog} dialog
 * @return {Promise<Suite.Dialog>}
 */
function snapDialogFromHorseman( options, dialog ) {
    return new Promise( ( fulfill, reject ) => {
        const horseman = new Horseman();

        let chain = horseman
            .open( dialog.url )
            .evaluate( evaluateStopCSSAnimations );

        // wait for selector
        if ( dialog.waitForSelector ) {
            chain = chain
                .waitForSelector( dialog.waitForSelector );
        }

        // foreach dialog size
        options.sizes.forEach( size => {
            chain = chain
                .viewport( size.width, size.height )
                .wait( dialog.timeout || 0 )
                .dialogScreenshot( dialog, size )
        } );

        chain
            .then( () => fulfill( dialog ) )
            .catch( reject )
            .close();
    } );
}

/**
 * @param {Array<Suite.Dialog>} dialogs
 * @param {Array<Array<Database.DialogScreenshot>>} dialogsScreenshotsDb
 * @returns {Promise<Array<Suite.Dialog>>}
 */
function snapDialogsWithHashFromDatabase( dialogs, dialogsScreenshotsDb ) {
    return new Promise( ( fulfill, reject ) => {
        Promise
            .all( dialogs.map( ( dialog, i ) => snapDialogFromDatabase( dialog, dialogsScreenshotsDb[i] ) ) )
            .then( () => fulfill( dialogs ) )
            .catch( reject );
    } );
}

/**
 * @param {Suite.Options} options
 * @param {Array<Suite.Dialog>} dialogs
 * @returns {Promise<Array<Suite.Dialog>>}
 */
function snapDialogsWithHashFromHorseman( options, dialogs ) {
    return new Promise( ( fulfill, reject ) => {
        const horseman = new Horseman();

        const url = dialogs[0].url;

        let chain = horseman
            .open( url )
            .evaluate( evaluateStopCSSAnimations );

        dialogs.forEach( dialog => {
            dialog.screenshots = [];

            logger.log( TAG, 'snapDialogsWithHashFromHorseman', 'Dialog \'%s\',  \'%s\'', null, DialogHelper.createUniqueDialogId( dialog ), dialog.hash );

            // change hash
            chain = chain
                .evaluate( evaluateRedirectHash, dialog.hash );

            // wait for selector
            if ( dialog.waitForSelector ) {
                chain = chain
                    .waitForSelector( dialog.waitForSelector );
            }

            // foreach dialog size
            options.sizes.forEach( size => {
                chain = chain
                    .viewport( size.width, size.height )
                    .wait( dialog.timeout || 0 )
                    .dialogScreenshot( dialog, size )
            } );
        } );

        chain
            .then( () => fulfill( dialogs ) )
            .catch( reject )
            .close();
    } );
}