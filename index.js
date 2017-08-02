/**
 * @typedef {Error} Suite.Error
 * @property {String} message
 * @property {String} code
 * @property {Object} args
 * @memberOf Suite
 */

/**
 * @typedef {Object} Suite.DialogScreenshot
 * @property {String} base64
 * @property {Number} height
 * @property {Number} width
 * @property {String} [path] Injected
 * @property {Function} [removeCallback] Injected
 * @memberOf Suite
 */

/**
 * @typedef {Object} Suite.DialogResultDiff
 * @property {Number} index
 * @property {String} result
 * @property {String} base64
 * @memberOf Suite
 */

/**
 * @typedef {Object} Suite.Dialog
 * @property {String} version
 * @property {String} id
 * @property {String} url
 * @property {String} [hash]
 * @property {String} [waitForSelector]
 * @property {Number} [timeout]
 * @property {Array<Suite.DialogScreenshot>} [screenshots] Injected
 * @memberOf Suite
 */

/**
 * @typedef {Object} Suite.Options
 * @property {Array<{width: Number, height: Number}>} sizes
 * @property {String} originalVersion
 * @property {String} currentVersion
 * @property {Boolean} [isForceSnap]
 * @property {Boolean} [isForceDiff]
 * @property {String} [database]
 * @memberOf Suite
 */

/**
 * @typedef {Object} Suite.DialogsResult
 * @property {String} dialogId
 * @property {Suite.Dialog} original
 * @property {Suite.Dialog} current
 * @property {String} originalVersion
 * @property {String} currentVersion
 * @property {String} result
 * @property {Array<Suite.DialogResultDiff>} differ
 * @memberOf Suite
 */

/**
 * @typedef {Object} Suite
 * @property {Suite.Options} options
 * @property {Array<Suite.Dialog>} original
 * @property {Array<Suite.Dialog>} current
 */

/**
 * @typedef {Object} SuiteResult
 * @property {Suite.Options} options
 * @property {{id: Suite.DialogsResult}} [results]
 */

const db = require( './src/main/js/database' );
const snap = require( './src/main/js/snap' );
const differ = require( './src/main/js/differ' );

const ErrorHelper = require( './src/main/js/helpers/error-helper' );
const SuiteHelper = require( './src/main/js/helpers/suite-helper' );

/**
 * @param {Suite} suite
 * @return {Promise<SuiteResult, Error>}
 */
module.exports.diff = ( suite ) => {
    return new Promise( ( fulfill, reject ) => {
        SuiteHelper.validateSuite( suite )
            .then( () => db.initDB( suite.options.database ) )
            .then( () => snap.snapSuite( suite ) )
            .then( () => differ.differSuite( suite ) )
            .then( fulfill )
            .catch( err => reject( ErrorHelper.createError( err, 'Unexpected error' ) ) );
    } );
};