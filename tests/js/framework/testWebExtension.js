const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;
const WebKit2 = imports.gi.WebKit2;

const BUILDDIR = GLib.getenv('G_TEST_BUILDDIR') || GLib.get_current_dir();
const EXTENSION_PATH = BUILDDIR + '/.libs';
const DBUS_NAME = 'com.endlessm.testWebExtension' + new Gio.Credentials().get_unix_pid();
const WEBVIEW_OBJECT_PATH = '/com/endlessm/test/webview';
const DBUS_TOOLTIP_INTERFACE = '\
    <node> \
        <interface name="com.endlessm.Knowledge.TooltipCoordinates"> \
            <method name="GetCoordinates"> \
                <arg name="pointer_coordinates" type="(uu)" direction="in"/> \
                <arg name="dom_element_rectangle" type="(uuuu)" direction="out"/> \
            </method> \
        </interface> \
    </node>';

Gtk.init(null);

// FIXME: Async beforeEach seems to be broken in our version of Jasmine 2.0.
// Re-enable suite when we update to jasmine-gjs.
xdescribe('Tooltip web extension', function () {
    let view, proxy, watch_id;

    beforeEach(function (done) {
        let web_context = WebKit2.WebContext.get_default();
        web_context.connect('initialize-web-extensions', () => {
            web_context.set_web_extensions_directory(EXTENSION_PATH);
            let well_known_name = new GLib.Variant('s', DBUS_NAME);
            web_context.set_web_extensions_initialization_user_data(well_known_name);

            // Wait for the DBus interface to appear on the bus
            // FIXME: The name currently does not appear.
            watch_id = Gio.DBus.watch_name(Gio.BusType.SESSION, DBUS_NAME,
                Gio.BusNameWatcherFlags.NONE, (connection, name, owner) => {
                    let ProxyConstructor =
                        Gio.DBusProxy.makeProxyWrapper(DBUS_TOOLTIP_INTERFACE);
                    proxy = new ProxyConstructor(connection, DBUS_NAME,
                        WEBVIEW_OBJECT_PATH);
                    done();
                }, null);
        });
        view = new WebKit2.WebView();
    });

    it('responds to coordinate query over DBus', function (done) {
        proxy.GetCoordinatesRemote([0, 0], (coordinates, error) => {
            expect(error).not.toBeDefined();
            expect(coordinates.length).toBe(1);
            expect(coordinates[0].length).toBe(4);
            done();
        });
    });

    afterEach(function () {
        Gio.DBus.unwatch_name(watch_id);
    });
});
