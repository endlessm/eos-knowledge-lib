/* exported dbus_object_path_for_webview, get_css_for_title_and_module,
get_web_plugin_dbus_name, get_web_plugin_dbus_name_for_webview, intersection,
record_search_metric, start_content_access_metric, stop_content_access_metric,
shows_descendant_with_type, split_out_conditional_knobs, union,
vfunc_draw_background_default */

const MockMetricsModule = {
    EventRecorder: {
        get_default: function () {
            return {
                record_event: function () {},
            };
        },
    },
};

const Config = imports.app.config;

const ByteArray = imports.byteArray;
const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const EosMetrics = Config.metrics_enabled ? imports.gi.EosMetrics : MockMetricsModule;
const Format = imports.format;
const Gdk = imports.gi.Gdk;
const Gettext = imports.gettext;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;
const Soup = imports.gi.Soup;

const Dispatcher = imports.app.dispatcher;
const Knowledge = imports.app.knowledge;

var DEFAULT_PAGE_TRANSITION_DURATION = 500;

String.prototype.format = Format.format;
let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);

/* Not part of public API. Changes @widget's GdkWindow to have the 'hand' cursor
indicating a clickable UI element. */
function set_hand_cursor_on_widget(widget) {
    if (widget._hand_cursor_handlers)
        return;

    widget.add_events(Gdk.EventMask.ENTER_NOTIFY_MASK |
        Gdk.EventMask.LEAVE_NOTIFY_MASK);

    let enter_id = widget.connect('enter-notify-event', function (widget) {
        let cursor = Gdk.Cursor.new_from_name(widget.get_display(), "pointer");
        widget.window.set_cursor(cursor);
        return Gdk.EVENT_PROPAGATE;
    });
    let leave_id = widget.connect('leave-notify-event', function (widget) {
        widget.window.set_cursor(null);
        return Gdk.EVENT_PROPAGATE;
    });

    widget._hand_cursor_handlers = { enter_id: enter_id, leave_id: leave_id };
}

function unset_hand_cursor_on_widget(widget) {
    if (widget._hand_cursor_handlers) {
        widget.disconnect(widget._hand_cursor_handlers.enter_id);
        widget.disconnect(widget._hand_cursor_handlers.leave_id);
        delete widget._hand_cursor_handlers;
    }
}

/* Helper function to load a JSON object from a file */
function parse_object_from_file (file) {
    try {
        let [success, data] = file.load_contents(null);
        return JSON.parse(data);
    } catch(e) {
        logError(e);
    }
    return null;
}

/* Helper function to save a JSON object to a file */
function save_object_to_file (object, file) {
    // Magic parameters ahead! See: devhelp
    let etag_1 = null;
    let make_backup = false;
    let flags = 0;
    let cancellable = null;
    file.replace_contents(JSON.stringify(object), etag_1, make_backup, flags, cancellable);
}

/* Helper add a new css provider to the default screen object */
function add_css_provider_from_file (file, priority) {
    let provider = new Gtk.CssProvider();
    provider.load_from_file(file);
    Gtk.StyleContext.add_provider_for_screen(Gdk.Screen.get_default(),
            provider, priority);
}

/* Helper method to sanitize queries.
 * Removes newlines and trims whitespace before and after a query string */
function sanitize_search_terms (search_terms) {
    // Crazy regex for line breaks from
    // http://stackoverflow.com/questions/10805125/how-to-remove-all-line-breaks-from-a-string
    return search_terms.replace(/\r?\n|\r/g, ' ').trim();
}

function format_authors(authors) {
    if (authors.length === 0)
        return '';

    // TRANSLATORS: anything inside curly braces '{}' is going to be substituted
    // in code. Please make sure to leave the curly braces around any words that
    // have them and DO NOT translate words inside curly braces. Also, note: the
    // "and" is used to join together the names of authors of a blog post. For
    // example: "Jane Austen and Henry Miller and William Clifford"
    return _("by {author}").replace("{author}", authors.join(" " + _("and") + " "));
}

