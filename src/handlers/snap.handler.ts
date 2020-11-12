import * as LOGGER_CONSTANTS from '../constants/logger.constants'
import * as ERROR_CONSTANTS from '../constants/error.constants'
import * as DialogHelper from '../helpers/dialog.helper'
import * as ErrorHelper from '../helpers/error.helper'
import puppeteer, {Browser, Page} from 'puppeteer'
import * as logger from '../logger'
import {getConfig} from '../config'
import DatabaseHandler from './database.handler'
import Bluebird from 'bluebird'
import {
  DialogDifferConfig,
  DialogDifferDatabaseDialogScreenshot,
  DialogDifferDialog, DialogDifferDialogScreenshot,
  DialogDifferOnSnap, DialogDifferOptions,
  DialogDifferSize, DialogDifferSuite
} from '../interfaces'

const base64ArrayBuffer = require('base64-arraybuffer')

type SnapType = {
  onSnap?: DialogDifferOnSnap
  isOriginal?: boolean
  isCurrent?: boolean
}

const TAG = 'Snap'

function getElementClipEvaluate (selector: string): { y: number, x: number, width: number, height: number } | null {
  const element = document.querySelector(selector)

  if (!element) {
    return null
  }

  return {
    // @ts-ignore
    y: element.offsetTop,
    // @ts-ignore
    x: element.offsetLeft,
    width: element.clientWidth,
    height: element.clientHeight
  }
}

/**
 * Inject CSS
 * - Stop CSS animations
 * - Hide cursor
 */
function injectCSSEvaluate () {
  /*eslint-disable */
  const css = '* { animation: none!important; -webkit-animation: none!important; caret-color: transparent!important; }',
    head = document.head || document.getElementsByTagName('head')[0],
    style = document.createElement('style')

  style.type = 'text/css'
  // @ts-ignore
  if (style.styleSheet) {
    // @ts-ignore
    style.styleSheet.cssText = css
  }
  else {
    style.appendChild(document.createTextNode(css))
  }

  head.appendChild(style)
  /* eslint-enable */
}

/**
 * Redirects location hash
 */
function redirectHashEvaluate (hash: string) {
  /*eslint-disable */
  document.location.hash = hash
  /* eslint-enable */
}

async function puppeteerScreenshot (page: Page, dialog: DialogDifferDialog, size: DialogDifferSize, databaseHandler: DatabaseHandler): Promise<DialogDifferDatabaseDialogScreenshot> {
  logger.log(
    TAG,
    'dialogScreenshot',
    'Taking screenshot \'%s\', \'%s%s\'. Crop \'%s\'.',
    LOGGER_CONSTANTS.SCREENSHOT_FROM_BROWSER_LOGGER,
    DialogHelper.createUniqueDialogScreenshotId(dialog, {
      width: size.width,
      height: size.height
    } as DialogDifferDialogScreenshot),
    dialog.url,
    dialog.hash ? `#${dialog.hash}` : '',
    dialog.crop || false
  )

  const takeScreenshot = async () => {
    if (dialog.crop) {
      const clip = await page.evaluate(getElementClipEvaluate, dialog.crop)
      return page.screenshot({clip})
    }
    else {
      return page.screenshot()
    }
  }

  try {
    // take screenshot
    const screenshot = await takeScreenshot()

    // create dialog screenshot
    const dialogScreenshot = DialogHelper.createDialogScreenshot(size.width, size.height, `data:image/png;base64,${base64ArrayBuffer.encode(screenshot)}`)

    // push dialog screenshot to dialog
    dialog.screenshots.push(dialogScreenshot)

    // save dialog screenshot to database
    return databaseHandler.saveDialogScreenshot(dialog, dialogScreenshot)
  }
  catch (err) {
    throw ErrorHelper.createError(err, 'Could not take dialog screenshot', ERROR_CONSTANTS.DIALOG_SCREENSHOT_ERROR)
  }
}

export default class SnapHandler {
  private readonly databaseHandler: DatabaseHandler
  private config: DialogDifferConfig

  constructor (databaseHandler: DatabaseHandler, config: DialogDifferConfig = {}) {
    this.databaseHandler = databaseHandler
    this.config = getConfig(config)
  }

