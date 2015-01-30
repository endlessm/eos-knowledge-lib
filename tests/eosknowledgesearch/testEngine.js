const EosKnowledgeSearch = imports.EosKnowledgeSearch;
const Endless = imports.gi.Endless;
const Gio = imports.gi.Gio;
const Soup = imports.gi.Soup;

const InstanceOfMatcher = imports.InstanceOfMatcher;
const utils = imports.tests.utils;

const MOCK_CONTENT_PATH = Endless.getCurrentFileDir() + '/../test-content/content-search-results.jsonld';
const MOCK_ARTICLE_PATH = Endless.getCurrentFileDir() + '/../test-content/article-search-results.jsonld';
const MOCK_MEDIA_PATH = Endless.getCurrentFileDir() + '/../test-content/media-search-results.jsonld';

describe('Knowledge Engine Module', function () {
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
        engine._send_json_ld_request = function (req, callback) {
            callback(mock_err, mock_data);
        }
    }

    // where querystring is the URI component after a '?', and key is the
    // name of a query parameter, return the value(s) for that parameter
    // e.g.:
    //   get_query_vals_for_key('foo=bar', 'foo') => 'bar'
    //   get_query_vals_for_key('foo=bar&foo=baz', 'foo') => ['bar', 'baz']
    function get_query_vals_for_key (querystring, key) {
        let results = querystring.split('&').filter(function (pair) {
            return pair.indexOf(key + '=') === 0;
        }).map(function (pair) {
            return decodeURIComponent(pair.split('=')[1]);
        });

        if (results.length === 1)
            return results[0];
        return results;
    }

    beforeEach(function () {
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);
        engine = new EosKnowledgeSearch.Engine();
        engine.content_path = '/test';
    });

    describe('constructor', function () {
        it('should default its port to 3004', function () {
            expect(engine.port).toBe(3004);
        });

        it('should default its hostname to 127.0.0.1', function () {
            expect(engine.host).toBe('127.0.0.1');
        });
    });

    describe('HTTP requests', function () {
        beforeEach(function () {
            // spy on the queue_message and cancel_message methods
            spyOn(engine._http_session, 'queue_message').and.callFake(function (req, cb) {
                cb();
            });
            spyOn(engine._http_session, 'cancel_message');
        });

        it('can be cancelled', function () {
            let cancellable = new Gio.Cancellable();
            engine.get_object_by_id('ekn://foo/sqwert', function () {}, cancellable);
            cancellable.cancel();
            expect(engine._http_session.cancel_message).toHaveBeenCalled();
            let message = engine._http_session.cancel_message.calls.mostRecent().args[0];
            // Make sure we are canceling the right Soup Message
            expect(message).toBeA(Soup.Message);
            expect(message.uri.to_string(true)).toMatch('sqwert');
        });

        it('does not make a request if already cancelled', function () {
            let cancellable = new Gio.Cancellable();
            cancellable.cancel();
            engine.get_object_by_id('ekn://foo/sqwert', function () {}, cancellable);
            expect(engine._http_session.queue_message).not.toHaveBeenCalled();
        });
    });

    describe('get_xapian_uri', function () {
        it('throws error if query values are undefined', function () {
            let bad_query_obj = {
                q: undefined,
                tags: ['lannister'],
            }
            expect(function(){ engine.get_xapian_uri(bad_query_obj)}).toThrow(new Error('Parameter value is undefined: q'));
        });

        it('throws error if it receives unexpected query value', function () {
            let bad_query_obj = {
                something_unknown: 'blah',
            };

            expect(function(){ engine.get_xapian_uri(bad_query_obj)}).toThrow(new Error('Unexpected property value something_unknown'));
        });

        it('sets collapse to 0', function () {
            let query_obj = {
                q: 'tyrion',
            };

            let mock_uri = engine.get_xapian_uri(query_obj);
            let mock_query_obj = mock_uri.get_query();
            expect(get_query_vals_for_key(mock_query_obj, 'collapse')).toEqual('0');
        });

        it('sets order field', function () {
            let query_obj = {
                q: 'tyrion',
                order: 'asc',
            };

            let mock_uri = engine.get_xapian_uri(query_obj);
            let mock_query_obj = mock_uri.get_query();
            expect(get_query_vals_for_key(mock_query_obj, 'order')).toEqual('asc');
        });

        it('should use the lang param iff a language is set', function () {
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

        it('sets correct default values for cutoff, limit, offset, and order', function () {
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

        it('will not override a value of zero', function () {
            let query_obj = {
                q: 'tyrion',
                limit: 0,
            };

            let mock_uri = engine.get_xapian_uri(query_obj);
            let mock_query_obj = mock_uri.get_query();
            expect(get_query_vals_for_key(mock_query_obj, 'limit')).toEqual('0');
        });

        it('sets path correctly', function () {
            let path, uri, query_obj;
            let query_obj = {
                q: 'tyrion',
            };

            engine.content_path = '/foo';
            uri = engine.get_xapian_uri(query_obj);
            query_obj = uri.get_query();
            expect(get_query_vals_for_key(query_obj, 'path')).toEqual('/foo/db');
        });

        it('supports combinations of queries', function () {
            let query_obj = {
                q: 'tyrion wins',
                tags: ['lannister', 'bro'],
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

        it('supports single ID queries', function () {
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

    describe('serialize_query', function () {
        it('correctly serializes a query string', function () {
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


    describe('get_object_by_id', function () {
        it('sends requests', function () {
            let request_spy = engine_request_spy();
            let mock_id = 'ekn://foo/bar';

            engine.get_object_by_id(mock_id, noop);
            expect(request_spy).toHaveBeenCalled();
        });

        it('sends correct request URIs', function () {
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

        it('marshals objects based on @type', function (done) {
            let mock_id = 'ekn://foo/bar';
            mock_engine_request(undefined, {
                'results': [{
                    "@type": "ekn://_vocab/ArticleObject",
                    "synopsis": "NOW IS THE WINTER OF OUR DISCONTENT"
                }]
            });

            engine.get_object_by_id(mock_id, function (err, res) {
                print(err);
                expect(err).not.toBeDefined();
                expect(res).toBeA(EosKnowledgeSearch.ArticleObjectModel);
                expect(res.synopsis).toBe("NOW IS THE WINTER OF OUR DISCONTENT");
                done();
            });
        });

        it('correctly sets media path on models', function (done) {
            let mock_id = 'ekn://foo/bar';
            engine.content_path = '/hopeful';
            mock_engine_request(undefined, {
                'results': [{
                    "@type": "ekn://_vocab/ContentObject",
                    "contentURL": "alligator.jpg",
                }]
            });

            engine.get_object_by_id(mock_id, function (err, res) {
                expect(res).toBeA(EosKnowledgeSearch.ContentObjectModel);
                expect(res.content_uri).toBe('file:///hopeful/media/alligator.jpg');
                done();
            });
        });

        it('does not call its callback more than once', function (done) {
            let mock_id = 'ekn://foo/bar';
            mock_engine_request(new Error('I am an error'), undefined);

            let callback_called = 0;
            engine.get_object_by_id(mock_id, function (err, res) {
                callback_called++;
            });
            setTimeout(done, 100); // pause for a moment for any more callbacks
            expect(callback_called).toEqual(1);
        });
    });

    describe('get_objects_by_query', function () {

        it('sends requests', function () {
            let request_spy = engine_request_spy();
            let mock_query = {
                q: 'logorrhea',
            };

            engine.get_objects_by_query(mock_query, noop);
            expect(request_spy).toHaveBeenCalled();
        });

        it('requests correct URIs', function () {
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

        it ("throws an error on unsupported JSON-LD type", function (done) {
            let notSearchResults = {
                "@type": "schema:Frobinator",
                "numResults": 1,
                "results": [
                    { "@type": "ekv:ArticleObject", "synopsis": "dolla dolla bill y'all" }
                ]
            };
            mock_engine_request(undefined, notSearchResults);

            engine.get_objects_by_query({}, function (err, results) {
                expect(results).not.toBeDefined();
                expect(err).toBeDefined();
                done();
            });
        });

        it ("throws an error on unsupported search results", function (done) {
            let badObject = { "@type": "ekv:Kitten" };
            let resultsWithBadObject = {
                "@type": "ekv:SearchResults",
                "numResults": 1,
                "results": [ badObject ]
            };

            mock_engine_request(undefined, resultsWithBadObject);
            engine.get_objects_by_query({}, function (err, results) {
                expect(results).not.toBeDefined();
                expect(err).toBeDefined();
                done();
            });
        });

        it ("resolves to a list of results if jsonld is valid", function (done) {
            mock_engine_request(undefined, MOCK_ARTICLE_RESULTS);

            engine.get_objects_by_query({}, function (err, results) {
                expect(err).not.toBeDefined();
                expect(results).toBeDefined();
                done();
            });
        });

        it ("constructs a list of content objects based on @type", function (done) {
            mock_engine_request(undefined, MOCK_CONTENT_RESULTS);
            engine.get_objects_by_query({}, function (err, results) {
                // All results in MOCK_CONTENT_OBJECT_RESULTS are of @type ContentObject,
                // so expect that they're constructed as such
                for (let i in results) {
                    expect(results[i]).toBeA(EosKnowledgeSearch.ContentObjectModel);
                }
                done();
            });
        });

        it ("constructs a list of article objects based on @type", function (done) {
            mock_engine_request(undefined, MOCK_ARTICLE_RESULTS);
            engine.get_objects_by_query({}, function (err, results) {
                // All results in MOCK_ARTICLE_OBJECT_RESULTS are of @type ArticleObject,
                // so expect that they're constructed as such
                for (let i in results) {
                    expect(results[i]).toBeA(EosKnowledgeSearch.ArticleObjectModel);
                }
                done();
            });
        });

        it ("constructs a list of media objects based on @type", function (done) {
            mock_engine_request(undefined, MOCK_MEDIA_RESULTS);
            engine.get_objects_by_query({}, function (err, results) {
                // All results in MOCK_MEDIA_OBJECT_RESULTS are of @type MediaObject,
                // so expect that they're constructed as such
                for (let i in results) {
                    expect(results[i]).toBeA(EosKnowledgeSearch.MediaObjectModel);
                }
                done();
            });
        });

        it('does not call its callback more than once', function (done) {
            mock_engine_request(new Error('I am an error'), undefined);

            let callback_called = 0;
            engine.get_objects_by_query({}, function (err, res) {
                callback_called++;
            });
            setTimeout(done, 100); // pause for a moment for any more callbacks
            expect(callback_called).toEqual(1);
        });
    });
});
