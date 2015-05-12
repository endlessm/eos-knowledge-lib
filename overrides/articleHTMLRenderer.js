/* global private_imports */

const Gettext = imports.gettext;
const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;
const Lang = imports.lang;

const Config = private_imports.config;
const Mustache = private_imports.mustache.Mustache;
const Licenses = private_imports.licenses;

let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);

const _ARTICLE_TEMPLATE = 'resource:///com/endlessm/knowledge/templates/article.mst';

const ArticleHTMLRenderer = new Lang.Class({
    Name: "ArticleHTMLRenderer",
    GTypeName: 'EknArticleHTMLRenderer',
    Extends: GObject.Object,

    Properties: {
        'show-title':  GObject.ParamSpec.boolean('show-title', 'Show Title',
            'Whether or not rendered HTML should have a visible title',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, false),
        'enable-scroll-manager':  GObject.ParamSpec.boolean('enable-scroll-manager',
            'Enable Scroll Manager',
            'Whether scroll_manager.js should monitor user scrolling',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, false),
    },

    _init: function (props={}) {
        this.parent(props);
        let file = Gio.file_new_for_uri(_ARTICLE_TEMPLATE);
        let [success, string] = file.load_contents(null);
        if (success) {
            this._template = string.toString();
            Mustache.parse(this._template);
        } else {
            throw new Error('Could not open article template');
        }
    },

    _strip_tags: function (html) {
        return html.replace(/^\s*<html>\s*<body>/, '').replace(/<\/body>\s*<\/html>\s*$/, '');
    },

    _get_disclaimer: function (model) {
        switch (model.source) {
            case 'wikipedia':
            case 'wikibooks':
            case 'wikisource':
                let original_link = _to_link(model.original_uri, model.source_name);
                let license_link = _to_link(Licenses.LICENSE_LINKS[model.license],
                    Licenses.LICENSE_NAMES[model.license]);
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
            case 'embedly':
                let blog_link;
                if (model.original_uri)
                    blog_link = _to_link(model.original_uri, model.source_name);
                else
                    blog_link = model.source_name;
                let message = _get_display_string_for_license(model.license);
                return message.replace('{blog-link}', blog_link);
            default:
                return false;
        }
    },

    _get_css_files: function (model) {
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
            case 'embedly':
                css_files.push('embedly.css');
                break;
        }
        return css_files;
    },

    _get_javascript_files: function (model) {
        let javascript_files = [
            'jquery-min.js',
            'clipboard-manager.js',
            'content-fixes.js',
            'hide-broken-images.js',
            'no-link-remover.js',
        ];

        if (this.enable_scroll_manager)
            javascript_files.push('scroll-manager.js');

        return javascript_files;
    },

    render: function (model) {
        return Mustache.render(this._template, {
            'title': this.show_title ? model.title : false,
            'body-html': this._strip_tags(model.get_html()),
            'disclaimer': this._get_disclaimer(model),
            'copy-button-text': _("Copy"),
            'css-files': this._get_css_files(model),
            'javascript-files': this._get_javascript_files(model),
            'include-mathjax': true,
            'mathjax-path': Config.mathjax_path,
        });
    },
});

function _to_link(uri, text) {
    return '<a class="eos-show-link" href="browser-' + uri + '">' + Mustache.escape(text) + '</a>';
}

function _get_display_string_for_license(license) {
    let message;
    if (license === Licenses.NO_LICENSE)
        // TRANSLATORS: the text inside curly braces {blog-link} is going to be
        // substituted in code. Please make sure that your translation contains
        // {blog-link} and it is not translated.
        return _("Content taken from {blog-link}.");
    if (license === Licenses.OWNER_PERMISSION)
        // TRANSLATORS: the text inside curly braces {blog-link} is going to be
        // substituted in code. Please make sure that your translation contains
        // {blog-link} and it is not translated.
        return _("Content courtesy of {blog-link}. Used with kind permission.");

    let license_link = _to_link(Licenses.LICENSE_LINKS[license],
        Licenses.LICENSE_NAMES[license]);
    // TRANSLATORS: the text inside curly braces ({blog-link}, {license-link})
    // is going to be substituted in code. Please make sure that your
    // translation contains both {blog-link} and {license-link} and they are not
    // translated.
    return _("Content courtesy of {blog-link}, licensed under {license-link}.")
        .replace('{license-link}', license_link);
}
