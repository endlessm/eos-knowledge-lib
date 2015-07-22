const GObject = imports.gi.GObject;
const Lang = imports.lang;

const MockLightbox = new Lang.Class({
    Name: 'MockLightbox',
    Extends: GObject.Object,
    Signals: {
        'navigation-previous-clicked': {},
        'navigation-next-clicked': {},
    },
});
