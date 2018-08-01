define([
    'knockout'
], function (
    ko
) {
    'use strict';

    class Model {
        constructor({runtime}) {
            this.runtime = runtime;

            this.searchAPI = this.runtime.service('rpc').makeClient({
                runtime: runtime,
                module: 'KBaseSearchEngine',
                timeout: 10000,
                authenticated: false
            });
        }

        searchSummary() {

        }

        search({query, start, count, withPrivateData, withPublicData, withUserData, withReferenceData, types, sorting}) {
            // var query = arg.query;
            // var start = arg.page * arg.pageSize;
            // var count = arg.pageSize;
            // var withPrivate = arg.withPrivateData ?  1 : 0;
            // var withPublic = arg.withPublicData ? 1 : 0;

            const sortingRules = sorting.map(({propertyKey, direction, isObject}) => {
                return {
                    property: propertyKey,
                    ascending: direction === 'ascending' ? 1 : 0,
                    is_object_property: isObject ? 1 : 0
                };
            });

            var param = {
                match_filter: {
                    full_text_in_all: query,
                    exclude_subobjects: 1
                },
                pagination: {
                    start: start,
                    count: count
                },
                post_processing: {
                    ids_only: 0,
                    skip_info: 0,
                    skip_keys: 0,
                    skip_data: 0,
                    include_highlight: 1,
                    add_narrative_info: 1
                },
                access_filter: {
                    with_private: withPrivateData ? 1 : 0,
                    with_public: withPublicData ? 1 : 0
                },
                sorting_rules: sortingRules
                // sorting_rules: [{
                //     is_object_property: 0,
                //     property: 'timestamp',
                //     ascending: 0
                // }, {
                //     is_object_property: 0,
                //     property: 'type',
                //     ascending: 1
                // }]
            };

            if (withReferenceData) {
                if (withUserData) {
                    // nothing to do, put no source tags restrictions at all
                } else {
                    // only refdata.
                    param.match_filter.source_tags = ['refdata'];
                    param.match_filter.source_tags_blacklist = 0;
                }
            } else {
                if (withUserData) {
                    // only narrativedata
                    param.match_filter.source_tags = ['refdata'];
                    param.match_filter.source_tags_blacklist = 1;
                } else {
                    // should never occur
                    throw new Error('Must select one or both of "refdata" or/and "narrativedata"');
                }

            }

            if (types) {
                param.object_types = types;
            }

            return this.searchAPI.callFunc('search_objects', [param])
                .spread(function (result) {
                    return result;
                });
        }
    }

    const columns = [
        {
            name: 'type',
            label: 'Type',
            type: 'string',
            sort: {
                propertyKey: 'type',
                isObject: false,
                direction: ko.observable('ascending'),
                active: ko.observable(false)
            },
            // width is more like a weight... for all current columns the
            // widths are summed, and each column's actual width attribute
            // is set as the percent of total.
            width: 1
        },
        {
            name: 'date',
            label: 'Date',
            type: 'date',
            format: 'MM/DD/YYYY',
            sort: {
                propertyKey: 'timestamp',
                isObject: false,
                direction: ko.observable('descending'),
                active: ko.observable(true)
            },
            width: 1
        },
        {
            name: 'owner',
            label: 'Owner',
            type: 'string',
            // sort: {
            //     keyName: 'owner',
            //     isObject: false,
            //     direction: ko.observable('ascending'),
            //     active: ko.observable(false)
            // },
            width: 1,
            // action: {
            //     name: 'doAddPi'
            // }
        }, {
            name: 'source',
            label: 'Source',
            type: 'string',
            // sort: {
            //     keyName: 'source',
            //     direction: ko.observable('ascending'),
            //     active: ko.observable(false)
            // },
            width: 1,
            // action: {
            //     name: 'doAddPi'
            // }
        },
        {
            name: 'description',
            label: 'Description',
            type: 'string',
            sort: null,
            // width is more like a weight... for all current columns the
            // widths are summed, and each column's actual width attribute
            // is set as the percent of total.
            width: 4
        },
        // {
        //     name: 'inspect',
        //     label: 'Inspect',
        //     type: 'action',
        //     width: 5,
        //     component: InspectControl.name(),
        //     rowStyle: {
        //         textAlign: 'center'
        //     },
        //     headerStyle: {
        //         textAlign: 'center'
        //     }
        // },
        // {
        //     name: 'copy',
        //     label: 'Copy',
        //     width: 6,
        //     component: StageControl.name(),
        //     rowStyle: {
        //         textAlign: 'center'
        //     },
        //     headerStyle: {
        //         textAlign: 'center'
        //     }
        // }
    ];

    const columnsMap = columns.reduce(function (acc, col) {
        acc[col.name] = col;
        return acc;
    }, {});

    return {Model, columns, columnsMap};
});