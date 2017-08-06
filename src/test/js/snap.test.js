const path = require( 'path' );
const chai = require( 'chai' );

const expect = chai.expect;

const LOGGER_CONSTANTS = require( '../../main/js/constants/logger-constants' );

const snap = require( '../../main/js/snap' );
const logger = require( '../../main/js/logger' );
const db = require( '../../main/js/database' );

const RESOURCES_FOLDER = path.resolve( __dirname, '../resources' );

function createDialogURL( dialog ) {
    return `file://${path.resolve( RESOURCES_FOLDER, dialog )}`;
}

describe( 'snap', () => {
    beforeEach( () => {
        logger.clear();
        return db
            .clearDB()
            .then( db.initDB );
    } );

    describe( 'snapDialog', () => {
        it( 'should snap dialog', () => {
            /** @type {Suite.Dialog} */
            const dialog = {
                url: createDialogURL( 'dialog.html' )
            };

            /** @type {Suite.Options} */
            const options = {
                sizes: [{ width: 460, height: 350 }, { width: 320, height: 150 }]
            };

            return snap.snapDialog( options, dialog )
                .then( dialog => {
                    expect( dialog.screenshots ).to.be.an( 'array' );
                    expect( dialog.screenshots ).to.have.lengthOf( 2 );

                    expect( dialog.screenshots[0].base64 ).to.be.an( 'string' );
                    expect( dialog.screenshots[0].width ).to.equal( 460 );
                    expect( dialog.screenshots[0].height ).to.equal( 350 );

                    expect( dialog.screenshots[1].base64 ).to.be.an( 'string' );
                    expect( dialog.screenshots[1].width ).to.equal( 320 );
                    expect( dialog.screenshots[1].height ).to.equal( 150 );

                    // console.log( JSON.stringify( dialog, null, 2 ) );
                } );
        } );

        it( 'should use dialog screenshot from database', () => {
            /** @type {Suite.Dialog} */
            const dialog = {
                id: 'id',
                version: 'version',
                url: createDialogURL( 'dialog.html' )
            };

            /** @type {Suite.Options} */
            const options = {
                sizes: [{ width: 460, height: 350 }]
            };

            return snap.snapDialog( options, dialog )
                .then( dialog => {
                    expect( dialog.screenshots ).to.be.an( 'array' );
                    expect( dialog.screenshots ).to.have.lengthOf( 1 );

                    expect( logger.getCollections( { code: LOGGER_CONSTANTS.SCREENSHOT_FROM_HORSEMAN_LOGGER } ) ).to.have.lengthOf( 1 );
                    expect( logger.getCollections( { code: LOGGER_CONSTANTS.SCREENSHOTS_FROM_DATABASE_LOGGER } ) ).to.have.lengthOf( 0 );

                    return snap.snapDialog( options, dialog );
                } )
                .then( dialog => {
                    expect( dialog.screenshots ).to.be.an( 'array' );
                    expect( dialog.screenshots ).to.have.lengthOf( 2 );

                    expect( logger.getCollections( { code: LOGGER_CONSTANTS.SCREENSHOTS_FROM_DATABASE_LOGGER } ) ).to.have.lengthOf( 1 );
                } );
        } ).timeout( 4000 );
    } );

    describe( 'snapDialogsWithHash', () => {
        it( 'should snap dialogs', () => {
            /** @type {Suite.Dialog} */
            const firstDialog = {
                version: '1',
                id: '1',
                url: createDialogURL( 'dialog-hash.html' ),
                hash: 'First'
            };

            /** @type {Suite.Dialog} */
            const secondDialog = {
                version: '2',
                id: '1',
                url: createDialogURL( 'dialog-hash.html' ),
                hash: 'Second'
            };

            /** @type {Suite.Options} */
            const options = {
                sizes: [{ width: 460, height: 350 }, { width: 320, height: 150 }]
            };

            return snap
                .snapDialogsWithHash( options, [firstDialog, secondDialog] )
                .then( dialogs => {
                    expect( dialogs ).to.be.an( 'array' );
                    expect( dialogs ).to.have.lengthOf( 2 );

                    expect( dialogs[0].screenshots ).to.be.an( 'array' );
                    expect( dialogs[0].screenshots ).to.have.lengthOf( 2 );

                    expect( dialogs[0].screenshots[0].base64 ).to.be.an( 'string' );
                    expect( dialogs[0].screenshots[0].width ).to.equal( 460 );
                    expect( dialogs[0].screenshots[0].height ).to.equal( 350 );

                    expect( dialogs[0].screenshots[1].base64 ).to.be.an( 'string' );
                    expect( dialogs[0].screenshots[1].width ).to.equal( 320 );
                    expect( dialogs[0].screenshots[1].height ).to.equal( 150 );

                    // console.log( JSON.stringify( dialogs, null, 2 ) );
                } );
        } );
    } );

    describe( 'snapSuiteDialogs', () => {
        it( 'should snap suite', () => {
            /** @type {Suite.Dialog} */
            const firstDialog = {
                id: '1',
                version: '1',
                url: createDialogURL( 'dialog-hash.html' ),
                hash: 'First'
            };

            /** @type {Suite.Dialog} */
            const secondDialog = {
                id: '2',
                version: '1',
                url: createDialogURL( 'dialog-hash.html' ),
                hash: 'Second'
            };

            /** @type {Suite.Dialog} */
            const secondThird = {
                id: '3',
                version: '1',
                url: createDialogURL( 'dialog.html' )
            };

            /** @type {Suite.Options} */
            const options = {
                sizes: [{ width: 460, height: 350 }, { width: 320, height: 150 }]
            };

            return snap.snapSuiteDialogs( options, [firstDialog, secondDialog, secondThird] )
                .then( dialogs => {
                    expect( dialogs ).to.be.an( 'array' );
                    expect( dialogs ).to.have.lengthOf( 3 );

                    // console.log( JSON.stringify( dialogs, null, 2 ) );
                } );
        } ).timeout( 4000 );
    } );
} );