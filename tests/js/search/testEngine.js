const Gio = imports.gi.Gio;
const Soup = imports.gi.Soup;

const ArticleObjectModel = imports.search.articleObjectModel;
const ContentObjectModel = imports.search.contentObjectModel;
const Engine = imports.search.engine;
const InstanceOfMatcher = imports.tests.InstanceOfMatcher;
const MediaObjectModel = imports.search.mediaObjectModel;
const MockShard = imports.tests.mockShard;
const QueryObject = imports.search.queryObject;
const SetObjectModel = imports.search.setObjectModel;
const Utils = imports.search.utils;

const MOCK_CONTENT_RESULTS = [
    {
        "@id": "ekn://asoiaf/House_Stark",
        "@type": "ekn://_vocab/ContentObject",
        "title": "House Stark",
        "synopsis": "Winter is Coming",
    },
    {
        "@id": "ekn://marvel/Tony_Stark",
        "@type": "ekn://_vocab/ContentObject",
        "title": "Tony Stark",
        "synopsis": "is actually Iron Man",
    },
];
const MOCK_ARTICLE_RESULTS = [
    {
        "@id": "ekn://asoiaf/House_Stark",
        "@type": "ekn://_vocab/ArticleObject",
        "title": "House Stark",
        "synopsis": "Winter is Coming",
        "articleBody": "Everything's coming up Stark!",
    },
    {
        "@id": "ekn://marvel/Tony_Stark",
        "@type": "ekn://_vocab/ArticleObject",
        "title": "Tony Stark",
        "synopsis": "is actually Iron Man",
        "articleBody": "Fun fact: Iron Man was actually based on Robert Downy Jr.'s life",
    },
];
const MOCK_MEDIA_RESULTS = [
    {
        "@context": "ekn://_context/ImageObject",
        "@type": "ekn://_vocab/ImageObject",
        "@id": "http://img1.wikia.nocookie.net/__cb20130318151721/epicrapbattlesofhistory/images/6/6d/Rick-astley.jpg",
        "title": "Rick Astley: The Man, The Myth, The Legend",
        "tags": ["inspiring", "beautiful"],
        "caption": "Great musician, or greatest?",
        "encodingFormat": "jpg",
        "height": "666",
        "width": "666",
    },
    {
        "@context": "ekn://_context/VideoObject",
        "@type": "ekn://_vocab/VideoObject",
        "@id": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "title": "Never Gonna Give You Up (Never Gonna Let You Down)",
        "transcript": "We're no strangers to love, etc etc etc",
        "tags": ["inspiring", "beautiful"],
        "caption": "If this song was sushi, it would be a Rick Roll",
        "encodingFormat": "mov",
        "duration": "P666S",
        "height": "666",
        "width": "666",
    },
];

