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

const suite = {}; // Suite structure

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

| Property | Value | Example | Description |
| --- | --- |
| sizes | `Array<{ width: Number, height: Number }>` | `[ { width: 350, height: 250 } ]` | Sizes |
| originalVersion | `String` | `1.0.1` |  Original version |
| currentVersion | `String` | `1.0.2`| Current version |
| \[isForceSnap\] | `Boolean` | `false`| Force snap |
| \[isForceDiff\] | `Boolean` | `false`| Force diff |
| \[database\] | `String` | `~/database.json`| Path to database |

## Tests

- `npm install`
- `npm test`

## Todo

- Logger level
- Example