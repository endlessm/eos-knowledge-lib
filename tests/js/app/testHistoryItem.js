const ContentObjectModel = imports.search.contentObjectModel;
const HistoryItem = imports.app.historyItem;

describe('History Item', function () {
    describe('equals method', function () {
        it('detects equivalent items', function () {
            let item1 = new HistoryItem.HistoryItem({
                page_type: 'foo',
                query: 'bar',
            });
            let item2 = new HistoryItem.HistoryItem({
                page_type: 'foo',
                query: 'bar',
            });
            expect(item1.equals(item2)).toBeTruthy();
            let item1 = new HistoryItem.HistoryItem({
                page_type: 'foo',
                query: 'bar',
            });
            let item2 = new HistoryItem.HistoryItem({
                page_type: 'foo',
                query: 'not bar',
            });
            expect(item1.equals(item2)).toBeFalsy();
        });

        it('checks ekn ids on models', function () {
            let item1 = new HistoryItem.HistoryItem({
                page_type: 'foo',
                model: new ContentObjectModel.ContentObjectModel({
                    ekn_id: 'ekn://aaaaaaaaaaaaaaaa',
                }),
            });
            let item2 = new HistoryItem.HistoryItem({
                page_type: 'foo',
                model: new ContentObjectModel.ContentObjectModel({
                    ekn_id: 'ekn://aaaaaaaaaaaaaaaa',
                }),
            });
            expect(item1.equals(item2)).toBeTruthy();
            item2 = new HistoryItem.HistoryItem({
                page_type: 'foo',
                model: new ContentObjectModel.ContentObjectModel({
                    ekn_id: 'ekn://bbbbbbbbbbbbbbbb',
                }),
            });
            expect(item1.equals(item2)).toBeFalsy();
        });

        it('ignores the empty property', function () {
            // Since empty is mutable and not set at first, we need to ignore when
            // checking sameness
            let item1 = new HistoryItem.HistoryItem({
                page_type: 'foo',
                query: 'bar',
                empty: true,
            });
            let item2 = new HistoryItem.HistoryItem({
                page_type: 'foo',
                query: 'bar',
                empty: false,
            });
            expect(item1.equals(item2)).toBeTruthy();
        });
    });

    it('new_from_object duplicates all property values', function () {
        let item1 = new HistoryItem.HistoryItem({
            page_type: 'foo',
            query: 'bar',
            model: new ContentObjectModel.ContentObjectModel({
                ekn_id: 'ekn://aaaaaaaaaaaaaaaa',
            }),
            empty: true,
        });
        let item2 = new HistoryItem.HistoryItem.new_from_object(item1);
        expect(item1).not.toBe(item2);
        expect(item1.equals(item2)).toBeTruthy();
    });
});
