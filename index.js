/**
 * @typedef {Object} DialogScreenshot
 * @property {String} base64
 * @property {Number} height
 * @property {Number} width
 * @property {String} path
 */

/**
 * @typedef {Object} DialogResult
 * @property {String} id
 * @property {Dialog} original
 * @property {Dialog} new
 * @property {String} status
 * @property {Array<{index: Number, status: String, base64: String}>} differ
 */

/**
 * @typedef {Object} Dialog
 * @property {String} id
 * @property {String} url
 * @property {String} [hash]
 * @property {String} [waitForSelector]
 * @property {Number} [timeout]
 * @property {Array<DialogScreenshot>} screenshots
 */

/**
 * @typedef {Object} Suite.Options
 * @property {Array<{width: Number, height: Number}>} sizes
 * @memberOf Suite
 */

/**
 * @typedef {Object} Suite.Collection
 * @property {String} id
 * @property {String} original
 * @property {String} current
 * @property {DialogResult} [result]
 * @memberOf Suite
 */

/**
 * @typedef {Object} Suite
 * @property {Suite.Options} options
 * @property {Array<Dialog>} original
 * @property {Array<Dialog>} current
 * @property {{id: Suite.Collection}} [collections]
 */
