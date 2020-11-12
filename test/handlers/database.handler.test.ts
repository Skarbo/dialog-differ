import {
  DialogDifferDatabaseDialogScreenshot,
  DialogDifferDialog,
  DialogDifferDialogScreenshot,
  DialogDifferDialogsResult,
  DialogDifferOptions,
  DialogDifferSuite,
  DialogDifferSuiteResult
} from '../../src/interfaces'
import {expect} from 'chai'
import DatabaseHandler from '../../src/handlers/database.handler'
import LowDbDatabaseLayer from '../../src/layers/lowdb-database.layer'

function assertDialogScreenshot (dialogScreenshotsDb: DialogDifferDatabaseDialogScreenshot[], dialog: DialogDifferDialog, dialogScreenshots: DialogDifferDialogScreenshot[]) {
  if (!dialog) {
    expect(dialogScreenshotsDb).to.be.a('null')
  }
  else {
    expect(dialogScreenshotsDb).to.have.lengthOf(dialogScreenshots.length)

    dialogScreenshotsDb.forEach((dialogScreenshotDb, i) => {
      expect(dialogScreenshotDb).to.be.an('object')
      // expect( dialogScreenshotDb.id ).to.equal( DialogHelper.createUniqueDialogScreenshotId( dialog, dialogScreenshots[i] ) );
      expect(dialogScreenshotDb.dialogId).to.equal(dialog.id)
      expect(dialogScreenshotDb.dialogVersion).to.equal(dialog.version)
      expect(dialogScreenshotDb.width).to.equal(dialogScreenshots[i].width)
      expect(dialogScreenshotDb.height).to.equal(dialogScreenshots[i].height)
      expect(dialogScreenshotDb.base64).to.equal(dialogScreenshots[i].base64)
    })
  }
}

