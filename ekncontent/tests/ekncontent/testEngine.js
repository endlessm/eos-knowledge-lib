const Eknc = imports.gi.EosKnowledgeContent;
const InstanceOfMatcher = imports.tests.InstanceOfMatcher;

describe('Engine', function () {
    let engine;

    beforeEach(function () {
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);
        engine = Eknc.Engine.get_default();
    });

    describe('get_domain_for_app', function () {
        it('returns a domain for an app id that exists', function () {
            let domain = engine.get_domain_for_app('com.endlessm.fake_test_app.en');
            expect(domain).not.toBe(null);
            expect(domain).toBeA(Eknc.Domain);
        });

        it('throws for an app id that does not exist', function () {
            expect(() => engine.get_domain_for_app('com.endlessm.invalid_app.en')).toThrow();
        });
    });

    describe('get_object_for_app', function () {
        it('returns a model for valid app id, ekn id pair', function (done) {
            engine.get_object_for_app('ekn:///02463d24cb5690af2c8e898736ea8c80e0e77077',
                                      'com.endlessm.fake_test_app.en',
                                      null,
                                      function (engine, result) {
                let model = engine.get_object_finish(result);
                expect(model).not.toBe(null);
                expect(model).toBeA(Eknc.ArticleObjectModel);
                done();
            });
        });

        it('throws for an app id that does not exist', function (done) {
            engine.get_object_for_app('ekn:///02463d24cb5690af2c8e898736ea8c80e0e77077',
                                      'com.endlessm.invalid_app.en',
                                      null,
                                      function (engine, result) {
                expect(() => engine.get_object_finish(result)).toThrow();
                done();
            });
        });

        it('throws for an app id that does not exist', function (done) {
            engine.get_object_for_app('ekn:///0000000000000000000000000000000000000000',
                                      'com.endlessm.fake_test_app.en',
                                      null,
                                      function (engine, result) {
                expect(() => engine.get_object_finish(result)).toThrow();
                done();
            });
        });
    });

    describe('test_link_for_app', function () {
        it('returns an id for valid app id, link pair', function () {
            let id = engine.test_link_for_app('https://en.wikipedia.org/wiki/America',
                                              'com.endlessm.fake_test_app.en');
            expect(id).not.toBe(null);
        });

        it('throws for an app id that does not exist', function () {
            expect(() => {
                engine.test_link_for_app('https://en.wikipedia.org/wiki/America',
                                         'com.endlessm.invalid_app.en');
            }).toThrow();
        });

        it('return null for an ekn id that does not exist', function () {
            let id = engine.test_link_for_app('http://www.bbc.com/news/',
                                              'com.endlessm.fake_test_app.en');
            expect(id).toBe(null);
        });
    });

    describe('with a default app id', function () {
        beforeEach(function () {
            engine.default_app_id = 'com.endlessm.fake_test_app.en';
        });

        describe('get_domain', function () {
            it('returns the domain for the default id', function () {
                let domain = engine.get_domain();
                expect(domain).toBeA(Eknc.Domain);
                expect(domain.app_id).toBe('com.endlessm.fake_test_app.en');
            });
        });

        describe('get_object', function () {
            it('returns a model for valid ekn id', function () {
                engine.get_object('ekn:///02463d24cb5690af2c8e898736ea8c80e0e77077',
                                  null,
                                  function (engine, result) {
                    let model = engine.get_object_finish(result);
                    expect(model).not.toBe(null);
                    expect(model).toBeA(Eknc.ArticleObjectModel);
                });
            });

            it('throws for an app id that does not exist', function () {
                engine.get_object('ekn:///0000000000000000000000000000000000000000',
                                  null,
                                  function (engine, result) {
                    expect(() => engine.get_object_finish(result)).toThrow();
                });
            });
        });

        describe('test_link_for_app', function () {
            it('returns an id a valid link', function () {
                let id = engine.test_link_for_app('https://en.wikipedia.org/wiki/America',
                                                  'com.endlessm.fake_test_app.en');
                expect(id).not.toBe(null);
            });

            it('returns null for an invalid link', function () {
                let id = engine.test_link_for_app('http://www.bbc.com/news/',
                                                  'com.endlessm.fake_test_app.en');
                expect(id).toBe(null);
            });
        });
    });
});
