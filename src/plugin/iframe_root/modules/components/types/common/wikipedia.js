define([
    'bluebird',
    'knockout',
    'kb_knockout/registry',
    'kb_knockout/lib/generators',
    'kb_knockout/lib/viewModelBase',
    'kb_lib/html',
    'kb_lib/htmlBuilders',
    'kb_common_ts/HttpClient',
    'kb_lib/props',
    '../builders'
], function (
    Promise,
    ko,
    reg,
    gen,
    ViewModelBase,
    html,
    build,
    HttpClient,
    props,
    builders
) {
    'use strict';

    class NotFound extends Error {
        constructor(message) {
            super(message);

            this.name = 'NotFound';
        }
    }

    class ViewModel extends ViewModelBase {
        constructor(params) {
            super(params);
            const {term} = params;
            this.lookupTerm = this.scrubTerm(term);

            this.imageWidth = '150px';
            this.defaultImageWidth = '150px';
            this.imageSize = ko.observable(500);
            this.imageUrl = ko.observable();
            this.imageCaption = ko.observable();
            this.pageUrl = ko.observable();

            this.error = ko.observable();
            this.ready = ko.observable(false);

            this.findImage();
        }

        scrubTerm(proposedTerm) {
            // convervatively, remove all non-alpha characters
            const chars = proposedTerm.split('');
            const validChar = /[\w \s]/;
            const newChars = chars.filter((char) => {
                if (validChar.exec(char)) {
                    return true;
                }
                return false;
            });
            return newChars.join('');
        }

        findImage() {
            if (!this.lookupTerm) {
                return;
            }
            this.getWikipediaInfo(this.lookupTerm)
                .then(({imageUrl, url, introText}) => {
                    this.imageUrl(imageUrl);
                    this.pageUrl(url);
                    this.introText = introText
                        .replace(/====/g, '####')
                        .replace(/===/g, '###')
                        .replace(/==/g, '##')
                        .replace(/\n/g, '  \n');
                    this.ready(true);
                })
                .catch(NotFound, (err) => {
                    this.error(err);
                })
                .catch((err) => {
                    console.error('Error getting image', err);
                    this.error(err);
                });
        }

        getWikipediaInfo(term) {
            return this.getPage(term)
                .then((wikiResponse) => {
                    this.imageCaption(wikiResponse.parse.title);
                    return Promise.all(
                        [
                            this.getImage({size: this.imageSize(), pageId: wikiResponse.parse.pageid}),
                            this.getPageInfo({pageId: wikiResponse.parse.pageid})
                        ]);
                })
                .spread((imageUrl, pageInfo) => {
                    return {
                        imageUrl: imageUrl,
                        url: pageInfo.url,
                        introText: pageInfo.introText
                    };
                });
        }

        // see: https://www.mediawiki.org/wiki/API:Main_page
        // https://en.wikipedia.org/w/api.php?action=help&modules=parse
        getPage(term) {
            const terms = JSON.parse(JSON.stringify(term.split(/\s+/)));
            return new Promise((resolve, reject) => {
                const fetchPage = (terms) => {
                    if (terms.length === 0) {
                        reject(new NotFound('No Wikipedia page found matching "' + term + '"'));
                        // resolve(null);
                    }
                    const http = new HttpClient.HttpClient();
                    const header = new HttpClient.HttpHeader({
                        'accept': 'application/json'
                    });
                    const pageUrl = new URL('https://en.wikipedia.org/w/api.php');
                    const query = pageUrl.searchParams;
                    query.set('action', 'parse');
                    query.set('format', 'json');
                    query.set('prop', 'text|headhtml');
                    query.set('section', '0');
                    query.set('redirects', '');
                    query.set('page', terms.join(' '));
                    // must set this to enable cors
                    query.set('origin', '*');
                    http.request({
                        method: 'GET',
                        header: header,
                        withCredentials: false,
                        url: pageUrl.toString()
                    })
                        .then((result) => {
                            switch (result.status) {
                            case 200:
                                try {
                                    var wikiResponse = JSON.parse(result.response);
                                    if (wikiResponse.error) {
                                        if (wikiResponse.error.code === 'missingtitle') {
                                            terms.pop();
                                            fetchPage(terms);
                                            return null;
                                        }
                                    } else {
                                        resolve(wikiResponse);
                                    }
                                } catch (ex) {
                                    this.error(ex);
                                    reject(new Error('Error parsing wikipedia response: ' + ex.message));
                                }
                                break;
                            default:
                                var message = 'Unexpected response from wikipedia api: ' + result.status;
                                console.error(message, result);
                                reject(new Error(message));
                            }

                        })
                        .catch((err) => {
                            reject(err);
                        });
                };
                fetchPage(terms);
            });
        }

        getPageInfo({pageId}) {
            const apiURL = new URL('https://en.wikipedia.org/w/api.php');
            const query = apiURL.searchParams;
            query.set('action', 'query');
            query.set('pageids', pageId);
            query.set('prop', 'info|extracts');
            query.set('explaintext', 'true');
            query.set('inprop', 'url');
            query.set('origin', '*');
            query.set('format', 'json');

            const http = new HttpClient.HttpClient();
            return http.request({
                method: 'GET',
                withCredentials: false,
                url: apiURL.toString()
            })
                .then((result) => {
                    switch (result.status) {
                    case 200:
                        try {
                            var wikiResponse = JSON.parse(result.response);
                            return {
                                url: props.getProp(wikiResponse, ['query', 'pages', String(pageId), 'fullurl']),
                                introText: props.getProp(wikiResponse, ['query', 'pages', String(pageId), 'extract'])
                            };
                        } catch (ex) {
                            console.error('error getting page info', ex.message);
                            this.error(ex);
                        }
                    }
                });
        }

        getImage({size, pageId}) {
            const pageUrl = new URL('https://en.wikipedia.org/w/api.php');
            const query = pageUrl.searchParams;
            query.set('action', 'query');
            query.set('format', 'json');
            query.set('prop', 'pageimages');
            query.set('pithumbsize', String(size));
            query.set('pageids', String(pageId));
            query.set('origin', '*');
            const http = new HttpClient.HttpClient();
            const header = new HttpClient.HttpHeader({
                'accept': 'application/json'
            });

            return http.request({
                method: 'GET',
                header: header,
                withCredentials: false,
                url: pageUrl.toString()
            })
                .then((result) => {
                    switch (result.status) {
                    case 200:
                        try {
                            var wikiResponse = JSON.parse(result.response);
                            // if (wikiResponse.error) {
                            // } else {
                            // }
                            return props.getProp(wikiResponse, ['query', 'pages', String(pageId), 'thumbnail', 'source'], null);
                        } catch (ex) {
                            throw new Error('Error parsing wikipedia response: ' + ex.message);
                        }
                    default:
                        var message = 'Unexpected response from wikipedia api: ' + result.status;
                        console.error(message, result);
                        throw new Error(message);
                    }
                })
                .catch((err) => {
                    const message = 'Error getting image from wikipedia: ' + err.message;
                    console.error(message, err);
                    throw new Error('Error getting image from wikipedia: ' + err.message);
                });
        }
    }


    const t = html.tag,
        a = t('a'),
        span = t('span'),
        div = t('div'),
        img = t('img');

    const style = html.makeStyles({
        component: {
            css: {
                flex: '1 1 0px',
                display: 'flex',
                flexDirection: 'column',
                margin: '10px'
            }
        },
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
        wikipediaImage: {
            css: {
                width: '100%'
            }
        },
        imageCaption: {
            css: {
                height: '1em',
                marginTop: '4px'
            }
        },
        square: {
            css: {
                width: '100%',
                height: 'auto',
                position: 'relative'
            },
            pseudo: {
                before: {
                    content: '""',
                    display: 'block',
                    paddingTop: '100%'
                }
            },
            inner: {
                '> .-content': {
                    position: 'absolute',
                    top: '0',
                    right: '0',
                    bottom: '0',
                    left: '0',
                    border: '1px silver dashed',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                },

            }
        }
    });

    function buildSquareWrapper(content) {
        return div({
            class: style.classes.square
        }, div({
            class: '-content'
        }, content));
    }

    function buildImage() {
        return div([
            gen.if('imageUrl',
                img({
                    class: style.classes.wikipediaImage,
                    dataBind: {
                        attr: {
                            src: 'imageUrl'
                        },
                        // style: {
                        //     height: 'height'
                        // }
                    }
                }),
                buildSquareWrapper('Image not found')
            ),
            div({
                class: style.classes.imageCaption
            }, a({
                dataBind: {
                    attr: {
                        href: 'pageUrl'
                    }
                },
                target: '_blank'
            }, [
                span({
                    dataBind: {
                        text: 'imageCaption'
                    },
                    style: {
                        marginRight: '6px'
                    }
                }),
                span({
                    class: 'fa fa-wikipedia-w'
                })
            ]))
        ]);
    }

    function buildArticle() {
        return div({
            dataBind: {
                htmlMarkdown: 'introText'
            }
        });
    }

    function buildDisplay() {
        return div({
            style: {
                display: 'flex',
                flexDirection: 'row',
                flex: '1 1 0px'
            }
        }, [
            div({
                style: {
                    flex: '2 1 0px',
                    paddingRight: '4px',
                    marginRight: '4px',
                    overflowY: 'auto'
                }
            }, buildArticle()),
            div({
                style: {
                    flex: '1 1 0px'
                },
                dataBind: {
                    attr: {
                        width: 'imageWidth'
                    }
                }
            }, buildImage())
        ]);
    }

    function buildError() {
        return gen.with('error()', builders.buildError());
    }

    // function buildError() {
    //     return div({
    //         class: commonStyle.classes.errorBox,
    //         dataBind: {
    //             text: 'error()'
    //         }
    //     });
    // }

    function buildLoading() {
        return div(build.loading('Finding page at Wikipedia'));
    }

    function template() {
        return div({
            class: style.classes.component
        }, gen.if('ready',
            buildDisplay(),
            gen.if('error',
                buildError(),
                buildLoading())));

        // gen.switch('state', [
        //     [
        //         '"loading"', buildLoading()
        //     ],
        //     [
        //         '"loaded"', buildDisplay()
        //     ],
        //     [
        //         '"error"', buildError()
        //     ]
        // ]));
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