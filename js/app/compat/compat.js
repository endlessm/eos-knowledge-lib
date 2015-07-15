const GLib = imports.gi.GLib;

const ContentObjectModel = imports.search.contentObjectModel;
const Engine = imports.search.engine;

function transform_v1_description(json) {
    let modules = {};

    switch (json.templateType) {
    case 'A':
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
        modules['results-card'] = {
            type: 'ArticleCard',
        };
        modules['pdf-card'] = {
            type: 'PdfCard',
        };
        modules['lightbox-card'] = {
            type: 'MediaCard',
        };
        modules['document-card'] = {
            type: 'DocumentCard',
        };
        break;
    case 'B':
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
            type: 'CardB',
        };
        modules['results-title-card'] = {
            type: 'SetBannerCard',
        };
        modules['results-card'] = {
            type: 'TextCard',
        };
        modules['lightbox-card'] = {
            type: 'MediaCard',
        };
        modules['document-card'] = {
            type: 'DocumentCard',
        };
        break;
    case 'encyclopedia':
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
            }
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
            type: 'DocumentCard',
            properties: {
                'expand': true,
            },
        };
        break;
    case 'reader':
        modules['app-banner'] = {
            type: 'AppBanner',
            properties: {
                'image-uri': json['titleImageURI'],
            },
        };
        modules['top-bar-search'] = {
            type: 'SearchBox',
        };
        modules['home-card'] = {
            type: 'ArticleSnippetCard',
        };
        modules['results-card'] = {
            type: 'ReaderCard',
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
