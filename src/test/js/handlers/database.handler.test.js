const chai = require('chai')
const Promise = require('bluebird')

const expect = chai.expect

const DatabaseHandler = require('../../../main/js/handlers/database.handler')
const LowDbDatabaseLayer = require('../../../main/js/layers/lowdb-database.layer')
const MongoDbDatabaseLayer = require('../../../main/js/layers/mongodb-database.layer')

const config = require('../../../main/js/config.lib').getConfig()

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

const layers = [
  {
    instance: new LowDbDatabaseLayer(),
    init: null,
  },
  // {
  //   instance: new MongoDbDatabaseLayer(),
  //   init: config.test.mongoUri,
  // }
]

describe('database handler', () => {
  layers.forEach(({instance, init}) => {
    describe(instance.constructor.name, () => {
      const databaseHandler = new DatabaseHandler(instance)

      beforeEach(() => {
        return databaseHandler
          .initDB(init)
          // .then(() => databaseHandler.initDB(init))
          .then(() => databaseHandler.clearDB())
      })

      /*
       * DIALOG SCREENSHOT
       */

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

        it('should save, overwrite and get dialog screenshot', () => {
          const originalScreenshot = {
            base64: 'base64',
            height: 1,
            width: 1,
          }
          const overwriteScreenshot = {...originalScreenshot, base64: 'base64_2'}

          /** @type {DialogDiffer.Dialog} */
          const dialog = {
            id: 'id',
            version: 'version',
            screenshots: [originalScreenshot]
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
            .then(() => databaseHandler.saveDialogScreenshot(dialog, overwriteScreenshot))
            .then(dialogScreenshotDb => {
              assertDialogScreenshot([dialogScreenshotDb], dialog, [overwriteScreenshot])
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

      /*
       * DIALOGS SCREENSHOTS
       */

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

        it('should delete dialogs screenshots', () => {
          /** @type {DialogDiffer.Dialog} */
          const dialogOne = {
            id: '1',
            version: '1',
            screenshots: [{
              base64: 'base64',
              height: 1,
              width: 1,
            }]
          }

          /** @type {DialogDiffer.Dialog} */
          const dialogTwo = {
            id: '2',
            version: '1',
            screenshots: [{
              base64: 'base64',
              height: 1,
              width: 1,
            }]
          }

          /** @type {DialogDiffer.Dialog} */
          const dialogThree = {
            id: '3',
            version: '2',
            screenshots: [{
              base64: 'base64',
              height: 1,
              width: 1,
            }]
          }

          return Promise
            .all([
              databaseHandler.saveDialogScreenshot(dialogOne, dialogOne.screenshots[0]),
              databaseHandler.saveDialogScreenshot(dialogTwo, dialogTwo.screenshots[0]),
              databaseHandler.saveDialogScreenshot(dialogThree, dialogThree.screenshots[0]),
            ])
            .then(() => Promise.all([
              databaseHandler.getDialogScreenshots(dialogOne, dialogOne.screenshots),
              databaseHandler.getDialogScreenshots(dialogTwo, dialogTwo.screenshots),
              databaseHandler.getDialogScreenshots(dialogThree, dialogThree.screenshots),
            ]))
            .then(([dialogOneScreenshots, dialogTwoScreenshots, dialogThreeScreenshots]) => {
              expect(dialogOneScreenshots).to.be.lengthOf(1)
              expect(dialogTwoScreenshots).to.be.lengthOf(1)
              expect(dialogThreeScreenshots).to.be.lengthOf(1)
            })
            .then(() => databaseHandler.deleteDialogsScreenshots('1'))
            .then(() => Promise.all([
              databaseHandler.getDialogScreenshots(dialogOne, dialogOne.screenshots),
              databaseHandler.getDialogScreenshots(dialogTwo, dialogTwo.screenshots),
              databaseHandler.getDialogScreenshots(dialogThree, dialogThree.screenshots),
            ]))
            .then(([dialogOneScreenshots, dialogTwoScreenshots, dialogThreeScreenshots]) => {
              expect(dialogOneScreenshots).to.be.lengthOf(0)
              expect(dialogTwoScreenshots).to.be.lengthOf(0)
              expect(dialogThreeScreenshots).to.be.lengthOf(1)
            })
        })
      })

      /*
       * SUITE RESULT
       */

      describe('SuiteResult', () => {
        it('should init, save, and get suite results', () => {
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
            Promise.delay(1).then(() => databaseHandler.newSuiteResult(suiteTwo)), // add delay
          ])
            .then(result => {
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
              expect(suiteResults[1].options.originalVersion).to.equal(1)
              expect(suiteResults[1].options.currentVersion).to.equal(2)
              expect(suiteResults[1].options.extra).to.eql({foo: 'bar'})
            })
        })

        it('should get suite result', () => {
          /** @type {DialogDiffer.Suite} */
          const suiteOne = {
            options: {
              originalVersion: 1,
              currentVersion: 2,
            }
          }

          databaseHandler
            .newSuiteResult(suiteOne)
            .then(suiteResultDb => databaseHandler.getSuiteResult(String(suiteResultDb.id)))
            .then(suiteResultDb => {
              expect(suiteResultDb).to.be.an('object')
              expect(suiteResultDb.options.originalVersion).to.equal(suiteOne.options.originalVersion)
              expect(suiteResultDb.options.currentVersion).to.equal(suiteOne.options.currentVersion)
            })
        })

        it('should delete suite result', () => {
          /** @type {DialogDiffer.Suite} */
          const suiteOne = {
            options: {
              originalVersion: 1,
              currentVersion: 2,
            }
          }

          /** @type {DialogDiffer.Suite} */
          const suiteTwo = {
            options: {
              originalVersion: 1,
              currentVersion: 2,
            }
          }

          Promise
            .all([
              databaseHandler.newSuiteResult(suiteOne),
              databaseHandler.newSuiteResult(suiteTwo),
            ])
            .then(([suiteResultDbOne, suiteResultDbTwo]) => Promise.all([
              suiteResultDbOne.id,
              suiteResultDbTwo.id,
              databaseHandler.deleteSuiteResult(String(suiteResultDbOne.id))
            ]))
            .then(([suiteOneId, suiteTwoId]) => Promise.all([
              databaseHandler.getSuiteResult(suiteOneId),
              databaseHandler.getSuiteResult(suiteTwoId),
            ]))
            .then(([suiteResultDbOne, suiteResultDbTwo]) => {
              expect(suiteResultDbOne).to.equal(null)

              expect(suiteResultDbTwo).to.be.an('object')
              expect(suiteResultDbTwo.options.originalVersion).to.equal(suiteTwo.options.originalVersion)
              expect(suiteResultDbTwo.options.currentVersion).to.equal(suiteTwo.options.currentVersion)
            })
        })
      })

      /*
       * SUITE RESULT
       */

      describe('DialogsResult', () => {
        it('should save and get dialogs result', () => {
          /** @type {DialogDiffer.Options} */
          const options = {
            sizes: [{width: 1, height: 1}],
            originalVersion: '1',
            currentVersion: '2',
          }

          /** @type {DialogDiffer.DialogsResult} */
          const dialogsResult = {
            dialogId: 'id',
            original: {
              id: 'id',
              version: options.originalVersion,
              screenshots: [{
                base64: 'base64',
                height: 1,
                width: 1,
              }]
            },
            current: {
              id: 'id',
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

          return databaseHandler
            .saveDialogsResult({options, dialogsResult})
            .then(({dialogsResult: dialogsResultRet, dialogsResultDb}) => {
              expect(dialogsResult).to.eql(dialogsResultRet)
              expect(dialogsResultDb).to.be.an('object')

              return databaseHandler.getDialogsResult({
                options,
                dialogId: dialogsResult.dialogId,
                originalVersion: dialogsResult.originalVersion,
                currentVersion: dialogsResult.currentVersion,
              })
            })
            .then(dialogsResultDb => {
              expect(dialogsResultDb).to.be.an('object')
              expect(dialogsResultDb.dialogId).to.equal(dialogsResult.dialogId)
              expect(dialogsResultDb.originalVersion).to.equal(dialogsResult.originalVersion)
              expect(dialogsResultDb.currentVersion).to.equal(dialogsResult.currentVersion)
              expect(dialogsResultDb.result).to.equal(dialogsResult.result)
              expect(dialogsResultDb.differ).to.be.an('array')
              expect(dialogsResultDb.differ).to.be.lengthOf(1)
            })
        })
      })
    })
  })
})
