const collections = {
    logs: [],
    warns: [],
    errors: [],
    infos: []
};

/**
 * @interface Logger
 */

/**
 * @typedef {Object} Logger.Log
 * @property {String} tag
 * @property {String} code
 * @property {String} context
 * @property {String} message
 * @property {Array} args
 * @memberOf Logger
 */

function createMessage( { type, tag, context, code, message } ) {
    let logMessage = `[${type}] [${tag}~${context}]`;

    if ( code ) {
        logMessage += ` [${code}]`;
    }

    logMessage += ` ${message}`;

    return logMessage;
}

module.exports.log = ( tag, context, message, code, ...args ) => {
    //console.log.apply( null, [createMessage( { type: 'LOG', tag, context, code, message } )].concat( args ) );

    collections.logs.push( {
        tag,
        context,
        code,
        message,
        args: args
    } );
};

module.exports.warn = ( tag, context, message, code, ...args ) => {
    console.warn.apply( null, [createMessage( { type: 'WARN', tag, context, code, message } )].concat( args ) );

    collections.warns.push( {
        tag,
        context,
        code,
        message,
        args: args
    } );
};

module.exports.error = ( tag, context, message, code, ...args ) => {
    console.error.apply( null, [createMessage( { type: 'ERROR', tag, context, code, message } )].concat( args ) );

    collections.errors.push( {
        tag,
        context,
        code,
        message,
        args: args
    } );
};

module.exports.info = ( tag, context, message, code, ...args ) => {
    //console.info.apply( null, [createMessage( { type: 'INFO', tag, context, code, message } )].concat( args ) );

    collections.infos.push( {
        tag,
        context,
        code,
        message,
        args: args
    } );
};

module.exports.clear = () => {
    collections.logs.splice( 0, collections.logs.length );
    collections.warns.splice( 0, collections.warns.length );
    collections.errors.splice( 0, collections.errors.length );
    collections.infos.splice( 0, collections.infos.length );
};

/**
 * @param {String} [type]
 * @param {String} [tag]
 * @param {String} [context]
 * @param {String} [code]
 * @return {Array<Logger.Log>}
 */
module.exports.getCollections = ( { type, tag, context, code } ) => {
    let filteredCollections = [];

    for ( let logType in collections ) {
        if ( !type || type === logType ) {
            filteredCollections = filteredCollections.concat( collections[logType].filter( log => {
                return (( tag && log.tag === tag ) || !tag)
                    && (( context && log.context === context ) || !context)
                    && (( code && log.code === code  ) || !code );
            } ) );
        }
    }

    return filteredCollections;
};

/** @type {Array<Logger.Log>} */
module.exports.logs = collections.logs;
/** @type {Array<Logger.Log>} */
module.exports.warns = collections.warns;
/** @type {Array<Logger.Log>} */
module.exports.errors = collections.errors;
/** @type {Array<Logger.Log>} */
module.exports.infos = collections.infos;