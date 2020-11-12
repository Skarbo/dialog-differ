import {DialogDifferError} from '../interfaces'

require('string-format-js')

export function createError (err: Error | DialogDifferError | null, message: string, code: string = null, ...args: any[]): DialogDifferError {
  code = err && 'code' in err && err.code ? err.code : code
  // @ts-ignore
  // eslint-disable-next-line prefer-spread
  message = (message || '').format.apply(message || '', args)
  err = err && 'args' in err ? err.err : err || new Error(message)

  args = args.concat(err && 'args' in err ? err.args : [])

  return {
    code,
    message,
    err: err as Error,
    stack: err.stack,
    args,
    toString: () => {
      let str = ''

      if (code) {
        str += `[${code}] `
      }

      str += `${err.message}`

      return str
    }
  }
}
