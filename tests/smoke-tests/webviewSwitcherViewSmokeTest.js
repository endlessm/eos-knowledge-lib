const EosKnowledge = imports.EosKnowledge.EosKnowledge;
const Gdk = imports.gi.Gdk;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Pango = imports.gi.Pango;

const VOWELS = 'aeiou'.split('');
const CONSONANTS = 'bcdfghjklmnpqrstvwyz'.split('');
const TOPICS = ['intrapsychically', 'slubberdegullion', 'anthropomorphously',
    'unretaliatory', 'exhibitionistic', 'antioxygenating', 'derogatorily',
    'multinucleolate', 'stereomicroscopy', 'nonretroactivity', 'preenumerating',
    'unvenerability', 'examinational', 'unintercalated', 'thalamencephalon',
    'nonsimplification', 'diagrammatical', 'immobilization', 'rehypothecating',
    'serpentinization'];

Gtk.init(null);

function random_word() {
    let word = '';
    let n_syllables = GLib.random_int_range(1, 6);
    for (; n_syllables > 0; n_syllables--) {
        let vowel = VOWELS[GLib.random_int_range(0, VOWELS.length)];
        let consonant = CONSONANTS[GLib.random_int_range(0, CONSONANTS.length)];
        word += consonant + vowel;
    }
    return word;
}

function random_link_word() {
    return TOPICS[GLib.random_int_range(0, TOPICS.length)];
}

const FakeWebview = new Lang.Class({
    Name: 'FakeWebview',
    Extends: Gtk.ScrolledWindow,
    Properties: {
        'estimated-load-progress': GObject.ParamSpec.double(
            'estimated-load-progress', 'Estimated load progress', 'description',
            GObject.ParamFlags.READABLE,
            0.0, 1.0, 0.0)
    },
    Signals: {
        'load-changed': {
            param_types: [ GObject.TYPE_INT /* WebKitLoadEvent */ ]
        },
        'decide-policy': {
            param_types: [
                GObject.TYPE_OBJECT /* WebKitPolicyDecision */,
                GObject.TYPE_INT /* WebKitPolicyDecisionType */
            ],
            return_type: GObject.TYPE_BOOLEAN,
            flags: GObject.SignalFlags.RUN_LAST
        }
    },

    // Mimic WebKitLoadEvent enum
    LOAD_STARTED: 0,
    LOAD_FINISHED: 3,

    // Mimic WebKitPolicyDecisionType enum
    NAVIGATION_ACTION: 0,

    _init: function () {
        this._estimated_load_progress = 0.0;
        this.parent();

        this._view = new Gtk.TextView({
            wrap_mode: Gtk.WrapMode.WORD_CHAR,
            editable: false,
        });
        this.add(this._view);
        this._buffer = this._view.buffer;

        let heading_tag = new Gtk.TextTag({
            name: 'heading',
            size_points: 24,
            weight: Pango.Weight.BOLD
        });
        let link_tag = new Gtk.TextTag({
            name: 'link',
            foreground: '#204a87',
            underline: Pango.Underline.SINGLE
        });
        this._buffer.tag_table.add(heading_tag);
        this._buffer.tag_table.add(link_tag);

        link_tag.connect('event', this._on_tag_clicked.bind(this));
    },

    load_uri: function (title) {
        this._title = title;
        GLib.idle_add(GLib.PRIORITY_HIGH_IDLE,
            this._mimic_load_started.bind(this));
    },

    get estimated_load_progress() {
        return this._estimated_load_progress;
    },

    set estimated_load_progress(value) {
        let did_change = (this._estimated_load_progress !== value);
        this._estimated_load_progress = value;
        if (did_change)
            this.notify('estimated-load-progress');
    },

    _mimic_load_started: function () {
        this.estimated_load_progress = 0.0;
        this.emit('load-changed', this.LOAD_STARTED);
        this._buffer.set_text('', -1);
        GLib.timeout_add(GLib.PRIORITY_DEFAULT, 10 /* ms */,
            this._pretend_load.bind(this));
        return false;  // done processing
    },

    _pretend_load: function () {
        let progress = this.estimated_load_progress + 0.1;
        let done = false;
        if (progress > 1.0) {
            progress = 1.0;
            done = true;
        }
        this.estimated_load_progress = progress;
        if (done)
            GLib.idle_add(GLib.PRIORITY_HIGH_IDLE,
                this._mimic_load_finished.bind(this));
        return !done;  // true keeps the timeout around, false stops it
    },

    _mimic_load_finished: function () {
        let curpos = this._buffer.get_start_iter();

        this._buffer.insert(curpos, this._title + '\n\n', -1);
        let tagstart = this._buffer.get_start_iter();
        this._buffer.apply_tag_by_name('heading', tagstart, curpos);

        let n_words = GLib.random_int_range(150, 500);
        for (; n_words > 0; n_words--) {
            // 5% probability of a word being a link
            if (GLib.random_double() < 0.05) {
                let word = random_link_word();
                this._buffer.insert(curpos, word, -1);
                tagstart = curpos.copy();
                tagstart.backward_word_start();
                this._buffer.apply_tag_by_name('link', tagstart, curpos);
                this._buffer.insert(curpos, ' ', -1);
            } else {
                let word = random_word();
                this._buffer.insert(curpos, word + ' ', -1);
            }
        }

        this.emit('load-changed', this.LOAD_FINISHED);
    },

    _on_tag_clicked: function (tag, obj, event, iter) {
        if (event.get_event_type() !== Gdk.EventType.BUTTON_RELEASE)
            return false;
        let wordstart = iter.copy();
        let wordend = iter.copy();
        let at_start = false;

        wordstart.backward_char();
        if (wordstart.get_char() === ' ')
            at_start = true;
        wordstart.forward_char();
        if (!at_start)
            wordstart.backward_to_tag_toggle(tag);

        wordend.forward_to_tag_toggle(tag);

        let title = this._buffer.get_text(wordstart, wordend, false);
        let decision = new FakePolicyDecision();
        decision.request = { uri: title };
        let decision_was_made = this.emit('decide-policy', decision,
            this.NAVIGATION_ACTION);
        if (decision._decision === 'nothing' || !decision_was_made)
            decision._decision = 'use';
        if (decision._decision === 'use')
            this.load_uri(title);

        return false;
    }
});

