const path = require( 'path' );
const chai = require( 'chai' );

const expect = chai.expect;

const DIFFER_CONSTANTS = require( '../../main/js/constants/differ-constants' );
const SUITE_CONSTANTS = require( '../../main/js/constants/suite-constants' );

const config = require( '../../../config.json' );

const DialogDiffer = require( '../../main/js/dialog-differ' );
const logger = require( '../../main/js/logger' );
const DatabaseHandler = require( '../../main/js/handlers/database.handler' );

const RESOURCES_FOLDER = path.resolve( __dirname, '../resources' );

function createDialogURL( dialog ) {
    return `file://${path.resolve( RESOURCES_FOLDER, dialog )}`;
}

describe( 'DialogDiffer', () => {
    let databaseHandler = new DatabaseHandler();

    beforeEach( () => {
        config.horsemanTimeout = 1000;
        logger.clear();
        return databaseHandler
            .clearDB()
            .then( () => databaseHandler.initDB() );
    } );

    describe( 'diff', () => {
        it( 'should diff', () => {
            /** @type {DialogDiffer.Suite} */
            const suite = {
                options: {
                    originalVersion: 1,
                    currentVersion: 2,
                    sizes: [{ width: 460, height: 350 }, { width: 320, height: 150 }],
                },
                original: [
                    {
                        version: 1,
                        id: 1,
                        url: createDialogURL( 'dialog-one.html' ),
                    }
                ],
                current: [
                    {
                        version: 2,
                        id: 1,
                        url: createDialogURL( 'dialog-two.html' ),
                    }
                ],
            };

            return DialogDiffer
                .diff( suite )
                .then( suiteResult => {
                    expect( suiteResult ).to.be.an( 'object' );
                    expect( suiteResult.id ).to.be.a( 'string' );
                    expect( suiteResult.status ).to.equal( SUITE_CONSTANTS.FINISHED_STATUS );
                    expect( suiteResult.results ).to.have.lengthOf( 1 );

                    expect( suiteResult.results[0].dialogId ).to.equal( suite.original[0].id );
                    expect( suiteResult.results[0].dialogId ).to.equal( suite.current[0].id );
                    expect( suiteResult.results[0].result ).to.equal( DIFFER_CONSTANTS.CHANGED_DIFFER_RESULT );

                    expect( suiteResult.results[0].original ).to.be.an( 'object' );
                    expect( suiteResult.results[0].original.screenshots ).to.be.an( 'array' );
                    expect( suiteResult.results[0].original.screenshots ).to.have.lengthOf( 2 );

                    expect( suiteResult.results[0].differ ).to.have.lengthOf( 2 );
                    expect( suiteResult.results[0].differ[0].result ).to.equal( DIFFER_CONSTANTS.CHANGED_DIFFER_RESULT );
                    expect( suiteResult.results[0].differ[1].result ).to.equal( DIFFER_CONSTANTS.CHANGED_DIFFER_RESULT );
                } );
        } );
    } );

    describe( 'getSuiteResult', () => {
        it( 'should get suite result', () => {
            /** @type {DialogDiffer.Suite} */
            const suite = {
                options: {
                    originalVersion: 1,
                    currentVersion: 2,
                    sizes: [{ width: 460, height: 350 }, { width: 320, height: 150 }],
                },
                original: [
                    {
                        version: 1,
                        id: 1,
                        url: createDialogURL( 'dialog-one.html' ),
                    },
                    {
                        version: 1,
                        id: 2,
                        url: createDialogURL( 'dialog-hash.html' ),
                        hash: 'deleted'
                    }
                ],
                current: [
                    {
                        version: 2,
                        id: 1,
                        url: createDialogURL( 'dialog-two.html' ),
                    },
                    {
                        version: 2,
                        id: 3,
                        url: createDialogURL( 'dialog-hash.html' ),
                        hash: 'added'
                    }
                ],
            };

            return DialogDiffer
                .diff( suite )
                .then( suiteResult => {
                    expect( suiteResult ).to.be.an( 'object' );
                    expect( suiteResult.id ).to.be.a( 'string' );
                    expect( suiteResult.status ).to.equal( SUITE_CONSTANTS.FINISHED_STATUS );

                    return DialogDiffer.getSuiteResult( suiteResult.id );
                } )
                .then( suiteResult => {
                    expect( suiteResult ).to.be.an( 'object' );
                    expect( suiteResult.id ).to.equal( suite.id );
                    expect( suiteResult.status ).to.equal( SUITE_CONSTANTS.FINISHED_STATUS );
                    expect( suiteResult.results ).to.have.lengthOf( 3 );

                    expect( suiteResult.results[0].dialogId ).to.equal( suite.original[0].id );
                    expect( suiteResult.results[0].result ).to.equal( DIFFER_CONSTANTS.CHANGED_DIFFER_RESULT );

                    expect( suiteResult.results[0].original ).to.be.an( 'object' );
                    expect( suiteResult.results[0].original.version ).to.equal( suite.original[0].version );
                    expect( suiteResult.results[0].original.id ).to.equal( suite.original[0].id );
                    expect( suiteResult.results[0].original.screenshots ).to.be.an( 'array' );
                    expect( suiteResult.results[0].original.screenshots ).to.have.lengthOf( 2 );

                    expect( suiteResult.results[0].current ).to.be.an( 'object' );
                    expect( suiteResult.results[0].current.version ).to.equal( suite.current[0].version );
                    expect( suiteResult.results[0].current.id ).to.equal( suite.current[0].id );
                    expect( suiteResult.results[0].current.screenshots ).to.be.an( 'array' );
                    expect( suiteResult.results[0].current.screenshots ).to.have.lengthOf( 2 );

                    expect( suiteResult.results[0].differ ).to.have.lengthOf( 2 );
                    expect( suiteResult.results[0].differ[0].result ).to.equal( DIFFER_CONSTANTS.CHANGED_DIFFER_RESULT );
                    expect( suiteResult.results[0].differ[0].base64 ).to.be.an( 'string' );
                    expect( suiteResult.results[0].differ[1].result ).to.equal( DIFFER_CONSTANTS.CHANGED_DIFFER_RESULT );
                    expect( suiteResult.results[0].differ[1].base64 ).to.be.an( 'string' );

                    expect( suiteResult.results[1].dialogId ).to.equal( suite.original[1].id );
                    expect( suiteResult.results[1].originalVersion ).to.equal( suite.original[1].version );
                    expect( suiteResult.results[1].currentVersion ).to.equal( null );
                    expect( suiteResult.results[1].result ).to.equal( DIFFER_CONSTANTS.DELETED_DIFFER_RESULT );

                    expect( suiteResult.results[1].original ).to.be.an( 'object' );
                    expect( suiteResult.results[1].current ).to.equal( null );

                    expect( suiteResult.results[1].differ ).to.have.lengthOf( 2 );
                    expect( suiteResult.results[1].differ[0].result ).to.equal( DIFFER_CONSTANTS.DELETED_DIFFER_RESULT );
                    expect( suiteResult.results[1].differ[0].base64 ).to.equal( null );
                    expect( suiteResult.results[1].differ[1].result ).to.equal( DIFFER_CONSTANTS.DELETED_DIFFER_RESULT );
                    expect( suiteResult.results[1].differ[1].base64 ).to.equal( null );

                    expect( suiteResult.results[2].dialogId ).to.equal( suite.current[1].id );
                    expect( suiteResult.results[2].originalVersion ).to.equal( null );
                    expect( suiteResult.results[2].currentVersion ).to.equal( suite.current[1].version );
                    expect( suiteResult.results[2].result ).to.equal( DIFFER_CONSTANTS.ADDED_DIFFER_RESULT );

                    expect( suiteResult.results[2].original ).to.equal( null );
                    expect( suiteResult.results[2].current ).to.be.an( 'object' );

                    expect( suiteResult.results[2].differ ).to.have.lengthOf( 2 );
                    expect( suiteResult.results[2].differ[0].result ).to.equal( DIFFER_CONSTANTS.ADDED_DIFFER_RESULT );
                    expect( suiteResult.results[2].differ[0].base64 ).to.equal( null );
                    expect( suiteResult.results[2].differ[1].result ).to.equal( DIFFER_CONSTANTS.ADDED_DIFFER_RESULT );
                    expect( suiteResult.results[2].differ[1].base64 ).to.equal( null );
                } );
        } );
    } );
} );