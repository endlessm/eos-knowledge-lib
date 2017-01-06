const Eknc = imports.gi.EosKnowledgeContent;

const Domain = imports.search.domain;
const Utils = imports.search.utils;

const MockShard = imports.tests.mockShard;
const InstanceOfMatcher = imports.tests.InstanceOfMatcher;

function create_mock_domain_for_version (versionNo) {
    spyOn(Eknc, 'get_ekn_version').and.callFake(() => versionNo);
    // Don't hit the disk.
    spyOn(Domain.Domain.prototype, '_load_sync').and.callFake(() => {});

    return Domain.get_domain_impl('foo', null);
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
    let domain;

    beforeEach(function () {
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);
        domain = create_mock_domain_for_version('3');
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
