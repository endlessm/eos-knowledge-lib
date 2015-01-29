const Lang = imports.lang;
const GObject = imports.gi.GObject;
const EosKnowledgeSearch = imports.EosKnowledgeSearch;
const Endless = imports.gi.Endless;
const Gio = imports.gi.Gio;
const Soup = imports.gi.Soup;

const InstanceOfMatcher = imports.InstanceOfMatcher;
const utils = imports.tests.utils;

const MOCK_CONTENT_PATH = Endless.getCurrentFileDir() + '/../test-content/content-search-results.jsonld';
const MOCK_ARTICLE_PATH = Endless.getCurrentFileDir() + '/../test-content/article-search-results.jsonld';
const MOCK_MEDIA_PATH = Endless.getCurrentFileDir() + '/../test-content/media-search-results.jsonld';

const MockCache = new Lang.Class({
    Name: 'MockCache',
    Extends: GObject.Object,
    _init: function () {
        this.parent();
        this.data = {};
        this.getSpy = jasmine.createSpy('get');
        this.setSpy = jasmine.createSpy('set');
    },
    get: function (key) {
        this.getSpy(key);
        if (this.data.hasOwnProperty(key))
            return this.data[key];
        return null;
    },
    set: function (key, value) {
        this.setSpy(key, value);
        this.data[key] = value;
    },
});

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
        engine.content_path = '/test';
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
            engine.get_object_by_id('ekn://foo/sqwert', () => {}, cancellable);
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
            engine.get_object_by_id('ekn://foo/sqwert', () => {}, cancellable);
            expect(engine._http_session.queue_message).not.toHaveBeenCalled();
        });
    });

    describe('get_xapian_uri', () => {
        it('throws error if query values are undefined', () => {
            let bad_query_obj = {
                q: undefined,
                tag: 'lannister',
            }
            expect(() =>{ engine.get_xapian_uri(bad_query_obj)}).toThrow(new Error('Parameter value is undefined: q'));
        });

        it('throws error if it receives unexpected query value', () => {
            let bad_query_obj = {
                something_unknown: 'blah',
            };

            expect(() =>{ engine.get_xapian_uri(bad_query_obj)}).toThrow(new Error('Unexpected property value something_unknown'));
        });

        it('sets collapse to 0', () => {
            let query_obj = {
                q: 'tyrion',
            };

            let mock_uri = engine.get_xapian_uri(query_obj);
            let mock_query_obj = mock_uri.get_query();
            expect(get_query_vals_for_key(mock_query_obj, 'collapse')).toEqual('0');
        });

        it('sets order field', () => {
            let query_obj = {
                q: 'tyrion',
                order: 'asc',
            };

            let mock_uri = engine.get_xapian_uri(query_obj);
            let mock_query_obj = mock_uri.get_query();
            expect(get_query_vals_for_key(mock_query_obj, 'order')).toEqual('asc');
        });

        it('should use the lang param iff a language is set', () => {
            let query_obj = {
                q: 'tyrion',
            };

            let mock_uri = engine.get_xapian_uri(query_obj);
            let mock_query_obj = mock_uri.get_query();
            expect(get_query_vals_for_key(mock_query_obj, 'lang')).toEqual([]);

            engine.language = 'en';
            let mock_uri = engine.get_xapian_uri(query_obj);
            let mock_query_obj = mock_uri.get_query();
            expect(get_query_vals_for_key(mock_query_obj, 'lang')).toEqual('en');
        });

        it('sets correct default values for cutoff, limit, offset, and order', () => {
            let query_obj = {
                q: 'tyrion',
            };

            let mock_uri = engine.get_xapian_uri(query_obj);
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

            let mock_uri = engine.get_xapian_uri(query_obj);
            let mock_query_obj = mock_uri.get_query();
            expect(get_query_vals_for_key(mock_query_obj, 'limit')).toEqual('0');
        });

        it('sets path correctly', () => {
            let path, uri, query_obj;
            let query_obj = {
                q: 'tyrion',
            };

            engine.content_path = '/foo';
            uri = engine.get_xapian_uri(query_obj);
            query_obj = uri.get_query();
            expect(get_query_vals_for_key(query_obj, 'path')).toEqual('/foo/db');
        });

        it('supports combinations of queries', () => {
            let query_obj = {
                q: 'tyrion wins',
                tag: ['lannister', 'bro'],
                prefix: 'gam',
                offset: 5,
                limit: 2,
            };
            let mock_uri = engine.get_xapian_uri(query_obj);
            let mock_query_obj = mock_uri.get_query();
            let serialized_query = get_query_vals_for_key(mock_query_obj, 'q');
            let parts = serialized_query.split(' AND ');
            let expected_parts = ['((title:tyrion OR title:wins) OR (tyrion wins) OR (exact_title:Tyrion_Wins))', '(tag:"lannister" OR tag:"bro")', '(exact_title:gam*)'];
            let isMatch = expected_parts.sort().join('') === parts.sort().join('');
            expect(isMatch).toBe(true);
        });

        it('supports single ID queries', () => {
            let query_obj = {
                id: 'ekn://domain/someId',
            };
            let query_params = {
                q: '(id:some_id)',
            };

            let mock_uri = engine.get_xapian_uri(query_obj);
            let mock_query_obj = mock_uri.get_query();
            expect(get_query_vals_for_key(mock_query_obj, 'q'));
        });
    });

    describe('serialize_query', () => {
        it('correctly serializes a query string', () => {
            let query_obj = {
                path: '/foo',
                q: 'bar',
                offset: 5,
            };
            expect(engine.serialize_query(query_obj)).toEqual('path=%2Ffoo&q=bar&offset=5');

            query_obj = {
                slarty: 'thing@with@ats',
                bartfast: 'this=that',
            };
            expect(engine.serialize_query(query_obj)).toEqual('slarty=thing%40with%40ats&bartfast=this%3Dthat');
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
            let path = '/baz';
            engine.content_path = path;

            engine.get_object_by_id(mock_id, noop);
            let last_req_args = request_spy.calls.mostRecent().args;
            let requested_uri = last_req_args[0];
            let requested_query = requested_uri.get_query();
            let requested_uri_string = requested_uri.to_string(false);

            expect(requested_uri_string).toMatch(/^http:\/\/127.0.0.1:3004\/query?/);
            expect(get_query_vals_for_key(requested_query, 'path')).toMatch(path);
            expect(get_query_vals_for_key(requested_query, 'q')).toMatch(mock_id_query);
        });

        it('marshals objects based on @type', (done) => {
            let mock_id = 'ekn://foo/bar';
            mock_engine_request(undefined, {
                'results': [{
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
            engine.content_path = '/hopeful';
            mock_engine_request(undefined, {
                'results': [{
                    "@type": "ekn://_vocab/ContentObject",
                    "contentURL": "alligator.jpg",
                }]
            });

            engine.get_object_by_id(mock_id, (err, res) => {
                expect(res).toBeA(EosKnowledgeSearch.ContentObjectModel);
                expect(res.content_uri).toBe('file:///hopeful/media/alligator.jpg');
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
            let path = '/sacchariferous';
            engine.content_path = path;

            engine.get_objects_by_query(mock_query, noop);
            let last_req_args = request_spy.calls.mostRecent().args;
            let requested_uri = last_req_args[0];
            let requested_query = requested_uri.get_query();
            let requested_uri_string = requested_uri.to_string(false);

            expect(requested_uri_string).toMatch(/^http:\/\/127.0.0.1:3004\/query?/);
            expect(get_query_vals_for_key(requested_query, 'path')).toMatch(path);
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
    });

    describe('cache', () => {
        let cache;
        beforeEach(() => {
            cache = new MockCache();
            engine = new EosKnowledgeSearch.Engine({
                cache: cache,
            });
            mock_engine_request(undefined, {
                'results': [{
                    "@type": "ekn://_vocab/ArticleObject",
                    "@id": "ekn://foo/bar",
                    "synopsis": "NOW IS THE WINTER OF OUR DISCONTENT"
                }]
            });
        });

        it('should set a cache entry after cache miss', (done) => {
            engine.get_object_by_id('ekn://foo/bar', (err, object) => {
                expect(cache.getSpy).toHaveBeenCalledWith('ekn://foo/bar');
                expect(cache.setSpy).toHaveBeenCalledWith('ekn://foo/bar', object);
                done();
            });
        });

        it('should return cached values for get_object_by_id', (done) => {
            cache.data = {
                'ekn://foo/bar': 'cached value',
            };
            let request_spy = engine_request_spy();

            engine.get_object_by_id('ekn://foo/bar', (err, object) => {
                expect(cache.getSpy).toHaveBeenCalledWith('ekn://foo/bar');
                expect(request_spy).not.toHaveBeenCalled();
                expect(object).toEqual('cached value');
                done();
            });
        });

        it('should return cached values for get_objects_by_query', (done) => {
            cache.data = {
                'ekn://foo/bar': 'cached value',
            };

            engine.get_objects_by_query({}, (err, results) => {
                expect(cache.getSpy).toHaveBeenCalledWith('ekn://foo/bar');
                expect(results[0]).toEqual('cached value');
                done();
            });
        });
    });
});
