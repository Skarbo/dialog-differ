let asyncawait = true;
try {
    new Function( 'async function test(){await 1}' );
} catch ( error ) {
    asyncawait = false;
}

// If node does not support async await, use the compiled version.
if ( asyncawait ) {
    module.exports = require( './src/main/js/dialog-differ' );
} else {
    module.exports = require( './lib/main/js/dialog-differ' );
}