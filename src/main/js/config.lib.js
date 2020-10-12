const extend = require('extend')
const defaultConfig = require('../../../config.json')

/**
 * @param {DialogDiffer.Config} [config]
 * @return {DialogDiffer.Config}
 */
module.exports.getConfig = (config = {}) => {
  const config_ = extend(true, defaultConfig, config)
  const args = process.argv.slice(2)

  args.forEach(arg => {
    const [key, value] = (arg.match(/--(\w+)=(\w+)/) || [null, null, null]).slice(1)
    if (key && config_.hasOwnProperty(key)) {
      try {
        config_.key = JSON.parse(value)
      }
      catch (err) {
        config_.key = value
      }
    }
  })

  return config_
}
