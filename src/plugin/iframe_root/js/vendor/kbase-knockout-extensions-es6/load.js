define([
    'require',
    'bluebird',
    'knockout'
], function (
    require,
    Promise,
    ko
) {
    'use strict';

    function load() {
        return new Promise((resolve, reject) => {
            require([
                // load 3rd party extensions
                'knockout-mapping',
                'knockout-arraytransforms',
                'knockout-validation',
                'knockout-switch-case',
                'knockout-projections',

                // This one we have tweaked.
                './ko/knockout-es6-collections',

                // load our extensions
                './ko/bindingHandlers',
                './ko/componentLoaders',
                './ko/extenders',
                './ko/subscribables'
            ], () => {
                resolve(ko);
            },
            (err) => {
                reject(err);
            });
        });
    }

    return {
        load, ko
    };
});
