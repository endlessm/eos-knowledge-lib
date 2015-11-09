/* exported get_web_plugin_dbus_name_for_webview, has_descendant_with_type */

const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const Format = imports.format;
const Gdk = imports.gi.Gdk;
const Gettext = imports.gettext;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;

const Config = imports.app.config;

String.prototype.format = Format.format;
let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);

/* Not part of public API. Changes @widget's GdkWindow to have the 'hand' cursor
indicating a clickable UI element. */
function set_hand_cursor_on_widget(widget) {
    widget.add_events(Gdk.EventMask.ENTER_NOTIFY_MASK |
        Gdk.EventMask.LEAVE_NOTIFY_MASK);

    widget.connect('enter-notify-event', function (widget) {
        let cursor = Gdk.Cursor.new_for_display(Gdk.Display.get_default(),
            Gdk.CursorType.HAND1);
        widget.window.set_cursor(cursor);
        return Gdk.EVENT_PROPAGATE;
    });
    widget.connect('leave-notify-event', function (widget) {
        widget.window.set_cursor(null);
        return Gdk.EVENT_PROPAGATE;
    });
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
function sanitize_query (query) {
    // Crazy regex for line breaks from
    // http://stackoverflow.com/questions/10805125/how-to-remove-all-line-breaks-from-a-string
    return query.replace(/\r?\n|\r/g, ' ').trim();
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

function format_capitals (string, text_transform) {
    switch (text_transform) {
    case EosKnowledgePrivate.TextTransform.NONE:
        return string;
    case EosKnowledgePrivate.TextTransform.UPPERCASE:
        return string.toLocaleUpperCase();
    }
    throw new RangeError('Not a supported value of TextTransform');
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

const DESKTOP_INTERFACE_SCHEMA = 'org.gnome.desktop.interface';
const TEXT_SCALING_KEY = 'text-scaling-factor';

function get_text_scaling_factor () {
    let settings = new Gio.Settings({ schema: DESKTOP_INTERFACE_SCHEMA });
    return settings.get_double(TEXT_SCALING_KEY);
}

function get_web_plugin_dbus_name () {
    let app_id = Gio.Application.get_default().application_id;
    let pid = new Gio.Credentials().get_unix_pid();
    return app_id + pid;
}

function _rgba_to_markup_color(rgba) {
    // Ignore alpha, as Pango doesn't render it.
    return '#%02x%02x%02x'.format(rgba.red * 255, rgba.green * 255,
        rgba.blue * 255);
}

function style_context_to_markup_span(context, state) {
    let font = context.get_font(state);
    let foreground = context.get_color(state);
    const _PANGO_STYLES = ['normal', 'oblique', 'italic'];
    // Unfortunately, ignore the font size; PangoFontDescriptions don't deal
    // well with font sizes in ems.
    let properties = {
        'face': font.get_family(),
        'style': _PANGO_STYLES[font.get_style()],
        'weight': font.get_weight(),
        'color': _rgba_to_markup_color(foreground),
    };
    let properties_string = Object.keys(properties).map((key) =>
        key + '="' + properties[key] + '"').join(' ');
    return '<span ' + properties_string + '>';
}


/*
   This allows styling a sub-region of the GtkLabel with an extra CSS class.
   For example, you can specify:
   .title { color: white; }
   .title.query { weight: bold; color: black; }
   It supports the CSS properties font-family, font-weight, font-style, and
   color.
   For example, with the above CSS,

        format_ui_string(context, 'You searched for "%s"', 'cat pictures', 'query')

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

const DBUS_WEBVIEW_EXPORT_PATH = '/com/endlessm/webview/';
function dbus_object_path_for_webview (view) {
    return DBUS_WEBVIEW_EXPORT_PATH + view.get_page_id();
}

function get_web_plugin_dbus_name_for_webview (view) {
    return get_web_plugin_dbus_name() + '-' + view.get_page_id();
}

function has_descendant_with_type (widget, klass) {
    if (widget instanceof klass)
        return true;
    if (widget instanceof Gtk.Container) {
        let children = [];
        // Retrieves internal children as well, widget.get_children() does not
        widget.forall(child => children.push(child));
        return children.some(child => has_descendant_with_type(child, klass));
    }
    return false;
}
