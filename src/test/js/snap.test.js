const path = require( 'path' );
const chai = require( 'chai' );

const expect = chai.expect;

const snapSuiteDialogs = require( '../../main/js/snap' ).snapSuiteDialogs;
const snapDialog = require( '../../main/js/snap' ).snapDialog;
const snapDialogsWithHash = require( '../../main/js/snap' ).snapDialogsWithHash;

const RESOURCES_FOLDER = path.resolve( __dirname, '../resources' );

function createDialogURL( dialog ) {
    return `file://${path.resolve( RESOURCES_FOLDER, dialog )}`;
}

describe( 'snap', () => {
    describe( 'snapDialog', () => {
        it( 'should snap dialog', () => {
            /** @type {Dialog} */
            const dialog = {
                url: createDialogURL( 'dialog.html' )
            };

            /** @type {Suite.Options} */
            const options = {
                sizes: [{ width: 460, height: 350 }, { width: 320, height: 150 }]
            };

            return snapDialog( options, dialog )
                .then( dialog => {
                    expect( dialog.screenshots ).to.be.an( 'array' );
                    expect( dialog.screenshots ).to.have.lengthOf( 2 );

                    expect( dialog.screenshots[0].base64 ).to.be.an( 'string' );
                    expect( dialog.screenshots[0].width ).to.equal( 460 );
                    expect( dialog.screenshots[0].height ).to.equal( 350 );

                    expect( dialog.screenshots[1].base64 ).to.be.an( 'string' );
                    expect( dialog.screenshots[1].width ).to.equal( 320 );
                    expect( dialog.screenshots[1].height ).to.equal( 150 );

                    console.log( JSON.stringify( dialog, null, 2 ) );
                } );
        } );
    } );

    describe( 'snapDialogsWithHash', () => {
        it( 'should snap dialogs', () => {
            /** @type {Dialog} */
            const firstDialog = {
                url: createDialogURL( 'dialog-hash.html' ),
                hash: 'First'
            };

            /** @type {Dialog} */
            const secondDialog = {
                url: createDialogURL( 'dialog-hash.html' ),
                hash: 'Second'
            };

            /** @type {Suite.Options} */
            const options = {
                sizes: [{ width: 460, height: 350 }, { width: 320, height: 150 }]
            };

            return snapDialogsWithHash( options, [firstDialog, secondDialog] )
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
            /** @type {Dialog} */
            const firstDialog = {
                url: createDialogURL( 'dialog-hash.html' ),
                hash: 'First'
            };

            /** @type {Dialog} */
            const secondDialog = {
                url: createDialogURL( 'dialog-hash.html' ),
                hash: 'Second'
            };

            /** @type {Dialog} */
            const secondThird = {
                url: createDialogURL( 'dialog.html' )
            };

            /** @type {Suite} */
            const options = {
                sizes: [{ width: 460, height: 350 }, { width: 320, height: 150 }]
            };

            return snapSuiteDialogs( options, [firstDialog, secondDialog, secondThird] )
                .then( dialogs => {
                    expect( dialogs ).to.be.an( 'array' );
                    expect( dialogs ).to.have.lengthOf( 3 );

                    console.log( JSON.stringify( dialogs, null, 2 ) );
                } );
        } );
    } );
} );