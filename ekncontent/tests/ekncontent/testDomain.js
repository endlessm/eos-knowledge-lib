const Eknc = imports.gi.EosKnowledgeContent;

const InstanceOfMatcher = imports.tests.InstanceOfMatcher;

describe('Domain', function () {
    let domain, bridge;

    beforeEach(function () {
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);
        bridge = new Eknc.XapianBridge();
        domain = new Eknc.Domain({
            app_id: 'com.endlessm.fake_test_app.en',
            xapian_bridge: bridge,
        });
    });

    describe('init', function () {
        it('returns without error for a valid app id', function () {
            expect(() => { domain.init(null); }).not.toThrow();
        });

        it('errors for an invalid app id', function () {
            domain = new Eknc.Domain({
                app_id: 'com.endlessm.invalid_app.en',
                xapian_bridge: bridge,
            });
            expect(() => { domain.init(null); }).toThrow();
        });
    });

    describe('test_link', function () {
        beforeEach(function () {
            domain.init(null);
        });

        it('returns entries from a link table which contains the link', function () {
            expect(domain.test_link('https://en.wikipedia.org/wiki/America')).not.toBe(null);
        });

        it('returns false when no link table contains the link', function () {
            expect(domain.test_link('http://www.bbc.com/news/')).toBe(null);
        });
    });

    describe('get_object', function () {
        beforeEach(function () {
            domain.init(null);
        });

        it('returns an object model for an ID in our database', function (done) {
            domain.get_object("ekn:///02463d24cb5690af2c8e898736ea8c80e0e77077", null, function (domain, result) {
                let model = domain.get_object_finish(result);
                expect(model).not.toBe(null);
                expect(model).toBeA(Eknc.ArticleObjectModel);
                done();
            });
        });

        it('throws for an ID not our database', function (done) {
            domain.get_object("ekn:///0000000000000000000000000000000000000000", null, function (domain, result) {
                expect(() => domain.get_object_finish(result)).toThrow();
                done();
            });
        });

        it('throws for an ID that is not valid', function (done) {
            domain.get_object("ekn:///this-is-not-a-valid-id", null, function (domain, result) {
                expect(() => domain.get_object_finish(result)).toThrow();
                done();
            });
        });

        it('returns an object model for an ID in our database', function (done) {
            domain.get_object("ekn:///02463d24cb5690af2c8e898736ea8c80e0e77077", null, function (domain, result) {
                let model = domain.get_object_finish(result);
                expect(model).not.toBe(null);
                expect(model).toBeA(Eknc.ArticleObjectModel);
                done();
            });
        });

    });
});
