const {DModel, Eknr, Endless, GLib, Gio, GObject} = imports.gi;
const ByteArray = imports.byteArray;
const Gettext = imports.gettext;

const Config = imports.framework.config;
const Knowledge = imports.framework.knowledge;
const Utils = imports.framework.utils;
const SetMap = imports.framework.setMap;

let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);

/**
 * Class: ArticleHTMLRenderer
 */
var ArticleHTMLRenderer = new Knowledge.Class({
    Name: "ArticleHTMLRenderer",
    Extends: GObject.Object,

    Properties: {
        /**
         * Property: show-title
         * True if the article title should be rendered inside the web page.
         */
        'show-title': GObject.ParamSpec.boolean('show-title',
           'Show Title', 'Show Title',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            false),
        /**
         * Property: enable-scroll-manager
         * True if the web side javascript to scroll with the table of contents
         * should be injected.
         */
        'enable-scroll-manager': GObject.ParamSpec.boolean('enable-scroll-manager',
           'Enable Scroll Manager', 'Enable Scroll Manager',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            false),
    },

    _init: function (props={}) {
        this.parent(props);
        this._renderer = new Eknr.Renderer();
        this._custom_css_files = [];
        this._custom_js_files = [];
    },

    set_custom_css_files: function (custom_css_files) {
        this._custom_css_files = custom_css_files;
    },

    set_custom_js_files: function (custom_js_files) {
        this._custom_js_files = custom_js_files;
    },

    _get_html: function (model) {
        let data_gbytes;
        if (Utils.is_model_archive(model)) {
            let stream = model.get_archive_member_content_stream('index.html');
            // This is the best way I've found to read all bytes from a stream
            data_gbytes = stream.read_bytes(4294967295, null);
        } else {
            let engine = DModel.Engine.get_default();
            let domain = engine.get_domain();
            data_gbytes = domain.read_uri(model.id)[1];
        }

        let data_uint8array = ByteArray.fromGBytes(data_gbytes);
        return ByteArray.toString(data_uint8array);
    },

    _render_content: function (model) {
        // We have two code paths here. Newer content is server-templated, which means that
        // the HTML content in the web view has been pre-styled and we don't need much
        // additional processing.
        //
        // "Legacy" content, including most wiki sources and also 2.6 Prensa Libre content,
        // is templated and styled on the client.
        let html = this._get_html(model)

        if (model.is_server_templated)
            return html;

        return this._renderer.render_legacy_content(
            html,
            model.source,
            model.source_name,
            model.original_uri,
            model.license,
            model.title,
            this.show_title,
            this.enable_scroll_manager);
    },

    _get_system_css_files: function () {
        return [
            'clipboard.css',
            'share-actions.css',
        ];
    },

    _get_system_js_files: function () {
        const js_files = [
            'jquery-min.js',
            'clipboard-manager.js',
            'crosslink.js',
            'chunk.js',
            'share-actions.js',
            'nav-content.js',
        ];

        if (this.enable_scroll_manager) {
            js_files.push('scroll-manager.js');
        }

        if (!this.show_title) {
            js_files.push('title-hider.js');
        }

        return js_files;
    },

    _get_crosslink_data: function (model) {
        let engine = DModel.Engine.get_default();
        let links = model.outgoing_links.map((link) => engine.test_link(link));
        return JSON.stringify(links);
    },

    _get_chunk_data: function (model) {
        function get_parent_featured_sets () {
            return model.tags
                .filter(tag => !tag.startsWith('Ekn'))
                .map(tag => SetMap.get_set_for_tag(tag))
                .filter(set => typeof set !== 'undefined')
                .filter(set => set.featured);
        }

        return JSON.stringify({
            // Need to explicitly expand properties, stringify does not
            // work on GI-binded objects
            'ParentFeaturedSets': get_parent_featured_sets()
                .map(({child_tags, id, title, tags}) => ({child_tags, id, title, tags})),
        });
    },

    _get_metadata: function (model) {
        let metadata = {
            id: model.id,
            title: model.title,
            published: model.published,
            authors: model.authors,
            license: model.license,
            source: model.source,
            source_name: model.source_name,
            original_uri: model.original_uri,
            sets: [],
        };

        // augment sets data to make it useful
        model.tags.forEach((tag) => {
            if (tag.startsWith('Ekn'))
                return;
            let set = SetMap.get_set_for_tag(tag);
            if (!set)
                return;
            metadata['sets'].push({
                id: set.id,
                title: set.title,
                featured: set.featured,
            });
        });

        return JSON.stringify(metadata);
    },

    _get_share_actions_markup: function (model) {

        if (!model.original_uri || model.original_uri === '')
            return '';

        function get_svg (uri) {
            let file = Gio.file_new_for_uri(uri);

            try {
                return Utils.load_string_from_file(file);
            } catch(e) {
                return null;
            };
        }

        function get_button_markup (network) {
            let markup = get_svg(`file:///usr/share/runtime/share/icons/EndlessOS/scalable/apps/${network}-symbolic.svg`);

            if (!markup)
                markup = get_svg(`resource:///com/endlessm/knowledge/data/icons/scalable/apps/${network}-symbolic.svg`);

            return `
            <a class="share-action"
               onclick="window.webkit.messageHandlers.share_on_${network}.postMessage(0)">
               ${markup}
            </a>`;
        }

        let facebook = get_button_markup('facebook');
        let twitter = get_button_markup('twitter');
        let whatsapp = get_button_markup('whatsapp');

        return `<div id="default-share-actions" style="visibility: hidden;">${facebook}${twitter}${whatsapp}</div>`;
    },

    _render_wrapper: function (content, model) {
        let base_uri;

        if (model.id.startsWith('ekn://')) {
            base_uri = `${model.id}/`;
        } else {
            base_uri = `${model.id}`;
        }

        let template = Gio.File.new_for_uri('resource:///com/endlessm/knowledge/data/templates/article-wrapper.mst');

        return this._renderer.render_mustache_document_from_file(template, new GLib.Variant('a{sv}', {
            'id': new GLib.Variant('s', model.id),
            'base-uri': new GLib.Variant('s', base_uri),
            'system-css-files': new GLib.Variant('as', this._get_system_css_files()),
            'custom-css-files': new GLib.Variant('as', this._custom_css_files),
            'system-js-files': new GLib.Variant('as', this._get_system_js_files()),
            'custom-js-files': new GLib.Variant('as', this._custom_js_files),
            'copy-button-text': new GLib.Variant('s', _("Copy")),
            'share-actions': new GLib.Variant('s', this._get_share_actions_markup(model)),
            'content': new GLib.Variant('s', content),
            'crosslink-data': new GLib.Variant('s', this._get_crosslink_data(model)),
            'chunk-data': new GLib.Variant('s', this._get_chunk_data(model)),
            'content-metadata': new GLib.Variant('s', this._get_metadata(model)),
        }));
    },

    /*
     * The render method is called with an article model :model and returns a
     * string of ready to display html.
     */
    render: function (model) {
        let content = this._render_content(model);
        return this._render_wrapper(content, model);
    },
});