function apply_css_to_widget (css_string, widget) {
    let provider = new Gtk.CssProvider();
    provider.load_from_data(css_string);
    let context = widget.get_style_context();
    context.add_provider(provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);
}

function get_css_for_submodule (name, css_data) {
    let props = Object.keys(css_data).filter((key) => key.startsWith(name));
    return props.reduce((data, prop) => {
        data[prop.slice((name + '-').length)] = css_data[prop];
        return data;
    }, {});
}

function object_to_css_string (obj, selector="*") {
    if (Object.keys(obj).length === 0)
        return "";

    let css_string = selector + "{\n";
    for (let prop in obj) {
        css_string += '\t' + (prop + ": " + obj[prop] + ";\n");
    }
    css_string += "}\n";
    return css_string;
}

/* Font overrides should not apply in composite mode; this function separates
out the non-composite override knobs and deletes them from the passed-in
css_data object */
function split_out_conditional_knobs (css_data) {
    let conditional_data = {};
    ['font-family', 'font-size', 'font-weight', 'font-style'].forEach(key => {
        if (key in css_data) {
            conditional_data[key] = css_data[key];
            delete css_data[key];
        }
    });
    return conditional_data;
}

/* Convenience function for repeated code */
function get_css_for_title_and_module (css_data, title_selector, module_selector) {
    const NON_COMPOSITE_SELECTOR = 'EosWindow:not(.composite) ';

    let title_data = get_css_for_submodule('title', css_data);
    let conditional_title_data = split_out_conditional_knobs(title_data);
    let str = object_to_css_string(title_data, title_selector);
    str += object_to_css_string(conditional_title_data,
        NON_COMPOSITE_SELECTOR + title_selector);

    let module_data = get_css_for_submodule('module', css_data);
    let conditional_module_data = split_out_conditional_knobs(module_data);
    str += object_to_css_string(module_data, module_selector);
    str += object_to_css_string(conditional_module_data,
        NON_COMPOSITE_SELECTOR + module_selector);

    return str;
}

const DESKTOP_INTERFACE_SCHEMA = 'org.gnome.desktop.interface';
const TEXT_SCALING_KEY = 'text-scaling-factor';

function get_text_scaling_factor () {
    let settings = new Gio.Settings({ schema: DESKTOP_INTERFACE_SCHEMA });
    return settings.get_double(TEXT_SCALING_KEY);
}

function _rgba_to_markup_color(rgba) {
    // Ignore alpha, as Pango doesn't render it.
    return '#%02x%02x%02x'.format(rgba.red * 255, rgba.green * 255,
        rgba.blue * 255);
}

function style_context_to_markup_span(context, state) {
    let font = context.get_font(state);
    let foreground = context.get_color(state);
    let background = context.get_background_color(state);
    const _PANGO_STYLES = ['normal', 'oblique', 'italic'];
    // Unfortunately, ignore the font size; PangoFontDescriptions don't deal
    // well with font sizes in ems.
    let properties = {
        'face': font.get_family(),
        'style': _PANGO_STYLES[font.get_style()],
        'weight': font.get_weight(),
        'color': _rgba_to_markup_color(foreground),
    };
    // If no background color is specified, the default will be a black
    // background with alpha set to 0. But since Pango ignores the alpha
    // channel, we end up with an unwanted, all-black background. So
    // to avoid this we should only set the background color if the alpha
    // channel is non-zero.
    if (background.alpha !== 0) {
        properties.bgcolor = _rgba_to_markup_color(background);
    }
    let properties_string = Object.keys(properties).map((key) =>
        key + '="' + properties[key] + '"').join(' ');
    return '<span ' + properties_string + '>';
}