const FakePolicyDecision = new Lang.Class({
    Name: 'FakePolicyDecision',
    Extends: GObject.Object,

    // Mimic WebKitNavigationType enum
    LINK_CLICKED: 0,

    _init: function () {
        this.parent();
        this.navigation_type = this.LINK_CLICKED;
        this.request = null;
        this._decision = 'nothing';
    },

    download: function () {
        this._decision = 'download';
    },

    ignore: function () {
        this._decision = 'ignore';
    },

    use: function () {
        this._decision = 'use';
    }
});

const HistoryItem = new Lang.Class({
    Name: 'HistoryItem',
    Extends: GObject.Object,
    Implements: [ EosKnowledge.HistoryItemModel ],
    Properties: {
        'title': GObject.ParamSpec.string('title', 'override', 'override',
            GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE | GObject.ParamFlags.CONSTRUCT_ONLY,
            '')
    }
});

// Create objects
let win = new Gtk.Window({
    default_width: 500,
    default_height: 500
});
let bar = new Gtk.HeaderBar({
    show_close_button: true
});
let buttons = new Gtk.Box();
buttons.get_style_context().add_class(Gtk.STYLE_CLASS_LINKED);
let back_button = new Gtk.Button({
    image: Gtk.Image.new_from_icon_name('go-previous-symbolic',
        Gtk.IconSize.SMALL_TOOLBAR)
});
let forward_button = new Gtk.Button({
    image: Gtk.Image.new_from_icon_name('go-next-symbolic',
        Gtk.IconSize.SMALL_TOOLBAR)
});
let page = new EosKnowledge.WebviewSwitcherView({
    transition_duration: 500,
    expand: true
});
let history = new EosKnowledge.HistoryModel();

// Put objects together
buttons.add(back_button);
buttons.add(forward_button);
bar.pack_start(buttons);
win.set_titlebar(bar);
win.add(page);

// Connect signals
win.connect('destroy', Gtk.main_quit);
history.bind_property('can-go-back', back_button, 'sensitive',
    GObject.BindingFlags.SYNC_CREATE);
history.bind_property('can-go-forward', forward_button, 'sensitive',
    GObject.BindingFlags.SYNC_CREATE);
history.connect('notify::current-item', function (history) {
    page.load_uri(history.current_item.title);
});
page.connect('create-webview', function () {
    return new FakeWebview();
});
page.connect('decide-navigation-policy', function (page, decision) {
    page.navigate_forwards = true;
    history.current_item = new HistoryItem({ title: decision.request.uri });
    decision.ignore();
    return true; // decision made
});
back_button.connect('clicked', function () {
    page.navigate_forwards = false;
    history.go_back();
});
forward_button.connect('clicked', function () {
    page.navigate_forwards = true;
    history.go_forward();
});

// Setup app
history.current_item = new HistoryItem({ title: 'Home Page' });
win.show_all();

Gtk.main();
