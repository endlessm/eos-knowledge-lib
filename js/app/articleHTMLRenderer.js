const Endless = imports.gi.Endless;
const Gettext = imports.gettext;
const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;
const Lang = imports.lang;
const Engine = imports.search.engine;

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

    _get_javascript_files: function (model) {
        let javascript_files = [];

        if (this.enable_scroll_manager)
            javascript_files.push('scroll-manager.js');

        return javascript_files;
    },

    _should_include_mathjax: function (model) {
        let may_have_mathjax = ['wikipedia', 'wikibooks', 'wikisource'];
        return (may_have_mathjax.indexOf(model.source) !== -1);
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
        let css_files = this._custom_css_files;
        let js_files = this._get_javascript_files(model).concat(this._custom_javascript_files);

        let stream = model.get_content_stream();
        let html = SearchUtils.read_stream_sync(stream);
        return Mustache.render(this._template, {
            'hide-title': !this.show_title,
            'body-html': html,
            'link-hash': this._find_links(model),
            'js-files': js_files,
            'css-files': css_files,
        });
    },

    _find_links: function (model) {
        let engine = Engine.get_default();
        let link_table = model.links.map((link) => engine.test_link(link) ? link : null);
        return JSON.stringify(hash);
    },
});