  async snapSuite (suite: DialogDifferSuite, {onSnap}: { onSnap?: DialogDifferOnSnap } = {}): Promise<DialogDifferSuite> {
    logger.log(TAG, 'snapSuite', 'Snapping suite..', null, suite)

    try {
      // snap original dialogs
      await this.snapSuiteDialogs(suite.options, suite.original, {onSnap, isOriginal: true})
      // snap current dialogs
      await this.snapSuiteDialogs(suite.options, suite.current, {onSnap, isCurrent: true})

      logger.log(TAG, 'snapSuite', 'Snapped suite', null, suite.id)
      return suite
    }
    catch (err) {
      throw ErrorHelper.createError(err, 'Could not snap Suite', ERROR_CONSTANTS.SNAP_SUITE_ERROR)
    }
  }

  async snapSuiteDialogs (options: DialogDifferOptions, dialogs: DialogDifferDialog[], {onSnap, isOriginal = false, isCurrent = false}: SnapType = {}): Promise<DialogDifferDialog[]> {
    // prepare dialogs screenshots
    dialogs.forEach(dialog => {
      if (!dialog.screenshots) {
        dialog.screenshots = []
      }
    })

    try {
      // get dialogs screenshots from database
      const dialogsScreenshotsDb = await this.databaseHandler.getDialogsScreenshots(dialogs, options.sizes)

      // collect snapped and non snapped dialogs from dialogs screenshots from database
      const {
        snappedCollection,
        nonSnappedCollection,
      } = DialogHelper.collectSnappedDialogs(options, dialogs, dialogsScreenshotsDb)

      // logger.log(TAG, 'snapSuiteDialogs', 'Snapping \'%s\' dialogs. Non snapped collections \'%s\'. Snapped collections \'%s\'.', null, dialogs.length, dialogsCollection.nonSnappedCollection.length, dialogsCollection.snappedCollection.length)

      // snap dialogs from database or from browser
      const result = await Promise.all([].concat(
        // snapped dialogs with hash
        snappedCollection.dialogsWithHash.map(par => {
          return this.snapDialogsWithHashFromDatabase(
            par.map(snappedCollectedDialog => snappedCollectedDialog.dialog),
            par.map(snappedCollectedDialog => snappedCollectedDialog.screenshots),
            {onSnap, isOriginal, isCurrent}
          )
        }),
        // snapped dialogs
        snappedCollection.dialogs.map(par => {
          return this.snapDialogFromDatabase(
            par.dialog,
            par.screenshots,
            {onSnap, isOriginal, isCurrent}
          )
        }),
        // non snapped dialogs with hash
        nonSnappedCollection.dialogsWithHash.map(par => {
          return this.snapDialogsWithHashFromBrowser(
            options,
            par.map(snappedCollectedDialog => snappedCollectedDialog.dialog),
            {onSnap, isOriginal, isCurrent}
          )
        }),
        // non snapped dialogs
        this.snapDialogsFromBrowser(
          options,
          nonSnappedCollection.dialogs.map(par => par.dialog),
          {onSnap, isOriginal, isCurrent}
        ),
      ))

      // reduce result collections to one dialogs array
      const snappedDialogs = result.reduce((acc, cur) => {
        acc = acc.concat(cur)
        return acc
      }, [])

      logger.log(TAG, 'snapSuiteDialogs', 'Snapped dialogs \'%s\'. Collections \'%s\'.', null, snappedDialogs.length, result.length)

      return snappedDialogs
    }
    catch (err) {
      throw ErrorHelper.createError(err, 'Could not snap Suite dialogs', ERROR_CONSTANTS.SNAP_SUITE_DIALOGS_ERROR)
    }
  }

  async snapDialog (options: DialogDifferOptions, dialog: DialogDifferDialog, {onSnap, isOriginal = false, isCurrent = false}: SnapType = {}): Promise<DialogDifferDialog> {
    // prepare dialog screenshots
    if (!dialog.screenshots) {
      dialog.screenshots = []
    }

    try {
      const dialogScreenshotsDb = await this.databaseHandler.getDialogScreenshots(dialog, DialogHelper.getDialogSizes(options.sizes, dialog))

      // use dialog from database if already snapped, and not force new snap
      if (DialogHelper.isDialogSnapped(DialogHelper.getDialogSizes(options.sizes, dialog), dialog, dialogScreenshotsDb) && !options.isForceSnap) {
        await this.snapDialogFromDatabase(dialog, dialogScreenshotsDb, {onSnap, isOriginal, isCurrent})
      }
      // snap dialog using browser
      else {
        await this.snapDialogFromBrowser(options, dialog, {onSnap, isOriginal, isCurrent})
      }

      // callback
      if (onSnap) {
        onSnap({dialog, isOriginal, isCurrent})
      }

      return dialog
    }
    catch (err) {
      // callback
      if (onSnap) {
        onSnap({dialog, err, isOriginal, isCurrent})
      }

      throw err
    }
  }

