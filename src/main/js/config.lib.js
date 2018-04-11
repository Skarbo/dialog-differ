const extend = require('extend')
const defaultConfig = require('../../../config.json')

/**
 * @param {DialogDiffer.Config} [config]
 * @return {DialogDiffer.Config}
 */
module.exports.getConfig = (config = {}) => {
  return extend(true, defaultConfig, config)
}
