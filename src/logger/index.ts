import * as LOGGER_CONSTANTS from '../constants/logger.constants'

type LoggerLog = {
  tag: string
  code: string
  context: string
  message: string
  args: any[]
}

type Collections = {
  logs: LoggerLog[]
  warns: LoggerLog[]
  errors: LoggerLog[]
  infos: LoggerLog[]
}

const collections: Collections = {
  logs: [],
  warns: [],
  errors: [],
  infos: []
}

let currentLevel = LOGGER_CONSTANTS.ERROR_LOG_LEVEL

function createMessage ({type, tag, context, code, message}: { type: string, tag: string, context: string, code: string, message: string }) {
  let logMessage = `[${type}] [${tag}~${context}]`

  if (code) {
    logMessage += ` [${code}]`
  }

  logMessage += ` ${message}`

  return logMessage
}

function createLogLevelNumber (level: string): number {
  if (level === LOGGER_CONSTANTS.INFO_LOG_LEVEL) {
    return 1
  }
  else if (level === LOGGER_CONSTANTS.ERROR_LOG_LEVEL) {
    return 2
  }
  else if (level === LOGGER_CONSTANTS.NONE_LOG_LEVEL) {
    return -1
  }
  else {
    return 0
  }
}

function isLogLevel (level: string): boolean {
  if (currentLevel === LOGGER_CONSTANTS.NONE_LOG_LEVEL) {
    return false
  }
  return createLogLevelNumber(level) >= createLogLevelNumber(currentLevel)
}

export function log (tag: string, context: string, message: string, code: string, ...args: any[]): void {
  if (isLogLevel(LOGGER_CONSTANTS.DEBUG_LOG_LEVEL)) {
    // eslint-disable-next-line no-console
    console.log.apply(null, [createMessage({type: 'LOG', tag, context, code, message})].concat(args))
  }

  collections.logs.push({
    tag,
    context,
    code,
    message,
    args: args
  })
}

export function warn (tag: string, context: string, message: string, code: string, ...args: any[]): void {
  if (isLogLevel(LOGGER_CONSTANTS.INFO_LOG_LEVEL)) {
    // eslint-disable-next-line no-console
    console.warn.apply(null, [createMessage({type: 'WARN', tag, context, code, message})].concat(args))
  }

  collections.warns.push({
    tag,
    context,
    code,
    message,
    args: args
  })
}

export function error (tag: string, context: string, message: string, code: string, ...args: any[]): void {
  if (isLogLevel(LOGGER_CONSTANTS.ERROR_LOG_LEVEL)) {
    // eslint-disable-next-line no-console
    console.error.apply(null, [createMessage({type: 'ERROR', tag, context, code, message})].concat(args))
  }

  collections.errors.push({
    tag,
    context,
    code,
    message,
    args: args
  })
}

export function info (tag: string, context: string, message: string, code: string, ...args: any[]): void {
  if (isLogLevel(LOGGER_CONSTANTS.INFO_LOG_LEVEL)) {
    // eslint-disable-next-line no-console
    console.info.apply(null, [createMessage({type: 'INFO', tag, context, code, message})].concat(args))
  }

  collections.infos.push({
    tag,
    context,
    code,
    message,
    args: args
  })
}

export function clear (): void {
  collections.logs.splice(0, collections.logs.length)
  collections.warns.splice(0, collections.warns.length)
  collections.errors.splice(0, collections.errors.length)
  collections.infos.splice(0, collections.infos.length)
}

export function getCollections ({type, tag, context, code}: { type?: keyof Collections, tag?: string, context?: string, code?: string }): LoggerLog[] {
  let filteredCollections: LoggerLog[] = []

  Object.entries(collections).forEach(([logType, logs]) => {
    if (!type || type === logType) {
      filteredCollections = filteredCollections.concat(logs.filter(log => {
        return ((tag && log.tag === tag) || !tag) && ((context && log.context === context) || !context) && ((code && log.code === code) || !code)
      }))
    }
  })

  return filteredCollections
}

export const level = currentLevel

export function setLevel (level: string): void {
  currentLevel = level
}

export const logs = collections.logs
export const warns = collections.warns
export const errors = collections.errors
export const infos = collections.infos
