const chai = require('chai')

const expect = chai.expect

const DatabaseHandler = require('../../../main/js/handlers/database.handler')

/**
 * @param {Array<DialogDiffer.Database.DialogScreenshot>} dialogScreenshotsDb
 * @param {DialogDiffer.Dialog} dialog
 * @param {Array<DialogDiffer.DialogScreenshot>} dialogScreenshots
 */
function assertDialogScreenshot (dialogScreenshotsDb, dialog, dialogScreenshots) {
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
  const databaseHandler = new DatabaseHandler()

  beforeEach(() => {
    return databaseHandler
      .clearDB()
      .then(() => databaseHandler.initDB())
  })

  describe('DialogScreenshot', () => {
    it('should save and get dialog screenshot', () => {
      /** @type {DialogDiffer.Dialog} */
      const dialog = {
        id: 'id',
        version: 'version',
        screenshots: [{
          base64: 'base64',
          height: 1,
          width: 1,
        }]
      }

      return databaseHandler
        .saveDialogScreenshot(dialog, dialog.screenshots[0])
        .then(dialogScreenshotDb => {
          assertDialogScreenshot([dialogScreenshotDb], dialog, dialog.screenshots)

          return databaseHandler.getDialogScreenshot(dialog, {
            width: dialog.screenshots[0].width,
            height: dialog.screenshots[0].height
          })
        })
        .then(dialogScreenshotDb => {
          assertDialogScreenshot([dialogScreenshotDb], dialog, dialog.screenshots)
        })
    })

    it('should get dialog screenshots', () => {
      const sizes = [{width: 1, height: 1}, {width: 2, height: 2}]

      /** @type {DialogDiffer.Dialog} */
      const dialog = {
        id: 'id',
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

      return Promise
        .all([
          databaseHandler.saveDialogScreenshot(dialog, dialog.screenshots[0]),
          databaseHandler.saveDialogScreenshot(dialog, dialog.screenshots[1]),
        ])
        .then(() => databaseHandler.getDialogScreenshots(dialog, sizes))
        .then(dialogScreenshotsDb => {
          assertDialogScreenshot(dialogScreenshotsDb, dialog, dialog.screenshots)
        })
    })
  })

  describe('DialogsScreenshots', () => {
    it('should get dialogs screenshots', () => {
      const sizes = [{width: 1, height: 1}, {width: 2, height: 2}]

      /** @type {DialogDiffer.Dialog} */
      const dialogOne = {
        id: 'id',
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

      /** @type {DialogDiffer.Dialog} */
      const dialogTwo = {
        id: 'id',
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

      /** @type {DialogDiffer.Dialog} */
      const dialogThree = {
        id: 'id',
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

      return Promise
        .all([
          databaseHandler.saveDialogScreenshot(dialogOne, dialogOne.screenshots[0]),
          databaseHandler.saveDialogScreenshot(dialogOne, dialogOne.screenshots[1]),
          databaseHandler.saveDialogScreenshot(dialogTwo, dialogOne.screenshots[0]),
          databaseHandler.saveDialogScreenshot(dialogTwo, dialogOne.screenshots[1]),
          databaseHandler.saveDialogScreenshot(dialogThree, dialogOne.screenshots[0]),
          databaseHandler.saveDialogScreenshot(dialogThree, dialogOne.screenshots[1]),
        ])
        .then(() => databaseHandler.getDialogsScreenshots(dialogs, sizes))
        .then(dialogsScreenshotsDb => {
          expect(dialogsScreenshotsDb).to.be.lengthOf(2)

          dialogsScreenshotsDb.forEach((dialogScreenshotsDb, i) => {
            assertDialogScreenshot(dialogScreenshotsDb, dialogs[i], dialogs[i].screenshots)
          })
        })
    })

    it('should overwrite dialogs screenshots', () => {
      const sizes = [{width: 1, height: 1}, {width: 2, height: 2}]

      /** @type {DialogDiffer.Dialog} */
      const dialogOne = {
        id: 'id',
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

      /** @type {DialogDiffer.Dialog} */
      const dialogOneSecond = {
        id: 'id',
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

      return Promise
        .all([
          databaseHandler.saveDialogScreenshot(dialogOne, dialogOne.screenshots[0]),
          databaseHandler.saveDialogScreenshot(dialogOne, dialogOne.screenshots[1]),
        ])
        .then(() => databaseHandler.getDialogsScreenshots([dialogOne], sizes))
        .then(dialogsScreenshotsDb => {
          expect(dialogsScreenshotsDb).to.be.lengthOf(1)

          return Promise
            .all([
              databaseHandler.saveDialogScreenshot(dialogOneSecond, dialogOneSecond.screenshots[0]),
              databaseHandler.saveDialogScreenshot(dialogOneSecond, dialogOneSecond.screenshots[1]),
            ])
        })
        .then(() => databaseHandler.getDialogsScreenshots([dialogOneSecond], sizes))
        .then((dialogsScreenshotsDb) => {
          expect(dialogsScreenshotsDb).to.be.lengthOf(1)

          assertDialogScreenshot(dialogsScreenshotsDb[0], dialogOneSecond, dialogOneSecond.screenshots)
        })
    })
  })

  describe('SuiteResult', () => {
    it('should init, save, and should get suite results', () => {
      /** @type {DialogDiffer.Suite} */
      const suiteOne = {
        options: {
          originalVersion: 1,
          currentVersion: 2,
          extra: {
            foo: 'bar'
          }
        }
      }
      /** @type {DialogDiffer.Suite} */
      const suiteTwo = {
        options: {
          originalVersion: 2,
          currentVersion: 3
        }
      }

      /** @type {DialogDiffer.SuiteResult} */
      const suiteResultOne = {
        options: suiteOne.options,
        results: [
          {
            dialogId: 1,
            originalVersion: suiteOne.options.originalVersion,
            currentVersion: suiteOne.options.currentVersion,
            result: 'result'
          },
          {
            dialogId: 2,
            originalVersion: suiteOne.options.originalVersion,
            currentVersion: suiteOne.options.currentVersion,
            result: 'result2'
          }
        ]
      }

      /** @type {DialogDiffer.SuiteResult} */
      const suiteResultTwo = {
        options: suiteTwo.options,
        results: [
          {
            dialogId: 1,
            originalVersion: suiteTwo.options.originalVersion,
            currentVersion: suiteTwo.options.currentVersion,
            result: 'result'
          },
          {
            dialogId: 2,
            originalVersion: suiteTwo.options.originalVersion,
            currentVersion: suiteTwo.options.currentVersion,
            result: 'result2'
          }
        ]
      }

      return Promise.all([
        databaseHandler.newSuiteResult(suiteOne),
        databaseHandler.newSuiteResult(suiteTwo),
      ])
        .then(result => {
          console.log('result', result[0])
          suiteResultOne.id = result[0].id
          suiteResultTwo.id = result[1].id

          return Promise.all([
            databaseHandler.saveSuiteResult(suiteResultOne),
            databaseHandler.saveSuiteResult(suiteResultTwo),
          ])
        })
        .then(() => {
          return databaseHandler.getLastSuiteResults()
        })
        .then(suiteResults => {
          expect(suiteResults).to.be.an('array')
          expect(suiteResults).to.be.lengthOf(2)

          expect(suiteResults[0].options.originalVersion).to.equal(2)
          expect(suiteResults[0].options.currentVersion).to.equal(3)
          expect(suiteResults[0].options.extra).to.eql({foo: 'bar'})
          expect(suiteResults[1].options.originalVersion).to.equal(1)
          expect(suiteResults[1].options.currentVersion).to.equal(2)
        })
    })
  })
})
