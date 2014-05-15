// Copyright 2014 Endless Mobile, Inc.

const GObject = imports.gi.GObject;
const Lang = imports.lang;

const EosKnowledge = imports.EosKnowledge.EosKnowledge;

GObject.ParamFlags.READWRITE = GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE;

const MockItemModel = new Lang.Class({
    Name: 'MockItemModel',
    Extends: GObject.Object,
    Implements: [ EosKnowledge.HistoryItemModel ],
    Properties: {
        // FIXME this property should not be here, but it is required because
        // you cannot override interface-defined properties in GJS (yet).
        // https://bugzilla.gnome.org/show_bug.cgi?id=727368
        'title': GObject.ParamSpec.string('title', 'override', 'override',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            '')
    },

    // for debugging test results
    toString: function () {
        return '[Mock item model: "' + this.title + '"]';
    }
});

describe('History model', function () {
    let model, notify;

    let SOUR_CREAM = { title: 'Sour Cream '};
    let POTATOES = { title: 'Potatoes' };
    let CHIVES = { title: 'Chives' };
    let BUTTER = { title: 'Butter' };
    let BACON = { title: 'Bacon' };
    let SALT = { title: 'Salt' };
    let ANY = jasmine.any(Object);

    beforeEach(function () {
        model = new EosKnowledge.HistoryModel();

        notify = jasmine.createSpy('notify');
        model.connect('notify', function (object, pspec) {
            notify(pspec.name, object[pspec.name]);
        });
    });

    it('navigates to a page', function () {
        model.current_item = new MockItemModel(POTATOES);
        expect(model.current_item).toEqual(jasmine.objectContaining(POTATOES));
    });

    it('notifies when navigating to a page from empty', function () {
        model.current_item = new MockItemModel(SOUR_CREAM);

        expect(notify).toHaveBeenCalledWith('current-item',
            jasmine.objectContaining(SOUR_CREAM));
        expect(notify).not.toHaveBeenCalledWith('can-go-back', ANY);
        expect(notify).not.toHaveBeenCalledWith('can-go-forward', ANY);
        expect(notify).not.toHaveBeenCalledWith('back-list', ANY);
        expect(notify).not.toHaveBeenCalledWith('forward-list', ANY);
    });

    it('notifies when navigating to a page from another page', function () {
        model.current_item = new MockItemModel(SOUR_CREAM);
        notify.calls.reset();
        model.current_item = new MockItemModel(POTATOES);

        expect(notify).toHaveBeenCalledWith('current-item',
            jasmine.objectContaining(POTATOES));
        expect(notify).toHaveBeenCalledWith('can-go-back', true);
        expect(notify).not.toHaveBeenCalledWith('can-go-forward', ANY);
        expect(notify).toHaveBeenCalledWith('back-list', [
            jasmine.objectContaining(SOUR_CREAM)
        ]);
        expect(notify).not.toHaveBeenCalledWith('forward-list', ANY);
    });

    describe('with items', function () {
        beforeEach(function () {
            // Populate model
            [SOUR_CREAM, POTATOES, CHIVES, BUTTER, BACON].forEach(function (item) {
                model.current_item = new MockItemModel(item);
            });
            // Go back to the middle
            model.current_item = model.get_item(-2);
            notify.calls.reset();
        });

        it('has the correct state', function () {
            expect(model.current_item).toEqual(jasmine.objectContaining(CHIVES));
            expect(model.back_list).toEqual([
                jasmine.objectContaining(POTATOES),
                jasmine.objectContaining(SOUR_CREAM)
            ]);
            expect(model.forward_list).toEqual([
                jasmine.objectContaining(BUTTER),
                jasmine.objectContaining(BACON)
            ]);
        });

        it('clears to an empty state', function () {
            model.clear();

            expect(model.current_item).toBeNull();
            expect(model.back_list).toEqual([]);
            expect(model.forward_list).toEqual([]);
        });

        it('notifies when clearing', function () {
            model.clear();

            expect(notify).toHaveBeenCalledWith('current-item', null);
            expect(notify).toHaveBeenCalledWith('can-go-back', false);
            expect(notify).toHaveBeenCalledWith('can-go-forward', false);
            expect(notify).toHaveBeenCalledWith('back-list', []);
            expect(notify).toHaveBeenCalledWith('forward-list', []);
        });

        it('does not notify when clearing from empty state', function () {
            model.clear();
            notify.calls.reset();
            model.clear();

            expect(notify).not.toHaveBeenCalled();
        });

        it('navigates to the correct state', function () {
            model.current_item = new MockItemModel(SALT);

            expect(model.current_item).toEqual(jasmine.objectContaining(SALT));
            expect(model.back_list).toEqual([
                jasmine.objectContaining(CHIVES),
                jasmine.objectContaining(POTATOES),
                jasmine.objectContaining(SOUR_CREAM)
            ]);
            expect(model.forward_list).toEqual([]);
        });

        it('notifies when navigating', function () {
            model.current_item = new MockItemModel(SALT);

            expect(notify).toHaveBeenCalledWith('current-item', ANY);
            expect(notify).not.toHaveBeenCalledWith('can-go-back', ANY);
            expect(notify).toHaveBeenCalledWith('can-go-forward', false);
            expect(notify).toHaveBeenCalledWith('back-list', ANY);
            expect(notify).toHaveBeenCalledWith('forward-list', ANY);
        });

        it('navigates backwards to the correct state', function () {
            model.go_back();

            expect(model.current_item).toEqual(jasmine.objectContaining(POTATOES));
            expect(model.back_list).toEqual([
                jasmine.objectContaining(SOUR_CREAM)
            ]);
            expect(model.forward_list).toEqual([
                jasmine.objectContaining(CHIVES),
                jasmine.objectContaining(BUTTER),
                jasmine.objectContaining(BACON)
            ]);
        });

        it('notifies when navigating backwards', function () {
            model.go_back();

            // In all the notify tests, the values of the current-item,
            // back-list and forward-list properties have already been checked
            // in the corresponding functionality test
            expect(notify).toHaveBeenCalledWith('current-item', ANY);
            expect(notify).not.toHaveBeenCalledWith('can-go-back', ANY);
            expect(notify).not.toHaveBeenCalledWith('can-go-forward', ANY);
            expect(notify).toHaveBeenCalledWith('back-list', ANY);
            expect(notify).toHaveBeenCalledWith('forward-list', ANY);
        });

        it('navigates forwards to the correct state', function () {
            model.go_forward();
            expect(model.current_item).toEqual(jasmine.objectContaining(BUTTER));
            expect(model.back_list).toEqual([
                jasmine.objectContaining(CHIVES),
                jasmine.objectContaining(POTATOES),
                jasmine.objectContaining(SOUR_CREAM)
            ]);
            expect(model.forward_list).toEqual([
                jasmine.objectContaining(BACON)
            ]);
        });

        it('notifies when navigating forwards', function () {
            model.go_forward();

            expect(notify).toHaveBeenCalledWith('current-item', ANY);
            expect(notify).not.toHaveBeenCalledWith('can-go-back', ANY);
            expect(notify).not.toHaveBeenCalledWith('can-go-forward', ANY);
            expect(notify).toHaveBeenCalledWith('back-list', ANY);
            expect(notify).toHaveBeenCalledWith('forward-list', ANY);
        });

        it('jumps to what is already the current item', function () {
            let current_item = model.current_item;
            let back_list = model.back_list;
            let forward_list = model.forward_list;

            model.current_item = model.get_item(0);

            expect(model.current_item).toEqual(current_item);
            expect(model.back_list).toEqual(back_list);
            expect(model.forward_list).toEqual(forward_list);
        });

        it('does not notify when jumping to the current item', function () {
            // use the C setter function here, because GJS throws in an extra
            // 'notify' for good measure when you use the property setter.
            model.set_current_item(model.get_item(0));
            expect(notify).not.toHaveBeenCalled();
        });

        it('jumps backwards one step to the correct state', function () {
            model.current_item = model.get_item(-1);

            expect(model.current_item).toEqual(jasmine.objectContaining(POTATOES));
            expect(model.back_list).toEqual([
                jasmine.objectContaining(SOUR_CREAM)
            ]);
            expect(model.forward_list).toEqual([
                jasmine.objectContaining(CHIVES),
                jasmine.objectContaining(BUTTER),
                jasmine.objectContaining(BACON)
            ]);
        });

        it('notifies when jumping backwards one step', function () {
            model.current_item = model.get_item(-1);

            expect(notify).toHaveBeenCalledWith('current-item', ANY);
            expect(notify).not.toHaveBeenCalledWith('can-go-back', ANY);
            expect(notify).not.toHaveBeenCalledWith('can-go-forward', ANY);
            expect(notify).toHaveBeenCalledWith('back-list', ANY);
            expect(notify).toHaveBeenCalledWith('forward-list', ANY);
        });

        it('jumps backwards more than one step to the correct state', function () {
            model.current_item = model.get_item(-2);

            expect(model.current_item).toEqual(jasmine.objectContaining(SOUR_CREAM));
            expect(model.back_list).toEqual([]);
            expect(model.forward_list).toEqual([
                jasmine.objectContaining(POTATOES),
                jasmine.objectContaining(CHIVES),
                jasmine.objectContaining(BUTTER),
                jasmine.objectContaining(BACON)
            ]);
        });

        it('notifies when jumping backwards more than one step', function () {
            model.current_item = model.get_item(-2);

            expect(notify).toHaveBeenCalledWith('current-item', ANY);
            expect(notify).toHaveBeenCalledWith('back-list', ANY);
            expect(notify).toHaveBeenCalledWith('forward-list', ANY);
        });

        it('jumps forwards one step to the correct state', function () {
            model.current_item = model.get_item(+1);

            expect(model.current_item).toEqual(jasmine.objectContaining(BUTTER));
            expect(model.back_list).toEqual([
                jasmine.objectContaining(CHIVES),
                jasmine.objectContaining(POTATOES),
                jasmine.objectContaining(SOUR_CREAM)
            ]);
            expect(model.forward_list).toEqual([
                jasmine.objectContaining(BACON)
            ]);
        });

        it('notifies when jumping forwards one step', function () {
            model.current_item = model.get_item(+1);

            expect(notify).toHaveBeenCalledWith('current-item', ANY);
            expect(notify).not.toHaveBeenCalledWith('can-go-back', ANY);
            expect(notify).not.toHaveBeenCalledWith('can-go-forward', ANY);
            expect(notify).toHaveBeenCalledWith('back-list', ANY);
            expect(notify).toHaveBeenCalledWith('forward-list', ANY);
        });

        it('jumps forwards more than one step to the correct state', function () {
            model.current_item = model.get_item(+2);

            expect(model.current_item).toEqual(jasmine.objectContaining(BACON));
            expect(model.back_list).toEqual([
                jasmine.objectContaining(BUTTER),
                jasmine.objectContaining(CHIVES),
                jasmine.objectContaining(POTATOES),
                jasmine.objectContaining(SOUR_CREAM)
            ]);
            expect(model.forward_list).toEqual([]);
        });

        it('notifies when jumping forwards more than one step', function () {
            model.current_item = model.get_item(+2);

            expect(notify).toHaveBeenCalledWith('current-item', ANY);
            expect(notify).toHaveBeenCalledWith('back-list', ANY);
            expect(notify).toHaveBeenCalledWith('forward-list', ANY);
        });

        it('notifies when navigating backwards from the most recent', function () {
            model.current_item = model.get_item(+2);
            notify.calls.reset();
            model.go_back();

            expect(notify).not.toHaveBeenCalledWith('can-go-back', ANY);
            expect(notify).toHaveBeenCalledWith('can-go-forward', true);
        });

        it('notifies when navigating backwards to the earliest', function () {
            model.current_item = model.get_item(-2);

            expect(notify).toHaveBeenCalledWith('can-go-back', false);
            expect(notify).not.toHaveBeenCalledWith('can-go-forward', ANY);
        });

        it('notifies when navigating forwards to the most recent', function () {
            model.current_item = model.get_item(+2);

            expect(notify).not.toHaveBeenCalledWith('can-go-back', ANY);
            expect(notify).toHaveBeenCalledWith('can-go-forward', false);
        });

        it('notifies when navigating forwards from the earliest', function () {
            model.current_item = model.get_item(-2);
            notify.calls.reset();
            model.go_forward();

            expect(notify).toHaveBeenCalledWith('can-go-back', true);
            expect(notify).not.toHaveBeenCalledWith('can-go-forward', ANY);
        });

        it('gracefully handles requesting an index that is too low', function () {
            expect(model.get_item(-5)).toBeNull();
        });

        it('gracefully handles requesting an index that is too high', function () {
            expect(model.get_item(+5)).toBeNull();
        });
    });
});
