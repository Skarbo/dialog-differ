import {DialogDifferConfig} from '../interfaces'

const defaultConfig = require('../../config.json')

export function getConfig (config: DialogDifferConfig = {}): DialogDifferConfig {
  const config_: DialogDifferConfig = {...defaultConfig, ...config}
  const args = process.argv.slice(2)

  args.forEach(arg => {
    const [key, value] = (arg.match(/--(\w+)=(\w+)/) || [null, null, null]).slice(1)
    if (key && config_.hasOwnProperty(key)) {
      try {
        // @ts-ignore
        config_[key] = JSON.parse(value)
      }
      catch (err) {
        // @ts-ignore
        config_[key] = value
      }
    }
  })

  return config_
}
