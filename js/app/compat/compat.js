const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;

const ContentObjectModel = imports.search.contentObjectModel;
const Engine = imports.search.engine;
const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;

function transform_v1_description(json) {
    let modules = {};

    switch (json.templateType) {
    case 'A':
        modules['window'] = {
            type: 'Window',
            properties: {
                'title': json['appTitle'],
                'background-image-uri': json['backgroundHomeURI'],
                'blur-background-image-uri': json['backgroundSectionURI'],
            },
        };
        modules['app-banner'] = {
            type: 'AppBanner',
            properties: {
                'image-uri': json['titleImageURI'],
                'min-fraction': 0.4,
                'max-fraction': 0.7,
            },
        };
        modules['top-bar-search'] = {
            type: 'SearchBox',
        };
        modules['home-search'] = {
            type: 'SearchBox',
        };
        modules['home-card'] = {
            type: 'CardA',
        };
        modules['results-title-card'] = {
            type: 'SetBannerCard',
        };
        modules['results-search-banner'] = {
            type: 'SearchBanner',
        };
        modules['results-card'] = {
            type: 'CardA',
        };
        modules['lightbox-card'] = {
            type: 'MediaCard',
        };
        modules['document-card'] = {
            type: 'KnowledgeDocumentCard',
        };
        break;
    case 'B':
        modules['window'] = {
            type: 'Window',
            properties: {
                'title': json['appTitle'],
                'background-image-uri': json['backgroundHomeURI'],
                'blur-background-image-uri': json['backgroundSectionURI'],
            },
        };
        modules['app-banner'] = {
            type: 'AppBanner',
            properties: {
                'image-uri': json['titleImageURI'],
                'min-fraction': 0.4,
                'max-fraction': 0.7,
                'visible': true,
                'can-focus': false,
            },
        };
        modules['home-page-item-group'] = {
            type: 'ItemGroup',
            properties: {
                'expand': true,
                'halign': Gtk.Align.FILL,
                'valign': Gtk.Align.FILL,
            },
            slots: {
                arrangement: 'home-page-arrangement',
                card_type: 'home-card',
            },
        };
        modules['home-page-template'] = {
            type: 'HomePageBTemplate',
            slots: {
                top_left: "app-banner",
                top_right: "home-search",
                bottom: "home-page-item-group",
            },
        };
        modules['home-page-arrangement'] = {
            type: 'TiledGridArrangement',
        };
        modules['top-bar-search'] = {
            type: 'SearchBox',
        };
        modules['home-search'] = {
            type: 'SearchBox',
            properties: {
                'width_request': 350,
                'visible': true,
                'shadow_type': Gtk.ShadowType.NONE,
                'halign': Gtk.Align.CENTER,
                'valign': Gtk.Align.CENTER,
            },
        };
        modules['home-card'] = {
            type: 'CardB',
        };
        modules['results-title-card'] = {
            type: 'SetBannerCard',
        };
        modules['results-search-banner'] = {
            type: 'SearchBanner',
        };
        modules['results-arrangement'] = {
            type: 'ListArrangement',
        };
        modules['results-card'] = {
            type: 'TextCard',
        };
        modules['lightbox-card'] = {
            type: 'MediaCard',
        };
        modules['document-card'] = {
            type: 'KnowledgeDocumentCard',
        };
        break;
    case 'encyclopedia':
        modules['window'] = {
            type: 'EncyclopediaWindow',
            properties: {
                'title': json['appTitle'],
                'home-background-uri': json['backgroundHomeURI'],
                'results-background-uri': json['backgroundSectionURI'],
            },
        };
        modules['app-banner'] = {
            type: 'AppBanner',
            properties: {
                'image-uri': json['titleImageURI'],
                'min-fraction': 0.5,
                'max-fraction': 0.5,
                'margin-bottom': 42,
            },
        };
        modules['home-search'] = {
            type: 'SearchBox',
            properties: {
                'max-width-chars': 52,
            },
        };
        modules['article-app-banner'] = {
            type: 'AppBanner',
            properties: {
                'image-uri': json['titleImageURI'],
                'min-fraction': 0.2,
                'max-fraction': 0.2,
                'margin-top': 10,
                'margin-bottom': 10,
            },
        };
        modules['lightbox-card'] = {
            type: 'MediaCard',
        };
        modules['document-card'] = {
            type: 'KnowledgeDocumentCard',
            properties: {
                'expand': true,
            },
        };
        modules['search-results'] = {
            type: 'SearchModule',
            slots: {
                arrangement: 'results-arrangement',
                card_type: 'results-card',
            },
        };
        modules['results-card'] = {
            type: 'TextCard',
            properties: {
                'underline-on-hover': true,
                'decoration': true,
            },
        };
        // FIXME: this should be inlined into search-results, when we get
        // submodules implemented in the factory
        modules['results-arrangement'] = {
            type: 'ListArrangement',
        };
        break;
    case 'reader':
        modules['window'] = {
            type: 'ReaderWindow',
            properties: {
                'title': json['appTitle'],
                'subtitle': json['appSubtitle'],
                'title-image-uri': json['titleImageURI'],
                'home-background-uri': json['backgroundHomeURI'],
            },
        };
        modules['app-banner'] = {
            type: 'AppBanner',
            properties: {
                'image-uri': json['titleImageURI'],
            },
        };
        modules['back-cover'] = {
            type: 'BackCover',
            properties: {
                'background-image-uri': json['backgroundSectionURI'],
            },
        };
        modules['top-bar-search'] = {
            type: 'SearchBox',
        };
        modules['document-arrangement'] = {
            type: 'CarouselArrangement',
        };
        modules['home-card'] = {
            type: 'ArticleSnippetCard',
        };
        modules['document-card'] = {
            type: 'ReaderDocumentCard',
        };
        modules['lightbox-card'] = {
            type: 'MediaCard',
        };
        modules['results-card'] = {
            type: 'ReaderCard',
            properties: {
                'title-capitalization': EosKnowledgePrivate.TextTransform.UPPERCASE,
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
