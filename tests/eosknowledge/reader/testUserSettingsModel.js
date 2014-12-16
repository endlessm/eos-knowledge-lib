const Endless = imports.gi.Endless;
const EosKnowledge = imports.gi.EosKnowledge;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;

describe('Reader user settings model', function () {
    let test_content_dir_path = Endless.getCurrentFileDir() + '/../../test-content/';
    let user_settings_file;
    let current_time = Date.now();

    beforeEach(function () {
        user_settings_file = Gio.File.new_tmp(null)[0];
    });

    describe('construction process', function () {
        it('works', function () {
            let settings = new EosKnowledge.Reader.UserSettingsModel({
                settings_file: user_settings_file,
            });
        });

        it('correctly loads settings from file', function () {
            let data = {
                bookmark_issue: 3,
                bookmark_page: 8,
                update_timestamp: current_time,
            };
            user_settings_file.replace_contents(JSON.stringify(data), null, false, 0, null);
            let settings = new EosKnowledge.Reader.UserSettingsModel({
                settings_file: user_settings_file,
            });
            expect(settings.bookmark_issue).toBe(3);
            expect(settings.bookmark_page).toBe(8);
            expect(settings.update_timestamp).toBe(current_time);
        });

        it('gracefully handles a settings file that is not JSON', function () {
            user_settings_file.replace_contents("This is not JSON", null, false, 0, null);

            let settings = new EosKnowledge.Reader.UserSettingsModel({
                settings_file: user_settings_file,
            });
            expect(settings.bookmark_issue).toBe(0);
            expect(settings.bookmark_page).toBe(0);
            expect(settings.update_timestamp).toBe(0);
        });

        it('gracefully handles case where settings file does not exist', function () {
            let settings = new EosKnowledge.Reader.UserSettingsModel({
                settings_file: Gio.File.new_for_path('nothing/here'),
            });
            expect(settings.bookmark_issue).toBe(0);
            expect(settings.bookmark_page).toBe(0);
            expect(settings.update_timestamp).toBe(0);
        });
    });

    describe('object', function () {
        it('saves settings to file when issue number changes', function () {
            let settings = new EosKnowledge.Reader.UserSettingsModel({
                settings_file: user_settings_file,
            });
            spyOn(settings, '_save_user_settings_to_file');
            settings.bookmark_issue = 2;
            expect(settings._save_user_settings_to_file).toHaveBeenCalled();
        });

        it('saves settings to file when article number changes', function () {
            let settings = new EosKnowledge.Reader.UserSettingsModel({
                settings_file: user_settings_file,
            });
            spyOn(settings, '_save_user_settings_to_file');
            settings.bookmark_page = 9;
            expect(settings._save_user_settings_to_file).toHaveBeenCalled();
        });
    });
});
