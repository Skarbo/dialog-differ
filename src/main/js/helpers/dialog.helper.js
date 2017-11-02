const self = this;

const SuiteHelper = require( './suite.helper' );

/**
 * @param width
 * @param height
 * @param base64
 * @return {DialogDiffer.DialogScreenshot}
 */
module.exports.createDialogScreenshot = ( width, height, base64 ) => {
    return {
        width: width,
        height: height,
        base64: base64
    };
};

/**
 * @param {DialogDiffer.Dialog} dialog
 * @return {String}
 */
module.exports.createUniqueDialogId = ( dialog ) => {
    return `${dialog.version}/${dialog.id}`;
};

/**
 * @param {DialogDiffer.Dialog} dialog
 * @param {DialogDiffer.Database.DialogScreenshot|DialogDiffer.DialogScreenshot} dialogScreenshot
 * @return {String}
 */
module.exports.createUniqueDialogScreenshotId = ( dialog, dialogScreenshot ) => {
    return `${dialog.version}/${dialog.id}/${dialogScreenshot.width}/${dialogScreenshot.height}`;
};

/**
 * @param {DialogDiffer.Options} options
 * @param {DialogDiffer.Dialog} dialogOriginal
 * @param {DialogDiffer.Dialog} dialogCurrent
 * @return {String}
 */
module.exports.createUniqueDialogResultId = ( options, dialogOriginal, dialogCurrent ) => {
    return [
        this.createUniqueDialogId( dialogOriginal ),
        this.createUniqueDialogId( dialogCurrent ),
        SuiteHelper.createUniqueOptionsId( options )
    ].join( '-' );
};

/**
 * @param {Array<{width: Number, height: Number}>} sizes
 * @param {DialogDiffer.Dialog} dialog
 * @param {Array<DialogDiffer.Database.DialogScreenshot>} dialogScreenshotsDb Sorted by width
 */
module.exports.isDialogSnapped = ( sizes, dialog, dialogScreenshotsDb ) => {
    if ( !dialogScreenshotsDb ) {
        return false;
    }

    if ( dialogScreenshotsDb.length === 0 ) {
        return false;
    }

    sizes = Array.from( sizes ).sort( size => size.width );
    const sortedDialogScreenshotsDb = Array.from( dialogScreenshotsDb ).sort( dialogScreenshotDb => dialogScreenshotDb.width );

    if ( sizes.length === sortedDialogScreenshotsDb.length ) {
        for ( let i = 0; i < sortedDialogScreenshotsDb.length; i++ ) {
            if ( sizes[i].width !== sortedDialogScreenshotsDb[i].width || sizes[i].height !== sortedDialogScreenshotsDb[i].height ) {
                return false;
            }
        }

        return true;
    }
    return false;
};

/**
 * @typedef {Object} DialogDiffer.SnappedCollectedDialog
 * @property {DialogDiffer.Dialog} dialog
 * @property {Array<DialogDiffer.Database.DialogScreenshot>} [screenshots]
 * @memberOf DialogDiffer
 */

/**
 * @param {DialogDiffer.Options} options
 * @param {Array<DialogDiffer.Dialog>} dialogs
 * @param {Array<Array<DialogDiffer.Database.DialogScreenshot>>} dialogsScreenshotsDb
 * @return {{snappedCollection: Array<Array<DialogDiffer.SnappedCollectedDialog>|DialogDiffer.SnappedCollectedDialog>, nonSnappedCollection: Array<Array<DialogDiffer.SnappedCollectedDialog>|DialogDiffer.SnappedCollectedDialog>}}
 */
module.exports.collectSnappedDialogs = ( options, dialogs, dialogsScreenshotsDb ) => {
    const snappedCollection = {};
    const nonSnappedCollection = {};

    dialogs.forEach( ( dialog, i ) => {
        if ( !options.isForceSnap && self.isDialogSnapped( this.getDialogSizes( options.sizes, dialog ), dialog, dialogsScreenshotsDb[i] ) ) {
            if ( dialog.hash ) {
                if ( !snappedCollection[dialog.url] ) {
                    snappedCollection[dialog.url] = [];
                }

                snappedCollection[dialog.url].push( { dialog, screenshots: dialogsScreenshotsDb[i] } );
            }
            else {
                snappedCollection[dialog.url] = { dialog, screenshots: dialogsScreenshotsDb[i] };
            }
        }
        else {
            if ( dialog.hash ) {
                if ( !nonSnappedCollection[dialog.url] ) {
                    nonSnappedCollection[dialog.url] = [];
                }

                nonSnappedCollection[dialog.url].push( { dialog } );
            }
            else {
                nonSnappedCollection[dialog.url] = { dialog };
            }
        }
    } );

    return {
        snappedCollection: Object.keys( snappedCollection ).map( url => snappedCollection[url] ),
        nonSnappedCollection: Object.keys( nonSnappedCollection ).map( url => nonSnappedCollection[url] ),
    };

};

/**
 * @param {Array<{width: Number, height: Number}>} sizes
 * @param {DialogDiffer.Dialog} dialog
 */
module.exports.getDialogSizes = ( sizes, dialog ) => {
    return dialog && dialog.options && dialog.options.sizes || sizes;
};