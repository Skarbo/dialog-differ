export type DialogDifferLogLevel = 'error' | 'info' | 'none' | 'debug'

export type DialogDifferSize = { width: number, height: number }

export interface DialogDifferConfig {
  /** Default error */
  logLevel?: DialogDifferLogLevel
  /** Milliseconds to wait for browser instance to start, page to open, and page waiting selectors */
  browserTimeout?: number
  /** {@link https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#puppeteerlaunchoptions|Puppeteer launch options} */
  puppeteerLaunchOptions?: Record<string, unknown>
  /** Number of hash dialogs to collect into collections (0 is off) */
  snapDialogsWithHashFromBrowserCollections?: number
  /** Number of hash dialogs with has to run at same time */
  snapDialogsWithHashFromBrowserConcurrency?: number
  /** Diff highlight color, default red */
  diffHighlightColor?: string
  /** Diff tolerance, see {@link https://github.com/gemini-testing/looks-same|looks-same} library */
  diffTolerance?: number
}

export interface DialogDifferError {
  code: string
  message: string
  args?: any[]
  err?: Error | null
  stack?: unknown
  toString: () => string
}

export interface DialogDifferDialogScreenshot {
  id?: string
  base64: string
  height: number
  width: number
  path?: string
  removeCallback?: () => void
}

export interface DialogDifferDialogResultDiff {
  index: number
  result: string
  base64: string
}

export interface DialogDifferDialogOptions {
  sizes?: DialogDifferSize[]
  extra?: Record<string, unknown>
}

export interface DialogDifferDialog {
  version: string
  id: string
  url: string
  hash?: string
  waitForSelector?: string
  crop?: string
  timeout?: number
  resize?: (width: number, height: number) => { width: number, height: number }
  error?: DialogDifferError
  screenshots?: DialogDifferDialogScreenshot[]
  options?: DialogDifferDialogOptions
}

export interface DialogDifferOptions {
  sizes: DialogDifferSize[]
  originalVersion: string
  currentVersion: string
  isForceSnap?: boolean
  isForceDiff?: boolean
  extra?: Record<string, unknown>
}


export interface DialogDifferDialogsResult {
  dialogId: string
  original?: DialogDifferDialog | null
  current?: DialogDifferDialog | null
  originalVersion: string
  currentVersion: string
  originalOptions?: DialogDifferDialogOptions
  currentOptions?: DialogDifferDialogOptions
  result: string
  differ?: DialogDifferDialogResultDiff[]
}

export interface DialogDifferSuiteStats {
  identical: number
  changed: number
  added: number
  deleted: number
  duration: number
  error: number
  dialogs: number
}

export interface DialogDifferSuite {
  id?: string
  options: DialogDifferOptions,
  original: DialogDifferDialog[]
  current: DialogDifferDialog[]
}

export interface DialogDifferSuiteResult {
  id?: string
  status: 'running' | 'finished' | 'error'
  errorCode?: string
  timestamp?: number
  options?: DialogDifferOptions
  stats?: DialogDifferSuiteStats
  results: DialogDifferDialogsResult[]
}

export interface DialogDifferSnappedCollection {
  dialogs: DialogDifferSnappedCollectedDialog[]
  dialogsWithHash: DialogDifferSnappedCollectedDialog[][]
}

export interface DialogDifferSnappedCollectedDialog {
  dialog: DialogDifferDialog
  screenshots?: DialogDifferDatabaseDialogScreenshot[]
}

/*
 * Callbacks
 */

export type DialogDifferOnStart = (suiteResult: DialogDifferDatabaseSuiteResult) => void

export type DialogDifferOnSnap = (obj: {
  suiteId?: string,
  dialog: DialogDifferDialog,
  err?: DialogDifferError,
  isDatabase?: boolean,
  isOriginal?: boolean
  isCurrent?: boolean
}) => void

export type DialogDifferOnDiff = (obj: { suiteId?: string, dialogsResult: DialogDifferDialogsResult }) => void

export type DialogDifferOnEnd = (suiteResult: DialogDifferDatabaseSuiteResult) => void

export type DialogDifferOnProgress = (obj: { suiteId: string, dialogs: number }) => void

/*
 * Database
 */

export interface DialogDifferDatabaseSearchDialogScreenshot {
  width: number
  height: number
}

export interface DialogDifferDatabaseDialogScreenshot {
  id?: string
  dialogId: string
  dialogVersion: string
  base64: string
  height: number
  width: number
}

export interface DialogDifferDatabaseDialogsResult {
  dialogId: string
  originalVersion: string
  currentVersion: string
  options?: string
  result?: string
  differ?: DialogDifferDialogResultDiff[]
  originalError?: { code: string, message: string }
  currentError?: { code: string, message: string }
}

export interface SuiteResultDialog {
  version: string
  id: string
  url: string
  hash: string
  options: DialogDifferDialogOptions
  error: DialogDifferError
}

export interface DialogDifferDatabaseSuiteResultDialogsResult {
  dialogId: string
  originalVersion: string
  currentVersion: string
  original: SuiteResultDialog | null
  current: SuiteResultDialog | null
  result: string
}

export interface DialogDifferDatabaseSuiteResult {
  id?: string
  status?: string
  errorCode?: string
  timestamp?: number
  options?: DialogDifferOptions,
  stats?: DialogDifferSuiteStats,
  results?: DialogDifferDatabaseSuiteResultDialogsResult[]
}
