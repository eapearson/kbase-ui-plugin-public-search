define([
    'uuid',
    'knockout',
    'kb_knockout/registry',
    'kb_knockout/lib/generators',
    'kb_knockout/lib/viewModelBase',
    'kb_common/html'
], function (
    Uuid,
    ko,
    reg,
    gen,
    ViewModelBase,
    html
) {
    'use strict';

    const t = html.tag,
        p = t('p'),
        img = t('img'),
        div = t('div'),
        span = t('span'),
        input = t('input');

    class ViewModel extends ViewModelBase {
        constructor(params) {
            super(params);

            const {searchInput, forceSearch, searching} = params;

            this.logo = null;

            // SEARCH INPUTS
            this.searchControlValue = ko.observable().syncFrom(searchInput);

            this.searchInput = searchInput;
            this.searchInputClass = ko.pureComputed(() => {
                if (this.searchControlValue() !== this.searchInput()) {
                    return styles.classes.modifiedFilterInput;
                }

                if (this.searchInput()) {
                    return styles.classes.activeFilterInput;
                }

                return null;
            });

            this.forceSearch = forceSearch;
            this.searching = searching;

            // HISTORY
            this.showHistory = ko.observable();
            this.searchHistory = ko.observableArray();

            // hack to ensure that clicking in side the history control does not close it!
            this.historyContainerId = html.genId();

            // TODO: fold better dom event listening (and removal) into base class.
            this.documentClickListener = (e) => {
                this.clickListener(e);
            };

            this.subscribe(this.searchInput, (newValue) => {
                this.addToHistory(newValue);
            });

            document.addEventListener('click', this.documentClickListener, true);
        }

        addToHistory(term) {
            if (!term) {
                return;
            }
            if (term.trim().length === 0) {
                return;
            }
            this.searchHistory.remove(term);
            this.searchHistory.unshift(term);
            if (this.searchHistory().length > 10) {
                this.searchHistory.pop();
            }
        }

        useFromHistory(data) {
            this.showHistory(false);
            this.searchControlValue(data);
            this.doSearch();
        }

        doToggleHistory() {
            this.showHistory(!this.showHistory());
        }

        doClearInput() {
            this.searchInput('');
        }

        doSearch() {
            // filter out nonsensical searches
            const query = this.searchControlValue();
            const emptyRe = /^\s*$/;
            if (emptyRe.test(query)) {
                return;
            }

            this.forceSearch(new Uuid(4).format());
            this.searchInput(query);
        }

        doKeyUp(data, ev) {
            if (ev.key) {
                if (ev.key === 'Enter') {
                    this.doSearch();
                }
            } else if (ev.keyCode) {
                if (ev.keyCode === 13) {
                    this.doSearch();
                }
            }
        }

        clickListener(ev) {
            // We don't want to handle clicks for the history control itself -- either
            // an item in the list or the button. The handlers for these things will do
            // the right thing.
            const elementType = ev.target.getAttribute('data-type');
            if (['history-toggle-button', 'history-toggle-button-icon', 'history-item'].indexOf(elementType) == -1) {
                this.showHistory(false);
            }
            return true;
        }

        dispose() {
            if (this.clickListener) {
                document.removeEventListener('click', this.clickListener, true);
            }
        }
    }

    const styles = html.makeStyles({
        component: {
            display: 'flex',
            flexDirection: 'row'
        },
        searchArea: {
            css: {
                flex: '2 1 0px'
            }
        },
        buttonArea: {
            css: {
                flex: '1 1 0px',
            }
        },
        activeFilterInput: {
            backgroundColor: 'rgba(209, 226, 255, 1)',
            color: '#000'
        },
        modifiedFilterInput: {
            backgroundColor: 'rgba(255, 245, 158, 1)',
            color: '#000'
        },
        historyContainer: {
            display: 'block',
            position: 'absolute',
            border: '1px silver solid',
            backgroundColor: 'rgba(255,255,255,0.9)',
            zIndex: '3',
            top: '100%',
            left: '0',
            right: '0'
        },
        historyItem: {
            css: {
                padding: '3px',
                cursor: 'pointer'
            },
            pseudo: {
                hover: {
                    backgroundColor: 'silver'
                }
            }
        },
        addonButton: {
            css: {
                color: 'black',
                cursor: 'pointer'
            },
            pseudo: {
                hover: {
                    backgroundColor: 'silver'
                },
                active: {
                    backgroundColor: 'gray',
                    color: 'white'
                }
            }
        },
        addonButtonDisabled: {
            css: {
                color: 'gray',
                cursor: 'normal'
            }
        }
    });

    function buildSearchBar() {
        /*
            Builds the search input area using bootstrap styling and layout.
        */
        return div({
            class: 'form'
        }, div({
            class: 'input-group'
        }, [
            gen.if('logo',
                div({
                    class: 'input-group-addon ',
                    style: {
                        padding: '0',
                        border: 'none',
                        backgroundColor: 'transparent'
                    }
                }, img({
                    dataBind: {
                        attr: {
                            src: 'logo'
                        }
                    },
                    style: {
                        display: 'inline',
                        height: '30px',
                        marginRight: '6px'
                    }
                }))),
            div({
                class: 'form-control',
                style: {
                    display: 'inline-block',
                    width: '100%',
                    position: 'relative',
                    padding: '0',
                    border: 'none'
                }
            }, [
                input({
                    class: 'form-control',
                    dataBind: {
                        textInput: 'searchControlValue',
                        hasFocus: true,
                        css: 'searchInputClass',
                        event: {
                            keyup: 'doKeyUp'
                        }
                    },
                    placeholder: 'Search KBase Data'
                }),
                gen.if('showHistory',
                    div({
                        class: styles.classes.historyContainer,
                        dataBind: {
                            attr: {
                                id: 'historyContainerId'
                            }
                        }
                    }, gen.if('searchHistory().length > 0',
                        gen.foreach('searchHistory',
                            div({
                                dataBind: {
                                    text: '$data',
                                    click: 'function(d,e){$component.useFromHistory.call($component,d,e)}'
                                },
                                class: styles.classes.historyItem,
                                dataType: 'history-item'
                            })),
                        p({
                            style: {
                                fontStyle: 'italic',
                                padding: '8px',
                                margin: '0px'
                            }
                        }, 'no items in history yet - Search!')))),
            ]),
            div({
                class: 'input-group-addon ' + styles.classes.addonButton,
                dataBind: {
                    click: 'doSearch'
                }
            }, span({
                class: 'fa',
                style: {
                    fontSize: '100%',
                },
                dataBind: {
                    css: {
                        'fa-search': '!$component.searching()',
                        'fa-spinner fa-pulse': '$component.searching()'
                    }
                }
            })),
            div({
                class: 'input-group-addon ' + styles.classes.addonButton,
                dataType: 'history-toggle-button',
                dataBind: {
                    click: 'doToggleHistory',
                    style: {
                        'background-color': 'showHistory() ? "silver" : null'
                    }
                }
            }, span({
                dataType: 'history-toggle-button-icon',
                class: 'fa fa-history'
            })),
            div({
                class: 'input-group-addon ' + styles.classes.addonButton,
                dataBind: {
                    click: 'searchControlValue() ? doClearInput : null',
                    css: 'searchControlValue() ? "' + styles.classes.addonButton + '" : "' + styles.classes.addonButtonDisabled + '"'
                }
            }, span({
                class: 'fa fa-times'
            }))
        ]));
    }

    function buildButtonBar() {
        return div({
            class: 'btn-toolbar pull-right'
        }, [

        ]);
    }

    function template() {
        return div({
            class: styles.classes.component
        }, [
            div({
                class: styles.classes.searchArea
            }, buildSearchBar()),
            div({
                class: styles.classes.buttonArea
            }, buildButtonBar())
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