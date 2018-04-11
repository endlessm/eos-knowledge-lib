const {DModel, Eknr, Endless, GLib, Gio, GObject} = imports.gi;
const Gettext = imports.gettext;

const Config = imports.app.config;
const Knowledge = imports.app.knowledge;
const Utils = imports.app.utils;
const SetMap = imports.app.setMap;

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
    },

    set_custom_css_files: function (custom_css_files) {
        this._custom_css_files = custom_css_files;
    },

    _get_app_override_css_files: function () {
        let app = Gio.Application.get_default();
        return app.get_web_overrides_css();
    },

    _get_html: function (model) {
        let engine = DModel.Engine.get_default();
        let domain = engine.get_domain();
        let [, bytes] = domain.read_uri(model.ekn_id);
        return bytes.get_data().toString();
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

    _get_wrapper_css_files: function () {
        return ['clipboard.css', 'share-actions.css'].concat(this._custom_css_files);
    },

    _get_wrapper_js_files: function () {
        return [
            'jquery-min.js',
            'clipboard-manager.js',
            'crosslink.js',
            'chunk.js',
            'share-actions.js',
            'nav-content.js',
        ];
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
            'ParentFeaturedSets': get_parent_featured_sets().map((set) => ({
                child_tags: set.child_tags,
                ekn_id: set.ekn_id,
                title: set.title,
                tags: set.tags,
            })),
        });
    },

    _get_metadata: function (model) {
        let metadata = {
            id: model.ekn_id,
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
                id: set.ekn_id,
                title: set.title,
                featured: set.featured,
            });
        });

        return JSON.stringify(metadata);
    },

    _get_share_actions_markup: function (model) {

        if (!model.original_uri || model.original_uri === '')
            return '';

        function get_button_markup (network) {
            let file = Gio.file_new_for_uri(`resource:///com/endlessm/knowledge/data/icons/scalable/apps/${network}-symbolic.svg`);
            let [success, svg] = file.load_contents(null);
            return `
            <a class="share-action"
               onclick="window.webkit.messageHandlers.share_on_${network}.postMessage(0)">
               ${svg.toString()}
            </a>`;
        }

        let facebook = get_button_markup('facebook');
        let twitter = get_button_markup('twitter');
        let whatsapp = get_button_markup('whatsapp');

        return `<div id="default-share-actions" style="visibility: hidden;">${facebook}${twitter}${whatsapp}</div>`;
    },

    _render_wrapper: function (content, model) {
        let css_files = this._get_wrapper_css_files();
        let js_files = this._get_wrapper_js_files();

        let template = Gio.File.new_for_uri('resource:///com/endlessm/knowledge/data/templates/article-wrapper.mst');

        return this._renderer.render_mustache_document_from_file(template, new GLib.Variant('a{sv}', {
            'id': new GLib.Variant('s', model.ekn_id),
            'css-files': new GLib.Variant('as', css_files),
            'custom-css-files': new GLib.Variant('as', this._get_app_override_css_files()),
            'javascript-files': new GLib.Variant('as', js_files),
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

function _get_display_string_for_license(license) {
    if (license === Endless.LICENSE_NO_LICENSE)
        // TRANSLATORS: the text inside curly braces {blog-link} is going to be
        // substituted in code. Please make sure that your translation contains
        // {blog-link} and it is not translated.
        return _("Content taken from {blog-link}.");
    if (license === Endless.LICENSE_OWNER_PERMISSION)
        // TRANSLATORS: the text inside curly braces {blog-link} is going to be
        // substituted in code. Please make sure that your translation contains
        // {blog-link} and it is not translated.
        return _("Content courtesy of {blog-link}. Used with kind permission.");

    let license_link = _to_license_link(license);
    // TRANSLATORS: the text inside curly braces ({blog-link}, {license-link})
    // is going to be substituted in code. Please make sure that your
    // translation contains both {blog-link} and {license-link} and they are not
    // translated.
    return _("Content courtesy of {blog-link}, licensed under {license-link}.")
        .replace('{license-link}', license_link);
}
