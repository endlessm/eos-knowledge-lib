const Eknc = imports.gi.EosKnowledgeContent;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;

const InstanceOfMatcher = imports.tests.InstanceOfMatcher;

describe('Domain', function () {
    let domain, tempdir;

    beforeAll(function () {
        tempdir = GLib.Dir.make_tmp('ekncontent-test-domain-XXXXXX');
        GLib.setenv('XDG_DATA_HOME', tempdir, true);
    });

    beforeEach(function () {
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);
        domain = new Eknc.Domain({
            app_id: 'com.endlessm.fake_test_app.en',
        });
    });

    afterEach(function () {
        function clean_out(file, cancellable) {
            let enumerator = file.enumerate_children('standard::*',
                Gio.FileQueryInfoFlags.NOFOLLOW_SYMLINKS, cancellable);
            let info;
            while ((info = enumerator.next_file(cancellable))) {
                let child = enumerator.get_child(info);
                if (info.get_file_type() === Gio.FileType.DIRECTORY)
                    clean_out(child, cancellable);
                child.delete(cancellable);
            }
        }
        clean_out(Gio.File.new_for_path(tempdir), null);
    });

    afterAll(function () {
        Gio.File.new_for_path(tempdir).delete(null);
    });

    describe('init', function () {
        it('returns without error for a valid app id', function () {
            expect(() => { domain.init(null); }).not.toThrow();
        });

        it('errors for an invalid app id', function () {
            domain = new Eknc.Domain({
                app_id: 'com.endlessm.invalid_app.en',
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

        it('returns an object model for an ID in a second subscription', function (done) {
            domain.get_object("ekn:///97f20ebedb1aaff93eb4043f0b181aa6ecd939f7", null, function (domain, result) {
                let model = domain.get_object_finish(result);
                expect(model).not.toBe(null);
                expect(model).toBeA(Eknc.ArticleObjectModel);
                done();
            });
        });
    });

    fdescribe('get_subscription_ids', function () {
        beforeEach(function () {
            domain.init(null);
        });

        it('returns an array of subscription IDs', function () {
            let ids = domain.get_subscription_ids();
            expect(ids.length).toBe(2);
            expect(ids).toContain('1aa1fe392aa50a771ca5f8a6452a758896a21f7644225f4d1ddbefec77053c9b');
            expect(ids).toContain('9db1104bdc122815029851172c7d2c5138130a6fb77af6dd2726686068a70541');
        });
    });
});
