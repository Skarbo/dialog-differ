require('string-format-js')

/**
 * @param {Error|DialogDiffer.Error|null} err
 * @param {String} message
 * @param {String} [code]
 * @param {*} [args...]
 * @return {DialogDiffer.Error}
 */
module.exports.createError = (err, message, code = null, ...args) => {
  code = err && err.code || code
  message = (message || '').format.apply(message || '', args)
  err = err && err.args ? err.err : err || new Error(message, code)

  args = args.concat(err.args || [])

  return {
    code,
    message,
    err,
    stack: err.stack,
    args,
    toString: () => {
      let str = ''

      if (err.code) {
        str += `[${code}] `
      }

      str += `${err.message}`

      return str
    }
  }
}
