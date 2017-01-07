const Eknc = imports.gi.EosKnowledgeContent;
const InstanceOfMatcher = imports.tests.InstanceOfMatcher;

// Need to rework engine tests for the C version
xdescribe('Engine', function () {
    let engine;
    let mock_domain;

    beforeEach(function () {
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);
        engine = new Eknc.Engine();
        engine.default_app_id = 'foo';

        mock_domain = {
            get_object: jasmine.createSpy(),
            get_object_finish: jasmine.createSpy(),
        };
        spyOn(engine, '_get_domain').and.returnValue(mock_domain);
    });

    describe('domain wrap behavior', function () {
        it('calls get_object_by_id correctly', function (done) {
            mock_domain.get_object.and.callFake(function (id, cancellable, callback) {
                callback(mock_domain, 'testing whether this was called');
            });
            mock_domain.get_object_finish.and.callFake(function (task) {
                return task;
            });

            engine.get_object('ekn:///1234567890abcdef', null, function (engine, task) {
                let res = engine.get_object_finish(task);
                expect(res).toEqual('testing whether this was called');
                expect(mock_domain.get_object).toHaveBeenCalled();
                done();
            });
        });
    });
});
