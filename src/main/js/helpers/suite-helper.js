const ERROR_CONSTANTS = require( '../constants/error-constants' );

const ErrorHelper = require( './error-helper' );

/**
 * @param {Suite} suite
 * @returns {SuiteResult}
 */
module.exports.prepareSuiteResults = ( suite ) => {
    const suiteResult = {
        options: suite.options,
        results: {}
    };

    /**
     * @param {String} dialogId
     * @return {Suite.DialogsResult}
     */
    const createEmptyResult = ( dialogId ) => {
        return {
            dialogId: dialogId,
            current: null,
            original: null,
            originalVersion: null,
            currentVersion: null,
            result: null,
            differ: []
        };
    };

    suite.current.forEach( dialog => {
        suiteResult.results[dialog.id] = createEmptyResult( dialog.id );
        suiteResult.results[dialog.id].current = dialog;
        suiteResult.results[dialog.id].originalVersion = dialog.version;
    } );

    suite.original.forEach( dialog => {
        if ( !suiteResult.results[dialog.id] ) {
            suiteResult.results[dialog.id] = createEmptyResult( dialog.id );
        }

        suiteResult.results[dialog.id].original = dialog;
        suiteResult.results[dialog.id].originalVersion = dialog.version;
    } );

    return suiteResult;
};

/**
 * @param {Suite.Options} options
 * @return {String}
 */
module.exports.createUniqueOptionsId = ( options ) => {
    const sizes = Array.from( options.sizes ).sort( size => size.width );
    return sizes.map( size => `${size.width}/${size.height}` ).join( '/' );
};

/**
 * @param {Suite} suite
 * @return {Promise<Boolean>}
 */
module.exports.validateSuite = ( suite ) => {
    /*
     * Validate options
     */
    if ( !suite.options ) {
        return Promise.reject( ErrorHelper.createError( null, 'Missing options', ERROR_CONSTANTS.SUITE_OPTIONS_ERROR ) );
    }

    if ( !suite.options.sizes || !Array.isArray( suite.options.sizes ) || suite.options.sizes.length === 0 ) {
        return Promise.reject( ErrorHelper.createError( null, 'Size is not given', ERROR_CONSTANTS.SUITE_OPTIONS_ERROR ) );
    }

    for ( let i = 0; i < suite.options.sizes.length; i++ ) {
        if ( !suite.options.sizes[i].width || !suite.options.sizes[i].height ) {
            return Promise.reject( ErrorHelper.createError( null, `Size ${i} is not valid`, ERROR_CONSTANTS.SUITE_OPTIONS_ERROR ) );
        }
    }

    // validate versions
    if ( !suite.options.originalVersion || !suite.options.currentVersion ) {
        return Promise.reject( ErrorHelper.createError( null, `Missing original or current version`, ERROR_CONSTANTS.SUITE_OPTIONS_ERROR ) );
    }

    if ( suite.options.originalVersion === suite.options.currentVersion ) {
        return Promise.reject( ErrorHelper.createError( null, `Original version is equal to current version`, ERROR_CONSTANTS.SUITE_OPTIONS_ERROR ) );
    }

    /*
     * Validate dialogs
     */
    /**
     * @param {Suite.Dialog} dialog
     * @param {String} code
     * @param {String} version
     * @param {Number} i
     */
    const validateDialog = ( dialog, code, version, i ) => {
        if ( !dialog.version || !dialog.id || !dialog.url ) {
            return ErrorHelper.createError( null, `Dialog ${i} is missing version, id or url`, code );
        }
    };

    if ( !suite.original || suite.original.length === 0 ) {
        return Promise.reject( ErrorHelper.createError( null, 'Missing original dialogs', ERROR_CONSTANTS.SUITE_ORIGINAL_DIALOG_ERROR ) );
    }

    if ( !suite.current || suite.current.length === 0 ) {
        return Promise.reject( ErrorHelper.createError( null, 'Missing current dialogs', ERROR_CONSTANTS.SUITE_CURRENT_DIALOG_ERROR ) );
    }

    for ( let i = 0; i < suite.original.length; i++ ) {
        const err = validateDialog( suite.original[i], ERROR_CONSTANTS.SUITE_ORIGINAL_DIALOG_ERROR, suite.options.originalVersion, i );

        if ( err ) {
            return Promise.reject( err );
        }
    }

    for ( let i = 0; i < suite.current.length; i++ ) {
        const err = validateDialog( suite.current[i], ERROR_CONSTANTS.SUITE_CURRENT_DIALOG_ERROR, suite.options.currentVersion, i );

        if ( err ) {
            return Promise.reject( err );
        }
    }

    return Promise.resolve( true );
};