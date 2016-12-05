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
        engine.default_app_id = 'foo';

        spyOn(Domain, 'get_ekn_version').and.returnValue(2);
        let domain = engine._get_domain('foo');

        // Don't hit the disk.
        domain._content_path = '/foo';
        engine._mock_domain = domain;
    });

    describe('domain wrap behavior', function () {
        it('calls get_object_by_id correctly', function (done) {
            let domain = engine._mock_domain;

            spyOn(domain, 'get_object_by_id').and.callFake(function (id, cancellable, callback) {
                callback(domain, 'testing whether this was called');
            });
            spyOn(domain, 'get_object_by_id_finish').and.callFake(function (task) {
                return task;
            });

            engine.get_object_by_id('ekn:///1234567890abcdef', null, function (engine, task) {
                let res = engine.get_object_by_id_finish(task);
                expect(res).toEqual('testing whether this was called');
                expect(domain.get_object_by_id).toHaveBeenCalled();
                done();
            });
        });
    });
});
