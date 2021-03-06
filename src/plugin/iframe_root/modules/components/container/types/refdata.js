define([
    'knockout',
    'kb_knockout/registry',
    'kb_knockout/lib/generators',
    'kb_lib/html'
], function (
    ko,
    reg,
    gen,
    html
) {
    'use strict';

    class ViewModel {
        constructor({source, sourceID, owner, lastModifiedAt, workspaceId, objectId}) {
            this.source = source;
            this.sourceID = sourceID;
            this.owner = owner;
            this.lastModifiedAt = lastModifiedAt;
            this.workspaceId = workspaceId;
            this.objectId = objectId;
        }
    }

    const t = html.tag,
        span = t('span'),
        div = t('div');

    const style = html.makeStyles({
        table: {
            css: {

            },
            inner: {
                td: {
                    padding: '4px'
                },
                th: {
                    fontWeight: 'bold',
                    color: 'rgba(200,200,200,1)',
                    textAlign: 'left',
                    padding: '4px'
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
        title: {
            css: {
                fontWeight: 'bold',
                color: 'rgba(100,100,100,1)',
                textAlign: 'center'
            }
        },
        component: {
            css: {
                // flex: '1 1 0px',
                // display: 'flex',
                // flexDirection: 'column'
            }
        },
        row: {
            css: {
                display: 'flex',
                flexDirection: 'row'
            }
        },
        cell: {
            css: {
                flex: '1 1 0px',
                overflowX: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis'
            }
        },
        cellContent: {
            css: {
                overflowX: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis'
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

    function buildInfo() {
        return div({
            class: style.classes.component
        }, [
            div({
                class: style.classes.title
            }, 'In Reference Data Workspace'),
            div({
                class: style.classes.row
            }, [
                span({
                    class: style.classes.label
                }, 'source'),
                div({
                    class: style.classes.cell
                }, div({
                    class: style.classes.cellContent
                }, span({
                    dataBind: {
                        text: 'source',
                    }
                })))
            ]),
            div({
                class: style.classes.row
            }, [
                span({
                    class: style.classes.label
                }, 'source id'),
                div({
                    class: style.classes.cell
                }, div({
                    class: style.classes.cellContent
                }, span({
                    dataBind: {
                        text: 'sourceID',
                    }
                })))
            ]),
            // div(a({
            //     target: '_blank',
            //     dataBind: {
            //         text: 'owner',
            //         attr: {
            //             href: '"#people/" + owner'
            //         }
            //     }
            // })),
            div({
                class: style.classes.row
            }, [
                span({
                    class: style.classes.label
                }, 'last modified'),
                div({
                    class: style.classes.cell
                }, div({
                    class: style.classes.cellContent
                }, span({
                    dataBind: {
                        typedText: {
                            value: 'lastModifiedAt',
                            type: '"date"',
                            format: '"MMM D, YYYY"'
                        }
                    }
                })))
            ])
        ]);
    }

    function template() {
        return buildInfo();
    }

    function component() {
        return {
            viewModel: ViewModel,
            template: template(),
            stylesheet: style.sheet
        };
    }

    return reg.registerComponent(component);
});