describe('database handler', () => {
  describe('LowDbDatabaseLayer', () => {
    const databaseHandler = new DatabaseHandler(new LowDbDatabaseLayer())

    beforeEach(async () => {
      await databaseHandler.initDB()
      await databaseHandler.clearDB()
    })

    /*
     * DIALOG SCREENSHOT
     */

    describe('DialogScreenshot', () => {
      it('should save and get dialog screenshot', async () => {
        const dialog: DialogDifferDialog = {
          id: 'id',
          url: 'url',
          version: 'version',
          screenshots: [{
            base64: 'base64',
            height: 1,
            width: 1,
          }]
        }

        let dialogScreenshotDb = await databaseHandler.saveDialogScreenshot(dialog, dialog.screenshots[0])
        assertDialogScreenshot([dialogScreenshotDb], dialog, dialog.screenshots)

        dialogScreenshotDb = await databaseHandler.getDialogScreenshot(dialog, {
          width: dialog.screenshots[0].width,
          height: dialog.screenshots[0].height
        })

        assertDialogScreenshot([dialogScreenshotDb], dialog, dialog.screenshots)
      })

      it('should save, overwrite and get dialog screenshot', async () => {
        const originalScreenshot = {
          base64: 'base64',
          height: 1,
          width: 1,
        }
        const overwriteScreenshot = {...originalScreenshot, base64: 'base64_2'}

        const dialog: DialogDifferDialog = {
          id: 'id',
          url: 'url',
          version: 'version',
          screenshots: [originalScreenshot]
        }

        let dialogScreenshotDb = await databaseHandler.saveDialogScreenshot(dialog, dialog.screenshots[0])
        assertDialogScreenshot([dialogScreenshotDb], dialog, dialog.screenshots)

        await databaseHandler.getDialogScreenshot(dialog, {
          width: dialog.screenshots[0].width,
          height: dialog.screenshots[0].height
        })

        dialogScreenshotDb = await databaseHandler.saveDialogScreenshot(dialog, overwriteScreenshot)
        assertDialogScreenshot([dialogScreenshotDb], dialog, [overwriteScreenshot])
      })

      it('should get dialog screenshots', async () => {
        const sizes = [{width: 1, height: 1}, {width: 2, height: 2}]

        const dialog: DialogDifferDialog = {
          id: 'id',
          url: 'url',
          version: 'version',
          screenshots: [{
            base64: 'base64',
            height: sizes[0].height,
            width: sizes[0].width,
          }, {
            base64: 'base64',
            height: sizes[1].height,
            width: sizes[1].width,
          }]
        }

        await databaseHandler.saveDialogScreenshot(dialog, dialog.screenshots[0])
        await databaseHandler.saveDialogScreenshot(dialog, dialog.screenshots[1])

        const dialogScreenshotsDb = await databaseHandler.getDialogScreenshots(dialog, sizes)
        assertDialogScreenshot(dialogScreenshotsDb, dialog, dialog.screenshots)
      })
    })

    /*
     * DIALOGS SCREENSHOTS
     */

    describe('DialogsScreenshots', () => {
      it('should get dialogs screenshots', async () => {
        const sizes = [{width: 1, height: 1}, {width: 2, height: 2}]

        const dialogOne: DialogDifferDialog = {
          id: 'id',
          url: 'url',
          version: '1',
          screenshots: [{
            base64: 'base64',
            height: sizes[0].height,
            width: sizes[0].width,
          }, {
            base64: 'base64',
            height: sizes[1].height,
            width: sizes[1].width,
          }]
        }

        const dialogTwo: DialogDifferDialog = {
          id: 'id',
          url: 'url',
          version: '2',
          screenshots: [{
            base64: 'base64',
            height: sizes[0].height,
            width: sizes[0].width,
          }, {
            base64: 'base64',
            height: sizes[1].height,
            width: sizes[1].width,
          }]
        }

        const dialogThree: DialogDifferDialog = {
          id: 'id',
          url: 'url',
          version: '3',
          screenshots: [{
            base64: 'base64',
            height: sizes[0].height,
            width: sizes[0].width,
          }, {
            base64: 'base64',
            height: sizes[1].height,
            width: sizes[1].width,
          }]
        }

        const dialogs = [dialogOne, dialogTwo]

        await Promise
          .all([
            databaseHandler.saveDialogScreenshot(dialogOne, dialogOne.screenshots[0]),
            databaseHandler.saveDialogScreenshot(dialogOne, dialogOne.screenshots[1]),
            databaseHandler.saveDialogScreenshot(dialogTwo, dialogOne.screenshots[0]),
            databaseHandler.saveDialogScreenshot(dialogTwo, dialogOne.screenshots[1]),
            databaseHandler.saveDialogScreenshot(dialogThree, dialogOne.screenshots[0]),
            databaseHandler.saveDialogScreenshot(dialogThree, dialogOne.screenshots[1]),
          ])

        const dialogsScreenshotsDb = await databaseHandler.getDialogsScreenshots(dialogs, sizes)
        expect(dialogsScreenshotsDb).to.be.lengthOf(2)

        dialogsScreenshotsDb.forEach((dialogScreenshotsDb, i) => {
          assertDialogScreenshot(dialogScreenshotsDb, dialogs[i], dialogs[i].screenshots)
        })
      })

      it('should overwrite dialogs screenshots', async () => {
        const sizes = [{width: 1, height: 1}, {width: 2, height: 2}]

        const dialogOne: DialogDifferDialog = {
          id: 'id',
          url: 'url',
          version: '1',
          screenshots: [{
            base64: 'base64',
            height: sizes[0].height,
            width: sizes[0].width,
          }, {
            base64: 'base64',
            height: sizes[1].height,
            width: sizes[1].width,
          }]
        }

        const dialogOneSecond: DialogDifferDialog = {
          id: 'id',
          url: 'url',
          version: '1',
          screenshots: [{
            base64: 'base64_2',
            height: sizes[0].height,
            width: sizes[0].width,
          }, {
            base64: 'base64_2',
            height: sizes[1].height,
            width: sizes[1].width,
          }]
        }

        await databaseHandler.saveDialogScreenshot(dialogOne, dialogOne.screenshots[0])
        await databaseHandler.saveDialogScreenshot(dialogOne, dialogOne.screenshots[1])

        let dialogsScreenshotsDb = await databaseHandler.getDialogsScreenshots([dialogOne], sizes)
        expect(dialogsScreenshotsDb).to.be.lengthOf(1)

        await databaseHandler.saveDialogScreenshot(dialogOneSecond, dialogOneSecond.screenshots[0])
        await databaseHandler.saveDialogScreenshot(dialogOneSecond, dialogOneSecond.screenshots[1])

        dialogsScreenshotsDb = await databaseHandler.getDialogsScreenshots([dialogOneSecond], sizes)
        expect(dialogsScreenshotsDb).to.be.lengthOf(1)

        assertDialogScreenshot(dialogsScreenshotsDb[0], dialogOneSecond, dialogOneSecond.screenshots)
      })

      it('should delete dialogs screenshots', async () => {
        const dialogOne: DialogDifferDialog = {
          id: '1',
          url: 'url',
          version: '1',
          screenshots: [{
            base64: 'base64',
            height: 1,
            width: 1,
          }]
        }

        const dialogTwo: DialogDifferDialog = {
          id: '2',
          url: 'url',
          version: '1',
          screenshots: [{
            base64: 'base64',
            height: 1,
            width: 1,
          }]
        }

        const dialogThree: DialogDifferDialog = {
          id: '3',
          url: 'url',
          version: '2',
          screenshots: [{
            base64: 'base64',
            height: 1,
            width: 1,
          }]
        }

        await Promise.all([
          databaseHandler.saveDialogScreenshot(dialogOne, dialogOne.screenshots[0]),
          databaseHandler.saveDialogScreenshot(dialogTwo, dialogTwo.screenshots[0]),
          databaseHandler.saveDialogScreenshot(dialogThree, dialogThree.screenshots[0]),
        ])

        const [dialogOneScreenshots, dialogTwoScreenshots, dialogThreeScreenshots] = await Promise.all([
          databaseHandler.getDialogScreenshots(dialogOne, dialogOne.screenshots),
          databaseHandler.getDialogScreenshots(dialogTwo, dialogTwo.screenshots),
          databaseHandler.getDialogScreenshots(dialogThree, dialogThree.screenshots),
        ])

        expect(dialogOneScreenshots).to.be.lengthOf(1)
        expect(dialogTwoScreenshots).to.be.lengthOf(1)
        expect(dialogThreeScreenshots).to.be.lengthOf(1)

        await databaseHandler.deleteDialogsScreenshots('1')

        const [dialogOneScreenshots2, dialogTwoScreenshots2, dialogThreeScreenshots2] = await Promise.all([
          databaseHandler.getDialogScreenshots(dialogOne, dialogOne.screenshots),
          databaseHandler.getDialogScreenshots(dialogTwo, dialogTwo.screenshots),
          databaseHandler.getDialogScreenshots(dialogThree, dialogThree.screenshots),
        ])

        expect(dialogOneScreenshots2).to.be.lengthOf(0)
        expect(dialogTwoScreenshots2).to.be.lengthOf(0)
        expect(dialogThreeScreenshots2).to.be.lengthOf(1)
      })
    })

    /*
     * SUITE RESULT
     */

    describe('SuiteResult', () => {
      it('should init, save, and get suite results', async () => {
        const suiteOne: DialogDifferSuite = {
          options: {
            originalVersion: '1',
            currentVersion: '2',
            extra: {
              foo: 'bar'
            },
            sizes: []
          },
          original: [],
          current: []
        }

        const suiteTwo: DialogDifferSuite = {
          options: {
            originalVersion: '2',
            currentVersion: '3',
            sizes: []
          },
          original: [],
          current: []
        }

        const suiteResultOne: DialogDifferSuiteResult = {
          options: suiteOne.options,
          results: [
            {
              dialogId: '1',
              originalVersion: suiteOne.options.originalVersion,
              currentVersion: suiteOne.options.currentVersion,
              result: 'result'
            },
            {
              dialogId: '2',
              originalVersion: suiteOne.options.originalVersion,
              currentVersion: suiteOne.options.currentVersion,
              result: 'result2'
            }
          ],
          status: 'finished'
        }

        const suiteResultTwo: DialogDifferSuiteResult = {
          options: suiteTwo.options,
          results: [
            {
              dialogId: '1',
              originalVersion: suiteTwo.options.originalVersion,
              currentVersion: suiteTwo.options.currentVersion,
              result: 'result'
            },
            {
              dialogId: '2',
              originalVersion: suiteTwo.options.originalVersion,
              currentVersion: suiteTwo.options.currentVersion,
              result: 'result2'
            }
          ],
          status: 'finished'
        }

        const resultOne = await databaseHandler.newSuiteResult(suiteOne)
        const resultTwo = await databaseHandler.newSuiteResult(suiteTwo)

        suiteResultOne.id = resultOne.id
        suiteResultTwo.id = resultTwo.id

        await databaseHandler.saveSuiteResult(suiteResultOne)
        await databaseHandler.saveSuiteResult(suiteResultTwo)

        const suiteResults = await databaseHandler.getLastSuiteResults()

        expect(suiteResults).to.be.an('array')
        expect(suiteResults).to.be.lengthOf(2)

        expect(suiteResults[0].options.originalVersion).to.equal('2')
        expect(suiteResults[0].options.currentVersion).to.equal('3')
        expect(suiteResults[1].options.originalVersion).to.equal('1')
        expect(suiteResults[1].options.currentVersion).to.equal('2')
        expect(suiteResults[1].options.extra).to.eql({foo: 'bar'})
      })

      it('should get suite result', async () => {
        const suiteOne: DialogDifferSuite = {
          options: {
            originalVersion: '1',
            currentVersion: '2',
            sizes: []
          },
          original: [],
          current: []
        }

        let suiteResultDb = await databaseHandler.newSuiteResult(suiteOne)
        suiteResultDb = await databaseHandler.getSuiteResult(String(suiteResultDb.id))

        expect(suiteResultDb).to.be.an('object')
        expect(suiteResultDb.options.originalVersion).to.equal(suiteOne.options.originalVersion)
        expect(suiteResultDb.options.currentVersion).to.equal(suiteOne.options.currentVersion)
      })

      it('should delete suite result', async () => {
        const suiteOne: DialogDifferSuite = {
          options: {
            originalVersion: '1',
            currentVersion: '2',
            sizes: []
          },
          original: [],
          current: []
        }

        const suiteTwo: DialogDifferSuite = {
          options: {
            originalVersion: '1',
            currentVersion: '2',
            sizes: []
          },
          original: [],
          current: []
        }

        let suiteResultDbOne = await databaseHandler.newSuiteResult(suiteOne)
        let suiteResultDbTwo = await databaseHandler.newSuiteResult(suiteTwo)

        await databaseHandler.deleteSuiteResult(suiteResultDbOne.id)

        suiteResultDbOne = await databaseHandler.getSuiteResult(suiteResultDbOne.id)
        suiteResultDbTwo = await databaseHandler.getSuiteResult(suiteResultDbTwo.id)

        expect(suiteResultDbOne).to.equal(null)

        expect(suiteResultDbTwo).to.be.an('object')
        expect(suiteResultDbTwo.options.originalVersion).to.equal(suiteTwo.options.originalVersion)
        expect(suiteResultDbTwo.options.currentVersion).to.equal(suiteTwo.options.currentVersion)
      })
    })

    /*
     * SUITE RESULT
     */

    describe('DialogsResult', () => {
      it('should save and get dialogs result', async () => {
        const options: DialogDifferOptions = {
          sizes: [{width: 1, height: 1}],
          originalVersion: '1',
          currentVersion: '2',
        }

        const dialogsResult: DialogDifferDialogsResult = {
          dialogId: 'id',
          original: {
            id: 'id',
            url: 'url',
            version: options.originalVersion,
            screenshots: [{
              base64: 'base64',
              height: 1,
              width: 1,
            }]
          },
          current: {
            id: 'id',
            url: 'url',
            version: options.currentVersion,
            screenshots: [{
              base64: 'base64',
              height: 1,
              width: 1,
            }]
          },
          originalVersion: options.originalVersion,
          currentVersion: options.currentVersion,
          result: 'result',
          differ: [{
            index: 0,
            result: 'result',
            base64: 'base64'
          }],
        }

        const {dialogsResult: dialogsResultRet, dialogsResultDb} = await databaseHandler.saveDialogsResult({
          options,
          dialogsResult
        })

        expect(dialogsResult).to.eql(dialogsResultRet)
        expect(dialogsResultDb).to.be.an('object')

        const dialogsResultDbRet = await databaseHandler.getDialogsResult({
          options,
          dialogId: dialogsResult.dialogId,
          originalVersion: dialogsResult.originalVersion,
          currentVersion: dialogsResult.currentVersion,
        })

        expect(dialogsResultDbRet).to.be.an('object')
        expect(dialogsResultDbRet.dialogId).to.equal(dialogsResult.dialogId)
        expect(dialogsResultDbRet.originalVersion).to.equal(dialogsResult.originalVersion)
        expect(dialogsResultDbRet.currentVersion).to.equal(dialogsResult.currentVersion)
        expect(dialogsResultDbRet.result).to.equal(dialogsResult.result)
        expect(dialogsResultDbRet.differ).to.be.an('array')
        expect(dialogsResultDbRet.differ).to.be.lengthOf(1)
      })
    })
  })
})
