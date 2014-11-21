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
    });

    describe('constructor', function () {
        it('should default its port to 3003', function () {
            expect(engine.port).toBe(3003);
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

        it('has Accept headers set to JSON-LD', function (done) {
            engine.get_object_by_id('foo', 'bar', function () {
                let message = engine._http_session.queue_message.calls.mostRecent().args[0];
                expect(message.request_headers.get('Accept'))
                    .toBe('application/ld+json');
                done();
            });
        });

        it('can be cancelled', function () {
            let cancellable = new Gio.Cancellable();
            engine.get_object_by_id('sqwert', 'alert', function () {}, cancellable);
            cancellable.cancel();
            expect(engine._http_session.cancel_message).toHaveBeenCalled();
            let message = engine._http_session.cancel_message.calls.mostRecent().args[0];
            // Make sure we are canceling the right Soup Message
            expect(message).toBeA(Soup.Message);
            expect(message.uri.to_string(true)).toMatch('sqwert');
            expect(message.uri.to_string(true)).toMatch('alert');
        });

        it('does not make a request if already cancelled', function () {
            let cancellable = new Gio.Cancellable();
            cancellable.cancel();
            engine.get_object_by_id('sqwert', 'alert', function () {}, cancellable);
            expect(engine._http_session.queue_message).not.toHaveBeenCalled();
        });
    });

    describe('get_ekn_uri', function () {
        it('throws error if domain is undefined', function () {
            expect(function(){ engine.get_ekn_uri()}).toThrow(new Error('Domain not defined!'));
        });

        it('throws error if query values are undefined', function () {
            let bad_query_obj = {
                q: undefined,
                tag: ['lannister', 'badboy']
            }
            expect(function(){ engine.get_ekn_uri('thrones', undefined, bad_query_obj)}).toThrow(new Error('Parameter value is undefined!'));
        });

        it('makes correct object URIs', function () {
            let domain = 'thrones';
            let id = 'tyrion';
            let mock_uri = engine.get_ekn_uri(domain, id);
            let correct_uri = Soup.URI.new('http://127.0.0.1:3003/api/thrones/tyrion');
            expect(mock_uri.to_string(false)).toBe(correct_uri.to_string(false));

        });

        it('makes correct query URIs', function () {
            let domain = 'thrones';
            let id = 'tyrion';

            let query_obj = {
                q: 'kings',
                tag: ['lannister', 'badboy']
            }

            let mock_uri = engine.get_ekn_uri(domain, id, query_obj);
            let mock_query_obj = mock_uri.get_query();
            for (let key in query_obj) {
                expect(get_query_vals_for_key(mock_query_obj, key))
                    .toEqual(query_obj[key]);
            }
        });
    });

    describe('get_object_by_id', function () {
        it('sends requests', function () {
            let request_spy = engine_request_spy();
            let mock_domain = 'foo';
            let mock_id = 'bar';

            engine.get_object_by_id(mock_domain, mock_id, noop);
            expect(request_spy).toHaveBeenCalled();
        });

        it('sends correct request URIs', function () {
            let request_spy = engine_request_spy();
            let mock_domain = 'foo';
            let mock_id = 'bar';
            let expected_uri = Soup.URI.new('http://127.0.0.1:3003/api/foo/bar');

            engine.get_object_by_id(mock_domain, mock_id, noop);
            let last_req_args = request_spy.calls.mostRecent().args;
            let requested_uri = last_req_args[0];
            expect(requested_uri.to_string(false))
                .toBe(expected_uri.to_string(false));
        });

        it('marshals objects based on @type', function (done) {
            mock_engine_request(undefined, {
                "@type": "ekv:ArticleObject",
                "synopsis": "NOW IS THE WINTER OF OUR DISCONTENT"
            });

            engine.get_object_by_id('foo', 'bar', function (err, res) {
                print(err);
                expect(err).not.toBeDefined();
                expect(res).toBeA(EosKnowledgeSearch.ArticleObjectModel);
                expect(res.synopsis).toBe("NOW IS THE WINTER OF OUR DISCONTENT");
                done();
            });
        });

        it('does not call its callback more than once', function (done) {
            mock_engine_request(new Error('I am an error'), undefined);

            let callback_called = 0;
            engine.get_object_by_id('foo', 'bar', function (err, res) {
                callback_called++;
            });
            setTimeout(done, 100); // pause for a moment for any more callbacks
            expect(callback_called).toEqual(1);
        });
    });

    describe('get_objects_by_query', function () {

        it('sends requests', function () {
            let request_spy = engine_request_spy();
            let mock_domain = 'Music';
            let mock_query = {
                q: 'the best song in the world',
                prefix: 'Trib',
                tag: ['Be you angels?', 'Nay, we are but men'],
            };

            engine.get_objects_by_query(mock_domain, mock_query, noop);
            expect(request_spy).toHaveBeenCalled();
        });

        it('requests correct URIs', function () {
            let request_spy = engine_request_spy();
            let mock_domain = 'Music';
            let mock_query = {
                q: 'the best song in the world',
                prefix: 'Trib',
                tag: ['Be you angels?', 'Nay, we are but men'],
            };
            engine.get_objects_by_query(mock_domain, mock_query, noop);

            let last_req_args = request_spy.calls.mostRecent().args;
            let requested_uri = last_req_args[0];
            let requested_query = requested_uri.get_query();
            for (key in mock_query) {
                expect(get_query_vals_for_key(requested_query, key))
                    .toEqual(mock_query[key]);
            }
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

            engine.get_objects_by_query('whatever', {}, function (err, results) {
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
            engine.get_objects_by_query('whatever', {}, function (err, results) {
                expect(results).not.toBeDefined();
                expect(err).toBeDefined();
                done();
            });
        });

        it ("resolves to a list of results if jsonld is valid", function (done) {
            mock_engine_request(undefined, MOCK_CONTENT_RESULTS);

            engine.get_objects_by_query('whatever', {}, function (err, results) {
                expect(err).not.toBeDefined();
                expect(results).toBeDefined();
                done();
            });
        });

        it ("constructs a list of of objects based on @type", function (done) {
            mock_engine_request(undefined, MOCK_CONTENT_RESULTS);
            engine.get_objects_by_query('mock-content-query', {}, function (err, results) {
                // All results in MOCK_CONTENT_OBJECT_RESULTS are of @type ContentObject,
                // so expect that they're constructed as such
                for (let i in results) {
                    expect(results[i]).toBeA(EosKnowledgeSearch.ContentObjectModel);
                }
                done();
            });

            mock_engine_request(undefined, MOCK_ARTICLE_RESULTS);
            engine.get_objects_by_query('mock-article-query', {}, function (err, results) {
                // All results in MOCK_ARTICLE_OBJECT_RESULTS are of @type ArticleObject,
                // so expect that they're constructed as such
                for (let i in results) {
                    expect(results[i]).toBeA(EosKnowledgeSearch.ArticleObjectModel);
                }
                done();
            });

            mock_engine_request(undefined, MOCK_MEDIA_RESULTS);
            engine.get_objects_by_query('mock-media-query', {}, function (err, results) {
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
            engine.get_objects_by_query('mock-query', {}, function (err, res) {
                callback_called++;
            });
            setTimeout(done, 100); // pause for a moment for any more callbacks
            expect(callback_called).toEqual(1);
        });
    });
});
