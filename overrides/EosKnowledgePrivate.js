let EosKnowledgePrivate;

function _init() {
    // "this" is imports.gi.EosKnowledgePrivate
    EosKnowledgePrivate = this;

    // Hackzors. We need to load the gresource from javascript before any C
    // calls are made (to load the CSS). By referencing one of our C functions
    // here we force the C lib to be initialized along with it its gresource
    this.hello_c;

    // More hackzors. Work around bug where GList-type properties aren't
    // converted properly into JS values.
    // https://bugzilla.gnome.org/show_bug.cgi?id=727787
    Object.defineProperties(EosKnowledgePrivate.HistoryModel.prototype, {
        'back-list': {
            get: EosKnowledgePrivate.HistoryModel.prototype.get_back_list
        },
        'forward-list': {
            get: EosKnowledgePrivate.HistoryModel.prototype.get_forward_list
        },
        // Once again with underscores, because that's the most used name to
        // access properties with
        'back_list': {
            get: EosKnowledgePrivate.HistoryModel.prototype.get_back_list
        },
        'forward_list': {
            get: EosKnowledgePrivate.HistoryModel.prototype.get_forward_list
        },
        // Once again in camelCaps, because GJS supports that notation too for
        // properties
        'backList': {
            get: EosKnowledgePrivate.HistoryModel.prototype.get_back_list
        },
        'forwardList': {
            get: EosKnowledgePrivate.HistoryModel.prototype.get_forward_list
        }
    });
}
