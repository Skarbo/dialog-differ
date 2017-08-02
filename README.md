# Dialog differ

__WORK IN PROGRESS__

A collaboration with [Starak](https://github.com/starak).

## Required

- Node 6+
- PhantomJS 2+

## Use

`npm install dialog-differ`

```
const dialogDiffer = require( 'dialog-differ' );

const suite = { // see 'Suite' structure
    options: {
        sizes: [{ width: 460, height: 350 }, { width: 320, height: 150 }],
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

dialogDiffer.diff( suite ) // see 'Suite' structure
    .then( suiteResult => {} ) // see 'SuiteResult' structure
    .catch( error => {} );
```

## Structure

### Input

#### Suite

| Property | Type | Description |
| --- | --- | --- |
| options | [`Suite.Options`](#suite-options) | Suite options |
| original | [`Array<Suite.Dialog>`](#suite-dialog) | Original dialogs |
| current | [`Array<Suite.Dialog>`](#suite-dialog) | Current dialogs |

#### Suite Options

| Property | Type | Description | Example |
| --- | --- | --- | --- |
| sizes | `Array<{ width: Number, height: Number }>` | Sizes | `[ { width: 460, height: 350 } ]`  | 
| originalVersion | `String` | Original version | `1.0.1` |
| currentVersion | `String` | Current version | `1.0.2`|
| \[isForceSnap] | `Boolean` | Force snap | `false`| 
| \[isForceDiff] | `Boolean` | Force diff | `false`| 
| \[database] | `String` | Path to database | `~/database.json`| 

#### Suite Dialog

| Property | Type | Description | Example |
| --- | --- | --- | --- |
| version | `String` | Dialog version | `1.0.1` |
| id | `String` | Dialog id | `first` |
| url | `String` | Dialog URL | `http://example.com/1.0.1/dialog-first.html` |
| \[hash] | `String` | URL hash | `#hash` |
| \[waitForSelector] | `String` | Wait for selector | `body.active` |
| \[timeout] | `Number` | Timeout before taking snap (ms) | `250` |

### Result

#### Suite Result

| Property | Type | Description | Example |
| --- | --- | --- | --- |
| options | [`Suite.Options`](#suite-options) | Suite options |
| results | [`Object{id: Suite.DialogsResult}`](#suite-dialogs-result) | Dialog results | `{ 'first': { ... } }` |

#### Suite Dialogs Result

| Property | Type | Description | Example |
| --- | --- | --- | --- |
| dialogId | `String` | Dialog id | `first` |
| original | [`Suite.DialogResult`](#suite-dialog-result) | Original dialog | `{ id: 'first', version: '1.0.1', url: ..., screenshots: [ ... ] }` |
| current | [`Suite.DialogResult`](#suite-dialog-result) | Current dialog | `{ id: 'first', version: '1.0.2', url: ..., screenshots: [ ... ] }` |
| originalVersion | `String` | Original version | `1.0.1` |
| currentVersion | `String` | Current version | `1.0.2` |
| result | [`DifferConstant`](#differ-constants) | Diff result | `identical` |
| differ | [`Object<id: Suite.DialogResultDiff>`](#suite-dialog-result-diff) | Dialogs diffs | `[ { index, result, base64 } ]` |

#### Suite Dialog Result

Extends [Suite Dialog](#suite-dialog)

| Property | Type | Description | Example |
| --- | --- | --- | --- |
| screenshots | `Array<base64: String, width: String, height: String>` | Dialog screenshots | `[ { base64: 'data:image/png;base64,...', width: 460, height: 350 } ]` |

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
| message | `String` | Error message |
| code | [`ErrorConstants`](#error-constants) | Error code | `unexpected-error` |
| args | `Object` | Error arguments | `{ dialogId: 'one' }` |

### Constants

#### Error Constants

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

## Tests

- `npm install`
- `npm test`

## Todo

- Publish module
- Logger level
- Example