import {expect} from 'chai'
import * as ERROR_CONSTANTS from '../../src/constants/error.constants'
import * as SuiteHelper from '../../src/helpers/suite.helper'
import {DialogDifferSuite} from '../../src/interfaces'

describe('SuiteHelper', () => {
  it('should validate Suite', async () => {
    const suite: DialogDifferSuite = {
      options: {
        sizes: [{width: 1, height: 2}, {width: 3, height: 4}],
        originalVersion: '1',
        currentVersion: '2',
      },
      original: [{
        id: 'id',
        version: '1',
        url: 'url'
      }],
      current: [{
        id: 'id',
        version: '2',
        url: 'url'
      }]
    }

    expect(await SuiteHelper.validateSuite(suite)).to.be.true
  })

  describe('options', () => {
    it('should have options', async () => {
      // @ts-ignore
      const suite: DialogDifferSuite = {}

      try {
        const result = await SuiteHelper.validateSuite(suite)
        expect(result).to.be.false
      }
      catch (err) {
        expect(err.code).to.equal(ERROR_CONSTANTS.SUITE_OPTIONS_ERROR)
        expect(err.message).to.match(/Missing options/i)
      }
    })

    it('should have options size', async () => {
      const suite: DialogDifferSuite = {
        // @ts-ignore
        options: {}
      }

      try {
        const result = await SuiteHelper.validateSuite(suite)
        expect(result).to.be.false
      }
      catch (err) {
        expect(err.code).to.equal(ERROR_CONSTANTS.SUITE_OPTIONS_ERROR)
        expect(err.message).to.match(/Size is not given/i)
      }
    })

    it('should have current options size', async () => {
      const suite: DialogDifferSuite = {
        options: {
          // @ts-ignore
          sizes: [{width: 1}]
        }
      }

      try {
        const result = await SuiteHelper.validateSuite(suite)
        expect(result).to.be.false
      }
      catch (err) {
        expect(err.code).to.equal(ERROR_CONSTANTS.SUITE_OPTIONS_ERROR)
        expect(err.message).to.match(/Size \d is not valid/i)
      }
    })

    it('should have versions', async () => {
      const suite: DialogDifferSuite = {
        // @ts-ignore
        options: {
          sizes: [{width: 1, height: 1}]
        }
      }

      try {
        const result = await SuiteHelper.validateSuite(suite)
        expect(result).to.be.false
      }
      catch (err) {
        expect(err.code).to.equal(ERROR_CONSTANTS.SUITE_OPTIONS_ERROR)
        expect(err.message).to.match(/Missing.*?version/i)
      }
    })

    it('should have not have same versions', async () => {
      // @ts-ignore
      const suite: DialogDifferSuite = {
        options: {
          sizes: [{width: 1, height: 1}],
          originalVersion: '1',
          currentVersion: '1'
        }
      }

      try {
        const result = await SuiteHelper.validateSuite(suite)
        expect(result).to.be.false
      }
      catch (err) {
        expect(err.code).to.equal(ERROR_CONSTANTS.SUITE_OPTIONS_ERROR)
        expect(err.message).to.match(/equal.*?version/i)
      }
    })
  })

  describe('dialogs', () => {
    it('should have original dialogs', async () => {
      // @ts-ignore
      const suite: DialogDifferSuite = {
        options: {
          sizes: [{width: 1, height: 1}],
          originalVersion: '1',
          currentVersion: '2'
        }
      }

      try {
        const result = await SuiteHelper.validateSuite(suite)
        expect(result).to.be.false
      }
      catch (err) {
        expect(err.code).to.equal(ERROR_CONSTANTS.SUITE_ORIGINAL_DIALOG_ERROR)
        expect(err.message).to.match(/missing.*original/i)
      }
    })

    it('should have current dialogs', async () => {
      const suite: DialogDifferSuite = {
        options: {
          sizes: [{width: 1, height: 1}],
          originalVersion: '1',
          currentVersion: '2'
        },
        // @ts-ignore
        original: [{}],
        current: []
      }

      try {
        const result = await SuiteHelper.validateSuite(suite)
        expect(result).to.be.false
      }
      catch (err) {
        expect(err.code).to.equal(ERROR_CONSTANTS.SUITE_CURRENT_DIALOG_ERROR)
        expect(err.message).to.match(/missing.*current/i)
      }
    })

    it('original dialogs should have correct values', async () => {
      const suite: DialogDifferSuite = {
        options: {
          sizes: [{width: 1, height: 1}],
          originalVersion: '1',
          currentVersion: '2'
        },
        // @ts-ignore
        original: [{}],
        // @ts-ignore
        current: [{}]
      }

      try {
        const result = await SuiteHelper.validateSuite(suite)
        expect(result).to.be.false
      }
      catch (err) {
        expect(err.code).to.equal(ERROR_CONSTANTS.SUITE_ORIGINAL_DIALOG_ERROR)
        expect(err.message).to.match(/dialog \d.*?missing/i)
      }
    })
  })
})
