const path = require( 'path' );
const chai = require( 'chai' );

const expect = chai.expect;

const snapDialog = require( '../../main/js/snap' ).snapDialog;
const snapSuiteDialogs = require( '../../main/js/snap' ).snapSuiteDialogs;
const differDialog = require( '../../main/js/differ' ).differDialog;
const dialogScreenshotDiffer = require( '../../main/js/differ' ).differDialogScreenshot;
const differSuite = require( '../../main/js/differ' ).differSuite;

const RESOURCES_FOLDER = path.resolve( __dirname, '../resources' );
const CONSTANTS = require( '../../main/js/constants' );

function createDialogURL( dialog ) {
    return `file://${path.resolve( RESOURCES_FOLDER, dialog )}`;
}

describe( 'differ', () => {
    describe( 'differDialogScreenshot', () => {
        it( 'should have same screenshots', () => {
            return dialogScreenshotDiffer(
                {
                    path: path.resolve( RESOURCES_FOLDER, 'dialog-one.png' )
                },
                {
                    path: path.resolve( RESOURCES_FOLDER, 'dialog-one.png' )
                }
            ).then( result => {
                console.log( result );
                expect( result ).to.be.an( 'object' );
                expect( result.isIdentical ).to.equal( true );
                expect( result.base64 ).to.equal( null )
            } );
        } );

        it( 'should differ screenshots', () => {
            return dialogScreenshotDiffer(
                {
                    path: path.resolve( RESOURCES_FOLDER, 'dialog-one.png' )
                },
                {
                    path: path.resolve( RESOURCES_FOLDER, 'dialog-two.png' )
                }
            ).then( result => {
                console.log( result );
                expect( result ).to.be.an( 'object' );
                expect( result.isIdentical ).to.equal( false );
                expect( result.base64 ).to.be.an( 'string' );
            } );
        } );
    } );

    describe( 'differDialog', () => {
        it( 'should differ dialogs', () => {
            /**
             * @type {Dialog}
             */
            const dialogOriginal = {
                url: createDialogURL( 'dialog-one.html' )
            };
            /**
             * @type {Dialog}
             */
            const dialogNew = {
                url: createDialogURL( 'dialog-two.html' )
            };

            /** @type {Suite.Options} */
            const options = {
                sizes: [{ width: 460, height: 350 }, { width: 320, height: 150 }]
            };

            return Promise
                .all( [snapDialog( options, dialogOriginal ), snapDialog( options, dialogNew )] )
                .then( ( [dialogOriginal, dialogNew] ) => {
                    console.log( dialogOriginal, dialogNew );
                    return differDialog( dialogOriginal, dialogNew );
                } )
                .then( dialogResult => {
                    console.log( dialogResult );
                    expect( dialogResult ).to.be.an( 'object' );
                    expect( dialogResult.original ).to.be.an( 'object' );
                    expect( dialogResult.current ).to.be.an( 'object' );
                    expect( dialogResult.status ).to.equal( CONSTANTS.DIFFER_STATUS_CHANGED );
                    expect( dialogResult.differ ).to.be.an( 'array' );
                    expect( dialogResult.differ ).to.have.lengthOf( 2 );

                    expect( dialogResult.differ[0] ).to.be.an( 'object' );
                    expect( dialogResult.differ[0].index ).to.equal( 0 );
                    expect( dialogResult.differ[0].base64 ).to.be.an( 'string' );
                    expect( dialogResult.differ[0].status ).to.equal( CONSTANTS.DIFFER_STATUS_CHANGED );

                    expect( dialogResult.differ[1] ).to.be.an( 'object' );
                    expect( dialogResult.differ[1].index ).to.equal( 1 );
                    expect( dialogResult.differ[1].base64 ).to.be.an( 'string' );
                    expect( dialogResult.differ[1].status ).to.equal( CONSTANTS.DIFFER_STATUS_CHANGED );
                } );
        } )
    } );

    describe( 'differSuite', () => {
        it( 'should differ suite', () => {
            /** @type {Dialog} */
            const dialogOneOriginal = {
                id: 'one',
                url: createDialogURL( 'dialog-hash.html?original' ),
                hash: 'One'
            };
            /** @type {Dialog} */
            const dialogTwoOriginal = {
                id: 'two',
                url: createDialogURL( 'dialog-hash.html?original' ),
                hash: 'Two'
            };

            /** @type {Dialog} */
            const dialogOneCurrent = {
                id: 'one',
                url: createDialogURL( 'dialog-hash.html?current' ),
                hash: 'One'
            };
            /** @type {Dialog} */
            const dialogTwoCurrent = {
                id: 'two',
                url: createDialogURL( 'dialog-hash.html?current' ),
                hash: 'Two'
            };

            /** @type {Suite} */
            const suite = {
                options: {
                    sizes: [{ width: 460, height: 350 }, { width: 320, height: 150 }]
                },
                original: [dialogOneOriginal, dialogTwoOriginal],
                current: [dialogOneCurrent, dialogTwoCurrent]
            };

            return Promise
                .all( [
                    snapSuiteDialogs( suite.options, suite.original ),
                    snapSuiteDialogs( suite.options, suite.current ),
                ] )
                .then( () => differSuite( suite ) )
                .then( suite => {
                    console.log( JSON.stringify( suite, null, 2 ) );
                } );
        } )
    } );
} );