/*
   This allows styling a sub-region of the GtkLabel with an extra CSS class.
   For example, you can specify:
   .title { color: white; }
   .title.search-terms { weight: bold; color: black; }
   It supports the CSS properties font-family, font-weight, font-style, and
   color.
   For example, with the above CSS,

        format_ui_string(context, 'You searched for "%s"', 'cat pictures', 'search-terms')

   will return:

        'You searched for "<span weight="bold" color="#000000">cat pictures</span>"'.
*/
function format_ui_string (context, ui_string, substring, style_class) {
    context.save();
    context.add_class(style_class);
    let span = style_context_to_markup_span(context, Gtk.StateFlags.NORMAL);
    context.restore();

    return ui_string.format(span + substring + '</span>');
}

// The Fisher-Yates shuffle for randomizing an array
// Shuffles in place and returns the modified array
function shuffle (array, sequence) {
    let current_index = array.length;
    // While there remain elements to shuffle...
    while (0 !== current_index) {

        // Pick a remaining element...
        let random_index = Math.floor(sequence[current_index - 1] * current_index);
        current_index -= 1;

        // And swap it with the current element.
        let temp_value = array[current_index];
        array[current_index] = array[random_index];
        array[random_index] = temp_value;
    }
    return array;
}

// A poor man's hash function
function dumb_hash (str) {
    return str.split('').reduce((num, chr) => num + chr.charCodeAt(0), 0);
}

function get_web_plugin_dbus_name () {
    let app_id = Gio.Application.get_default().application_id;
    let pid = new Gio.Credentials().get_unix_pid();
    return app_id + '.id' + pid;
}

const DBUS_WEBVIEW_EXPORT_PATH = '/com/endlessm/webview/';
function dbus_object_path_for_webview (view) {
    return DBUS_WEBVIEW_EXPORT_PATH + view.get_page_id();
}

function get_web_plugin_dbus_name_for_webview (view) {
    return get_web_plugin_dbus_name() + '-' + view.get_page_id();
}

function shows_descendant_with_type (widget, klass) {
    if (widget instanceof klass)
        return true;
    if (widget instanceof Gtk.Stack)
        return shows_descendant_with_type(widget.visible_child, klass);
    if (widget instanceof Gtk.Revealer && !widget.reveal_child)
        return false;
    if (widget instanceof Gtk.Container) {
        let children = [];
        // Retrieves internal children as well, widget.get_children() does not
        widget.forall(child => children.push(child));
        children = children.filter(child =>
            child.visible && child.get_child_visible());
        return children.some(child => shows_descendant_with_type(child, klass));
    }
    return false;
}

// Kinda annoying quirk of gtk--any container doing a custom allocate needs to
// set its clip properly to accommodate widgets that draw outside of their
// allocation (such as widgets with box shadow). Call this function to do so.
function set_container_clip (container) {
    let clip = container.get_allocation();
    container.forall((child) => {
        if (child.get_child_visible() && child.get_visible()) {
            clip = child.get_clip().union(clip);
        }
    });
    container.set_clip(clip);
}

function low_performance_mode () {
    return GLib.getenv('LOW_PERFORMANCE_MODE') !== null;
}

function get_desktop_app_info () {
    let app_id = Gio.Application.get_default().application_id;
    return Gio.DesktopAppInfo.new(app_id + '.desktop');
}

// XXX: The following two functions are knowingly quite draconian in their
// measures to stop the window from updating while powering a page transition.
// We can really only afford to wake up each stack transition frame for a redraw
// on low powered devices. That means no style recomputes, no widget creation,
// no other css transitions (with the exception of Pager.ParallaxBackground
// which is part of our page transition).
// These steps ensure that we will only need to redraw every frame. If we rework
// how state propagates from our controllers to our modules, we may be able to
// stop pausing the dispatcher. As gtk improvements land, we may be able to stop
// squashing css transitions and leave widgets sensitive.
let no_transition_provider;
function squash_all_window_content_updates_heavy_handedly (window) {
    if (!no_transition_provider) {
        no_transition_provider = new Gtk.CssProvider();
        no_transition_provider.load_from_data('EosWindow :not(.PagerParallaxBackground) { transition-property: none; }');
    }
    Gtk.StyleContext.add_provider_for_screen(Gdk.Screen.get_default(),
        no_transition_provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION + 10);
    Dispatcher.get_default().pause();
    window.get_child().sensitive = false;
}