  async snapDialogFromDatabase (dialog: DialogDifferDialog, dialogScreenshotsDb: DialogDifferDatabaseDialogScreenshot[], {onSnap, isOriginal = false, isCurrent = false}: SnapType = {}): Promise<DialogDifferDialog> {
    logger.log(TAG, 'snapDialogFromDatabase', 'Snapping dialog \'%s\' from database', null, dialog.id)

    try {
      // append dialog screenshots from database
      dialogScreenshotsDb.forEach(dialogScreenshotDb => {
        dialog.screenshots.push(DialogHelper.createDialogScreenshot(dialogScreenshotDb.width, dialogScreenshotDb.height, dialogScreenshotDb.base64))
      })

      logger.info(
        TAG,
        'snapDialogFromDatabase',
        '[dialog_version=%s][dialog_id=%s][dialog_screenshots=%d]',
        LOGGER_CONSTANTS.SCREENSHOTS_FROM_DATABASE_LOGGER,
        dialog.version,
        dialog.id,
        dialogScreenshotsDb.length,
      )

      // callback
      if (onSnap) {
        onSnap({dialog, isDatabase: true, isOriginal, isCurrent})
      }

      return dialog
    }
    catch (err) {
      // callback
      if (onSnap) {
        onSnap({dialog, err, isDatabase: true, isOriginal, isCurrent})
      }

      throw err
    }
  }

  async snapDialogFromBrowser (options: DialogDifferOptions, dialog: DialogDifferDialog, {onSnap, isOriginal = false, isCurrent = false}: SnapType = {}): Promise<DialogDifferDialog> {
    let browser: Browser
    let page: Page

    try {
      // get sizes
      const sizes = DialogHelper.getDialogSizes(options.sizes, dialog)

      logger.log(
        TAG,
        'snapDialogFromBrowser',
        '[dialog_version=%s][dialog_id=%s][dialog_url=%s][dialog_sizes=%s]',
        LOGGER_CONSTANTS.SNAP_DIALOG_WITH_HASH_FROM_BROWSER_LOGGER,
        dialog.version,
        dialog.id,
        dialog.url,
        sizes.map(({width, height}) => `${width}x${height}`).join(','),
      )

      // create browser
      browser = await puppeteer.launch({
        timeout: this.config.browserTimeout,
        ...this.config.puppeteerLaunchOptions,
      })

      // create page
      page = await browser.newPage()

      page.on('error', msg => {
        logger.warn(
          TAG,
          'snapDialogFromBrowser',
          '[dialog_version=%s][dialog_id=%s][dialog_url=%s][error=%s]',
          ERROR_CONSTANTS.SNAP_DIALOG_FROM_BROWSER_ERROR,
          dialog.version,
          dialog.id,
          dialog.url,
          msg,
        )
      })

      // go to dialog url
      await page.goto(dialog.url, {
        timeout: this.config.browserTimeout,
      })

      // inject CSS
      await page.evaluate(injectCSSEvaluate)

      // wait for selector
      if (dialog.waitForSelector) {
        await page.waitForSelector(dialog.waitForSelector, {
          timeout: this.config.browserTimeout
        })
      }

      // foreach dialog size
      await Bluebird.each(sizes, async size => {
        // set viewport
        await page.setViewport(size)

        // wait for timeout
        await page.waitForTimeout(dialog.timeout || 0)

        // resize
        if (dialog.resize) {
          // resize
          let newSize = await page.evaluate(dialog.resize, size.width, size.height)

          // set new viewport
          await page.setViewport(newSize)

          // resize once more in case of responsive changes
          newSize = await page.evaluate(dialog.resize, newSize.width, newSize.height)

          // set new viewport
          await page.setViewport(newSize)
        }

        // take screenshot
        await puppeteerScreenshot(page, dialog, size, this.databaseHandler)
      })

      // callback
      if (onSnap) {
        onSnap({dialog, isOriginal, isCurrent})
      }
    }
    catch (err) {
      const error = ErrorHelper.createError(
        err,
        '[dialog_version=%s][dialog_id=%s][dialog_url=%s][error=%s]',
        ERROR_CONSTANTS.SNAP_DIALOG_FROM_BROWSER_ERROR,
        dialog.version,
        dialog.id,
        dialog.url,
        err.message,
      )

      dialog.error = {
        code: error.code,
        message: error.message,
        args: error.args,
        stack: error.stack,
      }

      logger.error(TAG, 'snapDialogFromBrowser', error.message, error.code, ...error.args, error.stack)

      // callback
      if (onSnap) {
        onSnap({dialog, err: error, isOriginal, isCurrent})
      }
    }

    // close page and browser
    if (page) {
      await page.close()
    }
    if (browser) {
      await browser.close()
    }

    return dialog
  }

