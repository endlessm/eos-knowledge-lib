const {DModel} = imports.gi;

const HistoryItem = imports.app.historyItem;
const Pages = imports.app.pages;

describe('History Item', function () {
    describe('equals method', function () {
        it('detects equivalent items', function () {
            let item1 = new HistoryItem.HistoryItem({
                page_type: 'foo',
                search_terms: 'bar',
            });
            let item2 = new HistoryItem.HistoryItem({
                page_type: 'foo',
                search_terms: 'bar',
            });
            expect(item1.equals(item2)).toBeTruthy();
            item1 = new HistoryItem.HistoryItem({
                page_type: 'foo',
                search_terms: 'bar',
            });
            item2 = new HistoryItem.HistoryItem({
                page_type: 'foo',
                search_terms: 'not bar',
            });
            expect(item1.equals(item2)).toBeFalsy();
        });

        it('checks IDs on models', function () {
            let item1 = new HistoryItem.HistoryItem({
                page_type: 'foo',
                model: new DModel.Content({
                    id: 'ekn://aaaaaaaaaaaaaaaa',
                }),
            });
            let item2 = new HistoryItem.HistoryItem({
                page_type: 'foo',
                model: new DModel.Content({
                    id: 'ekn://aaaaaaaaaaaaaaaa',
                }),
            });
            expect(item1.equals(item2)).toBeTruthy();
            item2 = new HistoryItem.HistoryItem({
                page_type: 'foo',
                model: new DModel.Content(),
            });
            expect(item1.equals(item2)).toBeFalsy();
        });
    });

    it('new_from_object duplicates all property values', function () {
        let item1 = new HistoryItem.HistoryItem({
            page_type: 'foo',
            search_terms: 'bar',
            model: new DModel.Content(),
        });
        let item2 = new HistoryItem.HistoryItem.new_from_object(item1);
        expect(item1).not.toBe(item2);
        expect(item1.equals(item2)).toBeTruthy();
    });


    it('determines whether it can be shared', function () {
        let item1 = new HistoryItem.HistoryItem({
            page_type: Pages.ARTICLE,
            model: new DModel.Article({
                title: 'Endless OS',
            }),
        });
        expect(item1.can_share).toBeFalsy();

        let item2 = new HistoryItem.HistoryItem({
            page_type: Pages.ARTICLE,
            model: new DModel.Article({
                title: 'Endless OS',
                original_uri: 'http://endlessm.com',
            }),
        });
        expect(item2.can_share).toBeTruthy();
    });
});
