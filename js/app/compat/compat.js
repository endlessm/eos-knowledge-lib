const GLib = imports.gi.GLib;

const Engine = imports.search.engine;
const SetObjectModel = imports.search.setObjectModel;

function transform_v1_description(json) {
    let modules = {};

    switch (json.templateType) {
    case "A":
        modules["interaction"] = {
            "type": "MeshInteraction",
            "slots": {
                "window": "window",
            },
        };
        modules["window"] = {
            "type": "Window",
            "properties": {
                "title": json["appTitle"],
                "background-image-uri": json["backgroundHomeURI"],
                "blur-background-image-uri": json["backgroundSectionURI"],
            },
            "slots": {
                "brand-screen": null,
                "home-page": "home-page",
                "section-page": "section-page",
                "search-page": "search-page",
                "article-page": "article-page",
                "navigation": "navigation",
                "lightbox": "lightbox",
                "search": "top-bar-search",
            },
        };
        modules["navigation"] = {
            "type": "NavigationModule",
        };
        modules["app-banner"] = {
            "type": "AppBanner",
            "properties": {
                "image-uri": json["titleImageURI"],
                "min-fraction": 0.35,
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
                "halign": "center",
            }
        };
        modules["home-card"] = {
            "type": "CardA",
            "properties": {
                "hexpand": true,
                "halign": "center",
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
                "halign": "center",
            },
            "slots": {
                "card-type": "set-banner-card",
            },
        };
        modules["item-group"] = {
            "type": "ItemGroupModule",
            "slots": {
                "arrangement": "results-arrangement",
                "card-type": "results-card",
            },
        };
        modules["section-page"] = {
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
        modules["home-page"] = {
            "type": "HomePageATemplate",
            "slots": {
                "top": "app-banner",
                "middle": "home-search",
                "bottom": "home-page-set-group",
                "basement": "home-page-basement-set-group",
            },
        };
        modules["results-card"] = {
            "type": "CardA",
        };
        modules["search-results"] = {
            "type": "SearchModule",
            "slots": {
                "arrangement": "results-arrangement",
                "card-type": "results-card",
            },
            "properties": {
                "halign": "center",
                "message-justify": "center",
            },
        };
        modules["home-card"] = {
            "type": "CardA",
        };
        modules["home-page-set-group"] = {
            "type": "SetGroupModule",
            "properties": {
                "expand": true,
                "halign": "center",
                "valign": "center",
                "max-children": 6,
            },
            "slots": {
                "arrangement": {
                    "type": "OverflowArrangement",
                    "properties": {
                        "orientation": "horizontal",
                    },
                },
                "card-type": "home-card",
            },
        };
        modules["home-page-basement-set-group"] = {
            "type": "SetGroupModule",
            "properties": {
                "expand": true,
            },
            "slots": {
                "arrangement": "results-arrangement",
                "card-type": "home-card",
            },
        };
        modules["results-search-banner"] = {
            "type": "SearchBannerModule",
            "properties": {
                "halign": "center",
            },
        };
        modules["search-page"] = {
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
        modules["article-page"] = {
            "type": "ArticleStackModule",
            "slots": {
                "card-type": "document-card",
            },
        };
        break;
    case "B":
        modules["interaction"] = {
            "type": "MeshInteraction",
            "slots": {
                "window": "window",
            },
        };
        modules["window"] = {
            "type": "Window",
            "properties": {
                "title": json["appTitle"],
                "background-image-uri": json["backgroundHomeURI"],
                "blur-background-image-uri": json["backgroundSectionURI"],
            },
            "slots": {
                "brand-screen": null,
                "home-page": "home-page",
                "section-page": "section-page",
                "search-page": "search-page",
                "article-page": "article-page",
                "navigation": "navigation",
                "lightbox": "lightbox",
                "search": "top-bar-search",
            },
        };
        modules["navigation"] = {
            "type": "NavigationModule",
        };
        modules["app-banner"] = {
            "type": "AppBanner",
            "properties": {
                "image-uri": json["titleImageURI"],
                "min-fraction": 0.4,
                "max-fraction": 0.7,
                "valign": "center",
                "halign": "center",
                "expand": false,
            },
        };
        modules["home-page-set-group"] = {
            "type": "SetGroupModule",
            "properties": {
                "expand": true,
                "halign": "fill",
                "valign": "fill",
            },
            "slots": {
                "arrangement": {
                    "type": "TiledGridArrangement",
                },
                "card-type": "home-card",
            },
        };
        modules["home-page"] = {
            "type": "DividedBannerTemplate",
            "properties": {
                "row-spacing": 30,
                "row-homogeneous": true,
            },
            "slots": {
                "top-left": "app-banner",
                "top-right": "home-search",
                "bottom": "home-page-set-group",
            },
        };
        modules["top-bar-search"] = {
            "type": "SearchBox",
        };
        modules["home-search"] = {
            "type": "SearchBox",
            "properties": {
                "width-request": 350,
                "visible": true,
                "shadow-type": "none",
                "halign": "center",
                "valign": "center",
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
                "valign": "end",
            },
            "slots": {
                "card-type": "set-banner-card",
            },
        };
        modules["item-group"] = {
            "type": "ItemGroupModule",
            "slots": {
                "arrangement": "results-arrangement",
                "card-type": "results-card",
            },
        };
        modules["section-page"] = {
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
                "card-type": "results-card",
            },
            "properties": {
                "message-valign": "center",
            },
        };
        modules["results-search-banner"] = {
            "type": "SearchBannerModule",
            "properties": {
                "valign": "center",
            },
        };
        modules["search-page"] = {
            "type": "SidebarTemplate",
            "slots": {
                "content": "results-search-banner",
                "sidebar": "search-results",
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
        modules["article-page"] = {
            "type": "ArticleStackModule",
            "slots": {
                "card-type": "document-card",
            },
        };
        break;
    case "encyclopedia":
        modules["interaction"] = {
            "type": "MeshInteraction",
            "slots": {
                "window": "window",
            },
        };
        modules["window"] = {
            "type": "EncyclopediaWindow",
            "properties": {
                "title": json["appTitle"],
                "home-background-uri": json["backgroundHomeURI"],
                "results-background-uri": json["backgroundSectionURI"],
            },
            "slots": {
                "home-page": "home-page",
                "search-page": "search-page",
                "article-page": "article-page",
                "lightbox": "lightbox",
            },
        };
        modules["home-page"] = {
            "type": "EncyclopediaCoverTemplate",
            "slots": {
                "top": "app-banner",
                "bottom": "home-search-box",
            },
        };
        modules["search-page"] = {
            "type": "DividedBannerTemplate",
            "slots": {
                "top-left": "article-app-banner",
                "top-right": "article-search-box",
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
        modules["article-page"] = {
            "type": "DividedBannerTemplate",
            "slots": {
                "top-left": "article-app-banner",
                "top-right": "article-search-box",
                "bottom": "article-paper-template",
            },
        };
        modules["article-paper-template"] = {
            "type": "PaperTemplate",
            "slots": {
                "content": "article-stack",
            },
        };
        modules["article-stack"] = {
            "type": "ArticleStackModule",
            "slots": {
                "card-type": "document-card",
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
                "halign": "center",
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
                "valign": "start",
                "vexpand": false,
                "halign": "center",
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
                "halign": "start",
            },
        };
        modules["search-results"] = {
            "type": "SearchModule",
            "properties": {
                "margin-top": 20,
            },
            "slots": {
                "arrangement": {
                    type: "ListArrangement",
                    "properties": {
                        "hexpand": true,
                        "halign": "fill",
                    },
                },
                "card-type": "results-card",
            },
        };
        modules["results-card"] = {
            "type": "TextCard",
            "properties": {
                "underline-on-hover": true,
                "decoration": true,
            },
        };
        break;
    case "reader":
        modules["interaction"] = {
            "type": "AisleInteraction",
            "slots": {
                "window": "window",
                "document-card": "document-card",
            },
        };
        modules["window"] = {
            "type": "ReaderWindow",
            "properties": {
                "title": json["appTitle"],
                "title-image-uri": json["titleImageURI"],
                "home-background-uri": json["backgroundHomeURI"],
            },
            "slots": {
                "front-page": "front-page",
                "back-page": "back-page",
                "search-page": "search-page",
                "standalone-page": "standalone-page",
                "document-arrangement": "document-arrangement",
                "navigation": "navigation",
                "lightbox": "lightbox",
            },
        };
        modules["navigation"] = {
            "type": "NavigationModule",
        };
        modules["app-banner"] = {
            "type": "AppBanner",
            "properties": {
                "image-uri": json["titleImageURI"],
                "subtitle": json["appSubtitle"],
                "subtitle-capitalization": "uppercase",
                "valign": "start",
                "halign": "start",
                "margin-top": 50,
                "margin-start": 75,
            },
        };
        modules["front-page"] = {
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
        modules["back-page"] = {
            "type": "BackCover",
            "properties": {
                "background-image-uri": json["backgroundSectionURI"],
            },
        };
        modules["snippets-group"] = {
            "type": "ItemGroupModule",
            "slots": {
                "card-type": "home-card",
                "arrangement": {
                    "type": "OverflowArrangement",
                    "properties": {
                        "orientation": "vertical",
                    },
                },
            },
            "properties": {
                "expand": true,
                "halign": "end",
                "valign": "fill",
                "margin-end": 100,
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
                "title-capitalization": "uppercase",
            },
        };
        modules["results-search-banner"] = {
            "type": "SearchBannerModule",
            "properties": {
                "halign": "center",
            },
        };
        modules["search-page"] = {
            "type": "BannerTemplate",
            "properties": {
                "separator-margin": 30,
            },
            "slots": {
                "banner": "results-search-banner",
                "content": "search-results",
            },
        };
        modules["standalone-page"] = {
            "type": "StandalonePage",
        },
        modules["search-results"] = {
            "type": "SearchModule",
            "slots": {
                "arrangement": {
                    "type": "GridArrangement",
                    "properties": {
                        "margin-top": 20,
                        "bottom-buffer": 250,
                        "max-children-per-line": 9,
                    },
                },
                "card-type": "results-card",
            },
            "properties": {
                "message-halign": "center",
                "message-justify": "center",
            }
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

        let model = new SetObjectModel.SetObjectModel({
            ekn_id: id,
            title: section['title'],
            thumbnail_uri: section['thumbnailURI'],
            featured: !!section['featured'],
            tags: [Engine.HOME_PAGE_TAG],
            // In v1, categories had what we now call "child tags", and not what
            // we now call "tags". However, "child tags" were denoted with the
            // "tags" property in app.json.
            child_tags: section['tags'],
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
