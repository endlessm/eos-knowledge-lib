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

let _template_cache = {};
function _load_template(template_filename) {
    let uri = 'resource:///com/endlessm/knowledge/data/templates/' + template_filename;
    if (_template_cache[uri] === undefined) {
        let file = Gio.file_new_for_uri(uri);
        let [success, string] = file.load_contents(null);
        let template = string.toString();
        Mustache.parse(template);
        _template_cache[uri] = template;
    }
    return _template_cache[uri];
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
        this._custom_css_files = [];
        this._custom_javascript_files = [];
    },

    _strip_tags: function (html) {
        return html.replace(/^\s*<html>\s*<body>/, '').replace(/<\/body>\s*<\/html>\s*$/, '');
    },

    set_custom_css_files: function (custom_css_files) {
        this._custom_css_files = custom_css_files;
    },

    set_custom_javascript_files: function (custom_javascript_files) {
        this._custom_javascript_files = custom_javascript_files;
    },

    _get_legacy_disclaimer: function (model) {
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
            case 'embedly':
                css_files.push('embedly.css');
                break;
        }
        return css_files;
    },

    _get_legacy_javascript_files: function (model) {
        let javascript_files = [
            'content-fixes.js',
            'hide-broken-images.js',
            'no-link-remover.js',
        ];

        if (this.enable_scroll_manager)
            javascript_files.push('scroll-manager.js');

        return javascript_files;
    },

    _get_html: function (model) {
        let stream = model.get_content_stream();
        return SearchUtils.read_stream_sync(stream);
    },

    _render_legacy_content: function (model) {
        let css_files = this._get_legacy_css_files(model);
        let js_files = this._get_legacy_javascript_files(model);

        let html = this._get_html(model);

        let template = _load_template('legacy-article.mst');

        return Mustache.render(template, {
            'title': this.show_title ? model.title : false,
            'body-html': this._strip_tags(html),
            'disclaimer': this._get_legacy_disclaimer(model),
            'copy-button-text': _("Copy"),
            'css-files': css_files,
            'javascript-files': js_files,
            'include-mathjax': this._should_include_mathjax(model),
            'mathjax-path': Config.mathjax_path,
        });
    },

    _render_prensa_libre_content: function (model) {
        function get_extra_header_info() {
            let featured_set = model.tags
                .filter(tag => !tag.startsWith('Ekn'))
                .map(tag => SetMap.get_set_for_tag(tag))
                .filter(set => typeof set !== 'undefined')
                .filter(set => set.featured)[0];

            let retval = {
                'date-published': new Date(model.published).toLocaleDateString(),
                'source-link': _to_link(model.original_uri, 'Prensalibre.com'),
                'author': model.authors.join('—'),
            };

            if (featured_set)
                retval.context = _to_set_link(featured_set);
            return retval;
        }

        function get_disclaimer_link() {
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
        }

        let disclaimer_window = _("DISCLAIMER PLACEHOLDER");

        let html = this._get_html(model);

        let template = _load_template('news-article.mst');

        return Mustache.render(template, {
            'css-files': ['prensa-libre.css'],
            'body-html': this._strip_tags(html),
            'disclaimer': get_disclaimer_link(),
            'disclaimer-window': disclaimer_window,
            'extra-header-information': get_extra_header_info(),
        });
    },

    _render_content: function (model) {
        switch (model.source) {
        case 'wikipedia':
        case 'wikibooks':
        case 'wikisource':
        case 'wikihow':
        case 'embedly':
            return this._render_legacy_content(model);
        case 'prensa-libre':
            return this._render_prensa_libre_content(model);
        case 'server-template-v1':
            return this._get_html(model);
        default:
            return null;
        }
    },

    _get_wrapper_css_files: function () {
        return ['clipboard.css'].concat(this._custom_css_files);
    },

    _get_wrapper_js_files: function () {
        return ['jquery-min.js', 'clipboard-manager.js'].concat(this._custom_javascript_files);
    },

    _render_wrapper: function (model, content) {
        let css_files = this._get_wrapper_css_files();
        let js_files = this._get_wrapper_js_files();

        let template = _load_template('article-wrapper.mst');

        return Mustache.render(template, {
            'id': model.ekn_id,
            'css-files': css_files,
            'javascript-files': js_files,
            'copy-button-text': _("Copy"),
            'content': content,
        });
    },

    /*
     * The render method is called with an article model :model and returns a
     * string of ready to display html.
     */
    render: function (model) {
        let content = this._render_content(model);
        return this._render_wrapper(model, content);
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
