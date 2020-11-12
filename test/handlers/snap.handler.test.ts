import * as path from 'path'
import {expect} from 'chai'
import puppeteer from 'puppeteer'
import * as LOGGER_CONSTANTS from '../../src/constants/logger.constants'
import * as ERROR_CONSTANTS from '../../src/constants/error.constants'
import SnapHandler from '../../src/handlers/snap.handler'
import * as logger from '../../src/logger'
import DatabaseHandler from '../../src/handlers/database.handler'
import {DialogDifferDialog, DialogDifferOptions, DialogDifferSuite} from '../../src/interfaces'

const RESOURCES_FOLDER = path.resolve(__dirname, '../resources')

function createDialogURL (dialog: string) {
  return `file://${path.resolve(RESOURCES_FOLDER, dialog)}`
}

async function getImageSize (base64: string) {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.goto(base64)
  const size = await page.$eval('img', img => ({
    width: (img as HTMLImageElement).naturalWidth,
    height: (img as HTMLImageElement).naturalHeight
  }))

  await page.close()
  await browser.close()
  return size
}

describe('snap handler', () => {
  const databaseHandler = new DatabaseHandler()
  const snapHandler = new SnapHandler(databaseHandler, {browserTimeout: 1000})

  beforeEach(async () => {
    logger.clear()

    await databaseHandler.clearDB()
    await databaseHandler.initDB()
  })

  describe('snapDialog', async () => {
    it('should snap dialog', async () => {
      const dialog: DialogDifferDialog = {
        id: '1',
        version: '1',
        url: createDialogURL('dialog.html'),
      }

      const options: DialogDifferOptions = {
        sizes: [{width: 460, height: 350}, {width: 320, height: 150}],
        originalVersion: '1',
        currentVersion: '2'
      }

      const dialogSnapped = await snapHandler.snapDialog(options, dialog)

      expect(dialogSnapped.screenshots).to.be.an('array')
      expect(dialogSnapped.screenshots).to.have.lengthOf(2)

      expect(dialogSnapped.screenshots[0].base64).to.be.an('string')
      expect(dialogSnapped.screenshots[0].width).to.equal(460)
      expect(dialogSnapped.screenshots[0].height).to.equal(350)

      expect(dialogSnapped.screenshots[1].base64).to.be.an('string')
      expect(dialogSnapped.screenshots[1].width).to.equal(320)
      expect(dialogSnapped.screenshots[1].height).to.equal(150)
    })

    it('should snap dialog with custom size', async () => {
      const dialog: DialogDifferDialog = {
        id: '1',
        version: '1',
        url: createDialogURL('dialog.html'),
        options: {
          sizes: [{width: 460, height: 350}, {width: 320, height: 150}]
        }
      }

      const options: DialogDifferOptions = {
        sizes: [{width: 100, height: 200}, {width: 300, height: 400}],
        originalVersion: '1',
        currentVersion: '2'
      }

      const dialogSnapped = await snapHandler.snapDialog(options, dialog)

      expect(dialogSnapped.screenshots).to.be.an('array')
      expect(dialogSnapped.screenshots).to.have.lengthOf(2)

      expect(dialogSnapped.screenshots[0].base64).to.be.an('string')
      expect(dialogSnapped.screenshots[0].width).to.equal(460)
      expect(dialogSnapped.screenshots[0].height).to.equal(350)

      expect(dialogSnapped.screenshots[1].base64).to.be.an('string')
      expect(dialogSnapped.screenshots[1].width).to.equal(320)
      expect(dialogSnapped.screenshots[1].height).to.equal(150)
    })

    it('should use dialog screenshot from database', async () => {
      const dialog: DialogDifferDialog = {
        id: 'id',
        version: 'version',
        url: createDialogURL('dialog.html')
      }

      const options: DialogDifferOptions = {
        sizes: [{width: 460, height: 350}],
        originalVersion: '1',
        currentVersion: '2'
      }

      let dialogSnapped = await snapHandler.snapDialog(options, dialog)

      expect(dialogSnapped.screenshots).to.be.an('array')
      expect(dialogSnapped.screenshots).to.have.lengthOf(1)

      expect(logger.getCollections({code: LOGGER_CONSTANTS.SCREENSHOT_FROM_BROWSER_LOGGER})).to.have.lengthOf(1)
      expect(logger.getCollections({code: LOGGER_CONSTANTS.SCREENSHOTS_FROM_DATABASE_LOGGER})).to.have.lengthOf(0)

      dialogSnapped = await snapHandler.snapDialog(options, dialogSnapped)

      expect(dialogSnapped.screenshots).to.be.an('array')
      expect(dialogSnapped.screenshots).to.have.lengthOf(2)

      expect(logger.getCollections({code: LOGGER_CONSTANTS.SCREENSHOTS_FROM_DATABASE_LOGGER})).to.have.lengthOf(1)
    })

    it('should not snap error dialog', async () => {
      const dialog: DialogDifferDialog = {
        id: 'id',
        version: 'version',
        url: createDialogURL('dialog.html'),
        waitForSelector: 'will-timeout',
      }

      const options: DialogDifferOptions = {
        sizes: [{width: 460, height: 350}],
        originalVersion: '1',
        currentVersion: '2'
      }

      const dialogSnapped = await snapHandler.snapDialog(options, dialog)

      expect(dialogSnapped).to.be.an('object')

      expect(dialogSnapped.error).to.be.an('object')
      expect(dialogSnapped.error.code).to.equal(ERROR_CONSTANTS.SNAP_DIALOG_FROM_BROWSER_ERROR)
      expect(dialogSnapped.error.message).to.be.an('string')
    })
  })

  describe('snapSuiteDialogs', () => {
    it('should snap suite with hash dialogs', async () => {
      const firstDialog: DialogDifferDialog = {
        id: '1',
        version: '1',
        url: createDialogURL('dialog-hash.html'),
        hash: 'First'
      }

      const secondDialog: DialogDifferDialog = {
        id: '2',
        version: '1',
        url: createDialogURL('dialog-hash.html'),
        hash: 'Second'
      }

      const options: DialogDifferOptions = {
        sizes: [{width: 460, height: 350}, {width: 320, height: 150}],
        originalVersion: '1',
        currentVersion: '2'
      }

      const dialogs = await snapHandler.snapSuiteDialogs(options, [firstDialog, secondDialog])

      expect(dialogs).to.be.an('array')
      expect(dialogs).to.have.lengthOf(2)
      expect(dialogs[0].screenshots[0].base64, 'large screenshot should not equal small screenshot').to.not.equal(dialogs[0].screenshots[1].base64)
      expect(dialogs[0].screenshots[0].base64, 'first dialog screenshot should not equal second dialog screenshot').to.not.equal(dialogs[1].screenshots[0].base64)
    })

    it('should snap suite with mixed dialogs', async () => {
      const firstDialog: DialogDifferDialog = {
        id: '1',
        version: '1',
        url: createDialogURL('dialog-hash.html'),
        hash: 'First'
      }

      const secondDialog: DialogDifferDialog = {
        id: '2',
        version: '1',
        url: createDialogURL('dialog-hash.html'),
        hash: 'Second'
      }

      const secondThird: DialogDifferDialog = {
        id: '3',
        version: '1',
        url: createDialogURL('dialog.html')
      }

      const options: DialogDifferOptions = {
        sizes: [{width: 460, height: 350}, {width: 320, height: 150}],
        originalVersion: '1',
        currentVersion: '2'
      }

      const dialogs = await snapHandler.snapSuiteDialogs(options, [firstDialog, secondDialog, secondThird])

      expect(dialogs).to.be.an('array')
      expect(dialogs).to.have.lengthOf(3)
    })

    it('should snap suite from already snapped dialogs', async function () {
      this.timeout(10000)

      const firstDialog: DialogDifferDialog = {
        id: '1',
        version: '1',
        url: createDialogURL('dialog-hash.html'),
        hash: 'First',
      }

      const secondDialog: DialogDifferDialog = {
        id: '2',
        version: '1',
        url: createDialogURL('dialog-hash.html'),
        hash: 'Second',
      }

      const thirdDialog: DialogDifferDialog = {
        id: '3',
        version: '1',
        url: createDialogURL('dialog-hash.html'),
        hash: 'Three',
      }

      const forthDialog: DialogDifferDialog = {
        id: '4',
        version: '1',
        url: createDialogURL('dialog-hash.html'),
        hash: 'Four',
      }

      const options: DialogDifferOptions = {
        sizes: [{width: 460, height: 350}, {width: 320, height: 150}],
        originalVersion: '1',
        currentVersion: '2'
      }

      let dialogs = await snapHandler.snapSuiteDialogs(options, [firstDialog, secondDialog, thirdDialog])

      expect(dialogs).to.be.an('array')
      expect(dialogs).to.have.lengthOf(3)

      expect(logger.getCollections({code: LOGGER_CONSTANTS.SCREENSHOT_FROM_BROWSER_LOGGER})).to.have.lengthOf(6)
      expect(logger.getCollections({code: LOGGER_CONSTANTS.SCREENSHOT_FROM_DATABASE_LOGGER})).to.have.lengthOf(0)

      logger.clear()

      dialogs = await snapHandler.snapSuiteDialogs(options, [firstDialog, secondDialog, thirdDialog, forthDialog])

      expect(dialogs).to.be.an('array')
      expect(dialogs).to.have.lengthOf(4)

      expect(logger.getCollections({code: LOGGER_CONSTANTS.SCREENSHOT_FROM_BROWSER_LOGGER})).to.have.lengthOf(2)
      expect(logger.getCollections({code: LOGGER_CONSTANTS.SCREENSHOTS_FROM_DATABASE_LOGGER})).to.have.lengthOf(3)
    })

    it('should not snap error dialogs', async () => {
      const firstDialog: DialogDifferDialog = {
        version: '1',
        id: '1',
        url: createDialogURL('dialog-hash.html'),
        hash: 'First',
        waitForSelector: 'will-timeout',
      }

      const options: DialogDifferOptions = {
        sizes: [{width: 460, height: 350}],
        originalVersion: '1',
        currentVersion: '2'
      }

      const dialogs = await snapHandler.snapSuiteDialogs(options, [firstDialog])

      expect(dialogs).to.be.an('array')
      expect(dialogs).to.have.lengthOf(1)

      expect(dialogs[0].screenshots).to.be.an('array')
      expect(dialogs[0].screenshots).to.have.lengthOf(0)

      expect(dialogs[0].error).to.be.an('object')
      expect(dialogs[0].error.code).to.equal(ERROR_CONSTANTS.SNAP_DIALOG_WITH_HASH_FROM_BROWSER_ERROR)
      expect(dialogs[0].error.message).to.be.an('string')
    })

    it('should snap dialog with crop', async () => {
      const dialog: DialogDifferDialog = {
        version: '1',
        id: '1',
        url: createDialogURL('dialog-crop.html'),
        crop: '#crop',
      }

      const options: DialogDifferOptions = {
        sizes: [{width: 460, height: 350}],
        originalVersion: '1',
        currentVersion: '2'
      }

      const dialogs = await snapHandler.snapSuiteDialogs(options, [dialog])

      expect(dialogs).to.be.an('array')
      expect(dialogs).to.have.lengthOf(1)

      expect(dialogs[0].screenshots).to.be.an('array')
      expect(dialogs[0].screenshots).to.have.lengthOf(1)
      expect(dialogs[0].screenshots[0].base64).not.to.equal(undefined)

      const size = await getImageSize(dialogs[0].screenshots[0].base64)
      expect(size.width).to.equal(400)
      expect(size.height).to.equal(400)
    })

    it('should snap dialog with resize', async () => {
      const dialog: DialogDifferDialog = {
        version: '1',
        id: '1',
        url: createDialogURL('dialog-resize.html'),
        resize: function () {
          /* eslint-disable */
          var resizeElement = document.querySelector('#resize')

          return {
            height: resizeElement.clientHeight,
            width: resizeElement.clientWidth,
          }
          /* eslint-enable */
        }
      }

      const options: DialogDifferOptions = {
        sizes: [{width: 460, height: 350}],
        originalVersion: '1',
        currentVersion: '2'
      }

      const dialogs = await snapHandler.snapSuiteDialogs(options, [dialog])

      expect(dialogs).to.be.an('array')
      expect(dialogs).to.have.lengthOf(1)

      expect(dialogs[0].screenshots).to.be.an('array')
      expect(dialogs[0].screenshots).to.have.lengthOf(1)
      expect(dialogs[0].screenshots[0].base64).not.to.equal(undefined)

      const size = await getImageSize(dialogs[0].screenshots[0].base64)
      expect(size.width, 'width').to.equal(800)
      expect(size.height, 'height').to.equal(800)
    })
  })

  describe('getSuiteResult', () => {
    it('should get suite result', async () => {
      const suite: DialogDifferSuite = {
        options: {
          originalVersion: '1',
          currentVersion: '2',
          sizes: [{width: 460, height: 350}, {width: 320, height: 150}],
        },
        original: [
          {
            version: '1',
            id: '1',
            url: createDialogURL('dialog-one.html'),
          }
        ],
        current: [
          {
            version: '2',
            id: '1',
            url: createDialogURL('dialog-two.html'),
          }
        ],
      }

      const suiteResult = await snapHandler.snapSuite(suite)

      expect(suiteResult).to.be.an('object')
    })
  })
})
