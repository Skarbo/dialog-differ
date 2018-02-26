const extend = require('extend')
const defaultConfig = require('../../../config')

/**
 * @param {DialogDiffer.Config} [config]
 * @return {DialogDiffer.Config}
 */
module.exports.getConfig = (config = {}) => {
  return extend(true, defaultConfig, config)
}
