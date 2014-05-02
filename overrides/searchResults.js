// Copyright 2014 Endless Mobile, Inc.
const EosKnowledge = imports.gi.EosKnowledge;

const EKN_TYPE_SEARCH_RESULTS = "ekv:SearchResults";

/** 
 * Function: list_from_search_results
 * Converts a SearchResults JSON-LD object into a list of <ContentObjectModel>s, or its
 * subclasses (<ArticleObjectModel>, <ImageObjectModel>, or <VideoObjectModel>).
 */
function list_from_search_results(jsonld) {
    if (jsonld["@type"] !== EKN_TYPE_SEARCH_RESULTS)
        throw new Error("Cannot marshal search results list from data of type " + jsonld["@type"]);

    let retval = jsonld['results'].map(function (item) {
        switch(item['@type']) {
            case 'ekv:ContentObject':
                return EosKnowledge.ContentObjectModel.new_from_json_ld(item);
            case 'ekv:ArticleObject':
                return EosKnowledge.ArticleObjectModel.new_from_json_ld(item);
            default:
                throw new Error(item['@type'] + ' result not implemented'); // FIXME
        }
    });

    // Sanity check
    if(retval.length !== jsonld['numResults'])
        throw new Error('Number of results did not agree in JSON-LD SearchResults object');

    return retval;
}
