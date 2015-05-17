const Endless = imports.gi.Endless;
const Gettext = imports.gettext;
const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;
const Lang = imports.lang;

const Config = imports.app.config;
const Mustache = imports.app.mustache.Mustache;

let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);

const _ARTICLE_TEMPLATE = 'resource:///com/endlessm/knowledge/templates/article.mst';

const ArticleHTMLRenderer = new Lang.Class({
    Name: "ArticleHTMLRenderer",
    GTypeName: 'EknArticleHTMLRenderer',
    Extends: GObject.Object,

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
                let license_link = _to_link(Endless.get_license_file(model.license).get_uri(),
                    Endless.get_license_display_name(model.license));
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

    _get_javascript_files: function (model, enable_scroll_manager) {
        let javascript_files = [
            'jquery-min.js',
            'clipboard-manager.js',
            'content-fixes.js',
            'hide-broken-images.js',
            'no-link-remover.js',
        ];

        if (enable_scroll_manager)
            javascript_files.push('scroll-manager.js');

        return javascript_files;
    },

    /*
        The render method is called with an article model :model
        and a dictionary of options :opts specifying how to render
        the webpage.
        :opts should be a dictionary with the following optional
        keys.
        custom_css_files: an array of strings, specifying extra CSS files to include
        custom_js_files: an array of strings, specifying extra JS files to include
        show_title: a boolean specifying whether or not to show the article title in an <h1> tag
        enable_scroll_manager: a boolean specifying whether or not to enable javascript for smooth scrolling
    */
    render: function (model, opts={}) {
        let css_files = this._get_css_files(model);
        if (opts.hasOwnProperty('custom_css_files')) {
            css_files = css_files.concat(opts.custom_css_files);
        }

        let js_files = this._get_javascript_files(model, opts.enable_scroll_manager);
        if (opts.hasOwnProperty('custom_js_files')) {
            js_files = js_files.concat(opts.custom_js_files);
        }

        return Mustache.render(this._template, {
            'title': opts.show_title ? model.title : false,
            'body-html': this._strip_tags(model.get_html()),
            'disclaimer': this._get_disclaimer(model),
            'copy-button-text': _("Copy"),
            'css-files': css_files,
            'javascript-files': js_files,
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

    let license_link = _to_link(Endless.get_license_file(license).get_uri(),
        Endless.get_license_display_name(license));
    // TRANSLATORS: the text inside curly braces ({blog-link}, {license-link})
    // is going to be substituted in code. Please make sure that your
    // translation contains both {blog-link} and {license-link} and they are not
    // translated.
    return _("Content courtesy of {blog-link}, licensed under {license-link}.")
        .replace('{license-link}', license_link);
}