  async snapDialogsFromBrowser (options: DialogDifferOptions, dialogs: DialogDifferDialog[], {onSnap, isOriginal = false, isCurrent = false}: SnapType = {}): Promise<DialogDifferDialog[]> {
    let browser: Browser
    let page: Page
    let lastDialog = dialogs[0]

    /**
     * @return {Promise<Browser>}
     */
    const createBrowser = () => {
      return puppeteer.launch({
        timeout: this.config.browserTimeout,
        ...this.config.puppeteerLaunchOptions,
      })
    }

    const createPage = async (browser: Browser): Promise<Page> => {
      // create page
      const page = await browser.newPage()

      // listen on error
      page.on('error', msg => {
        logger.warn(
          TAG,
          'snapDialogsWithHashFromBrowser',
          '[dialog_version=%s][dialog_id=%s][dialog_url=%s#%s][error=%s]',
          ERROR_CONSTANTS.SNAP_DIALOGS_WITH_HASH_FROM_BROWSER_ERROR,
          lastDialog.version,
          lastDialog.id,
          lastDialog.url,
          lastDialog.hash,
          msg
        )
      })

      return page
    }

    try {
      // create browser
      browser = await createBrowser()

      // create page
      page = await createPage(browser)

      await Bluebird
        .map(
          dialogs,
          async (dialog) => {
            lastDialog = dialog

            try {
              // get sizes
              const sizes = DialogHelper.getDialogSizes(options.sizes, dialog)

              // go to dialog url
              const response = await page.goto(dialog.url, {
                timeout: this.config.browserTimeout,
              })

              // response is empty; reload
              if (!response) {
                await page.reload()
              }

              // inject CSS
              await page.evaluate(injectCSSEvaluate)

              // wait for selector
              if (dialog.waitForSelector) {
                await page.waitForSelector(dialog.waitForSelector, {
                  timeout: this.config.browserTimeout
                })
              }

              // foreach dialog size
              await Bluebird.each(sizes, async size => {
                // set viewport
                await page.setViewport(size)

                // wait for timeout
                await page.waitForTimeout(dialog.timeout || 0)

                // resize
                if (dialog.resize) {
                  // resize
                  let newSize = await page.evaluate(dialog.resize, size.width, size.height)

                  // set new viewport
                  await page.setViewport(newSize)

                  // resize once more in case of responsive changes
                  newSize = await page.evaluate(dialog.resize, newSize.width, newSize.height)

                  // set new viewport
                  await page.setViewport(newSize)
                }

                // take screenshot
                await puppeteerScreenshot(page, dialog, size, this.databaseHandler)
              })

              // callback
              if (onSnap) {
                onSnap({dialog, isOriginal, isCurrent})
              }
            }
            catch (err) {
              const error = ErrorHelper.createError(
                err,
                '[dialog_version=%s][dialog_id=%s][dialog_url=%s#%s][error=%s]',
                ERROR_CONSTANTS.SNAP_DIALOG_FROM_BROWSER_ERROR,
                lastDialog.version,
                lastDialog.id,
                lastDialog.url,
                lastDialog.hash,
                err.message,
              )

              dialog.error = {
                code: error.code,
                message: error.message,
              }

              logger.error(TAG, 'snapDialogsFromBrowser', error.message, error.code, error.stack)

              // callback
              if (onSnap) {
                onSnap({dialog, err: error, isOriginal, isCurrent})
              }

              try {
                // close page
                await page.close()

                // create page
                page = await createPage(browser)
              }
              catch (err) {
                logger.error(
                  TAG,
                  'snapDialogsFromBrowser',
                  '[dialog_version=%s][dialog_id=%s][dialog_url=%s][error=could not reload page]',
                  ERROR_CONSTANTS.SNAP_DIALOG_FROM_BROWSER_ERROR,
                  lastDialog.version,
                  lastDialog.id,
                  lastDialog.url,
                )
                throw err
              }
            }
          },
          {concurrency: 1}
        )
    }
    catch (err) {
      const error = ErrorHelper.createError(
        err,
        '[dialog_version=%s][dialog_id=%s][dialogs=%d][dialogs_with_error=%d][dialog_url=%s][error=%s]',
        ERROR_CONSTANTS.SNAP_DIALOGS_WITH_HASH_FROM_BROWSER_ERROR,
        lastDialog.version,
        lastDialog.id,
        dialogs.length,
        dialogs.filter(dialog => !!dialog.error).length,
        lastDialog.url,
        err.message,
      )

      logger.error(TAG, 'snapDialogsFromBrowser', error.message, error.code, error.stack)

      dialogs.forEach(dialog => {
        if (!dialog.error && dialog.screenshots.length === 0) {
          dialog.error = {
            code: error.code,
            message: error.message,
          }

          // callback
          if (onSnap) {
            onSnap({dialog, err: error, isOriginal, isCurrent})
          }
        }
      })
    }

    // close page
    if (page) {
      await page.close()
    }

    // close browser
    if (browser) {
      await browser.close()
    }

    return dialogs
  }

