const Eknc = imports.gi.EosKnowledgeContent;
const Eknr = imports.gi.EosKnowledgeRenderer;
const Endless = imports.gi.Endless;
const Gettext = imports.gettext;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;

const Config = imports.app.config;
const Knowledge = imports.app.knowledge;
const Utils = imports.app.utils;
const SetMap = imports.app.setMap;

let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);

function template_file(template_filename) {
    return Gio.file_new_for_uri('resource:///com/endlessm/knowledge/data/templates/' + template_filename);
}

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
        this._renderer = new Eknr.Renderer({});
        this._custom_css_files = [];
    },

    _strip_tags: function (html) {
        return html.replace(/^\s*<html>\s*<body>/, '').replace(/<\/body>\s*<\/html>\s*$/, '');
    },

    set_custom_css_files: function (custom_css_files) {
        this._custom_css_files = custom_css_files;
    },

    _get_app_override_css_files: function () {
        let app = Gio.Application.get_default();
        return app.get_web_overrides_css();
    },

    _get_legacy_disclaimer: function (model) {
        switch (model.source) {
            case 'wikipedia':
            case 'wikibooks':
            case 'wikisource':
                let original_link = _to_link(model.original_uri, model.source_name);
                let license_link = _to_license_link(model.license);
                // TRANSLATORS: anything inside curly braces '{}' is going
                // to be substituted in code. Please make sure to leave the
                // curly braces around any words that have them and DO NOT
                // translate words inside curly braces.
                return _("This page contains content from {original-link}, available under a {license-link} license.")
                .replace('{original-link}', original_link)
                .replace('{license-link}', license_link);
            case 'wikihow':
                let wikihow_article_link = _to_link(model.original_uri, model.title);
                // TRANSLATORS: Replace this with a link to the homepage of
                // wikiHow in your language.
                let wikihow_link = _to_link(_("http://wikihow.com"), model.source_name);
                // TRANSLATORS: anything inside curly braces '{}' is going
                // to be substituted in code. Please make sure to leave the
                // curly braces around any words that have them and DO NOT
                // translate words inside curly braces.
                return _("See {wikihow-article-link} for more details, videos, pictures and attribution. Courtesy of {wikihow-link}, where anyone can easily learn how to do anything.")
                .replace('{wikihow-article-link}', wikihow_article_link)
                .replace('{wikihow-link}', wikihow_link);
            default:
                return false;
        }
    },

    _should_include_mathjax: function (model) {
        let may_have_mathjax = ['wikipedia', 'wikibooks', 'wikisource'];
        return (may_have_mathjax.indexOf(model.source) !== -1);
    },

    _get_legacy_css_files: function (model) {
        let css_files = [];

        switch (model.source) {
            case 'wikipedia':
            case 'wikibooks':
            case 'wikisource':
                css_files.push('wikimedia.css');
                break;
            case 'wikihow':
                css_files.push('wikihow.css');
                break;
        }
        return css_files;
    },

    _get_legacy_javascript_files: function (model) {
        let javascript_files = [
            'content-fixes.js',
            'hide-broken-images.js',
        ];

        if (this.enable_scroll_manager)
            javascript_files.push('scroll-manager.js');

        return javascript_files;
    },

    _get_html: function (model) {
        let [success, bytes, mime] = Eknc.Engine.get_default().get_domain().read_uri(model.ekn_id);
        return bytes.get_data().toString();
    },

    _render_legacy_content: function (model) {
        let css_files = this._get_legacy_css_files(model);
        let js_files = this._get_legacy_javascript_files(model);

        let html = this._get_html(model);

        let title = this.show_title ? model.title : false;

        return this._renderer.render_mustache_document_from_file(template_file('legacy-article.mst'), new GLib.Variant('a{sv}', {
            'title': new GLib.Variant(typeof(title) === 'boolean' ? 'b' : 's', title),
            'body-html': new GLib.Variant('s', this._strip_tags(html)),
            'disclaimer': new GLib.Variant('s', this._get_legacy_disclaimer(model)),
            'copy-button-text': new GLib.Variant('s', _("Copy")),
            'css-files': new GLib.Variant('as', css_files),
            'javascript-files': new GLib.Variant('as', js_files),
            'include-mathjax': new GLib.Variant('b',
                                                this._should_include_mathjax(model)),
            'mathjax-path': new GLib.Variant('s', Config.mathjax_path),
        }));
    },

    _render_prensa_libre_content: function (model) {
        let html = this._get_html(model);

        return this._renderer.render_mustache_document_from_file(template_file('news-article.mst'), new GLib.Variant('a{sv}', {
            'css-files': new GLib.Variant('as', ['prensa-libre.css']),
            'body-html': new GLib.Variant('s', this._strip_tags(html)),
        }));
    },

    _render_content: function (model) {
        // We have two code paths here. Newer content is server-templated, which means that
        // the HTML content in the web view has been pre-styled and we don't need much
        // additional processing.
        //
        // "Legacy" content, including most wiki sources and also 2.6 Prensa Libre content,
        // is templated and styled on the client.

        if (model.is_server_templated) {
            return this._get_html(model);
        } else {
            switch (model.source) {
            case 'wikipedia':
            case 'wikibooks':
            case 'wikisource':
            case 'wikihow':
                return this._render_legacy_content(model);
            case 'prensa-libre':
                return this._render_prensa_libre_content(model);
            default:
                return null;
            }
        }
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
        ];
    },

    _get_crosslink_data: function (model) {
        let engine = Eknc.Engine.get_default();
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

        return this._renderer.render_mustache_document_from_file(template_file('article-wrapper.mst'), new GLib.Variant('a{sv}', {
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

function _to_link(uri, text) {
    return '<a class="eos-show-link" href="' + uri + '">' + Eknr.escape_html(text) + '</a>';
}

function _to_license_link (license) {
    return _to_link('license://' + GLib.uri_escape_string(license, null, false),
        Endless.get_license_display_name(license));
}

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
