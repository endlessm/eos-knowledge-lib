function transform_v1_description(json) {
    let modules = {};

    switch (json.templateType) {
    case 'A':
        modules['home-card'] = {
            type: 'CardA',
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
        modules['home-card'] = {
            type: 'CardB',
        };
        modules['results-card'] = {
            type: 'TextCard',
        };
        modules['lightbox-card'] = {
            type: 'MediaCard',
        };
        break;
    case 'reader':
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
