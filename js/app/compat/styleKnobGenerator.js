const CssParse = imports.app.compat.cssParse;
const Lang = imports.lang;

function get_knobs_from_css (css, template_type) {
    let lines = css.split('\n');

    let knob_map = lines.filter((line) => line.startsWith('@define'))
        .reduce(definitions_to_knobs, {});

    let css_parse_tree = CssParse.parse(lines.filter((line) => !line.startsWith('@define'))
        .join('\n'));

    return css_parse_tree.stylesheet.rules.filter((rule) => rule.type === 'rule')
        .reduce((knobs, rule) => {
            let props = rule.declarations.reduce(css_declation_to_properties, {});
            if (template_type === 'reader') {
                rule.selectors.forEach((selector) => {
                    selector_to_knob_reader(knobs, props, selector);
                });
            } else {
                rule.selectors.forEach((selector) => {
                    selector_to_knob_ka(knobs, props, selector);
                });
            }
            return knobs;
        }, knob_map);
}

/*
 * A helper function to merge the properties of two objects, giving preference
 * to obj2's values in the case of a conflict.
*/
function merge_object_properties (obj1={}, obj2={}) {
    Lang.copyProperties(obj2, obj1);
    return obj1;
}

/*
 * A reduce function that takes in the <knobs> object that is being populated
 * and a single <definition>, which is a CSS constant definition such as:
 * @define-color template-b-text-color #FFCCF8;
 * It converts this definition to a knob and adds it to the <knobs> object
*/
function definitions_to_knobs (knobs, definition) {
    let terms = definition.split(' ');
    let name = terms[1];
    let value = terms[2].substring(0, terms[2].length - 1);
    switch (name) {
        case 'template-b-text-color':
            knobs['section_card'] = merge_object_properties(knobs['section_card'], {'title-color': value});
            knobs['article_card'] = merge_object_properties(knobs['article_card'], {'title-color': value});
            break;
        case 'template-b-text-color-hover':
            knobs['section_card'] = merge_object_properties(knobs['section_card'], {'hover-color': value});
            knobs['article_card'] = merge_object_properties(knobs['article_card'], {'hover-color': value});
            break;
        case 'tab-button-background':
            knobs['tab_button'] = merge_object_properties(knobs['tab_button'], {'module-background-color': value});
            break;
    }
    return knobs;
}

/*
 * A reduce function that takes 1) the properties object that is being populated
 * with CSS styles for a module and 2) a CSS declaration. The CSS info is
 * extracted from the declaration and included into the properties object.
 * So, at the end, the properties object will look something like:
 * {
 *   color: "blue",
 *   font-weight: "bold",
 *   font-family: "Lato",
 * }
*/
function css_declation_to_properties (props, declaration) {
    if (declaration.type === 'declaration') {
        props[declaration.property] = declaration.value;
    }
    return props;
}


function prefix_keys_with(props, prefix) {
    let retval = {};
    for (let key in props) {
        retval[prefix + key] = props[key];
    }
    return retval;
}

function selector_to_knob_reader (knobs, props, selector) {
    let num = (selector.match(/\d+/) || [])[0];
    if (/.article\-page[0-2] .article\-page\-attribution/.test(selector)) {
        knobs['article_page' + num] = merge_object_properties(knobs['article_page' + num], prefix_keys_with(props, 'module-'));
    } else if (/.article\-page[0-2].*/.test(selector)) {
        knobs['article_page' + num] = merge_object_properties(knobs['article_page' + num], prefix_keys_with(props, 'title-'));
    } else if (/.snippet[0-2] .title/.test(selector)) {
        knobs['snippet' + num] = merge_object_properties(knobs['snippet' + num], prefix_keys_with(props, 'title-'));
    } else if (/.reader-card[0-2] .reader-attribution/.test(selector)) {
        knobs['reader_card' + num] = merge_object_properties(knobs['reader_card' + num], prefix_keys_with(props, 'module-'));
    } else if (/.reader-card[0-2].*/.test(selector)) {
        knobs['reader_card' + num] = merge_object_properties(knobs['reader_card' + num], prefix_keys_with(props, 'title-'));
    } else {
        switch (selector) {
            // .overview-frame is defunct, but still present in <2.5 overrides
            case '.overview-frame':
                knobs['overview_page'] = merge_object_properties(knobs['overview_page'], prefix_keys_with(props, 'module-'));
                break;
            case '.article-snippet .synopsis':
                for (let i = 0; i < 3; i++) {
                    knobs['snippet' + i] = merge_object_properties(knobs['snippet' + i], prefix_keys_with(props, 'module-'));
                }
                break;
            case '.done-page .bottom-line':
                knobs['back_cover'] = merge_object_properties(knobs['back_cover'], prefix_keys_with(props, 'module-'));
                break;
            case '.done-page .headline':
                knobs['back_cover'] = merge_object_properties(knobs['back_cover'], prefix_keys_with(props, 'title-'));
                break;
        }
    }

}

function selector_to_knob_ka (knobs, props, selector) {
    switch (selector) {
        case '.section-page-title':
            knobs['section_page'] = merge_object_properties(knobs['section_page'], prefix_keys_with(props, 'title-'));
            knobs['search_page'] = merge_object_properties(knobs['search_page'], prefix_keys_with(props, 'title-'));
            break;
        case '.no-search-results-page-title':
            knobs['no_search_results_page'] = merge_object_properties(knobs['no_search_results_page'], prefix_keys_with(props, 'title-'));
            break;
        case '.home-page .card-title':
            knobs['section_card'] = merge_object_properties(knobs['section_card'], prefix_keys_with(props, 'title-'));
            break;
        case '.card':
            knobs['section_card'] = merge_object_properties(knobs['section_card'], prefix_keys_with(props, 'module-'));
            knobs['article_card'] = merge_object_properties(knobs['article_card'], prefix_keys_with(props, 'module-'));
            break;
        case '.card-title':
        case '.card .card-title':
            knobs['section_card'] = merge_object_properties(knobs['section_card'], prefix_keys_with(props, 'title-'));
            knobs['article_card'] = merge_object_properties(knobs['article_card'], prefix_keys_with(props, 'title-'));
            break;
        default:
            break;
    }
}
