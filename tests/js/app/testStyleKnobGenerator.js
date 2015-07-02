const Gio = imports.gi.Gio;
const StyleKnobGenerator = imports.app.compat.styleKnobGenerator;
const Utils = imports.tests.utils;

const TEST_CONTENT_DIR = Utils.get_test_content_srcdir();

let style_knobs_a = {
    'tab_button': {
        'module-background-color': '#7DA443',
    },
    'section_page': {
        'title-font-family': "'Marcellus SC'",
        'title-font-weight': 'bold',
    },
    'no_search_results_page': {
        'title-font-family': "'Marcellus SC'",
        'title-font-weight': 'bold',
    },
    'section_card': {
        'module-background': '#E8E4E1',
        'title-color': '#5A8715',
        'title-font-family': "'Marcellus SC'",
        'title-font-weight': 'bold',
    },
    'article_card': {
        'module-background': '#E8E4E1',
        'title-color': '#5A8715',
        'title-font-family': "'Marcellus SC'",
        'title-font-weight': 'bold',
    }
}

let style_knobs_b = {
    'section_card': {
        'title-color': '#98B8FF',
        'hover-color': '#4573D9',
        'title-font-size': '2.2em',
        'title-padding': '.7em 0em',
        'title-font-family': "'Amatic SC'",
        'title-font-weight': 'bold',
    },
    'article_card': {
        'title-color': '#98B8FF',
        'hover-color': '#4573D9',
    },
    'section_page': {
        'title-font-size': '9.0em',
        'title-padding': '0.5em 0.0em 0.5em 0.7em',
        'title-font-family': "'Amatic SC'",
        'title-font-weight': 'bold',
    },
    'no_search_results_page': {
        'title-font-size': '10.72em',
        'title-font-family': "'Amatic SC'",
        'title-font-weight': 'bold',
    },
};

let style_knobs_reader = {
  'overview_page': {
    'module-background': 'rgba(51, 51, 51, 0.30)',
    'module-background-image': 'linear-gradient(-180deg, rgba(176, 176, 176, 0.20) 1%, alpha(black, 0.30) 100%)',
  },
  'snippet0': {
    'module-font-family': 'ABeeZee',
    'module-font-size': '1em',
    'module-color': '#F2F2F2',
    'title-font-family': 'Abel',
    'title-color': '#E05430',
    'title-font-size': '2.125em',
  },
  'snippet1': {
    'module-font-family': 'ABeeZee',
    'module-font-size': '1em',
    'module-color': '#F2F2F2',
    'title-font-family': 'Roboto',
    'title-color': '#FA770F',
    'title-font-size': '2em',
  },
  'snippet2': {
    'module-font-family': 'ABeeZee',
    'module-font-size': '1em',
    'module-color': '#F2F2F2',
    'title-font-family': 'Dosis',
    'title-color': '#F7C449',
    'title-font-size': '2.25em',
  },
  'done_page': {
    'module-font-family': 'ABeeZee',
    'module-font-size': '1em',
    'module-color': '#F2F2F2',
    'title-font-family': 'Abel',
    'title-color': '#E05430',
    'title-font-size': '2.125em',
  },
  'article_page0': {
    'title-color': '#D95430',
    'title-font-family': 'Abel',
    'title-font-size': '3em',
    'module-color': '#8E421A',
    'module-font-family': 'Roboto',
    'module-font-size': '0.88em',
    'module-font-style': 'italic',
    'title-background-color': '#D95420',
  },
  'article_page1': {
    'title-color': '#CD6E34',
    'title-font-family': 'Lato',
    'title-font-size': '3em',
    'module-color': '#924C22',
    'module-font-family': 'Roboto',
    'module-font-size': '0.75em',
    'module-font-weight': '800',
  },
  'article_page2': {
    'title-color': '#DFAA29',
    'title-font-family': 'Dosis',
    'title-font-size': '3.38em',
    'title-font-weight': '200',
    'title-border-left': '2px solid #F7C464',
    'title-padding-left': '20px',
    'module-color': '#B9922F',
    'module-font-family': 'Roboto',
    'module-font-size': '0.81em',
    'module-font-style': 'italic',
  },
  'reader_card0': {
    'title-color': '#d95430',
    'title-font-family': 'Abel',
    'module-color': '#8e421a',
    'module-font-family': 'Roboto',
    'module-font-style': 'italic',
    'title-background-color': '#D95420',
  },
  'reader_card1': {
    'title-color': '#cd6e34',
    'title-font-family': 'Lato',
    'module-color': '#924c22',
    'module-font-family': 'Roboto',
    'module-font-weight': '800',
  },
  'reader_card2': {
    'title-color': '#dfaa29',
    'title-font-family': 'Dosis',
    'title-font-weight': '200',
    'module-color': '#b9922f',
    'module-font-family': 'Roboto',
    'module-font-style': 'italic',
  }
}

describe('StyleKnobGenerator', function () {
    let css_overrides_a;
    let css_overrides_b;
    let css_overrides_reader;

    beforeEach(function () {
        let file_a = Gio.File.new_for_path(TEST_CONTENT_DIR + 'overrides-a.css');
        css_overrides_a = (file_a.load_contents(null)[1]).toString();
        let file_b = Gio.File.new_for_path(TEST_CONTENT_DIR + 'overrides-b.css');
        css_overrides_b = (file_b.load_contents(null)[1]).toString();
        let file_reader = Gio.File.new_for_path(TEST_CONTENT_DIR + 'overrides-reader.css');
        css_overrides_reader = (file_reader.load_contents(null)[1]).toString();
    });

    it('handles template A overrides', function () {
        let style_knobs = StyleKnobGenerator.get_knobs_from_css(css_overrides_a, 'A');
        expect(style_knobs).toEqual(style_knobs_a);
    });

    it('handles template B overrides', function () {
        let style_knobs = StyleKnobGenerator.get_knobs_from_css(css_overrides_b, 'B');
        expect(style_knobs).toEqual(style_knobs_b);
    });

    it('handles reader app overrides', function () {
        let style_knobs = StyleKnobGenerator.get_knobs_from_css(css_overrides_reader, 'reader');
        expect(style_knobs).toEqual(style_knobs_reader);
    });
});
