# Dialog differ

__WORK IN PROGRESS__

An application for diffing two dialogs against each other.

Uses Google Chrome's [Puppeteer](https://github.com/GoogleChrome/puppeteer) to take screenshots and [ImageDiff](https://github.com/uber-archive/image-diff) to compare screenshots.

A collaboration with [Starak](https://github.com/starak).

## Required

- Node 6+

## Use

`npm install dialog-differ`

```
const DialogDiffer = require( 'dialog-differ' );

const suite = { // see 'Suite' structure
    options: {
        sizes: [
            { width: 460, height: 350 },
            { width: 320, height: 150 }
        ],
        originalVersion: '1.0.1',
        currentVersion: '1.0.2'        
    },
    original: [
        {
            id: 'first',
            version: '1.0.1',
            url: 'http://example.com/1.0.1/dialog-first.html'
        },
        {
            id: 'second',
            version: '1.0.1',
            url: 'http://example.com/1.0.1/dialog-second.html'
        }
    ],
    current: [
        {
            id: 'first',
            version: '1.0.2',
            url: 'http://example.com/1.0.2/dialog-first.html'
        },
        {
            id: 'second',
            version: '1.0.2',
            url: 'http://example.com/1.0.2/dialog-second.html'
        }
    ]
};

// create dialog differ
const dialogDiffer = new DialogDiffer();

// init dialog differ
await dialogDiffer.initDialogDiffer( { databaseArgs: `${__dirname}/database.json` } ); // store database in database.json

// diff suite
const suiteResult = await dialogDiffer.diff( suite ); // see 'SuiteResult' structure
```

## Methods

### constructor

| Property | Type | Description |
| --- | --- | --- |
| \[databaseLayer] | [AbstractDatabaseLayer](src/main/js/layers/abstract-database.layer.js) | Database layer. Default [LowDbDatabaseLayer](src/main/js/layers/lowdb-database.layer.js). |
| \[logLevel] | [`String`](#error-constants) | Log level. Default [error](#error-constants). |

```
const dialogDiffer = new DialogDiffer( {
    databaseLayer = null,
    logLevel = null,
} )
```

### initDialogDiffer

Returns `Promise<void>`

Method to initialize dialog differ. Used to send arguments to database layer.

| Property | Type | Description |
| --- | --- | --- |
| \[databaseArgs] | `any` | Database arguments. See [AbstractDatabaseLayer](src/main/js/layers/abstract-database.layer.js)~initDB. |

```
// store database in database.json when using LowDbDatabaseLayer
await dialogDiffer.initDialogDiffer( { databaseArgs: `${__dirname}/database.json` } );
```

### diff

Returns [`Promise<DialogDiffer.SuiteResult>`](#suite-result)

Diffs original dialogs with current dialogs.

| Property | Type | Description |
| --- | --- | --- |
| suite | [`DialogDiffer.Suite`](#suite) | Suite. See [AbstractDatabaseLayer](src/main/js/layers/abstract-database.layer.js)~initDB. |

```
const suiteResult = await dialogDiffer.diff( suite );
```

### getSuiteResult

Returns [`Promise<DialogDiffer.SuiteResult>`](#suite-result)

Get running or finished [`DialogDiffer.SuiteResult`](#suite-result) from database.

| Property | Type | Description |
| --- | --- | --- |
| suiteId | `String` | Suite id |

```
const suiteResult = await dialogDiffer.getSuiteResult( suiteId );
```

### getLastSuiteResults

Returns [`Promise<Array<DialogDiffer.SuiteResult>>`](#suite-result)

Get list of latest running or finished [`DialogDiffer.SuiteResult`](#suite-result) from database.

```
const suiteResults = await dialogDiffer.getLastSuiteResults();
```

### deleteDialogs

Returns `Promise<Boolean>`

Delete all [`DialogDiffer.DialogScreenshot`](#dialog-screenshot)s for Dialogs matching `dialogId` from database.

| Property | Type | Description |
| --- | --- | --- |
| dialogId | `String` | Dialog id |

```
await dialogDiffer.deleteDialogs( dialogId );
```

### deleteSuiteResult

Returns `Promise<Boolean>`

Delete [`DialogDiffer.SuiteResult`](#suite-result) for `suiteId` from database.

| Property | Type | Description |
| --- | --- | --- |
| suiteId | `String` | Suite id |

```
await dialogDiffer.deleteSuiteResult( suiteId );
```

## Structure

### Input

#### Suite

| Property | Type | Description |
| --- | --- | --- |
| options | [`DialogDiffer.Options`](#suite-options) | Suite options |
| original | [`Array<DialogDiffer.Dialog>`](#suite-dialog) | Original dialogs |
| current | [`Array<DialogDiffer.Dialog>`](#suite-dialog) | Current dialogs |

#### Suite Options

| Property | Type | Description | Example |
| --- | --- | --- | --- |
| sizes | `Array<{ width: Number, height: Number }>` | Sizes | `[ { width: 460, height: 350 } ]`  | 
| originalVersion | `String` | Original version | `1.0.1` |
| currentVersion | `String` | Current version | `1.0.2`|
| \[isForceSnap] | `Boolean` | Force snap | `false`| 
| \[isForceDiff] | `Boolean` | Force diff | `false`|

#### Suite Dialog

| Property | Type | Description | Example |
| --- | --- | --- | --- |
| version | `String` | Dialog version | `1.0.1` |
| id | `String` | Dialog id | `first` |
| url | `String` | Dialog URL | `http://example.com/1.0.1/dialog-first.html` |
| \[hash] | `String` | URL hash | `#hash` |
| \[waitForSelector] | `String` | Wait for selector | `body.active` |
| \[timeout] | `Number` | Timeout before taking snap (ms) | `250` |
| \[crop] | `String` | Selector to use for cropping screenshot | `#container` |
| \[resize] | `Function(defaultWidth, defaultHeight): { width: Number, height: Number }` | Function evaluated by [Puppeteer](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pageevaluatepagefunction-args) which returns the new size to use for screenshot | `function() { var container = document.querySelector('#container'); return { width: container.scrollWidth, height: container.scrollHeight }; }` |

### Result

#### Suite Result

| Property | Type | Description | Example |
| --- | --- | --- | --- |
| options | [`DialogDiffer.Options`](#suite-options) | Suite options |
| results | [`Array<DialogDiffer.DialogsResult>`](#suite-dialogs-result) | Dialog results | `[ DialogDiffer.DialogsResult, ... ]` |

#### Suite Dialogs Result

| Property | Type | Description | Example |
| --- | --- | --- | --- |
| dialogId | `String` | Dialog id | `first` |
| original | [`DialogDiffer.DialogResult`](#suite-dialog-result) | Original dialog | `{ id: 'first', version: '1.0.1', url: ..., screenshots: [ ... ] }` |
| current | [`DialogDiffer.DialogResult`](#suite-dialog-result) | Current dialog | `{ id: 'first', version: '1.0.2', url: ..., screenshots: [ ... ] }` |
| originalVersion | `String` | Original version | `1.0.1` |
| currentVersion | `String` | Current version | `1.0.2` |
| result | [`DifferConstant`](#differ-constants) | Diff result | `changed` |
| differ | [`Array<DialogDiffer.DialogResultDiff>`](#suite-dialog-result-diff) | Dialogs diffs | `[ { index: 0, result: 'changed', base64: 'data:image/png;base64,...' } ]` |

#### Suite Dialog Result

Extends [Suite Dialog](#suite-dialog)

| Property | Type | Description | Example |
| --- | --- | --- | --- |
| screenshots | `Array<base64: String, width: String, height: String>` | Dialog screenshots | `[ { base64: 'data:image/png;base64,...', width: 460, height: 350 } ]` |
| \[error] | `{ code: String, message: String }` | Error when creating screenshot | `{ code: 'snap-dialog-from-browser-error', message: 'Could not snap dialog url \'http://example.com/1.0.1/dialog-first.html\'' }` |

#### Suite Dialog Result Diff

| Property | Type | Description | Example |
| --- | --- | --- | --- |
| index | `Number` | Index | `0` |
| result | [`DifferConstant`](#differ-constants) | Diff result | `identical` |
| base64 | `String` | Diff image | `data:image/png;base64,...` |

#### Suite Error

Extends JS `Error`

| Property | Type | Description | Example |
| --- | --- | --- | --- |
| message | `String` | Error message | Unexpected error |
| code | [`ErrorConstants`](#error-constants) | Error code | `unexpected-error` |
| args | `Object` | Error arguments | `{ dialogId: 'one' }` |

### Constants

#### Error Constants

See [ErrorConstants](src/main/js/constants/error-contants.js)

| Property | Type | Description |
| --- | --- | --- |
| `unexpected-error` | `String` | Unexpected error |

**TODO** More errors

#### Differ Constants

| Property | Type | Description |
| --- | --- | --- |
| `identical` | `String` | Identical dialog/screenshot |
| `changed` | `String` | Changed dialog/screenshot |
| `new` | `String` | New dialog/screenshot |
| `deleted` | `String` | Deleted dialog/screenshot |

#### Logger Constants

| Property | Type | Description |
| --- | --- | --- |
| `none` | `String` | No logging |
| `debug` | `String` | Log, info and error logging |
| `info` | `String` | Info and error logging |
| `error` | `String` | Error logging |

## Tests

- `npm install`
- `npm test`

## Build

- `npm run dist`

## Todo

- Examples