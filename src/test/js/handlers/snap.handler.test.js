const path = require( 'path' );
const chai = require( 'chai' );
const puppeteer = require( 'puppeteer' );

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

async function getImageSize( base64 ) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto( base64 );
    const size = await page.$eval( 'img', img => ( { width: img.naturalWidth, height: img.naturalHeight } ) );

    await page.close();
    await browser.close();
    return size;
}

describe( 'snap handler', () => {
    const databaseHandler = new DatabaseHandler();
    const snapHandler = new SnapHandler( databaseHandler );

    beforeEach( () => {
        config.browserTimeout = 1000;
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

        it( 'should snap dialog with custom size', () => {
            /** @type {DialogDiffer.Dialog} */
            const dialog = {
                url: createDialogURL( 'dialog.html' ),
                options: {
                    sizes: [{ width: 460, height: 350 }, { width: 320, height: 150 }]
                }
            };

            /** @type {DialogDiffer.Options} */
            const options = {
                sizes: [{ width: 100, height: 200 }, { width: 300, height: 400 }]
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

                    expect( logger.getCollections( { code: LOGGER_CONSTANTS.SCREENSHOT_FROM_BROWSER_LOGGER } ) ).to.have.lengthOf( 1 );
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
                    //console.log( JSON.stringify( dialog, null, 2 ) );

                    expect( dialog ).to.be.an( 'object' );

                    expect( dialog.error ).to.be.an( 'object' );
                    expect( dialog.error.code ).to.equal( ERROR_CONSTANTS.SNAP_DIALOG_FROM_BROWSER_ERROR );
                    expect( dialog.error.message ).to.be.an( 'string' );
                } );
        } ).timeout( 4000 );
    } );

    describe( 'snapSuiteDialogs', () => {
        it( 'should snap suite with hash dialogs', function () {
            this.timeout( 4000 );

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

            /** @type {DialogDiffer.Options} */
            const options = {
                sizes: [{ width: 460, height: 350 }, { width: 320, height: 150 }]
            };

            return snapHandler
                .snapSuiteDialogs( options, [firstDialog, secondDialog] )
                .then( dialogs => {
                    console.log( JSON.stringify( dialogs, null, 2 ) );

                    expect( dialogs ).to.be.an( 'array' );
                    expect( dialogs ).to.have.lengthOf( 2 );
                    expect( dialogs[0].screenshots[0].base64, 'large screenshot should not equal small screenshot' ).to.not.equal( dialogs[0].screenshots[1].base64 );
                    expect( dialogs[0].screenshots[0].base64, 'first dialog screenshot should not equal second dialog screenshot' ).to.not.equal( dialogs[1].screenshots[0].base64 );
                } );
        } );

        it( 'should snap suite with mixed dialogs', function () {
            this.timeout( 4000 );

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

            return snapHandler
                .snapSuiteDialogs( options, [firstDialog, secondDialog, secondThird] )
                .then( dialogs => {
                    console.log( JSON.stringify( dialogs, null, 2 ) );

                    expect( dialogs ).to.be.an( 'array' );
                    expect( dialogs ).to.have.lengthOf( 3 );
                } );
        } );

        it( 'should snap suite from already snapped dialogs', function () {
            this.timeout( 10000 );

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

                    expect( logger.getCollections( { code: LOGGER_CONSTANTS.SCREENSHOT_FROM_BROWSER_LOGGER } ) ).to.have.lengthOf( 6 );
                    expect( logger.getCollections( { code: LOGGER_CONSTANTS.SCREENSHOT_FROM_DATABASE_LOGGER } ) ).to.have.lengthOf( 0 );

                    logger.clear();

                    return snapHandler.snapSuiteDialogs( options, [firstDialog, secondDialog, thirdDialog, forthDialog] );
                } )
                .then( dialogs => {
                    expect( dialogs ).to.be.an( 'array' );
                    expect( dialogs ).to.have.lengthOf( 4 );

                    expect( logger.getCollections( { code: LOGGER_CONSTANTS.SCREENSHOT_FROM_BROWSER_LOGGER } ) ).to.have.lengthOf( 2 );
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
                    expect( dialogs[0].error.code ).to.equal( ERROR_CONSTANTS.SNAP_DIALOGS_WITH_HASH_FROM_BROWSER_ERROR );
                    expect( dialogs[0].error.message ).to.be.an( 'string' );
                } );
        } ).timeout( 4000 );

        it( 'should snap dialog with crop', async function () {
            this.timeout( 4000 );

            /** @type {DialogDiffer.Dialog} */
            const dialog = {
                version: '1',
                id: '1',
                url: createDialogURL( 'dialog-crop.html' ),
                crop: '#crop',
            };

            /** @type {DialogDiffer.Options} */
            const options = {
                sizes: [{ width: 460, height: 350 }]
            };

            const dialogs = await snapHandler.snapSuiteDialogs( options, [dialog] );

            expect( dialogs ).to.be.an( 'array' );
            expect( dialogs ).to.have.lengthOf( 1 );

            expect( dialogs[0].screenshots ).to.be.an( 'array' );
            expect( dialogs[0].screenshots ).to.have.lengthOf( 1 );
            expect( dialogs[0].screenshots[0].base64 ).not.to.equal( undefined );

            const size = await getImageSize( dialogs[0].screenshots[0].base64 );
            expect( size.width ).to.equal( 400 );
            expect( size.height ).to.equal( 400 );
        } );

        it( 'should snap dialog with resize', async function () {
            this.timeout( 4000 );

            /** @type {DialogDiffer.Dialog} */
            const dialog = {
                version: '1',
                id: '1',
                url: createDialogURL( 'dialog-resize.html' ),
                resize: function () {
                    /*eslint-disable */
                    var resizeElement = document.querySelector( '#resize' );

                    return {
                        height: resizeElement.clientHeight,
                        width: resizeElement.clientWidth,
                    }
                    /*eslint-enable */
                }
            };

            /** @type {DialogDiffer.Options} */
            const options = {
                sizes: [{ width: 460, height: 350 }]
            };

            const dialogs = await snapHandler.snapSuiteDialogs( options, [dialog] );

            expect( dialogs ).to.be.an( 'array' );
            expect( dialogs ).to.have.lengthOf( 1 );

            expect( dialogs[0].screenshots ).to.be.an( 'array' );
            expect( dialogs[0].screenshots ).to.have.lengthOf( 1 );
            expect( dialogs[0].screenshots[0].base64 ).not.to.equal( undefined );

            const size = await getImageSize( dialogs[0].screenshots[0].base64 );
            expect( size.width, 'width' ).to.equal( 800 );
            expect( size.height, 'height' ).to.equal( 800 );
        } );
    } );

    describe( 'getSuiteResult', () => {
        it( 'should get suite result', function () {
            this.timeout( 4000 );

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