  async snapDialogsWithHashFromDatabase (dialogs: DialogDifferDialog[], dialogsScreenshotsDb: DialogDifferDatabaseDialogScreenshot[][], {onSnap}: SnapType = {}): Promise<DialogDifferDialog[]> {
    logger.log(TAG, 'snapDialogsWithHashFromDatabase', 'Snapping %d dialogs with hash from database', null, dialogs.length)

    try {
      await Promise.all(dialogs.map((dialog, i) => this.snapDialogFromDatabase(dialog, dialogsScreenshotsDb[i], {onSnap})))

      return dialogs
    }
    catch (err) {
      throw ErrorHelper.createError(err, 'Could not snap dialogs with hash from database', ERROR_CONSTANTS.SNAP_DIALOGS_WITH_HASH_FROM_DB_ERROR)
    }
  }

  private async snapDialogsWithHashFromBrowser (options: DialogDifferOptions, dialogs: DialogDifferDialog[], {onSnap, isOriginal = false, isCurrent = false}: SnapType = {}): Promise<DialogDifferDialog[]> {
    const dialogUrl = dialogs[0].url
    const dialogVersion = dialogs[0].version
    const dialogSizes = DialogHelper.getDialogSizes(options.sizes, dialogs[0])

    // prepare dialogs
    dialogs.forEach(dialog => {
      dialog.screenshots = []
    })

    const dialogsCollections: DialogDifferDialog[][] = this.config.snapDialogsWithHashFromBrowserCollections
      ? dialogs.reduce((rows, key, index) => (index % this.config.snapDialogsWithHashFromBrowserCollections === 0 ? rows.push([key]) : rows[rows.length - 1].push(key)) && rows, [])
      : [dialogs]

    const createAndGoToPage = async (browser: Browser, dialog: DialogDifferDialog): Promise<Page> => {
      // create page
      const page = await browser.newPage()

      // listen on error
      page.on('error', msg => {
        logger.warn(
          TAG,
          'snapDialogsWithHashFromBrowser',
          '[dialog_version=%s][dialog_id=%s][dialog_url=%s#%s][error=%s]',
          ERROR_CONSTANTS.SNAP_DIALOGS_WITH_HASH_FROM_BROWSER_ERROR,
          dialogVersion,
          dialog.id,
          dialog.url,
          dialog.hash,
          msg
        )
      })

      // go to dialog url
      await page.goto(dialog.url, {
        timeout: this.config.browserTimeout,
      })

      // inject CSS
      await page.evaluate(injectCSSEvaluate)

      return page
    }

    // snap dialogs collections
    await Bluebird
      .map(
        dialogsCollections,
        async (dialogsCollection) => {
          let lastDialog: DialogDifferDialog = dialogsCollection[0]
          let browser: Browser
          let page: Page

          try {
            logger.info(
              TAG,
              'snapDialogsWithHashFromBrowser',
              '[dialog_version=%s][dialogs=%d][dialog_url=%s][dialog_sizes=%s]',
              LOGGER_CONSTANTS.SNAP_DIALOG_WITH_HASH_FROM_BROWSER_LOGGER,
              dialogVersion,
              dialogsCollection.length,
              dialogUrl,
              dialogSizes.map(({width, height}) => `${width}x${height}`).join(',')
            )

            // launch browser
            browser = await puppeteer.launch({
              timeout: this.config.browserTimeout,
              ...this.config.puppeteerLaunchOptions,
            })

            // create and go to page
            page = await createAndGoToPage(browser, lastDialog)

            await Bluebird.each(dialogsCollection,
              async dialog => {
                try {
                  lastDialog = dialog

                  logger.info(
                    TAG,
                    'snapDialogsWithHashFromBrowser',
                    '[dialog_version=%s][dialog_id=%s][dialog_url=%s#%s]',
                    LOGGER_CONSTANTS.SNAP_DIALOGS_WITH_HASH_FROM_BROWSER_LOGGER,
                    dialogVersion,
                    dialog.id,
                    dialogUrl,
                    dialog.hash,
                  )

                  // get sizes
                  const sizes = DialogHelper.getDialogSizes(options.sizes, dialog)

                  // redirect to hash
                  await page.evaluate(redirectHashEvaluate, dialog.hash)

                  // wait for selector
                  if (dialog.waitForSelector) {
                    await page.waitForSelector(dialog.waitForSelector, {
                      timeout: this.config.browserTimeout
                    })
                  }

                  // for each size
                  await Bluebird.each(sizes, async size => {
                    // set viewport
                    await page.setViewport(size)

                    // wait for timeout
                    await page.waitForTimeout(dialog.timeout || 0)

                    // resize
                    if (dialog.resize) {
                      // resize
                      let newSize = await page.evaluate(dialog.resize, size.width, size.height)

                      // set new viewport
                      await page.setViewport(newSize)

                      // resize once more in case of responsive changes
                      newSize = await page.evaluate(dialog.resize, newSize.width, newSize.height)

                      // set new viewport
                      await page.setViewport(newSize)
                    }

                    // take screenshot
                    await puppeteerScreenshot(page, dialog, size, this.databaseHandler)
                  })

                  // callback
                  if (onSnap) {
                    onSnap({dialog, isOriginal, isCurrent})
                  }
                }
                catch (err) {
                  const error = ErrorHelper.createError(
                    err,
                    '[dialog_version=%s][dialog_id=%s][dialog_url=%s#%s][error=%s]',
                    ERROR_CONSTANTS.SNAP_DIALOG_WITH_HASH_FROM_BROWSER_ERROR,
                    lastDialog.version,
                    lastDialog.id,
                    dialogUrl,
                    lastDialog.hash,
                    err.message,
                  )

                  dialog.error = {
                    code: error.code,
                    message: error.message,
                  }

                  logger.error(TAG, 'snapDialogsWithHashFromBrowser', error.message, error.code, error.stack)

                  // callback
                  if (onSnap) {
                    onSnap({dialog, err: error, isOriginal, isCurrent})
                  }

                  try {
                    // close page
                    await page.close()

                    // create and go to page
                    page = await createAndGoToPage(browser, lastDialog)
                  }
                  catch (err) {
                    logger.error(
                      TAG,
                      'snapDialogsWithHashFromBrowser',
                      '[dialog_version=%s][dialog_id=%s][dialog_url=%s][error=could not reload page]',
                      ERROR_CONSTANTS.SNAP_DIALOG_WITH_HASH_FROM_BROWSER_RELOAD_ERROR,
                      lastDialog.version,
                      lastDialog.id,
                      lastDialog.url,
                    )
                    throw err
                  }
                }
              }
            )
          }
          catch (err) {
            const error = ErrorHelper.createError(
              err,
              '[dialog_version=%s][dialog_id=%s][dialogs=%d][dialogs_with_error=%d][dialog_url=%s][error=%s]',
              ERROR_CONSTANTS.SNAP_DIALOGS_WITH_HASH_FROM_BROWSER_ERROR,
              dialogVersion,
              lastDialog.id,
              dialogsCollection.length,
              dialogsCollection.filter(dialog => !!dialog.error).length,
              dialogUrl,
              err.message,
            )

            logger.error(TAG, 'snapDialogsWithHashFromBrowser', error.message, error.code, error.stack)

            dialogsCollection.forEach(dialog => {
              if (!dialog.error && dialog.screenshots.length === 0) {
                dialog.error = {
                  code: error.code,
                  message: error.message,
                }

                // callback
                if (onSnap) {
                  onSnap({dialog, err: error, isOriginal, isCurrent})
                }
              }
            })
          }

          // close page
          if (page) {
            await page.close()
          }

          // close browser
          if (browser) {
            await browser.close()
          }
        },
        {concurrency: this.config.snapDialogsWithHashFromBrowserConcurrency}
      )

    return dialogs
  }
}
