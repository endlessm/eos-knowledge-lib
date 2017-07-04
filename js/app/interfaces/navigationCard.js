// Copyright 2016 Endless Mobile, Inc.

const GObject = imports.gi.GObject;
const Lang = imports.lang;

const Card = imports.app.interfaces.card;

/**
 * Interface: NavigationCard
 * Interface for navigational card modules
 *
 * Requires:
 *   <Card>
 */
var NavigationCard = new Lang.Interface({
    Name: 'NavigationCard',
    GTypeName: 'EknNavigationCard',
    Requires: [ Card.Card ],

    Properties: {
        /**
         * Property: navigation-context
         * A string with navigational context information, like 'next article'
         */
        'navigation-context': GObject.ParamSpec.string('navigation-context',
            'Navigation context', 'Navigation context label',
            GObject.ParamFlags.READWRITE,
            ''),
    },
});
