const path = require( 'path' );
const chai = require( 'chai' );

const expect = chai.expect;

const snap = require( '../../main/js/snap' );
const differ = require( '../../main/js/differ' );
const logger = require( '../../main/js/logger' );
const db = require( '../../main/js/database' );

const RESOURCES_FOLDER = path.resolve( __dirname, '../resources' );
const CONSTANTS = require( '../../main/js/constants/differ-constants' );

function createDialogURL( dialog ) {
    return `file://${path.resolve( RESOURCES_FOLDER, dialog )}`;
}

describe( 'differ', () => {
    beforeEach( () => {
        logger.clear();
        return db.initDB();
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
                version: '1',
                url: createDialogURL( 'dialog-one.html' )
            };
            /**
             * @type {Suite.Dialog}
             */
            const dialogNew = {
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
                    snap.snapDialog( options, dialogNew )] )
                .then( ( [dialogOriginal, dialogNew] ) => {
                    return differ.differDialog( options, dialogOriginal, dialogNew );
                } )
                .then( dialogResult => {
                    expect( dialogResult ).to.be.an( 'object' );
                    expect( dialogResult.original ).to.be.an( 'object' );
                    expect( dialogResult.current ).to.be.an( 'object' );
                    expect( dialogResult.status ).to.equal( CONSTANTS.CHANGED_STATUS_DIFFER );
                    expect( dialogResult.differ ).to.be.an( 'array' );
                    expect( dialogResult.differ ).to.have.lengthOf( 2 );

                    expect( dialogResult.differ[0] ).to.be.an( 'object' );
                    expect( dialogResult.differ[0].index ).to.equal( 0 );
                    expect( dialogResult.differ[0].base64 ).to.be.an( 'string' );
                    expect( dialogResult.differ[0].status ).to.equal( CONSTANTS.CHANGED_STATUS_DIFFER );

                    expect( dialogResult.differ[1] ).to.be.an( 'object' );
                    expect( dialogResult.differ[1].index ).to.equal( 1 );
                    expect( dialogResult.differ[1].base64 ).to.be.an( 'string' );
                    expect( dialogResult.differ[1].status ).to.equal( CONSTANTS.CHANGED_STATUS_DIFFER );
                } );
        } ).timeout( 4000 )
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

            /** @type {Suite} */
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
                .then( suite => {
                    expect( suite ).to.be.an( 'object' );
                    // console.log( JSON.stringify( suite, null, 2 ) );
                } );
        } )
    } );
} );