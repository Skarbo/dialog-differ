const path = require('path')
const chai = require('chai')

const expect = chai.expect

const DIFFER_CONSTANTS = require('../../main/js/constants/differ.constants')
const SUITE_CONSTANTS = require('../../main/js/constants/suite.constants')
const ERROR_CONSTANTS = require('../../main/js/constants/error.constants')

const DialogDiffer = require('../../main/js/dialog-differ')
const logger = require('../../main/js/logger')
const config = require('../../main/js/config.lib').getConfig()

const RESOURCES_FOLDER = path.resolve(__dirname, '../resources')

function createDialogURL (dialog) {
  return `file://${path.resolve(RESOURCES_FOLDER, dialog)}`
}

const LowDbDatabaseLayer = DialogDiffer.LowDbDatabaseLayer
const MongoDbDatabaseLayer = DialogDiffer.MongoDbDatabaseLayer
const databaseLayers = [
  {
    instance: new LowDbDatabaseLayer(),
    init: null,
  },
  // {
  //   instance: new MongoDbDatabaseLayer(),
  //   init: config.test.mongoUri,
  // },
]

describe('DialogDiffer', () => {
  databaseLayers.forEach(({instance: databaseLayer, init: databaseInit}) => {
    describe(databaseLayer.constructor.name, () => {
      const dialogDiffer = new DialogDiffer({
        databaseLayer: databaseLayer,
        config: {
          logLevel: DialogDiffer.LOGGER_CONSTANTS.DEBUG_LOG_LEVEL,
          browserTimeout: 1000
        }
      })

      beforeEach(async () => {
        logger.clear()
        await dialogDiffer.initDialogDiffer({databaseArgs: databaseInit})
        await dialogDiffer.databaseHandler.clearDB()
      })

      describe('diff', () => {
        it('should diff', async function () {
          this.timeout(5000)

          /** @type {DialogDiffer.Suite} */
          const suite = {
            options: {
              originalVersion: 1,
              currentVersion: 2,
              sizes: [{width: 460, height: 350}, {width: 320, height: 150}],
            },
            original: [
              {
                version: 1,
                id: 1,
                url: createDialogURL('dialog-one.html'),
              }
            ],
            current: [
              {
                version: 2,
                id: 1,
                url: createDialogURL('dialog-two.html'),
              }
            ],
          }

          const suiteResult = await dialogDiffer.diff(suite)
          console.log('suiteResult', suiteResult)
          expect(suiteResult).to.be.an('object')
          expect(suiteResult.id).to.be.a('string')
          expect(suiteResult.status).to.equal(SUITE_CONSTANTS.FINISHED_STATUS)
          expect(suiteResult.results).to.have.lengthOf(1)

          expect(suiteResult.results[0].dialogId).to.equal(suite.original[0].id)
          expect(suiteResult.results[0].dialogId).to.equal(suite.current[0].id)
          expect(suiteResult.results[0].result).to.equal(DIFFER_CONSTANTS.CHANGED_DIFFER_RESULT)

          expect(suiteResult.results[0].original).to.be.an('object')
          expect(suiteResult.results[0].original.screenshots).to.be.an('array')
          expect(suiteResult.results[0].original.screenshots).to.have.lengthOf(2)

          expect(suiteResult.results[0].differ).to.have.lengthOf(2)
          expect(suiteResult.results[0].differ[0].result).to.equal(DIFFER_CONSTANTS.CHANGED_DIFFER_RESULT)
          expect(suiteResult.results[0].differ[1].result).to.equal(DIFFER_CONSTANTS.CHANGED_DIFFER_RESULT)
        })

        it('should diff valid dialogs and not error dialogs', async function () {
          this.timeout(5000)

          /** @type {DialogDiffer.Suite} */
          const suite = {
            options: {
              originalVersion: 1,
              currentVersion: 2,
              sizes: [{width: 460, height: 350}],
            },
            original: [
              {
                version: 1,
                id: 1,
                url: createDialogURL('dialog-one.html'),
              },
              {
                version: 1,
                id: 2,
                url: createDialogURL('dialog-hash.html'),
                hash: 'First',
              }
            ],
            current: [
              {
                version: 2,
                id: 1,
                url: createDialogURL('dialog-two.html'),
                waitForSelector: 'will-timeout',
              },
              {
                version: 2,
                id: 2,
                url: createDialogURL('dialog-hash.html'),
                hash: 'Second',
              }
            ],
          }

          const suiteResult = await dialogDiffer.diff(suite)

          expect(suiteResult).to.be.an('object')
          expect(suiteResult.id).to.be.a('string')
          expect(suiteResult.status).to.equal(SUITE_CONSTANTS.FINISHED_STATUS)
          expect(suiteResult.results).to.have.lengthOf(2)
          expect(suiteResult.stats).to.be.an('object')
          expect(suiteResult.stats.changed).to.equal(1)
          expect(suiteResult.stats.error).to.equal(1)

          expect(suiteResult.results[0].dialogId).to.equal(suite.original[0].id)
          expect(suiteResult.results[0].dialogId).to.equal(suite.current[0].id)
          expect(suiteResult.results[0].result).to.equal(DIFFER_CONSTANTS.ERROR_DIFFER_RESULT)

          expect(suiteResult.results[0].original).to.be.an('object')
          expect(suiteResult.results[0].original.screenshots).to.be.an('array')
          expect(suiteResult.results[0].original.screenshots).to.have.lengthOf(1)

          expect(suiteResult.results[0].current).to.be.an('object')
          expect(suiteResult.results[0].current.screenshots).to.be.an('array')
          expect(suiteResult.results[0].current.screenshots).to.have.lengthOf(0)
          expect(suiteResult.results[0].current.error).to.be.an('object')
          expect(suiteResult.results[0].current.error.code).to.equal(ERROR_CONSTANTS.SNAP_DIALOG_FROM_BROWSER_ERROR)

          expect(suiteResult.results[0].differ).to.have.lengthOf(0)

          expect(suiteResult.results[1].dialogId).to.equal(suite.original[1].id)
          expect(suiteResult.results[1].dialogId).to.equal(suite.current[1].id)
          expect(suiteResult.results[1].result).to.equal(DIFFER_CONSTANTS.CHANGED_DIFFER_RESULT)

          expect(suiteResult.results[1].original).to.be.an('object')
          expect(suiteResult.results[1].original.screenshots).to.be.an('array')
          expect(suiteResult.results[1].original.screenshots).to.have.lengthOf(1)

          expect(suiteResult.results[1].current).to.be.an('object')
          expect(suiteResult.results[1].current.screenshots).to.be.an('array')
          expect(suiteResult.results[1].current.screenshots).to.have.lengthOf(1)

          expect(suiteResult.results[1].differ).to.have.lengthOf(1)
        })
      })

      describe('getSuiteResult', () => {
        it('should get suite result', async function () {
          this.timeout(5000)

          /** @type {DialogDiffer.Suite} */
          const suite = {
            options: {
              originalVersion: 1,
              currentVersion: 2,
              sizes: [{width: 460, height: 350}, {width: 320, height: 150}],
            },
            original: [
              {
                version: 1,
                id: 1,
                url: createDialogURL('dialog-one.html'),
                options: {
                  sizes: [{width: 100, height: 200}, {width: 300, height: 400}],
                  extra: {foo: 'bar'},
                }
              },
              {
                version: 1,
                id: 2,
                url: createDialogURL('dialog-hash.html'),
                hash: 'deleted'
              }
            ],
            current: [
              {
                version: 2,
                id: 1,
                url: createDialogURL('dialog-two.html'),
                options: {
                  sizes: [{width: 100, height: 200}, {width: 300, height: 400}],
                  extra: {foo: 'bar'},
                }
              },
              {
                version: 2,
                id: 3,
                url: createDialogURL('dialog-hash.html'),
                hash: 'added'
              }
            ],
          }

          const suiteResult = await dialogDiffer.diff(suite)

          expect(suiteResult).to.be.an('object')
          expect(suiteResult.id).to.be.a('string')
          expect(suiteResult.status).to.equal(SUITE_CONSTANTS.FINISHED_STATUS)

          const retrievedSuiteResult = await dialogDiffer.getSuiteResult(suiteResult.id)

          expect(retrievedSuiteResult).to.be.an('object')
          expect(retrievedSuiteResult.id).to.equal(suite.id)
          expect(retrievedSuiteResult.status).to.equal(SUITE_CONSTANTS.FINISHED_STATUS)
          expect(retrievedSuiteResult.results).to.have.lengthOf(3)

          expect(retrievedSuiteResult.results[0].dialogId).to.equal(suite.original[0].id)
          expect(retrievedSuiteResult.results[0].result).to.equal(DIFFER_CONSTANTS.CHANGED_DIFFER_RESULT)

          expect(retrievedSuiteResult.results[0].original).to.be.an('object')
          expect(retrievedSuiteResult.results[0].original.version).to.equal(suite.original[0].version)
          expect(retrievedSuiteResult.results[0].original.id).to.equal(suite.original[0].id)
          expect(retrievedSuiteResult.results[0].original.url).to.equal(suite.original[0].url)
          expect(retrievedSuiteResult.results[0].original.options).to.eql(suite.original[0].options)
          expect(retrievedSuiteResult.results[0].original.screenshots).to.be.an('array')
          expect(retrievedSuiteResult.results[0].original.screenshots).to.have.lengthOf(2)

          expect(retrievedSuiteResult.results[0].current).to.be.an('object')
          expect(retrievedSuiteResult.results[0].current.version).to.equal(suite.current[0].version)
          expect(retrievedSuiteResult.results[0].current.id).to.equal(suite.current[0].id)
          expect(retrievedSuiteResult.results[0].current.url).to.equal(suite.current[0].url)
          expect(retrievedSuiteResult.results[0].current.options).to.eql(suite.current[0].options)
          expect(retrievedSuiteResult.results[0].current.screenshots).to.be.an('array')
          expect(retrievedSuiteResult.results[0].current.screenshots).to.have.lengthOf(2)

          expect(retrievedSuiteResult.results[0].differ).to.have.lengthOf(2)
          expect(retrievedSuiteResult.results[0].differ[0].result).to.equal(DIFFER_CONSTANTS.CHANGED_DIFFER_RESULT)
          expect(retrievedSuiteResult.results[0].differ[0].base64).to.be.an('string')
          expect(retrievedSuiteResult.results[0].differ[1].result).to.equal(DIFFER_CONSTANTS.CHANGED_DIFFER_RESULT)
          expect(retrievedSuiteResult.results[0].differ[1].base64).to.be.an('string')

          expect(retrievedSuiteResult.results[1].dialogId).to.equal(suite.original[1].id)
          expect(retrievedSuiteResult.results[1].originalVersion).to.equal(suite.original[1].version)
          expect(retrievedSuiteResult.results[1].currentVersion).to.equal(null)
          expect(retrievedSuiteResult.results[1].result).to.equal(DIFFER_CONSTANTS.DELETED_DIFFER_RESULT)

          expect(retrievedSuiteResult.results[1].original).to.be.an('object')
          expect(retrievedSuiteResult.results[1].current).to.equal(null)

          expect(retrievedSuiteResult.results[1].differ).to.have.lengthOf(2)
          expect(retrievedSuiteResult.results[1].differ[0].result).to.equal(DIFFER_CONSTANTS.DELETED_DIFFER_RESULT)
          expect(retrievedSuiteResult.results[1].differ[0].base64).to.equal(null)
          expect(retrievedSuiteResult.results[1].differ[1].result).to.equal(DIFFER_CONSTANTS.DELETED_DIFFER_RESULT)
          expect(retrievedSuiteResult.results[1].differ[1].base64).to.equal(null)

          expect(retrievedSuiteResult.results[2].dialogId).to.equal(suite.current[1].id)
          expect(retrievedSuiteResult.results[2].originalVersion).to.equal(null)
          expect(retrievedSuiteResult.results[2].currentVersion).to.equal(suite.current[1].version)
          expect(retrievedSuiteResult.results[2].result).to.equal(DIFFER_CONSTANTS.ADDED_DIFFER_RESULT)

          expect(retrievedSuiteResult.results[2].original).to.equal(null)
          expect(retrievedSuiteResult.results[2].current).to.be.an('object')

          expect(retrievedSuiteResult.results[2].differ).to.have.lengthOf(2)
          expect(retrievedSuiteResult.results[2].differ[0].result).to.equal(DIFFER_CONSTANTS.ADDED_DIFFER_RESULT)
          expect(retrievedSuiteResult.results[2].differ[0].base64).to.equal(null)
          expect(retrievedSuiteResult.results[2].differ[1].result).to.equal(DIFFER_CONSTANTS.ADDED_DIFFER_RESULT)
          expect(retrievedSuiteResult.results[2].differ[1].base64).to.equal(null)
        })

        it('should get suite result with one error', async function () {
          this.timeout(5000)

          /** @type {DialogDiffer.Suite} */
          const suite = {
            options: {
              originalVersion: 1,
              currentVersion: 2,
              sizes: [{width: 460, height: 350}],
            },
            original: [
              {
                version: 1,
                id: 1,
                url: createDialogURL('dialog-one.html'),
              },
              {
                version: 1,
                id: 2,
                url: createDialogURL('dialog-hash.html'),
                hash: 'First',
              }
            ],
            current: [
              {
                version: 2,
                id: 1,
                url: createDialogURL('dialog-two.html'),
                waitForSelector: 'will-timeout',
              },
              {
                version: 2,
                id: 2,
                url: createDialogURL('dialog-hash.html'),
                hash: 'Second',
              }
            ],
          }

          const suiteResult = await dialogDiffer.diff(suite)

          expect(suiteResult).to.be.an('object')
          expect(suiteResult.id).to.be.a('string')
          expect(suiteResult.status).to.equal(SUITE_CONSTANTS.FINISHED_STATUS)

          const retrievedSuiteResult = await dialogDiffer.getSuiteResult(suiteResult.id)

          expect(retrievedSuiteResult).to.be.an('object')
          expect(retrievedSuiteResult.id).to.be.a('string')
          expect(retrievedSuiteResult.status).to.equal(SUITE_CONSTANTS.FINISHED_STATUS)
          expect(retrievedSuiteResult.results).to.have.lengthOf(2)
          expect(retrievedSuiteResult.stats).to.be.an('object')
          expect(retrievedSuiteResult.stats.changed).to.equal(1)
          expect(retrievedSuiteResult.stats.error).to.equal(1)

          expect(retrievedSuiteResult.results[0].dialogId).to.equal(suite.original[0].id)
          expect(retrievedSuiteResult.results[0].dialogId).to.equal(suite.current[0].id)
          expect(retrievedSuiteResult.results[0].result).to.equal(DIFFER_CONSTANTS.ERROR_DIFFER_RESULT)

          expect(retrievedSuiteResult.results[0].original).to.be.an('object')
          expect(retrievedSuiteResult.results[0].original.screenshots).to.be.an('array')
          expect(retrievedSuiteResult.results[0].original.screenshots).to.have.lengthOf(1)
          expect(retrievedSuiteResult.results[0].original.error).to.equal(null)

          expect(retrievedSuiteResult.results[0].current).to.be.an('object')
          expect(retrievedSuiteResult.results[0].current.screenshots).to.be.an('array')
          expect(retrievedSuiteResult.results[0].current.screenshots).to.have.lengthOf(0)
          expect(retrievedSuiteResult.results[0].current.error).to.be.an('object')
          expect(retrievedSuiteResult.results[0].current.error.code).to.equal(ERROR_CONSTANTS.SNAP_DIALOG_FROM_BROWSER_ERROR)
          expect(retrievedSuiteResult.results[0].current.error.message).to.match(/waiting.*?failed/)

          expect(retrievedSuiteResult.results[0].differ).to.have.lengthOf(1)

          expect(retrievedSuiteResult.results[1].dialogId).to.equal(suite.original[1].id)
          expect(retrievedSuiteResult.results[1].dialogId).to.equal(suite.current[1].id)
          expect(retrievedSuiteResult.results[1].result).to.equal(DIFFER_CONSTANTS.CHANGED_DIFFER_RESULT)

          expect(retrievedSuiteResult.results[1].original).to.be.an('object')
          expect(retrievedSuiteResult.results[1].original.screenshots).to.be.an('array')
          expect(retrievedSuiteResult.results[1].original.screenshots).to.have.lengthOf(1)

          expect(retrievedSuiteResult.results[1].current).to.be.an('object')
          expect(retrievedSuiteResult.results[1].current.screenshots).to.be.an('array')
          expect(retrievedSuiteResult.results[1].current.screenshots).to.have.lengthOf(1)

          expect(retrievedSuiteResult.results[1].differ).to.have.lengthOf(1)
        })
      })
    })
  })
})
