const chai = require( 'chai' );

const expect = chai.expect;

const db = require( '../../main/js/database' );
const DialogHelper = require( '../../main/js/helpers/dialog-helper' );

/**
 * @param {Array<Database.DialogScreenshot>} dialogScreenshotsDb
 * @param {Suite.Dialog} dialog
 * @param {Array<Suite.DialogScreenshot>} dialogScreenshots
 */
function assertDialogScreenshot( dialogScreenshotsDb, dialog, dialogScreenshots ) {
    expect( dialogScreenshotsDb ).to.have.lengthOf( dialogScreenshots.length );

    dialogScreenshotsDb.forEach( ( dialogScreenshotDb, i ) => {
        expect( dialogScreenshotDb ).to.be.an( 'object' );
        // expect( dialogScreenshotDb.id ).to.equal( DialogHelper.createUniqueDialogScreenshotId( dialog, dialogScreenshots[i] ) );
        expect( dialogScreenshotDb.dialogId ).to.equal( dialog.id );
        expect( dialogScreenshotDb.dialogVersion ).to.equal( dialog.version );
        expect( dialogScreenshotDb.width ).to.equal( dialogScreenshots[i].width );
        expect( dialogScreenshotDb.height ).to.equal( dialogScreenshots[i].height );
        expect( dialogScreenshotDb.base64 ).to.equal( dialogScreenshots[i].base64 );
    } );
}

describe( 'database', () => {
    beforeEach( () => {
        return db
            .clearDB()
            .then( db.initDB );
    } );

    it( 'should save and get dialog screenshot', () => {
        /** @type {Suite.Dialog} */
        const dialog = {
            id: 'id',
            version: 'version',
            screenshots: [{
                base64: 'base64',
                height: 1,
                width: 1,
            }]
        };

        return db
            .saveDialogScreenshot( dialog, dialog.screenshots[0] )
            .then( dialogScreenshotDb => {
                assertDialogScreenshot( [dialogScreenshotDb], dialog, dialog.screenshots );

                return db.getDialogScreenshot( dialog, { width: dialog.screenshots[0].width, height: dialog.screenshots[0].height } );
            } )
            .then( dialogScreenshotDb => {
                assertDialogScreenshot( [dialogScreenshotDb], dialog, dialog.screenshots );
            } )
    } );

    it( 'should get dialog screenshots', () => {
        /** @type {Suite.Dialog} */
        const dialog = {
            id: 'id',
            version: 'version',
            screenshots: [{
                base64: 'base64',
                height: 1,
                width: 1,
            }, {
                base64: 'base64',
                height: 2,
                width: 2,
            }]
        };

        return Promise
            .all( [
                db.saveDialogScreenshot( dialog, dialog.screenshots[0] ),
                db.saveDialogScreenshot( dialog, dialog.screenshots[1] ),
            ] )
            .then( () => db.getDialogScreenshots( dialog ) )
            .then( dialogScreenshotsDb => {
                assertDialogScreenshot( dialogScreenshotsDb, dialog, dialog.screenshots );
            } )
    } );

    it( 'should get dialogs screenshots', () => {
        /** @type {Suite.Dialog} */
        const dialogOne = {
            id: 'id',
            version: '1',
            screenshots: [{
                base64: 'base64',
                height: 1,
                width: 1,
            }, {
                base64: 'base64',
                height: 2,
                width: 2,
            }]
        };

        /** @type {Suite.Dialog} */
        const dialogTwo = {
            id: 'id',
            version: '2',
            screenshots: [{
                base64: 'base64',
                height: 1,
                width: 1,
            }, {
                base64: 'base64',
                height: 2,
                width: 2,
            }]
        };

        const dialogs = [dialogOne, dialogTwo];

        return Promise
            .all( [
                db.saveDialogScreenshot( dialogOne, dialogOne.screenshots[0] ),
                db.saveDialogScreenshot( dialogOne, dialogOne.screenshots[1] ),
                db.saveDialogScreenshot( dialogTwo, dialogOne.screenshots[0] ),
                db.saveDialogScreenshot( dialogTwo, dialogOne.screenshots[1] ),
            ] )
            .then( () => db.getDialogsScreenshots( dialogs ) )
            .then( dialogsScreenshotsDb => {
                expect( dialogsScreenshotsDb ).to.be.lengthOf( 2 );

                dialogsScreenshotsDb.forEach( ( dialogScreenshotsDb, i ) => {
                    assertDialogScreenshot( dialogScreenshotsDb, dialogs[i], dialogOne.screenshots );
                } );
            } )
    } );
} );