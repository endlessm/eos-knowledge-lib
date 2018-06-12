// Copyright 2016 Endless Mobile, Inc.

const Gio = imports.gi.Gio;

const ReadingHistoryModel = imports.framework.readingHistoryModel;

describe('Reading History Model', function () {
    let model, reading_history_file;

    beforeEach(function () {
        reading_history_file = Gio.File.new_tmp(null)[0];
        reading_history_file.replace_contents('[]', null, false, 0, null);
    });

    describe('constructor', function () {
        it('correctly loads reading history from file', function () {
            let data = [
                '100',
                '200',
                '300',
                '400',
            ];
            reading_history_file.replace_contents(JSON.stringify(data), null, false, 0, null);
            model = new ReadingHistoryModel.ReadingHistoryModel({
                history_file: reading_history_file,
            });
            expect(model.get_read_articles().size).toBe(4);
        });

        it('gracefully handles a settings file that is not JSON', function () {
            spyOn(window, 'logError'); // silence console output
            reading_history_file.replace_contents("This is not JSON", null, false, 0, null);

            model = new ReadingHistoryModel.ReadingHistoryModel({
                history_file: reading_history_file,
            });
            expect(model.get_read_articles().size).toBe(0);
            expect(logError).toHaveBeenCalled();
        });

        it('gracefully handles case where settings file does not exist', function () {
            model = new ReadingHistoryModel.ReadingHistoryModel({
                history_file: Gio.File.new_for_path('nothing/here'),
            });
            expect(model.get_read_articles().size).toBe(0);
        });
    });

    describe('reading history', function () {
        beforeEach(function () {
            model = new ReadingHistoryModel.ReadingHistoryModel({
                history_file: reading_history_file,
            });
        });

        it('marks an article as read', function () {
            let read_article_id = 'ekn://foo';
            model.mark_article_read(read_article_id);
            expect(model.is_read_article(read_article_id)).toBe(true);
        });

        it('does not mark an article as read if it has not', function () {
            let read_article_id = 'ekn://foo';
            let unread_article_id = 'ekn://bar';
            model.mark_article_read(read_article_id);
            expect(model.is_read_article(unread_article_id)).toBe(false);
        });
    });
});