function unsquash_all_window_content_updates_heavy_handedly (window) {
    if (no_transition_provider) {
        Gtk.StyleContext.remove_provider_for_screen(Gdk.Screen.get_default(),
            no_transition_provider);
    }
    Dispatcher.get_default().resume();
    window.get_child().sensitive = true;
}

function alignment_to_justification (align) {
    switch (align) {
        case Gtk.Align.FILL:
        case Gtk.Align.CENTER:
            return Gtk.Justification.CENTER;
        case Gtk.Align.START:
            return (Gtk.get_locale_direction() === Gtk.TextDirection.RTL) ?
                Gtk.Justification.RIGHT : Gtk.Justification.LEFT;
        case Gtk.Align.END:
            return (Gtk.get_locale_direction() === Gtk.TextDirection.RTL) ?
                Gtk.Justification.LEFT : Gtk.Justification.RIGHT;
    }
    return Gtk.Justification.CENTER;
}

function alignment_to_xalign (align) {
    switch (align) {
        case Gtk.Align.FILL:
        case Gtk.Align.CENTER:
            return 0.5;
        case Gtk.Align.START:
            return (Gtk.get_locale_direction() === Gtk.TextDirection.RTL) ?
                1.0 : 0;
        case Gtk.Align.END:
            return (Gtk.get_locale_direction() === Gtk.TextDirection.RTL) ?
                0 : 1.0;
    }
    return 0.5;
}

// Gets a bem style class name.
// e.g. Foo--big__bar--small
// If a Knowledge.Class is passed in for block, will automatically use the
// style class name.
function get_bem_style_class (block, block_modifier, element, element_modifier) {
    if (block && typeof block.get_style_class === 'function') {
        block = block.get_style_class();
    }
    if (!block)
        throw new Error('Trying to create bem style class with missing block');
    if (element_modifier && !element)
        throw new Error('Trying to modify element with no element name');
    let join_modifier = function (name, modifier) {
        if (!modifier)
            return name;
        return name + '--' + modifier;
    };
    let join_element = function (name, element) {
        if (!element)
            return name;
        return name + '__' + element;
    };
    let klass = join_modifier(block, block_modifier);
    klass = join_element(klass, join_modifier(element, element_modifier));
    return klass;
}

// Gets a element style name prefixed with a block style name.
// e.g. Foo__bar
// If a Knowledge.Class is passed in for block, will automatically use the
// classes style class name.
function get_element_style_class (block, element) {
    if (!block || !element)
        throw new Error('Trying to create element style class with missing block or element');
    return get_bem_style_class(block, '', element, '');
}

// Gets a element style name prefixed with a block style name.
// e.g. Foo--bar
// If a Knowledge.Class is passed in for block, will automatically use the
// classes style class name.
function get_modifier_style_class (block, modifier) {
    if (!block || !modifier)
        throw new Error('Trying to create modifier style class with missing block or modifier');
    return get_bem_style_class(block, modifier, '', '');
}

// Function that can be hooked up to the vfunc_draw property to make a GTK
// widget render a background and border, even if it doesn't do so automatically
// (e.g. a custom container.)
// Note, you can only supply this function as a vfunc_draw implementation, and
// cannot call it separately, because it relies on this.parent().
function vfunc_draw_background_default (cr) {
    let width = this.get_allocated_width();
    let height = this.get_allocated_height();
    let style = this.get_style_context();
    Gtk.render_background(style, cr, 0, 0, width, height);
    Gtk.render_frame(style, cr, 0, 0, width, height);
    Gtk.render_focus(style, cr, 0, 0, width, height);
    let retval = this.parent(cr);
    cr.$dispose();
    return retval;
}

const SEARCH_METRIC_EVENT_ID = 'a628c936-5d87-434a-a57a-015a0f223838';
// Should be mocked out during tests so that we don't actually send metrics
function record_search_metric (query) {
    let app_id = Gio.Application.get_default().application_id;
    let recorder = EosMetrics.EventRecorder.get_default();
    recorder.record_event(SEARCH_METRIC_EVENT_ID, new GLib.Variant('(ss)',
        [query, app_id]));
}

