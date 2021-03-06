define([
    'bluebird',
    'knockout',
    'marked',
    'kb_knockout/registry',
    'kb_knockout/lib/generators',
    'kb_lib/html',
    'kb_lib/htmlBuilders'
], function (
    Promise,
    ko,
    marked,
    reg,
    gen,
    html,
    build
) {
    'use strict';


    class ViewModel {
        constructor({object}, context) {
            this.object = object;

            this.runtime = context.$root.runtime;

            this.ready = ko.observable(false);
            this.error = ko.observable();

            // overview fields
            this.title = this.object.workspaceInfo.metadata.narrative_nice_name;
            this.abstract = null;
            this.createdBy = null;
            this.createdAt = null;
            this.lastSavedAt = this.object.objectInfo.saveDate;
            this.lastSavedBy = this.object.objectInfo.saved_by;

            this.cellCounts = {
                markdown:  this.getObjectMetadataInt('jupyter.markdown'),
                code: this.getObjectMetadataInt('jupyter.code'),
                app: this.gatherAppCellCounts()
            };

            // this.appCellCount = 20;
            this.objectCounts = null;

            Promise.all([
                this.getTypeCounts(),
                this.getAbstract()
            ])
                .spread((objectTypeCounts, {abstract, createdBy, createdAt}) => {
                    this.objectCounts = objectTypeCounts;
                    this.abstract = abstract;
                    this.createdBy = createdBy;
                    this.createdAt = createdAt;
                    this.ready(true);
                })
                .catch((err) => {
                    this.error(err.message);
                    console.error('error', err);
                });
        }

        getObjectMetadataInt(name) {
            const value = this.object.objectInfo.metadata[name];
            if (!value) {
                return 0;
            }
            return parseInt(value, 10);
        }

        gatherAppCellCounts() {
            return Object.entries(this.object.objectInfo.metadata).reduce((count, [key, value]) => {
                if (key.startsWith('method.')) {
                    return count + parseInt(value, 10);
                }
                return count;
            }, 0);
        }

        getTypeCounts() {
            const workspace = this.runtime.service('rpc').makeClient({
                module: 'Workspace',
                timeout: 10000,
                authorization: true
            });
            return workspace.callFunc('list_objects', [{
                ids: [this.object.workspaceInfo.id]
            }])
                .spread((result) => {
                    const typeCounts = result.reduce((typeCounts, objectInfo) => {
                        const [,type,,] = objectInfo[2].split(/[.-]/);
                        if (!typeCounts[type]) {
                            typeCounts[type] = 1;
                        } else {
                            typeCounts[type] += 1;
                        }
                        return typeCounts;
                    }, {});
                    const objectTypeCounts = Object.entries(typeCounts)
                        .map(([key, value]) => {
                            return {
                                type: key,
                                count: value
                            };
                        })
                        .sort((a, b) => a.type.localeCompare(b.type));
                    return objectTypeCounts;
                });
        }

        getAbstract() {
            const workspace = this.runtime.service('rpc').makeClient({
                module: 'Workspace',
                timeout: 10000,
                authorization: true
            });
            return workspace.callFunc('get_objects2', [{
                objects: [{
                    ref: this.object.objectInfo.ref,
                }]
            }])
                .spread((result) => {
                    const narrativeObject = result.data[0];
                    const cells = narrativeObject.data.cells;
                    const markdownCells = cells
                        .filter((cell) => {
                            return cell.cell_type === 'markdown';
                        })
                        .map((cell) => {
                            return cell.source;
                        });
                    const welcomeRe = /Welcome to KBase's Narrative Interface!/;
                    const abstract = markdownCells.find((content) => {
                        if (!content) {
                            return false;
                        }
                        if (welcomeRe.test(content)) {
                            return false;
                        }
                        return true;
                    });
                    const createdBy = narrativeObject.creator;
                    const fixedCreated = narrativeObject.created.split('+')[0];
                    const createdAt = new Date(fixedCreated);

                    return {abstract, createdBy, createdAt};
                });
        }
    }

    // VIEW

    const t = html.tag,
        a = t('a'),
        span = t('span'),
        div = t('div'),
        table = t('table'),
        tbody = t('tbody'),
        tr = t('tr'),
        th = t('th'),
        td = t('td');

    const style = html.makeStyles({
        component: {
            css: {
                flex: '1 1 0px',
                display: 'flex',
                flexDirection: 'column',
                marginTop: '10px'
            }
        },
        table: {
            css: {

            },
            inner: {
                td: {
                    padding: '4px',
                    verticalAlign: 'top'
                },
                th: {
                    fontWeight: 'bold',
                    color: 'rgba(200,200,200,1)',
                    textAlign: 'left',
                    padding: '4px',
                    verticalAlign: 'top'
                },
                'td:nth-child(1)': {
                    width: '10em'
                },
                'th:nth-child(1)': {
                    width: '10em'
                }

            }
        },
        sectionHeader: {
            css: {
                fontWeight: 'bold',
                fontSize: '110%',
                color: 'rgba(100,100,100,1)',
                marginTop: '8px'
            }
        },
        column: {
            css: {
                display: 'inline-block',
                width: '50%',
                verticalAlign: 'top'
            }
        },
        column1: {
            css: {
                display: 'inline-block',
                width: '50%',
                verticalAlign: 'top',
                paddingRight: '10px'
            }
        },
        column2: {
            css: {
                display: 'inline-block',
                width: '50%',
                verticalAlign: 'top',
                paddingLeft: '10px'
            }
        },
        columnHeader: {
            css: {
                fontWeight: 'bold',
                color: '#333',
                margin: '10px 0 4px 0'
            }
        },
        narrativeTitle: {
            css: {
                fontWeight: 'bold',
                fontSize: '120%',
            }
        },
        createdBy: {
            css: {
                fontWeight: 'italic'
            }
        },
        narrativeAbstract: {
            css: {
                // maxHeight: '20em',
                // overflowY: 'auto',
                padding: '6px',
                border: '1px rgba(200,200,200, 0.5) solid',
                borderRadius: '4px',
                boxShadow: '4px 4px 4px rgba(100,100,100,1)'
            },
            inner: {
                h2: {
                    fontSize: '100%'
                },
                blockquote: {
                    fontSize: '100%'
                }
            }
        },
        label: {
            css: {
                fontWeight: 'bold',
                color: 'rgba(200,200,200,1)',
                marginRight: '4px'
            }
        }
    });

    function buildStats() {
        return table({
            class: style.classes.table
        }, [
            tbody({
            }, [
                tr([
                    th('created'),
                    td({
                        dataBind: {
                            typedText: {
                                value: 'createdAt',
                                type: '"date"',
                                format: '"MMM D, YYYY @ hh:mm a"'
                            }
                        }
                    })
                ]),
                tr([
                    th('by'),
                    td(a({
                        target: '_blank',
                        dataBind: {
                            text: 'createdBy',
                            attr: {
                                href: '"/#people/" + createdBy',
                            }
                        }
                    }))
                ]),
                gen.if('createdBy !== lastSavedBy || createdAt.getTime() !== lastSavedAt.getTime()',
                    [
                        tr([
                            th('last saved'),
                            td({
                                dataBind: {
                                    typedText: {
                                        value: 'lastSavedAt',
                                        type: '"date"',
                                        format: '"MMM D, YYYY @ hh:mm a"'
                                    }
                                }
                            })
                        ]),
                        tr([
                            th('by'),
                            td(a({
                                target: '_blank',
                                dataBind: {
                                    text: 'lastSavedBy',
                                    attr: {
                                        href: '"/#people/" + lastSavedBy',
                                    }
                                }
                            }))
                        ])
                    ])

            ])
        ]);
    }

    function buildAbstract() {
        return div([
            div({
                class: style.classes.narrativeTitle,
                dataBind: {
                    text: 'title'
                }
            }),
            div([
                span({
                    class: style.classes.label
                }, 'creator'),
                a({
                    class: style.classes.createdBy,
                    target: '_blank',
                    dataBind: {
                        text: 'createdBy',
                        attr: {
                            href: '"/#people/" + createdBy',
                        }
                    }
                })
            ]),
            div({
                class: style.classes.narrativeAbstract
            }, gen.if('abstract',
                div({
                    dataBind: {
                        htmlMarkdown: 'abstract'
                    }
                }),
                div({
                    style: {
                        fontStyle: 'italic'
                    }
                }, 'Sorry, no introductory markdown cell found for this Narrative.')))
        ]);
    }

    function buildCells() {
        return table({
            class: style.classes.table
        }, [
            tr([
                th('Apps'),
                td({
                    style:{
                        textAlign: 'right'
                    },
                    dataBind: {
                        text: 'cellCounts.app'
                    }
                })
            ]),
            tr([
                th('Markdown'),
                td({
                    style:{
                        textAlign: 'right'
                    },
                    dataBind: {
                        text: 'cellCounts.markdown'
                    }
                })
            ]),
            tr([
                th('Code'),
                td({
                    style:{
                        textAlign: 'right'
                    },
                    dataBind: {
                        text: 'cellCounts.code'
                    }
                })
            ])
        ]);
    }

    function buildObjects() {
        return table({
            class: style.classes.table
        }, [
            tbody({
                dataBind: {
                    foreach: 'objectCounts'
                }
            },
            tr([
                th({
                    dataBind: {
                        text: 'type'
                    }
                }),
                td({
                    style:{
                        textAlign: 'right'
                    },
                    dataBind: {
                        text: 'count'
                    }
                })
            ]))
        ]);
    }

    function buildOverview() {
        return div([
            div({
                class: style.classes.column1
            }, [
                div([
                    div({
                        class: style.classes.columnHeader
                    }, 'Narrative'),
                    buildAbstract()
                ]),

                // div([
                //     div({
                //         class: style.classes.columnHeader
                //     }, 'Source'),
                //     'TBD'
                // ])
            ]),
            div({
                class: style.classes.column2
            }, [
                div([
                    div({
                        class: style.classes.columnHeader
                    }, 'Cells'),
                    buildCells()
                ]),
                div([
                    div({
                        class: style.classes.columnHeader
                    }, 'Objects'),
                    buildObjects()
                ]),
                div([
                    div({
                        class: style.classes.columnHeader
                    }, 'Info'),
                    buildStats()
                ])
            ])
        ]);
    }

    function buildError() {
        return div({
            class: 'alert alert-danger',
            dataBind: {
                text: 'error'
            }
        });
    }

    function template() {
        return div({
            class: style.classes.component
        },
        gen.if('ready',
            buildOverview(),
            gen.if('error',
                buildError(),
                build.loading('Loading overview data'))
        ));
    }

    function component() {
        return {
            viewModelWithContext: ViewModel,
            template: template(),
            stylesheet: style.sheet
        };
    }

    return reg.registerComponent(component);
});