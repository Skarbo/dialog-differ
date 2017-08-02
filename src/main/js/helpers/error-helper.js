/**
 * @param {Error|Suite.Error|null} err
 * @param {String} message
 * @param {String} [code]
 * @param {Object} [args]
 * @return {Suite.Error}
 */
module.exports.createError = ( err, message, code = null, args = {} ) => {
    code = err && err.code || code;
    args = err && err.args || args;
    message = err && err.message || message;

    err = err || new Error( message, code );
    err.code = code;
    err.args = args;

    err.toString = () => {
        let str = '';

        if ( err.code ) {
            str += `[${code}] `;
        }

        str += `${err.message}`;

        return str;
    };

    return err;
};