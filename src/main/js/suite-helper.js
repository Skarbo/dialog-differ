/**
 * @param {Suite} suite
 * @returns {Suite}
 */
module.exports.prepareSuiteCollections = ( suite ) => {
    const collections = {};

    suite.current.forEach( dialog => {
        collections[dialog.id] = {
            id: dialog.id,
            current: dialog,
            original: null,
            result: null
        }
    } );
    suite.original.forEach( dialog => {
        if ( !collections[dialog.id] ) {
            collections[dialog.id] = {
                id: dialog.id,
                current: null,
                original: null,
                result: null
            };
        }

        collections[dialog.id].original = dialog
    } );

    suite.collections = collections;

    return suite;
};