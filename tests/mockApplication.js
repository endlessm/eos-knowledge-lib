// Copyright 2015 Endless Mobile, Inc.

const {Endless, Gio, GLib, GObject, Gtk} = imports.gi;

const Dispatcher = imports.framework.dispatcher;
const Knowledge = imports.framework.knowledge;

var MockApplication = new Knowledge.Class({
    Name: 'MockApplication',
    Extends: Gtk.Application,

    _init: function (props={}) {
        this.parent(props);

        this.config_dir = {
            get_path: function () {
                return GLib.get_tmp_dir();
            }
        }
    },

    get_web_overrides_css: function () {
        return [];
    },

    set_accels_for_action: function () {},

    get_active_window: function () {},

    get_windows: function () {
        return [];
    }
});

function mock_default() {
    let application = new MockApplication();
    spyOn(Gio.Application, 'get_default').and.callFake(() => application);
    return application;
};
