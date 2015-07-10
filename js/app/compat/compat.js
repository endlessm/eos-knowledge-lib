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
        break;
    case 'encyclopedia':
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
