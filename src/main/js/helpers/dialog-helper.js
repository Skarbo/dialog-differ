const SuiteHelper = require( './suite-helper' );

/**
 * @param width
 * @param height
 * @param base64
 * @return {Suite.DialogScreenshot}
 */
module.exports.createDialogScreenshot = ( width, height, base64 ) => {
    return {
        width: width,
        height: height,
        base64: base64
    };
};

/**
 * @param {Suite.Dialog} dialog
 * @return {String}
 */
module.exports.createUniqueDialogId = ( dialog ) => {
    return `${dialog.version}/${dialog.id}`;
};

/**
 * @param {Suite.Dialog} dialog
 * @param {Database.DialogScreenshot|Suite.DialogScreenshot} dialogScreenshot
 * @return {String}
 */
module.exports.createUniqueDialogScreenshotId = ( dialog, dialogScreenshot ) => {
    return `${dialog.version}/${dialog.id}/${dialogScreenshot.width}/${dialogScreenshot.height}`;
};

/**
 * @param {Suite.Options} options
 * @param {Suite.Dialog} dialogOriginal
 * @param {Suite.Dialog} dialogCurrent
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
 * @param {Suite.Options} options
 * @param {Suite.Dialog} dialog
 * @param {Array<Database.DialogScreenshot>} dialogScreenshotsDb Sorted by width
 */
module.exports.isDialogSnapped = ( options, dialog, dialogScreenshotsDb ) => {
    const sizes = Array.from( options.sizes ).sort( size => size.width );
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