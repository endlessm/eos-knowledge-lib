const EosKnowledge = imports.gi.EosKnowledge;
const Endless = imports.gi.Endless;
const Soup = imports.gi.Soup;

const InstanceOfMatcher = imports.InstanceOfMatcher;
const utils = imports.utils;

EosKnowledge.init();

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

    beforeEach(function () {
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);
        engine = new EosKnowledge.Engine();
    });

    describe('constructor', function () {
        it('should default its port to 3000', function () {
            expect(engine.port).toBe(3000);
        });

        it('should default its hostname to localhost', function () {
            expect(engine.host).toBe('localhost');
        });
    });

    describe('HTTP requests', function () {
        let queue_message_spy;

        beforeEach(function () {
            queue_message_spy = jasmine.createSpy('queue_message');

            // spy on and mock the queue_message method
            engine._http_session = {
                queue_message: function (req, cb) {
                    queue_message_spy(req, cb);
                    cb();
                }
            }
        });

        it('has Accept headers set to JSON-LD', function (done) {
            engine.get_object_by_id('foo', 'bar', function () {
                let args = queue_message_spy.calls.mostRecent().args;
                let sent_message = args[0];
                expect(sent_message.request_headers.get('Accept'))
                    .toBe('application/ld+json');
                done();
            });
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
            let expected_uri = Soup.URI.new('http://localhost:3000/api/foo/bar');

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
                expect(res).toBeA(EosKnowledge.ArticleObjectModel);
                expect(res.synopsis).toBe("NOW IS THE WINTER OF OUR DISCONTENT");
                done();
            });
        });
    });

    describe('get_objects_by_query', function () {
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
                    expect(results[i]).toBeA(EosKnowledge.ContentObjectModel);
                }
                done();
            });

            mock_engine_request(undefined, MOCK_ARTICLE_RESULTS);
            engine.get_objects_by_query('mock-article-query', {}, function (err, results) {
                // All results in MOCK_ARTICLE_OBJECT_RESULTS are of @type ArticleObject,
                // so expect that they're constructed as such
                for (let i in results) {
                    expect(results[i]).toBeA(EosKnowledge.ArticleObjectModel);
                }
                done();
            });

            mock_engine_request(undefined, MOCK_MEDIA_RESULTS);
            engine.get_objects_by_query('mock-media-query', {}, function (err, results) {
                // All results in MOCK_MEDIA_OBJECT_RESULTS are of @type MediaObject,
                // so expect that they're constructed as such
                for (let i in results) {
                    expect(results[i]).toBeA(EosKnowledge.MediaObjectModel);
                }
                done();
            });
        });
    });
});
