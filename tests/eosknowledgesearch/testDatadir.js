const EosKnowledgeSearch = imports.EosKnowledgeSearch;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;

let build_dir = Gio.File.new_for_path(GLib.getenv('G_TEST_BUILDDIR') || GLib.get_current_dir());
let content_dir = build_dir.get_child('test-content');

describe('Data dir finder', function () {
    beforeEach(function () {
        let datadir1 = content_dir.get_child('test-datadir');
        let datadir2 = content_dir.get_child('test-datadir2');

        // Set up test fixtures. No need to remove them afterwards since they
        // are only queried, not modified.
        [datadir1, datadir2].forEach((file) => {
            try {
                file.get_child('ekn').get_child('data').get_child('scuba-diving-fr')
                    .make_directory_with_parents(null);
            } catch (e if e.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.EXISTS)) {}
        });

        spyOn(GLib, 'get_system_data_dirs').and.returnValue([
            '/mydatadir',
            content_dir.get_child('test-datadir').get_path(),
            content_dir.get_child('test-datadir2').get_path(),
        ]);
    });

    it('returns a path to a Xapian database dir', function () {
        let found_dir = EosKnowledgeSearch.get_data_dir_for_domain('scuba-diving-fr');
        expect(found_dir).not.toBeNull();
        expect(found_dir.get_path()).toMatch(/ekn\/data\/scuba-diving-fr$/);
    });

    it('returns the first path that exists', function () {
        let found_dir = EosKnowledgeSearch.get_data_dir_for_domain('scuba-diving-fr');
        expect(found_dir).not.toBeNull();
        let found_path = found_dir.get_path();
        expect(found_path).not.toMatch(/mydatadir/);
        expect(found_path).toMatch(/test-datadir/);
        expect(found_path).not.toMatch(/test-datadir2/);
    });

    it('returns null if the domain was not found', function () {
        let found_dir = EosKnowledgeSearch.get_data_dir_for_domain('this-knowledge-app-should-never-exist');
        expect(found_dir).toBeNull();
    });

    // FIXME: No way to check this without a mock file system, because in the
    // tests we can't depend on anything really existing in /endless/share.
    it('checks /endless/share for the domain');
});
