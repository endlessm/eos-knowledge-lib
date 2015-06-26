const Gio = imports.gi.Gio;
const StyleKnobGenerator = imports.app.compat.styleKnobGenerator;
const Utils = imports.tests.utils;

const TEST_CONTENT_DIR = Utils.get_test_content_srcdir();

let style_knobs_a = {
    'tab_button': {
        'background-color': '#7DA443;',
    },
    'section_page': {
        'font-family': "'Marcellus SC'",
        'font-weight': 'bold',
    },
    'no_search_results_page': {
        'font-family': "'Marcellus SC'",
        'font-weight': 'bold',
    },
    'section_card': {
        'background': '#E8E4E1',
        'color': '#5A8715',
        'font-family': "'Marcellus SC'",
        'font-weight': 'bold',
    },
    'article_card': {
        'background': '#E8E4E1',
        'color': '#5A8715',
        'font-family': "'Marcellus SC'",
        'font-weight': 'bold',
    }
}

let style_knobs_b = {
    'section_card': {
        'color': '#98B8FF;',
        'font-size': '2.2em',
        'padding': '.7em 0em',
        'font-family': "'Amatic SC'",
        'font-weight': 'bold',
    },
    'article_card': {
        'color': '#98B8FF;',
    },
    'section_page': {
        'font-size': '9.0em',
        'padding': '0.5em 0.0em 0.5em 0.7em',
        'font-family': "'Amatic SC'",
        'font-weight': 'bold',
    },
    'no_search_results_page': {
        'font-size': '10.72em',
        'font-family': "'Amatic SC'",
        'font-weight': 'bold',
    },
};

describe('StyleKnobGenerator', function () {
    let css_overrides_a;
    let css_overrides_b;

    beforeEach(function () {
        let file_a = Gio.File.new_for_path(TEST_CONTENT_DIR + 'overrides-a.css');
        css_overrides_a = (file_a.load_contents(null)[1]).toString();
        let file_b = Gio.File.new_for_path(TEST_CONTENT_DIR + 'overrides-b.css');
        css_overrides_b = (file_b.load_contents(null)[1]).toString();
    });

    it('handles template A overrides', function () {
        let style_knobs = StyleKnobGenerator.get_knobs_from_css(css_overrides_a);
        expect(style_knobs).toEqual(style_knobs_a);
    });

    it('handles template B overrides', function () {
        let style_knobs = StyleKnobGenerator.get_knobs_from_css(css_overrides_b);
        expect(style_knobs).toEqual(style_knobs_b);
    });
});
