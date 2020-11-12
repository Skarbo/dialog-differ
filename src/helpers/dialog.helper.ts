import * as SuiteHelper from './suite.helper'
import {
  DialogDifferDatabaseDialogScreenshot,
  DialogDifferDialog,
  DialogDifferDialogScreenshot,
  DialogDifferOptions, DialogDifferSize, DialogDifferSnappedCollectedDialog, DialogDifferSnappedCollection
} from '../interfaces'

export function createDialogScreenshot (width: number, height: number, base64: string): DialogDifferDialogScreenshot {
  return {
    width: width,
    height: height,
    base64: base64
  }
}

export function createUniqueDialogId (dialog: DialogDifferDialog): string {
  return `${dialog.version}/${dialog.id}`
}

export function createUniqueDialogScreenshotId (dialog: DialogDifferDialog, dialogScreenshot: DialogDifferDatabaseDialogScreenshot | DialogDifferDialogScreenshot): string {
  return `${dialog.version}/${dialog.id}/${dialogScreenshot.width}/${dialogScreenshot.height}`
}

export function createUniqueDialogResultId (options: DialogDifferOptions, dialogOriginal: DialogDifferDialog, dialogCurrent: DialogDifferDialog): string {
  return [
    createUniqueDialogId(dialogOriginal),
    createUniqueDialogId(dialogCurrent),
    SuiteHelper.createUniqueOptionsId(options)
  ].join('-')
}

/**
 * @param sizes
 * @param dialog
 * @param dialogScreenshotsDb Sorted by width
 */
export function isDialogSnapped (sizes: DialogDifferSize[], dialog: DialogDifferDialog, dialogScreenshotsDb: DialogDifferDatabaseDialogScreenshot[]): boolean {
  if (!dialogScreenshotsDb) {
    return false
  }

  if (dialogScreenshotsDb.length === 0) {
    return false
  }

  sizes = Array.from(sizes).sort(size => size.width)
  const sortedDialogScreenshotsDb = Array.from(dialogScreenshotsDb).sort(dialogScreenshotDb => dialogScreenshotDb.width)

  if (sizes.length === sortedDialogScreenshotsDb.length) {
    for (let i = 0; i < sortedDialogScreenshotsDb.length; i++) {
      if (sizes[i].width !== sortedDialogScreenshotsDb[i].width || sizes[i].height !== sortedDialogScreenshotsDb[i].height) {
        return false
      }
    }

    return true
  }
  return false
}

export function collectSnappedDialogs (options: DialogDifferOptions, dialogs: DialogDifferDialog[], dialogsScreenshotsDb: DialogDifferDatabaseDialogScreenshot[][]): { snappedCollection: DialogDifferSnappedCollection, nonSnappedCollection: DialogDifferSnappedCollection } {
  type TmpCollection = {
    dialogs: DialogDifferSnappedCollectedDialog[]
    dialogsWithHash: Record<string, DialogDifferSnappedCollectedDialog[]>
  }

  const snappedCollection: TmpCollection = {
    dialogs: [],
    dialogsWithHash: {},
  }
  const nonSnappedCollection: TmpCollection = {
    dialogs: [],
    dialogsWithHash: {},
  }

  dialogs.forEach((dialog, i) => {
    // snapped
    if (!options.isForceSnap && isDialogSnapped(getDialogSizes(options.sizes, dialog), dialog, dialogsScreenshotsDb[i])) {
      if (dialog.hash) {
        if (!snappedCollection.dialogsWithHash[dialog.url]) {
          snappedCollection.dialogsWithHash[dialog.url] = []
        }

        snappedCollection.dialogsWithHash[dialog.url].push({dialog, screenshots: dialogsScreenshotsDb[i]})
      }
      else {
        snappedCollection.dialogs.push({dialog, screenshots: dialogsScreenshotsDb[i]})
      }
    }
    // non snapped
    else {
      if (dialog.hash) {
        if (!nonSnappedCollection.dialogsWithHash[dialog.url]) {
          nonSnappedCollection.dialogsWithHash[dialog.url] = []
        }

        nonSnappedCollection.dialogsWithHash[dialog.url].push({dialog})
      }
      else {
        nonSnappedCollection.dialogs.push({dialog})
      }
    }
  })

  return {
    snappedCollection: {
      dialogs: snappedCollection.dialogs,
      dialogsWithHash: Object.keys(snappedCollection.dialogsWithHash).map(url => snappedCollection.dialogsWithHash[url]),
    },
    nonSnappedCollection: {
      dialogs: nonSnappedCollection.dialogs,
      dialogsWithHash: Object.keys(nonSnappedCollection.dialogsWithHash).map(url => nonSnappedCollection.dialogsWithHash[url]),
    },
  }
}

export function getDialogSizes (sizes: DialogDifferSize[], dialog: DialogDifferDialog): DialogDifferSize[] {
  return dialog && dialog.options && dialog.options.sizes || sizes
}
