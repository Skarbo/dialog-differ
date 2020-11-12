import * as path from 'path'
import DatabaseHandler from '../../src/handlers/database.handler'
import SnapHandler from '../../src/handlers/snap.handler'
import DifferHandler from '../../src/handlers/differ.handler'
import * as logger from '../../src/logger'
import * as SuiteHelper from '../../src/helpers/suite.helper'
import * as DIFFER_CONSTANTS from '../../src/constants/differ.constants'
import * as SUITE_CONSTANTS from '../../src/constants/suite.constants'
import * as LOGGER_CONSTANTS from '../../src/constants/logger.constants'
import {expect} from 'chai'
import {DialogDifferDialog, DialogDifferOptions, DialogDifferSuite} from '../../src/interfaces'

const RESOURCES_FOLDER = path.resolve(__dirname, '../resources')

function createDialogURL (dialog: string): string {
  return `file://${path.resolve(RESOURCES_FOLDER, dialog)}`
}

describe('differ handler', () => {
  const databaseHandler = new DatabaseHandler()
  const snapHandler = new SnapHandler(databaseHandler, {browserTimeout: 1000})
  const differHandler = new DifferHandler(databaseHandler)

  beforeEach(async () => {
    logger.clear()

    await databaseHandler.clearDB()
    await databaseHandler.initDB()
  })

  describe('differDialogScreenshot', () => {
    it('should have same screenshots', async () => {
      const result = await differHandler.differDialogScreenshot({
        path: path.resolve(RESOURCES_FOLDER, 'dialog-one.png'),
        height: 1,
        width: 1,
        base64: '',
      }, {
        path: path.resolve(RESOURCES_FOLDER, 'dialog-one.png'),
        height: 1,
        width: 1,
        base64: '',
      })

      expect(result).to.be.an('object')
      expect(result.isIdentical).to.equal(true)
      expect(result.base64).to.equal(null)
    })

    it('should differ screenshots', async () => {
      const result = await differHandler.differDialogScreenshot(
        {
          path: path.resolve(RESOURCES_FOLDER, 'dialog-one.png'),
          height: 1,
          width: 1,
          base64: '',
        },
        {
          path: path.resolve(RESOURCES_FOLDER, 'dialog-two.png'),
          height: 1,
          width: 1,
          base64: '',
        })

      expect(result).to.be.an('object')
      expect(result.isIdentical).to.equal(false)
      expect(result.base64).to.be.an('string')
    })
  })

  describe('differDialog', () => {
    it('should differ dialogs', async () => {
      const dialogOriginal: DialogDifferDialog = {
        id: '1',
        version: '1',
        url: createDialogURL('dialog-one.html')
      }
      const dialogCurrent: DialogDifferDialog = {
        id: '1',
        version: '2',
        url: createDialogURL('dialog-two.html')
      }

      const options: DialogDifferOptions = {
        sizes: [{width: 460, height: 350}, {width: 320, height: 150}],
        originalVersion: '1',
        currentVersion: '2'
      }

      const dialogOriginalSnapped = await snapHandler.snapDialog(options, dialogOriginal)
      const dialogCurrentSnapped = await snapHandler.snapDialog(options, dialogCurrent)

      const dialogResult = await differHandler.differDialog(options, dialogOriginalSnapped, dialogCurrentSnapped)

      expect(dialogResult).to.be.an('object')
      expect(dialogResult.original).to.be.an('object')
      expect(dialogResult.current).to.be.an('object')
      expect(dialogResult.result).to.equal(DIFFER_CONSTANTS.CHANGED_DIFFER_RESULT)
      expect(dialogResult.differ).to.be.an('array')
      expect(dialogResult.differ).to.have.lengthOf(2)

      expect(dialogResult.differ[0]).to.be.an('object')
      expect(dialogResult.differ[0].index).to.equal(0)
      expect(dialogResult.differ[0].base64).to.be.an('string')
      expect(dialogResult.differ[0].result).to.equal(DIFFER_CONSTANTS.CHANGED_DIFFER_RESULT)

      expect(dialogResult.differ[1]).to.be.an('object')
      expect(dialogResult.differ[1].index).to.equal(1)
      expect(dialogResult.differ[1].base64).to.be.an('string')
      expect(dialogResult.differ[1].result).to.equal(DIFFER_CONSTANTS.CHANGED_DIFFER_RESULT)

      const dialogsResultDb = await databaseHandler.getDialogsResult({
        options,
        dialogId: dialogOriginal.id,
        originalVersion: dialogOriginal.version,
        currentVersion: dialogCurrent.version
      })

      expect(dialogsResultDb).to.be.an('object')
      expect(dialogsResultDb.originalVersion).to.be.equal(dialogOriginal.version)
      expect(dialogsResultDb.currentVersion).to.be.equal(dialogCurrent.version)
      expect(dialogsResultDb.result).to.equal(DIFFER_CONSTANTS.CHANGED_DIFFER_RESULT)
      expect(dialogsResultDb.differ).to.be.an('array')
      expect(dialogsResultDb.differ).to.have.lengthOf(2)

      expect(dialogsResultDb.differ[0]).to.be.an('object')
      expect(dialogsResultDb.differ[0].index).to.equal(0)
      expect(dialogsResultDb.differ[0].base64).to.be.an('string')
      expect(dialogsResultDb.differ[0].result).to.equal(DIFFER_CONSTANTS.CHANGED_DIFFER_RESULT)

      expect(dialogsResultDb.differ[1]).to.be.an('object')
      expect(dialogsResultDb.differ[1].index).to.equal(1)
      expect(dialogsResultDb.differ[1].base64).to.be.an('string')
      expect(dialogsResultDb.differ[1].result).to.equal(DIFFER_CONSTANTS.CHANGED_DIFFER_RESULT)
    })

    it('should use differ dialogs from database', async () => {
      const dialogOriginal: DialogDifferDialog = {
        version: '1',
        id: '1',
        url: createDialogURL('dialog-one.html')
      }
      const dialogCurrent: DialogDifferDialog = {
        version: '2',
        id: '1',
        url: createDialogURL('dialog-two.html')
      }

      const options: DialogDifferOptions = {
        sizes: [{width: 460, height: 350}, {width: 320, height: 150}],
        currentVersion: '1',
        originalVersion: '2'
      }

      let dialogOriginalSnapped = await snapHandler.snapDialog(options, dialogOriginal)
      let dialogCurrentSnapped = await snapHandler.snapDialog(options, dialogCurrent)

      let dialogResult = await differHandler.differDialog(options, dialogOriginalSnapped, dialogCurrentSnapped)

      expect(dialogResult).to.be.an('object')
      expect(dialogResult.result).to.equal(DIFFER_CONSTANTS.CHANGED_DIFFER_RESULT)

      expect(logger.getCollections({code: LOGGER_CONSTANTS.DIALOG_DIFF_FROM_IMAGE_DIFF_LOGGER})).to.have.lengthOf(1)
      expect(logger.getCollections({code: LOGGER_CONSTANTS.DIALOG_DIFF_FROM_DATABASE_LOGGER})).to.have.lengthOf(0)

      const dialogsResultDb = await databaseHandler.getDialogsResult({
        options,
        dialogId: dialogOriginal.id,
        originalVersion: dialogOriginal.version,
        currentVersion: dialogCurrent.version
      })

      expect(dialogsResultDb).to.be.an('object')

      dialogOriginalSnapped = await snapHandler.snapDialog(options, dialogOriginal)
      dialogCurrentSnapped = await snapHandler.snapDialog(options, dialogCurrent)

      dialogResult = await differHandler.differDialog(options, dialogOriginalSnapped, dialogCurrentSnapped)

      expect(dialogResult).to.be.an('object')
      expect(dialogResult.result).to.equal(DIFFER_CONSTANTS.CHANGED_DIFFER_RESULT)

      expect(logger.getCollections({code: LOGGER_CONSTANTS.DIALOG_DIFF_FROM_IMAGE_DIFF_LOGGER})).to.have.lengthOf(1)
      expect(logger.getCollections({code: LOGGER_CONSTANTS.DIALOG_DIFF_FROM_DATABASE_LOGGER})).to.have.lengthOf(1)
    })

    it('should not diff dialogs with error', async () => {
      const dialogOriginal: DialogDifferDialog = {
        version: '1',
        id: '1',
        url: createDialogURL('dialog-one.html'),
        waitForSelector: 'will-timeout'
      }
      const dialogCurrent: DialogDifferDialog = {
        version: '2',
        id: '1',
        url: createDialogURL('dialog-two.html')
      }

      const options: DialogDifferOptions = {
        sizes: [{width: 460, height: 350}],
        originalVersion: '1',
        currentVersion: '2'
      }

      const dialogOriginalSnapped = await snapHandler.snapDialog(options, dialogOriginal)
      const dialogCurrentSnapped = await snapHandler.snapDialog(options, dialogCurrent)

      const dialogResult = await differHandler.differDialog(options, dialogOriginalSnapped, dialogCurrentSnapped)

      expect(dialogResult).to.be.an('object')
      expect(dialogResult.result).to.equal(DIFFER_CONSTANTS.ERROR_DIFFER_RESULT)
    })
  })

  describe('SuiteResult', async () => {
    it('should init, finished and get suite result', async () => {
      const suite: DialogDifferSuite = {
        options: {
          originalVersion: '1.0.1',
          currentVersion: '1.0.2',
          sizes: [],
        },
        original: [],
        current: [],
      }

      const {suite: suiteSnapped} = await differHandler.initSuiteResult(suite)
      const suiteResultDb = await databaseHandler.getSuiteResult(suiteSnapped.id)

      expect(suiteResultDb).to.be.an('object')
      expect(suiteResultDb.id).to.be.an('string')
      expect(suiteResultDb.status).to.equal(SUITE_CONSTANTS.RUNNING_STATUS)
      expect(suiteResultDb.timestamp).to.be.a('number')
      expect(suiteResultDb.errorCode).to.eq(null)

      const {suiteResult} = await differHandler.finishSuiteResult(SuiteHelper.prepareSuiteResults(suite, suiteResultDb))

      expect(suiteResult).to.be.an('object')
      expect(suiteResult.id).to.be.an('string')
      expect(suiteResult.status).to.equal(SUITE_CONSTANTS.FINISHED_STATUS)
      expect(suiteResult.timestamp).to.be.a('number')
      expect(suiteResult.stats).to.be.an('object')
      expect(suiteResult.stats.identical).to.equal(0)
      expect(suiteResult.stats.changed).to.equal(0)
      expect(suiteResult.stats.added).to.equal(0)
      expect(suiteResult.stats.deleted).to.equal(0)
      expect(suiteResult.stats.duration).to.be.a('number')
    })
  })

  describe('differSuite', () => {
    it('should differ suite', async () => {
      const dialogOneOriginal: DialogDifferDialog = {
        id: 'one',
        version: '1',
        url: createDialogURL('dialog-hash.html?original'),
        hash: 'One'
      }
      const dialogTwoOriginal: DialogDifferDialog = {
        id: 'two',
        version: '1',
        url: createDialogURL('dialog-hash.html?original'),
        hash: 'Two'
      }

      const dialogOneCurrent: DialogDifferDialog = {
        id: 'one',
        version: '2',
        url: createDialogURL('dialog-hash.html?current'),
        hash: 'One'
      }
      const dialogTwoCurrent: DialogDifferDialog = {
        id: 'two',
        version: '2',
        url: createDialogURL('dialog-hash.html?current'),
        hash: 'Two'
      }

      const suite: DialogDifferSuite = {
        options: {
          sizes: [{width: 460, height: 350}, {width: 320, height: 150}],
          originalVersion: '1',
          currentVersion: '2'
        },
        original: [dialogOneOriginal, dialogTwoOriginal],
        current: [dialogOneCurrent, dialogTwoCurrent],
      }

      await snapHandler.snapSuite(suite)
      const {suiteResult} = await differHandler.differSuite(suite)

      // console.log( JSON.stringify( suiteResult, null, 2 ) );
      expect(suiteResult).to.be.an('object')
      expect(suite.options).to.deep.equal(suiteResult.options)
      expect(suiteResult.results).to.be.an('array')
      expect(suiteResult.results).to.have.length(2)

      expect(suiteResult.results[0]).to.deep.equal(suiteResult.results[0])
      expect(suiteResult.results[1]).to.deep.equal(suiteResult.results[1])

      expect(suiteResult.results[0].dialogId).to.equal(dialogOneOriginal.id)
      expect(suiteResult.results[0].original).to.deep.equal(dialogOneOriginal)
      expect(suiteResult.results[0].current).to.deep.equal(dialogOneCurrent)
      expect(suiteResult.results[0].originalVersion).to.equal(dialogOneOriginal.version)
      expect(suiteResult.results[0].currentVersion).to.equal(dialogOneCurrent.version)
      expect(suiteResult.results[0].result).to.equal(DIFFER_CONSTANTS.CHANGED_DIFFER_RESULT)
      expect(suiteResult.results[0].differ).to.have.length(2)

      expect(suiteResult.results[0].differ[0].index).to.equal(0)
      expect(suiteResult.results[0].differ[0].result).to.equal(DIFFER_CONSTANTS.CHANGED_DIFFER_RESULT)
      expect(suiteResult.results[0].differ[0].base64).to.be.a('string')

      expect(suiteResult.results[0].differ[1].index).to.equal(1)
      expect(suiteResult.results[0].differ[1].result).to.equal(DIFFER_CONSTANTS.CHANGED_DIFFER_RESULT)
      expect(suiteResult.results[0].differ[1].base64).to.be.a('string')

      expect(suiteResult.results[1].dialogId).to.equal(dialogTwoOriginal.id)
      expect(suiteResult.results[1].original).to.deep.equal(dialogTwoOriginal)
      expect(suiteResult.results[1].current).to.deep.equal(dialogTwoCurrent)
      expect(suiteResult.results[1].originalVersion).to.equal(dialogTwoOriginal.version)
      expect(suiteResult.results[1].currentVersion).to.equal(dialogTwoCurrent.version)
      expect(suiteResult.results[1].result).to.equal(DIFFER_CONSTANTS.CHANGED_DIFFER_RESULT)
      expect(suiteResult.results[1].differ).to.have.length(2)

      expect(suiteResult.results[1].differ[0].index).to.equal(0)
      expect(suiteResult.results[1].differ[0].result).to.equal(DIFFER_CONSTANTS.CHANGED_DIFFER_RESULT)
      expect(suiteResult.results[1].differ[0].base64).to.be.a('string')

      expect(suiteResult.results[1].differ[1].index).to.equal(1)
      expect(suiteResult.results[1].differ[1].result).to.equal(DIFFER_CONSTANTS.CHANGED_DIFFER_RESULT)
      expect(suiteResult.results[1].differ[1].base64).to.be.a('string')
    })
  })
})
