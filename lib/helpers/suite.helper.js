'use strict';

var ERROR_CONSTANTS = require('../constants/error-constants');
var SUITE_CONSTANTS = require('../constants/suite-constants');

var ErrorHelper = require('./error.helper');

/**
 * @param {DialogDiffer.Suite} suite
 * @param {DialogDiffer.Database.SuiteResult} [suiteResultDb]
 * @returns {DialogDiffer.SuiteResult}
 */
module.exports.prepareSuiteResults = function (suite) {
    var suiteResultDb = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var suiteResult = {
        id: suiteResultDb && suiteResultDb.id || null,
        status: SUITE_CONSTANTS.RUNNING_STATUS,
        errorCode: null,
        timestamp: suiteResultDb && suiteResultDb.timestamp || Date.now(),
        options: suite.options,
        results: [],
        stats: {
            identical: 0,
            changed: 0,
            added: 0,
            deleted: 0,
            duration: 0,
            error: 0
        }
    };
    var resultsObj = {};

    /**
     * @param {String} dialogId
     * @return {DialogDiffer.DialogsResult}
     */
    var createEmptyResult = function createEmptyResult(dialogId) {
        return {
            dialogId: dialogId,
            current: null,
            original: null,
            originalVersion: null,
            currentVersion: null,
            result: null,
            differ: []
        };
    };

    suite.current.forEach(function (dialog) {
        resultsObj[dialog.id] = createEmptyResult(dialog.id);
        resultsObj[dialog.id].current = dialog;
        resultsObj[dialog.id].originalVersion = dialog.version;
    });

    suite.original.forEach(function (dialog) {
        if (!resultsObj[dialog.id]) {
            resultsObj[dialog.id] = createEmptyResult(dialog.id);
        }

        resultsObj[dialog.id].original = dialog;
        resultsObj[dialog.id].originalVersion = dialog.version;
    });

    // append results obj as array
    suiteResult.results = Object.keys(resultsObj).map(function (dialogId) {
        return resultsObj[dialogId];
    });

    return suiteResult;
};

/**
 * @param {DialogDiffer.Options} options
 * @return {String}
 */
module.exports.createUniqueOptionsId = function (options) {
    var sizes = Array.from(options.sizes).sort(function (size) {
        return size.width;
    });
    return sizes.map(function (size) {
        return size.width + '/' + size.height;
    }).join('/');
};

/**
 * @param {DialogDiffer.Suite} suite
 * @return {Promise<Boolean>}
 */
module.exports.validateSuite = function (suite) {
    /*
     * Validate options
     */
    if (!suite.options) {
        return Promise.reject(ErrorHelper.createError(null, 'Missing options', ERROR_CONSTANTS.SUITE_OPTIONS_ERROR));
    }

    if (!suite.options.sizes || !Array.isArray(suite.options.sizes) || suite.options.sizes.length === 0) {
        return Promise.reject(ErrorHelper.createError(null, 'Size is not given', ERROR_CONSTANTS.SUITE_OPTIONS_ERROR));
    }

    for (var i = 0; i < suite.options.sizes.length; i++) {
        if (!suite.options.sizes[i].width || !suite.options.sizes[i].height) {
            return Promise.reject(ErrorHelper.createError(null, 'Size ' + i + ' is not valid', ERROR_CONSTANTS.SUITE_OPTIONS_ERROR));
        }
    }

    // validate versions
    if (!suite.options.originalVersion || !suite.options.currentVersion) {
        return Promise.reject(ErrorHelper.createError(null, 'Missing original or current version', ERROR_CONSTANTS.SUITE_OPTIONS_ERROR));
    }

    if (suite.options.originalVersion === suite.options.currentVersion) {
        return Promise.reject(ErrorHelper.createError(null, 'Original version is equal to current version', ERROR_CONSTANTS.SUITE_OPTIONS_ERROR));
    }

    /*
     * Validate dialogs
     */
    /**
     * @param {DialogDiffer.Dialog} dialog
     * @param {String} code
     * @param {String} version
     * @param {Number} i
     */
    var validateDialog = function validateDialog(dialog, code, version, i) {
        if (!dialog.version || !dialog.id || !dialog.url) {
            return ErrorHelper.createError(null, 'Dialog ' + i + ' is missing version, id or url', code);
        }
    };

    if (!suite.original || suite.original.length === 0) {
        return Promise.reject(ErrorHelper.createError(null, 'Missing original dialogs', ERROR_CONSTANTS.SUITE_ORIGINAL_DIALOG_ERROR));
    }

    if (!suite.current || suite.current.length === 0) {
        return Promise.reject(ErrorHelper.createError(null, 'Missing current dialogs', ERROR_CONSTANTS.SUITE_CURRENT_DIALOG_ERROR));
    }

    for (var _i = 0; _i < suite.original.length; _i++) {
        var err = validateDialog(suite.original[_i], ERROR_CONSTANTS.SUITE_ORIGINAL_DIALOG_ERROR, suite.options.originalVersion, _i);

        if (err) {
            return Promise.reject(err);
        }
    }

    for (var _i2 = 0; _i2 < suite.current.length; _i2++) {
        var _err = validateDialog(suite.current[_i2], ERROR_CONSTANTS.SUITE_CURRENT_DIALOG_ERROR, suite.options.currentVersion, _i2);

        if (_err) {
            return Promise.reject(_err);
        }
    }

    return Promise.resolve(true);
};