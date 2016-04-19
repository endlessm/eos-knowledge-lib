// Copyright 2014 Endless Mobile, Inc.

const GObject = imports.gi.GObject;
const Lang = imports.lang;

const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;

const MockItemModel = new Lang.Class({
    Name: 'MockItemModel',
    GTypeName: 'testHistoryModel_MockItemModel',
    Extends: GObject.Object,
    Implements: [ EosKnowledgePrivate.HistoryItemModel ],
    Properties: {
        'title': GObject.ParamSpec.override('title',
            EosKnowledgePrivate.HistoryItemModel),
    },

    get title() {
        return this._title;
    },

    set title(value) {
        this._title = value;
    },

    // for debugging test results
    toString: function () {
        return '[Mock item model: "' + this.title + '"]';
    }
});

describe('History model', function () {
    let model, notify;

    beforeEach(function () {
        model = new EosKnowledgePrivate.HistoryModel();

        notify = jasmine.createSpy('notify');
        model.connect('notify', function (object, pspec) {
            notify(pspec.name);
        });
    });

    it('navigates to a page', function () {
        model.current_item = new MockItemModel({ title: 'Potatoes' });
        expect(model.current_item.title).toEqual('Potatoes');
    });

    it('notifies when navigating to a page from empty', function () {
        model.current_item = new MockItemModel({ title: 'Sour Cream' });

        expect(notify).toHaveBeenCalledWith('current-item');
        expect(model.current_item.title).toEqual('Sour Cream');
        expect(notify).not.toHaveBeenCalledWith('can-go-back');
        expect(notify).not.toHaveBeenCalledWith('can-go-forward');
        expect(notify).not.toHaveBeenCalledWith('back-list');
        expect(notify).not.toHaveBeenCalledWith('forward-list');
    });

    it('notifies when navigating to a page from another page', function () {
        model.current_item = new MockItemModel({ title: 'Sour Cream' });
        notify.calls.reset();
        model.current_item = new MockItemModel({ title: 'Potatoes' });

        expect(notify).toHaveBeenCalledWith('current-item');
        expect(model.current_item.title).toEqual('Potatoes');
        expect(notify).toHaveBeenCalledWith('can-go-back');
        expect(model.can_go_back).toBe(true);
        expect(notify).not.toHaveBeenCalledWith('can-go-forward');
        expect(model.can_go_forward).toBe(false);
        expect(notify).toHaveBeenCalledWith('back-list');
        expect(model.get_back_list().map(item => item.title))
            .toEqual(['Sour Cream']);
        expect(notify).not.toHaveBeenCalledWith('forward-list');
    });

    describe('with items', function () {
        beforeEach(function () {
            // Populate model
            ['Sour Cream', 'Potatoes', 'Chives', 'Butter', 'Bacon'].forEach(item => {
                model.current_item = new MockItemModel({ title: item });
            });
            // Go back to the middle
            model.current_item = model.get_item(-2);
            notify.calls.reset();
        });

        it('has the correct state', function () {
            expect(model.current_item.title).toEqual('Chives');
            expect(model.get_back_list().map(item => item.title)).toEqual([
                'Potatoes',
                'Sour Cream',
            ]);
            expect(model.get_forward_list().map(item => item.title)).toEqual([
                'Butter',
                'Bacon',
            ]);
        });

        it('clears to an empty state', function () {
            model.clear();

            expect(model.current_item).toBeNull();
            expect(model.get_back_list()).toEqual([]);
            expect(model.get_forward_list()).toEqual([]);
        });

        it('notifies when clearing', function () {
            model.clear();

            expect(notify).toHaveBeenCalledWith('current-item');
            expect(model.current_item).toBeNull();
            expect(notify).toHaveBeenCalledWith('can-go-back');
            expect(model.can_go_back).toBe(false);
            expect(notify).toHaveBeenCalledWith('can-go-forward');
            expect(model.can_go_forward).toBe(false);
            expect(notify).toHaveBeenCalledWith('back-list');
            expect(model.get_back_list()).toEqual([]);
            expect(notify).toHaveBeenCalledWith('forward-list');
            expect(model.get_forward_list()).toEqual([]);
        });

        it('does not notify when clearing from empty state', function () {
            model.clear();
            notify.calls.reset();
            model.clear();

            expect(notify).not.toHaveBeenCalled();
        });

        it('navigates to the correct state', function () {
            model.current_item = new MockItemModel({ title: 'Salt' });

            expect(model.current_item.title).toEqual('Salt');
            expect(model.get_back_list().map(item => item.title)).toEqual([
                'Chives',
                'Potatoes',
                'Sour Cream',
            ]);
            expect(model.get_forward_list()).toEqual([]);
        });

        it('notifies when navigating', function () {
            model.current_item = new MockItemModel({ title: 'Salt' });

            expect(notify).toHaveBeenCalledWith('current-item');
            expect(notify).not.toHaveBeenCalledWith('can-go-back');
            expect(notify).toHaveBeenCalledWith('can-go-forward');
            expect(model.can_go_forward).toBe(false);
            expect(notify).toHaveBeenCalledWith('back-list');
            expect(notify).toHaveBeenCalledWith('forward-list');
        });

        it('navigates backwards to the correct state', function () {
            model.go_back();

            expect(model.current_item.title).toEqual('Potatoes');
            expect(model.get_back_list().map(item => item.title))
                .toEqual(['Sour Cream']);
            expect(model.get_forward_list().map(item => item.title)).toEqual([
                'Chives',
                'Butter',
                'Bacon',
            ]);
        });

        it('notifies when navigating backwards', function () {
            model.go_back();

            // In all the notify tests, the values of the current-item,
            // back-list and forward-list properties have already been checked
            // in the corresponding functionality test
            expect(notify).toHaveBeenCalledWith('current-item');
            expect(notify).not.toHaveBeenCalledWith('can-go-back');
            expect(notify).not.toHaveBeenCalledWith('can-go-forward');
            expect(notify).toHaveBeenCalledWith('back-list');
            expect(notify).toHaveBeenCalledWith('forward-list');
        });

        it('ignores go_back when at beginning of history', function () {
            model.current_item = model.get_item(-2);
            expect(model.current_item.title).toEqual('Sour Cream');
            notify.calls.reset();
            model.go_back();
            expect(model.current_item.title).toEqual('Sour Cream');
            expect(notify).not.toHaveBeenCalledWith('current-item');
        });

        it('navigates forwards to the correct state', function () {
            model.go_forward();
            expect(model.current_item.title).toEqual('Butter');
            expect(model.get_back_list().map(item => item.title)).toEqual([
                'Chives',
                'Potatoes',
                'Sour Cream',
            ]);
            expect(model.get_forward_list().map(item => item.title))
                .toEqual(['Bacon']);
        });

        it('notifies when navigating forwards', function () {
            model.go_forward();

            expect(notify).toHaveBeenCalledWith('current-item');
            expect(notify).not.toHaveBeenCalledWith('can-go-back');
            expect(notify).not.toHaveBeenCalledWith('can-go-forward');
            expect(notify).toHaveBeenCalledWith('back-list');
            expect(notify).toHaveBeenCalledWith('forward-list');
        });

        it('ignores go_forward when at the end of history', function () {
            model.current_item = model.get_item(2);
            expect(model.current_item.title).toEqual('Bacon');
            notify.calls.reset();
            model.go_forward();
            expect(model.current_item.title).toEqual('Bacon');
            expect(notify).not.toHaveBeenCalledWith('current-item');
        });

        it('jumps to what is already the current item', function () {
            let current_item = model.current_item;
            let back_list = model.get_back_list();
            let forward_list = model.get_forward_list();

            model.current_item = model.get_item(0);

            expect(model.current_item).toEqual(current_item);
            expect(model.get_back_list()).toEqual(back_list);
            expect(model.get_forward_list()).toEqual(forward_list);
        });

        it('does not notify when jumping to the current item', function () {
            // use the C setter function here, because GJS throws in an extra
            // 'notify' for good measure when you use the property setter.
            model.set_current_item(model.get_item(0));
            expect(notify).not.toHaveBeenCalled();
        });

        it('jumps backwards one step to the correct state', function () {
            model.current_item = model.get_item(-1);

            expect(model.current_item.title).toEqual('Potatoes');
            expect(model.get_back_list().map(item => item.title))
                .toEqual(['Sour Cream']);
            expect(model.get_forward_list().map(item => item.title)).toEqual([
                'Chives',
                'Butter',
                'Bacon',
            ]);
        });

        it('notifies when jumping backwards one step', function () {
            model.current_item = model.get_item(-1);

            expect(notify).toHaveBeenCalledWith('current-item');
            expect(notify).not.toHaveBeenCalledWith('can-go-back');
            expect(notify).not.toHaveBeenCalledWith('can-go-forward');
            expect(notify).toHaveBeenCalledWith('back-list');
            expect(notify).toHaveBeenCalledWith('forward-list');
        });

        it('jumps backwards more than one step to the correct state', function () {
            model.current_item = model.get_item(-2);

            expect(model.current_item.title).toEqual('Sour Cream');
            expect(model.get_back_list()).toEqual([]);
            expect(model.get_forward_list().map(item => item.title)).toEqual([
                'Potatoes',
                'Chives',
                'Butter',
                'Bacon',
            ]);
        });

        it('notifies when jumping backwards more than one step', function () {
            model.current_item = model.get_item(-2);

            expect(notify).toHaveBeenCalledWith('current-item');
            expect(notify).toHaveBeenCalledWith('back-list');
            expect(notify).toHaveBeenCalledWith('forward-list');
        });

        it('jumps forwards one step to the correct state', function () {
            model.current_item = model.get_item(+1);

            expect(model.current_item.title).toEqual('Butter');
            expect(model.get_back_list().map(item => item.title)).toEqual([
                'Chives',
                'Potatoes',
                'Sour Cream',
            ]);
            expect(model.get_forward_list().map(item => item.title))
                .toEqual(['Bacon']);
        });

        it('notifies when jumping forwards one step', function () {
            model.current_item = model.get_item(+1);

            expect(notify).toHaveBeenCalledWith('current-item');
            expect(notify).not.toHaveBeenCalledWith('can-go-back');
            expect(notify).not.toHaveBeenCalledWith('can-go-forward');
            expect(notify).toHaveBeenCalledWith('back-list');
            expect(notify).toHaveBeenCalledWith('forward-list');
        });

        it('jumps forwards more than one step to the correct state', function () {
            model.current_item = model.get_item(+2);

            expect(model.current_item.title).toEqual('Bacon');
            expect(model.get_back_list().map(item => item.title)).toEqual([
                'Butter',
                'Chives',
                'Potatoes',
                'Sour Cream',
            ]);
            expect(model.get_forward_list()).toEqual([]);
        });

        it('notifies when jumping forwards more than one step', function () {
            model.current_item = model.get_item(+2);

            expect(notify).toHaveBeenCalledWith('current-item');
            expect(notify).toHaveBeenCalledWith('back-list');
            expect(notify).toHaveBeenCalledWith('forward-list');
        });

        it('notifies when navigating backwards from the most recent', function () {
            model.current_item = model.get_item(+2);
            notify.calls.reset();
            model.go_back();

            expect(notify).not.toHaveBeenCalledWith('can-go-back');
            expect(notify).toHaveBeenCalledWith('can-go-forward');
            expect(model.can_go_forward).toBe(true);
        });

        it('notifies when navigating backwards to the earliest', function () {
            model.current_item = model.get_item(-2);

            expect(notify).toHaveBeenCalledWith('can-go-back');
            expect(model.can_go_back).toBe(false);
            expect(notify).not.toHaveBeenCalledWith('can-go-forward');
        });

        it('notifies when navigating forwards to the most recent', function () {
            model.current_item = model.get_item(+2);

            expect(notify).not.toHaveBeenCalledWith('can-go-back');
            expect(notify).toHaveBeenCalledWith('can-go-forward');
            expect(model.can_go_forward).toBe(false);
        });

        it('notifies when navigating forwards from the earliest', function () {
            model.current_item = model.get_item(-2);
            notify.calls.reset();
            model.go_forward();

            expect(notify).toHaveBeenCalledWith('can-go-back');
            expect(model.can_go_back).toBe(true);
            expect(notify).not.toHaveBeenCalledWith('can-go-forward');
        });

        it('gracefully handles requesting an index that is too low', function () {
            expect(model.get_item(-5)).toBeNull();
        });

        it('gracefully handles requesting an index that is too high', function () {
            expect(model.get_item(+5)).toBeNull();
        });
    });
});
