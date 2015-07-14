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
        modules['home-page-b'] = {
            type: 'HomePageB',
            submodules: {
                top_left: "app-banner",
                top_right: "home-search",
            }
        };
        modules['top-bar-search'] = {
            type: 'SearchBox',
        };
        modules['home-search'] = {
            type: 'SearchBox',
            properties: {
                width_request: 350,
            }
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
