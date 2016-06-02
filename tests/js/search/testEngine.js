const ContentObjectModel = imports.search.contentObjectModel;
const Domain = imports.search.domain;
const Engine = imports.search.engine;
const InstanceOfMatcher = imports.tests.InstanceOfMatcher;
const MockShard = imports.tests.mockShard;
const QueryObject = imports.search.queryObject;
const Utils = imports.search.utils;

describe('Engine', function () {
    let engine;

    beforeEach(function () {
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);
        engine = new Engine.Engine();
        engine.default_domain = 'foo';

        spyOn(Domain, 'get_ekn_version').and.returnValue(2);
        let domain = engine._get_domain('foo');

        // Don't hit the disk.
        domain._content_path = '/foo';
        engine._mock_domain = domain;
    });

    function mock_ekn_shard(shard_file) {
        engine._mock_domain._shard_file = shard_file;
    }

    describe('domain wrap behavior', function (done) {
        it('calls get_domain_by_id correctly', function () {
            let domain = engine._mock_domain;

            spyOn(domain, 'get_object_by_id').and.callFake(function (id, cancellable, callback) {
                return 'testing whether this was called';
            });
            spyOn(domain, 'get_object_by_id_finish').and.callFake(function (task) {
                return task;
            });

            engine.get_object_by_id('ekn://foo/1234567890abcdef', null, function (task) {
                let res = domain.get_object_by_id_finish(task);
                expect(res).toEqual('testing whether this was called');
                expect(domain.get_object_by_id).toHaveBeenCalled();
                done();
            });
        });
    });
});
