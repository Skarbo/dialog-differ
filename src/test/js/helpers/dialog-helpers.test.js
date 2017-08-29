const chai = require( 'chai' );

const expect = chai.expect;

const ERROR_CONSTANTS = require( '../../../main/js/constants/error-constants' );

const SuiteHelper = require( '../../../main/js/helpers/suite-helper' );

describe( 'SuiteHelper', () => {
    it( 'should validate Suite', () => {
        /** @type {Suite.Suite} */
        const suite = {
            /** @type {Suite.Options} */
            options: {
                sizes: [{ width: 1, height: 2 }, { width: 3, height: 4 }],
                originalVersion: '1',
                currentVersion: '2',
            },
            /** @type {Array<Suite.Dialog>} */
            original: [{
                id: 'id',
                version: '1',
                url: 'url'
            }],
            /** @type {Array<Suite.Dialog>} */
            current: [{
                id: 'id',
                version: '2',
                url: 'url'
            }]
        };

        return SuiteHelper
            .validateSuite( suite )
            .then( result => {
                expect( result ).to.be.true;
            } );
    } );

    describe( 'options', () => {
        it( 'should have options', () => {
            /** @type {Suite.Suite} */
            const suite = {};

            return SuiteHelper
                .validateSuite( suite )
                .then( result => {
                    expect( result ).to.be.false;
                } )
                .catch( err => {
                    expect( err.code ).to.equal( ERROR_CONSTANTS.SUITE_OPTIONS_ERROR );
                    expect( err.message ).to.match( /Missing options/i );
                } );
        } );

        it( 'should have options size', () => {
            /** @type {Suite.Suite} */
            const suite = {
                options: {}
            };

            return SuiteHelper
                .validateSuite( suite )
                .then( result => {
                    expect( result ).to.be.false;
                } )
                .catch( err => {
                    expect( err.code ).to.equal( ERROR_CONSTANTS.SUITE_OPTIONS_ERROR );
                    expect( err.message ).to.match( /Size is not given/i );
                } );
        } );

        it( 'should have current options size', () => {
            /** @type {Suite.Suite} */
            const suite = {
                options: {
                    sizes: [{ width: 1 }]
                }
            };

            return SuiteHelper
                .validateSuite( suite )
                .then( result => {
                    expect( result ).to.be.false;
                } )
                .catch( err => {
                    expect( err.code ).to.equal( ERROR_CONSTANTS.SUITE_OPTIONS_ERROR );
                    expect( err.message ).to.match( /Size \d is not valid/i );
                } );
        } );

        it( 'should have versions', () => {
            /** @type {Suite.Suite} */
            const suite = {
                options: {
                    sizes: [{ width: 1, height: 1 }]
                }
            };

            return SuiteHelper
                .validateSuite( suite )
                .then( result => {
                    expect( result ).to.be.false;
                } )
                .catch( err => {
                    expect( err.code ).to.equal( ERROR_CONSTANTS.SUITE_OPTIONS_ERROR );
                    expect( err.message ).to.match( /Missing.*?version/i );
                } );
        } );

        it( 'should have not have same versions', () => {
            /** @type {Suite.Suite} */
            const suite = {
                options: {
                    sizes: [{ width: 1, height: 1 }],
                    originalVersion: '1',
                    currentVersion: '1'
                }
            };

            return SuiteHelper
                .validateSuite( suite )
                .then( result => {
                    expect( result ).to.be.false;
                } )
                .catch( err => {
                    expect( err.code ).to.equal( ERROR_CONSTANTS.SUITE_OPTIONS_ERROR );
                    expect( err.message ).to.match( /equal.*?version/i );
                } );
        } );
    } );

    describe( 'dialogs', () => {
        it( 'should have original dialogs', () => {
            /** @type {Suite.Suite} */
            const suite = {
                options: {
                    sizes: [{ width: 1, height: 1 }],
                    originalVersion: '1',
                    currentVersion: '2'
                }
            };

            return SuiteHelper
                .validateSuite( suite )
                .then( result => {
                    expect( result ).to.be.false;
                } )
                .catch( err => {
                    expect( err.code ).to.equal( ERROR_CONSTANTS.SUITE_ORIGINAL_DIALOG_ERROR );
                    expect( err.message ).to.match( /missing.*original/i );
                } );
        } );

        it( 'should have current dialogs', () => {
            /** @type {Suite.Suite} */
            const suite = {
                options: {
                    sizes: [{ width: 1, height: 1 }],
                    originalVersion: '1',
                    currentVersion: '2'
                },
                original: [{}],
                current: []
            };

            return SuiteHelper
                .validateSuite( suite )
                .then( result => {
                    expect( result ).to.be.false;
                } )
                .catch( err => {
                    expect( err.code ).to.equal( ERROR_CONSTANTS.SUITE_CURRENT_DIALOG_ERROR );
                    expect( err.message ).to.match( /missing.*current/i );
                } );
        } );

        it( 'original dialogs should have correct values', () => {
            /** @type {Suite.Suite} */
            const suite = {
                options: {
                    sizes: [{ width: 1, height: 1 }],
                    originalVersion: '1',
                    currentVersion: '2'
                },
                original: [{}],
                current: [{}]
            };

            return SuiteHelper
                .validateSuite( suite )
                .then( result => {
                    expect( result ).to.be.false;
                } )
                .catch( err => {
                    expect( err.code ).to.equal( ERROR_CONSTANTS.SUITE_ORIGINAL_DIALOG_ERROR );
                    expect( err.message ).to.match( /dialog \d.*?missing/i );
                } );
        } );
    } );
} );