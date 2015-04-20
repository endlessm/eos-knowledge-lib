const EosKnowledgeSearch = imports.EosKnowledgeSearch;

describe('QueryObject', function () {
    it('sets tags and ids objects properly', function () {
        let ids = ['ekn://busters-es/0123456789012345',
                   'ekn://busters-es/fabaffacabacbafa'];
        let tags = ['Venkman', 'Stantz'];
        let query_obj = new EosKnowledgeSearch.QueryObject({
            ids: ids,
            tags: tags,
        });
        expect(ids).toEqual(query_obj.ids);
        expect(tags).toEqual(query_obj.tags);
    });

    describe('new_from_object constructor', function () {
        it('duplicates properties from source object', function () {
            let tags = ['Venkman', 'Stantz'];
            let query = 'keymaster';
            let query_obj = new EosKnowledgeSearch.QueryObject({
                tags: tags,
                query: query,
            });
            let query_obj_copy = EosKnowledgeSearch.QueryObject.new_from_object(query_obj);
            expect(query_obj_copy.tags).toEqual(tags);
            expect(query_obj_copy.query).toEqual(query);
        });

        it('allows properties to be overridden', function () {
            let tags = ['Venkman', 'Stantz'];
            let query = 'keymaster';
            let query_obj = new EosKnowledgeSearch.QueryObject({
                tags: tags,
                query: query,
            });
            let new_query = 'gatekeeper';
            let new_query_object = EosKnowledgeSearch.QueryObject.new_from_object(query_obj, {
                query: new_query
            });
            expect(new_query_object.tags).toEqual(tags);
            expect(new_query_object.query).toEqual(new_query);
        });
    });
});