describe('Knowledge Engine Module', () => {
    let engine;
    let noop = function () {};

    // Setup a spy in place of the Soup-based request function
    function engine_request_spy() {
        let mock_request = jasmine.createSpy('request');
        engine._send_json_ld_request = mock_request;
        return mock_request;
    }

    // Setup a mocked request function which just returns the mock data.
    // From EOS 2.4 onward, xapian-bridge will return string results instead of
    // JSON, so we stringify all mock_data to emulate this.
    function mock_engine_query(mock_err, mock_results) {
        let mock_data;
        if (mock_results)
            mock_data = { results: mock_results.map(JSON.stringify) };
        mock_engine_request(mock_err, mock_data);
    }

    function mock_engine_request(mock_err, mock_data) {
        spyOn(engine, '_send_json_ld_request').and.callFake((uri,
                                                             cancellable,
                                                             callback) => {
            callback(engine, null);
        });
        spyOn(engine, '_send_json_ld_request_finish');
        if (mock_data) {
            engine._send_json_ld_request_finish.and.returnValue(mock_data);
        } else if (mock_err) {
            engine._send_json_ld_request_finish.and.throwError(mock_err);
        }
    }

    // Fakes out the get_fixed_query method to simply pass through the query
    // object completely untouched.
    function fake_get_fixed_query() {
        spyOn(engine, 'get_fixed_query').and.callFake((query_obj, _, callback) => {
            callback(undefined, query_obj);
        });
        spyOn(engine, 'get_fixed_query_finish').and.callFake((task) => {
            return task;
        });
    }

    function mock_engine_query_with_multiple_values(return_values) {
        spyOn(engine, '_send_json_ld_request').and.callFake((uri,
                                                             cancellable,
                                                             callback) => {
            callback(engine, null);
        });
        spyOn(engine, '_send_json_ld_request_finish').and.callFake(() => {
            let next_result = return_values.shift();
            let stringified_results = next_result.results.map(JSON.stringify);
            next_result.results = stringified_results;
            return next_result;
        });
    }

    function mock_ekn_version (engine, version) {
        engine._ekn_version_from_domain = function(domain) {
            // The rule for our test suite is that domain 'foo' gets
            // the content-path /foo'.
            return version;
        };
    }

    function mock_ekn_shard (shard) {
        if (!shard)
            shard = new MockShard.MockShardFile();

        engine._shard_file_from_domain = (() => shard);
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
        engine = new Engine.Engine();
        engine.default_domain = 'foo';

        // Inject a custom content path finder so we don't hit the disk ever.
        spyOn(engine, '_content_path_from_domain').and.callFake((domain) => {
            // The rule for our test suite is that domain 'foo' gets
            // the content-path /foo'.
            return '/' + domain;
        });

        // Test the newest code paths.
        mock_ekn_version(engine, 2);
    });

    describe('constructor', () => {
        it('should default its port to 3004', () => {
            expect(engine.port).toBe(3004);
        });

        it('should default its hostname to 127.0.0.1', () => {
            expect(engine.host).toBe('127.0.0.1');
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
        beforeEach(() => {
            mock_ekn_shard();
        });

        it('sets order field', () => {
            let query_obj = new QueryObject.QueryObject({
                query: 'tyrion',
                order: QueryObject.QueryObjectOrder.ASCENDING,
            });

            let mock_uri = engine._get_xapian_query_uri(query_obj);
            let mock_query_obj = mock_uri.get_query();
            expect(get_query_vals_for_key(mock_query_obj, 'order')).toEqual('asc');
        });

        it('should use the lang param iff a language is set', () => {
            let query_obj = new QueryObject.QueryObject({
                query: 'tyrion',
            });

            let mock_uri = engine._get_xapian_query_uri(query_obj);
            let mock_query_obj = mock_uri.get_query();
            expect(get_query_vals_for_key(mock_query_obj, 'lang')).toEqual([]);

            engine.language = 'en';
            let mock_uri = engine._get_xapian_query_uri(query_obj);
            let mock_query_obj = mock_uri.get_query();
            expect(get_query_vals_for_key(mock_query_obj, 'lang')).toEqual('en');
        });

        it('sets path correctly', () => {
            let path, uri, query_obj;
            let query_obj = new QueryObject.QueryObject({
                query: 'tyrion',
                domain: 'foo',
            });

            uri = engine._get_xapian_query_uri(query_obj);
            query_obj = uri.get_query();
            expect(get_query_vals_for_key(query_obj, 'path')).toEqual('/foo/db');
        });

        it('allows the default domain path to be overridden', () => {
            let uri, query_obj;
            engine.default_domain_path = '/bar';
            engine._content_path_from_domain.and.callThrough();
            let query_obj = new QueryObject.QueryObject({
                query: 'tyrion',
                domain: 'foo',
            });
            uri = engine._get_xapian_query_uri(query_obj);
            query_obj = uri.get_query();
            expect(get_query_vals_for_key(query_obj, 'path')).toEqual('/bar/db');
        });

        it('calls into QueryObject for other uri fields', () => {
            let fakeCollapse = 5;
            let fakeCutoff = 42;
            let fakeSortBy = 512;
            let fakeQ = 'not a real query string';
            let mock_obj = {
                get_collapse_value: () => fakeCollapse,
                get_cutoff: () => fakeCutoff,
                get_sort_value: () => fakeSortBy,
                get_query_parser_string: () => fakeQ,
            };


            let uri = engine._get_xapian_query_uri(mock_obj);
            mock_obj = uri.get_query();
            expect(get_query_vals_for_key(mock_obj, 'collapse')).toEqual(String(fakeCollapse));
            expect(get_query_vals_for_key(mock_obj, 'cutoff')).toEqual(String(fakeCutoff));
            expect(get_query_vals_for_key(mock_obj, 'sortBy')).toEqual(String(fakeSortBy));
            expect(get_query_vals_for_key(mock_obj, 'q')).toEqual(fakeQ);
        });
    });

    describe('get_xapian_uri (single-file)', () => {
        beforeEach(() => {
            let mock_shard_file = new MockShard.MockShardFile();
            let mock_shard_record = new MockShard.MockShardRecord();

            let mock_data = new MockShard.MockShardBlob();
            mock_data.get_offset = (() => {
                return 65;
            });

            mock_shard_record.data = mock_data;

            mock_shard_file.find_record_by_hex_name.and.callFake((hex_name) => {
                // SHA-1 hash of "xapian-db". See engine.js for details on this API.
                if (hex_name == '209cc19d2a6d85dc097bb7950c2342b81b5c2dea')
                    return mock_shard_record;
                else
                    return fail("Called with the wrong hex name");
            });

            mock_ekn_shard(mock_shard_file);
        });

        it('properly sets db_offset', () => {
            let query_obj = new QueryObject.QueryObject({
                query: 'tyrion',
                order: QueryObject.QueryObjectOrder.ASCENDING,
            });

            let mock_uri = engine._get_xapian_query_uri(query_obj);
            let mock_query_obj = mock_uri.get_query();
            expect(get_query_vals_for_key(mock_query_obj, 'db_offset')).toEqual('65');
        });
    });

    describe('serialize_query', () => {
        it('correctly serializes query args', () => {
            let query_args = {
                path: '/foo',
                query: 'bar',
                offset: 5,
            };
            expect(engine._serialize_query(query_args)).toEqual('path=%2Ffoo&query=bar&offset=5');

            query_args = {
                slarty: 'thing@with@ats',
                bartfast: 'this=that',
            };
            expect(engine._serialize_query(query_args)).toEqual('slarty=thing%40with%40ats&bartfast=this%3Dthat');
        });
    });

    describe('get_object_by_id (EKN v2)', () => {
        let mock_shard_file, mock_shard_record, mock_data, mock_metadata;
        beforeEach(() => {
            mock_shard_file = new MockShard.MockShardFile();
            mock_shard_record = new MockShard.MockShardRecord();

            mock_data = new MockShard.MockShardBlob();
            mock_metadata = new MockShard.MockShardBlob();
            mock_shard_record.data = mock_data;
            mock_shard_record.metadata = mock_metadata;

            mock_ekn_shard(mock_shard_file);
        });

        it('should throw an exception on missing records', (done) => {
            engine.get_object_by_id('whatever', null, function (engine, task) {
                expect(() => engine.get_object_by_id_finish(task)).toThrow();
                done();
            });
        });

        it('marshals ArticleObjectModels based on @type', (done) => {
            let json_stream = Utils.string_to_stream(JSON.stringify({
                '@id': 'ekn://foo/deadbeef',
                '@type': 'ekn://_vocab/ArticleObject',
                'synopsis': 'NOW IS THE WINTER OF OUR DISCONTENT',
            }));
            mock_metadata.get_stream.and.returnValue(json_stream);
            mock_shard_file.find_record_by_hex_name.and.returnValue(mock_shard_record);
            engine.get_object_by_id('whatever', null, function (engine, task) {
                let result = engine.get_object_by_id_finish(task);
                expect(result).toBeA(ArticleObjectModel.ArticleObjectModel);
                expect(result.synopsis).toEqual('NOW IS THE WINTER OF OUR DISCONTENT');
                done();
            });
        });

        it('marshals SetObjectModels based on @type', function (done) {
            let json_stream = Utils.string_to_stream(JSON.stringify({
                '@id': 'ekn://foo/deadbeef',
                '@type': 'ekn://_vocab/SetObject',
                childTags: ['made', 'glorious', 'summer'],
            }));
            mock_metadata.get_stream.and.returnValue(json_stream);
            mock_shard_file.find_record_by_hex_name.and.returnValue(mock_shard_record);
            engine.get_object_by_id('whatever', null, function (engine, task) {
                let result = engine.get_object_by_id_finish(task);
                expect(result).toBeA(SetObjectModel.SetObjectModel);
                expect(result.child_tags).toEqual(jasmine.arrayContaining(['made', 'glorious', 'summer']));
                done();
            });
        });

        it('sets up content stream and content type for html articles', (done) => {
            let mock_content = '<html>foo</html>';
            let html_stream = Utils.string_to_stream(mock_content);
            let metadata_stream = Utils.string_to_stream(JSON.stringify({
                '@id': 'ekn://foo/deadbeef',
                '@type': 'ekn://_vocab/ArticleObject',
                'contentType': 'text/html',
            }));
            mock_data.get_stream.and.returnValue(html_stream);
            mock_metadata.get_stream.and.returnValue(metadata_stream);
            mock_shard_file.find_record_by_hex_name.and.returnValue(mock_shard_record);

            engine.get_object_by_id('whatever', null, (engine, task) => {
                let result = engine.get_object_by_id_finish(task);
                expect(result).toBeA(ArticleObjectModel.ArticleObjectModel);
                expect(result.content_type).toBe('text/html');
                let stream = result.get_content_stream();
                expect(stream).toBeA(Gio.InputStream);
                let html = stream.read_bytes(16, null).get_data().toString();
                expect(html).toBe(mock_content);
                done();
            });
        });

        it('does not call its callback more than once', (done) => {
            let callback_called = 0;
            engine.get_object_by_id('whatever', null, (engine, task) => {
                callback_called++;
            });
            setTimeout(() => {
                expect(callback_called).toEqual(1);
                done();
            }, 25); // pause for a moment for any more callbacks
        });

        it('performs redirect resolution', (done) => {
            let metadata_to_return = [
                {
                    '@id': 'ekn://foo/0123456789abcdef',
                    '@type': 'ekn://_vocab/ArticleObject',
                    redirectsTo: 'ekn://foo/fedcba9876543210',
                },
                {
                    '@id': 'ekn://foo/fedcba9876543210',
                    '@type': 'ekn://_vocab/ArticleObject',
                },
            ];
            mock_shard_file.find_record_by_hex_name.and.callFake(() => {
                let result = JSON.stringify(metadata_to_return.pop());
                let result_stream = Utils.string_to_stream(result);
                mock_metadata.get_stream.and.returnValue(result_stream);
                return mock_shard_record;
            });

            engine.get_object_by_id('ekn://foo/0123456789abcdef', null, (engine, task) => {
                let result = engine.get_object_by_id_finish(task);
                expect(result.ekn_id).toEqual('ekn://foo/fedcba9876543210');
                done();
            });
        });
    });

    describe('get_objects_by_query (EKN v2)', () => {
        beforeEach(() => {
            spyOn(engine, 'get_object_by_id');
            spyOn(engine, 'get_object_by_id_finish');
            fake_get_fixed_query();
            let requested_ids = []
            engine.get_object_by_id.and.callFake((id, cancellable, callback) => {
                requested_ids.push(JSON.parse(id));
                callback(engine, {});
            });
            engine.get_object_by_id_finish.and.callFake(() => {
                return requested_ids.shift();
            });

            mock_ekn_shard();
        });

        it('sends requests', () => {
            let request_spy = engine_request_spy();
            let mock_query = new QueryObject.QueryObject({
                query: 'logorrhea',
            });

            engine.get_objects_by_query(mock_query, null, noop);
            expect(request_spy).toHaveBeenCalled();
        });

        it('requests correct URIs', () => {
            let request_spy = engine_request_spy();
            let mock_query = new QueryObject.QueryObject({
                query: 'logorrhea',
            });

            engine.get_objects_by_query(mock_query, null, noop);
            let last_req_args = request_spy.calls.mostRecent().args;
            let requested_uri = last_req_args[0];
            let requested_query = requested_uri.get_query();
            let requested_uri_string = requested_uri.to_string(false);

            expect(requested_uri_string).toContain('http://127.0.0.1:3004/query?');
            expect(get_query_vals_for_key(requested_query, 'path')).toContain('/foo');
            expect(get_query_vals_for_key(requested_query, 'q')).toContain('logorrhea');
        });

        it('resolves to a list of results from get_object_by_id', (done) => {
            let mock_data = [
                'some result',
                'another result',
                'yet another result',
            ];
            mock_engine_query(undefined, mock_data);

            engine.get_objects_by_query(new QueryObject.QueryObject(), null, (engine, task) => {
                let [results, get_more_results_query] = engine.get_objects_by_query_finish(task);
                expect(results).toEqual(mock_data);
                done();
            });
        });

        it('does not call its callback more than once', (done) => {
            mock_engine_query(new Error('I am an error'), undefined);

            let callback_called = 0;
            engine.get_objects_by_query(new QueryObject.QueryObject(), null, (engine, task) => {
                callback_called++;
            });
            setTimeout(() => {
                expect(callback_called).toEqual(1);
                done();
            }, 25); // pause for a moment for any more callbacks
        });

        it('calls into get_fixed_query', () => {
            let mock_query = new QueryObject.QueryObject({
                query: 'logorrhea',
            });

            engine.get_objects_by_query(mock_query, null, noop);
            expect(engine.get_fixed_query).toHaveBeenCalled();
        });
    });

    describe('runtime objects', function () {
        let model;
        let mock_shard_file, mock_shard_record, mock_metadata;

        beforeEach(function () {
            model = new ContentObjectModel.ContentObjectModel({
                title: 'a',
            });
            engine.add_runtime_object('ekn://foo/1234567890abcdef', model);
            mock_shard_file = new MockShard.MockShardFile();
            mock_shard_record = new MockShard.MockShardRecord();

            mock_metadata = new MockShard.MockShardBlob();
            mock_shard_record.metadata = mock_metadata;

            mock_ekn_shard(mock_shard_file);
        });

        it('can be added', function (done) {
            engine.get_object_by_id('ekn://foo/1234567890abcdef', null, (engine, res) => {
                let retrieved_model = engine.get_object_by_id_finish(res);
                expect(retrieved_model).toBe(model);
                done();
            });
        });

        it('are all returned when querying the "home page" tag', function (done) {
            let model2 = new ContentObjectModel.ContentObjectModel({
                title: 'b',
            });
            engine.add_runtime_object('ekn://foo/fedcba0987654321', model2);
            let query = new QueryObject.QueryObject({
                tags: [ Engine.HOME_PAGE_TAG ],
            });
            engine.get_objects_by_query(query, null, (engine, res) => {
                let [models, get_more] = engine.get_objects_by_query_finish(res);
                expect(models).toContain(model);
                expect(models).toContain(model2);
                expect(models.length).toBe(2);
                expect(get_more).toBeNull();
                done();
            });
        });

        it('do not hit the database', function (done) {
            engine.get_object_by_id('ekn://foo/1234567890abcdef', null, (engine, res) => {
                engine.get_object_by_id_finish(res);
                expect(mock_shard_file.find_record_by_hex_name).not.toHaveBeenCalled();
                done();
            });
        });

        it('mask existing objects with the same ID', function (done) {
            let json_stream = Utils.string_to_stream(JSON.stringify({
                '@id': 'ekn://foo/1234567890abcdef',
                '@type': 'ekn://_vocab/ArticleObject',
            }));
            mock_metadata.get_stream.and.returnValue(json_stream);
            mock_shard_file.find_record_by_hex_name.and.returnValue(mock_shard_record);
            engine.get_object_by_id('ekn://foo/1234567890abcdef', null, (engine, res) => {
                let retrieved_model = engine.get_object_by_id_finish(res);
                expect(retrieved_model).toBe(model);
                done();
            });
        });
    });

    describe('get_fixed_query', () => {
        beforeEach(() => {
            mock_ekn_shard();
        });

        it('should set the stopword-free-query property of a query object', (done) => {
            let mock_correction = {
                'stopWordCorrectedQuery': 'a query with no stop words',
            };
            let mock_query_obj = new QueryObject.QueryObject({
                query: 'a query with lots of stop words',
            });
            mock_engine_request(undefined, mock_correction);
            engine.get_fixed_query(mock_query_obj, null, (engine, task) => {
                let fixed_query_obj = engine.get_fixed_query_finish(task);
                expect(fixed_query_obj.stopword_free_query).toEqual('a query with no stop words');
                done();
            });
        });
    });

    describe('preloading', () => {
        it('will init the shard', function () {
            let mock_shard_file = new MockShard.MockShardFile();
            mock_ekn_shard(mock_shard_file);
            engine.preload_default_domain();
            expect(mock_shard_file.init_async).toHaveBeenCalled();
        });
    });

    describe('v1 compatibility', () => {
        beforeEach(() => {
            mock_ekn_version(engine, 1);
            fake_get_fixed_query();
            mock_ekn_shard();
        });

        describe('get_objects_by_query', () => {
            it('sends requests', () => {
                let request_spy = engine_request_spy();
                let mock_query = new QueryObject.QueryObject({
                    query: 'logorrhea',
                });

                engine.get_objects_by_query(mock_query, null, noop);
                expect(request_spy).toHaveBeenCalled();
            });

            it('requests correct URIs', () => {
                let request_spy = engine_request_spy();
                let mock_query = new QueryObject.QueryObject({
                    query: 'logorrhea',
                });

                engine.get_objects_by_query(mock_query, null, noop);
                let last_req_args = request_spy.calls.mostRecent().args;
                let requested_uri = last_req_args[0];
                let requested_query = requested_uri.get_query();
                let requested_uri_string = requested_uri.to_string(false);

                expect(requested_uri_string).toContain('http://127.0.0.1:3004/query?');
                expect(get_query_vals_for_key(requested_query, 'path')).toContain('/foo');
                expect(get_query_vals_for_key(requested_query, 'q')).toContain('logorrhea');
            });

            it ("throws an error on unsupported JSON-LD type", (done) => {
                let notSearchResults = [
                    { "@type": "ekv:ArticleObject", "synopsis": "dolla dolla bill y'all" }
                ];
                mock_engine_query(undefined, notSearchResults);

                engine.get_objects_by_query(new QueryObject.QueryObject(), null, (engine, task) => {
                    expect(() => { engine.get_objects_by_query_finish(task); }).toThrow();
                    done();
                });
            });

            it ("throws an error on unsupported search results", (done) => {
                let badObjectResults = [{ "@type": "ekv:Kitten" }];
                mock_engine_query(undefined, badObjectResults);
                engine.get_objects_by_query(new QueryObject.QueryObject(), null, (engine, task) => {
                    expect(() => { engine.get_objects_by_query_finish(task); }).toThrow();
                    done();
                });
            });

            it ("resolves to a list of results if jsonld is valid", (done) => {
                mock_engine_query(undefined, MOCK_ARTICLE_RESULTS);

                engine.get_objects_by_query(new QueryObject.QueryObject(), null, (engine, task) => {
                    let [results, get_more_results_query] = engine.get_objects_by_query_finish(task);
                    expect(results).toBeDefined();
                    done();
                });
            });

            it ("constructs a list of content objects based on @type", (done) => {
                mock_engine_query(undefined, MOCK_CONTENT_RESULTS);
                engine.get_objects_by_query(new QueryObject.QueryObject(), null, (engine, task) => {
                    let [results, get_more_results_query] = engine.get_objects_by_query_finish(task);
                    // All results in MOCK_CONTENT_OBJECT_RESULTS are of @type ContentObject,
                    // so expect that they're constructed as such
                    for (let i in results) {
                        expect(results[i]).toBeA(ContentObjectModel.ContentObjectModel);
                    }
                    done();
                });
            });

            it ("constructs a list of article objects based on @type", (done) => {
                mock_engine_query(undefined, MOCK_ARTICLE_RESULTS);
                engine.get_objects_by_query(new QueryObject.QueryObject(), null, (engine, task) => {
                    let [results, get_more_results_query] = engine.get_objects_by_query_finish(task);
                    // All results in MOCK_ARTICLE_OBJECT_RESULTS are of @type ArticleObject,
                    // so expect that they're constructed as such
                    for (let i in results) {
                        expect(results[i]).toBeA(ArticleObjectModel.ArticleObjectModel);
                    }
                    done();
                });
            });

            it ("constructs a list of media objects based on @type", (done) => {
                mock_engine_query(undefined, MOCK_MEDIA_RESULTS);
                engine.get_objects_by_query(new QueryObject.QueryObject(), null, (engine, task) => {
                    let [results, get_more_results_query] = engine.get_objects_by_query_finish(task);
                    // All results in MOCK_MEDIA_OBJECT_RESULTS are of @type MediaObject,
                    // so expect that they're constructed as such
                    for (let i in results) {
                        expect(results[i]).toBeA(MediaObjectModel.MediaObjectModel);
                    }
                    done();
                });
            });

            it('does not call its callback more than once', (done) => {
                mock_engine_query(new Error('I am an error'), undefined);

                let callback_called = 0;
                engine.get_objects_by_query(new QueryObject.QueryObject(), null, (engine, task) => {
                    callback_called++;
                });
                setTimeout(() => {
                    expect(callback_called).toEqual(1);
                    done();
                }, 25); // pause for a moment for any more callbacks
            });

            it('performs redirect resolution', (done) => {
                mock_engine_query(undefined, [
                    {
                        '@id': 'ekn://foo/aaaabbbbccccddd2',
                        '@type': 'ekn://_vocab/ArticleObject',
                        redirectsTo: 'ekn://foo/aaaabbbbccccddd3',
                    },
                    {
                        '@id': 'ekn://foo/0000000000000003',
                        '@type': 'ekn://_vocab/ArticleObject',
                    },
                ]);
                let redirect = new ArticleObjectModel.ArticleObjectModel();
                spyOn(engine, 'get_object_by_id').and.callFake((id, cancellable, callback) => {
                    callback(engine, null);
                });
                spyOn(engine, 'get_object_by_id_finish').and.returnValue(redirect);
                engine.get_objects_by_query(new QueryObject.QueryObject(), null, (engine, task) => {
                    let [results, get_more_results_query] = engine.get_objects_by_query_finish(task);
                    expect(results[0]).toBe(redirect);
                    expect(results[1].ekn_id).toBe('ekn://foo/0000000000000003');
                    expect(engine.get_object_by_id).toHaveBeenCalledWith('ekn://foo/aaaabbbbccccddd3',
                                                                         jasmine.any(Object),
                                                                         jasmine.any(Function));
                    done();
                });
            });

            it('handles 404s when fetching redirects', (done) => {
                mock_engine_query(undefined, [
                    {
                        '@id': 'ekn://foo/aaaabbbbccccddd2',
                        '@type': 'ekn://_vocab/ArticleObject',
                        redirectsTo: 'ekn://foo/aaaabbbbccccddd3',
                    },
                ]);
                spyOn(engine, 'get_object_by_id').and.callFake((id, cancellable, callback) => {
                    callback(engine, null);
                });
                spyOn(engine, 'get_object_by_id_finish').and.throwError();
                engine.get_objects_by_query(new QueryObject.QueryObject(), null, (engine, task) => {
                    expect(() => { engine.get_objects_by_query_finish(task); }).toThrow();
                    done();
                });
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
                engine.get_object_by_id('ekn://foo/0123456789abcdef', cancellable, noop);
                cancellable.cancel();
                expect(engine._http_session.cancel_message).toHaveBeenCalled();
                let message = engine._http_session.cancel_message.calls.mostRecent().args[0];
                // Make sure we are canceling the right Soup Message
                expect(message).toBeA(Soup.Message);
                expect(message.uri.to_string(true)).toMatch('0123456789abcdef');
            });

            it('does not make a request if already cancelled', () => {
                let cancellable = new Gio.Cancellable();
                cancellable.cancel();
                engine.get_object_by_id('ekn://foo/0123456789abcdef', cancellable, noop);
                expect(engine._http_session.queue_message).not.toHaveBeenCalled();
            });
        });

        describe('get_object_by_id', () => {
            it('sends requests', () => {
                let request_spy = engine_request_spy();
                let mock_id = 'ekn://foo/0123456789abcdef';

                engine.get_object_by_id(mock_id, null, noop);
                expect(request_spy).toHaveBeenCalled();
            });

            it('sends correct request URIs', () => {
                let request_spy = engine_request_spy();
                let mock_id = 'ekn://foo/0123456789abcdef';

                engine.get_object_by_id(mock_id, null, noop);
                let last_req_args = request_spy.calls.mostRecent().args;
                let requested_uri = last_req_args[0];
                let requested_query = requested_uri.get_query();
                let requested_uri_string = requested_uri.to_string(false);

                expect(requested_uri_string).toMatch(/^http:\/\/127.0.0.1:3004\/query?/);
                expect(get_query_vals_for_key(requested_query, 'path')).toMatch('/foo');
            });

            it('uses correct domain for id', () => {
                let request_spy = engine_request_spy();
                let mock_id = 'ekn://new_domain/0123456789abcdef';

                engine.get_object_by_id(mock_id, null, noop);
                let last_req_args = request_spy.calls.mostRecent().args;
                let requested_uri = last_req_args[0];
                let requested_query = requested_uri.get_query();

                expect(get_query_vals_for_key(requested_query, 'path')).toMatch('/new_domain');
            });

            it('marshals ArticleObjectModels based on @type', (done) => {
                let mock_id = 'ekn://foo/0123456789abcdef';
                mock_engine_query(undefined, [{
                    '@id': mock_id,
                    '@type': 'ekn://_vocab/ArticleObject',
                    'synopsis': 'NOW IS THE WINTER OF OUR DISCONTENT',
                }]);

                engine.get_object_by_id(mock_id, null, (engine, task) => {
                    let result = engine.get_object_by_id_finish(task);
                    expect(result).toBeA(ArticleObjectModel.ArticleObjectModel);
                    expect(result.synopsis).toBe('NOW IS THE WINTER OF OUR DISCONTENT');
                    done();
                });
            });

            it('marshals SetObjectModels based on @type', function (done) {
                let mock_id = 'ekn://foo/0123456789abcdef';
                mock_engine_query(undefined, [{
                    '@id': mock_id,
                    '@type': 'ekn://_vocab/SetObject',
                    childTags: ['made', 'glorious', 'summer'],
                }]);
                engine.get_object_by_id(mock_id, null, function (engine, task) {
                    let result = engine.get_object_by_id_finish(task);
                    expect(result).toBeA(SetObjectModel.SetObjectModel);
                    expect(result.child_tags).toEqual(jasmine.arrayContaining(['made', 'glorious', 'summer']));
                    done();
                });
            });

            it('sets up content stream and content type for html articles', (done) => {
                let mock_id = 'ekn://foo/0123456789abcdef';
                let mock_content = '<html>foo</html>';
                mock_engine_query(undefined, [{
                    '@id': mock_id,
                    '@type': 'ekn://_vocab/ArticleObject',
                    'articleBody': mock_content,
                }]);

                engine.get_object_by_id(mock_id, null, (engine, task) => {
                    let result = engine.get_object_by_id_finish(task);
                    expect(result).toBeA(ArticleObjectModel.ArticleObjectModel);
                    expect(result.content_type).toBe('text/html');
                    let stream = result.get_content_stream();
                    expect(stream).toBeA(Gio.InputStream);
                    let html = stream.read_bytes(16, null).get_data().toString();
                    expect(html).toBe(mock_content);
                    done();
                });
            });

            it('does not call its callback more than once', (done) => {
                let mock_id = 'ekn://foo/0123456789abcdef';
                mock_engine_query(new Error('I am an error'), undefined);

                let callback_called = 0;
                engine.get_object_by_id(mock_id, null, (engine, task) => {
                    callback_called++;
                });
                setTimeout(() => {
                    expect(callback_called).toEqual(1);
                    done();
                }, 25); // pause for a moment for any more callbacks
            });

            it('performs redirect resolution', (done) => {
                mock_engine_query_with_multiple_values([
                    {
                        results: [{
                            '@id': 'ekn://foo/0123456789abcdef',
                            '@type': 'ekn://_vocab/ArticleObject',
                            redirectsTo: 'ekn://foo/fedcba9876543210',
                        }],
                    },
                    {
                        results: [{
                            '@id': 'ekn://foo/fedcba9876543210',
                            '@type': 'ekn://_vocab/ArticleObject',
                        }],
                    },
                ]);
                engine.get_object_by_id('ekn://foo/0123456789abcdef', null, (engine, task) => {
                    let result = engine.get_object_by_id_finish(task);
                    expect(result.ekn_id).toEqual('ekn://foo/fedcba9876543210');
                    done();
                });
            });

            it('handles 404 when fetching redirects', (done) => {
                mock_engine_query_with_multiple_values([
                    {
                        results: [{
                            '@id': 'ekn://foo/0123456789abcdef',
                            '@type': 'ekn://_vocab/ArticleObject',
                            redirectsTo: 'ekn://foo/0000000000000000',
                        }],
                    },
                    {
                        results: [],
                    },
                ]);
                engine.get_object_by_id('ekn://foo/0123456789abcdef', null, (engine, task) => {
                    expect(() => { engine.get_object_by_id_finish(task); }).toThrow();
                    done();
                });
            });
        });
    });
});
