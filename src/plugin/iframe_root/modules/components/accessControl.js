define([
    'knockout',
    'kb_knockout/registry',
    'kb_lib/html'
], function (
    ko,
    reg,
    html
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        span = t('span'),
        input = t('input'),
        label = t('label');

    var styles = html.makeStyles({
        component: {
            flex: '1 1 0px',
            display: 'flex',
            flexDirection: 'column'
        },
        searchArea: {
            flex: '0 0 50px',
            // border: '1px red solid'
        },
        filterArea: {
            flex: '0 0 50px',
            textAlign: 'left'
            // border: '1px blue dashed'
        },
        resultArea: {
            flex: '1 1 0px',
            // border: '1px green dotted',
            display: 'flex',
            flexDirection: 'column'
        },
        activeFilterInput: {
            // fontFamily: 'monospace',
            backgroundColor: 'rgba(209, 226, 255, 1)',
            color: '#000'
        },
        modifiedFilterInput: {
            // fontFamily: 'monospace',
            backgroundColor: 'rgba(255, 245, 158, 1)',
            color: '#000'
        },
        checkboxControl: {
            borderColor: 'transparent',
            boxShadow: 'none',
            margin: '0 2px'
        },
        checkboxLabel: {
            fontWeight: 'normal',
            marginRight: '4px',
            marginLeft: '6px'
        },
        fieldGroupLabel: {
            fontWeight: 'bold',
            color: 'gray',
            marginTop: '8px',
            marginRight: '4px'
            // fontSize: '80%'
        }
    });

    class ViewModel {
        constructor({withPrivateData, withPublicData}) {
            this.withPrivateData = withPrivateData;
            this.withPublicData = withPublicData;
        }
    }

    function buildOwnershipFilter() {
        return div({
            class: 'form-inline',
        }, [
            span({
                class: styles.classes.fieldGroupLabel
            }, 'Access:'),
            span({
                class: ['form-control', styles.classes.checkboxControl],
                title: 'Indicate whether to show private data - your data or shared directly with you',
                dataBind: {
                    css: 'withPrivateData() ? "' + styles.classes.activeFilterInput + '" : null'
                }
            }, label({
                class: styles.classes.checkboxLabel
            }, [
                input({
                    type: 'checkbox',
                    dataBind: {
                        checked: 'withPrivateData',
                        enable: 'withPublicData'
                    }
                }),
                ' Private'
            ])),
            span({
                class: ['form-control', styles.classes.checkboxControl],
                title: 'Indicate whether to show public data - data which has been made viewable to all KBase users',
                dataBind: {
                    css: 'withPublicData() ? "' + styles.classes.activeFilterInput + '" : null'
                }
            }, label({
                class: styles.classes.checkboxLabel
            }, [
                input({
                    type: 'checkbox',
                    dataBind: {
                        checked: 'withPublicData',
                        enable: 'withPrivateData'
                    }
                }),
                ' Public'
            ]))
        ]);
    }


    function template() {
        return div({
            style: {
                // flex: '1 1 0px',
                display: 'flex',
                flexDirection: 'row'
            }
        }, [
            div({
                style: {
                    flex: '1',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center'
                }
            }, buildOwnershipFilter())
        ]);
    }

    function component() {
        return {
            viewModel: ViewModel,
            template: template(),
            stylesheet: styles.sheet
        };
    }

    return reg.registerComponent(component);
});