const CONTENT_ACCESS_METRIC_EVENT_ID = 'fae00ef3-aad7-44ca-aff2-16555e45f0d9';
function start_content_access_metric(model, entry_point) {
    let app = Gio.Application.get_default();
    // GApplication is not required, e.g. in tests
    if (!app)
        return;

    let app_id = app.application_id;
    let recorder = EosMetrics.EventRecorder.get_default();
    let title = model.title || '';
    let content_type = model.content_type || '';
    recorder.record_start(CONTENT_ACCESS_METRIC_EVENT_ID,
        new GLib.Variant('s', model.id),
        new GLib.Variant('(ssss)', [entry_point, app_id, title, content_type]));
}

function stop_content_access_metric(model) {
    let app = Gio.Application.get_default();
    // GApplication is not required, e.g. in tests
    if (!app)
        return;

    let app_id = app.application_id;
    let recorder = EosMetrics.EventRecorder.get_default();
    recorder.record_stop(CONTENT_ACCESS_METRIC_EVENT_ID,
        new GLib.Variant('s', model.id), null);
}

function id_to_byte_array(id) {
    let bytes = [];
    const [hash] = components_from_id(id);
    for (let pos = 0; pos < hash.length; pos += 2)
        bytes.push(Number.parseInt(hash.substr(pos, 2), 16));
    if (bytes.length !== 20)
        throw new Error(`Invalid ID ${id}`);
    return bytes;
}

const SHARE_METRIC_EVENT_ID = '6775771a-afe7-4158-b7bb-6296fcc7b70d';
function record_share_metric(model, social_network, was_cancelled) {
    void was_cancelled;  // FIXME add when webview dialog available

    let app_id = Gio.Application.get_default().application_id;
    let id = id_to_byte_array(model.id);
    let recorder = EosMetrics.EventRecorder.get_default();
    recorder.record_event(SHARE_METRIC_EVENT_ID, new GLib.Variant('(sayssu)', [
        app_id,
        id,
        model.title || '',
        model.original_uri,
        social_network,
    ]));
}

function define_enum (values) {
    return values.reduce((obj, val, index) => {
        obj[val] = index;
        return obj;
    }, {});
}

function components_from_id(id) {
    // The URI is of form 'ekn://domain/hash[/resource]'.
    // Domain is part of legacy bundle support and should not be used for
    // modern content.

    // Chop off our constant scheme identifier.
    let stripped_id = id.slice('ekn://'.length);

    let components = stripped_id.split('/');

    // Pop off the domain component.
    components.shift();

    return components;
}

function ensure_directory (dir) {
    try {
        dir.make_directory_with_parents(null);
    } catch (e if e.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.EXISTS)) {
        // Directory already exists, we're good.
    }
}

function string_to_bytes(string) {
    return ByteArray.fromString(string).toGBytes();
}

// Set-like operations for arrays: union, intersection

function union(a, b) {
    if (!a)
        return b;
    if (!b)
        return a;
    let union = new Set([...a, ...b]);
    return [...union];
}

function intersection(a, b) {
    if (!a || !b)
        return [];
    let intersection = new Set();
    let a_set = new Set(a);
    b.filter(item => a_set.has(item))
        .forEach(item => intersection.add(item));
    return [...intersection];
}

function parse_uri (uri_str, parse_query) {
    if (!uri_str || !uri_str.length)
        return null;

    let uri = new Soup.URI (uri_str);
    if (!uri)
        return null;

    let {scheme, user, password, host, port, path, query, fragment} = uri;

    if (parse_query && query) {
        let params = query.split('&');
        query = {};

        params.forEach((param) => {
            let tokens = param.split('=');
            query[decodeURIComponent(tokens[0])] = decodeURIComponent(tokens[1]);
        });
    }

    return {scheme, user, password, host, port, path, query, fragment};
}
