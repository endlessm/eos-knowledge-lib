const Eknc = imports.gi.EosKnowledgeContent;

describe('Data dir finder', function () {
    it('returns null if the domain was not found', function () {
        let found_dir = Eknc.get_data_dir('this-knowledge-app-should-never-exist');
        expect(found_dir).toBeNull();
    });

    it('returns a GFile pointing to a valid ekn data dir', function () {
        let found_dir = Eknc.get_data_dir('com.endlessm.fake_test_app.en');
        expect(found_dir.get_path()).toBeDefined();
    });

    // FIXME: no easy way to test these without a way to mock file URIs
    // during tests.
    it('discovers data dirs inside the flatpak sandbox');
    it('discovers data dirs in system data dirs');
});
