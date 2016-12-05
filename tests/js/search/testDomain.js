const Eknc = imports.gi.EosKnowledgeContent;
const Gio = imports.gi.Gio;

const Datadir = imports.search.datadir;
const Domain = imports.search.domain;
const Engine = imports.search.engine;
const QueryObject = imports.search.queryObject;
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

function create_mock_domain_for_version (versionNo) {
    let engine = new Engine.Engine();
    let bridge = engine._xapian_bridge;

    spyOn(Domain, 'get_ekn_version').and.callFake(() => versionNo);
    let domain = engine._get_domain('foo');

    // Don't hit the disk.
    domain._content_dir = Gio.File.new_for_path('/foo');

    return domain;
}

function create_mock_shard_with_link_table (link_table_hash) {
    let mock_shard_file = new MockShard.MockShardFile();

    if (link_table_hash) {
        let mock_shard_record = new MockShard.MockShardRecord();
        let mock_data = new MockShard.MockShardBlob();
        let mock_dictionary = new MockShard.MockDictionary(link_table_hash);

        mock_shard_file.find_record_by_hex_name.and.callFake((hex) => mock_shard_record);
        mock_shard_record.data = mock_data;
        spyOn(mock_data, 'load_as_dictionary').and.callFake(() => mock_dictionary);

    } else {
        mock_shard_file.find_record_by_hex_name.and.callFake((hex) => null);
    }

    return mock_shard_file;
}

describe('Domain', function () {
    describe('get_ekn_version', function () {
        it('should throw an exception when datadir can\'t be found', function () {
            spyOn(Datadir, 'get_data_dir').and.returnValue(undefined);

            let expectedError = new Error("Could not find data dir for app ID abc");

            expect(() => Domain.get_ekn_version("abc")).toThrow(expectedError);
        });
    });
});

describe('DomainV2', function () {
    let domain, mock_shard_file, mock_shard_record, mock_data, mock_metadata;

    beforeEach(function () {
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);

        domain = create_mock_domain_for_version(2);

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
        domain._setup_link_table();
    }

    describe('get_object_by_id', function () {
        it('should throw an exception on missing records', function (done) {
            domain.get_object_by_id('whatever', null, function (domain, task) {
                expect(() => domain.get_object_by_id_finish(task)).toThrow();
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
                expect(result).toBeA(Eknc.ArticleObjectModel);
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
                expect(result).toBeA(Eknc.SetObjectModel);
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
                expect(result).toBeA(Eknc.ArticleObjectModel);
                expect(result.content_type).toBe('text/html');
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
    });

    describe('get_objects_by_query', function () {
        const UPPER_BOUND = 50;
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
                let mock_data = {
                    results: mock_results.map(JSON.stringify),
                    upperBound: UPPER_BOUND,
                };
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
                let [results, info] = domain.get_objects_by_query_finish(task);
                expect(results).toEqual(mock_data);
                expect(info.upper_bound).toEqual(UPPER_BOUND);
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

    describe('test_link', function () {
        it('returns false when no link table exists', function () {
            mock_ekn_shard(create_mock_shard_with_link_table(null));
            expect(domain.test_link('foo')).toEqual(false);
        });

        it('returns entries from the link table when it does exist', function () {
            mock_ekn_shard(create_mock_shard_with_link_table({
                'foo': 'bar',
            }));
            expect(domain.test_link('foo')).toEqual('bar');
        });

        it('returns false when the link table does not contain a link', function () {
            mock_ekn_shard(create_mock_shard_with_link_table({
                'foo': 'bar',
            }));
            expect(domain.test_link('123')).toEqual(false);
        });
    });
});

describe('DomainV3', () => {
    let domain;

    beforeEach(function () {
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);
        domain = create_mock_domain_for_version(3);
    });

    describe('test_link', function () {
        function mock_ekn_link_tables (link_table_hashes) {
            let shards = link_table_hashes.map(create_mock_shard_with_link_table);
            domain._shards = shards;
            domain._setup_link_tables();
        }

        it('returns false when no link table exists', function () {
            mock_ekn_link_tables([null]);
            expect(domain.test_link('foo')).toEqual(false);
        });

        it('returns entries from a link table which contains the link', function () {
            mock_ekn_link_tables([
                { 'foo': 'bar' },
                { 'bar': 'baz' },
            ]);
            expect(domain.test_link('foo')).toEqual('bar');
        });

        it('returns false when no link table contains the link', function () {
            mock_ekn_link_tables([
                { 'foo': 'bar' },
                { 'bar': 'baz' },
            ]);
            expect(domain.test_link('123')).toEqual(false);
        });
    });
});
