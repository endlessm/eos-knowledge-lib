const Gettext = imports.gettext;
const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;
const Lang = imports.lang;
const Mustache = imports.mustache.Mustache;

const Config = imports.config;

let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);

const _ARTICLE_TEMPLATE = 'resource:///com/endlessm/knowledge/templates/article.mst';

const ArticleHTMLRenderer = new Lang.Class({
    Name: "ArticleHTMLRenderer",
    GTypeName: 'EknArticleHTMLRenderer',
    Extends: GObject.Object,

    _init: function () {
        this.parent();
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
        let to_link = function (uri, text) {
            return '<a class="eos-show-link" href="browser-' + uri + '">' + Mustache.escape(text) + '</a>';
        };
        switch (model.html_source) {
            case 'wikipedia':
            case 'wikibooks':
            case 'wikisource':
                let original_link = to_link(model.source_uri, model.html_source);
                let license_link = to_link(_("http://creativecommons.org/licenses/by-sa/3.0/"), _("CC BY-SA"));
                // TRANSLATORS: anything inside curly braces '{}' is going
                // to be substituted in code. Please make sure to leave the
                // curly braces around any words that have them and DO NOT
                // translate words inside curly braces.
                return _("This page contains content from {original-link}, available under a {license-link} license.")
                .replace('{original-link}', original_link)
                .replace('{license-link}', license_link);
            case 'wikihow':
                let wikihow_article_link = to_link(model.source_uri, model.title);
                let wikihow_link = to_link(_("http://wikihow.com"), _("WikiHow"));
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

    _get_css_files: function (model) {
        let css_files = [];
        switch (model.html_source) {
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
        return ['jquery-min.js',
                'clipboard-manager.js',
                'content-fixes.js',
                'hide-broken-images.js',
                'no-link-remover.js',
                'scroll-manager.js'];
    },

    render: function (model, show_title=true) {
        return Mustache.render(this._template, {
            'title': show_title ? model.title : false,
            'body-html': this._strip_tags(model.html),
            'disclaimer': this._get_disclaimer(model),
            'copy-button-text': _("Copy"),
            'css-files': this._get_css_files(model),
            'javascript-files': this._get_javascript_files(model),
            'include-mathjax': true,
            'mathjax-path': Config.mathjax_path,
        });
    },
});
