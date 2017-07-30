const Horseman = require( 'node-horseman' );

Horseman.registerAction( 'dialogScreenshot', function ( dialog, size ) {
    return this
        .screenshotBase64( 'PNG' )
        .then( result => {
            dialog.screenshots.push( {
                width: size.width,
                height: size.height,
                base64: `data:image/png;base64,${result}`
            } );

            return dialog;
        } )
} );

/**
 * Stop stop CSS animations
 *  This will run in PhantomJS environment
 */
function stopCSSAnimations() {
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
}

/**
 * @param {Array<Dialog>} dialogs
 * @returns {Array<Dialog|Array<Dialog>>}
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
 * @param {Suite.Options} options
 * @param {Array<Dialog>} dialogs
 */
module.exports.snapSuiteDialogs = ( options, dialogs ) => {
    return new Promise( ( fulfill, reject ) => {
        const dialogCollection = collectDialogs( dialogs );

        Promise
            .all( dialogCollection.map( par => {
                if ( Array.isArray( par ) ) {
                    return this.snapDialogsWithHash( options, par );
                }
                else {
                    return this.snapDialog( options, par );
                }
            } ) )
            .then( result => {
                fulfill( result.reduce( ( acc, cur ) => (acc = acc.concat( cur ), acc) ), [] );
            } )
            .catch( reject );
    } );
};

/**
 * @param {Suite.Options} options
 * @param {Array<Dialog>} dialogs Dialogs with given hash and same URL
 * @returns {Promise<Array<Dialog>>}
 */
module.exports.snapDialogsWithHash = function snapDialog( options, dialogs ) {
    return new Promise( ( fulfill, reject ) => {
        const horseman = new Horseman();

        const url = dialogs[0].url;

        let chain = horseman
            .open( url )
            .evaluate( stopCSSAnimations );

        dialogs.forEach( dialog => {
            dialog.screenshots = [];

            // change hash
            chain = chain
                .evaluate( function ( hash ) {
                    document.location.hash = hash;
                }, dialog.hash );

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
};

/**
 * @param {Suite.Options} options
 * @param {Dialog} dialog
 */
module.exports.snapDialog = function snapDialog( options, dialog ) {
    return new Promise( ( fulfill, reject ) => {
        const horseman = new Horseman();

        dialog.screenshots = [];

        let chain = horseman
            .open( dialog.url )
            .evaluate( stopCSSAnimations );

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
};