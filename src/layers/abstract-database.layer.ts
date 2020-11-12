import {
  DialogDifferDatabaseDialogScreenshot,
  DialogDifferDatabaseDialogsResult,
  DialogDifferDatabaseSuiteResult,
  DialogDifferSize
} from '../interfaces'

export type GetDialogScreenshot = {
  dialogId: string
  dialogVersion: string
  dialogScreenshotHeight: number
  dialogScreenshotWidth: number
}

export type GetDialogScreenshots = {
  dialogId: string
  dialogVersion: string
  sizes: DialogDifferSize[]
}

export type NewDialogScreenshot = {
  dialogId: string
  dialogVersion: string
  dialogScreenshotHeight: number
  dialogScreenshotWidth: number
  dialogScreenshotBase64: string
}

export type UpdateDialogScreenshot = {
  dialogScreenshotId: string
  dialogScreenshotBase64: string
}

export type GetDialogsResult = {
  options: string
  dialogId: string
  originalVersion: string
  currentVersion: string
}

export default abstract class AbstractDatabaseLayer {
  abstract initDB (args: unknown): Promise<void>

  abstract clearDB (): Promise<void>

  abstract isInitialized (): boolean

  abstract getDialogScreenshot (options: GetDialogScreenshot): Promise<DialogDifferDatabaseDialogScreenshot>

  abstract getDialogScreenshots (options: GetDialogScreenshots): Promise<DialogDifferDatabaseDialogScreenshot[]>

  abstract newDialogScreenshot (options: NewDialogScreenshot): Promise<DialogDifferDatabaseDialogScreenshot>

  abstract updateDialogScreenshot (options: UpdateDialogScreenshot): Promise<DialogDifferDatabaseDialogScreenshot>

  abstract deleteDialogsScreenshots (dialogVersion: string): Promise<boolean>

  abstract getDialogsResult (options: GetDialogsResult): Promise<DialogDifferDatabaseDialogsResult>

  abstract newDialogsResult (dialogsResult: DialogDifferDatabaseDialogsResult): Promise<DialogDifferDatabaseDialogsResult>

  abstract getSuiteResult (suiteId: string): Promise<DialogDifferDatabaseSuiteResult | null>

  abstract getLastSuiteResults (): Promise<DialogDifferDatabaseSuiteResult[]>

  abstract newSuiteResult (suiteResult: DialogDifferDatabaseSuiteResult): Promise<DialogDifferDatabaseSuiteResult>

  abstract updateSuiteResult (suiteResultId: string, suiteResult: DialogDifferDatabaseSuiteResult): Promise<DialogDifferDatabaseSuiteResult>

  abstract deleteSuiteResult (suiteId: string): Promise<boolean>
}
