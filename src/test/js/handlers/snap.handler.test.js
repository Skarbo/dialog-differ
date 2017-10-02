const path = require( 'path' );
const chai = require( 'chai' );

const expect = chai.expect;

const LOGGER_CONSTANTS = require( '../../../main/js/constants/logger-constants' );
const ERROR_CONSTANTS = require( '../../../main/js/constants/error-constants' );

const config = require( '../../../../config.json' );

const SnapHandler = require( '../../../main/js/handlers/snap.handler' );
const logger = require( '../../../main/js/logger' );
const DatabaseHandler = require( '../../../main/js/handlers/database.handler' );

const RESOURCES_FOLDER = path.resolve( __dirname, '../../resources' );

function createDialogURL( dialog ) {
    return `file://${path.resolve( RESOURCES_FOLDER, dialog )}`;
}

describe( 'snap handler', () => {
    const databaseHandler = new DatabaseHandler();
    const snapHandler = new SnapHandler( databaseHandler );

    beforeEach( () => {
        config.horsemanTimeout = 1000;
        logger.clear();

        return databaseHandler
            .clearDB()
            .then( () => databaseHandler.initDB() );
    } );

    describe( 'snapDialog', () => {
        it( 'should snap dialog', () => {
            /** @type {DialogDiffer.Dialog} */
            const dialog = {
                url: createDialogURL( 'dialog.html' )
            };

            /** @type {DialogDiffer.Options} */
            const options = {
                sizes: [{ width: 460, height: 350 }, { width: 320, height: 150 }]
            };

            return snapHandler.snapDialog( options, dialog )
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
            /** @type {DialogDiffer.Dialog} */
            const dialog = {
                id: 'id',
                version: 'version',
                url: createDialogURL( 'dialog.html' )
            };

            /** @type {DialogDiffer.Options} */
            const options = {
                sizes: [{ width: 460, height: 350 }]
            };

            return snapHandler.snapDialog( options, dialog )
                .then( dialog => {
                    expect( dialog.screenshots ).to.be.an( 'array' );
                    expect( dialog.screenshots ).to.have.lengthOf( 1 );

                    expect( logger.getCollections( { code: LOGGER_CONSTANTS.SCREENSHOT_FROM_HORSEMAN_LOGGER } ) ).to.have.lengthOf( 1 );
                    expect( logger.getCollections( { code: LOGGER_CONSTANTS.SCREENSHOTS_FROM_DATABASE_LOGGER } ) ).to.have.lengthOf( 0 );

                    return snapHandler.snapDialog( options, dialog );
                } )
                .then( dialog => {
                    expect( dialog.screenshots ).to.be.an( 'array' );
                    expect( dialog.screenshots ).to.have.lengthOf( 2 );

                    expect( logger.getCollections( { code: LOGGER_CONSTANTS.SCREENSHOTS_FROM_DATABASE_LOGGER } ) ).to.have.lengthOf( 1 );
                } );
        } ).timeout( 4000 );

        it( 'should not snap error dialog', () => {
            /** @type {DialogDiffer.Dialog} */
            const dialog = {
                id: 'id',
                version: 'version',
                url: createDialogURL( 'dialog.html' ),
                waitForSelector: 'will-timeout',
            };

            /** @type {DialogDiffer.Options} */
            const options = {
                sizes: [{ width: 460, height: 350 }]
            };

            return snapHandler.snapDialog( options, dialog )
                .then( dialog => {
                    console.log( JSON.stringify( dialog, null, 2 ) );

                    expect( dialog ).to.be.an( 'object' );

                    expect( dialog.error ).to.be.an( 'object' );
                    expect( dialog.error.code ).to.equal( ERROR_CONSTANTS.SNAP_DIALOG_FROM_HORSEMAN_ERROR );
                    expect( dialog.error.message ).to.be.an( 'string' );
                } );
        } ).timeout( 4000 );
    } );

    describe( 'snapSuiteDialogs', () => {
        it( 'should snap suite', () => {
            /** @type {DialogDiffer.Dialog} */
            const firstDialog = {
                id: '1',
                version: '1',
                url: createDialogURL( 'dialog-hash.html' ),
                hash: 'First'
            };

            /** @type {DialogDiffer.Dialog} */
            const secondDialog = {
                id: '2',
                version: '1',
                url: createDialogURL( 'dialog-hash.html' ),
                hash: 'Second'
            };

            /** @type {DialogDiffer.Dialog} */
            const secondThird = {
                id: '3',
                version: '1',
                url: createDialogURL( 'dialog.html' )
            };

            /** @type {DialogDiffer.Options} */
            const options = {
                sizes: [{ width: 460, height: 350 }, { width: 320, height: 150 }]
            };

            return snapHandler.snapSuiteDialogs( options, [firstDialog, secondDialog, secondThird] )
                .then( dialogs => {
                    // console.log( JSON.stringify( dialogs, null, 2 ) );

                    expect( dialogs ).to.be.an( 'array' );
                    expect( dialogs ).to.have.lengthOf( 3 );
                } );
        } );

        it( 'should snap suite from already snapped dialogs', function () {
            this.timeout( 4000 );

            /** @type {DialogDiffer.Dialog} */
            const firstDialog = {
                id: '1',
                version: '1',
                url: createDialogURL( 'dialog-hash.html' ),
                hash: 'First',
            };

            /** @type {DialogDiffer.Dialog} */
            const secondDialog = {
                id: '2',
                version: '1',
                url: createDialogURL( 'dialog-hash.html' ),
                hash: 'Second',
            };

            /** @type {DialogDiffer.Dialog} */
            const thirdDialog = {
                id: '3',
                version: '1',
                url: createDialogURL( 'dialog-hash.html' ),
                hash: 'Three',
            };

            /** @type {DialogDiffer.Dialog} */
            const forthDialog = {
                id: '4',
                version: '1',
                url: createDialogURL( 'dialog-hash.html' ),
                hash: 'Four',
            };

            /** @type {DialogDiffer.Options} */
            const options = {
                sizes: [{ width: 460, height: 350 }, { width: 320, height: 150 }]
            };

            return snapHandler
                .snapSuiteDialogs( options, [firstDialog, secondDialog, thirdDialog] )
                .then( dialogs => {
                    // console.log( JSON.stringify( dialogs, null, 2 ) );
                    expect( dialogs ).to.be.an( 'array' );
                    expect( dialogs ).to.have.lengthOf( 3 );

                    expect( logger.getCollections( { code: LOGGER_CONSTANTS.SCREENSHOT_FROM_HORSEMAN_LOGGER } ) ).to.have.lengthOf( 6 );
                    expect( logger.getCollections( { code: LOGGER_CONSTANTS.SCREENSHOT_FROM_DATABASE_LOGGER } ) ).to.have.lengthOf( 0 );

                    logger.clear();

                    return snapHandler.snapSuiteDialogs( options, [firstDialog, secondDialog, thirdDialog, forthDialog] );
                } )
                .then( dialogs => {
                    expect( dialogs ).to.be.an( 'array' );
                    expect( dialogs ).to.have.lengthOf( 4 );

                    expect( logger.getCollections( { code: LOGGER_CONSTANTS.SCREENSHOT_FROM_HORSEMAN_LOGGER } ) ).to.have.lengthOf( 2 );
                    expect( logger.getCollections( { code: LOGGER_CONSTANTS.SCREENSHOTS_FROM_DATABASE_LOGGER } ) ).to.have.lengthOf( 3 );
                } );
        } );

        it( 'should not snap error dialogs', () => {
            /** @type {DialogDiffer.Dialog} */
            const firstDialog = {
                version: '1',
                id: '1',
                url: createDialogURL( 'dialog-hash.html' ),
                hash: 'First',
                waitForSelector: 'will-timeout',
            };

            /** @type {DialogDiffer.Options} */
            const options = {
                sizes: [{ width: 460, height: 350 }]
            };

            return snapHandler
                .snapSuiteDialogs( options, [firstDialog] )
                .then( dialogs => {
                    // console.log( JSON.stringify( dialogs, null, 2 ) );

                    expect( dialogs ).to.be.an( 'array' );
                    expect( dialogs ).to.have.lengthOf( 1 );

                    expect( dialogs[0].screenshots ).to.be.an( 'array' );
                    expect( dialogs[0].screenshots ).to.have.lengthOf( 0 );

                    expect( dialogs[0].error ).to.be.an( 'object' );
                    expect( dialogs[0].error.code ).to.equal( ERROR_CONSTANTS.SNAP_DIALOGS_WITH_HASH_FROM_HORSEMAN_ERROR );
                    expect( dialogs[0].error.message ).to.be.an( 'string' );
                } );
        } ).timeout( 4000 );
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

            return snapHandler
                .snapSuite( suite )
                .then( suiteResult => {
                    expect( suiteResult ).to.be.an( 'object' );
                } );
        } );
    } );
} );