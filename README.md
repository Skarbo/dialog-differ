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

const suite = { // see structure
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

dialogDiffer.diff( suite )
    .then( result )
    .catch( error );
```

## Structure

### Suite

| Property |
| --- |
| options |

### Suite options

| Property | Value | Description | Example |
| --- | --- | --- | --- |
| sizes | `Array<{ width: Number, height: Number }>` | Sizes | `[ { width: 460, height: 350 } ]`  | 
| originalVersion | `String` | Original version | `1.0.1` |
| currentVersion | `String` | Current version | `1.0.2`|
| [isForceSnap] | `Boolean` | Force snap | `false`| 
| [isForceDiff] | `Boolean` | Force diff | `false`| 
| [database] | `String` | Path to database | `~/database.json`| 

## Tests

- `npm install`
- `npm test`

## Todo

- Logger level
- Example