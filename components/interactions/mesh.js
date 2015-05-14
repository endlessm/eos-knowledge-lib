const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Interaction = imports.interfaces.interaction;

const Mesh = new Lang.Class({
    Name: 'Mesh',
    Extends: Interaction.Interaction,

    PAGE_TYPES: ['home', 'set', 'search_result', 'document', 'media_viewer'],

    _init: function (props) {
        this.parent(props);
    },

    add_page: function (type, widget) {
        this.parent(type, widget);

        switch (type) {
            case 'home':
                widget.connect('search-activated', (page, search) => {
                    page.clear_search_box();
                    this.page_manager.transition_type = Gtk.StackTransitionType.OVER_LEFT;
                    this.page_manager.visible_child = this._pages['search_result'];
                });
                break;
            case 'search_result':
                widget.connect('linear-go-back', () => {
                    this.page_manager.transition_type = Gtk.StackTransitionType.UNDER_RIGHT;
                    this.page_manager.visible_child = this._pages['home'];
                });
                break;
        }
    }
});

function create_me(props) {
    return new Mesh(props);
}
