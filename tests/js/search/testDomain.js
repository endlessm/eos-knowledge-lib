const Gio = imports.gi.Gio;

const ArticleObjectModel = imports.search.articleObjectModel;
const ContentObjectModel = imports.search.contentObjectModel;
const Engine = imports.search.engine;
const QueryObject = imports.search.queryObject;
const MediaObjectModel = imports.search.mediaObjectModel;
const SetObjectModel = imports.search.setObjectModel;
const Utils = imports.search.utils;

const MockShard = imports.tests.mockShard;
const InstanceOfMatcher = imports.tests.InstanceOfMatcher;

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
        "contentType": "image/jpeg",
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
        "contentType": "video/quicktime",
        "duration": "P666S",
        "height": "666",
        "width": "666",
    },
];

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

describe('DomainV1', function () {
    let domain;

    beforeEach(function () {
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);

        let engine = new Engine.Engine();
        let bridge = engine._xapian_bridge;

        spyOn(Utils, 'get_ekn_version_for_domain').and.returnValue(1);
        domain = engine._get_domain('foo');

        // Don't hit the disk.
        domain._content_path = '/foo';
    });

    // Setup a spy in place of the Soup-based request function
    function domain_request_spy(mock_results) {
        let bridge = domain._xapian_bridge;
        let request_spy = spyOn(bridge, '_send_json_ld_request').and.callFake(function (uri, cancellable, callback) {
            callback(bridge, null);
        });
        spyOn(bridge, '_send_json_ld_request_finish').and.returnValue(mock_results);
        return request_spy;
    }

    // Setup a mocked request function which just returns the mock data.
    // From EOS 2.4 onward, xapian-bridge will return string results instead of
    // JSON, so we stringify all mock_data to emulate this.
    function mock_query(mock_err, mock_results) {
        let bridge = domain._xapian_bridge;
        spyOn(bridge, 'query').and.callFake(function (uri, domain_params, cancellable, callback) {
            callback(bridge, null);
        });
        spyOn(bridge, 'query_finish');
        if (mock_results) {
            let mock_data = { results: mock_results.map(JSON.stringify) };
            bridge.query_finish.and.returnValue(mock_data);
        } else if (mock_err) {
            bridge.query_finish.and.throwError(mock_err);
        }
    }

    function mock_query_with_multiple_values(return_values) {
        let bridge = domain._xapian_bridge;
        spyOn(bridge, 'query').and.callFake(function (uri, domain_params, cancellable, callback) {
            callback(bridge, null);
        });
        spyOn(bridge, 'query_finish').and.callFake(function () {
            let next_result = return_values.shift();
            let stringified_results = next_result.results.map(JSON.stringify);
            next_result.results = stringified_results;
            return next_result;
        });
    }

    describe('get_object_by_id', function () {
        it('sends requests', function (done) {
            let mock_id = 'ekn://foo/0123456789abcdef';
            let request_spy = domain_request_spy({ results: ["0"] });

            domain.get_object_by_id(mock_id, null, function (domain, task) {
                try {
                    let result = domain.get_object_by_id_finish(task);
                } catch(e) {
                    // This is normal to throw above, because my results are fake.
                    // We just want to make sure the request was made.
                }
                expect(request_spy).toHaveBeenCalled();
                done();
            });
        });

        it('sends correct request URIs', function (done) {
            let mock_id = 'ekn://foo/0123456789abcdef';
            let request_spy = domain_request_spy({ results: ["0"] });

            domain.get_object_by_id(mock_id, null, function (domain, task) {
                try {
                    let result = domain.get_object_by_id_finish(task);
                } catch(e) {
                }

                let last_req_args = request_spy.calls.mostRecent().args;
                let requested_uri = last_req_args[0];
                let requested_query = requested_uri.get_query();
                let requested_uri_string = requested_uri.to_string(false);

                expect(requested_uri_string).toMatch(/^http:\/\/127.0.0.1:3004\/query?/);
                expect(get_query_vals_for_key(requested_query, 'path')).toMatch('/foo');
                done();
            });
        });

        it('marshals ArticleObjectModels based on @type', function (done) {
            let mock_id = 'ekn://foo/0123456789abcdef';
            mock_query(undefined, [{
                '@id': mock_id,
                '@type': 'ekn://_vocab/ArticleObject',
                'synopsis': 'NOW IS THE WINTER OF OUR DISCONTENT',
            }]);

            domain.get_object_by_id(mock_id, null, function (domain, task) {
                let result = domain.get_object_by_id_finish(task);
                expect(result).toBeA(ArticleObjectModel.ArticleObjectModel);
                expect(result.synopsis).toBe('NOW IS THE WINTER OF OUR DISCONTENT');
                done();
            });
        });

        it('marshals SetObjectModels based on @type', function (done) {
            let mock_id = 'ekn://foo/0123456789abcdef';
            mock_query(undefined, [{
                '@id': mock_id,
                '@type': 'ekn://_vocab/SetObject',
                childTags: ['made', 'glorious', 'summer'],
            }]);
            domain.get_object_by_id(mock_id, null, function (domain, task) {
                let result = domain.get_object_by_id_finish(task);
                expect(result).toBeA(SetObjectModel.SetObjectModel);
                expect(result.child_tags).toEqual(jasmine.arrayContaining(['made', 'glorious', 'summer']));
                done();
            });
        });

        it('sets up content stream and content type for html articles', function (done) {
            let mock_id = 'ekn://foo/0123456789abcdef';
            let mock_content = '<html>foo</html>';
            mock_query(undefined, [{
                '@id': mock_id,
                '@type': 'ekn://_vocab/ArticleObject',
                'articleBody': mock_content,
            }]);

            domain.get_object_by_id(mock_id, null, function (domain, task) {
                let result = domain.get_object_by_id_finish(task);
                expect(result).toBeA(ArticleObjectModel.ArticleObjectModel);
                expect(result.content_type).toBe('text/html');
                let stream = result.get_content_stream();
                expect(stream).toBeA(Gio.InputStream);
                let html = stream.read_bytes(16, null).get_data().toString();
                expect(html).toBe(mock_content);
                done();
            });
        });

        it('does not call its callback more than once', function (done) {
            let mock_id = 'ekn://foo/0123456789abcdef';
            mock_query(new Error('I am an error'), undefined);

            let callback_called = 0;
            domain.get_object_by_id(mock_id, null, function (domain, task) {
                callback_called++;
            });
            setTimeout(function () {
                expect(callback_called).toEqual(1);
                done();
            }, 25); // pause for a moment for any more callbacks
        });

        it('performs redirect resolution', function (done) {
            mock_query_with_multiple_values([
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
            domain.get_object_by_id('ekn://foo/0123456789abcdef', null, function (domain, task) {
                let result = domain.get_object_by_id_finish(task);
                expect(result.ekn_id).toEqual('ekn://foo/fedcba9876543210');
                done();
            });
        });

        it('handles 404 when fetching redirects', function (done) {
            mock_query_with_multiple_values([
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
            domain.get_object_by_id('ekn://foo/0123456789abcdef', null, function (domain, task) {
                expect(function () { domain.get_object_by_id_finish(task); }).toThrow();
                done();
            });
        });
    });

    describe('get_objects_by_query', function () {
        it('sends requests', function (done) {
            let request_spy = domain_request_spy({ results: ["0"] });
            let mock_query = new QueryObject.QueryObject({
                query: 'logorrhea',
            });

            domain.get_objects_by_query(mock_query, null, function (domain, task) {
                try {
                    let result = domain.get_object_by_id_finish(task);
                } catch(e) {
                    // This is normal to throw above, because my results are fake.
                    // We just want to make sure the request was made.
                }

                expect(request_spy).toHaveBeenCalled();
                done();
            });
        });

        it('requests correct URIs', function (done) {
            let request_spy = domain_request_spy({ results: ["0"] });
            let mock_query = new QueryObject.QueryObject({
                query: 'logorrhea',
            });


            domain.get_objects_by_query(mock_query, null, function (domain, task) {
                try {
                    let result = domain.get_object_by_id_finish(task);
                } catch(e) {
                    // This is normal to throw above, because my results are fake.
                    // We just want to make sure the request was made.
                }

                let last_req_args = request_spy.calls.mostRecent().args;
                let requested_uri = last_req_args[0];
                let requested_query = requested_uri.get_query();
                let requested_uri_string = requested_uri.to_string(false);

                expect(requested_uri_string).toContain('http://127.0.0.1:3004/query?');
                expect(get_query_vals_for_key(requested_query, 'path')).toContain('/foo');
                expect(get_query_vals_for_key(requested_query, 'q')).toContain('logorrhea');

                done();
            });
        });

        it ("throws an error on unsupported JSON-LD type", function (done) {
            let notSearchResults = [
                { "@type": "ekv:ArticleObject", "synopsis": "dolla dolla bill y'all" }
            ];
            mock_query(undefined, notSearchResults);

            domain.get_objects_by_query(new QueryObject.QueryObject(), null, function (domain, task) {
                expect(function () { domain.get_objects_by_query_finish(task); }).toThrow();
                done();
            });
        });

        it ("throws an error on unsupported search results", function (done) {
            let badObjectResults = [{ "@type": "ekv:Kitten" }];
            mock_query(undefined, badObjectResults);
            domain.get_objects_by_query(new QueryObject.QueryObject(), null, function (domain, task) {
                expect(function () { domain.get_objects_by_query_finish(task); }).toThrow();
                done();
            });
        });

        it ("resolves to a list of results if jsonld is valid", function (done) {
            mock_query(undefined, MOCK_ARTICLE_RESULTS);

            domain.get_objects_by_query(new QueryObject.QueryObject(), null, function (domain, task) {
                let results = domain.get_objects_by_query_finish(task);
                expect(results).toBeDefined();
                done();
            });
        });

        it ("constructs a list of content objects based on @type", function (done) {
            mock_query(undefined, MOCK_CONTENT_RESULTS);
            domain.get_objects_by_query(new QueryObject.QueryObject(), null, function (domain, task) {
                let results = domain.get_objects_by_query_finish(task);
                // All results in MOCK_CONTENT_OBJECT_RESULTS are of @type ContentObject,
                // so expect that they're constructed as such
                for (let i in results) {
                    expect(results[i]).toBeA(ContentObjectModel.ContentObjectModel);
                }
                done();
            });
        });

        it ("constructs a list of article objects based on @type", function (done) {
            mock_query(undefined, MOCK_ARTICLE_RESULTS);
            domain.get_objects_by_query(new QueryObject.QueryObject(), null, function (domain, task) {
                let results = domain.get_objects_by_query_finish(task);
                // All results in MOCK_ARTICLE_OBJECT_RESULTS are of @type ArticleObject,
                // so expect that they're constructed as such
                for (let i in results) {
                    expect(results[i]).toBeA(ArticleObjectModel.ArticleObjectModel);
                }
                done();
            });
        });

        it ("constructs a list of media objects based on @type", function (done) {
            mock_query(undefined, MOCK_MEDIA_RESULTS);
            domain.get_objects_by_query(new QueryObject.QueryObject(), null, function (domain, task) {
                let results = domain.get_objects_by_query_finish(task);
                // All results in MOCK_MEDIA_OBJECT_RESULTS are of @type MediaObject,
                // so expect that they're constructed as such
                for (let i in results) {
                    expect(results[i]).toBeA(MediaObjectModel.MediaObjectModel);
                }
                done();
            });
        });

        it('does not call its callback more than once', function (done) {
            mock_query(new Error('I am an error'), undefined);

            let callback_called = 0;
            domain.get_objects_by_query(new QueryObject.QueryObject(), null, function (domain, task) {
                callback_called++;
            });
            setTimeout(function () {
                expect(callback_called).toEqual(1);
                done();
            }, 25); // pause for a moment for any more callbacks
        });

        it('performs redirect resolution', function (done) {
            mock_query(undefined, [
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
            spyOn(domain, 'get_object_by_id').and.callFake(function (id, cancellable, callback) {
                callback(domain, null);
            });
            spyOn(domain, 'get_object_by_id_finish').and.returnValue(redirect);

            domain.get_objects_by_query(new QueryObject.QueryObject(), null, function (domain, task) {
                let results = domain.get_objects_by_query_finish(task);
                expect(results[0]).toBe(redirect);
                expect(results[1].ekn_id).toBe('ekn://foo/0000000000000003');
                expect(domain.get_object_by_id).toHaveBeenCalledWith('ekn://foo/aaaabbbbccccddd3',
                                                                     jasmine.any(Object),
                                                                     jasmine.any(Function));
                done();
            });
        });

        it('handles 404s when fetching redirects', function (done) {
            mock_query(undefined, [
                {
                    '@id': 'ekn://foo/aaaabbbbccccddd2',
                    '@type': 'ekn://_vocab/ArticleObject',
                    redirectsTo: 'ekn://foo/aaaabbbbccccddd3',
                },
            ]);
            spyOn(domain, 'get_object_by_id').and.callFake(function (id, cancellable, callback) {
                callback(domain, null);
            });
            spyOn(domain, 'get_object_by_id_finish').and.throwError();
            domain.get_objects_by_query(new QueryObject.QueryObject(), null, function (domain, task) {
                expect(function () { domain.get_objects_by_query_finish(task); }).toThrow();
                done();
            });
        });
    });
});

describe('DomainV2', function () {
    let domain, mock_shard_file, mock_shard_record, mock_data, mock_metadata;

    beforeEach(function () {
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);

        let engine = new Engine.Engine();
        let bridge = engine._xapian_bridge;

        spyOn(Utils, 'get_ekn_version_for_domain').and.callFake(function () 2);
        domain = engine._get_domain('foo');

        // Don't hit the disk.
        domain._content_path = '/foo';
        spyOn(domain, 'load').and.callFake(function (cancellable, callback) {
            callback(null);
        });
        spyOn(domain, 'load_finish').and.callFake(function () {
            return null;
        });

        mock_shard_file = new MockShard.MockShardFile();
        mock_shard_record = new MockShard.MockShardRecord();

        mock_data = new MockShard.MockShardBlob();
        mock_metadata = new MockShard.MockShardBlob();
        mock_shard_record.data = mock_data;
        mock_shard_record.metadata = mock_metadata;

        mock_ekn_shard(mock_shard_file);
    });

    function mock_ekn_shard (shard_file) {
        domain._shard_file = shard_file;
    }

    describe('get_object_by_id', function () {
        it('should throw an exception on missing records', function (done) {
            domain.get_object_by_id('whatever', null, function (domain, task) {
                expect(function () domain.get_object_by_id_finish(task)).toThrow();
                done();
            });
        });

        it('marshals ArticleObjectModels based on @type', function (done) {
            let json_stream = Utils.string_to_stream(JSON.stringify({
                '@id': 'ekn://foo/deadbeef',
                '@type': 'ekn://_vocab/ArticleObject',
                'synopsis': 'NOW IS THE WINTER OF OUR DISCONTENT',
            }));
            mock_metadata.get_stream.and.returnValue(json_stream);
            mock_shard_file.find_record_by_hex_name.and.returnValue(mock_shard_record);
            domain.get_object_by_id('whatever', null, function (domain, task) {
                let result = domain.get_object_by_id_finish(task);
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
            domain.get_object_by_id('whatever', null, function (domain, task) {
                let result = domain.get_object_by_id_finish(task);
                expect(result).toBeA(SetObjectModel.SetObjectModel);
                expect(result.child_tags).toEqual(jasmine.arrayContaining(['made', 'glorious', 'summer']));
                done();
            });
        });

        it('sets up content stream and content type for html articles', function (done) {
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

            domain.get_object_by_id('whatever', null, function (domain, task) {
                let result = domain.get_object_by_id_finish(task);
                expect(result).toBeA(ArticleObjectModel.ArticleObjectModel);
                expect(result.content_type).toBe('text/html');
                let stream = result.get_content_stream();
                expect(stream).toBeA(Gio.InputStream);
                let html = stream.read_bytes(16, null).get_data().toString();
                expect(html).toBe(mock_content);
                done();
            });
        });

        it('does not call its callback more than once', function (done) {
            let callback_called = 0;
            domain.get_object_by_id('whatever', null, function () {
                callback_called++;
            });
            setTimeout(function () {
                expect(callback_called).toEqual(1);
                done();
            }, 25); // pause for a moment for any more callbacks
        });

        it('performs redirect resolution', function (done) {
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
            mock_shard_file.find_record_by_hex_name.and.callFake(function () {
                let result = JSON.stringify(metadata_to_return.pop());
                let result_stream = Utils.string_to_stream(result);
                mock_metadata.get_stream.and.returnValue(result_stream);
                return mock_shard_record;
            });

            domain.get_object_by_id('ekn://foo/fedcba9876543210', null, function (domain, task) {
                let result = domain.get_object_by_id_finish(task);
                expect(result.ekn_id).toEqual('ekn://foo/fedcba9876543210');
                done();
            });
        });
    });

    describe('get_objects_by_query', function () {
        beforeEach(function () {
            let requested_ids = [];
            spyOn(domain, 'resolve_xapian_result').and.callFake(function (id, cancellable, callback) {
                requested_ids.push(JSON.parse(id));
                callback(domain, {});
            });
            spyOn(domain, 'resolve_xapian_result_finish').and.callFake(function () {
                return requested_ids.shift();
            });
        });

        // Setup a mocked request function which just returns the mock data.
        // From EOS 2.4 onward, xapian-bridge will return string results instead of
        // JSON, so we stringify all mock_data to emulate this.
        function mock_query(mock_err, mock_results) {
            let bridge = domain._xapian_bridge;
            spyOn(bridge, 'query').and.callFake(function (query_obj, domain_params, cancellable, callback) {
                callback(bridge, null);
            });
            spyOn(bridge, 'query_finish');
            if (mock_results) {
                let mock_data = { results: mock_results.map(JSON.stringify) };
                bridge.query_finish.and.returnValue(mock_data);
            } else if (mock_err) {
                bridge.query_finish.and.throwError(mock_err);
            }
        }

        it('resolves to a list of results from get_object_by_id', function (done) {
            let mock_data = [
                'some result',
                'another result',
                'yet another result',
            ];
            mock_query(undefined, mock_data);

            domain.get_objects_by_query(new QueryObject.QueryObject(), null, function (domain, task) {
                let results = domain.get_objects_by_query_finish(task);
                expect(results).toEqual(mock_data);
                done();
            });
        });

        it('does not call its callback more than once', function (done) {
            mock_query(new Error('I am an error'), undefined);

            let callback_called = 0;
            domain.get_objects_by_query(new QueryObject.QueryObject(), null, function () {
                callback_called++;
            });
            setTimeout(function () {
                expect(callback_called).toEqual(1);
                done();
            }, 25); // pause for a moment for any more callbacks
        });
    });
});
