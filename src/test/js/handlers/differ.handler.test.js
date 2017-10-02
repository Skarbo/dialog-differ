const path = require( 'path' );
const chai = require( 'chai' );

const expect = chai.expect;

const SuiteHelper = require( '../../../main/js/helpers/suite.helper' );

const SnapHandler = require( '../../../main/js/handlers/snap.handler' );
const DifferHandler = require( '../../../main/js/handlers/differ.handler' );
const logger = require( '../../../main/js/logger' );
const DatabaseHandler = require( '../../../main/js/handlers/database.handler' );

const RESOURCES_FOLDER = path.resolve( __dirname, '../../resources' );
const DIFFER_CONSTANTS = require( '../../../main/js/constants/differ-constants' );
const SUITE_CONSTANTS = require( '../../../main/js/constants/suite-constants' );
const LOGGER_CONSTANTS = require( '../../../main/js/constants/logger-constants' );

const config = require( '../../../../config.json' );

function createDialogURL( dialog ) {
    return `file://${path.resolve( RESOURCES_FOLDER, dialog )}`;
}

describe( 'differ handler', () => {
    const databaseHandler = new DatabaseHandler();
    const snapHandler = new SnapHandler( databaseHandler );
    const differHandler = new DifferHandler( databaseHandler );

    beforeEach( () => {
        logger.clear();
        config.horsemanTimeout = 1000;

        return databaseHandler
            .clearDB()
            .then( () => databaseHandler.initDB() );
    } );

    describe( 'differDialogScreenshot', () => {
        it( 'should have same screenshots', () => {
            return differHandler.differDialogScreenshot(
                {
                    path: path.resolve( RESOURCES_FOLDER, 'dialog-one.png' )
                },
                {
                    path: path.resolve( RESOURCES_FOLDER, 'dialog-one.png' )
                }
            ).then( result => {
                expect( result ).to.be.an( 'object' );
                expect( result.isIdentical ).to.equal( true );
                expect( result.base64 ).to.equal( null )
            } );
        } );

        it( 'should differ screenshots', () => {
            return differHandler.differDialogScreenshot(
                {
                    path: path.resolve( RESOURCES_FOLDER, 'dialog-one.png' )
                },
                {
                    path: path.resolve( RESOURCES_FOLDER, 'dialog-two.png' )
                }
            ).then( result => {
                expect( result ).to.be.an( 'object' );
                expect( result.isIdentical ).to.equal( false );
                expect( result.base64 ).to.be.an( 'string' );
            } );
        } );
    } );

    describe( 'differDialog', () => {
        it( 'should differ dialogs', () => {
            /**
             * @type {DialogDiffer.Dialog}
             */
            const dialogOriginal = {
                id: '1',
                version: '1',
                url: createDialogURL( 'dialog-one.html' )
            };
            /**
             * @type {DialogDiffer.Dialog}
             */
            const dialogCurrent = {
                id: '1',
                version: '2',
                url: createDialogURL( 'dialog-two.html' )
            };

            /** @type {DialogDiffer.Options} */
            const options = {
                sizes: [{ width: 460, height: 350 }, { width: 320, height: 150 }]
            };

            return Promise
                .all( [
                    snapHandler.snapDialog( options, dialogOriginal ),
                    snapHandler.snapDialog( options, dialogCurrent )] )
                .then( ( [dialogOriginal, dialogNew] ) => {
                    return differHandler.differDialog( options, dialogOriginal, dialogNew );
                } )
                .then( dialogResult => {
                    expect( dialogResult ).to.be.an( 'object' );
                    expect( dialogResult.original ).to.be.an( 'object' );
                    expect( dialogResult.current ).to.be.an( 'object' );
                    expect( dialogResult.result ).to.equal( DIFFER_CONSTANTS.CHANGED_DIFFER_RESULT );
                    expect( dialogResult.differ ).to.be.an( 'array' );
                    expect( dialogResult.differ ).to.have.lengthOf( 2 );

                    expect( dialogResult.differ[0] ).to.be.an( 'object' );
                    expect( dialogResult.differ[0].index ).to.equal( 0 );
                    expect( dialogResult.differ[0].base64 ).to.be.an( 'string' );
                    expect( dialogResult.differ[0].result ).to.equal( DIFFER_CONSTANTS.CHANGED_DIFFER_RESULT );

                    expect( dialogResult.differ[1] ).to.be.an( 'object' );
                    expect( dialogResult.differ[1].index ).to.equal( 1 );
                    expect( dialogResult.differ[1].base64 ).to.be.an( 'string' );
                    expect( dialogResult.differ[1].result ).to.equal( DIFFER_CONSTANTS.CHANGED_DIFFER_RESULT );

                    return databaseHandler.getDialogsResult( options, dialogOriginal.id, dialogOriginal.version, dialogCurrent.version );
                } )
                .then( dialogsResultDb => {
                    expect( dialogsResultDb ).to.be.an( 'object' );
                    expect( dialogsResultDb.originalVersion ).to.be.equal( dialogOriginal.version );
                    expect( dialogsResultDb.currentVersion ).to.be.equal( dialogCurrent.version );
                    expect( dialogsResultDb.result ).to.equal( DIFFER_CONSTANTS.CHANGED_DIFFER_RESULT );
                    expect( dialogsResultDb.differ ).to.be.an( 'array' );
                    expect( dialogsResultDb.differ ).to.have.lengthOf( 2 );

                    expect( dialogsResultDb.differ[0] ).to.be.an( 'object' );
                    expect( dialogsResultDb.differ[0].index ).to.equal( 0 );
                    expect( dialogsResultDb.differ[0].base64 ).to.be.an( 'string' );
                    expect( dialogsResultDb.differ[0].result ).to.equal( DIFFER_CONSTANTS.CHANGED_DIFFER_RESULT );

                    expect( dialogsResultDb.differ[1] ).to.be.an( 'object' );
                    expect( dialogsResultDb.differ[1].index ).to.equal( 1 );
                    expect( dialogsResultDb.differ[1].base64 ).to.be.an( 'string' );
                    expect( dialogsResultDb.differ[1].result ).to.equal( DIFFER_CONSTANTS.CHANGED_DIFFER_RESULT );
                } );
        } ).timeout( 4000 );

        it( 'should use differ dialogs from database', () => {
            /**
             * @type {DialogDiffer.Dialog}
             */
            const dialogOriginal = {
                version: '1',
                id: '1',
                url: createDialogURL( 'dialog-one.html' )
            };
            /**
             * @type {DialogDiffer.Dialog}
             */
            const dialogCurrent = {
                version: '2',
                id: '1',
                url: createDialogURL( 'dialog-two.html' )
            };

            /** @type {DialogDiffer.Options} */
            const options = {
                sizes: [{ width: 460, height: 350 }, { width: 320, height: 150 }]
            };

            return Promise
                .all( [
                    snapHandler.snapDialog( options, dialogOriginal ),
                    snapHandler.snapDialog( options, dialogCurrent )]
                )
                .then( ( [dialogOriginal, dialogNew] ) => {
                    return differHandler.differDialog( options, dialogOriginal, dialogNew );
                } )
                .then( dialogResult => {
                    expect( dialogResult ).to.be.an( 'object' );
                    expect( dialogResult.result ).to.equal( DIFFER_CONSTANTS.CHANGED_DIFFER_RESULT );

                    expect( logger.getCollections( { code: LOGGER_CONSTANTS.DIALOG_DIFF_FROM_IMAGE_DIFF_LOGGER } ) ).to.have.lengthOf( 1 );
                    expect( logger.getCollections( { code: LOGGER_CONSTANTS.DIALOG_DIFF_FROM_DATABASE_LOGGER } ) ).to.have.lengthOf( 0 );

                    return databaseHandler.getDialogsResult( options, dialogOriginal.id, dialogOriginal.version, dialogCurrent.version );
                } )
                .then( dialogsResultDb => {
                    expect( dialogsResultDb ).to.be.an( 'object' );

                    return Promise
                        .all( [
                            snapHandler.snapDialog( options, dialogOriginal ),
                            snapHandler.snapDialog( options, dialogCurrent )
                        ] );
                } )
                .then( ( [dialogOriginal, dialogNew] ) => {
                    return differHandler.differDialog( options, dialogOriginal, dialogNew );
                } )
                .then( dialogResult => {
                    expect( dialogResult ).to.be.an( 'object' );
                    expect( dialogResult.result ).to.equal( DIFFER_CONSTANTS.CHANGED_DIFFER_RESULT );

                    expect( logger.getCollections( { code: LOGGER_CONSTANTS.DIALOG_DIFF_FROM_IMAGE_DIFF_LOGGER } ) ).to.have.lengthOf( 1 );
                    expect( logger.getCollections( { code: LOGGER_CONSTANTS.DIALOG_DIFF_FROM_DATABASE_LOGGER } ) ).to.have.lengthOf( 1 );
                } );
        } ).timeout( 4000 );

        it( 'should not diff dialogs with error', () => {
            /**
             * @type {DialogDiffer.Dialog}
             */
            const dialogOriginal = {
                version: '1',
                id: '1',
                url: createDialogURL( 'dialog-one.html' ),
                waitForSelector: 'will-timeout'
            };
            /**
             * @type {DialogDiffer.Dialog}
             */
            const dialogCurrent = {
                version: '2',
                id: '1',
                url: createDialogURL( 'dialog-two.html' )
            };

            /** @type {DialogDiffer.Options} */
            const options = {
                sizes: [{ width: 460, height: 350 }]
            };

            return Promise
                .all( [
                    snapHandler.snapDialog( options, dialogOriginal ),
                    snapHandler.snapDialog( options, dialogCurrent )]
                )
                .then( ( [dialogOriginal, dialogNew] ) => {
                    return differHandler.differDialog( options, dialogOriginal, dialogNew );
                } )
                .then( dialogResult => {
                    expect( dialogResult ).to.be.an( 'object' );
                    expect( dialogResult.result ).to.equal( DIFFER_CONSTANTS.ERROR_DIFFER_RESULT );
                } );
        } ).timeout( 10000 );
    } );

    describe( 'SuiteResult', () => {
        it( 'should init, finished and get suite result', () => {
            /** @type {DialogDiffer.Suite} */
            const suite = {
                options: {
                    originalVersion: '1.0.1',
                    currentVersion: '1.0.2',
                },
                original: [],
                current: [],
            };

            return differHandler
                .initSuiteResult( suite )
                .then( suite => {
                    return databaseHandler.getSuiteResult( suite.id );
                } )
                .then( suiteResultDb => {
                    expect( suiteResultDb ).to.be.an( 'object' );
                    expect( suiteResultDb.id ).to.be.an( 'string' );
                    expect( suiteResultDb.status ).to.equal( SUITE_CONSTANTS.RUNNING_STATUS );
                    expect( suiteResultDb.timestamp ).to.be.a( 'number' );
                    expect( suiteResultDb.errorCode ).to.eq( null );

                    const suiteResult = SuiteHelper.prepareSuiteResults( suite, suiteResultDb );
                    return differHandler.finishSuiteResult( suiteResult );
                } )
                .then( suiteResult => {
                    expect( suiteResult ).to.be.an( 'object' );
                    expect( suiteResult.id ).to.be.an( 'string' );
                    expect( suiteResult.status ).to.equal( SUITE_CONSTANTS.FINISHED_STATUS );
                    expect( suiteResult.timestamp ).to.be.a( 'number' );
                    expect( suiteResult.stats ).to.be.an( 'object' );
                    expect( suiteResult.stats.identical ).to.equal( 0 );
                    expect( suiteResult.stats.changed ).to.equal( 0 );
                    expect( suiteResult.stats.added ).to.equal( 0 );
                    expect( suiteResult.stats.deleted ).to.equal( 0 );
                    expect( suiteResult.stats.duration ).to.be.greaterThan( 0 );
                } );
        } );
    } );

    describe( 'differSuite', () => {
        it( 'should differ suite', () => {
            /** @type {DialogDiffer.Dialog} */
            const dialogOneOriginal = {
                id: 'one',
                version: '1',
                url: createDialogURL( 'dialog-hash.html?original' ),
                hash: 'One'
            };
            /** @type {DialogDiffer.Dialog} */
            const dialogTwoOriginal = {
                id: 'two',
                version: '1',
                url: createDialogURL( 'dialog-hash.html?original' ),
                hash: 'Two'
            };

            /** @type {DialogDiffer.Dialog} */
            const dialogOneCurrent = {
                id: 'one',
                version: '2',
                url: createDialogURL( 'dialog-hash.html?current' ),
                hash: 'One'
            };
            /** @type {DialogDiffer.Dialog} */
            const dialogTwoCurrent = {
                id: 'two',
                version: '2',
                url: createDialogURL( 'dialog-hash.html?current' ),
                hash: 'Two'
            };

            /** @type {DialogDiffer.Suite} */
            const suite = {
                options: {
                    sizes: [{ width: 460, height: 350 }, { width: 320, height: 150 }]
                },
                original: [dialogOneOriginal, dialogTwoOriginal],
                current: [dialogOneCurrent, dialogTwoCurrent],
                originalVersion: '1',
                currentVersion: '2'
            };

            return snapHandler.snapSuite( suite )
                .then( () => differHandler.differSuite( suite ) )
                .then( suiteResult => {
                    // console.log( JSON.stringify( suiteResult, null, 2 ) );
                    expect( suiteResult ).to.be.an( 'object' );
                    expect( suite.options ).to.deep.equal( suiteResult.options );
                    expect( suiteResult.results ).to.be.an( 'array' );
                    expect( suiteResult.results ).to.have.length( 2 );

                    expect( suiteResult.results[0] ).to.deep.equal( suiteResult.results[0] );
                    expect( suiteResult.results[1] ).to.deep.equal( suiteResult.results[1] );

                    expect( suiteResult.results[0].dialogId ).to.equal( dialogOneOriginal.id );
                    expect( suiteResult.results[0].original ).to.deep.equal( dialogOneOriginal );
                    expect( suiteResult.results[0].current ).to.deep.equal( dialogOneCurrent );
                    expect( suiteResult.results[0].originalVersion ).to.equal( dialogOneOriginal.version );
                    expect( suiteResult.results[0].currentVersion ).to.equal( dialogOneCurrent.version );
                    expect( suiteResult.results[0].result ).to.equal( DIFFER_CONSTANTS.CHANGED_DIFFER_RESULT );
                    expect( suiteResult.results[0].differ ).to.have.length( 2 );

                    expect( suiteResult.results[0].differ[0].index ).to.equal( 0 );
                    expect( suiteResult.results[0].differ[0].result ).to.equal( DIFFER_CONSTANTS.CHANGED_DIFFER_RESULT );
                    expect( suiteResult.results[0].differ[0].base64 ).to.be.a( 'string' );

                    expect( suiteResult.results[0].differ[1].index ).to.equal( 1 );
                    expect( suiteResult.results[0].differ[1].result ).to.equal( DIFFER_CONSTANTS.CHANGED_DIFFER_RESULT );
                    expect( suiteResult.results[0].differ[1].base64 ).to.be.a( 'string' );

                    expect( suiteResult.results[1].dialogId ).to.equal( dialogTwoOriginal.id );
                    expect( suiteResult.results[1].original ).to.deep.equal( dialogTwoOriginal );
                    expect( suiteResult.results[1].current ).to.deep.equal( dialogTwoCurrent );
                    expect( suiteResult.results[1].originalVersion ).to.equal( dialogTwoOriginal.version );
                    expect( suiteResult.results[1].currentVersion ).to.equal( dialogTwoCurrent.version );
                    expect( suiteResult.results[1].result ).to.equal( DIFFER_CONSTANTS.CHANGED_DIFFER_RESULT );
                    expect( suiteResult.results[1].differ ).to.have.length( 2 );

                    expect( suiteResult.results[1].differ[0].index ).to.equal( 0 );
                    expect( suiteResult.results[1].differ[0].result ).to.equal( DIFFER_CONSTANTS.CHANGED_DIFFER_RESULT );
                    expect( suiteResult.results[1].differ[0].base64 ).to.be.a( 'string' );

                    expect( suiteResult.results[1].differ[1].index ).to.equal( 1 );
                    expect( suiteResult.results[1].differ[1].result ).to.equal( DIFFER_CONSTANTS.CHANGED_DIFFER_RESULT );
                    expect( suiteResult.results[1].differ[1].base64 ).to.be.a( 'string' );
                } );
        } )
    } );
} );