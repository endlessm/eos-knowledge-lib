const Eknc = imports.gi.EosKnowledgeContent;

const InstanceOfMatcher = imports.tests.InstanceOfMatcher;

// Need to rework domain tests for the C version
xdescribe('Domain', function () {
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
