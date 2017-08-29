const path = require( 'path' );
const chai = require( 'chai' );

const expect = chai.expect;

const snap = require( '../../main/js/snap' );
const differ = require( '../../main/js/differ' );
const logger = require( '../../main/js/logger' );
const db = require( '../../main/js/database' );

const RESOURCES_FOLDER = path.resolve( __dirname, '../resources' );
const DIFFER_CONSTANTS = require( '../../main/js/constants/differ-constants' );
const LOGGER_CONSTANTS = require( '../../main/js/constants/logger-constants' );

function createDialogURL( dialog ) {
    return `file://${path.resolve( RESOURCES_FOLDER, dialog )}`;
}

describe( 'differ', () => {
    beforeEach( () => {
        logger.clear();
        return db
            .clearDB()
            .then( db.initDB );
    } );

    describe( 'differDialogScreenshot', () => {
        it( 'should have same screenshots', () => {
            return differ.differDialogScreenshot(
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
            return differ.differDialogScreenshot(
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
             * @type {Suite.Dialog}
             */
            const dialogOriginal = {
                id: '1',
                version: '1',
                url: createDialogURL( 'dialog-one.html' )
            };
            /**
             * @type {Suite.Dialog}
             */
            const dialogCurrent = {
                id: '1',
                version: '2',
                url: createDialogURL( 'dialog-two.html' )
            };

            /** @type {Suite.Options} */
            const options = {
                sizes: [{ width: 460, height: 350 }, { width: 320, height: 150 }]
            };

            return Promise
                .all( [
                    snap.snapDialog( options, dialogOriginal ),
                    snap.snapDialog( options, dialogCurrent )] )
                .then( ( [dialogOriginal, dialogNew] ) => {
                    return differ.differDialog( options, dialogOriginal, dialogNew );
                } )
                .then( dialogResult => {
                    expect( dialogResult ).to.be.an( 'object' );
                    expect( dialogResult.original ).to.be.an( 'object' );
                    expect( dialogResult.current ).to.be.an( 'object' );
                    expect( dialogResult.result ).to.equal( DIFFER_CONSTANTS.CHANGED_STATUS_DIFFER );
                    expect( dialogResult.differ ).to.be.an( 'array' );
                    expect( dialogResult.differ ).to.have.lengthOf( 2 );

                    expect( dialogResult.differ[0] ).to.be.an( 'object' );
                    expect( dialogResult.differ[0].index ).to.equal( 0 );
                    expect( dialogResult.differ[0].base64 ).to.be.an( 'string' );
                    expect( dialogResult.differ[0].result ).to.equal( DIFFER_CONSTANTS.CHANGED_STATUS_DIFFER );

                    expect( dialogResult.differ[1] ).to.be.an( 'object' );
                    expect( dialogResult.differ[1].index ).to.equal( 1 );
                    expect( dialogResult.differ[1].base64 ).to.be.an( 'string' );
                    expect( dialogResult.differ[1].result ).to.equal( DIFFER_CONSTANTS.CHANGED_STATUS_DIFFER );

                    return db.getDialogsResult( options, dialogOriginal, dialogCurrent );
                } )
                .then( dialogsResultDb => {
                    expect( dialogsResultDb ).to.be.an( 'object' );
                    expect( dialogsResultDb.originalVersion ).to.be.equal( dialogOriginal.version );
                    expect( dialogsResultDb.currentVersion ).to.be.equal( dialogCurrent.version );
                    expect( dialogsResultDb.result ).to.equal( DIFFER_CONSTANTS.CHANGED_STATUS_DIFFER );
                    expect( dialogsResultDb.differ ).to.be.an( 'array' );
                    expect( dialogsResultDb.differ ).to.have.lengthOf( 2 );

                    expect( dialogsResultDb.differ[0] ).to.be.an( 'object' );
                    expect( dialogsResultDb.differ[0].index ).to.equal( 0 );
                    expect( dialogsResultDb.differ[0].base64 ).to.be.an( 'string' );
                    expect( dialogsResultDb.differ[0].result ).to.equal( DIFFER_CONSTANTS.CHANGED_STATUS_DIFFER );

                    expect( dialogsResultDb.differ[1] ).to.be.an( 'object' );
                    expect( dialogsResultDb.differ[1].index ).to.equal( 1 );
                    expect( dialogsResultDb.differ[1].base64 ).to.be.an( 'string' );
                    expect( dialogsResultDb.differ[1].result ).to.equal( DIFFER_CONSTANTS.CHANGED_STATUS_DIFFER );
                } );
        } ).timeout( 4000 );

        it( 'should use differ dialogs from database', () => {
            /**
             * @type {Suite.Dialog}
             */
            const dialogOriginal = {
                version: '1',
                id: '1',
                url: createDialogURL( 'dialog-one.html' )
            };
            /**
             * @type {Suite.Dialog}
             */
            const dialogCurrent = {
                version: '2',
                id: '1',
                url: createDialogURL( 'dialog-two.html' )
            };

            /** @type {Suite.Options} */
            const options = {
                sizes: [{ width: 460, height: 350 }, { width: 320, height: 150 }]
            };

            return Promise
                .all( [
                    snap.snapDialog( options, dialogOriginal ),
                    snap.snapDialog( options, dialogCurrent )]
                )
                .then( ( [dialogOriginal, dialogNew] ) => {
                    return differ.differDialog( options, dialogOriginal, dialogNew );
                } )
                .then( dialogResult => {
                    expect( dialogResult ).to.be.an( 'object' );
                    expect( dialogResult.result ).to.equal( DIFFER_CONSTANTS.CHANGED_STATUS_DIFFER );

                    expect( logger.getCollections( { code: LOGGER_CONSTANTS.DIALOG_DIFF_FROM_IMAGE_DIFF_LOGGER } ) ).to.have.lengthOf( 1 );
                    expect( logger.getCollections( { code: LOGGER_CONSTANTS.DIALOG_DIFF_FROM_DATABASE_LOGGER } ) ).to.have.lengthOf( 0 );

                    return db.getDialogsResult( options, dialogOriginal, dialogCurrent );
                } )
                .then( dialogsResultDb => {
                    expect( dialogsResultDb ).to.be.an( 'object' );

                    return Promise
                        .all( [
                            snap.snapDialog( options, dialogOriginal ),
                            snap.snapDialog( options, dialogCurrent )
                        ] );
                } )
                .then( ( [dialogOriginal, dialogNew] ) => {
                    return differ.differDialog( options, dialogOriginal, dialogNew );
                } )
                .then( dialogResult => {
                    expect( dialogResult ).to.be.an( 'object' );
                    expect( dialogResult.result ).to.equal( DIFFER_CONSTANTS.CHANGED_STATUS_DIFFER );

                    expect( logger.getCollections( { code: LOGGER_CONSTANTS.DIALOG_DIFF_FROM_IMAGE_DIFF_LOGGER } ) ).to.have.lengthOf( 1 );
                    expect( logger.getCollections( { code: LOGGER_CONSTANTS.DIALOG_DIFF_FROM_DATABASE_LOGGER } ) ).to.have.lengthOf( 1 );
                } );
        } ).timeout( 4000 );
    } );

    describe( 'differSuite', () => {
        it( 'should differ suite', () => {
            /** @type {Suite.Dialog} */
            const dialogOneOriginal = {
                id: 'one',
                version: '1',
                url: createDialogURL( 'dialog-hash.html?original' ),
                hash: 'One'
            };
            /** @type {Suite.Dialog} */
            const dialogTwoOriginal = {
                id: 'two',
                version: '1',
                url: createDialogURL( 'dialog-hash.html?original' ),
                hash: 'Two'
            };

            /** @type {Suite.Dialog} */
            const dialogOneCurrent = {
                id: 'one',
                version: '2',
                url: createDialogURL( 'dialog-hash.html?current' ),
                hash: 'One'
            };
            /** @type {Suite.Dialog} */
            const dialogTwoCurrent = {
                id: 'two',
                version: '2',
                url: createDialogURL( 'dialog-hash.html?current' ),
                hash: 'Two'
            };

            /** @type {Suite.Suite} */
            const suite = {
                options: {
                    sizes: [{ width: 460, height: 350 }, { width: 320, height: 150 }]
                },
                original: [dialogOneOriginal, dialogTwoOriginal],
                current: [dialogOneCurrent, dialogTwoCurrent],
                originalVersion: '1',
                currentVersion: '2'
            };

            return snap.snapSuite( suite )
                .then( () => differ.differSuite( suite ) )
                .then( suiteResult => {
                    // console.log( JSON.stringify( suiteResult, null, 2 ) );
                    expect( suiteResult ).to.be.an( 'object' );
                    expect( suite.options ).to.deep.equal( suiteResult.options );
                    expect( suiteResult.results ).to.be.an( 'object' );
                    expect( Object.keys( suiteResult.results ) ).to.have.length( 2 );

                    expect( suiteResult.results[dialogOneOriginal.id] ).to.deep.equal( suiteResult.results[dialogOneCurrent.id] );
                    expect( suiteResult.results[dialogTwoOriginal.id] ).to.deep.equal( suiteResult.results[dialogTwoCurrent.id] );

                    let dialogId = dialogOneOriginal.id;
                    expect( suiteResult.results[dialogId].dialogId ).to.equal( dialogId );
                    expect( suiteResult.results[dialogId].original ).to.deep.equal( dialogOneOriginal );
                    expect( suiteResult.results[dialogId].current ).to.deep.equal( dialogOneCurrent );
                    expect( suiteResult.results[dialogId].originalVersion ).to.equal( dialogOneOriginal.version );
                    expect( suiteResult.results[dialogId].currentVersion ).to.equal( dialogOneCurrent.version );
                    expect( suiteResult.results[dialogId].result ).to.equal( DIFFER_CONSTANTS.CHANGED_STATUS_DIFFER );
                    expect( suiteResult.results[dialogId].differ ).to.have.length( 2 );

                    expect( suiteResult.results[dialogId].differ[0].index ).to.equal( 0 );
                    expect( suiteResult.results[dialogId].differ[0].result ).to.equal( DIFFER_CONSTANTS.CHANGED_STATUS_DIFFER );
                    expect( suiteResult.results[dialogId].differ[0].base64 ).to.be.a( 'string' );

                    expect( suiteResult.results[dialogId].differ[1].index ).to.equal( 1 );
                    expect( suiteResult.results[dialogId].differ[1].result ).to.equal( DIFFER_CONSTANTS.CHANGED_STATUS_DIFFER );
                    expect( suiteResult.results[dialogId].differ[1].base64 ).to.be.a( 'string' );

                    dialogId = dialogTwoOriginal.id;
                    expect( suiteResult.results[dialogId].dialogId ).to.equal( dialogId );
                    expect( suiteResult.results[dialogId].original ).to.deep.equal( dialogTwoOriginal );
                    expect( suiteResult.results[dialogId].current ).to.deep.equal( dialogTwoCurrent );
                    expect( suiteResult.results[dialogId].originalVersion ).to.equal( dialogTwoOriginal.version );
                    expect( suiteResult.results[dialogId].currentVersion ).to.equal( dialogTwoCurrent.version );
                    expect( suiteResult.results[dialogId].result ).to.equal( DIFFER_CONSTANTS.CHANGED_STATUS_DIFFER );
                    expect( suiteResult.results[dialogId].differ ).to.have.length( 2 );

                    expect( suiteResult.results[dialogId].differ[0].index ).to.equal( 0 );
                    expect( suiteResult.results[dialogId].differ[0].result ).to.equal( DIFFER_CONSTANTS.CHANGED_STATUS_DIFFER );
                    expect( suiteResult.results[dialogId].differ[0].base64 ).to.be.a( 'string' );

                    expect( suiteResult.results[dialogId].differ[1].index ).to.equal( 1 );
                    expect( suiteResult.results[dialogId].differ[1].result ).to.equal( DIFFER_CONSTANTS.CHANGED_STATUS_DIFFER );
                    expect( suiteResult.results[dialogId].differ[1].base64 ).to.be.a( 'string' );
                } );
        } )
    } );
} );