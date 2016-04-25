const Endless = imports.gi.Endless;
const Gettext = imports.gettext;
const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;

const Config = imports.app.config;
const Knowledge = imports.app.knowledge;
const Mustache = imports.app.libs.mustache.Mustache;
const SearchUtils = imports.search.utils;
const SetMap = imports.app.setMap;

let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);

const _MODAL_TEMPLATE = '\
<div class="eos-modal" id="modal">\
    <a class="eos-modal-close-background" href="#close"></a>\
    <div>\
        <a class="eos-modal-close-button" href="#close"> &times </a>\
        {content}\
    </div>\
</div>';

const _ARTICLE_TEMPLATE = 'resource:///com/endlessm/knowledge/data/templates/article.mst';
let _template_contents;
// Caches so we only load once.
function load_article_template () {
    if (_template_contents)
        return _template_contents;
    let file = Gio.file_new_for_uri(_ARTICLE_TEMPLATE);
    let [success, string] = file.load_contents(null);
    _template_contents = string.toString();
    // Makes calls to Mustache.render with this template faster
    Mustache.parse(_template_contents);
    return _template_contents;
}

/**
 * Class: ArticleHTMLRenderer
 */
const ArticleHTMLRenderer = new Knowledge.Class({
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
        this._template = load_article_template();
        this._custom_css_files = [];
        this._custom_javascript_files = [];
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
            case 'prensa-libre':
                let article_link = _to_link(model.original_uri, 'Prensalibre.com');
                let disclaimer_label = _("Legal Notice and Intellectual Property Policy");
                let disclaimer_link = _to_modal_link(disclaimer_label);
                // TRANSLATORS: anything inside curly braces '{}' is going to be
                // substituted in code. Please make sure to leave the curly
                // braces around any words that have them, and do not translate
                // words inside curly braces.
                let disclaimer = _("Read more at {link}")
                    .replace('{link}', article_link);
                disclaimer += '<br>' + disclaimer_link;
                return disclaimer;
            default:
                return false;
        }
    },

    _get_disclaimer_window: function (model) {
        if (model.source !== 'prensa-libre') {
            return false;
        }

        let disclaimer_content = _to_disclaimer_paragraph(_("DISCLAIMER PLACEHOLDER"));
        let modal_html = _MODAL_TEMPLATE.replace('{content}', disclaimer_content);
        return modal_html;
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
            case 'prensa-libre':
                css_files.push('prensa-libre.css');
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

    _should_include_mathjax: function (model) {
        let may_have_mathjax = ['wikipedia', 'wikibooks', 'wikisource'];
        return (may_have_mathjax.indexOf(model.source) !== -1);
    },

    _get_extra_header_info: function (model) {
        if (model.source !== 'prensa-libre')
            return false;

        let featured_set = model.tags
            .filter(tag => !tag.startsWith('Ekn'))
            .map(tag => SetMap.get_set_for_tag(tag))
            .filter(set => typeof set !== 'undefined')
            .filter(set => set.featured)[0];
        return {
            'date-published': new Date(model.published).toLocaleDateString(),
            'context': _to_set_link(featured_set),
            'source-link': _to_link(model.original_uri, 'Prensalibre.com'),
            'author': model.authors.join('—'),
        };
    },

    set_custom_css_files: function (custom_css_files) {
        this._custom_css_files = custom_css_files;
    },

    set_custom_javascript_files: function (custom_javascript_files) {
        this._custom_javascript_files = custom_javascript_files;
    },

    /*
     * The render method is called with an article model :model and returns a
     * string of ready to display html.
     */
    render: function (model) {
        let css_files = this._get_css_files(model).concat(this._custom_css_files);
        let js_files = this._get_javascript_files(model).concat(this._custom_javascript_files);

        let stream = model.get_content_stream();
        let html = SearchUtils.read_stream_sync(stream);
        return Mustache.render(this._template, {
            'title': this.show_title ? model.title : false,
            'body-html': this._strip_tags(html),
            'disclaimer': this._get_disclaimer(model),
            'disclaimer-window': this._get_disclaimer_window(model),
            'copy-button-text': _("Copy"),
            'css-files': css_files,
            'javascript-files': js_files,
            'include-mathjax': this._should_include_mathjax(model),
            'mathjax-path': Config.mathjax_path,
            'extra-header-information': this._get_extra_header_info(model),
        });
    },
});

function _to_set_link (model) {
    return '<a class="eos-show-link" href="' + model.ekn_id + '">' + Mustache.escape(model.title.toLowerCase()) + '</a>';
}

function _to_link(uri, text) {
    return '<a class="eos-show-link" href="browser-' + uri + '">' + Mustache.escape(text) + '</a>';
}

function _to_modal_link(text) {
    return '<a class="eos-modal-link" href="#modal">' + Mustache.escape(text) + '</a>';
}

function _to_disclaimer_paragraph(text) {
    return '<p align="justify">' + Mustache.escape(text) + '</p>';
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

    let license_link = _to_link(Endless.get_license_file(license).get_uri(),
        Endless.get_license_display_name(license));
    // TRANSLATORS: the text inside curly braces ({blog-link}, {license-link})
    // is going to be substituted in code. Please make sure that your
    // translation contains both {blog-link} and {license-link} and they are not
    // translated.
    return _("Content courtesy of {blog-link}, licensed under {license-link}.")
        .replace('{license-link}', license_link);
}
