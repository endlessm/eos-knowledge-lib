const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;

const UserSettingsModel = imports.app.reader.userSettingsModel;

describe('Reader user settings model', function () {
    let user_settings_file;
    let current_time = new Date().toISOString();

    beforeEach(function () {
        user_settings_file = Gio.File.new_tmp(null)[0];
    });

    describe('construction process', function () {
        it('works', function () {
            let settings = new UserSettingsModel.UserSettingsModel({
                settings_file: user_settings_file,
            });
        });

        it('correctly loads settings from file', function () {
            let data = {
                start_article: 3,
                highest_article_read: 9,
                bookmark_page: 8,
                update_timestamp: current_time,
            };
            user_settings_file.replace_contents(JSON.stringify(data), null, false, 0, null);
            let settings = new UserSettingsModel.UserSettingsModel({
                settings_file: user_settings_file,
            });
            expect(settings.start_article).toBe(3);
            expect(settings.bookmark_page).toBe(8);
            expect(settings.highest_article_read).toBe(9);
            expect(settings.update_timestamp).toBe(current_time);
        });

        it('gracefully handles a settings file that is not JSON', function () {
            user_settings_file.replace_contents("This is not JSON", null, false, 0, null);

            let settings = new UserSettingsModel.UserSettingsModel({
                settings_file: user_settings_file,
            });
            expect(settings.start_article).toBe(0);
            expect(settings.bookmark_page).toBe(0);
            expect(settings.highest_article_read).toBe(0);
            expect(settings.update_timestamp).toBe('');
        });

        it('gracefully handles case where settings file does not exist', function () {
            let settings = new UserSettingsModel.UserSettingsModel({
                settings_file: Gio.File.new_for_path('nothing/here'),
            });
            expect(settings.start_article).toBe(0);
            expect(settings.bookmark_page).toBe(0);
            expect(settings.highest_article_read).toBe(0);
            expect(settings.update_timestamp).toBe('');
        });
    });

    describe('object', function () {
        let settings;

        beforeEach(function () {
            settings = new UserSettingsModel.UserSettingsModel({
                settings_file: user_settings_file,
            });
        });

        it('saves settings to file when start article number changes', function () {
            spyOn(settings, '_save_user_settings_to_file');
            settings.start_article = 2;
            expect(settings._save_user_settings_to_file).toHaveBeenCalled();
        });

        it('saves settings to file when article number changes', function () {
            spyOn(settings, '_save_user_settings_to_file');
            settings.bookmark_page = 9;
            expect(settings._save_user_settings_to_file).toHaveBeenCalled();
        });

        it('updates highest bookmark value when user navigates to a new highest page', function () {
            expect(settings.highest_article_read).not.toBe(9);
            settings.bookmark_page = 9;
            expect(settings.highest_article_read).toBe(9);
        });
    });
});
