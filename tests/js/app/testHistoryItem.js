const Eknc = imports.gi.EosKnowledgeContent;

const HistoryItem = imports.app.historyItem;
const Pages = imports.app.pages;

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
            item1 = new HistoryItem.HistoryItem({
                page_type: 'foo',
                query: 'bar',
            });
            item2 = new HistoryItem.HistoryItem({
                page_type: 'foo',
                query: 'not bar',
            });
            expect(item1.equals(item2)).toBeFalsy();
        });

        it('checks ekn ids on models', function () {
            let item1 = new HistoryItem.HistoryItem({
                page_type: 'foo',
                model: Eknc.ContentObjectModel.new_from_props({
                    ekn_id: 'ekn://aaaaaaaaaaaaaaaa',
                }),
            });
            let item2 = new HistoryItem.HistoryItem({
                page_type: 'foo',
                model: Eknc.ContentObjectModel.new_from_props({
                    ekn_id: 'ekn://aaaaaaaaaaaaaaaa',
                }),
            });
            expect(item1.equals(item2)).toBeTruthy();
            item2 = new HistoryItem.HistoryItem({
                page_type: 'foo',
                model: Eknc.ContentObjectModel.new_from_props({
                    ekn_id: 'ekn://bbbbbbbbbbbbbbbb',
                }),
            });
            expect(item1.equals(item2)).toBeFalsy();
        });
    });

    it('new_from_object duplicates all property values', function () {
        let item1 = new HistoryItem.HistoryItem({
            page_type: 'foo',
            query: 'bar',
            model: Eknc.ContentObjectModel.new_from_props({
                ekn_id: 'ekn://aaaaaaaaaaaaaaaa',
            }),
        });
        let item2 = new HistoryItem.HistoryItem.new_from_object(item1);
        expect(item1).not.toBe(item2);
        expect(item1.equals(item2)).toBeTruthy();
    });


    it('determines whether it can be shared', function () {
        let item1 = new HistoryItem.HistoryItem({
            page_type: Pages.ARTICLE,
            model: Eknc.ArticleObjectModel.new_from_props({
                title: 'Endless OS',
                ekn_id: 'ekn:///043fd69fe153ac69a05000b60bfea9cff110f14c',
            }),
        });
        expect(item1.can_share).toBeFalsy();

        let item2 = new HistoryItem.HistoryItem({
            page_type: Pages.ARTICLE,
            model: Eknc.ArticleObjectModel.new_from_props({
                title: 'Endless OS',
                ekn_id: 'ekn:///043fd69fe153ac69a06000b60bfea9cff110f14e',
                original_uri: 'http://endlessm.com',
            }),
        });
        expect(item2.can_share).toBeTruthy();
    });
});
