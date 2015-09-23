const Gettext = imports.gettext;
const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;

const Config = imports.app.config;
const ContentObjectModel = imports.search.contentObjectModel;
const Engine = imports.search.engine;
const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;

let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);

function transform_v1_description(json) {
    let modules = {};

    switch (json.templateType) {
    case "A":
        modules["window"] = {
            "type": "Window",
            "properties": {
                "title": json["appTitle"],
                "background-image-uri": json["backgroundHomeURI"],
                "blur-background-image-uri": json["backgroundSectionURI"],
            },
        };
        modules["app-banner"] = {
            "type": "AppBanner",
            "properties": {
                "image-uri": json["titleImageURI"],
                "min-fraction": 0.4,
                "max-fraction": 0.7,
            },
        };
        modules["top-bar-search"] = {
            "type": "SearchBox",
        };
        modules["home-search"] = {
            "type": "SearchBox",
            "properties": {
                "width-request": 400,
                "halign": Gtk.Align.CENTER,
            }
        };
        modules["home-card"] = {
            "type": "CardA",
            "properties": {
                "hexpand": true,
                "halign": Gtk.Align.CENTER,
            }
        };
        modules["results-arrangement"] = {
            "type": "GridArrangement",
            "properties": {
                "bottom-buffer": 250,
            },
        };
        modules["set-banner-card"] = {
            "type": "TextCard",
        };
        modules["set-banner-module"] = {
            "type": "SetBannerModule",
            "properties": {
                "halign": Gtk.Align.CENTER,
            },
            "slots": {
                "card_type": "set-banner-card",
            },
        };
        modules["item-group"] = {
            "type": "ItemGroupModule",
            "slots": {
                "arrangement": "results-arrangement",
                "card_type": "results-card",
            },
        };
        modules["section-page-template"] = {
            "type": "BannerTemplate",
            "properties": {
                "margin-start": 150,
                "margin-end": 150,
            },
            "slots": {
                "banner": "set-banner-module",
                "content": "item-group",
            },
        };
        modules["home-page-template"] = {
            "type": "HomePageATemplate",
            "slots": {
                "top": "app-banner",
                "middle": "home-search",
                "bottom": "home-page-set-group",
                "basement": "home-page-basement-set-group",
            },
            "properties": {
                "upper-button-label": _("SEE ALL CATEGORIES"),
                "basement-button-label": _("HOME"),
            },
        };
        modules["results-card"] = {
            "type": "CardA",
        };
        modules["search-results"] = {
            "type": "SearchModule",
            "slots": {
                "arrangement": "results-arrangement",
                "card_type": "results-card",
            },
        };
        modules["home-page-arrangement"] = {
            "type": "OverflowArrangement",
            "properties": {
                "orientation": Gtk.Orientation.HORIZONTAL,
            },
        };
        modules["home-card"] = {
            "type": "CardA",
        };
        modules["home-page-set-group"] = {
            "type": "SetGroupModule",
            "properties": {
                "expand": true,
                "halign": Gtk.Align.CENTER,
                "valign": Gtk.Align.CENTER,
                "max-children": 6,
            },
            "slots": {
                "arrangement": "home-page-arrangement",
                "card_type": "home-card",
            },
        };
        modules["home-page-basement-set-group"] = {
            "type": "SetGroupModule",
            "properties": {
                "expand": true,
            },
            "slots": {
                "arrangement": "results-arrangement",
                "card_type": "home-card",
            },
        };
        modules["results-search-banner"] = {
            "type": "SearchBannerModule",
            "properties": {
                "halign": Gtk.Align.CENTER,
            },
        };
        modules["search-page-template"] = {
            "type": "BannerTemplate",
            "properties": {
                "margin-start": 150,
                "margin-end": 150,
            },
            "slots": {
                "banner": "results-search-banner",
                "content": "search-results",
            },
        };
        modules["lightbox-card"] = {
            "type": "MediaCard",
        };
        modules["lightbox"] = {
            "type": "LightboxModule",
            "slots": {
                "card-type": "lightbox-card",
            },
        };
        modules["document-card"] = {
            "type": "KnowledgeDocumentCard",
            "properties": {
                "show_top_title": true,
                "show_toc": true,
            },
        };
        modules["article-page-template"] = {
            "type": "ArticleStackModule",
            "slots": {
                "card-type": "document-card",
            },
        };
        break;
    case "B":
        modules["window"] = {
            "type": "Window",
            "properties": {
                "title": json["appTitle"],
                "background-image-uri": json["backgroundHomeURI"],
                "blur-background-image-uri": json["backgroundSectionURI"],
            },
        };
        modules["app-banner"] = {
            "type": "AppBanner",
            "properties": {
                "image-uri": json["titleImageURI"],
                "min-fraction": 0.4,
                "max-fraction": 0.7,
                "valign": Gtk.Align.CENTER,
                "halign": Gtk.Align.CENTER,
                "expand": false,
            },
        };
        modules["home-page-set-group"] = {
            "type": "SetGroupModule",
            "properties": {
                "expand": true,
                "halign": Gtk.Align.FILL,
                "valign": Gtk.Align.FILL,
            },
            "slots": {
                "arrangement": "home-page-arrangement",
                "card_type": "home-card",
            },
        };
        modules["home-page-template"] = {
            "type": "HomePageBTemplate",
            "slots": {
                "top_left": "app-banner",
                "top_right": "home-search",
                "bottom": "home-page-set-group",
            },
        };
        modules["home-page-arrangement"] = {
            "type": "TiledGridArrangement",
        };
        modules["top-bar-search"] = {
            "type": "SearchBox",
        };
        modules["home-search"] = {
            "type": "SearchBox",
            "properties": {
                "width-request": 350,
                "visible": true,
                "shadow-type": Gtk.ShadowType.NONE,
                "halign": Gtk.Align.CENTER,
                "valign": Gtk.Align.CENTER,
            },
        };
        modules["home-card"] = {
            "type": "CardB",
        };
        modules["set-banner-card"] = {
            "type": "TextCard",
        };
        modules["set-banner-module"] = {
            "type": "SetBannerModule",
            "properties": {
                "valign": Gtk.Align.END,
            },
            "slots": {
                "card_type": "set-banner-card",
            },
        };
        modules["item-group"] = {
            "type": "ItemGroupModule",
            "slots": {
                "arrangement": "results-arrangement",
                "card_type": "results-card",
            },
        };
        modules["section-page-template"] = {
            "type": "SidebarTemplate",
            "slots": {
                "content": "set-banner-module",
                "sidebar": "item-group",
            },
        };
        modules["results-arrangement"] = {
            "type": "ListArrangement",
        };
        modules["results-card"] = {
            "type": "TextCard",
        };
        modules["search-results"] = {
            "type": "SearchModule",
            "slots": {
                "arrangement": "results-arrangement",
                "card_type": "results-card",
            },
        };
        modules["results-search-banner"] = {
            "type": "SearchBannerModule",
            "properties": {
                "valign": Gtk.Align.END,
            },
        };
        modules["search-page-template"] = {
            "type": "SidebarTemplate",
            "slots": {
                "content": "results-search-banner",
                "sidebar": "search-results",
            },
            "properties": {
                "background-image-uri": json['backgroundSectionURI'],
            },
        };
        modules["lightbox-card"] = {
            "type": "MediaCard",
        };
        modules["lightbox"] = {
            "type": "LightboxModule",
            "slots": {
                "card-type": "lightbox-card",
            },
        };
        modules["document-card"] = {
            "type": "KnowledgeDocumentCard",
        };
        modules["article-page-template"] = {
            "type": "ArticleStackModule",
            "slots": {
                "card-type": "document-card",
            },
        };
        break;
    case "encyclopedia":
        modules["window"] = {
            "type": "EncyclopediaWindow",
            "properties": {
                "title": json["appTitle"],
                "home-background-uri": json["backgroundHomeURI"],
                "results-background-uri": json["backgroundSectionURI"],
            },
        };
        modules["home-page-template"] = {
            "type": "EncyclopediaCoverTemplate",
            "slots": {
                "top": "app-banner",
                "bottom": "home-search-box",
            },
        };
        modules["search-page-template"] = {
            "type": "EncyclopediaContentTemplate",
            "slots": {
                "top_left": "article-app-banner",
                "top_right": "article-search-box",
                "bottom": "search-results-paper-template",
            },
        };
        modules["search-results-paper-template"] = {
            "type": "PaperTemplate",
            "slots": {
                "content": "search-results-paper-content",
            },
        };
        modules["search-results-paper-content"] = {
            "type": "BannerTemplate",
            "properties": {
                "image-separator": true,
                "margin-start": 45,
                "margin-end": 45,
            },
            "slots": {
                "banner": "results-search-banner",
                "content": "search-results",
            },
        };
        modules["article-page-template"] = {
            "type": "EncyclopediaContentTemplate",
            "slots": {
                "top_left": "article-app-banner",
                "top_right": "article-search-box",
                "bottom": "article-paper-template",
            },
        };
        modules["article-paper-template"] = {
            "type": "PaperTemplate",
            "slots": {
                "content": "document-card",
            },
        };
        modules["app-banner"] = {
            "type": "AppBanner",
            "properties": {
                "image-uri": json["titleImageURI"],
                "min-fraction": 0.5,
                "max-fraction": 0.5,
                "margin-bottom": 42,
            },
        };
        modules["article-search-box"] = {
            "type": "SearchBox",
            "properties": {
                "halign": Gtk.Align.CENTER,
                "hexpand": true,
            },
        };
        modules["home-search-box"] = {
            "type": "SearchBox",
            "properties": {
                "max-width-chars": 52,
            },
        };
        modules["article-app-banner"] = {
            "type": "AppBanner",
            "properties": {
                "image-uri": json["titleImageURI"],
                "min-fraction": 0.2,
                "max-fraction": 0.2,
                "margin-top": 10,
                "margin-bottom": 10,
                "valign": Gtk.Align.START,
                "vexpand": false,
                "halign": Gtk.Align.CENTER,
            },
        };
        modules["lightbox-card"] = {
            "type": "MediaCard",
        };
        modules["lightbox"] = {
            "type": "LightboxModule",
            "slots": {
                "card-type": "lightbox-card",
            },
        };
        modules["document-card"] = {
            "type": "KnowledgeDocumentCard",
        };
        modules["results-search-banner"] = {
            type: "SearchBannerModule",
            properties: {
                "halign": Gtk.Align.START,
            },
        };
        modules["search-results"] = {
            "type": "SearchModule",
            "properties": {
                "margin-top": 20,
            },
            "slots": {
                "arrangement": "results-arrangement",
                "card_type": "results-card",
            },
        };
        modules["results-card"] = {
            "type": "TextCard",
            "properties": {
                "underline-on-hover": true,
                "decoration": true,
            },
        };
        // FIXME: this should be inlined into search-results, when we get
        // submodules implemented in the factory
        modules["results-arrangement"] = {
            type: "ListArrangement",
            "properties": {
                "hexpand": true,
                "halign": Gtk.Align.FILL,
            }
        };
        break;
    case "reader":
        modules["window"] = {
            "type": "ReaderWindow",
            "properties": {
                "title": json["appTitle"],
                "title-image-uri": json["titleImageURI"],
                "home-background-uri": json["backgroundHomeURI"],
            },
        };
        modules["app-banner"] = {
            "type": "AppBanner",
            "properties": {
                "image-uri": json["titleImageURI"],
                "subtitle": json["appSubtitle"],
                "subtitle-capitalization": EosKnowledgePrivate.TextTransform.UPPERCASE,
                "valign": Gtk.Align.START,
                "halign": Gtk.Align.START,
                "margin-top": 50,
                "margin-start": 75,
            },
        };
        modules["front-cover"] = {
            "type": "SidebarTemplate",
            "slots": {
                "content": "app-banner",
                "sidebar": "snippets-group",
            },
            "properties": {
                "sidebar-width": 576,
                "fixed": false,
                "background-image-uri": json["backgroundHomeURI"],
                "column-homogeneous": true,
                "column-spacing": 120,
            },
        };
        modules["back-cover"] = {
            "type": "BackCover",
            "properties": {
                "background-image-uri": json["backgroundSectionURI"],
            },
        };
        modules["snippets-group"] = {
            "type": "ItemGroupModule",
            "slots": {
                "card_type": "home-card",
                "arrangement": "snippets-arrangement",
            },
            "properties": {
                "expand": true,
                "halign": Gtk.Align.END,
                "valign": Gtk.Align.FILL,
                "margin-end": 100,
            },
        };
        modules["snippets-arrangement"] = {
            "type": "OverflowArrangement",
            "properties": {
                "orientation": Gtk.Orientation.VERTICAL,
            },
        };
        modules["top-bar-search"] = {
            "type": "SearchBox",
        };
        modules["document-arrangement"] = {
            "type": "CarouselArrangement",
        };
        modules["home-card"] = {
            "type": "ArticleSnippetCard",
        };
        modules["document-card"] = {
            "type": "ReaderDocumentCard",
        };
        modules["lightbox-card"] = {
            "type": "MediaCard",
        };
        modules["lightbox"] = {
            "type": "LightboxModule",
            "slots": {
                "card-type": "lightbox-card",
            },
        };
        modules["results-card"] = {
            "type": "ReaderCard",
            "properties": {
                "title-capitalization": EosKnowledgePrivate.TextTransform.UPPERCASE,
            },
        };
        break;
    default:
        throw new Error('Unrecognized v1 preset type: ' + json.templateType);
    }

    return { 'modules': modules };
}

function create_v1_set_models(json, engine) {
    if (!json.hasOwnProperty('sections'))
        return;

    let sections = json['sections'];
    delete json['sections'];
    sections.forEach((section) => {
        if (!section.hasOwnProperty('thumbnailURI'))
            log("WARNING: Missing category thumbnail for " + section['title']);

        let domain = engine.default_domain;
        let sha = GLib.compute_checksum_for_string(GLib.ChecksumType.SHA1,
            'category' + domain + section['title'], -1);
        let id = 'ekn://' + domain + '/' + sha;
        let tags = section['tags'].slice();
        tags.push(Engine.HOME_PAGE_TAG);

        let model = new ContentObjectModel.ContentObjectModel({
            ekn_id: id,
            title: section['title'],
            thumbnail_uri: section['thumbnailURI'],
            featured: !!section['featured'],
            tags: tags,
        });
        engine.add_runtime_object(id, model);
    });
}

// External links used to be prepended with 'browser-', this strips them off.
function normalize_old_browser_urls (uri) {
    let scheme = GLib.uri_parse_scheme(uri);
    if (scheme !== null && scheme.startsWith('browser-'))
        uri = uri.slice('browser-'.length);
    return uri;
}
