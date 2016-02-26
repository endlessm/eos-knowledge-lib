// Copyright 2016 Endless Mobile, Inc.

const GObject = imports.gi.GObject;
const Lang = imports.lang;

const ContentObjectModel = imports.search.contentObjectModel;
const UnreadFilter = imports.app.modules.unreadFilter;
const MockReadingHistoryModel = imports.tests.mockReadingHistoryModel;

describe('Unread filter', function () {
    let filter, history_model, models;

    const IDS = ['read', 'unread'];

    beforeEach(function () {
        models = IDS.map(ekn_id =>
            new ContentObjectModel.ContentObjectModel({
                ekn_id: ekn_id,
            }));
        history_model = MockReadingHistoryModel.mock_default();
        history_model.mark_article_read('read');
    });

    describe('normal mode', function () {
        beforeEach(function () {
            filter = new UnreadFilter.UnreadFilter();
        });

        it('is the default', function () {
            expect(filter.invert).toBeFalsy();
        });

        it('filters out a read card', function () {
            expect(filter.include(models[0])).toBeFalsy();
            expect(filter.include(models[1])).toBeTruthy();
        });
    });

    describe('inverse mode', function () {
        beforeEach(function () {
            filter = new UnreadFilter.UnreadFilter({
                invert: true,
            });
        });

        it('filters out an unread card', function () {
            expect(filter.include(models[0])).toBeTruthy();
            expect(filter.include(models[1])).toBeFalsy();
        });
    });
});
