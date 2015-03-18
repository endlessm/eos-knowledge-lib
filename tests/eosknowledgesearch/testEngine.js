const EosKnowledgeSearch = imports.EosKnowledgeSearch;
const Endless = imports.gi.Endless;
const Gio = imports.gi.Gio;
const Soup = imports.gi.Soup;

const InstanceOfMatcher = imports.InstanceOfMatcher;
const utils = imports.tests.utils;

const MOCK_CONTENT_PATH = Endless.getCurrentFileDir() + '/../test-content/content-search-results.jsonld';
const MOCK_ARTICLE_PATH = Endless.getCurrentFileDir() + '/../test-content/article-search-results.jsonld';
const MOCK_MEDIA_PATH = Endless.getCurrentFileDir() + '/../test-content/media-search-results.jsonld';

describe('Knowledge Engine Module', () => {
    let engine;
    let noop = function () {};

    const MOCK_CONTENT_RESULTS = utils.parse_object_from_path(MOCK_CONTENT_PATH);
    const MOCK_ARTICLE_RESULTS = utils.parse_object_from_path(MOCK_ARTICLE_PATH);
    const MOCK_MEDIA_RESULTS = utils.parse_object_from_path(MOCK_MEDIA_PATH);

    // Setup a spy in place of the Soup-based request function
    function engine_request_spy() {
        let mock_request = jasmine.createSpy('request');
        engine._send_json_ld_request = mock_request;
        return mock_request;
    }

    // Setup a mocked request function which just returns the mock data
    function mock_engine_request(mock_err, mock_data) {
        engine._send_json_ld_request = (req, callback) => {
            callback(mock_err, mock_data);
        }
    }

    function mock_engine_request_with_multiple_values(return_values) {
        engine._send_json_ld_request = (req, callback) => {
            callback(undefined, return_values.shift());
        }
    }

    // where querystring is the URI component after a '?', and key is the
    // name of a query parameter, return the value(s) for that parameter
    // e.g.:
    //   get_query_vals_for_key('foo=bar', 'foo') => 'bar'
    //   get_query_vals_for_key('foo=bar&foo=baz', 'foo') => ['bar', 'baz']
    function get_query_vals_for_key (querystring, key) {
        let results = querystring.split('&').filter((pair) => {
            return pair.indexOf(key + '=') === 0;
        }).map((pair) => {
            return decodeURIComponent(pair.split('=')[1]);
        });

        if (results.length === 1)
            return results[0];
        return results;
    }

    beforeEach(() => {
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);
        engine = new EosKnowledgeSearch.Engine();
        engine.default_domain = 'foo';

        // Inject a custom content path finder so we don't hit the disk ever.
        engine._content_path_from_domain = function(domain) {
            // The rule for our test suite is that domain 'foo' gets
            // the content-path /foo'.
            return '/' + domain;
        };
    });

    describe('constructor', () => {
        it('should default its port to 3004', () => {
            expect(engine.port).toBe(3004);
        });

        it('should default its hostname to 127.0.0.1', () => {
            expect(engine.host).toBe('127.0.0.1');
        });
    });

    describe('HTTP requests', () => {
        beforeEach(() => {
            // spy on the queue_message and cancel_message methods
            spyOn(engine._http_session, 'queue_message').and.callFake((req, cb) => {
                cb();
            });
            spyOn(engine._http_session, 'cancel_message');
        });

        it('can be cancelled', () => {
            let cancellable = new Gio.Cancellable();
            engine.get_object_by_id('ekn://foo/sqwert', noop, cancellable);
            cancellable.cancel();
            expect(engine._http_session.cancel_message).toHaveBeenCalled();
            let message = engine._http_session.cancel_message.calls.mostRecent().args[0];
            // Make sure we are canceling the right Soup Message
            expect(message).toBeA(Soup.Message);
            expect(message.uri.to_string(true)).toMatch('sqwert');
        });

        it('does not make a request if already cancelled', () => {
            let cancellable = new Gio.Cancellable();
            cancellable.cancel();
            engine.get_object_by_id('ekn://foo/sqwert', noop, cancellable);
            expect(engine._http_session.queue_message).not.toHaveBeenCalled();
        });
    });

    describe('_parse_json_ld_message utility method', () => {
        it('replaces old-style EKN ids', () => {
            let json_without_api = JSON.stringify({
                '@id': 'http://localhost:3003/foo/bar',
            });
            let json_with_api = JSON.stringify({
                '@id': 'http://localhost:3003/api/foo/bar',
            });

            expect(engine._parse_json_ld_message(json_with_api)['@id'])
            .toEqual('ekn://foo/bar');

            expect(engine._parse_json_ld_message(json_without_api)['@id'])
            .toEqual('ekn://foo/bar');
        });
    });

    describe('get_xapian_uri', () => {
        it('throws error if query values are undefined', () => {
            let bad_query_obj = {
                q: undefined,
                tags: ['lannister'],
            }
            expect(() =>{ engine._get_xapian_uri(bad_query_obj)}).toThrow(new Error('Parameter value is undefined: q'));
        });

        it('throws error if it receives unexpected query value', () => {
            let bad_query_obj = {
                something_unknown: 'blah',
            };

            expect(() =>{ engine._get_xapian_uri(bad_query_obj)}).toThrow(new Error('Unexpected property value something_unknown'));
        });

        it('sets collapse to 0', () => {
            let query_obj = {
                q: 'tyrion',
            };

            let mock_uri = engine._get_xapian_uri(query_obj);
            let mock_query_obj = mock_uri.get_query();
            expect(get_query_vals_for_key(mock_query_obj, 'collapse')).toEqual('0');
        });

        it('sets order field', () => {
            let query_obj = {
                q: 'tyrion',
                order: 'asc',
            };

            let mock_uri = engine._get_xapian_uri(query_obj);
            let mock_query_obj = mock_uri.get_query();
            expect(get_query_vals_for_key(mock_query_obj, 'order')).toEqual('asc');
        });

        it('should use the lang param iff a language is set', () => {
            let query_obj = {
                q: 'tyrion',
            };

            let mock_uri = engine._get_xapian_uri(query_obj);
            let mock_query_obj = mock_uri.get_query();
            expect(get_query_vals_for_key(mock_query_obj, 'lang')).toEqual([]);

            engine.language = 'en';
            let mock_uri = engine._get_xapian_uri(query_obj);
            let mock_query_obj = mock_uri.get_query();
            expect(get_query_vals_for_key(mock_query_obj, 'lang')).toEqual('en');
        });

        it('sets correct default values for cutoff, limit, offset, and order', () => {
            let query_obj = {
                q: 'tyrion',
            };

            let mock_uri = engine._get_xapian_uri(query_obj);
            let mock_query_obj = mock_uri.get_query();
            expect(get_query_vals_for_key(mock_query_obj, 'cutoff')).toEqual('20');
            expect(get_query_vals_for_key(mock_query_obj, 'limit')).toEqual('10');
            expect(get_query_vals_for_key(mock_query_obj, 'offset')).toEqual('0');
            expect(get_query_vals_for_key(mock_query_obj, 'order')).toEqual('asc');
        });

        it('will not override a value of zero', () => {
            let query_obj = {
                q: 'tyrion',
                limit: 0,
            };

            let mock_uri = engine._get_xapian_uri(query_obj);
            let mock_query_obj = mock_uri.get_query();
            expect(get_query_vals_for_key(mock_query_obj, 'limit')).toEqual('0');
        });

        it('sets path correctly', () => {
            let path, uri, query_obj;
            let query_obj = {
                q: 'tyrion',
            };

            uri = engine._get_xapian_uri(query_obj);
            query_obj = uri.get_query();
            expect(get_query_vals_for_key(query_obj, 'path')).toEqual('/foo/db');
        });

        it('supports combinations of queries', () => {
            let query_obj = {
                q: 'tyrion wins',
                tags: ['lannister', 'bro'],
                prefix: 'gam',
                offset: 5,
                limit: 2,
            };
            let mock_uri = engine._get_xapian_uri(query_obj);
            let mock_query_obj = mock_uri.get_query();
            let serialized_query = get_query_vals_for_key(mock_query_obj, 'q');
            let parts = serialized_query.split(' AND ');
            let expected_parts = ['((title:tyrion OR title:wins) OR (tyrion wins) OR (exact_title:Tyrion_Wins))', '(tag:"lannister" OR tag:"bro")', '(exact_title:Gam*)'];
            let isMatch = expected_parts.sort().join('') === parts.sort().join('');
            expect(isMatch).toBe(true);
        });

        it('supports single ID queries', () => {
            let query_obj = {
                ids: ['ekn://domain/someId'],
            };
            let query_params = {
                q: '(id:some_id)',
            };

            let mock_uri = engine._get_xapian_uri(query_obj);
            let mock_query_obj = mock_uri.get_query();
            expect(get_query_vals_for_key(mock_query_obj, 'q'));
        });

        it('supports multiple ID queries', () => {
            let query_obj = {
                ids: [
                    'ekn://domain/someId',
                    'ekn://domain/someOtherId',
                ],
            };
            let expected_vals = '(id:someId OR id:someOtherId)';

            let mock_uri = engine._get_xapian_uri(query_obj);
            let mock_query_obj = mock_uri.get_query();
            expect(get_query_vals_for_key(mock_query_obj, 'q')).toEqual(expected_vals);
        });
    });

    describe('serialize_query', () => {
        it('correctly serializes a query string', () => {
            let query_obj = {
                path: '/foo',
                q: 'bar',
                offset: 5,
            };
            expect(engine._serialize_query(query_obj)).toEqual('path=%2Ffoo&q=bar&offset=5');

            query_obj = {
                slarty: 'thing@with@ats',
                bartfast: 'this=that',
            };
            expect(engine._serialize_query(query_obj)).toEqual('slarty=thing%40with%40ats&bartfast=this%3Dthat');
        });
    });


    describe('get_object_by_id', () => {
        it('sends requests', () => {
            let request_spy = engine_request_spy();
            let mock_id = 'ekn://foo/bar';

            engine.get_object_by_id(mock_id, noop);
            expect(request_spy).toHaveBeenCalled();
        });

        it('sends correct request URIs', () => {
            let request_spy = engine_request_spy();
            let mock_id = 'ekn://foo/bar';
            let mock_id_query = '(id:bar)';

            engine.get_object_by_id(mock_id, noop);
            let last_req_args = request_spy.calls.mostRecent().args;
            let requested_uri = last_req_args[0];
            let requested_query = requested_uri.get_query();
            let requested_uri_string = requested_uri.to_string(false);

            expect(requested_uri_string).toMatch(/^http:\/\/127.0.0.1:3004\/query?/);
            expect(get_query_vals_for_key(requested_query, 'path')).toMatch('/foo');
            expect(get_query_vals_for_key(requested_query, 'q')).toMatch(mock_id_query);
        });

        it('marshals objects based on @type', (done) => {
            let mock_id = 'ekn://foo/bar';
            mock_engine_request(undefined, {
                'results': [{
                    "@id": mock_id,
                    "@type": "ekn://_vocab/ArticleObject",
                    "synopsis": "NOW IS THE WINTER OF OUR DISCONTENT"
                }]
            });

            engine.get_object_by_id(mock_id, (err, res) => {
                print(err);
                expect(err).not.toBeDefined();
                expect(res).toBeA(EosKnowledgeSearch.ArticleObjectModel);
                expect(res.synopsis).toBe("NOW IS THE WINTER OF OUR DISCONTENT");
                done();
            });
        });

        it('correctly sets media path on models', (done) => {
            let mock_id = 'ekn://foo/bar';
            mock_engine_request(undefined, {
                'results': [{
                    "@id": mock_id,
                    "@type": "ekn://_vocab/ContentObject",
                    "contentURL": "alligator.jpg",
                }]
            });

            engine.get_object_by_id(mock_id, (err, res) => {
                expect(res).toBeA(EosKnowledgeSearch.ContentObjectModel);
                expect(res.content_uri).toBe('file:///foo/media/alligator.jpg');
                done();
            });
        });

        it('does not call its callback more than once', (done) => {
            let mock_id = 'ekn://foo/bar';
            mock_engine_request(new Error('I am an error'), undefined);

            let callback_called = 0;
            engine.get_object_by_id(mock_id, (err, res) => {
                callback_called++;
            });
            setTimeout(done, 100); // pause for a moment for any more callbacks
            expect(callback_called).toEqual(1);
        });

        it('performs redirect resolution', (done) => {
            mock_engine_request_with_multiple_values([
                {
                    results: [{
                        '@id': 'ekn://foo/redirect',
                        '@type': 'ekn://_vocab/ArticleObject',
                        redirectsTo: 'ekn://foo/real',
                    }],
                },
                {
                    results: [{
                        '@id': 'ekn://foo/real',
                        '@type': 'ekn://_vocab/ArticleObject',
                    }],
                },
            ]);
            engine.get_object_by_id('ekn://foo/redirect', (err, thing) => {
                expect(thing.ekn_id).toEqual('ekn://foo/real');
                done();
            });
        });

        it('handles 404 when fetching redirects', (done) => {
            mock_engine_request_with_multiple_values([
                {
                    results: [{
                        '@id': 'ekn://foo/redirect',
                        '@type': 'ekn://_vocab/ArticleObject',
                        redirectsTo: 'ekn://foo/nope',
                    }],
                },
                {
                    results: [],
                },
            ]);
            engine.get_object_by_id('ekn://foo/redirect', (err, thing) => {
                expect(err).toBeDefined();
                expect(thing).not.toBeDefined();
                done();
            });
        });
    });

    describe('get_objects_by_query', () => {

        it('sends requests', () => {
            let request_spy = engine_request_spy();
            let mock_query = {
                q: 'logorrhea',
            };

            engine.get_objects_by_query(mock_query, noop);
            expect(request_spy).toHaveBeenCalled();
        });

        it('requests correct URIs', () => {
            let request_spy = engine_request_spy();
            let mock_query = {
                q: 'logorrhea',
            };

            engine.get_objects_by_query(mock_query, noop);
            let last_req_args = request_spy.calls.mostRecent().args;
            let requested_uri = last_req_args[0];
            let requested_query = requested_uri.get_query();
            let requested_uri_string = requested_uri.to_string(false);

            expect(requested_uri_string).toMatch(/^http:\/\/127.0.0.1:3004\/query?/);
            expect(get_query_vals_for_key(requested_query, 'path')).toMatch('/foo');
            expect(get_query_vals_for_key(requested_query, 'q')).toMatch('(logorrhea)');
        });

        it ("throws an error on unsupported JSON-LD type", (done) => {
            let notSearchResults = {
                "@type": "schema:Frobinator",
                "numResults": 1,
                "results": [
                    { "@type": "ekv:ArticleObject", "synopsis": "dolla dolla bill y'all" }
                ]
            };
            mock_engine_request(undefined, notSearchResults);

            engine.get_objects_by_query({}, (err, results) => {
                expect(results).not.toBeDefined();
                expect(err).toBeDefined();
                done();
            });
        });

        it ("throws an error on unsupported search results", (done) => {
            let badObject = { "@type": "ekv:Kitten" };
            let resultsWithBadObject = {
                "@type": "ekv:SearchResults",
                "numResults": 1,
                "results": [ badObject ]
            };

            mock_engine_request(undefined, resultsWithBadObject);
            engine.get_objects_by_query({}, (err, results) => {
                expect(results).not.toBeDefined();
                expect(err).toBeDefined();
                done();
            });
        });

        it ("resolves to a list of results if jsonld is valid", (done) => {
            mock_engine_request(undefined, MOCK_ARTICLE_RESULTS);

            engine.get_objects_by_query({}, (err, results) => {
                expect(err).not.toBeDefined();
                expect(results).toBeDefined();
                done();
            });
        });

        it ("constructs a list of content objects based on @type", (done) => {
            mock_engine_request(undefined, MOCK_CONTENT_RESULTS);
            engine.get_objects_by_query({}, (err, results) => {
                // All results in MOCK_CONTENT_OBJECT_RESULTS are of @type ContentObject,
                // so expect that they're constructed as such
                for (let i in results) {
                    expect(results[i]).toBeA(EosKnowledgeSearch.ContentObjectModel);
                }
                done();
            });
        });

        it ("constructs a list of article objects based on @type", (done) => {
            mock_engine_request(undefined, MOCK_ARTICLE_RESULTS);
            engine.get_objects_by_query({}, (err, results) => {
                // All results in MOCK_ARTICLE_OBJECT_RESULTS are of @type ArticleObject,
                // so expect that they're constructed as such
                for (let i in results) {
                    expect(results[i]).toBeA(EosKnowledgeSearch.ArticleObjectModel);
                }
                done();
            });
        });

        it ("constructs a list of media objects based on @type", (done) => {
            mock_engine_request(undefined, MOCK_MEDIA_RESULTS);
            engine.get_objects_by_query({}, (err, results) => {
                // All results in MOCK_MEDIA_OBJECT_RESULTS are of @type MediaObject,
                // so expect that they're constructed as such
                for (let i in results) {
                    expect(results[i]).toBeA(EosKnowledgeSearch.MediaObjectModel);
                }
                done();
            });
        });

        it('does not call its callback more than once', (done) => {
            mock_engine_request(new Error('I am an error'), undefined);

            let callback_called = 0;
            engine.get_objects_by_query({}, (err, res) => {
                callback_called++;
            });
            setTimeout(done, 100); // pause for a moment for any more callbacks
            expect(callback_called).toEqual(1);
        });

        it('performs redirect resolution', (done) => {
            let get_objects_spy = spyOn(engine, 'get_objects_by_query').and.callThrough();
            mock_engine_request_with_multiple_values([
                {
                    results: [
                        {
                            '@id': 'ekn://foo/redirect2',
                            '@type': 'ekn://_vocab/ArticleObject',
                            redirectsTo: 'ekn://foo/redirect3',
                        },
                        {
                            '@id': 'ekn://foo/redirect',
                            '@type': 'ekn://_vocab/ArticleObject',
                            redirectsTo: 'ekn://foo/real2',
                        },
                        {
                            '@id': 'ekn://foo/real3',
                            '@type': 'ekn://_vocab/ArticleObject',
                        },
                    ],
                },
                {
                    results: [
                        {
                            '@id': 'ekn://foo/redirect3',
                            '@type': 'ekn://_vocab/ArticleObject',
                            redirectsTo: 'ekn://foo/redirect4',
                        },
                        {
                            '@id': 'ekn://foo/real2',
                            '@type': 'ekn://_vocab/ArticleObject',
                        },
                    ],
                },
                {
                    results: [
                        {
                            '@id': 'ekn://foo/redirect4',
                            '@type': 'ekn://_vocab/ArticleObject',
                            redirectsTo: 'ekn://foo/real',
                        },
                    ],
                },
                {
                    results: [
                        {
                            '@id': 'ekn://foo/real',
                            '@type': 'ekn://_vocab/ArticleObject',
                        },
                    ],
                },
            ]);
            engine.get_objects_by_query({}, (err, things) => {
                expect(things[0].ekn_id).toEqual('ekn://foo/real');
                expect(things[1].ekn_id).toEqual('ekn://foo/real2');
                expect(things[2].ekn_id).toEqual('ekn://foo/real3');
                done();
            });
        });

        it('handles 404s when fetching redirects', (done) => {
            mock_engine_request_with_multiple_values([
                {
                    results: [
                        {
                            '@id': 'ekn://foo/redirect',
                            '@type': 'ekn://_vocab/ArticleObject',
                            redirectsTo: 'ekn://foo/notathing',
                        },
                    ],
                },
                {
                    results: [],
                },
            ]);
            engine.get_objects_by_query({}, (err, things) => {
                expect(err).toBeDefined();
                expect(things).not.toBeDefined();
                done();
            });
        })
    });
});
